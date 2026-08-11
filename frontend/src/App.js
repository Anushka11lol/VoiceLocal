import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { A11yProvider } from "@/context/A11yContext";
import { AppLayout } from "@/components/AppLayout";

import Landing from "@/pages/Landing";
import HowItWorks from "@/pages/HowItWorks";
import Features from "@/pages/Features";
import Demo from "@/pages/Demo";
import Dashboard from "@/pages/Dashboard";
import Localize from "@/pages/Localize";
import Results from "@/pages/Results";
import HistoryPage from "@/pages/History";
import Analytics from "@/pages/Analytics";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";

function Protected({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="p-10 text-slate-500">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function Shell({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <A11yProvider>
          <AuthProvider>
            <Toaster position="top-center" richColors />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/" element={<Shell><Landing /></Shell>} />
              <Route path="/how-it-works" element={<Shell><HowItWorks /></Shell>} />
              <Route path="/features" element={<Shell><Features /></Shell>} />
              <Route path="/demo" element={<Shell><Demo /></Shell>} />
              <Route path="/localize" element={<Shell><Localize /></Shell>} />
              <Route path="/results/:id?" element={<Shell><Results /></Shell>} />

              <Route path="/dashboard" element={<Protected><Shell><Dashboard /></Shell></Protected>} />
              <Route path="/history" element={<Protected><Shell><HistoryPage /></Shell></Protected>} />
              <Route path="/analytics" element={<Protected><Shell><Analytics /></Shell></Protected>} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </A11yProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
