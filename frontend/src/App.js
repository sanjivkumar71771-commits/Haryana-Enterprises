import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AOS from "aos";
import { Toaster } from "sonner";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProcessingLoader from "@/components/ProcessingLoader";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import SolarApply from "@/pages/SolarApply";
import LoanApply from "@/pages/LoanApply";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Downloads from "@/pages/Downloads";
import Notices from "@/pages/Notices";
import Gallery from "@/pages/Gallery";
import StatusLookup from "@/pages/StatusLookup";
import AuthCallback from "@/pages/AuthCallback";
import AdminPanel from "@/pages/AdminPanel";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import CSCServices from "@/pages/CSCServices";
import CSCApply from "@/pages/CSCApply";
import MicroIrrigation from "@/pages/MicroIrrigation";
import IrrigationApply from "@/pages/IrrigationApply";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const Protected = ({ children }) => {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!user || user === false) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
};

/** Router that synchronously detects Emergent Auth session_id in URL hash. */
function AppRouter() {
  const location = useLocation();
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/solar/apply" element={<SolarApply />} />
      <Route path="/loan/apply" element={<LoanApply />} />
      <Route path="/csc" element={<CSCServices />} />
      <Route path="/csc/apply" element={<CSCApply />} />
      <Route path="/irrigation" element={<MicroIrrigation />} />
      <Route path="/irrigation/apply" element={<IrrigationApply />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/notices" element={<Notices />} />
      <Route path="/downloads" element={<Downloads />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/status" element={<StatusLookup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/admin" element={<Protected><AdminPanel /></Protected>} />
      <Route path="*" element={
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-6xl font-extrabold text-emerald-400">404</h1>
          <p className="text-slate-400 mt-3">Page not found</p>
        </div>
      } />
    </Routes>
  );
}

function AppInner() {
  useEffect(() => {
    AOS.init({ duration: 700, once: true, offset: 60, easing: "ease-out-cubic" });
  }, []);
  return (
    <div className="App">
      <BrowserRouter>
        <ScrollToTop />
        <ProcessingLoader />
        <Header />
        <main className="flex-1">
          <AppRouter />
        </main>
        <Footer />
      </BrowserRouter>
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
