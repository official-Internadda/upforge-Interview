import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { FiCameraOff, FiAlertTriangle, FiMic, FiMicOff, FiSend, FiClock } from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const INTERVIEW_DURATION_SECONDS = 600; // 10 Minutes

export default function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isTerminated, setIsTerminated] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION_SECONDS);

  // Proctoring States
  const [stream, setStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningToast, setShowWarningToast] = useState(false);

  const bottomRef = useRef(null);
  const videoRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Load Session
  useEffect(() => {
    async function fetchSession() {
      try {
        const q = query(collection(db, "sessions"), where("sessionId", "==", sessionId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          setSession(data);
          setDocId(docSnap.id);
          if (data.status === "terminated") setIsTerminated(true);
          if (data.status === "completed") setIsComplete(true);
        }
      } catch (err) {
        console.error("Session load error:", err);
      }
      setLoading(false);
    }
    fetchSession();
  }, [sessionId]);

  // Sync Voice Transcript with Unified Input Box
  useEffect(() => {
    if (transcript) {
      setInputText((prev) => {
        const base = prev ? prev.trim() + " " : "";
        return base + transcript;
      });
      resetTranscript();
    }
  }, [transcript]);

  // 10-Minute Countdown Timer
  useEffect(() => {
    if (loading || isComplete || isTerminated) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isComplete, isTerminated, docId, messages]);

  async function handleTimeExpired() {
    setIsComplete(true);
    stopListening();
    if (synthRef.current) synthRef.current.cancel();

    if (docId) {
      await updateDoc(doc(db, "sessions", docId), {
        transcript: messages,
        status: "completed",
        completedAt: new Date().toISOString(),
        terminationReason: "10-Minute Window Completed",
      });
      generateReport(messages);
    }
  }

  // Camera & Anti-cheating setup
  useEffect(() => {
    if (!docId || isTerminated || isComplete) return;
    let activeStream = null;

    async function enableCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(mediaStream);
        setCameraEnabled(true);
        activeStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera access error:", err);
        setCameraEnabled(false);
      }
    }

    const handleTabViolation = async () => {
      if (document.hidden && !isComplete && !isTerminated) {
        setWarnings((w) => {
          const updated = w + 1;
          if (updated >= 3) triggerTermination();
          else {
            setShowWarningToast(true);
            setTimeout(() => setShowWarningToast(false), 4000);
          }
          return updated;
        });
      }
    };

    async function triggerTermination() {
      setIsTerminated(true);
      setShowWarningToast(false);
      stopListening();
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      try {
        await updateDoc(doc(db, "sessions", docId), {
          status: "terminated",
          terminatedAt: new Date().toISOString(),
          warningsCount: 3,
          terminationReason: "Integrity Violation: Unauthorized tab switching",
        });
      } catch (err) {
        console.error("Failed to terminate session:", err);
      }
    }

    enableCamera();
    document.addEventListener("visibilitychange", handleTabViolation);

    return () => {
      document.removeEventListener("visibilitychange", handleTabViolation);
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [docId, isTerminated, isComplete]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Initial Question
  useEffect(() => {
    if (session && messages.length === 0) {
      askAI([]);
    }
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Executive AI Voice Settings
  function speakText(text, onDone) {
    if (!window.speechSynthesis) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    const voices = synthRef.current.getVoices();
    const premiumVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))) ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];

    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onDone) onDone();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onDone) onDone();
    };

    synthRef.current.speak(utterance);
  }

  async function startListening() {
    try {
      resetTranscript();
      setMicActive(true);
      await SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
    } catch (err) {
      console.error("Mic start error:", err);
      setMicActive(false);
    }
  }

  function stopListening() {
    setMicActive(false);
    SpeechRecognition.stopListening();
  }

  function toggleMic() {
    if (micActive || listening) {
      stopListening();
    } else {
      if (synthRef.current) synthRef.current.cancel();
      startListening();
    }
  }

  async function generateReport(finalMessages) {
    try {
      const response = await fetch(`${BACKEND}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: finalMessages,
          role: session.role,
          experienceLevel: session.experienceLevel,
          candidateName: session.candidateName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        await updateDoc(doc(db, "sessions", docId), {
          report: data.report,
          warningsCount: warnings,
        });
      }
    } catch (err) {
      console.error("Report error:", err);
    }
  }

  async function askAI(currentMessages) {
    setThinking(true);
    try {
      const response = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          resumeText: session.resumeText,
          role: session.role,
          experienceLevel: session.experienceLevel,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const aiMessage = { role: "assistant", content: data.reply };
      const updatedMessages = [...currentMessages, aiMessage];
      setMessages(updatedMessages);
      setQuestionCount((c) => c + 1);

      if (data.isComplete) {
        setIsComplete(true);
        stopListening();
        await updateDoc(doc(db, "sessions", docId), {
          transcript: updatedMessages,
          status: "completed",
          completedAt: new Date().toISOString(),
          warningsCount: warnings,
        });
        speakText(data.reply, null);
        generateReport(updatedMessages);
      } else {
        speakText(data.reply, null);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, could you please repeat or submit that again?",
        },
      ]);
    }
    setThinking(false);
  }

  async function handleSubmitAnswer() {
    const trimmed = inputText.trim();
    if (!trimmed || thinking || isComplete) return;

    if (micActive) stopListening();

    const userMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    await askAI(updatedMessages);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  }

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-red-800 rounded-2xl p-8 text-center">
          <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Session Terminated</h1>
          <p className="text-sm text-slate-400">
            Automated integrity protocols flagged 3 out-of-window violations. Your evaluation has been locked.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#070b14] flex flex-col font-sans overflow-hidden text-slate-100">
      {/* Tab Switch Warning Toast */}
      {showWarningToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600/95 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 animate-bounce border border-red-400">
          <FiAlertTriangle className="w-5 h-5" />
          <span className="font-semibold text-sm">Strike {warnings}/3: Do not switch tabs or windows!</span>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-[#0c1222]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight">{session?.role}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {session?.experienceLevel || "Evaluation"}
                </span>
              </div>
              <p className="text-xs text-slate-400">Candidate: {session?.candidateName}</p>
            </div>
          </div>

          {/* Center Timer */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 font-mono shadow-inner">
            <FiClock className={`w-4 h-4 ${timeLeft < 120 ? "text-red-400 animate-pulse" : "text-indigo-400"}`} />
            <span className={`text-sm font-bold ${timeLeft < 120 ? "text-red-400 animate-pulse" : "text-slate-200"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 font-medium">Question {questionCount}</span>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{isComplete ? "Completed" : "Proctored Live"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 mt-16 flex flex-col relative overflow-hidden">
        {/* Floating Candidate Camera Box */}
        <div className="absolute right-6 top-6 z-30 flex flex-col gap-3 w-48 sm:w-60 pointer-events-none">
          <div className="relative w-full h-36 sm:h-44 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 pointer-events-auto ring-1 ring-white/10">
            {cameraEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                <FiCameraOff className="w-6 h-6 mb-1 opacity-50" />
                <span className="text-[10px]">Camera Standby</span>
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] font-bold text-slate-200">
              Candidate View
            </div>
            {micActive && (
              <div className="absolute top-2 right-2 flex items-center space-x-1.5 bg-red-600/90 text-white px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>RECORDING</span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto w-full relative z-10 pb-48">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:pr-72 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-md ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-[#111827] border border-slate-800 text-slate-200 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-[#111827] border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center space-x-2">
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full"></span>
                  <span>Interviewer is analyzing your response...</span>
                </div>
              </div>
            )}

            {isComplete && (
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-2xl p-6 text-center shadow-lg">
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Interview Concluded</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Thank you for your time. Your assessment metrics and technical evaluation report have been generated.
                </p>
                <button
                  onClick={() => navigate(`/admin/report/${sessionId}`)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl text-sm transition"
                >
                  Review Candidate Report
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Hybrid Voice + Text Control Bar */}
        {!isComplete && (
          <div className="absolute bottom-6 left-0 w-full z-20 pointer-events-none">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 md:pr-72">
              <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl rounded-2xl p-3.5 pointer-events-auto">
                <div className="flex items-end space-x-2">
                  {/* Mic Toggle Button */}
                  <button
                    onClick={toggleMic}
                    disabled={thinking}
                    title={micActive ? "Stop Microphone" : "Speak (Dictate Answer)"}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg transition-all flex-shrink-0 shadow-md ${
                      micActive
                        ? "bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-400/50 animate-pulse"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {micActive ? <FiMicOff /> : <FiMic />}
                  </button>

                  {/* Unified Input Box (Supports typing & speech dictation simultaneously) */}
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={thinking}
                    placeholder={
                      micActive
                        ? "Listening... Speak now (you can also edit your words here)"
                        : "Type your response, or click the mic to speak..."
                    }
                    className="flex-1 bg-slate-900 border border-slate-700/70 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500 transition"
                    rows={2}
                  />

                  {/* Manual Submit Button */}
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!inputText.trim() || thinking}
                    className="h-12 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition flex items-center space-x-2 flex-shrink-0 shadow-lg shadow-indigo-600/20"
                  >
                    <span>Submit</span>
                    <FiSend className="w-4 h-4" />
                  </button>
                </div>

                {/* Status caption */}
                <div className="flex justify-between items-center mt-2 px-1 text-[11px] text-slate-400">
                  <span>{micActive ? "🎙️ Dictation Active • Click Mic again to stop" : "Press Enter or click Submit when finished"}</span>
                  <span className="font-mono text-slate-500">{inputText.length} chars</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
