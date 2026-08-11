import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Waveform } from "../components/Waveform";

const field = "w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-colors outline-none";
const btn = "w-full maroon-gradient text-white rounded-lg py-3 font-semibold hover:opacity-95 transition-opacity disabled:opacity-60";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.token, data.user);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 maroon-gradient text-white">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"><Mic className="w-5 h-5" /></div>
          VoiceLocal
        </Link>
        <div>
          <h2 className="font-heading text-4xl font-bold leading-tight">Reach every<br/>Indian viewer.</h2>
          <p className="mt-4 text-white/80 max-w-sm">Transcription, translation, dubbing and subtitles — powered by a real multimodal pipeline.</p>
          <div className="mt-8"><Waveform active bars={40} /></div>
        </div>
        <p className="text-white/60 text-sm">Join creators localizing for India.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm animate-fade-up">
          <h1 className="font-heading text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-2">Start localizing in minutes.</p>
          <form onSubmit={submit} className="space-y-4 mt-8">
            <input data-testid="signup-name" className={field} placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input data-testid="signup-email" className={field} type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input data-testid="signup-password" className={field} type="password" placeholder="Password (min 6 chars)" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button data-testid="signup-submit" className={btn} disabled={loading}>{loading ? "Creating…" : "Create account"}</button>
          </form>
          <p className="mt-4 text-sm text-slate-500">Already have an account? <Link to="/login" className="text-maroon-700 hover:underline">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}
