import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import {
  FiShield,
  FiUploadCloud,
  FiLock,
  FiCheckCircle,
  FiArrowLeft
} from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "https://interview-api.internadda.com";

export default function AssessmentGateway() {
  const { role: rawRole } = useParams();
  const navigate = useNavigate();

  const formattedRole = rawRole
    ? rawRole.replace(/-/g, " ").toUpperCase()
    : "SOFTWARE ENGINEER";

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
      setError("Please select a readable PDF document.");
    }
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !file) {
      setError("Please enter your Full Legal Name and attach your PDF resume.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 1. Parse Resume PDF
      const formData = new FormData();
      formData.append("resume", file);
      const parseRes = await fetch(`${BACKEND}/parse-resume`, {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Failed reading resume PDF.");

      const resumeText = parseData.text;
      const sessionId = crypto.randomUUID();

      // 2. Create Cashfree ₹29 Order
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

      // 3. Save pending session in Firestore
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

      // 4. Trigger Cashfree Checkout
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK is loading. Please refresh and try again.");
      }

      const cashfree = window.Cashfree({ mode: "production" });
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <FiArrowLeft className="mr-1.5" /> Back to Tracks
          </button>

          <div className="flex items-center space-x-2">
            <img src="/logo.jpg" alt="Logo" className="h-7 w-auto rounded object-contain" />
            <span className="text-slate-300 text-xs">|</span>
            <img src="/upforge.jpg" alt="Partner" className="h-6 w-auto rounded object-contain" />
          </div>

          <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
            <FiLock className="mr-1" /> 256-Bit SSL
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg mx-auto px-4 py-12 w-full">
        <div className="text-center mb-8 space-y-1.5">
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {formattedRole}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Candidate Verification
          </h1>
          <p className="text-xs text-slate-500">
            Provide your details to launch the proctored 30-minute technical terminal.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleProceedPayment} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Upload Resume (PDF Only)
              </label>
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                <FiUploadCloud className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-xs font-bold text-slate-800 text-center truncate max-w-xs">
                  {file ? file.name : "Select your PDF resume"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  10 assessment questions will be generated from your actual project stack
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Pricing Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>AI Technical Evaluation & GPU Fee</span>
                <span>₹29.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Direct Talent Registry Archival</span>
                <span className="text-emerald-600 font-bold">Included</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Payable Amount:</span>
                <span className="text-blue-600 font-mono">₹29.00</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-sm active:scale-95"
            >
              {uploading ? (
                <span>Parsing PDF & Connecting Cashfree...</span>
              ) : (
                <span>Pay ₹29 & Enter Terminal</span>
              )}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center">
              <FiShield className="mr-1 text-blue-600" /> Webcam Proctored
            </span>
            <span>•</span>
            <span className="flex items-center">
              <FiCheckCircle className="mr-1 text-emerald-600" /> Cashfree Verified
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
