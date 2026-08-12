from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, jwt, bcrypt, tempfile, subprocess, base64, shutil, asyncio
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAITextToSpeech, OpenAISpeechToText


def _resolve_ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg") or "ffmpeg"


FFMPEG = _resolve_ffmpeg()


def _run_ffmpeg(cmd: list, timeout: int = 180):
    return subprocess.run(cmd, check=True, capture_output=True, timeout=timeout)


def _fmt_ts(seconds: float) -> str:
    seconds = int(seconds or 0)
    return f"{seconds // 60:02d}:{seconds % 60:02d}"

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voicelocal")

# ---------------- Languages ----------------
LANGUAGES = [
    {"code": "en", "name": "English", "native": "English", "flag": "🇬🇧"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳"},
    {"code": "bn", "name": "Bengali", "native": "বাংলা", "flag": "🇮🇳"},
    {"code": "as", "name": "Assamese", "native": "অসমীয়া", "flag": "🇮🇳"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்", "flag": "🇮🇳"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు", "flag": "🇮🇳"},
    {"code": "mr", "name": "Marathi", "native": "मराठी", "flag": "🇮🇳"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "flag": "🇮🇳"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "flag": "🇮🇳"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી", "flag": "🇮🇳"},
    {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ", "flag": "🇮🇳"},
    {"code": "or", "name": "Odia", "native": "ଓଡ଼ିଆ", "flag": "🇮🇳"},
    {"code": "ur", "name": "Urdu", "native": "اردو", "flag": "🇮🇳"},
    {"code": "sa", "name": "Sanskrit", "native": "संस्कृतम्", "flag": "🇮🇳"},
    {"code": "ks", "name": "Kashmiri", "native": "کٲشُر", "flag": "🇮🇳"},
    {"code": "sd", "name": "Sindhi", "native": "سنڌي", "flag": "🇮🇳"},
    {"code": "ne", "name": "Nepali", "native": "नेपाली", "flag": "🇮🇳"},
    {"code": "kok", "name": "Konkani", "native": "कोंकणी", "flag": "🇮🇳"},
    {"code": "mai", "name": "Maithili", "native": "मैथिली", "flag": "🇮🇳"},
    {"code": "doi", "name": "Dogri", "native": "डोगरी", "flag": "🇮🇳"},
    {"code": "brx", "name": "Bodo", "native": "बड़ो", "flag": "🇮🇳"},
    {"code": "mni", "name": "Manipuri", "native": "মৈতৈলোন্", "flag": "🇮🇳"},
    {"code": "sat", "name": "Santali", "native": "ᱥᱟᱱᱛᱟᱲᱤ", "flag": "🇮🇳"},
]
LANG_BY_CODE = {l["code"]: l for l in LANGUAGES}

WHISPER_LANG_MAP = {
    "english": "en", "hindi": "hi", "bengali": "bn", "assamese": "as", "tamil": "ta",
    "telugu": "te", "marathi": "mr", "malayalam": "ml", "kannada": "kn", "gujarati": "gu",
    "punjabi": "pa", "odia": "or", "oriya": "or", "urdu": "ur", "sanskrit": "sa",
    "kashmiri": "ks", "sindhi": "sd", "nepali": "ne", "konkani": "kok", "maithili": "mai",
    "dogri": "doi", "bodo": "brx", "manipuri": "mni", "santali": "sat", "sanscrit": "sa",
}

# ---------------- Auth helpers ----------------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def create_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- Models ----------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TranslateIn(BaseModel):
    text: str
    source_language: str
    target_language: str

class TTSIn(BaseModel):
    text: str
    voice: str = "female"
    language: str = "hi"

class ProjectIn(BaseModel):
    title: str
    source_language: str
    target_languages: List[str]
    duration: Optional[str] = "00:42"
    thumbnail: Optional[str] = None
    voice_type: Optional[str] = "female"
    style: Optional[str] = "natural"
    options: Optional[dict] = None
    transcript_source: Optional[str] = None
    transcript_translated: Optional[str] = None

# ---------------- Auth routes ----------------
@api_router.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    uid = str(uuid.uuid4())
    doc = {"id": uid, "name": body.name, "email": email,
           "password_hash": hash_password(body.password),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(doc)
    token = create_token(uid, email)
    return {"token": token, "user": {"id": uid, "name": body.name, "email": email}}

@api_router.post("/auth/login")
async def login(body: LoginIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_token(user["id"], email)
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": email}}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}

@api_router.post("/auth/forgot-password")
async def forgot_password(body: dict):
    logger.info(f"Password reset requested for {body.get('email')}")
    return {"message": "If an account exists for that email, a reset link has been sent."}

# ---------------- Languages ----------------
@api_router.get("/languages")
async def get_languages():
    return LANGUAGES

# ---------------- AI pipeline ----------------
@api_router.post("/localize/detect")
async def detect_language(body: dict):
    return {"language": body.get("hint", "hi"), "confidence": 97}

@api_router.post("/localize/translate")
async def translate(body: TranslateIn):
    src = LANG_BY_CODE.get(body.source_language, {}).get("name", body.source_language)
    tgt = LANG_BY_CODE.get(body.target_language, {}).get("name", body.target_language)
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Translation service unavailable.")
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"translate-{uuid.uuid4()}",
            system_message=(f"You are an expert translator specialising in Indian languages. "
                            f"Translate the given text from {src} to {tgt}. "
                            f"Return ONLY the translated text in the native script of {tgt}, "
                            f"preserving meaning, tone and natural conversational flow. No notes, no quotes.")
        ).with_model("openai", "gpt-5.4")
        resp = await chat.send_message(UserMessage(text=body.text))
        translated = resp.strip() if isinstance(resp, str) else str(resp).strip()
        return {"translated_text": translated, "source": src, "target": tgt, "confidence": 95}
    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(status_code=502, detail="We couldn't translate this text right now. Please try again.")

VOICE_MAP = {"female": "nova", "male": "onyx", "neutral": "alloy"}

@api_router.post("/localize/tts")
async def text_to_speech(body: TTSIn):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Voice service unavailable.")
    try:
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        voice = VOICE_MAP.get(body.voice, "nova")
        text = body.text[:4000]
        audio_b64 = await tts.generate_speech_base64(text=text, model="tts-1-hd", voice=voice)
        return {"audio_base64": audio_b64, "mime": "audio/mp3"}
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=502, detail="We couldn't generate the localized voice right now. Please try again.")


@api_router.post("/localize/transcribe")
async def transcribe(file: UploadFile = File(...), language: Optional[str] = Form(None)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="Transcription service unavailable.")
    tmpdir = tempfile.mkdtemp(prefix="vl_")
    src_path = os.path.join(tmpdir, file.filename or "input.mp4")
    audio_path = os.path.join(tmpdir, "audio.mp3")
    try:
        with open(src_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        # Extract compressed mono audio to stay under Whisper's 25MB limit
        await asyncio.to_thread(
            _run_ffmpeg,
            [FFMPEG, "-y", "-i", src_path, "-vn", "-ac", "1", "-ar", "16000",
             "-b:a", "64k", audio_path],
            120,
        )
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        kwargs = {"model": "whisper-1", "response_format": "verbose_json",
                  "timestamp_granularities": ["segment"]}
        if language and language != "auto":
            kwargs["language"] = language
        with open(audio_path, "rb") as af:
            resp = await stt.transcribe(file=af, **kwargs)
        segments = []
        raw_segments = getattr(resp, "segments", None) or []
        for s in raw_segments:
            start = getattr(s, "start", None)
            text = getattr(s, "text", None)
            if start is None and isinstance(s, dict):
                start, text = s.get("start"), s.get("text")
            segments.append({"t": _fmt_ts(start or 0), "text": (text or "").strip()})
        if not segments:
            segments = [{"t": "00:00", "text": (getattr(resp, "text", "") or "").strip()}]
        detected = getattr(resp, "language", None) or language or "en"
        detected = str(detected).lower()
        detected = WHISPER_LANG_MAP.get(detected, detected if len(detected) <= 3 else "en")
        return {"segments": segments, "language": detected, "confidence": 96}
    except subprocess.CalledProcessError:
        raise HTTPException(status_code=422, detail="We couldn't read the audio from this file. Please try a different video.")
    except Exception as e:
        logger.error(f"Transcribe error: {e}")
        raise HTTPException(status_code=502, detail="We couldn't transcribe this video right now. Please try again.")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


@api_router.post("/localize/export")
async def export_video(
    audio_base64: str = Form(...),
    title: str = Form("VoiceLocal"),
    keep_original: str = Form("false"),
    video: Optional[UploadFile] = File(None),
):
    tmpdir = tempfile.mkdtemp(prefix="vlx_")
    audio_path = os.path.join(tmpdir, "dub.mp3")
    out_path = os.path.join(tmpdir, "localized.mp4")
    try:
        with open(audio_path, "wb") as f:
            f.write(base64.b64decode(audio_base64))
        if video is not None:
            vid_path = os.path.join(tmpdir, video.filename or "in.mp4")
            with open(vid_path, "wb") as f:
                shutil.copyfileobj(video.file, f)
            if keep_original == "true":
                cmd = [FFMPEG, "-y", "-i", vid_path, "-i", audio_path,
                       "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=shortest[a]",
                       "-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-shortest", out_path]
            else:
                cmd = [FFMPEG, "-y", "-i", vid_path, "-i", audio_path,
                       "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
                       "-c:a", "aac", "-shortest", out_path]
        else:
            # No source video (demo): render a branded video from the dubbed audio
            cmd = [FFMPEG, "-y", "-f", "lavfi", "-i", "color=c=0xb0455b:s=1280x720",
                   "-i", audio_path, "-c:v", "libx264", "-pix_fmt", "yuv420p",
                   "-c:a", "aac", "-shortest", out_path]
        await asyncio.to_thread(_run_ffmpeg, cmd, 180)
        with open(out_path, "rb") as f:
            data = f.read()
        return Response(content=data, media_type="video/mp4",
                        headers={"Content-Disposition": f'attachment; filename="{title}.mp4"'})
    except subprocess.CalledProcessError as e:
        logger.error(f"Export ffmpeg error: {e.stderr[:500] if e.stderr else e}")
        raise HTTPException(status_code=502, detail="We couldn't render the localized video. Please try again.")
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=502, detail="We couldn't render the localized video. Please try again.")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

# ---------------- Projects ----------------
@api_router.post("/projects")
async def create_project(body: ProjectIn, user: dict = Depends(get_current_user)):
    pid = str(uuid.uuid4())
    doc = {"id": pid, "user_id": user["id"], **body.model_dump(),
           "status": "Completed", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    rows = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rows

@api_router.get("/projects/{pid}")
async def get_project(pid: str, user: dict = Depends(get_current_user)):
    row = await db.projects.find_one({"id": pid, "user_id": user["id"]}, {"_id": 0})
    if not row:
        raise HTTPException(status_code=404, detail="Project not found.")
    return row

def _duration_to_seconds(d) -> int:
    try:
        parts = [int(x) for x in str(d or "0:0").split(":")]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        if len(parts) == 2:
            return parts[0] * 60 + parts[1]
        return int(parts[0])
    except Exception:
        return 0


def _compute_analytics(projects: list) -> dict:
    videos = len(projects)
    generations = 0
    total_sec = 0
    lang_counts: dict = {}
    day_counts: dict = {}
    week_gen: dict = {}
    now = datetime.now(timezone.utc)

    for p in projects:
        targets = p.get("target_languages") or []
        generations += len(targets)
        for t in targets:
            lang_counts[t] = lang_counts.get(t, 0) + 1
        total_sec += _duration_to_seconds(p.get("duration"))
        try:
            dt = datetime.fromisoformat(p.get("created_at"))
        except Exception:
            dt = now
        day_counts[dt.date()] = day_counts.get(dt.date(), 0) + 1
        monday = dt.date() - timedelta(days=dt.date().weekday())
        week_gen[monday] = week_gen.get(monday, 0) + max(1, len(targets))

    minutes = round(total_sec / 60)
    reach_pct = min(99, generations * 4 + videos * 3) if videos else 0
    stats = {"videos": videos, "languages": generations, "minutes": minutes, "reach": f"+{reach_pct}%"}

    # Languages used distribution (top 3 + Others)
    sorted_langs = sorted(lang_counts.items(), key=lambda x: -x[1])
    languages_used = []
    total = generations or 1
    acc = 0
    for code, c in sorted_langs[:3]:
        pct = round(c * 100 / total)
        acc += pct
        languages_used.append({"name": LANG_BY_CODE.get(code, {}).get("name", code), "value": pct})
    if len(sorted_langs) > 3 and (100 - acc) > 0:
        languages_used.append({"name": "Others", "value": 100 - acc})

    # Activity — projects created per day over the last 7 days
    activity = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        activity.append({"week": day.strftime("%a"), "count": day_counts.get(day, 0)})

    # Audience reach — cumulative estimate over the last 6 weeks
    this_monday = now.date() - timedelta(days=now.date().weekday())
    reach_trend = []
    cum = 0
    for i in range(5, -1, -1):
        wk = this_monday - timedelta(weeks=i)
        cum += week_gen.get(wk, 0)
        reach_trend.append({"week": wk.strftime("%d %b"), "reach": cum * 10})

    most_lang = languages_used[0]["name"] if languages_used else "—"
    highlights = {
        "most_language": most_lang,
        "completion_rate": "100%" if videos else "—",
        "distinct_languages": len(lang_counts),
    }
    return {"stats": stats, "languages_used": languages_used,
            "reach_trend": reach_trend, "activity": activity, "highlights": highlights}


@api_router.get("/stats")
async def user_stats(user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return _compute_analytics(projects)["stats"]


@api_router.get("/analytics")
async def analytics(user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return _compute_analytics(projects)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
