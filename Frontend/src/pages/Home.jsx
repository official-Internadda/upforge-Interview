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
  FiMenu,
  FiX
} from "react-icons/fi";

export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tracks = [
    {
      title: "Full Stack Web Development",
      slug: "full-stack-web-development",
      category: "Engineering",
      icon: <FiCode className="w-6 h-6 text-blue-600" />,
      desc: "React, Next.js, Node.js APIs, database relationships, and async request lifecycles.",
      questions: "10 Technical Questions",
      duration: "30 Mins"
    },
    {
      title: "Core Software Engineering",
      slug: "software-engineer",
      category: "Engineering",
      icon: <FiTerminal className="w-6 h-6 text-slate-800" />,
      desc: "Data structures, runtime complexity, object-oriented design patterns, and debugging.",
      questions: "10 Technical Questions",
      duration: "30 Mins"
    },
    {
      title: "Data Analytics & SQL",
      slug: "data-analyst",
      category: "Data Science",
      icon: <FiDatabase className="w-6 h-6 text-emerald-600" />,
      desc: "Advanced multi-table joins, Pandas transformations, data cleaning, and statistical metrics.",
      questions: "10 Technical Questions",
      duration: "30 Mins"
    },
    {
      title: "Social Media & Growth Marketing",
      slug: "social-media-marketing",
      category: "Marketing",
      icon: <FiTrendingUp className="w-6 h-6 text-rose-600" />,
      desc: "Funnel design, CAC/ROAS metrics, conversion optimization, and growth campaign strategy.",
      questions: "10 Scenario Questions",
      duration: "30 Mins"
    },
    {
      title: "UI/UX & Product Design",
      slug: "ui-ux-design",
      category: "Design",
      icon: <FiLayout className="w-6 h-6 text-purple-600" />,
      desc: "Design system architecture, user journeys, responsive heuristics, and Figma prototypes.",
      questions: "10 Practical Questions",
      duration: "30 Mins"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 text-slate-300 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-white">InternAdda Technical Assessment Portal</span>
            <span className="text-slate-500">•</span>
            <span>Official Hiring Assessment Partner of UpForge</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Domain: internadda.com | ISO 9001 Aligned
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src="/logo.jpg"
              alt="InternAdda"
              className="h-10 w-auto rounded-lg object-contain border border-slate-200 shadow-sm"
            />
            <div className="h-6 w-[1px] bg-slate-200"></div>
            <img
              src="/upforge.jpg"
              alt="UpForge"
              className="h-8 w-auto rounded object-contain"
            />
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <a href="#tracks" className="hover:text-blue-600 transition">Assessment Tracks</a>
            <a href="#proctoring" className="hover:text-blue-600 transition">Integrity & Proctoring</a>
            <a href="#methodology" className="hover:text-blue-600 transition">Evaluation System</a>
          </nav>

          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => {
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
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

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3">
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
              Integrity System
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Select Your Track
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
              <span>Certified Candidate Examination Framework</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Validated Technical Skill. <br />
              <span className="text-blue-600">Direct Recruiter Credibility.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Complete InternAdda’s 30-minute terminal assessment. Real-time technical cross-examination based on your actual resume projects with hardware webcam proctoring.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                onClick={() => {
                  document.getElementById("tracks")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>Select Assessment Track</span>
                <FiArrowRight />
              </button>
              <a
                href="#proctoring"
                className="px-7 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-center transition"
              >
                Integrity Rules
              </a>
            </div>

            <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-black text-slate-900">30 Min</div>
                <div className="text-xs text-slate-500 mt-0.5">Strict Exam Window</div>
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">10 Qs</div>
                <div className="text-xs text-slate-500 mt-0.5">Role-Specific Logic</div>
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600 font-mono">₹29.00</div>
                <div className="text-xs text-slate-500 mt-0.5">Operational Evaluation Fee</div>
              </div>
            </div>
          </div>

          {/* Hero Feature Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-lg space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assessment Overview
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Active System
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="font-bold text-slate-900">No Complex Voice Audio</div>
                  <p className="text-slate-600 mt-1">
                    Direct terminal-style command buffer. Type your answers, logic, or code blocks without microphone latency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="font-bold text-slate-900">Live Hardware Facial Stream</div>
                  <p className="text-slate-600 mt-1">
                    Active camera monitoring with tab-blur protection. 3 window switches automatically locks the assessment.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex justify-between items-center">
                  <span className="font-semibold">Evaluation & GPU Fee:</span>
                  <span className="font-mono font-bold">₹29 Flat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Tracks */}
      <section id="tracks" className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Available Tracks
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Select Your Assessment Track
            </h2>
            <p className="text-sm text-slate-600">
              Your 10 challenge questions are generated strictly from the domain and the uploaded resume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track, i) => (
              <div
                key={i}
                onClick={() => navigate(`/test/${track.slug}`)}
                className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-2 rounded-xl bg-slate-100">{track.icon}</div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {track.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 hover:text-blue-600 transition">
                    {track.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {track.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 font-mono text-[11px]">{track.duration}</span>
                  <span className="text-blue-600 font-bold flex items-center">
                    Enter Track <FiArrowRight className="ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proctoring Section */}
      <section id="proctoring" className="py-16 max-w-5xl mx-auto px-4 sm:px-8 text-center space-y-4">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
          Integrity Guarantee
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Strict Anti-Cheating Protocols
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Every session is monitored via local hardware webcam and single-window lock. 3 tab-switches permanently terminates the attempt.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <FiShield className="w-8 h-8 text-blue-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-900">Webcam Hardware Eye</h4>
            <p className="text-xs text-slate-600 mt-1">
              Maintains candidate presence throughout the 30-minute proctored window.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <FiCheckCircle className="w-8 h-8 text-emerald-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-900">3-Strike Window Enforcer</h4>
            <p className="text-xs text-slate-600 mt-1">
              Window blur detection triggers warnings. 3 strikes voids the assessment.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <FiAward className="w-8 h-8 text-indigo-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-900">Verified Recruiter Report</h4>
            <p className="text-xs text-slate-600 mt-1">
              1-10 evaluation breakdown indexed directly for hiring managers.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="Logo" className="h-7 w-auto rounded object-contain" />
            <span className="font-semibold text-slate-800">InternAdda Careers</span>
            <span>•</span>
            <span>Hiring Ecosystem Partner of UpForge</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>© 2026 internadda.com. All rights reserved.</span>
            <button
              onClick={() => navigate("/login")}
              className="text-slate-400 hover:text-slate-700 font-mono"
            >
              Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
