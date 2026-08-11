import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useA11y } from "../context/A11yContext";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Accessibility } from "lucide-react";

const PAGE_TITLES = {
  "/": "Home",
  "/how-it-works": "How It Works",
  "/features": "Features",
  "/demo": "Demo",
  "/dashboard": "Dashboard",
  "/localize": "Localize",
  "/results": "Results",
  "/history": "History",
  "/analytics": "Analytics",
  "/login": "Log in",
  "/signup": "Sign up",
};

export function AppLayout({ children }) {
  const { screenReader, setScreenReader, announce } = useA11y();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const name = PAGE_TITLES[location.pathname] ||
      (location.pathname.startsWith("/results") ? "Results" : "Page");
    announce(`${name} page`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleScreenReader = () => {
    const next = !screenReader;
    setScreenReader(next);
    if (next) {
      const name = PAGE_TITLES[location.pathname] || "Page";
      setTimeout(() => announce(`Screen reader enabled. You are on the ${name} page.`), 60);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block text-sm text-slate-500">
            AI-powered video localization for every Indian language
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggleScreenReader}
              aria-pressed={screenReader}
              data-testid="screen-reader-toggle"
              className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                screenReader
                  ? "bg-maroon-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Accessibility className="w-4 h-4" />
              Screen Reader: {screenReader ? "ON" : "OFF"}
            </button>
            {user && (
              <div
                className="w-9 h-9 rounded-full pink-gradient text-white flex items-center justify-center text-sm font-bold"
                data-testid="user-avatar"
                title={user.name}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" data-testid="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
