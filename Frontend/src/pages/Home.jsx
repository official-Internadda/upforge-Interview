import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiShield, FiTerminal, FiAward, FiArrowRight, FiCpu, FiCode } from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("Software Engineer");

  const roles = [
    { title: "Software Engineer", slug: "software-engineer", desc: "Data structures, System Architecture, APIs & Microservices" },
    { title: "Data Analyst", slug: "data-analyst", desc: "SQL queries, Pandas, Data Cleaning, Statistical Models" },
    { title: "Frontend Engineer", slug: "frontend-engineer", desc: "React, Next.js, State Lifecycle, DOM & CSS Optimization" },
    { title: "AI & ML Intern", slug: "ai-ml-intern", desc: "Transformers, Model Fine-Tuning, PyTorch & Vector Databases" },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-indigo-950/40 border-b border-indigo-900/50 py-2 text-center text-xs text-indigo-300 font-medium tracking-wide">
        ⚡ Powered by InternAdda Technical Infrastructure • Official Hiring Assessment Partner of UpForge
      </div>

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-[#0c1222]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="/logo.jpg" alt="InternAdda" className="h-10 w-auto rounded-lg object-contain shadow" />
            <div className="h-6 w-[1px] bg-slate-700"></div>
            <img src="/upforge.jpg" alt="UpForge" className="h-8 w-auto rounded object-contain" />
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#roles" className="hover:text-white transition">Assessment Tracks</a>
            <a href="#methodology" className="hover:text-white transition">Integrity & Proctoring</a>
            <a href="#partner" className="hover:text-white transition">UpForge Network</a>
          </nav>

          <button
            onClick={() => {
              const element = document.getElementById("roles");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
          >
            Take Assessment
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-medium text-slate-300 mb-6 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live Industry Standard AI Technical Screener</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-[1.15]">
            Prove Your Engineering Competence. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
              Get Fast-Tracked for UpForge Internships.
            </span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            InternAdda's automated 30-minute terminal examination platform conducts hands-on coding, algorithmic, and architecture challenges with real-time browser integrity screening.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/test/software-engineer")}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-base shadow-xl shadow-indigo-600/25 transition-all flex items-center space-x-2 active:scale-95"
            >
              <span>Launch Terminal Assessment</span>
              <FiArrowRight />
            </button>
            <a
              href="#methodology"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl font-semibold text-base transition"
            >
              How It Works
            </a>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            {[
              { icon: <FiTerminal className="text-indigo-400" />, title: "Real CLI Environment", desc: "No voice lag; write and format answers directly." },
              { icon: <FiShield className="text-emerald-400" />, title: "Automated Proctoring", desc: "Hardware webcam & window blur enforcement." },
              { icon: <FiCpu className="text-sky-400" />, title: "Resume-Aware AI", desc: "Cross-examined strictly on your actual projects." },
              { icon: <FiAward className="text-amber-400" />, title: "Certified Report", desc: "1-10 rubric metrics sent to UpForge recruiters." },
            ].map((feature, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
                <div className="text-xl mb-2">{feature.icon}</div>
                <h4 className="text-sm font-bold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-slate-400 leading-normal">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles Selection Section */}
        <section id="roles" className="py-20 border-t border-slate-800 bg-[#090e1a]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-white tracking-tight">Active Assessment Tracks</h2>
              <p className="text-slate-400 text-sm mt-2">Select your targeted domain to initialize the 30-minute terminal challenge.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roles.map((role, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/test/${role.slug}`)}
                  className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        UpForge Verified Track
                      </span>
                      <span className="text-xs font-mono text-slate-500">Fee: ₹29</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition">{role.title}</h3>
                    <p className="text-sm text-slate-400 mt-2">{role.desc}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs font-semibold text-slate-300">
                    <span>10 Hard Technical Questions</span>
                    <span className="text-indigo-400 flex items-center group-hover:translate-x-1 transition">
                      Start Test <FiArrowRight className="ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proctoring & Integrity */}
        <section id="methodology" className="py-20 border-t border-slate-800 max-w-5xl mx-auto px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-slate-800 text-center">
            <FiShield className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Zero-Tolerance Anti-Cheating System</h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Every assessment is proctored via real-time camera tracking and browser tab-visibility hooks. Three window switches permanently terminates the session and rejects the application.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-300 font-medium">
              <span className="flex items-center"><FiCheckCircle className="text-emerald-400 mr-2" /> Live Facial Proctoring</span>
              <span className="flex items-center"><FiCheckCircle className="text-emerald-400 mr-2" /> Single-Window Lockdown</span>
              <span className="flex items-center"><FiCheckCircle className="text-emerald-400 mr-2" /> Strict 30-Minute Timer</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer & Secret Admin Access */}
      <footer className="border-t border-slate-800/80 bg-[#050811] py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-400">InternAdda Assessment Engine</span>
            <span>•</span>
            <span>Hiring Network of UpForge</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-600">© 2026 InternAdda. All rights reserved.</span>
            {/* Secret discreet link for Admin Console */}
            <button
              onClick={() => navigate("/login")}
              title="Admin Portal"
              className="text-slate-700 hover:text-slate-400 transition"
            >
              π
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
