import { api } from "../lib/api";

// Service abstraction layer. UI never calls the AI pipeline directly.
// Mock steps are simulated; translate + generateVoice hit the real backend.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export const localizationService = {
  async uploadVideo(file) {
    await delay(400);
    return { ok: true, name: file?.name, size: file?.size };
  },

  async detectLanguage(hint = "hi") {
    const { data } = await api.post("/localize/detect", { hint });
    return data; // { language, confidence }
  },

  async transcribeVideo() {
    await delay(600);
    return { ok: true };
  },

  async translateTranscript({ text, source_language, target_language }) {
    const { data } = await api.post("/localize/translate", {
      text,
      source_language,
      target_language,
    });
    return data; // { translated_text, confidence }
  },

  async generateVoice({ text, voice, language }) {
    const { data } = await api.post("/localize/tts", { text, voice, language });
    return data; // { audio_base64, mime }
  },

  async generateSubtitles({ segments }) {
    await delay(300);
    return { segments };
  },

  async renderLocalizedVideo() {
    await delay(500);
    return { ok: true };
  },

  async getLanguages() {
    const { data } = await api.get("/languages");
    return data;
  },
};

export function buildSRT(segments, textKey = "translated") {
  return segments
    .map((s, i) => {
      const start = s.t + ",000";
      const end = (segments[i + 1]?.t || s.t) + ",000";
      return `${i + 1}\n00:${start} --> 00:${end}\n${s[textKey] || s.text}\n`;
    })
    .join("\n");
}
