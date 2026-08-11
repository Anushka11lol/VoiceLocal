import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Film, Plus, Eye, Download } from "lucide-react";
import { api } from "../lib/api";
import { langName, DEMO_PROJECTS } from "../data/languages";

export default function History() {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data)).catch(() => setProjects([]));
  }, []);

  const list = (projects && projects.length ? projects.map((p) => ({
    title: p.title, source: p.source_language, target: p.target_languages?.[0], duration: p.duration, status: p.status, date: p.created_at?.slice(0, 10),
  })) : DEMO_PROJECTS.map((p) => ({ ...p, date: "2026-06-01" })));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Localization History</h1>
          <p className="text-slate-500 mt-1">All your localized projects in one place.</p>
        </div>
        <Link to="/localize" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-6 py-3 font-semibold hover:scale-[1.03] transition-transform"><Plus className="w-4 h-4" /> New Localization</Link>
      </div>

      {projects === null ? (
        <p className="text-slate-400 mt-10">Loading…</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5 mt-8">
          {list.map((p, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 flex gap-4" data-testid={`history-card-${i}`}>
              <div className="w-28 h-20 rounded-lg bg-slate-900 flex items-center justify-center shrink-0"><Film className="w-6 h-6 text-white/60" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{langName(p.source)} → {langName(p.target)}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.date} · {p.duration} · <span className="text-emerald-600">{p.status} ✓</span></p>
                <div className="flex gap-2 mt-2">
                  <Link to="/results" className="inline-flex items-center gap-1 text-xs bg-slate-100 rounded-full px-3 py-1 hover:bg-slate-200 transition-colors"><Eye className="w-3 h-3" /> View</Link>
                  <button onClick={() => toast.success("Download started (demo).")} className="inline-flex items-center gap-1 text-xs bg-pink-50 text-maroon-700 rounded-full px-3 py-1 hover:bg-pink-100 transition-colors"><Download className="w-3 h-3" /> Download</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
