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
  FiTarget
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
      setError("Please attach a readable text PDF resume.");
    }
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !file) {
      setError("Please enter your name and attach your PDF resume.");
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
      if (!orderRes.ok) throw new Error(orderData.error || "Payment initialization failed.");

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
      {/* Top Simple Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <FiArrowLeft className="mr-1.5" /> Back to Tracks
          </button>

          <div className="flex items-center space-x-2">
            <img src="/logo.jpg" alt="InternAdda" className="h-6 w-auto rounded object-contain" />
            <span className="text-slate-300 text-xs">|</span>
            <img src="/upforge.jpg" alt="UpForge" className="h-5 w-auto rounded object-contain" />
          </div>

          <span className="text-[11px] font-mono font-semibold text-emerald-600 flex items-center">
            <FiLock className="mr-1" /> 256-Bit SSL
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md mx-auto px-4 py-8 w-full">
        {/* Title Header */}
        <div className="text-center mb-4 space-y-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {formattedRole}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Candidate Verification
          </h1>
          <p className="text-xs text-slate-500">
            Showcase your technical competence in an industry-standard environment.
          </p>
        </div>

        {/* Positive Motivation & Trust-Booster Banner */}
        <div className="mb-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-2 shadow-2xs">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
            <FiAward className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Standardized Technical Challenge</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium px-1">
            <span className="flex items-center">
              <FiClock className="mr-1 text-emerald-700 shrink-0" /> 30-Min Focused Test
            </span>
            <span className="flex items-center">
              <FiVideo className="mr-1 text-emerald-700 shrink-0" /> Live Webcam Proctored
            </span>
            <span className="flex items-center">
              <FiTarget className="mr-1 text-emerald-700 shrink-0" /> 10 Core Questions
            </span>
          </div>

          <p className="text-[11px] text-emerald-700 leading-normal border-t border-emerald-200/60 pt-1.5">
            Stay confident and focused in a single tab. Your genuine skills and problem-solving ability directly qualify you for top partner hiring rounds!
          </p>
        </div>

        {/* Compact Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleProceedPayment} className="space-y-3.5">
            {/* Name Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            {/* Resume Upload Box */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Attach Resume (PDF)
              </label>
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition">
                <FiUploadCloud className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs font-bold text-slate-800 text-center truncate max-w-xs">
                  {file ? file.name : "Click to select PDF resume"}
                </span>
                <span className="text-[10px] text-slate-400">
                  Questions will test skills from your resume
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Fee Breakdown & Anti-Cheating Refund Guarantee */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium flex items-center">
                  <FiShield className="mr-1.5 text-blue-600" />
                  Anti-Cheating Security Fee
                </span>
                <span className="font-bold text-slate-900">₹29.00</span>
              </div>

              <div className="flex items-start space-x-1.5 pt-1 border-t border-slate-200/80 text-[11px] text-emerald-700">
                <FiRotateCcw className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>
                  <strong>100% Refundable:</strong> If you complete and qualify without cheating or tab switching, the deposit is refunded within 7 days.
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-sm active:scale-95"
            >
              {uploading ? (
                <span>Parsing PDF & Initializing...</span>
              ) : (
                <span>Pay ₹29 Deposit & Enter Terminal</span>
              )}
            </button>
          </form>

          {/* Secure Trust Badges */}
          <div className="pt-1 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center">
              <FiShield className="mr-1 text-blue-600" /> Web-Proctored
            </span>
            <span>•</span>
            <span className="flex items-center">
              <FiCheckCircle className="mr-1 text-emerald-600" /> Cashfree Verified
            </span>
          </div>
        </div>

        {/* High-Trust Transparent Policy Disclaimer Note */}
        <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200 text-slate-600 text-[11px] leading-relaxed shadow-xs space-y-2">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
            <FiHelpCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Candidate Notice:</span>
          </div>
          <p>
            <strong>Note:</strong> InternAdda may charge a small evaluation fee (₹10–₹29), which is not a hiring fee charged by UpForge. If you qualify through a fair, non-AI assessment, the amount will be refunded as per InternAdda’s policy.
          </p>
          <p className="pt-1 border-t border-slate-100 font-mono text-[10px] text-slate-500">
            For any payment or refund-related clarification, please contact{" "}
            <a href="mailto:support@internadda.com" className="text-blue-600 underline font-semibold">
              support@internadda.com
            </a>{" "}
            directly.
          </p>
        </div>
      </main>
    </div>
  );
}
