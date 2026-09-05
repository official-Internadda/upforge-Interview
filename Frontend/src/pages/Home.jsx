import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiShield,
  FiCode,
  FiDatabase,
  FiTrendingUp,
  FiLayout,
  FiTerminal,
  FiAward,
  FiClock,
  FiVideo,
  FiAlertTriangle,
  FiRotateCcw,
  FiCpu,
  FiFileText,
  FiUsers,
  FiLock,
  FiHelpCircle,
  FiMenu,
  FiX
} from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const partners = [
    { name: "Arjuna AI", tag: "AI / LLM Research Partner", emblem: "AA" },
    { name: "Strives Studio", tag: "Creative Tech & Media", emblem: "SS" },
    { name: "UpForge", tag: "Venture & Startup Registry", emblem: "UF" },
    { name: "CodeVanguard", tag: "Full-Stack & Cloud Systems", emblem: "CV" },
    { name: "DataNexus Labs", tag: "Enterprise Analytics", emblem: "DN" },
  ];

  const tracks = [
    {
      title: "Full Stack Web Development",
      slug: "full-stack-web-development",
      category: "tech",
      icon: <FiCode className="w-6 h-6 text-blue-600" />,
      desc: "Component lifecycles, REST APIs, asynchronous database queries, state management, and edge deployment logic.",
      questions: "10 Direct Technical Questions",
      duration: "30 Minutes",
      topics: ["React / Next.js", "Node.js", "MongoDB / SQL", "System Architecture"]
    },
    {
      title: "Core Software Engineering",
      slug: "software-engineer",
      category: "tech",
      icon: <FiTerminal className="w-6 h-6 text-slate-800" />,
      desc: "Algorithmic runtime analysis, data structure trade-offs, concurrency, memory bottlenecks, and defensive coding.",
      questions: "10 Direct Technical Questions",
      duration: "30 Minutes",
      topics: ["DSA Logic", "Time Complexity", "OOP Patterns", "Edge-Case Testing"]
    },
    {
      title: "Data Analytics & SQL",
      slug: "data-analyst",
      category: "data",
      icon: <FiDatabase className="w-6 h-6 text-emerald-600" />,
      desc: "Advanced multi-table joins, subqueries, Pandas matrix operations, ETL hygiene, and statistical interpretation.",
      questions: "10 Direct Technical Questions",
      duration: "30 Minutes",
      topics: ["PostgreSQL", "Pandas", "ETL Pipelines", "Business Metrics"]
    },
    {
      title: "Social Media & Growth Marketing",
      slug: "social-media-marketing",
      category: "marketing",
      icon: <FiTrendingUp className="w-6 h-6 text-rose-600" />,
      desc: "Acquisition funnels, ROAS metrics, audience retention curves, viral hook architectures, and budget allocations.",
      questions: "10 Scenario Questions",
      duration: "30 Minutes",
      topics: ["Performance Ads", "Funnel Conversion", "ROAS / CAC", "Viral Strategy"]
    },
    {
      title: "UI/UX & Product Design",
      slug: "ui-ux-design",
      category: "design",
      icon: <FiLayout className="w-6 h-6 text-purple-600" />,
      desc: "Design system hierarchies, Figma component tokens, usability heuristics, wireframing, and interactive prototyping.",
      questions: "10 Practical Questions",
      duration: "30 Minutes",
      topics: ["Figma Systems", "UX Heuristics", "Information Architecture", "User Journeys"]
    }
  ];

  const filteredTracks =
    activeTab === "all" ? tracks : tracks.filter((t) => t.category === activeTab);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Corporate Status Ribbon */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-white">InternAdda Standardized Assessment Gateway</span>
            <span className="text-slate-500">•</span>
            <span>Talent Pipeline for Arjuna AI, Strives Studio, UpForge & Partners</span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-400">
            <span>Verified Proctored Sandbox</span>
            <span>|</span>
            <span>internadda.com</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.jpg"
              alt="InternAdda"
              className="h-10 w-auto rounded-lg object-contain border border-slate-200 shadow-sm"
            />
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight">
              InternAdda <span className="text-blue-600 font-bold text-xs uppercase block tracking-wider">Assessment Engine</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition">How It Works</a>
            <a href="#tracks" className="hover:text-blue-600 transition">Assessment Tracks</a>
            <a href="#proctoring" className="hover:text-blue-600 transition">Proctoring & Rules</a>
            <a href="#refund-policy" className="hover:text-blue-600 transition">Deposit & Refund</a>
            <a href="#partners" className="hover:text-blue-600 transition">Hiring Partners</a>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => {
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
            >
              Start Assessment
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-3.5 shadow-lg">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700"
            >
              How It Works
            </a>
            <a
              href="#tracks"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700"
            >
              Assessment Tracks
            </a>
            <a
              href="#proctoring"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700"
            >
              Proctoring Standards
            </a>
            <a
              href="#refund-policy"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700"
            >
              Deposit & 100% Refund
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Select Your Assessment Track
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              <FiAward className="text-blue-600" />
              <span>Standardized Independent Evaluation Framework 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Real Technical Proof. <br />
              <span className="text-blue-600">Verified by Top Hiring Teams.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Paper resumes don't reflect live engineering competence. InternAdda’s automated 30-minute terminal challenge cross-examines candidates on their actual resume stack under hardware webcam proctoring.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => {
                  document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Launch Assessment Track</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how-it-works"
                className="px-7 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-center transition"
              >
                Assessment Methodology
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-black text-slate-900 font-mono">30 Min</div>
                <div className="text-xs text-slate-500 mt-0.5">Hardware-Proctored Window</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 font-mono">10 Turns</div>
                <div className="text-xs text-slate-500 mt-0.5">Progressive Technical Depth</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600 font-mono">100%</div>
                <div className="text-xs text-slate-500 mt-0.5">Refundable Security Deposit</div>
              </div>
            </div>
          </div>

          {/* Hero Live Spec Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assessment Architecture
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active Sandbox
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center">
                    <FiTerminal className="w-4 h-4 text-blue-600 mr-1.5" />
                    Distraction-Free Command Buffer
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    No voice recognition bugs or microphone lag. You formulate and write code, schema queries, and architectural explanations directly.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center">
                    <FiVideo className="w-4 h-4 text-emerald-600 mr-1.5" />
                    Hardware Eye & Tab-Lock Protocol
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Facial stream verification running in real-time. Single-window lock detects tab-switching to ensure fair evaluation for all applicants.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center">
                    <FiAward className="w-4 h-4 text-indigo-600 mr-1.5" />
                    Comprehensive Hiring Telemetry
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Upon completion, your technical score and code transcript are delivered directly to hiring teams across our partner ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring Partners Registry */}
      <section id="partners" className="py-12 border-y border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Verified Candidate Registry Shared With
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {partners.map((p, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 p-4 rounded-2xl text-center shadow-2xs hover:shadow-sm transition"
              >
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-sm font-mono mb-2">
                  {p.emblem}
                </div>
                <div className="font-bold text-sm text-slate-900">{p.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{p.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Step-by-Step Lifecycle */}
      <section id="how-it-works" className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            End-to-End Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            How the Assessment Works
          </h2>
          <p className="text-sm text-slate-600">
            A transparent 4-stage evaluation designed to separate genuine technical practitioners from generic applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold font-mono flex items-center justify-center text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-slate-900">Attach Resume PDF</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your legal name and upload your PDF resume. Our parsing engine extracts your frameworks, past projects, and core technical skills.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold font-mono flex items-center justify-center text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-slate-900">₹29 Integrity Deposit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit the nominal ₹29 anti-cheat deposit via Cashfree. This deters automated bots and ghost applications, ensuring reserved server capacity.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold font-mono flex items-center justify-center text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-slate-900">30-Min Terminal Test</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Take the proctored test. Face 10 tailored questions based on your resume. Type your solutions into the terminal while your webcam remains active.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white font-bold font-mono flex items-center justify-center text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-slate-900">Report & 100% Refund</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Completed transcripts are scored and sent to partner recruiters. Clean attempts completed without tab-switching receive their deposit refund within 7 days.
            </p>
          </div>
        </div>
      </section>

      {/* Assessment Tracks Grid */}
      <section id="tracks" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Standardized Domains
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Active Assessment Tracks
            </h2>
            <p className="text-sm text-slate-600">
              Choose your target area. Every question is dynamically synthesized from the exact technologies present on your resume.
            </p>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {[
                { id: "all", label: "All Tracks" },
                { id: "tech", label: "Engineering & Dev" },
                { id: "data", label: "Data & Analytics" },
                { id: "marketing", label: "Growth Marketing" },
                { id: "design", label: "UI/UX Design" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track, i) => (
              <div
                key={i}
                onClick={() => navigate(`/test/${track.slug}`)}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-3xl p-6 sm:p-7 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">{track.icon}</div>
                    <span className="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ₹29 Deposit
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition">
                    {track.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {track.desc}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {track.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 font-mono text-[11px]">{track.duration} • 10 Qs</span>
                  <span className="text-blue-600 font-bold flex items-center">
                    Enter Track <FiArrowRight className="ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proctoring & Integrity Deep Dive */}
      <section id="proctoring" className="py-20 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Fair & Transparent Testing
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Automated Proctoring Standards
          </h2>
          <p className="text-sm text-slate-600">
            Hiring teams prioritize candidates who solve challenges independently. Our client-side integrity system enforces exam hygiene without invasive spyware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 inline-block">
              <FiVideo className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Local Camera Presence</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your webcam streams locally to verify candidate identity and presence in the exam frame. No audio or desktop recordings are stored without your knowledge.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 inline-block">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">3-Strike Window Lockdown</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Leaving or minimizing the assessment tab activates immediate strike warnings. Reaching 3 violations automatically terminates the session and voids the attempt.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 inline-block">
              <FiCpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Contextual Follow-Ups</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submitting superficial or generic answers prompts the AI examiner to drill into exact technical mechanics, ensuring you truly understand the logic you write.
            </p>
          </div>
        </div>
      </section>

      {/* Deposit & 100% Refund Policy Banner */}
      <section id="refund-policy" className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-emerald-700">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <FiRotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">₹29 Anti-Cheating Deposit & Refund Policy</h3>
                <span className="text-xs font-semibold text-emerald-700">Fair Testing Commitment</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">Why We Charge ₹29:</h4>
                <p>
                  To eliminate automated submission spam and ensure GPU capacity for candidates who are serious about their technical evaluation. This is an operational integrity deposit, not a recruitment fee.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">How the 100% Refund Works:</h4>
                <p>
                  If you complete all 10 assessment questions honestly without triggering the 3 tab-switch proctoring violations, your full ₹29 deposit is refunded within 7 working days to your original payment source.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="text-slate-500 flex items-center">
                <FiLock className="mr-1.5 text-blue-600" />
                Processed securely via Cashfree Web Gateway
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Questions? Email: <a href="mailto:support@internadda.com" className="text-blue-600 underline">support@internadda.com</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img src="/logo.jpg" alt="Logo" className="h-8 w-auto rounded object-contain" />
              <span className="font-bold text-slate-900 text-sm">InternAdda Career Innovations</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-slate-900">Evaluation Lifecycle</a>
              <a href="#tracks" className="hover:text-slate-900">Active Tracks</a>
              <a href="#proctoring" className="hover:text-slate-900">Integrity Protocol</a>
              <a href="#refund-policy" className="hover:text-slate-900">Refund Guarantee</a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>© 2026 internadda.com. All rights reserved. Registered Technical Assessment Infrastructure.</span>
            <div className="flex items-center space-x-3 font-mono">
              <span>ISO 9001 Aligned</span>
              <span>•</span>
              <button onClick={() => navigate("/login")} className="hover:text-slate-700">
                Admin Portal
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
