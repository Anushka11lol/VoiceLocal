import { api } from "../lib/api";

// Service abstraction layer. UI never calls the AI pipeline directly.
// Translate + generateVoice + transcribe + export hit the real backend.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Keep the uploaded File in memory (not serializable to storage) so export can reuse it.
let _lastVideoFile = null;
export const setVideoFile = (f) => { _lastVideoFile = f; };
export const getVideoFile = () => _lastVideoFile;

export const localizationService = {
  async uploadVideo(file) {
    _lastVideoFile = file;
    await delay(300);
    return { ok: true, name: file?.name, size: file?.size };
  },

  async detectLanguage(hint = "hi") {
    const { data } = await api.post("/localize/detect", { hint });
    return data;
  },

  async transcribeVideo({ file, language }) {
    const fd = new FormData();
    fd.append("file", file);
    if (language && language !== "auto") fd.append("language", language);
    const { data } = await api.post("/localize/transcribe", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180000,
    });
    return data; // { segments:[{t,text}], language, confidence }
  },

  async translateTranscript({ text, source_language, target_language }) {
    const { data } = await api.post("/localize/translate", {
      text, source_language, target_language,
    }, { timeout: 60000 });
    return data;
  },

  async translateBatch({ texts, source_language, target_language }) {
    const { data } = await api.post("/localize/translate_batch", {
      texts, source_language, target_language,
    }, { timeout: 180000 });
    return data.translations; // string[]
  },

  async generateVoice({ text, voice, language }) {
    const { data } = await api.post("/localize/tts", { text, voice, language }, { timeout: 240000 });
    return data; // { audio_base64, mime }
  },

  async previewVoice({ voice, language }) {
    const { data } = await api.post("/localize/tts", {
      text: PREVIEW_LINES[language] || PREVIEW_LINES.en,
      voice, language,
    }, { timeout: 60000 });
    return `data:${data.mime};base64,${data.audio_base64}`;
  },

  async exportVideo({ audioBase64, title, keepOriginal }) {
    const fd = new FormData();
    fd.append("audio_base64", audioBase64);
    fd.append("title", title || "VoiceLocal");
    fd.append("keep_original", keepOriginal ? "true" : "false");
    if (_lastVideoFile) fd.append("video", _lastVideoFile);
    const resp = await api.post("/localize/export", fd, {
      responseType: "blob", timeout: 180000,
    });
    return resp.data; // Blob (video/mp4)
  },

  async generateSubtitles({ segments }) {
    await delay(200);
    return { segments };
  },

  async getLanguages() {
    const { data } = await api.get("/languages");
    return data;
  },
};

const PREVIEW_LINES = {
  en: "This is a preview of your AI-generated localized voice.",
  hi: "यह आपकी एआई-जनित स्थानीयकृत आवाज़ का पूर्वावलोकन है।",
  bn: "এটি আপনার এআই-জেনারেটেড স্থানীয়কৃত কণ্ঠস্বরের একটি প্রিভিউ।",
  ta: "இது உங்கள் செயற்கை நுண்ணறிவு உருவாக்கிய குரலின் முன்னோட்டம்.",
  te: "ఇది మీ AI రూపొందించిన స్థానికీకరించిన స్వరం యొక్క ప్రివ్యూ.",
  mr: "हे तुमच्या एआय-निर्मित स्थानिकीकृत आवाजाचे पूर्वावलोकन आहे.",
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
