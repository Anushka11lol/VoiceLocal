import { Link } from "react-router-dom";
import { ArrowRight, Play, Languages, Captions, Volume2, Zap, ShieldCheck, Users, GitBranch } from "lucide-react";
import { Waveform } from "../components/Waveform";

const HERO_IMG = "https://images.unsplash.com/photo-1568316280532-71d1baad0986?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB2aWRlbyUyMGNyZWF0b3J8ZW58MHx8fHwxNzg2NDY1NDYxfDA&ixlib=rb-4.1.0&q=85";

function DemoCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(128,0,0,0.25)] p-5 w-full max-w-sm">
      <div className="rounded-xl bg-slate-900 aspect-video relative overflow-hidden">
        <img src={HERO_IMG} alt="Indian creator" className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"><Play className="w-5 h-5 text-maroon-700 ml-0.5" /></div>
        </div>
        <div className="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs rounded px-2 py-1 text-center">আজ আমরা ভারতের মহাকাশ গবেষণা নিয়ে কথা বলব।</div>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm">
        <div>
          <p className="text-slate-400 text-xs">Original</p>
          <p className="font-semibold text-slate-800">Hindi 🇮🇳</p>
        </div>
        <ArrowRight className="w-4 h-4 text-pink-400" />
        <div className="text-right">
          <p className="text-slate-400 text-xs">Localized</p>
          <p className="font-semibold text-maroon-700">Bengali 🇮🇳</p>
        </div>
      </div>
      <div className="mt-4"><Waveform active bars={34} /></div>
    </div>
  );
}

const FEATURES = [
  { icon: Volume2, title: "AI Voice Dubbing", desc: "Natural AI-generated localized voice, approximated to the original tone." },
  { icon: Captions, title: "Live Subtitles", desc: "Accurate subtitles in the target language with adjustable styling." },
  { icon: Languages, title: "22 Indian Languages", desc: "Every official scheduled language of India, out of the box." },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative hero-glow">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-pink-50 text-maroon-700 text-xs font-semibold px-3 py-1.5 border border-pink-100">
              <Zap className="w-3.5 h-3.5" /> Your video. Every Indian language.
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mt-5 leading-[1.05]">
              One Video. <span className="text-maroon-700">Every Voice.</span>
            </h1>
            <p className="text-lg text-slate-600 mt-5 max-w-lg">
              Turn your videos into multilingual experiences with AI-powered transcription, translation, dubbing and subtitles.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/localize" data-testid="cta-start-localizing" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-6 py-3 font-semibold hover:scale-[1.03] transition-transform">
                Localize a Video <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/how-it-works" data-testid="cta-how-it-works" className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                See How It Works
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-maroon-600" /> Accessibility-first</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-maroon-600" /> Built for creators</span>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <DemoCard />
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6">
              <div className="w-11 h-11 rounded-lg bg-pink-50 flex items-center justify-center"><f.icon className="w-5 h-5 text-maroon-700" /></div>
              <h3 className="font-heading text-lg font-semibold text-slate-900 mt-4">{f.title}</h3>
              <p className="text-slate-600 mt-2 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why not ChatGPT */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12">
          <h2 className="font-heading text-3xl font-semibold text-slate-900">Why isn't this just an LLM wrapper?</h2>
          <p className="text-slate-600 mt-3 max-w-2xl">A language model can translate text, but video localization requires an entire multimodal pipeline.</p>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="rounded-xl border border-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase">LLM alone</p>
              <div className="mt-3 flex items-center gap-2 text-slate-700 font-medium">Text <ArrowRight className="w-4 h-4 text-slate-300" /> Translation</div>
            </div>
            <div className="rounded-xl border-2 border-pink-200 bg-pink-50/40 p-6">
              <p className="text-xs font-semibold text-maroon-700 uppercase">VoiceLocal</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-slate-700 text-sm font-medium">
                {["Video","Speech Recognition","Transcript","Translation","Voice Generation","Timing Alignment","Subtitles","Final Video"].map((s, i, a) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="bg-white border border-pink-200 rounded-full px-3 py-1">{s}</span>
                    {i < a.length - 1 && <GitBranch className="w-3 h-3 text-pink-300 rotate-90" />}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Link to="/demo" data-testid="cta-try-demo" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-6 py-3 font-semibold hover:scale-[1.03] transition-transform">
              <Play className="w-4 h-4" /> Try the Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
