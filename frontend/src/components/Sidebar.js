import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home, Workflow, Sparkles, PlayCircle, LayoutDashboard,
  Wand2, History, BarChart3, LogOut, Mic,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/how-it-works", label: "How It Works", icon: Workflow },
  { to: "/features", label: "Features", icon: Sparkles },
  { to: "/demo", label: "Demo", icon: PlayCircle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/localize", label: "Localize", icon: Wand2 },
  { to: "/history", label: "History", icon: History },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className="w-64 shrink-0 bg-white border-r border-slate-200 h-full flex flex-col"
      aria-label="Primary navigation"
    >
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl maroon-gradient flex items-center justify-center">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <span className="font-heading font-bold text-lg text-slate-900">
          Voice<span className="text-maroon-700">Local</span>
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-pink-50 text-maroon-700 font-semibold border-r-4 border-maroon-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        {user ? (
          <button
            data-testid="sidebar-logout-btn"
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" /> Log out
          </button>
        ) : (
          <button
            data-testid="sidebar-login-btn"
            onClick={() => navigate("/login")}
            className="w-full maroon-gradient text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-95 transition-opacity"
          >
            Try VoiceLocal
          </button>
        )}
      </div>
    </aside>
  );
}
