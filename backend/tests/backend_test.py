"""VoiceLocal backend API tests."""
import os
import uuid
import base64
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://localize-video-1.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@voicelocal.app"
DEMO_PASSWORD = "demo123"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def demo_token(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


# ------- Languages -------
def test_languages(s):
    r = s.get(f"{API}/languages")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 23
    codes = {l["code"] for l in data}
    for c in ["en", "hi", "bn", "ta", "te", "mr", "ml", "kn", "sat", "brx"]:
        assert c in codes


# ------- Auth -------
def test_register_and_me(s):
    email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={"name": "TEST User", "email": email, "password": "secret123"})
    assert r.status_code == 200, r.text
    j = r.json()
    assert "token" in j and j["user"]["email"] == email.lower()

    me = s.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {j['token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == email.lower()


def test_login_demo(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_invalid(s):
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrongpassword"})
    assert r.status_code == 401
    assert "detail" in r.json()


def test_me_no_token(s):
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ------- Translation (REAL LLM) -------
def test_translate_hi_to_bn(s):
    payload = {
        "text": "नमस्ते, यह इसरो का चंद्रयान मिशन है।",
        "source_language": "hi",
        "target_language": "bn",
    }
    r = s.post(f"{API}/localize/translate", json=payload, timeout=90)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "translated_text" in j
    text = j["translated_text"]
    assert len(text) > 0
    # Bengali script codepoints 0x0980-0x09FF
    assert any('\u0980' <= ch <= '\u09FF' for ch in text), f"Expected Bengali script, got: {text}"


# ------- TTS (REAL) -------
def test_tts_bengali(s):
    payload = {"text": "নমস্কার, এটি একটি পরীক্ষা।", "voice": "female", "language": "bn"}
    r = s.post(f"{API}/localize/tts", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "audio_base64" in j and len(j["audio_base64"]) > 500
    # Should be valid base64
    base64.b64decode(j["audio_base64"][:100] + "==")


# ------- Projects -------
def test_projects_crud_and_isolation(s, demo_token):
    h = {"Authorization": f"Bearer {demo_token}"}
    body = {
        "title": f"TEST Project {uuid.uuid4().hex[:6]}",
        "source_language": "hi",
        "target_languages": ["bn", "ta"],
        "duration": "00:42",
    }
    r = s.post(f"{API}/projects", json=body, headers=h)
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    assert "_id" not in r.json()

    # list
    r = s.get(f"{API}/projects", headers=h)
    assert r.status_code == 200
    ids = [p["id"] for p in r.json()]
    assert pid in ids

    # get single
    r = s.get(f"{API}/projects/{pid}", headers=h)
    assert r.status_code == 200
    assert r.json()["title"] == body["title"]

    # user isolation: create a fresh user, ensure they don't see demo's project
    email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    reg = s.post(f"{API}/auth/register", json={"name": "Iso", "email": email, "password": "secret123"})
    other_token = reg.json()["token"]
    r = s.get(f"{API}/projects", headers={"Authorization": f"Bearer {other_token}"})
    assert r.status_code == 200
    other_ids = [p["id"] for p in r.json()]
    assert pid not in other_ids


def test_projects_requires_auth(s):
    r = requests.get(f"{API}/projects")
    assert r.status_code == 401


# ------- Analytics -------
def test_analytics(s, demo_token):
    h = {"Authorization": f"Bearer {demo_token}"}
    r = s.get(f"{API}/analytics", headers=h)
    assert r.status_code == 200
    j = r.json()
    assert j["stats"]["videos"] == 12
    assert "languages_used" in j and len(j["languages_used"]) > 0
    assert "reach_trend" in j and "activity" in j


def test_analytics_requires_auth():
    r = requests.get(f"{API}/analytics")
    assert r.status_code == 401


# ------- New: Transcribe (REAL Whisper) -------
import subprocess, tempfile, shutil, os as _os

@pytest.fixture(scope="session")
def sample_mp4_with_speech(s):
    """Build a short mp4 with real spoken audio by calling TTS + ffmpeg."""
    tts_payload = {
        "text": "Hello, this is a short test of the VoiceLocal transcription service.",
        "voice": "female",
        "language": "en",
    }
    r = s.post(f"{API}/localize/tts", json=tts_payload, timeout=120)
    assert r.status_code == 200, r.text
    mp3_b64 = r.json()["audio_base64"]
    tmpdir = tempfile.mkdtemp(prefix="vltest_")
    mp3 = _os.path.join(tmpdir, "a.mp3")
    mp4 = _os.path.join(tmpdir, "clip.mp4")
    with open(mp3, "wb") as f:
        f.write(base64.b64decode(mp3_b64))
    cmd = ["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=black:s=320x240",
           "-i", mp3, "-c:v", "libx264", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-shortest", mp4]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)
    yield mp4
    shutil.rmtree(tmpdir, ignore_errors=True)


def test_transcribe_returns_iso_language_code(sample_mp4_with_speech):
    with open(sample_mp4_with_speech, "rb") as f:
        files = {"file": ("clip.mp4", f, "video/mp4")}
        r = requests.post(f"{API}/localize/transcribe", files=files, timeout=180)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "segments" in j and isinstance(j["segments"], list) and len(j["segments"]) >= 1
    seg = j["segments"][0]
    assert "t" in seg and "text" in seg
    assert isinstance(seg["t"], str)
    # Language must be normalized to a short ISO code, not full name
    lang = j["language"]
    assert isinstance(lang, str)
    assert 2 <= len(lang) <= 3, f"Expected ISO 2-3 letter code, got {lang!r}"
    assert lang.lower() == lang
    assert lang not in ("english", "hindi", "bengali")
    assert "confidence" in j


# ------- New: Export video (audio-only path) -------
def test_export_audio_only_returns_mp4(s):
    r = s.post(f"{API}/localize/tts",
               json={"text": "Export test.", "voice": "female", "language": "en"}, timeout=120)
    assert r.status_code == 200
    audio_b64 = r.json()["audio_base64"]
    data = {"audio_base64": audio_b64, "title": "TEST_Export", "keep_original": "false"}
    r = requests.post(f"{API}/localize/export", data=data, timeout=180)
    assert r.status_code == 200, r.text[:300]
    assert r.headers.get("content-type", "").startswith("video/mp4")
    content = r.content
    # ISO BMFF: bytes 4-8 should be 'ftyp'
    assert len(content) > 1000
    assert content[4:8] == b"ftyp", f"Not a valid mp4, got header {content[:12]!r}"


def test_export_with_video_and_audio(s, sample_mp4_with_speech):
    r = s.post(f"{API}/localize/tts",
               json={"text": "Dubbed track.", "voice": "male", "language": "en"}, timeout=120)
    assert r.status_code == 200
    audio_b64 = r.json()["audio_base64"]
    with open(sample_mp4_with_speech, "rb") as vf:
        files = {"video": ("in.mp4", vf, "video/mp4")}
        data = {"audio_base64": audio_b64, "title": "TEST_Muxed", "keep_original": "false"}
        r = requests.post(f"{API}/localize/export", data=data, files=files, timeout=240)
    assert r.status_code == 200, r.text[:300]
    assert r.headers.get("content-type", "").startswith("video/mp4")
    assert r.content[4:8] == b"ftyp"
