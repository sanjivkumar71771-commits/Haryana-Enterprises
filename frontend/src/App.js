import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AOS from "aos";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";

import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProcessingLoader from "@/components/ProcessingLoader";

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Enquiry from "@/pages/Enquiry";
import Contact from "@/pages/Contact";
import FAQ from "@/pages/FAQ";
import Downloads from "@/pages/Downloads";
import Notices from "@/pages/Notices";
import Gallery from "@/pages/Gallery";
import Vacancies from "@/pages/Vacancies";
import VacancyDetail from "@/pages/VacancyDetail";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/enquiry" element={<Enquiry />} />
      <Route path="/solar/apply" element={<Navigate to="/enquiry" replace />} />
      <Route path="/loan/apply" element={<Navigate to="/enquiry?service=Solar%20Financing%20Information" replace />} />
      <Route path="/csc" element={<Navigate to="/services" replace />} />
      <Route path="/csc/apply" element={<Navigate to="/enquiry" replace />} />
      <Route path="/irrigation" element={<Navigate to="/services" replace />} />
      <Route path="/irrigation/apply" element={<Navigate to="/enquiry" replace />} />
      <Route path="/vacancies" element={<Vacancies />} />
      <Route path="/vacancies/:id" element={<VacancyDetail />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/notices" element={<Notices />} />
      <Route path="/downloads" element={<Downloads />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Navigate to="/enquiry" replace />} />
      <Route path="/register" element={<Navigate to="/enquiry" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/status" element={<Navigate to="/contact" replace />} />
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
    <HelmetProvider>
      <I18nProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </I18nProvider>
    </HelmetProvider>
  );
}

export default App;
