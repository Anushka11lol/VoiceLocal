import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Film, Languages, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { langName } from "../data/languages";

const STAT_META = [
  { key: "videos", icon: Film, label: "Videos Localized", tint: "bg-pink-50 text-maroon-700" },
  { key: "languages", icon: Languages, label: "Languages Generated", tint: "bg-blue-50 text-blue-700" },
  { key: "minutes", icon: Clock, label: "Minutes Processed", tint: "bg-amber-50 text-amber-700" },
  { key: "reach", icon: TrendingUp, label: "Estimated Reach", tint: "bg-emerald-50 text-emerald-700" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data)).catch(() => {});
    api.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
    // Show "Welcome" for a just-created account, then flip to "Welcome back".
    if (sessionStorage.getItem("vl_greeting") === "new") {
      setIsNew(true);
      sessionStorage.setItem("vl_greeting", "returning");
    }
  }, []);

  const firstName = user?.name?.split(" ")[0];
  const greeting = isNew ? "Welcome" : "Welcome back";

  const recent = projects.slice(0, 4).map((p) => ({
    id: p.id, title: p.title, source: p.source_language, target: p.target_languages?.[0], duration: p.duration, status: p.status,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900" data-testid="dashboard-greeting">{greeting}{firstName ? `, ${firstName}` : ""} 👋</h1>
          <p className="text-slate-500 mt-1">{isNew ? "Your account is ready — localize your first video and reach more viewers." : "Localize your next video and reach more viewers."}</p>
        </div>
        <Link to="/localize" data-testid="new-localization-btn" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-6 py-3 font-semibold hover:scale-[1.03] transition-transform">
          <Plus className="w-4 h-4" /> New Localization
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {STAT_META.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-6" data-testid={`stat-${s.key}`}>
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${s.tint}`}><s.icon className="w-5 h-5" /></div>
            <p className="text-3xl font-heading font-bold text-slate-900 mt-4">{stats ? stats[s.key] : "—"}</p>
            <p className="text-sm text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">Your localization statistics, updated from your projects.</p>

      <div className="flex items-center justify-between mt-10 mb-4">
        <h2 className="font-heading text-xl font-semibold text-slate-900">Recent projects</h2>
        {recent.length > 0 && <Link to="/history" className="text-sm text-maroon-700 font-medium inline-flex items-center gap-1 hover:underline">View all <ArrowRight className="w-3.5 h-3.5" /></Link>}
      </div>
      {recent.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center" data-testid="dashboard-empty">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-50 flex items-center justify-center"><Film className="w-6 h-6 text-maroon-700" /></div>
          <p className="font-semibold text-slate-800 mt-4">No localizations yet</p>
          <p className="text-sm text-slate-500 mt-1">Create your first localization and it will show up here.</p>
          <Link to="/localize" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-5 py-2.5 text-sm font-semibold mt-5 hover:scale-[1.03] transition-transform"><Plus className="w-4 h-4" /> New Localization</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recent.map((p, i) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden" data-testid={`dashboard-project-${i}`}>
              <div className="aspect-video bg-slate-900 flex items-center justify-center"><Film className="w-6 h-6 text-white/60" /></div>
              <div className="p-4">
                <p className="font-semibold text-slate-800 text-sm truncate">{p.title}</p>
                <p className="text-xs text-slate-500 mt-1">{langName(p.source)} → {langName(p.target)}</p>
                <div className="flex items-center justify-between mt-2 text-xs"><span className="text-slate-400">{p.duration}</span><span className="text-emerald-600 font-medium">{p.status} ✓</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
