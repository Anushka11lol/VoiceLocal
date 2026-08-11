import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Mic, Languages, MessageSquareText, Volume2, AlignVerticalSpaceAround, Captions, Film, ArrowRight } from "lucide-react";

const STAGES = [
  { icon: Video, title: "Video Input", desc: "You upload a short video. We extract the audio track and keep a copy of the original for comparison." },
  { icon: Mic, title: "Speech-to-Text", desc: "An automatic speech recognition model transcribes the spoken audio into text with timestamps." },
  { icon: Languages, title: "Language Detection", desc: "We detect the source language (or use your selection) and its confidence before translating." },
  { icon: MessageSquareText, title: "Translation Model", desc: "An LLM translates the transcript into the target Indian language, preserving meaning and tone." },
  { icon: Volume2, title: "Voice Generation", desc: "A text-to-speech model produces a natural AI-generated localized voice. Characteristics are approximated." },
  { icon: AlignVerticalSpaceAround, title: "Timing / Alignment", desc: "Generated audio is aligned to the original speaker timing so lips and pacing stay believable." },
  { icon: Captions, title: "Subtitle Generation", desc: "Timed subtitles are generated in the target language and exported as .SRT." },
  { icon: Film, title: "Localized Video", desc: "Everything is composited into a final localized video, ready to download and share." },
];

export default function HowItWorks() {
  const [open, setOpen] = useState(0);
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-heading text-4xl font-bold text-slate-900">How VoiceLocal Works</h1>
      <p className="text-slate-600 mt-3 max-w-2xl">The translation model is only <b>one</b> component. A full multimodal pipeline turns a single video into a localized experience. Click any stage to learn more.</p>

      <div className="mt-10 grid md:grid-cols-2 gap-4">
        {STAGES.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setOpen(open === i ? -1 : i)}
            data-testid={`pipeline-stage-${i}`}
            className={`text-left rounded-xl border p-5 transition-all hover:-translate-y-1 ${open === i ? "border-pink-300 bg-pink-50/50 shadow-md" : "border-slate-200 bg-white shadow-sm"}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg maroon-gradient flex items-center justify-center text-white shrink-0"><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">Stage {i + 1}</p>
                <h3 className="font-heading font-semibold text-slate-900">{s.title}</h3>
              </div>
            </div>
            {open === i && <p className="text-sm text-slate-600 mt-3 animate-fade-up">{s.desc}</p>}
          </button>
        ))}
      </div>

      <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-8">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Technical architecture</h2>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          {["Frontend","API Layer","Localization Orchestrator","Speech-to-Text","Translation Engine","Voice Generation","Audio Alignment","Video Renderer","Object Storage"].map((n, i, a) => (
            <span key={n} className="flex items-center gap-2">
              <span className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700">{n}</span>
              {i < a.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-pink-300" />}
            </span>
          ))}
        </div>
        <p className="text-slate-500 text-sm mt-5">Providers can be swapped behind the API layer without touching the UI.</p>
        <Link to="/localize" className="inline-flex items-center gap-2 mt-6 maroon-gradient text-white rounded-full px-6 py-3 font-semibold hover:scale-[1.03] transition-transform">
          Start Localizing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
