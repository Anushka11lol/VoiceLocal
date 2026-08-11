import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Waveform } from "../components/Waveform";

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 maroon-gradient text-white">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          VoiceLocal
        </Link>
        <div>
          <h2 className="font-heading text-4xl font-bold leading-tight">One Video.<br/>Every Voice.</h2>
          <p className="mt-4 text-white/80 max-w-sm">Turn your videos into multilingual experiences across all 22 official Indian languages.</p>
          <div className="mt-8"><Waveform active bars={40} /></div>
        </div>
        <p className="text-white/60 text-sm">Built for India's multilingual audience.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-sm animate-fade-up">
          <h1 className="font-heading text-3xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

const field = "w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-colors outline-none";
const btn = "w-full maroon-gradient text-white rounded-lg py-3 font-semibold hover:opacity-95 transition-opacity disabled:opacity-60";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token, data.user);
      sessionStorage.setItem("vl_greeting", "returning");
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Log in" subtitle="Access your localization dashboard.">
      <form onSubmit={submit} className="space-y-4">
        <input data-testid="login-email" className={field} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input data-testid="login-password" className={field} type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button data-testid="login-submit" className={btn} disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
      </form>
      <div className="flex justify-between mt-4 text-sm">
        <Link to="/forgot-password" className="text-maroon-700 hover:underline">Forgot password?</Link>
        <Link to="/signup" className="text-maroon-700 hover:underline">Create account</Link>
      </div>
    </AuthShell>
  );
}
