import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { UploadCloud, X, Check, Film, Info, Sparkles, Volume2 } from "lucide-react";
import { LANGUAGES, langName, langNative, DEMO_TRANSCRIPT, VOICE_TYPES, VOICE_STYLES } from "../data/languages";
import { localizationService, setVideoFile } from "../services/localizationService";
import { useA11y } from "../context/A11yContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Waveform } from "../components/Waveform";

const STEPS = ["Upload", "Analyze", "Translate", "Dub", "Export"];
const PIPELINE = [
  "Video analyzed", "Speech detected", "Transcript generated", "Language translated",
  "Generating localized voice", "Synchronizing audio", "Creating subtitles", "Rendering final video",
];

function Stepper({ current }) {
  return (
    <div className="flex items-center gap-1 sm:gap-3 flex-wrap" data-testid="workspace-stepper">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1 sm:gap-3">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${i < current ? "bg-pink-100 text-maroon-700" : i === current ? "maroon-gradient text-white" : "bg-slate-100 text-slate-400"}`}>
            <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">{i < current ? <Check className="w-3 h-3" /> : i + 1}</span>
            {s}
          </div>
          {i < STEPS.length - 1 && <span className="w-4 sm:w-8 h-px bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, testid }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-2">
        <div>
          <p className="font-medium text-slate-800 text-sm flex items-center gap-1.5">{label} {desc && <span title={desc}><Info className="w-3.5 h-3.5 text-slate-300" /></span>}</p>
          {desc && <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{desc}</p>}
        </div>
      </div>
      <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} data-testid={testid}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? "bg-maroon-700" : "bg-slate-300"}`}>
        <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function Processing({ done }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= PIPELINE.length - 1) return;
    const t = setTimeout(() => setStep((s) => Math.min(s + 1, PIPELINE.length - 1)), 900);
    return () => clearTimeout(t);
  }, [step]);
  const effective = done ? PIPELINE.length : step + 1;
  return (
    <div className="max-w-lg mx-auto py-10 text-center animate-fade-up" data-testid="processing-screen">
      <div className="w-16 h-16 mx-auto rounded-2xl maroon-gradient flex items-center justify-center"><Sparkles className="w-7 h-7 text-white" /></div>
      <h2 className="font-heading text-2xl font-bold text-slate-900 mt-5">Localizing your video…</h2>
      <div className="my-6"><Waveform active bars={48} className="justify-center h-14" /></div>
      <div className="bg-white rounded-xl border border-slate-200 p-5 text-left space-y-2">
        {PIPELINE.map((p, i) => {
          const state = i < effective ? "done" : i === effective ? "active" : "todo";
          return (
            <div key={p} className="flex items-center gap-3 text-sm">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${state === "done" ? "bg-maroon-700 text-white" : state === "active" ? "bg-pink-200 text-maroon-700 animate-pulse" : "bg-slate-100 text-slate-400"}`}>
                {state === "done" ? <Check className="w-3 h-3" /> : state === "active" ? "⏳" : ""}
              </span>
              <span className={state === "todo" ? "text-slate-400" : "text-slate-700"}>{p}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Localize() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { announce } = useA11y();
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [source, setSource] = useState("en");
  const [targets, setTargets] = useState([]);
  const [voice, setVoice] = useState("female");
  const [style, setStyle] = useState("natural");
  const [preserveEmotion, setPreserveEmotion] = useState(true);
  const [opts, setOpts] = useState({ dubbing: true, subtitles: true, originalAudio: false, music: true, timing: true });
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const previewAudioRef = useRef(null);

  const isDemo = params.get("demo") === "1";

  const currentStep = processing ? 3 : file ? (targets.length ? 2 : 1) : 0;

  const playPreview = async () => {
    setPreviewing(true);
    try {
      const lang = targets[0] || source || "en";
      const url = await localizationService.previewVoice({ voice, language: lang });
      if (previewAudioRef.current) {
        previewAudioRef.current.src = url;
        previewAudioRef.current.play();
      }
    } catch {
      toast.error("Couldn't play a voice preview right now.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleFile = useCallback((f) => {
    if (!f) return;
    const okTypes = ["video/mp4", "video/quicktime", "video/webm"];
    if (!okTypes.includes(f.type) && !/\.(mp4|mov|webm)$/i.test(f.name)) {
      toast.error("Unsupported file. Please use MP4, MOV or WebM.");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 200 MB.");
      return;
    }
    setFile(f);
    setVideoFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  // Demo prefill
  useEffect(() => {
    if (isDemo && !file) {
      setFile({ name: "ISRO_Explained_demo.mp4", size: 8_400_000, demo: true, duration: "00:42" });
      setSource("hi");
      setTargets(["bn"]);
    }
  }, [isDemo]); // eslint-disable-line

  const toggleTarget = (code) =>
    setTargets((t) => (t.includes(code) ? [] : [code]));

  const runPipeline = async () => {
    if (!file) { toast.error("Please upload or select a video first."); return; }
    if (targets.length === 0) { toast.error("Please select at least one target language."); return; }
    setProcessing(true);
    setDone(false);
    announce("Localization started. Processing your video.");
    const started = Date.now();
    try {
      // 1) Source transcript — real STT for uploaded files, demo transcript otherwise
      const src = source;
      let sourceSegments = DEMO_TRANSCRIPT;
      if (!file.demo) {
        const tr = await localizationService.transcribeVideo({ file, language: source });
        if (tr.segments?.length) sourceSegments = tr.segments;
      }

      // 2) For each target language: translate the whole transcript in one batched call + dub
      const outputs = {};
      for (const target of targets) {
        const translated = await localizationService.translateBatch({
          texts: sourceSegments.map((s) => s.text), source_language: src, target_language: target,
        });
        const segments = sourceSegments.map((seg, i) => ({ ...seg, translated: translated[i] || "" }));
        const fullTranslated = segments.map((s) => s.translated).join(" ");
        let audio = null;
        if (opts.dubbing) {
          const a = await localizationService.generateVoice({ text: fullTranslated, voice, language: target });
          audio = `data:${a.mime};base64,${a.audio_base64}`;
        }
        outputs[target] = { segments, fullTranslated, audio };
      }

      const title = file.demo ? "ISRO Explained" : file.name.replace(/\.[^.]+$/, "");
      const duration = file.duration || "00:42";

      // 3) Persist the project so statistics update on every localization (when signed in)
      let saved = false;
      if (user) {
        try {
          await api.post("/projects", {
            title, source_language: src, target_languages: targets, duration,
            voice_type: voice, style, options: opts,
            transcript_source: sourceSegments.map((s) => s.text).join(" "),
            transcript_translated: outputs[targets[0]].fullTranslated,
          });
          saved = true;
        } catch (err) {
          console.warn("Auto-save failed:", err);
        }
      }

      const result = {
        title, source: src, targets, duration,
        voice, style, opts, previewUrl: file.demo ? null : previewUrl,
        hasVideoFile: !file.demo,
        sourceSegments,
        outputs,
        saved,
      };
      const serialized = JSON.stringify(result);
      sessionStorage.setItem("vl_result", serialized);
      try { localStorage.setItem("vl_last_result", serialized); } catch (err) { console.warn("Result too large to cache locally:", err); }

      const elapsed = Date.now() - started;
      const wait = Math.max(0, 6500 - elapsed);
      setTimeout(() => {
        setDone(true);
        announce("Your localized video is ready.");
        setTimeout(() => navigate("/results"), 700);
      }, wait);
    } catch (err) {
      setProcessing(false);
      toast.error(err.response?.data?.detail || "We couldn't finish localizing this video. Please try again.");
    }
  };

  if (processing) {
    return <div className="max-w-4xl mx-auto px-6 py-8"><Stepper current={4} /><Processing done={done} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">New Localization</h1>
          <p className="text-slate-500 mt-1">Upload a video, choose languages, and generate a localized version.</p>
        </div>
      </div>
      <div className="mt-6"><Stepper current={currentStep} /></div>

      {/* Upload */}
      <section className="mt-8">
        <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">1. Upload your video</h2>
        {!file ? (
          <div
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-pink-300 bg-pink-50/50 hover:bg-pink-50 rounded-2xl p-10 text-center transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
            data-testid="upload-dropzone"
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center shadow-sm"><UploadCloud className="w-6 h-6 text-maroon-700" /></div>
            <p className="font-semibold text-slate-800 mt-4">Drag & drop your video here</p>
            <p className="text-slate-500 text-sm mt-1">or <span className="text-maroon-700 font-medium">Browse Files</span></p>
            <p className="text-xs text-slate-400 mt-3">MP4, MOV, WebM · Maximum file size: 200 MB</p>
            <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" data-testid="upload-input" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4" data-testid="upload-preview">
            <div className="w-24 h-16 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
              {previewUrl ? <video src={previewUrl} className="w-full h-full object-cover" /> : <Film className="w-6 h-6 text-white/70" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1_000_000).toFixed(1)} MB · {file.duration || "00:42"}</p>
            </div>
            <button onClick={() => { setFile(null); setPreviewUrl(null); setTargets([]); }} className="p-2 rounded-lg hover:bg-slate-100" data-testid="upload-remove" aria-label="Remove video"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
        )}
      </section>

      {file && (
        <>
          {/* Source language */}
          <section className="mt-8">
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">2. Source language</h2>
            <select value={source} onChange={(e) => setSource(e.target.value)} data-testid="source-language-select"
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-pink-200 outline-none">
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name} — {l.native}</option>)}
            </select>
          </section>

          {/* Target languages */}
          <section className="mt-8">
            <h2 className="font-heading text-lg font-semibold text-slate-900 mb-3">3. Target language</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {LANGUAGES.filter((l) => l.code !== source).map((l) => {
                const on = targets.includes(l.code);
                return (
                  <button key={l.code} onClick={() => toggleTarget(l.code)} data-testid={`target-lang-${l.code}`}
                    className={`text-left rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${on ? "border-maroon-700 bg-pink-50 shadow-sm" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-slate-800 text-sm truncate">{l.name}</span>
                      {on && <Check className="w-4 h-4 text-maroon-700 shrink-0" />}
                    </div>
                    <span className="block text-xs text-slate-500 truncate">{l.native}</span>
                  </button>
                );
              })}
            </div>
            {targets.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {targets.map((c) => (
                  <div key={c} className="bg-white rounded-xl border border-slate-200 p-4 min-w-[160px]">
                    <p className="font-semibold text-slate-800">{langName(c)} 🇮🇳</p>
                    <div className="text-xs text-slate-600 mt-2 space-y-1">
                      <p className="flex items-center gap-1"><Check className="w-3 h-3 text-maroon-700" /> Translation</p>
                      {opts.dubbing && <p className="flex items-center gap-1"><Check className="w-3 h-3 text-maroon-700" /> Voice dubbing</p>}
                      {opts.subtitles && <p className="flex items-center gap-1"><Check className="w-3 h-3 text-maroon-700" /> Subtitles</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Voice settings */}
          <section className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-heading text-lg font-semibold text-slate-900 mb-4">Voice Settings</h2>
              <p className="text-xs text-slate-500 mb-2">Voice type</p>
              <div className="flex gap-2 mb-4">
                {VOICE_TYPES.map((v) => (
                  <button key={v} onClick={() => setVoice(v)} data-testid={`voice-type-${v}`}
                    className={`capitalize rounded-full px-4 py-1.5 text-sm transition-colors ${voice === v ? "maroon-gradient text-white" : "bg-slate-100 text-slate-600"}`}>{v}</button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mb-2">Style</p>
              <div className="flex flex-wrap gap-2">
                {VOICE_STYLES.map((s) => (
                  <button key={s} onClick={() => setStyle(s)} data-testid={`voice-style-${s}`}
                    className={`capitalize rounded-full px-4 py-1.5 text-sm transition-colors ${style === s ? "bg-pink-400 text-white" : "bg-slate-100 text-slate-600"}`}>{s}</button>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-100 pt-2">
                <Toggle label="Preserve emotion" testid="toggle-emotion" checked={preserveEmotion} onChange={setPreserveEmotion}
                  desc="Preserve the approximate emotional tone and speaking style of the original speaker." />
              </div>
              <p className="text-xs text-slate-400 mt-2">AI-generated localized voice. Voice characteristics are approximated for localization.</p>
              <button type="button" onClick={playPreview} disabled={previewing} data-testid="voice-preview-btn"
                className="mt-3 inline-flex items-center gap-2 bg-pink-50 text-maroon-700 rounded-full px-4 py-2 text-sm font-semibold hover:bg-pink-100 transition-colors disabled:opacity-60">
                <Volume2 className="w-4 h-4" /> {previewing ? "Loading voice…" : "Preview voice"}
              </button>
              <audio ref={previewAudioRef} className="hidden" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-heading text-lg font-semibold text-slate-900 mb-2">Localization options</h2>
              <Toggle label="Audio dubbing" testid="toggle-dubbing" checked={opts.dubbing} onChange={(v) => setOpts({ ...opts, dubbing: v })} desc="Generate a localized AI voice track." />
              <Toggle label="Subtitles" testid="toggle-subtitles" checked={opts.subtitles} onChange={(v) => setOpts({ ...opts, subtitles: v })} desc="Create timed subtitles in the target language." />
              <Toggle label="Original audio" testid="toggle-original" checked={opts.originalAudio} onChange={(v) => setOpts({ ...opts, originalAudio: v })} desc="Keep the original audio track alongside the dub." />
              <Toggle label="Preserve background music" testid="toggle-music" checked={opts.music} onChange={(v) => setOpts({ ...opts, music: v })} desc="Retain background music under the new voice." />
              <Toggle label="Preserve speaker timing" testid="toggle-timing" checked={opts.timing} onChange={(v) => setOpts({ ...opts, timing: v })} desc="Align the dub to the original speaker's timing." />
            </div>
          </section>

          <div className="mt-8 flex justify-end">
            <button onClick={runPipeline} data-testid="generate-btn"
              className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-8 py-3.5 font-semibold hover:scale-[1.03] transition-transform">
              <Sparkles className="w-4 h-4" /> Generate Localization
            </button>
          </div>
        </>
      )}
    </div>
  );
}
