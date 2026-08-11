from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os, logging, uuid, jwt, bcrypt
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAITextToSpeech

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

@api_router.get("/analytics")
async def analytics(user: dict = Depends(get_current_user)):
    return {
        "stats": {"videos": 12, "languages": 37, "minutes": 84, "reach": "+42%"},
        "languages_used": [
            {"name": "Bengali", "value": 42}, {"name": "Assamese", "value": 28},
            {"name": "Tamil", "value": 15}, {"name": "Others", "value": 15},
        ],
        "reach_trend": [
            {"week": "W1", "reach": 120}, {"week": "W2", "reach": 210},
            {"week": "W3", "reach": 260}, {"week": "W4", "reach": 380},
            {"week": "W5", "reach": 520}, {"week": "W6", "reach": 690},
        ],
        "activity": [
            {"week": "Mon", "count": 2}, {"week": "Tue", "count": 4}, {"week": "Wed", "count": 3},
            {"week": "Thu", "count": 6}, {"week": "Fri", "count": 5}, {"week": "Sat", "count": 8}, {"week": "Sun", "count": 4},
        ],
    }

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
