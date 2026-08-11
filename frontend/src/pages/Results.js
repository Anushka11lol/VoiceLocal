import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Play, Download, Captions, FileAudio, FileVideo, Check, Save } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { langName, langNative } from "../data/languages";
import { buildSRT } from "../services/localizationService";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Waveform } from "../components/Waveform";

function download(filename, content, mime = "text/plain") {
  const a = document.createElement("a");
  if (typeof content === "string" && content.startsWith("data:")) a.href = content;
  else a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

const SUB_SIZES = { Small: "text-sm", Medium: "text-lg", Large: "text-2xl" };

export default function Results() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [r, setR] = useState(null);
  const [audioIdx, setAudioIdx] = useState(0);
  const [subSize, setSubSize] = useState("Medium");
  const [subPos, setSubPos] = useState("bottom");
  const [subStyle, setSubStyle] = useState("pill");
  const audioRef = useRef(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("vl_result") || localStorage.getItem("vl_last_result");
    if (!raw) { navigate("/localize"); return; }
    setR(JSON.parse(raw));
  }, [navigate]);

  if (!r) return null;

  const currentSub = r.segments[audioIdx]?.translated || r.segments[0]?.translated;

  const saveProject = async () => {
    if (!user) { toast.info("Log in to save to your history."); navigate("/login"); return; }
    try {
      await api.post("/projects", {
        title: r.title, source_language: r.source, target_languages: [r.target],
        duration: r.duration, voice_type: r.voice, style: r.style, options: r.opts,
        transcript_source: r.segments.map((s) => s.text).join(" "),
        transcript_translated: r.fullTranslated,
      });
      toast.success("Saved to your history!");
    } catch {
      toast.error("Couldn't save. Please log in and try again.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Your video is ready 🎉</h1>
          <p className="text-slate-500 mt-1">{langName(r.source)} → {langName(r.target)} · {r.title}</p>
        </div>
        <button onClick={saveProject} data-testid="save-project-btn" className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors">
          <Save className="w-4 h-4" /> Save to History
        </button>
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
        <Tabs defaultValue="localized">
          <TabsList data-testid="results-tabs">
            <TabsTrigger value="original" data-testid="tab-original">Original</TabsTrigger>
            <TabsTrigger value="localized" data-testid="tab-localized">Localized</TabsTrigger>
            <TabsTrigger value="subtitles" data-testid="tab-subtitles">Subtitles</TabsTrigger>
          </TabsList>

          <TabsContent value="original">
            <div className="rounded-xl bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden">
              {r.previewUrl ? <video src={r.previewUrl} controls className="w-full h-full" /> :
                <div className="text-center text-white/80"><Play className="w-10 h-10 mx-auto" /><p className="mt-2 text-sm">Original {langName(r.source)} video</p></div>}
            </div>
          </TabsContent>

          <TabsContent value="localized">
            <div className="rounded-xl bg-slate-900 aspect-video flex flex-col items-center justify-center relative overflow-hidden p-6">
              {r.previewUrl && <video src={r.previewUrl} muted className="absolute inset-0 w-full h-full object-cover opacity-40" />}
              <div className="relative z-10 text-center text-white">
                <p className="text-xs uppercase tracking-wide text-pink-200">Localized · {langName(r.target)}</p>
                <Waveform active bars={40} className="justify-center h-14 my-4" />
                {r.audio ? (
                  <audio ref={audioRef} src={r.audio} controls autoPlay className="mx-auto" data-testid="localized-audio" />
                ) : <p className="text-sm text-white/70">Audio dubbing was disabled for this run.</p>}
                <div className={`mt-4 inline-block px-3 py-1 rounded-full bg-black/60 ${SUB_SIZES[subSize]}`}>{currentSub}</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subtitles">
            <div className="rounded-xl bg-slate-900 aspect-video flex items-center justify-center relative overflow-hidden">
              <div className={`absolute left-0 right-0 flex justify-center px-6 ${subPos === "top" ? "top-6" : subPos === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-8"}`}>
                <span className={`text-white text-center ${SUB_SIZES[subSize]} ${subStyle === "pill" ? "bg-black/60 rounded-full px-4 py-1.5" : subStyle === "box" ? "bg-maroon-700 rounded px-3 py-1" : "drop-shadow-lg"}`}>{currentSub}</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Size</p>
                <div className="flex gap-2">{Object.keys(SUB_SIZES).map((s) => <button key={s} onClick={() => setSubSize(s)} data-testid={`sub-size-${s}`} className={`text-xs rounded-full px-3 py-1 ${subSize === s ? "maroon-gradient text-white" : "bg-slate-100 text-slate-600"}`}>{s}</button>)}</div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Position</p>
                <div className="flex gap-2">{["top", "middle", "bottom"].map((p) => <button key={p} onClick={() => setSubPos(p)} data-testid={`sub-pos-${p}`} className={`text-xs capitalize rounded-full px-3 py-1 ${subPos === p ? "maroon-gradient text-white" : "bg-slate-100 text-slate-600"}`}>{p}</button>)}</div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Style</p>
                <div className="flex gap-2">{["pill", "box", "plain"].map((s) => <button key={s} onClick={() => setSubStyle(s)} data-testid={`sub-style-${s}`} className={`text-xs capitalize rounded-full px-3 py-1 ${subStyle === s ? "maroon-gradient text-white" : "bg-slate-100 text-slate-600"}`}>{s}</button>)}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Downloads */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={() => toast.success("Localized video export started (demo).")} data-testid="download-video" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-5 py-2.5 text-sm font-semibold hover:scale-[1.03] transition-transform"><FileVideo className="w-4 h-4" /> Download Video</button>
          <button onClick={() => r.audio ? download(`${r.title}-${r.target}.mp3`, r.audio) : toast.info("Enable dubbing to download audio.")} data-testid="download-audio" className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"><FileAudio className="w-4 h-4" /> Download Audio</button>
          <button onClick={() => download(`${r.title}-${r.target}.srt`, buildSRT(r.segments), "text/srt")} data-testid="download-srt" className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"><Captions className="w-4 h-4" /> Download Subtitles (.SRT)</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          ["Source", `${langName(r.source)} 🇮🇳`], ["Target", `${langName(r.target)} 🇮🇳`], ["Duration", r.duration],
          ["Transcript", `${r.transcriptConfidence}% confidence`], ["Translation", "95% confidence"], ["Audio", r.audio ? "AI-generated" : "Disabled"],
        ].map(([k, v]) => (
          <div key={k} className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-400">{k}</p><p className="font-semibold text-slate-800 mt-0.5">{v}</p></div>
        ))}
      </div>

      {/* Transcript side by side */}
      <div className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-slate-900 mb-3">Transcript</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Original · {langNative(r.source)}</p>
            {r.segments.map((s, i) => (
              <button key={i} onClick={() => { setAudioIdx(i); if (audioRef.current) audioRef.current.play(); }} data-testid={`transcript-src-${i}`} className={`w-full text-left flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-blue-50 ${audioIdx === i ? "bg-pink-50" : ""}`}>
                <span className="text-xs text-maroon-600 font-mono shrink-0 pt-0.5">{s.t}</span>
                <span className="text-sm text-slate-700">{s.text}</span>
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-maroon-700 uppercase mb-3">Localized · {langNative(r.target)}</p>
            {r.segments.map((s, i) => (
              <button key={i} onClick={() => setAudioIdx(i)} data-testid={`transcript-tgt-${i}`} className={`w-full text-left flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-blue-50 ${audioIdx === i ? "bg-pink-50" : ""}`}>
                <span className="text-xs text-maroon-600 font-mono shrink-0 pt-0.5">{s.t}</span>
                <span className="text-sm text-slate-700">{s.translated}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Link to="/localize" className="bg-white border border-slate-200 rounded-full px-6 py-3 text-sm font-semibold hover:bg-slate-50 transition-colors">Localize another</Link>
        <Link to="/dashboard" className="maroon-gradient text-white rounded-full px-6 py-3 text-sm font-semibold hover:scale-[1.03] transition-transform inline-flex items-center gap-2"><Check className="w-4 h-4" /> Done</Link>
      </div>
    </div>
  );
}
