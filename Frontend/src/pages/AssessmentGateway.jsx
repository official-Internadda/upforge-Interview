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
  FiFileText
} from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "https://interview-api.internadda.com";

export default function AssessmentGateway() {
  const { role: rawRole } = useParams();
  const navigate = useNavigate();

  const formattedRole = rawRole
    ? rawRole.replace(/-/g, " ").toUpperCase()
    : "SOFTWARE ENGINEER";

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
      setError("Please attach a valid PDF document.");
    }
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !file) {
      setError("Please fill all details and upload your PDF resume.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // 1. Upload & Parse PDF
      const formData = new FormData();
      formData.append("resume", file);
      const parseRes = await fetch(`${BACKEND}/parse-resume`, {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Failed parsing PDF.");

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
          role: formattedRole,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Payment gateway init failed.");

      // 3. Save pending attempt
      await addDoc(collection(db, "sessions"), {
        sessionId,
        orderId: orderData.orderId,
        candidateName: name.trim(),
        candidateEmail: email.trim(),
        candidatePhone: phone.trim(),
        role: formattedRole,
        resumeText,
        paymentStatus: "PENDING",
        status: "payment_pending",
        createdAt: new Date().toISOString(),
        transcript: [],
        report: null,
      });

      localStorage.setItem("upforge_session_id", sessionId);
      localStorage.setItem("upforge_order_id", orderData.orderId);

      // 4. Trigger Cashfree SDK
      if (!window.Cashfree) {
        throw new Error("Payment gateway SDK is loading. Please retry in 2 seconds.");
      }

      const cashfree = window.Cashfree({ mode: "production" });
      cashfree.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred. Please check network and try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-[#0F172A] font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <FiArrowLeft className="mr-1.5" /> Back
          </button>

          <div className="flex items-center space-x-2">
            <img src="/logo.jpg" alt="Logo" className="h-7 w-auto rounded object-contain" />
            <span className="text-slate-300 text-xs">|</span>
            <img src="/upforge.jpg" alt="Partner" className="h-6 w-auto rounded object-contain" />
          </div>

          <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center">
            <FiLock className="mr-1" /> SSL Secure
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl mx-auto px-4 py-8 sm:py-12 w-full">
        <div className="text-center mb-6 space-y-1.5">
          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            {formattedRole}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Candidate Verification
          </h1>
          <p className="text-xs text-slate-500">
            Provide details to initialize the hardware-proctored 30-min challenge.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleProceedPayment} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                WhatsApp / Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit phone number"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Upload Resume (PDF only)
              </label>
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition">
                <FiUploadCloud className="w-8 h-8 text-blue-600 mb-1.5" />
                <span className="text-xs font-bold text-slate-800 text-center truncate max-w-xs">
                  {file ? file.name : "Attach Resume (PDF)"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Interview questions will be extracted from your real work
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Fee summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Evaluation Server Fee</span>
                <span>₹1.00</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Direct UpForge Talent Indexing</span>
                <span className="text-emerald-600 font-bold">Included</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-900">
                <span>Payable Amount:</span>
                <span className="text-blue-600 font-mono">₹1.00</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-500/20 active:scale-95"
            >
              {uploading ? (
                <span>Parsing PDF & Connecting Gateway...</span>
              ) : (
                <span>Proceed with ₹1 & Launch Assessment</span>
              )}
            </button>
          </form>

          <div className="pt-2 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center">
              <FiShield className="mr-1 text-blue-600" /> Webcam Proctored
            </span>
            <span>•</span>
            <span className="flex items-center">
              <FiCheckCircle className="mr-1 text-emerald-600" /> Cashfree Checkout
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
