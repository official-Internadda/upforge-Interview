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

  const roleName = rawRole
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
      setError("Please select a valid text-based PDF file.");
    }
  };

  const handleProceedPayment = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !file) {
      setError("Please complete all candidate fields and attach your PDF resume.");
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
      if (!parseRes.ok) throw new Error(parseData.error || "Failed parsing resume PDF.");

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

      // 3. Store Session in Firestore
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

      localStorage.setItem("upforge_session_id", sessionId);
      localStorage.setItem("upforge_order_id", orderData.orderId);

      // 4. Trigger Cashfree Checkout
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
      setError(err.message || "An unexpected error occurred. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans flex flex-col selection:bg-[#2563EB] selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition"
          >
            <FiArrowLeft className="mr-1.5" /> Back to Tracks
          </button>

          <div className="flex items-center space-x-3">
            <img src="/logo.jpg" alt="InternAdda" className="h-7 w-auto rounded" />
            <span className="text-xs text-[#CBD5E1]">|</span>
            <img src="/upforge.jpg" alt="UpForge" className="h-6 w-auto rounded" />
          </div>

          <span className="text-xs font-mono font-semibold text-[#059669] flex items-center">
            <FiLock className="mr-1.5" /> 256-Bit SSL Encrypted
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
        <div className="text-center mb-8 space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
            {roleName} Assessment
          </span>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Candidate Verification & Gateway
          </h1>
          <p className="text-sm text-[#475569]">
            Submit your profile and initiate the 30-minute proctored technical terminal.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#B91C1C] text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleProceedPayment} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1.5">
                WhatsApp / Contact Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#2563EB] transition"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1.5">
                Upload Resume (PDF only)
              </label>
              <label className="border-2 border-dashed border-[#CBD5E1] hover:border-[#2563EB] bg-[#F8FAFC] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition">
                <FiUploadCloud className="w-8 h-8 text-[#2563EB] mb-2" />
                <span className="text-xs font-bold text-[#0F172A]">
                  {file ? file.name : "Select your PDF resume"}
                </span>
                <span className="text-[11px] text-[#64748B] mt-1">
                  10 Technical Questions will be derived from your past projects
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Price Transparency */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>Cloud AI GPU Proctoring Fee</span>
                <span>₹29.00</span>
              </div>
              <div className="flex justify-between text-xs text-[#64748B]">
                <span>UpForge Hiring Registry Archival</span>
                <span className="text-[#059669] font-bold">100% Free</span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-2 flex justify-between text-sm font-extrabold text-[#0F172A]">
                <span>Total Due:</span>
                <span className="text-[#2563EB] font-mono">₹29.00</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)] flex items-center justify-center space-x-2 active:scale-95"
            >
              {uploading ? (
                <span>Verifying PDF & Initializing Cashfree...</span>
              ) : (
                <span>Pay ₹29 & Enter Proctored Terminal</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-center space-x-6 text-xs text-[#64748B]">
            <span className="flex items-center">
              <FiShield className="mr-1.5 text-[#2563EB]" /> Camera Proctored
            </span>
            <span>•</span>
            <span className="flex items-center">
              <FiCheckCircle className="mr-1.5 text-[#059669]" /> Cashfree Verified
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
