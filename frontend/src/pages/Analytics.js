import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#800000", "#FF66B2", "#3B82F6", "#F59E0B"];

const FALLBACK = {
  languages_used: [{ name: "Bengali", value: 42 }, { name: "Assamese", value: 28 }, { name: "Tamil", value: 15 }, { name: "Others", value: 15 }],
  reach_trend: [{ week: "W1", reach: 120 }, { week: "W2", reach: 210 }, { week: "W3", reach: 260 }, { week: "W4", reach: 380 }, { week: "W5", reach: 520 }, { week: "W6", reach: 690 }],
  activity: [{ week: "Mon", count: 2 }, { week: "Tue", count: 4 }, { week: "Wed", count: 3 }, { week: "Thu", count: 6 }, { week: "Fri", count: 5 }, { week: "Sat", count: 8 }, { week: "Sun", count: 4 }],
};

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h2 className="font-heading font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(FALLBACK);

  useEffect(() => {
    api.get("/analytics").then(({ data }) => setData(data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-up">
      <h1 className="font-heading text-3xl font-bold text-slate-900">Analytics</h1>
      <p className="text-slate-500 mt-1">Insights into your localization activity. <span className="text-slate-400">(Demo data)</span></p>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <Card title="Languages Used">
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
        </Card>

        <Card title="Audience Reach">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.reach_trend}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF66B2" stopOpacity={0.5} /><stop offset="100%" stopColor="#FF66B2" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
              <Area type="monotone" dataKey="reach" stroke="#800000" strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Localization Activity">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.activity}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip />
              <Bar dataKey="count" fill="#800000" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Highlights">
          <div className="space-y-4">
            {[["Most localized language", "Bengali"], ["Avg. processing time", "6.2 sec"], ["Completion rate", "100%"], ["Languages supported", "22"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-sm text-slate-500">{k}</span><span className="font-semibold text-slate-800">{v}</span></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
