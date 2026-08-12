# VoiceLocal 🌍🎙️

### One Video. Every Voice.

VoiceLocal is an AI-powered video localization platform designed to help creators, educators, businesses, NGOs, and publishers reach India's multilingual audience.

Instead of creating separate videos for every language, VoiceLocal provides a single workflow for translating, dubbing, and generating localized video content across Indian languages.

---

## 🚀 The Problem

India has hundreds of languages and millions of people who consume content primarily in regional languages.

For creators and organizations, localizing video content manually is:

- Time-consuming
- Expensive
- Difficult to scale
- Dependent on separate translators and voice artists

This creates a barrier between valuable content and the people who could benefit from it.

---

## 💡 Our Solution

VoiceLocal brings the localization pipeline into one platform:

**Video → Speech Recognition → Translation → Voice Dubbing → Subtitles → Localized Video**

Users can upload a video, select their target language(s), configure voice preferences, and generate localized content through a unified workflow.

---

## ✨ Key Features

### 🎬 Video Localization
Upload video content and select one or multiple target languages.

### 🗣️ AI Voice Dubbing
Generate natural-sounding localized voice tracks while preserving the intended tone and style.

### 🌐 Multilingual Translation
Translate spoken content into multiple Indian languages using an AI-powered translation pipeline.

### 📝 Subtitles
Generate and customize subtitles with controls for:

- Size
- Position
- Style

### 🎧 Audio Preview
Preview the generated localized voice before exporting the final result.

### 📥 Export
Download localized:

- Video
- Audio
- SRT subtitles

### 🔐 Authentication
User accounts with:

- Sign up
- Login
- Protected routes
- JWT-based authentication

### 📊 Dashboard & Analytics
Track localization projects and view usage analytics through an interactive dashboard.

### ♿ Accessibility
VoiceLocal includes accessibility-focused features such as:

- Screen-reader toggle
- ARIA announcements
- Keyboard-friendly navigation
- Focus states
- Responsive UI

---

## 🧠 AI Pipeline

VoiceLocal uses a modular service architecture so individual AI components can be replaced or upgraded independently.

```text
              ┌──────────────┐
              │    Video     │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │ Speech / STT │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │ Translation  │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │     TTS      │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │  Subtitles   │
              └──────┬───────┘
                     ↓
              ┌──────────────┐
              │ Localized    │
              │    Video     │
              └──────────────┘
