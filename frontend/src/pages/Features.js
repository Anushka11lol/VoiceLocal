import { MapPin, Layers, GitMerge, Heart, Accessibility } from "lucide-react";

const CARDS = [
  { icon: MapPin, title: "Built for India", desc: "Designed around India's multilingual ecosystem and all 22 scheduled languages." },
  { icon: Layers, title: "Beyond Translation", desc: "Localizes the complete video experience — voice, timing and subtitles, not just text." },
  { icon: GitMerge, title: "Preserve Context", desc: "Maintains timing, meaning and conversational flow across languages." },
  { icon: Heart, title: "Creator Friendly", desc: "Designed for individual creators, not enterprise localization teams." },
  { icon: Accessibility, title: "Accessibility First", desc: "Makes educational and informational content accessible across language barriers." },
];

export default function Features() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <h1 className="font-heading text-4xl font-bold text-slate-900">Why VoiceLocal?</h1>
      <p className="text-slate-600 mt-3 max-w-2xl">More than a translation tool — a localization platform tuned for India's creators.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {CARDS.map((c) => (
          <div key={c.title} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6">
            <div className="w-11 h-11 rounded-lg bg-pink-50 flex items-center justify-center"><c.icon className="w-5 h-5 text-maroon-700" /></div>
            <h3 className="font-heading text-lg font-semibold text-slate-900 mt-4">{c.title}</h3>
            <p className="text-slate-600 mt-2 text-sm">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
