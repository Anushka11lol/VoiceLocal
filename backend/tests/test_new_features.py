"""Tests for iteration 7 changes:
- POST /api/localize/translate_batch (count/order/native script, multi-language)
- POST /api/localize/tts long text (>4000 chars) returns single mp3
- Per-user stats persistence across logout/login
"""
import os
import uuid
import base64
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Batch translation ----------
def test_translate_batch_en_to_ta_preserves_count_and_order(s):
    texts = [
        "Hello, welcome to the mission briefing.",
        "The rocket will lift off at dawn.",
        "Please remain seated during the launch.",
        "Our target orbit is 400 kilometers.",
        "Thank you for your attention.",
        "We will now begin the countdown.",
    ]
    r = s.post(f"{API}/localize/translate_batch",
               json={"texts": texts, "source_language": "en", "target_language": "ta"},
               timeout=180)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "translations" in j
    tr = j["translations"]
    assert isinstance(tr, list)
    assert len(tr) == len(texts), f"Expected {len(texts)} translations, got {len(tr)}"
    for i, t in enumerate(tr):
        assert isinstance(t, str) and len(t.strip()) > 0, f"Empty translation at index {i}"
    # Tamil script codepoints 0x0B80–0x0BFF
    joined = "".join(tr)
    assert any('\u0B80' <= ch <= '\u0BFF' for ch in joined), f"Expected Tamil script, got: {joined[:200]}"


def test_translate_batch_empty_texts(s):
    r = s.post(f"{API}/localize/translate_batch",
               json={"texts": [], "source_language": "en", "target_language": "hi"},
               timeout=30)
    assert r.status_code == 200
    assert r.json() == {"translations": []}


@pytest.mark.parametrize("target,codepoint_range", [
    ("bn", ('\u0980', '\u09FF')),   # Bengali
    ("te", ('\u0C00', '\u0C7F')),   # Telugu
    ("ml", ('\u0D00', '\u0D7F')),   # Malayalam
    ("gu", ('\u0A80', '\u0AFF')),   # Gujarati
    ("pa", ('\u0A00', '\u0A7F')),   # Gurmukhi (Punjabi)
    ("ur", ('\u0600', '\u06FF')),   # Arabic/Urdu
])
def test_translate_batch_multiple_languages(s, target, codepoint_range):
    texts = ["Good morning, friends.", "Today is a beautiful day."]
    r = s.post(f"{API}/localize/translate_batch",
               json={"texts": texts, "source_language": "en", "target_language": target},
               timeout=180)
    assert r.status_code == 200, r.text
    tr = r.json()["translations"]
    assert len(tr) == 2
    lo, hi = codepoint_range
    joined = "".join(tr)
    assert any(lo <= ch <= hi for ch in joined), f"Expected {target} native script, got: {joined[:200]}"


@pytest.mark.parametrize("target", ["sat", "brx", "mni"])
def test_translate_batch_rarer_languages(s, target):
    """Rare Indian languages — must not 500 and return same count."""
    texts = ["Hello.", "How are you?"]
    r = s.post(f"{API}/localize/translate_batch",
               json={"texts": texts, "source_language": "en", "target_language": target},
               timeout=180)
    assert r.status_code == 200, r.text
    tr = r.json()["translations"]
    assert len(tr) == 2
    for t in tr:
        assert isinstance(t, str) and len(t.strip()) > 0


# ---------- Long TTS ----------
def test_tts_long_text_chunked(s):
    # ~6000 char English text with sentence boundaries
    sentence = "This is a test sentence used to validate that the text to speech service can handle very long inputs by chunking them and concatenating the resulting audio with ffmpeg. "
    text = (sentence * 40)  # ~6300 chars
    assert len(text) > 4000
    r = s.post(f"{API}/localize/tts",
               json={"text": text, "voice": "female", "language": "en"},
               timeout=240)
    assert r.status_code == 200, f"Status {r.status_code}, body {r.text[:400]}"
    j = r.json()
    assert "audio_base64" in j
    audio = j["audio_base64"]
    # Long TTS should yield a sizeable audio blob (much larger than a single short chunk)
    assert len(audio) > 20000, f"Audio blob unexpectedly small: {len(audio)} chars"
    # Valid base64
    base64.b64decode(audio[:200] + "==")


@pytest.mark.parametrize("lang,text", [
    ("ta", "வணக்கம், இது ஒரு சோதனை."),
    ("te", "నమస్కారం, ఇది ఒక పరీక్ష."),
    ("ml", "നമസ്കാരം, ഇത് ഒരു പരീക്ഷണമാണ്."),
    ("gu", "નમસ્તે, આ એક પરીક્ષણ છે."),
    ("pa", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਇਹ ਇੱਕ ਟੈਸਟ ਹੈ।"),
    ("ur", "ہیلو، یہ ایک ٹیسٹ ہے۔"),
])
def test_tts_multiple_languages(s, lang, text):
    r = s.post(f"{API}/localize/tts",
               json={"text": text, "voice": "female", "language": lang},
               timeout=120)
    assert r.status_code == 200, r.text[:300]
    assert len(r.json()["audio_base64"]) > 500


# ---------- Per-user stats persistence ----------
def test_stats_persist_across_logout_login(s):
    """Register user A, create project, logout, register user B (stats zero, A intact),
    login A again, stats still show A's counts."""
    email_a = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "secret123"
    reg_a = s.post(f"{API}/auth/register",
                   json={"name": "UserA", "email": email_a, "password": pwd})
    assert reg_a.status_code == 200, reg_a.text
    token_a1 = reg_a.json()["token"]
    h_a = {"Authorization": f"Bearer {token_a1}"}

    # Initial stats zeros
    st = s.get(f"{API}/stats", headers=h_a).json()
    assert st == {"videos": 0, "languages": 0, "minutes": 0, "reach": "+0%"}

    # Simulate localization by creating a project
    proj = {"title": "TEST persist run",
            "source_language": "en", "target_languages": ["ta"], "duration": "00:30"}
    p = s.post(f"{API}/projects", json=proj, headers=h_a)
    assert p.status_code == 200, p.text

    st = s.get(f"{API}/stats", headers=h_a).json()
    assert st["videos"] == 1
    assert st["languages"] == 1

    # Register user B (simulates logout + new user)
    email_b = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
    reg_b = s.post(f"{API}/auth/register",
                   json={"name": "UserB", "email": email_b, "password": pwd})
    assert reg_b.status_code == 200
    h_b = {"Authorization": f"Bearer {reg_b.json()['token']}"}
    st_b = s.get(f"{API}/stats", headers=h_b).json()
    assert st_b == {"videos": 0, "languages": 0, "minutes": 0, "reach": "+0%"}, \
        f"User B should be unaffected by A: {st_b}"

    # Login user A again (fresh session/token)
    login_a = s.post(f"{API}/auth/login", json={"email": email_a, "password": pwd})
    assert login_a.status_code == 200
    token_a2 = login_a.json()["token"]
    assert token_a2  # token issued
    h_a2 = {"Authorization": f"Bearer {token_a2}"}
    st_a2 = s.get(f"{API}/stats", headers=h_a2).json()
    assert st_a2["videos"] == 1, f"User A's stats did not persist across logout/login: {st_a2}"
    assert st_a2["languages"] == 1
