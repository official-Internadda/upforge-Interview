import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  FiShield,
  FiUploadCloud,
  FiLock,
  FiCheckCircle,
  FiArrowLeft,
  FiClock,
  FiVideo,
  FiRotateCcw,
  FiHelpCircle,
  FiAward,
  FiFileText,
  FiCheck,
  FiBriefcase
} from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "https://interview-api.internadda.com";

export default function AssessmentGateway() {
  const { role: rawRole } = useParams();
  const navigate = useNavigate();

  const formattedRole = rawRole
    ? rawRole.replace(/-/g, " ").toUpperCase()
    : "TECHNICAL ASSESSMENT";

  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !file) {
      setError("Please enter your name and upload your PDF resume.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 1. Upload and Parse Resume
      const formData = new FormData();
      formData.append("resume", file);
      const parseRes = await fetch(`${BACKEND}/parse-resume`, {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Unable to read PDF file.");

      const resumeText = parseData.text;
      const sessionId = crypto.randomUUID();

      // 2. Create Order for ₹29
      const orderRes = await fetch(`${BACKEND}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: name.trim(),
          role: formattedRole,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Payment gateway init failed.");

      // 3. Store pending attempt in Firestore
      await addDoc(collection(db, "sessions"), {
        sessionId,
        orderId: orderData.orderId,
        candidateName: name.trim(),
        role: formattedRole,
        resumeText,
        paymentStatus: "PENDING",
        status: "payment_pending",
        amount: 29,
        createdAt: new Date().toISOString(),
        transcript: [],
        report: null,
      });

      localStorage.setItem("upforge_session_id", sessionId);
      localStorage.setItem("upforge_order_id", orderData.orderId);

      // 4. Trigger Cashfree
      if (!window.Cashfree) {
        throw new Error("Payment gateway is loading. Please retry in 2 seconds.");
      }

      const cashfree = window.Cashfree({ mode: "production" });
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <FiArrowLeft className="mr-2" /> Back to Assessment Tracks
          </button>

          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="InternAdda" className="h-7 w-auto rounded object-contain" onError={(e) => { e.target.style.display = "none"; }} />
            <span className="text-slate-300 text-xs">|</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Candidate Portal
            </span>
          </div>

          <div className="flex items-center space-x-3 font-mono text-xs">
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center font-bold">
              <FiLock className="mr-1.5" /> 256-Bit SSL Verified
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace (Full Width Desktop 2-Column Grid) */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 w-full flex flex-col justify-center">
        {/* Page Top Title */}
        <div className="mb-8 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              {formattedRole}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center">
              <FiAward className="mr-1.5 text-blue-600" /> MSME Registered Enterprise Platform
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Candidate Verification & Assessment Gateway
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Confirm your details, attach your resume for personalized questions, and activate the proctored terminal.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Candidate Form & Credentials (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                1. Candidate Profile & Technical Resume
              </h2>

              <form id="assessment-form" onSubmit={handleProceedPayment} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm sm:text-base text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    This will appear on your verified recruiter evaluation report.
                  </span>
                </div>

                {/* Resume Upload Dropzone */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Resume Document (PDF Format) <span className="text-red-500">*</span>
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer transition text-center group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                      <FiUploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 truncate max-w-sm">
                      {file ? file.name : "Click here to upload your PDF resume"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Our system extracts your frameworks and projects to tailor 10 challenge questions.
                    </span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </form>

              {/* Assessment Experience Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-emerald-950">
                  <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Fair & Encouraging Evaluation Protocol</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-800 pt-1">
                  <span className="flex items-center">
                    <FiClock className="mr-1.5 text-emerald-700" /> 30-Min Single Session
                  </span>
                  <span className="flex items-center">
                    <FiVideo className="mr-1.5 text-emerald-700" /> Local Webcam Frame
                  </span>
                  <span className="flex items-center">
                    <FiFileText className="mr-1.5 text-emerald-700" /> 10 Technical Turns
                  </span>
                </div>
              </div>
            </div>

            {/* Institutional Trust Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl">
                <span className="font-bold text-slate-900 block">MSME Verified</span>
                <span className="text-[10px] text-slate-500">Govt. of India Aligned</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl">
                <span className="font-bold text-slate-900 block">ISO 9001:2015</span>
                <span className="text-[10px] text-slate-500">Standardized Quality</span>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl">
                <span className="font-bold text-slate-900 block">Cashfree PG</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Instant Encryption</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Deposit Summary, Refund Terms & Pay Button (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                2. Summary & Deposit Authorization
              </h2>

              {/* Fee Breakdown */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Track Evaluation:</span>
                  <span className="font-semibold text-slate-900">{formattedRole}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Proctoring Server Allocation:</span>
                  <span className="text-emerald-700 font-bold">Reserved</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Anti-Cheating Security Deposit:</span>
                  <span className="font-mono font-bold text-slate-900">₹29.00</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-extrabold text-slate-900">
                  <span>Total Due Today:</span>
                  <span className="font-mono text-xl text-blue-600">₹29.00</span>
                </div>
              </div>

              {/* 100% Refund Guarantee Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                  <FiRotateCcw className="w-4 h-4 text-emerald-600" />
                  <span>100% Refundable Deposit Criteria</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <li className="flex items-start">
                    <FiCheck className="w-3.5 h-3.5 text-emerald-600 mr-1.5 mt-0.5 shrink-0" />
                    <span>Score at least <strong>50% (5/10)</strong> on the assessment.</span>
                  </li>
                  <li className="flex items-start">
                    <FiCheck className="w-3.5 h-3.5 text-emerald-600 mr-1.5 mt-0.5 shrink-0" />
                    <span>Complete with <strong>zero cheating strikes</strong> (no tab switches).</span>
                  </li>
                  <li className="flex items-start">
                    <FiCheck className="w-3.5 h-3.5 text-emerald-600 mr-1.5 mt-0.5 shrink-0" />
                    <span>Full ₹29 is automatically refunded within <strong>7 working days</strong>.</span>
                  </li>
                </ul>
              </div>

              {/* CTA Payment Button */}
              <button
                type="submit"
                form="assessment-form"
                disabled={uploading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-sm sm:text-base transition shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <span>Initializing Secure Gateway...</span>
                ) : (
                  <span>Pay ₹29 Deposit & Launch Terminal</span>
                )}
              </button>

              <div className="flex items-center justify-center space-x-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center">
                  <FiShield className="mr-1.5 text-blue-600" /> Proctor Verified
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <FiCheckCircle className="mr-1.5 text-emerald-600" /> Cashfree Checkout
                </span>
              </div>
            </div>

            {/* Official Transparent Notice */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-2 shadow-xs">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <FiHelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Candidate Advisory Notice:</span>
              </div>
              <p>
                InternAdda collects a small evaluation security deposit (₹29) strictly to reserve cloud computing infrastructure and ensure honest candidate participation. This is <strong>not a hiring fee or job-guarantee charge</strong> levied by UpForge, Arjuna AI, or any hiring partner.
              </p>
              <p className="font-mono text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                Queries & support:{" "}
                <a href="mailto:support@internadda.com" className="text-blue-600 underline font-semibold">
                  support@internadda.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
