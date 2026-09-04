import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import {
  FiClock,
  FiShield,
  FiSend,
  FiCameraOff,
  FiAlertTriangle,
  FiMaximize2,
  FiMinimize2,
  FiExternalLink,
  FiMail
} from "react-icons/fi";

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
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  // Proctoring States
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningToast, setShowWarningToast] = useState(false);
  const [camCollapsed, setCamCollapsed] = useState(false);

  const videoRef = useRef(null);
  const terminalEndRef = useRef(null);
  const timerRef = useRef(null);
  const localStreamRef = useRef(null);

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

  // Hardware Camera & 3-Strike Tab Guard
  useEffect(() => {
    if (!docId || isComplete || isTerminated) return;

    async function initHardwareEye() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
      } catch (err) {
        console.warn("Camera unavailable:", err);
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
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      await updateDoc(doc(db, "sessions", docId), {
        status: "terminated",
        terminatedAt: new Date().toISOString(),
        terminationReason: "3 Tab-switch Violations Recorded",
      });
    }

    initHardwareEye();
    document.addEventListener("visibilitychange", handleTabSwitch);

    return () => {
      document.removeEventListener("visibilitychange", handleTabSwitch);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [docId, isComplete, isTerminated]);

  useEffect(() => {
    if (videoRef.current && cameraEnabled && !camCollapsed && localStreamRef.current) {
      videoRef.current.srcObject = localStreamRef.current;
    }
  }, [camCollapsed, cameraEnabled]);

  // 30-Minute Assessment Countdown
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
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (docId) {
      await updateDoc(doc(db, "sessions", docId), {
        status: "completed",
        completedAt: new Date().toISOString(),
        transcript: messages,
      });
      generateReport(messages);
    }
  }

  // 10-Second Auto-Redirect to upforge.org on Completion
  useEffect(() => {
    if (!isComplete) return;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    const countdownInterval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          window.location.href = "https://upforge.org";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isComplete]);

  // Trigger First Question
  useEffect(() => {
    if (session && messages.length === 0) {
      askTerminalAI([]);
    }
  }, [session]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking, isComplete]);

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
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
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
        { role: "assistant", content: ">> CONNECTION_RETRY: Server connection interrupted. Please re-submit your response." },
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
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-800 font-mono text-xs">
        ALLOCATING_SECURE_EXAM_SANDBOX...
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6 text-red-900 font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-red-200 text-center shadow-lg">
          <FiAlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-700">ASSESSMENT TERMINATED</h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Integrity protocols recorded 3 window switches. This session is locked and registered as invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col font-sans text-xs selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Toast Warning */}
      {showWarningToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce border border-red-300">
          <FiAlertTriangle />
          <span className="font-bold">VIOLATION {warnings}/3: Do not switch tabs or windows!</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shadow-xs z-30">
        <div className="flex items-center space-x-3 truncate max-w-[50%]">
          <span className="font-extrabold text-blue-600 text-sm">InternAdda</span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-900 truncate">{session?.role}</span>
          <span className="text-slate-500 text-[11px]">({session?.candidateName})</span>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-5">
          <div className="flex items-center space-x-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg font-mono">
            <FiClock className="w-3.5 h-3.5" />
            <span className="font-bold">{formatTimer(timeLeft)}</span>
          </div>

          <span className="text-slate-600 font-semibold text-[11px]">
            Q: {questionCount}/10
          </span>

          <button
            onClick={() => setCamCollapsed(!camCollapsed)}
            className="sm:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            title="Toggle Hardware Eye"
          >
            {camCollapsed ? <FiMaximize2 /> : <FiMinimize2 />}
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden relative">
        {/* Terminal Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden pb-44 sm:pb-36">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:pr-80">
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-500 text-[11px]">
              * Assessment active for <span className="font-semibold text-slate-800">{session?.candidateName}</span>. Type your solutions or code directly into the buffer below.
            </div>

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  m.role === "assistant"
                    ? "bg-white border-slate-200 text-slate-900 shadow-xs"
                    : "bg-blue-50 border-blue-200 text-blue-950 font-mono text-[11px]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500">
                    {m.role === "assistant" ? "Examiner Question" : "Candidate Buffer"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">#{(idx + 1).toString().padStart(2, "0")}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {m.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-blue-600 flex items-center space-x-2 animate-pulse text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span>AI Examiner is evaluating solution & generating next question...</span>
              </div>
            )}

            {/* Assessment Completed Modal / Banner */}
            {isComplete && (
              <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500/40 text-slate-900 shadow-xl space-y-4 mt-4 animate-fade-in">
                <div className="flex items-center space-x-2 text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                  <p className="font-black text-base tracking-wide uppercase">ASSESSMENT COMPLETED</p>
                </div>

                <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                  <p className="font-semibold text-slate-900">
                    Your answers and telemetry have been recorded in the talent registry.
                  </p>
                  <p>
                    Your response has been sent to team UpForge. You will receive a reply soon.
                  </p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
                      <FiMail className="w-3.5 h-3.5 text-blue-600" />
                      <span>For more queries, contact:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono text-blue-700">
                      <a href="mailto:support@upforge.org" className="underline hover:text-blue-900">
                        support@upforge.org
                      </a>
                      <span>•</span>
                      <a href="mailto:support@internadda.com" className="underline hover:text-blue-900">
                        support@internadda.com
                      </a>
                    </div>
                  </div>
                  <p className="text-slate-600 italic">
                    Stay positive! Till then, explore UpForge and understand the business model in depth.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] font-mono font-semibold text-slate-500">
                    Auto-redirecting in <span className="text-blue-600 font-bold text-sm">{redirectCountdown}s</span>...
                  </div>
                  <a
                    href="https://upforge.org"
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
                  >
                    <span>Visit upforge.org Now</span>
                    <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        </div>

        {/* Live Hardware Eye Camera HUD */}
        {!camCollapsed && !isComplete && (
          <div className="absolute right-4 top-4 sm:top-6 sm:right-6 w-44 sm:w-68 z-20">
            <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-xl relative ring-2 ring-blue-500/20">
              <div className="h-28 sm:h-44 bg-slate-950 relative flex items-center justify-center overflow-hidden">
                {cameraEnabled ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform scale-x-[-1]"
                    />

                    {/* Scanning Reticle HUD */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-3 border border-emerald-400/40 rounded-lg"></div>
                      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
                      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
                      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
                      <div className="w-full h-[1px] bg-emerald-400/80 shadow-[0_0_8px_#34D399] absolute top-1/2 -translate-y-1/2 animate-pulse"></div>

                      <div className="absolute top-1.5 left-2 flex items-center space-x-1 font-mono text-[9px] text-emerald-400 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>EYE_ACTIVE</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-500 text-center text-[10px] p-2">
                    <FiCameraOff className="mx-auto mb-1 w-5 h-5 text-slate-600" />
                    CAMERA_PENDING_PERMISSION
                  </div>
                )}
              </div>

              <div className="p-2 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-600 font-mono">
                <span className="font-semibold text-slate-800">HARDWARE EYE</span>
                <span className="text-emerald-600 font-bold">1080p LIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Command Input Buffer */}
        {!isComplete && (
          <div className="absolute bottom-3 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-76 z-30">
            <div className="bg-white border border-slate-300 rounded-2xl p-2.5 sm:p-3.5 shadow-xl">
              <div className="flex items-end space-x-2">
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
                  placeholder="Type your response, explanation, or code here... (Shift+Enter for newline, Enter to submit)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs font-mono resize-none focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 transition"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputBuffer.trim() || thinking}
                  className="h-10 sm:h-12 px-5 sm:px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 shrink-0"
                >
                  <span className="text-xs">Submit</span>
                  <FiSend className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
