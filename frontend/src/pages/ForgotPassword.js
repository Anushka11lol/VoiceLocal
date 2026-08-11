import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";

const field = "w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-colors outline-none";
const btn = "w-full maroon-gradient text-white rounded-lg py-3 font-semibold hover:opacity-95 transition-opacity disabled:opacity-60";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent (check your inbox).");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Reset password</h1>
        <p className="text-slate-500 mt-2">We'll email you a link to reset your password.</p>
        {sent ? (
          <div className="mt-8 rounded-xl border border-pink-200 bg-pink-50 p-5 text-slate-700" data-testid="forgot-sent">
            If an account exists for <b>{email}</b>, a reset link is on its way.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-8">
            <input data-testid="forgot-email" className={field} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button data-testid="forgot-submit" className={btn}>Send reset link</button>
          </form>
        )}
        <p className="mt-4 text-sm"><Link to="/login" className="text-maroon-700 hover:underline">Back to log in</Link></p>
      </div>
    </div>
  );
}
