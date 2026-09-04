import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { FiClock, FiShield, FiSend, FiCameraOff, FiAlertTriangle, FiCode } from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "https://interview-api.internadda.com";
const TOTAL_SECONDS = 1800; // 30 Minutes

export default function TerminalRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputBuffer, setInputBuffer] = useState("");
  const [thinking, setThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  // Proctoring
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningToast, setShowWarningToast] = useState(false);

  const videoRef = useRef(null);
  const terminalEndRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "sessions"), where("sessionId", "==", sessionId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          if (docData.paymentStatus !== "PAID") {
            navigate(`/test/${docData.role?.toLowerCase() || "general"}`);
            return;
          }
          setSession(docData);
          setDocId(snap.docs[0].id);
          if (docData.status === "completed") setIsComplete(true);
          if (docData.status === "terminated") setIsTerminated(true);
        } else {
          navigate("/");
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [sessionId]);

  // Camera & Tab Proctoring Setup
  useEffect(() => {
    if (!docId || isComplete || isTerminated) return;
    let stream = null;

    async function initCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraEnabled(true);
      } catch (err) {
        setCameraEnabled(false);
      }
    }

    const handleTabSwitch = async () => {
      if (document.hidden && !isComplete && !isTerminated) {
        setWarnings((prev) => {
          const updated = prev + 1;
          if (updated >= 3) {
            triggerTermination();
          } else {
            setShowWarningToast(true);
            setTimeout(() => setShowWarningToast(false), 4000);
          }
          return updated;
        });
      }
    };

    async function triggerTermination() {
      setIsTerminated(true);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      await updateDoc(doc(db, "sessions", docId), {
        status: "terminated",
        terminatedAt: new Date().toISOString(),
        terminationReason: "3 Tab-switch Violations Recorded",
      });
    }

    initCam();
    document.addEventListener("visibilitychange", handleTabSwitch);

    return () => {
      document.removeEventListener("visibilitychange", handleTabSwitch);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [docId, isComplete, isTerminated]);

  // 30 Min Timer
  useEffect(() => {
    if (loading || isComplete || isTerminated) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, isComplete, isTerminated, docId, messages]);

  async function handleTimeOver() {
    setIsComplete(true);
    if (docId) {
      await updateDoc(doc(db, "sessions", docId), {
        status: "completed",
        completedAt: new Date().toISOString(),
        transcript: messages,
      });
      generateReport(messages);
    }
  }

  // Initial Question
  useEffect(() => {
    if (session && messages.length === 0) {
      askTerminalAI([]);
    }
  }, [session]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function generateReport(finalMessages) {
    try {
      const res = await fetch(`${BACKEND}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalMessages,
          role: session.role,
          candidateName: session.candidateName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await updateDoc(doc(db, "sessions", docId), {
          report: data.report,
          warningsCount: warnings,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function askTerminalAI(history) {
    setThinking(true);
    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          resumeText: session.resumeText,
          role: session.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const aiMsg = { role: "assistant", content: data.reply };
      const updated = [...history, aiMsg];
      setMessages(updated);
      setQuestionCount((c) => c + 1);

      if (data.isComplete || questionCount >= 10) {
        setIsComplete(true);
        await updateDoc(doc(db, "sessions", docId), {
          status: "completed",
          completedAt: new Date().toISOString(),
          transcript: updated,
          warningsCount: warnings,
        });
        generateReport(updated);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: ">> ERR_CONNECTION_RETRY: Please re-type your submission." },
      ]);
    }
    setThinking(false);
  }

  const handleSend = () => {
    const text = inputBuffer.trim();
    if (!text || thinking || isComplete) return;

    const userMsg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputBuffer("");
    askTerminalAI(updated);
  };

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-[#0F172A] font-mono text-sm">
        ALLOCATING_SECURE_ENVIRONMENT...
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-[#FEF2F2] flex items-center justify-center p-6 text-[#991B1B] font-mono">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-[#FECACA] text-center shadow-xl">
          <FiAlertTriangle className="w-12 h-12 text-[#DC2626] mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#991B1B]">ASSESSMENT TERMINATED</h2>
          <p className="text-xs text-[#475569] mt-2 leading-relaxed">
            Automated integrity protocols flagged 3 window-blur strikes. Your assessment has been permanently locked and flagged in the UpForge registry.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-mono text-xs selection:bg-[#2563EB] selection:text-white">
      {/* Toast Warning */}
      {showWarningToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#DC2626] text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce border border-red-300">
          <FiAlertTriangle />
          <span className="font-bold">VIOLATION STRIKE {warnings}/3: Window switch detected!</span>
        </div>
      )}

      {/* Top Professional Header */}
      <header className="h-16 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <span className="text-[#2563EB] font-bold tracking-wider">UPFORGE_TERMINAL</span>
          <span className="text-[#CBD5E1]">|</span>
          <span className="text-[#0F172A] font-semibold">{session?.role}</span>
          <span className="text-[#64748B] text-[11px]">({session?.candidateName})</span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-1 rounded-lg">
            <FiClock />
            <span className="font-bold">{formatTimer(timeLeft)}</span>
          </div>

          <span className="text-[#64748B] font-semibold">Question {questionCount}/10</span>

          <div className="flex items-center space-x-1.5 text-[#059669] text-[11px] font-bold bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>PROCTORED</span>
          </div>
        </div>
      </header>

      {/* Main Terminal Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Terminal Chat Stream (Left/Center) */}
        <div className="flex-1 flex flex-col overflow-hidden pb-44">
          <div className="flex-1 overflow-y-auto p-8 space-y-5 pr-64 sm:pr-80">
            <div className="text-[#64748B] pb-3 border-b border-[#E2E8F0] text-[11px]">
              * Standardized CLI assessment initialized. Type logic, answers, SQL statements, or algorithm blocks directly into the input buffer.
            </div>

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  m.role === "assistant"
                    ? "bg-white border-[#E2E8F0] text-[#0F172A] shadow-sm"
                    : "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
                }`}
              >
                <div className="font-bold text-[10px] text-[#64748B] uppercase tracking-wider mb-1">
                  {m.role === "assistant" ? "Examiner Prompt" : "Candidate Response"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs font-sans">
                  {m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="text-[#2563EB] flex items-center space-x-2 animate-pulse font-sans text-xs">
                <span>Analyzing code buffer and synthesizing follow-up prompt...</span>
              </div>
            )}

            {isComplete && (
              <div className="p-6 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] space-y-2 mt-4 shadow-sm font-sans">
                <p className="font-extrabold text-sm">ASSESSMENT COMPLETED SUCCESSFULLY.</p>
                <p className="text-xs text-[#047857]">
                  Your technical transcript and code submissions have been indexed for the UpForge Talent Committee.
                </p>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Live Proctoring Cam Box (Top Right) */}
        <div className="absolute right-6 top-6 w-52 sm:w-64 z-20 pointer-events-none">
          <div className="bg-white border border-[#CBD5E1] rounded-2xl overflow-hidden shadow-xl relative pointer-events-auto">
            <div className="h-36 sm:h-44 bg-[#0F172A] flex items-center justify-center">
              {cameraEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="text-[#64748B] text-center text-[10px]">
                  <FiCameraOff className="mx-auto mb-1 w-5 h-5" />
                  FEED_STANDBY
                </div>
              )}
            </div>
            <div className="p-2.5 bg-white border-t border-[#E2E8F0] flex justify-between items-center text-[10px] text-[#475569]">
              <span className="font-bold">HARDWARE EYE</span>
              <span className="text-[#10B981] font-bold">1080p LIVE</span>
            </div>
          </div>
        </div>

        {/* Command Buffer Input Bar (Bottom) */}
        {!isComplete && (
          <div className="absolute bottom-6 left-6 right-6 sm:right-72 z-30">
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-3.5 shadow-2xl">
              <div className="flex items-start space-x-3">
                <textarea
                  value={inputBuffer}
                  onChange={(e) => setInputBuffer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={thinking}
                  placeholder="Type your explanation, logic, or code here... (Shift+Enter for newline, Enter to submit)"
                  className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs font-mono resize-none focus:outline-none focus:border-[#2563EB] text-[#0F172A] placeholder-[#94A3B8]"
                  rows={3}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputBuffer.trim() || thinking}
                  className="h-12 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-xl font-bold flex items-center space-x-2 transition shadow-md shadow-blue-500/20"
                >
                  <span>Submit</span>
                  <FiSend />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
