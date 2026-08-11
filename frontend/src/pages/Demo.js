import { useNavigate } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";
import { Waveform } from "../components/Waveform";

export default function Demo() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-6 py-14 text-center animate-fade-up">
      <span className="inline-flex items-center gap-2 rounded-full bg-pink-50 text-maroon-700 text-xs font-semibold px-3 py-1.5 border border-pink-100">Try Demo · No upload needed</span>
      <h1 className="font-heading text-4xl font-bold text-slate-900 mt-5">Experience VoiceLocal in 30 seconds</h1>
      <p className="text-slate-600 mt-3">We'll take a preloaded sample video — <b>"ISRO Explained"</b> — and localize it from <b>Hindi 🇮🇳</b> to <b>Bengali 🇮🇳</b> with real AI translation and natural voice dubbing.</p>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8 text-left">
        <div className="rounded-xl bg-slate-900 aspect-video flex items-center justify-center">
          <div className="text-center text-white"><div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center mx-auto"><Play className="w-5 h-5 text-maroon-700 ml-0.5" /></div><p className="text-sm mt-3 text-white/80">ISRO Explained · 00:42</p></div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div><p className="text-xs text-slate-400">Source</p><p className="font-semibold">Hindi 🇮🇳</p></div>
          <Waveform bars={30} />
          <div className="text-right"><p className="text-xs text-slate-400">Target</p><p className="font-semibold text-maroon-700">Bengali 🇮🇳</p></div>
        </div>
      </div>

      <button onClick={() => navigate("/localize?demo=1")} data-testid="run-demo-btn" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-8 py-3.5 font-semibold mt-8 hover:scale-[1.03] transition-transform">
        Run the Demo <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
