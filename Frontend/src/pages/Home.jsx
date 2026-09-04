import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiArrowRight,
  FiCheck,
  FiAward,
  FiCpu,
  FiTerminal,
  FiActivity,
  FiLock,
  FiFileText,
  FiUsers,
  FiDatabase,
  FiLayers
} from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [metricCounter, setMetricCounter] = useState(14820);

  useEffect(() => {
    const timer = setInterval(() => {
      setMetricCounter((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const assessmentTracks = [
    {
      title: "Core Software Engineering",
      slug: "software-engineer",
      category: "engineering",
      level: "Level 1-3 Assessed",
      desc: "Algorithmic complexity, concurrency, distributed API structures & race-condition evaluation.",
      topics: ["Data Structures", "System Design", "SQL/NoSQL", "REST/gRPC"],
      time: "30 Min Proctored",
      hiringIndex: "98.4% Match Rate"
    },
    {
      title: "Enterprise Data & Analytics",
      slug: "data-analyst",
      category: "data",
      level: "Associate to Senior",
      desc: "Advanced multi-table window functions, data hygiene pipelines, statistical inference & Pandas logic.",
      topics: ["PostgreSQL", "Pandas", "Statistical Modeling", "ETL Pipelines"],
      time: "30 Min Proctored",
      hiringIndex: "96.8% Match Rate"
    },
    {
      title: "Modern Frontend Engineering",
      slug: "frontend-engineer",
      category: "engineering",
      level: "Production Grade",
      desc: "Reactivity paradigms, virtual memory profiling, Next.js hydration cycles & edge rendering.",
      topics: ["React 19 Core", "TypeScript AST", "State Orchestration", "Web Vitals"],
      time: "30 Min Proctored",
      hiringIndex: "99.1% Match Rate"
    },
    {
      title: "Machine Learning & AI Intern",
      slug: "ai-ml-intern",
      category: "ai",
      level: "R&D Fellowship",
      desc: "Attention mechanisms, quantization, token evaluation matrices, PyTorch tensor graph mechanics.",
      topics: ["PyTorch", "LLM Inference", "Embeddings", "Vector Search"],
      time: "30 Min Proctored",
      hiringIndex: "94.7% Match Rate"
    }
  ];

  const filteredTracks =
    activeTab === "all"
      ? assessmentTracks
      : assessmentTracks.filter((t) => t.category === activeTab);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans antialiased selection:bg-[#2563EB] selection:text-white relative overflow-hidden">
      {/* Animated Subtle Ambient Dot Grid Canvas */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.45]"
        style={{
          backgroundImage: `radial-gradient(#CBD5E1 1.1px, transparent 1.1px)`,
          backgroundSize: "28px 28px"
        }}
      />

      {/* Trust Notification Header */}
      <div className="relative z-20 bg-white border-b border-[#E2E8F0] py-2 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#475569]">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[10px] tracking-wider uppercase">
              Official Infrastructure
            </span>
            <span className="hidden sm:inline text-[#64748B]">
              Standardized Technical Screening Engine under InternAdda Career Framework
            </span>
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px] text-[#334155]">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-[#10B981] mr-1.5 animate-pulse"></span>
              {metricCounter.toLocaleString()} Candidates Verified
            </span>
            <span className="hidden md:inline text-[#94A3B8]">|</span>
            <span className="hidden md:inline font-sans text-[#64748B]">ISO 9001:2015 Integrity Aligned</span>
          </div>
        </div>
      </div>

      {/* Main Enterprise Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E2E8F0]/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.jpg"
                alt="InternAdda Logo"
                className="h-9 w-auto rounded-lg object-contain shadow-sm border border-[#E2E8F0]"
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-[#0F172A] leading-tight">
                  InternAdda
                </span>
                <span className="text-[10px] font-bold text-[#64748B] tracking-wider uppercase">
                  Assessment Engine
                </span>
              </div>
            </div>

            <div className="h-7 w-[1px] bg-[#CBD5E1]" />

            <div className="flex items-center space-x-2">
              <img
                src="/upforge.jpg"
                alt="UpForge Logo"
                className="h-7 w-auto object-contain rounded"
              />
              <span className="hidden lg:inline-flex items-center text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                Official Hiring Partner
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-[#475569]">
            <a href="#standards" className="hover:text-[#0F172A] transition">
              Evaluation Rubric
            </a>
            <a href="#tracks" className="hover:text-[#0F172A] transition">
              Technical Tracks
            </a>
            <a href="#proctoring" className="hover:text-[#0F172A] transition">
              Integrity Standards
            </a>
            <a href="#credentials" className="hover:text-[#0F172A] transition">
              Accreditations
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <span>Explore Tracks</span>
              <FiArrowRight className="ml-2 w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm text-xs font-semibold text-[#0F172A]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2563EB]"></span>
                </span>
                <span>Automated Technical Competency Gateway 2026</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                Standardized Technical Evaluations.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#4F46E5]">
                  Certified Direct to UpForge.
                </span>
              </h1>

              <p className="text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
                Eliminate unverified claims and superficial screening. Complete InternAdda’s proctored 30-minute interactive technical terminal to demonstrate algorithmic depth, real code execution, and architectural reasoning.
              </p>

              {/* Primary Call to Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <button
                  onClick={() => navigate("/test/software-engineer")}
                  className="px-8 py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold rounded-xl shadow-[0_10px_25px_-5px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center space-x-2 text-base active:scale-95"
                >
                  <span>Begin Terminal Assessment</span>
                  <FiArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    document.getElementById("standards")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-7 py-4 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] font-semibold rounded-xl transition shadow-sm flex items-center justify-center space-x-2 text-base"
                >
                  <span>Review Protocol</span>
                </button>
              </div>

              {/* Trust Metric Badges */}
              <div className="pt-6 border-t border-[#E2E8F0] grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-2xl font-extrabold text-[#0F172A] font-mono">100%</div>
                  <div className="text-xs font-medium text-[#64748B] mt-0.5">Objective Code Scoring</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0F172A] font-mono">30 Min</div>
                  <div className="text-xs font-medium text-[#64748B] mt-0.5">Strict Proctored Window</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-[#0F172A] font-mono">₹29.00</div>
                  <div className="text-xs font-medium text-[#64748B] mt-0.5">Direct Cloud Processing</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Telemetry Console Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-lg">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#2563EB]/15 to-[#4F46E5]/15 blur-xl opacity-80" />
                <div className="relative rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl p-7 space-y-6">
                  {/* Console Header */}
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                      <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                      <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                      <span className="font-mono text-xs font-bold text-[#64748B] ml-2">
                        UPFORGE_INTEGRITY_DAEMON
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[10px] font-mono font-bold border border-[#BFDBFE]">
                      LIVE ENFORCEMENT
                    </span>
                  </div>

                  {/* Dynamic Feed Item */}
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                      <div className="flex justify-between text-[#64748B] text-[10px]">
                        <span>CANDIDATE TELEMETRY</span>
                        <span className="text-[#10B981] font-bold">SECURE_ACTIVE</span>
                      </div>
                      <div className="text-[#0F172A] font-semibold">
                        Role: Senior Data Engineering Track
                      </div>
                      <div className="text-[#64748B] text-[11px]">
                        Resume Contextual Extraction: 100% Parsed
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                      <div className="flex justify-between text-[#64748B] text-[10px]">
                        <span>ANTI-CHEATING PROCTOR</span>
                        <span className="text-[#2563EB] font-bold">0 STRIKES</span>
                      </div>
                      <div className="text-[#334155] flex items-center space-x-2">
                        <FiCheck className="text-[#10B981]" />
                        <span>Webcam Hardware Feed Locked</span>
                      </div>
                      <div className="text-[#334155] flex items-center space-x-2">
                        <FiCheck className="text-[#10B981]" />
                        <span>Single Window Blur Tracking Active</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-between text-[#1E40AF]">
                      <span className="text-[11px] font-semibold">API Evaluation Processing:</span>
                      <span className="font-bold">₹29 Flat Fee via Cashfree</span>
                    </div>
                  </div>

                  {/* Direct Launch Button */}
                  <button
                    onClick={() => navigate("/test/software-engineer")}
                    className="w-full py-3.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md transition"
                  >
                    <FiTerminal className="w-4 h-4" />
                    <span>Initialize Candidate Environment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Tracks Selection */}
        <section id="tracks" className="py-20 bg-white border-y border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
              <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">
                Curated Career Pathways
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Select Your Assessment Domain
              </h2>
              <p className="text-[#475569] text-sm leading-relaxed">
                Every track features 10 real-world engineering, query optimization, or structural architecture challenges synthesized directly from candidate experience.
              </p>

              {/* Filter Tabs */}
              <div className="inline-flex p-1 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] mt-4">
                {["all", "engineering", "data", "ai"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      activeTab === tab
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    {tab === "all" ? "All Domains" : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Assessment Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredTracks.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/test/${track.slug}`)}
                  className="group relative rounded-3xl bg-[#FAFAFA] border border-[#E2E8F0] p-8 hover:border-[#2563EB] hover:bg-white hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] border border-[#BFDBFE]">
                        {track.level}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#10B981] flex items-center">
                        <FiActivity className="mr-1" /> {track.hiringIndex}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-[#0F172A] group-hover:text-[#2563EB] transition">
                      {track.title}
                    </h3>
                    <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                      {track.desc}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {track.topics.map((t, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white border border-[#E2E8F0] text-[#334155]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#64748B] font-mono">{track.time}</span>
                    <span className="text-[#2563EB] font-bold flex items-center group-hover:translate-x-1.5 transition">
                      Enter Assessment <FiArrowRight className="ml-1.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proctoring & Integrity Architecture */}
        <section id="proctoring" className="py-20 bg-[#FAFAFA]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
              <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">
                Enterprise Proctoring Shield
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                Designed for Absolute Credibility
              </h2>
              <p className="text-[#475569] text-sm">
                UpForge hiring teams demand uncompromised veracity. Every session is protected with automated hardware and software telemetry.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <FiShield className="w-8 h-8 text-[#2563EB]" />,
                  title: "Hardware Camera Stream",
                  desc: "Local, real-time facial boundary detection without server recording overhead. Verifies single applicant continuity."
                },
                {
                  icon: <FiLock className="w-8 h-8 text-[#4F46E5]" />,
                  title: "3-Strike Tab Guard",
                  desc: "Window blur and visibility change handlers trigger strict warnings. Three instances automatically terminates the attempt."
                },
                {
                  icon: <FiCpu className="w-8 h-8 text-[#059669]" />,
                  title: "Dynamic Cross-Examination",
                  desc: "The AI examiner validates real-time code submissions, questioning specific trade-offs and complexity calculations."
                }
              ].map((p, idx) => (
                <div
                  key={idx}
                  className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition text-left space-y-4"
                >
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] inline-block">
                    {p.icon}
                  </div>
                  <h4 className="text-lg font-bold text-[#0F172A]">{p.title}</h4>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Accreditations & Trust Pillars */}
        <section id="credentials" className="py-16 bg-white border-t border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="p-8 sm:p-12 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 text-left">
                <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                  <FiAward />
                  <span>Institutional Alignment</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#0F172A]">
                  Verified Assessment Registry
                </h3>
                <p className="text-sm text-[#475569] max-w-xl leading-relaxed">
                  Upon completion, candidate evaluations are directly archived in the UpForge Talent Ledger, allowing verified hiring teams to review line-by-line responses and score indices without secondary rounds.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="px-5 py-4 bg-white rounded-2xl border border-[#CBD5E1] shadow-sm text-center">
                  <div className="text-xs font-bold text-[#0F172A]">Cashfree PG</div>
                  <div className="text-[10px] text-[#10B981] font-semibold">256-Bit SSL Secured</div>
                </div>
                <div className="px-5 py-4 bg-white rounded-2xl border border-[#CBD5E1] shadow-sm text-center">
                  <div className="text-xs font-bold text-[#0F172A]">UpForge Registry</div>
                  <div className="text-[10px] text-[#2563EB] font-semibold">Certified Partner</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Corporate Clean Light Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-12 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img src="/logo.jpg" alt="Logo" className="h-7 w-auto rounded object-contain" />
            <span className="font-semibold text-[#334155]">
              InternAdda Career Innovations
            </span>
            <span>•</span>
            <span>UpForge Strategic Ecosystem</span>
          </div>

          <div className="flex items-center space-x-6 font-medium">
            <span>Privacy Standard</span>
            <span>Terms of Assessment</span>
            <span className="text-[#94A3B8]">|</span>
            <span>© 2026 InternAdda. All rights reserved.</span>

            {/* Discreet Admin Portal Button */}
            <button
              onClick={() => navigate("/login")}
              title="Recruiter Console"
              className="text-[#CBD5E1] hover:text-[#475569] transition font-mono text-sm"
            >
              ⚙
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
