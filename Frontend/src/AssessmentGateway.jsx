import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { FiCheckCircle, FiShield, FiUploadCloud, FiLock } from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "https://interview-api.internadda.com";

export default function AssessmentGateway() {
  const { role: rawRole } = useParams();
  const navigate = useNavigate();

  const roleName = rawRole ? rawRole.replace(/-/g, " ").toUpperCase() : "SOFTWARE ENGINEER";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !file) {
      setError("Please fill all details and attach your resume PDF.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 1. Parse Resume PDF on Backend
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

      // 2. Create Cashfree Order
      const orderRes = await fetch(`${BACKEND}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: name.trim(),
          candidateEmail: email.trim(),
          candidatePhone: phone.trim(),
          role: roleName,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Payment gateway init failed.");

      // Store pending session in Firestore
      await addDoc(collection(db, "sessions"), {
        sessionId,
        orderId: orderData.orderId,
        candidateName: name.trim(),
        candidateEmail: email.trim(),
        candidatePhone: phone.trim(),
        role: roleName,
        resumeText,
        paymentStatus: "PENDING",
        status: "payment_pending",
        createdAt: new Date().toISOString(),
        transcript: [],
        report: null,
      });

      // Save local session state
      localStorage.setItem("upforge_session_id", sessionId);
      localStorage.setItem("upforge_order_id", orderData.orderId);

      // 3. Trigger Cashfree SDK
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK not loaded. Please refresh.");
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
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-[#0c1222]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="InternAdda" className="h-8 w-auto rounded" />
            <div className="h-4 w-[1px] bg-slate-700"></div>
            <img src="/upforge.jpg" alt="UpForge" className="h-6 w-auto rounded" />
            <span className="text-xs font-semibold text-slate-300">Official Candidate Portal</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center">
            <FiLock className="mr-1" /> 256-Bit SSL Encrypted
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <div className="text-center mb-8">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {roleName} Assessment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">Candidate Entry & Verification</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Complete your submission and nominal evaluation fee to access the 30-min live terminal room.
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleProceedPayment} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">WhatsApp / Contact Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Upload Resume (PDF only)</label>
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-900/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                <FiUploadCloud className="w-8 h-8 text-indigo-400 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  {file ? file.name : "Click to select your PDF resume"}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Questions will be derived directly from your resume</span>
                <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {/* Pricing breakdown box */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>AI Technical Proctoring & GPU Evaluation</span>
                <span>₹29.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>UpForge Hiring Registry Submission</span>
                <span className="text-emerald-400 font-semibold">FREE</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>Total Amount Due:</span>
                <span className="text-indigo-400 font-mono">₹29.00</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-xl shadow-indigo-600/25 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <span>Configuring Secure Terminal...</span>
              ) : (
                <span>Pay ₹29 & Enter Terminal Assessment</span>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center"><FiShield className="mr-1 text-indigo-400" /> Proctoring Monitored</span>
            <span>•</span>
            <span className="flex items-center"><FiCheckCircle className="mr-1 text-emerald-400" /> Cashfree Verified</span>
          </div>
        </div>
      </main>
    </div>
  );
}
