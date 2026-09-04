import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { FiClock, FiShield, FiSend, FiCameraOff, FiAlertTriangle } from "react-icons/fi";

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
      <div className="min-h-screen bg-[#050811] flex items-center justify-center text-white font-mono text-sm">
        BOOTING_TERMINAL_SESSION...
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 text-white font-mono">
        <div className="max-w-md w-full p-8 rounded-2xl bg-red-950/20 border border-red-800 text-center">
          <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-400">ASSESSMENT TERMINATED</h2>
          <p className="text-xs text-slate-400 mt-2">
            Automated integrity protocols triggered. 3 Window-blur strikes detected. Your evaluation has been marked invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050811] text-slate-200 flex flex-col font-mono text-xs selection:bg-indigo-600 selection:text-white">
      {/* Toast Warning */}
      {showWarningToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-2.5 rounded-lg shadow-2xl flex items-center space-x-2 animate-pulse border border-red-300">
          <FiAlertTriangle />
          <span className="font-bold">VIOLATION STRIKE {warnings}/3: Window switch detected!</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-14 border-b border-slate-800 bg-[#080d1a] px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-emerald-400 font-bold tracking-wider">UPFORGE_TERMINAL_v4</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">{session?.role}</span>
          <span className="text-slate-500 text-[10px]">({session?.candidateName})</span>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-indigo-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded">
            <FiClock />
            <span className="font-bold">{formatTimer(timeLeft)}</span>
          </div>

          <span className="text-slate-400">Q: {questionCount}/10</span>

          <div className="flex items-center space-x-1 text-emerald-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>PROCTORED</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Terminal Chat Stream (Left/Center) */}
        <div className="flex-1 flex flex-col overflow-hidden pb-40">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-64 sm:pr-80">
            <div className="text-slate-500 pb-2 border-b border-slate-800/80 text-[11px]">
              * AI Technical Terminal initialized. Type your solutions, code blocks, or explanations directly into the buffer below.
            </div>

            {messages.map((m, idx) => (
              <div key={idx} className={`${m.role === "assistant" ? "text-emerald-400" : "text-sky-300"} leading-relaxed`}>
                <span className="font-bold text-slate-500 mr-2">
                  {m.role === "assistant" ? "EXAMINER >>" : "CANDIDATE >>"}
                </span>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            ))}

            {thinking && (
              <div className="text-indigo-400 flex items-center space-x-2 animate-pulse">
                <span>ANALYZING CODE BUFFER & GENERATING FOLLOW-UP...</span>
              </div>
            )}

            {isComplete && (
              <div className="p-4 rounded bg-emerald-950/30 border border-emerald-800 text-emerald-300 space-y-2 mt-4">
                <p className="font-bold">ASSESSMENT COMPLETED SUCCESSFULLY.</p>
                <p className="text-slate-400 text-[11px]">
                  Your technical transcript has been indexed. The recruiting team will reach out with the evaluation result.
                </p>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Live Floating Camera Box (Top Right) */}
        <div className="absolute right-6 top-6 w-52 sm:w-64 z-20 pointer-events-none">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative pointer-events-auto">
            <div className="h-36 sm:h-44 bg-black flex items-center justify-center">
              {cameraEnabled ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              ) : (
                <div className="text-slate-600 text-center text-[10px]">
                  <FiCameraOff className="mx-auto mb-1 w-5 h-5" />
                  FEED_OFFLINE
                </div>
              )}
            </div>
            <div className="p-2 bg-[#090e1a] border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span>INTEGRITY FEED</span>
              <span className="text-emerald-400 font-bold">1080p</span>
            </div>
          </div>
        </div>

        {/* Command Buffer Input Bar (Bottom) */}
        {!isComplete && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-72 z-30">
            <div className="bg-[#0b1120] border border-slate-700/80 rounded-xl p-3 shadow-2xl">
              <div className="flex items-start space-x-2">
                <span className="text-indigo-400 font-bold pt-2.5 pl-2">&gt;</span>
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
                  placeholder="Type your explanation, logic, or code here... (Shift+Enter for new line, Enter to submit)"
                  className="flex-1 bg-transparent border-0 resize-none focus:outline-none text-slate-100 placeholder-slate-600 text-xs font-mono py-2"
                  rows={3}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputBuffer.trim() || thinking}
                  className="h-10 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg font-bold flex items-center space-x-1 transition mt-1"
                >
                  <span>EXEC</span>
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
