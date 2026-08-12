import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Plus } from "lucide-react";
import { api } from "../lib/api";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#b0455b", "#FF66B2", "#3B82F6", "#F59E0B"];

const EMPTY = { stats: { videos: 0 }, languages_used: [], reach_trend: [], activity: [], highlights: {} };

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="font-heading font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get("/analytics")
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const hasData = (data.stats?.videos || 0) > 0;

  if (loaded && !hasData) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-up">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Insights into your localization activity.</p>
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center mt-8" data-testid="analytics-empty">
          <div className="w-12 h-12 mx-auto rounded-full bg-pink-50 flex items-center justify-center"><BarChart3 className="w-6 h-6 text-maroon-700" /></div>
          <p className="font-semibold text-slate-800 mt-4">No analytics yet</p>
          <p className="text-sm text-slate-500 mt-1">Localize a few videos and your insights will appear here.</p>
          <Link to="/localize" className="inline-flex items-center gap-2 maroon-gradient text-white rounded-full px-5 py-2.5 text-sm font-semibold mt-5 hover:scale-[1.03] transition-transform"><Plus className="w-4 h-4" /> New Localization</Link>
        </div>
      </div>
    );
  }

  const highlights = data.highlights || {};

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-up">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Analytics</h1>
      <p className="text-slate-500 mt-1">Insights from your own localization activity.</p>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <Card title="Languages Used">
          {data.languages_used.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">No languages generated yet.</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={data.languages_used} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {data.languages_used.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {data.languages_used.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-slate-600">{l.name} — {l.value}%</span></div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Audience Reach">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.reach_trend}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF66B2" stopOpacity={0.5} /><stop offset="100%" stopColor="#FF66B2" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
              <Area type="monotone" dataKey="reach" stroke="#b0455b" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Localization Activity">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.activity}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip />
              <Bar dataKey="count" fill="#b0455b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Highlights">
          <div className="space-y-4">
            {[
              ["Videos localized", String(data.stats?.videos ?? 0)],
              ["Most localized language", highlights.most_language || "—"],
              ["Languages generated", String(data.stats?.languages ?? 0)],
              ["Completion rate", highlights.completion_rate || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-sm text-slate-500">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
