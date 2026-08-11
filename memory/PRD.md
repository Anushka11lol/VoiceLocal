# VoiceLocal — PRD

## Original Problem Statement
Build VoiceLocal, an AI-powered regional video dubbing/localization platform for India's multilingual audience. Pipeline: Video → Speech Recognition → Translation → Voice Dubbing → Subtitle Generation → Localized Video. Hackathon MVP with convincing end-to-end flow; AI pipeline behind a service abstraction; some steps simulated.

## User Choices
- Light theme (light blue / white / maroon / pink accents). NO purple, NO dark.
- Left sidebar navigation; screen-reader on/off toggle at top-right.
- All 22 official Indian languages + English.
- Real LLM translation + real natural TTS (Emergent Universal key).
- Clerk requested but valid keys not provided → implemented simple JWT email/password auth instead.
- MongoDB persistence for users & projects.

## Architecture
- Frontend: React (CRA, JS), Tailwind, shadcn/ui, recharts, framer-motion, sonner. Service layer `localizationService.js` isolates all AI/API calls.
- Backend: FastAPI + Motor/MongoDB. JWT auth (bcrypt). emergentintegrations: LlmChat (openai gpt-5.4) for translation, OpenAITextToSpeech (tts-1-hd) for dubbing.
- Auth: Bearer JWT stored in localStorage (`vl_token`).

## User Personas
Indian content creators, YouTubers, educators, small businesses, NGOs, publishers wanting regional-language video reach.

## Implemented (2026-06-11)
- Landing (hero "One Video. Every Voice.", feature strip, "Why isn't this just an LLM wrapper?").
- How It Works (clickable 8-stage pipeline + technical architecture diagram).
- Features / Why VoiceLocal cards.
- Demo mode (ISRO Explained, Hindi→Bengali, auto-prefilled).
- Localize workspace: drag/drop upload + preview, source select w/ auto-detect, 22-language multi-select target cards, voice settings (type/style/preserve emotion), 5 option toggles, animated 8-step processing screen.
- Real translation (per-segment) + real TTS dubbing.
- Results: Original/Localized/Subtitles tabs, audio player, transcript side-by-side w/ clickable segments, subtitle size/position/style controls, Download Video/Audio/SRT.
- Auth: signup / login / forgot-password; protected Dashboard/History/Analytics.
- Dashboard (stat cards + recent projects), History, Analytics (recharts, demo data).
- Accessibility: screen-reader toggle w/ aria-live announcements, focus rings, keyboard-friendly, responsive + mobile sidebar.
- Tested: backend 100%, frontend 100% (iteration_1).

## Backlog (not built)
- P1: Real speech-to-text transcription from uploaded audio (currently fixed demo transcript).
- P1: Object storage for real video uploads + real localized video rendering.
- P2: Multi-target simultaneous generation; synchronized before/after playback.
- P2: Password reset email delivery (currently logged/stubbed); server-side password min-length.
- P2: Per-language demo transcripts.

## Next Tasks
- Wire object storage + real STT when providers are chosen.
