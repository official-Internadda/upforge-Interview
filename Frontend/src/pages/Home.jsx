import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShield,
  FiArrowRight,
  FiCheck,
  FiAward,
  FiTerminal,
  FiActivity,
  FiLock,
  FiMenu,
  FiX,
  FiCode,
  FiTrendingUp,
  FiLayout,
  FiDatabase
} from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(18420);

  useEffect(() => {
    const timer = setInterval(() => {
      setVerifiedCount((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const assessmentTracks = [
    {
      title: "Full Stack Web Development",
      slug: "full-stack-web-development",
      category: "tech",
      icon: <FiCode className="text-blue-600" />,
      badge: "Highest Demand",
      desc: "React, Node.js, REST APIs, asynchronous database queries, state lifecycles and modern edge architecture.",
      topics: ["React / Next.js", "Node.js", "PostgreSQL / MongoDB", "API Design"],
      duration: "30 Min Live Assessment"
    },
    {
      title: "Core Software Engineering",
      slug: "software-engineer",
      category: "tech",
      icon: <FiTerminal className="text-indigo-600" />,
      badge: "Standard Track",
      desc: "Data structures, algorithmic time complexity, memory management, and clean modular code design.",
      topics: ["DSA & Logic", "System Bottlenecks", "OOP Principles", "Error Handling"],
      duration: "30 Min Live Assessment"
    },
    {
      title: "Data Analytics & Business Intelligence",
      slug: "data-analyst",
      category: "data",
      icon: <FiDatabase className="text-emerald-600" />,
      badge: "Verified Benchmark",
      desc: "Complex SQL multi-table joins, Pandas transformations, data cleaning pipelines, and statistical analysis.",
      topics: ["Advanced SQL", "Python / Pandas", "ETL Hygiene", "Data Storytelling"],
      duration: "30 Min Live Assessment"
    },
    {
      title: "Social Media & Digital Marketing",
      slug: "social-media-marketing",
      category: "marketing",
      icon: <FiTrendingUp className="text-rose-600" />,
      badge: "Growth Track",
      desc: "Campaign metrics (CTR/ROAS), viral hook mechanics, audience segmentation, copy logic and brand growth strategy.",
      topics: ["Performance Ads", "Funnel Strategy", "Retention Metrics", "Content Logic"],
      duration: "30 Min Live Assessment"
    },
    {
      title: "Performance Marketing & Growth SEO",
      slug: "growth-marketing-seo",
      category: "marketing",
      icon: <FiActivity className="text-amber-600" />,
      badge: "Scale Focus",
      desc: "Search intent algorithms, technical SEO hygiene, Google Ads conversion tracking, and CAC optimization.",
      topics: ["Technical SEO", "Google Ads / Meta", "CRO & Analytics", "Keyword Mapping"],
      duration: "30 Min Live Assessment"
    },
    {
      title: "UI/UX & Product Design",
      slug: "ui-ux-design",
      category: "design",
      icon: <FiLayout className="text-purple-600" />,
      badge: "Design Fellowship",
      desc: "Design system scalability, Figma components, typography hierarchy, user journey friction diagnosis and UX audits.",
      topics: ["Design Systems", "Usability Heuristics", "Wireframing", "Figma Auto-layout"],
      duration: "30 Min Live Assessment"
    }
  ];

  const filteredTracks =
    activeTab === "all"
      ? assessmentTracks
      : assessmentTracks.filter((t) => t.category === activeTab);

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#0F172A] font-sans antialiased selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(#CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Top Corporate Status Ribbon */}
      <div className="relative z-30 bg-white border-b border-slate-200 py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-600 gap-1 sm:gap-0">
          <div className="flex items-center space-x-2 text-center sm:text-left">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-slate-900">InternAdda Assessment Gateway</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline">Certified Technical Competency Evaluation</span>
          </div>
          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <span className="text-slate-800 font-bold">{verifiedCount.toLocaleString()} Verified Tests</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-sans">Official Partner: UpForge</span>
          </div>
        </div>
      </div>

      {/* Mobile-Ready Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img src="/logo.jpg" alt="InternAdda" className="h-9 w-auto rounded-lg object-contain shadow-xs border border-slate-200" />
            <div className="h-5 w-[1px] bg-slate-200"></div>
            <img src="/upforge.jpg" alt="UpForge Partner" className="h-7 w-auto rounded object-contain" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-semibold text-slate-600">
            <a href="#tracks" className="hover:text-slate-900 transition">Assessment Tracks</a>
            <a href="#proctor" className="hover:text-slate-900 transition">Integrity & Camera</a>
            <a href="#evaluation" className="hover:text-slate-900 transition">How It Works</a>
          </nav>

          <div className="hidden sm:flex items-center space-x-3">
            <button
              onClick={() => {
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 flex items-center space-x-2"
            >
              <span>Choose Assessment</span>
              <FiArrowRight />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
              aria-label="Toggle Menu"
            >
              {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {menuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-5 py-4 space-y-3 shadow-lg">
            <a
              href="#tracks"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-1"
            >
              Assessment Tracks
            </a>
            <a
              href="#proctor"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-1"
            >
              Proctoring Standards
            </a>
            <a
              href="#evaluation"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-1"
            >
              Evaluation Process
            </a>
            <button
              onClick={() => {
                setMenuOpen(false);
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 bg-blue-600 text-white text-xs font-bold rounded-xl shadow transition"
            >
              Select Your Assessment Track
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>2026 Structured Candidate Assessment</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.18]">
              Validate Real Skill. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Get Directly Evaluated.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
              Experience InternAdda’s standardized 30-minute terminal challenge. Real-time coding, practical scenario questions, and live webcam monitoring that prove candidate capability beyond paper resumes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2 active:scale-95"
              >
                <span>Browse All Assessment Tracks</span>
                <FiArrowRight />
              </button>
              <a
                href="#proctor"
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition text-center shadow-xs"
              >
                Proctoring Guidelines
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 grid grid-cols-3 gap-2 sm:gap-6 border-t border-slate-200 mt-6 max-w-xl mx-auto">
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                <div className="text-lg sm:text-2xl font-black text-slate-900">30 Min</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Focused Test</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                <div className="text-lg sm:text-2xl font-black text-slate-900">10 Qs</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Hard Logic</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200">
                <div className="text-lg sm:text-2xl font-black text-blue-600 font-mono">100%</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Honest Score</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tracks Section */}
        <section id="tracks" className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                Job Ready Portfolios
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
                Available Assessment Tracks
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Questions are synthesized dynamically from the exact skills and projects on your resume.
              </p>

              {/* Filter Tabs */}
              <div className="flex flex-wrap justify-center gap-1.5 pt-4">
                {[
                  { id: "all", label: "All Tracks" },
                  { id: "tech", label: "Engineering & Dev" },
                  { id: "data", label: "Data & Analytics" },
                  { id: "marketing", label: "Growth & Marketing" },
                  { id: "design", label: "UI/UX Product" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredTracks.map((track, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(`/test/${track.slug}`)}
                  className="group bg-[#FBFBFC] hover:bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                        {track.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {track.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {track.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {track.desc}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {track.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-[10px] font-medium rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 font-mono text-[11px]">{track.duration}</span>
                    <span className="text-blue-600 font-bold flex items-center group-hover:translate-x-1 transition">
                      Enter Challenge <FiArrowRight className="ml-1" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Proctor & Integrity Section */}
        <section id="proctor" className="py-16 bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Live Hardware Proctoring
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Integrity Guaranteed for Hiring Partners
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Our automated system monitors facial presence and browser window activity. Three window switches permanently voids the session.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <FiShield className="w-7 h-7 text-blue-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-900">Local Hardware Cam</h4>
                <p className="text-xs text-slate-600 mt-1">Real-time candidate eye and facial presence tracking.</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <FiLock className="w-7 h-7 text-indigo-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-900">3-Strike Window Guard</h4>
                <p className="text-xs text-slate-600 mt-1">Zero tab switching allowed during the active 30 minutes.</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <FiAward className="w-7 h-7 text-emerald-600 mb-3" />
                <h4 className="text-sm font-bold text-slate-900">Direct Recruiter Ledger</h4>
                <p className="text-xs text-slate-600 mt-1">Clean verified report delivered for UpForge candidate matching.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="Logo" className="h-6 w-auto rounded object-contain" />
            <span className="font-semibold text-slate-800">InternAdda Careers</span>
            <span>•</span>
            <span>Hiring Ecosystem Partner of UpForge</span>
          </div>

          <div className="flex items-center space-x-4">
            <span>ISO 9001 Aligned</span>
            <span>•</span>
            <span>All Rights Reserved 2026</span>
            <button
              onClick={() => navigate("/login")}
              className="text-slate-300 hover:text-slate-600 font-mono text-xs"
              title="Admin Portal"
            >
              ⚙
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
