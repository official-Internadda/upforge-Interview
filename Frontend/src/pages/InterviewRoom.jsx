import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { FiCameraOff, FiAlertTriangle } from "react-icons/fi";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
  const [mode, setMode] = useState("voice");
  const [textInput, setTextInput] = useState("");
  const [micSupported, setMicSupported] = useState(true);

  // Camera & Proctoring States
  const [stream, setStream] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningToast, setShowWarningToast] = useState(false);

  const bottomRef = useRef(null);
  const videoRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const listeningActiveRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const lastTranscriptRef = useRef("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
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

  // Check Speech Recognition Capability
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setMicSupported(false);
      setMode("text");
    }
  }, [browserSupportsSpeechRecognition]);

  // Camera & Anti-cheating setup
  useEffect(() => {
    if (!docId || isTerminated || isComplete) return;
    let activeStream = null;

    async function enableCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false, // Keep audio free for speech recognition
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
          terminationReason: "Cheating Detected (Tab Switches)",
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

  // Start interview on session load
  useEffect(() => {
    if (session && messages.length === 0) {
      askAI([]);
    }
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Silence Detector (Sends spoken response after 2.5s of silence)
  useEffect(() => {
    if (!listening || !listeningActiveRef.current) return;
    if (transcript === lastTranscriptRef.current) return;

    lastTranscriptRef.current = transcript;
    clearTimeout(silenceTimerRef.current);

    silenceTimerRef.current = setTimeout(() => {
      if (transcript.trim() && listeningActiveRef.current) {
        stopListening();
        handleVoiceSend(transcript.trim());
      }
    }, 2500);
  }, [transcript, listening]);

  function speakText(text, onDone) {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = synthRef.current.getVoices();
    const preferred =
      voices.find((v) => v.lang === "en-US" && v.name.toLowerCase().includes("natural")) ||
      voices.find((v) => v.lang === "en-US") ||
      voices[0];

    if (preferred) utterance.voice = preferred;

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
      lastTranscriptRef.current = "";
      listeningActiveRef.current = true;
      await SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  }

  function stopListening() {
    listeningActiveRef.current = false;
    clearTimeout(silenceTimerRef.current);
    SpeechRecognition.stopListening();
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
      console.error("Report generation failed:", err);
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
        await updateDoc(doc(db, "sessions", docId), {
          transcript: updatedMessages,
          status: "completed",
          completedAt: new Date().toISOString(),
          warningsCount: warnings,
        });
        speakText(data.reply, null);
        generateReport(updatedMessages);
      } else {
        // AI speaks, then auto-starts listening if in voice mode
        speakText(data.reply, () => {
          if (mode === "voice" && !isComplete) {
            startListening();
          }
        });
      }
    } catch (err) {
      console.error("Chat fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting. Please refresh and try again.",
        },
      ]);
    }
    setThinking(false);
  }

  async function handleVoiceSend(spokenText) {
    if (!spokenText || thinking || isComplete) return;
    const userMessage = { role: "user", content: spokenText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    resetTranscript();
    await askAI(updatedMessages);
  }

  async function handleTextSend() {
    const trimmed = textInput.trim();
    if (!trimmed || thinking || isComplete) return;
    const updatedMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(updatedMessages);
    setTextInput("");
    await askAI(updatedMessages);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  }

  function handleMicClick() {
    if (listening) {
      stopListening();
    } else {
      synthRef.current.cancel();
      startListening();
    }
  }

  function getStatusLabel() {
    if (thinking) return { text: "AI is thinking...", color: "text-yellow-400", dot: "bg-yellow-400" };
    if (isSpeaking) return { text: "AI Interviewer speaking...", color: "text-blue-400", dot: "bg-blue-400" };
    if (listening) return { text: "Listening... speak now", color: "text-emerald-400", dot: "bg-emerald-400" };
    if (isComplete) return { text: "Interview complete", color: "text-emerald-400", dot: "bg-emerald-400" };
    return { text: "Click Mic to Answer", color: "text-slate-400", dot: "bg-slate-500" };
  }

  const status = getStatusLabel();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-red-800 rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Interview Terminated</h1>
          <p className="text-sm text-slate-400">Multiple tab violations detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden text-white">
      {/* Toast Warning */}
      {showWarningToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <FiAlertTriangle className="w-5 h-5" />
          <span className="font-semibold text-sm">Warning: Do not switch tabs!</span>
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-base font-bold">AI Interview</h1>
              <p className="text-xs text-slate-400">
                {session?.role} • {session?.candidateName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {micSupported && (
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => {
                    synthRef.current.cancel();
                    setMode("voice");
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    mode === "voice" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Voice
                </button>
                <button
                  onClick={() => {
                    stopListening();
                    setMode("text");
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    mode === "text" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Text
                </button>
              </div>
            )}
            <span className="text-xs text-slate-400 font-medium">Question {questionCount}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 mt-16 flex flex-col relative overflow-hidden">
        {/* Status Bar */}
        <div className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 py-2.5 z-20">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${status.dot} animate-pulse`}></span>
              <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
            </div>
            {mode === "voice" && listening && (
              <span className="text-xs text-red-400 font-mono animate-pulse">● Recording Voice...</span>
            )}
          </div>
        </div>

        {/* Floating User Camera Video */}
        <div className="absolute right-6 top-20 z-30 flex flex-col gap-3 w-44 sm:w-56 pointer-events-none">
          <div className="relative w-full h-32 sm:h-40 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 pointer-events-auto">
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
                <span className="text-[10px]">Camera Inactive</span>
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold">
              You
            </div>
            {listening && (
              <div className="absolute top-2 right-2 flex items-center space-x-1 bg-emerald-600/80 px-2 py-0.5 rounded text-[10px] font-bold">
                <span>MIC ON</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto w-full relative z-10 pb-44">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:pr-64 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center space-x-2">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>
                  <span>AI Interviewer is evaluating...</span>
                </div>
              </div>
            )}

            {listening && transcript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-emerald-950/40 border border-emerald-800 rounded-2xl px-4 py-2.5 text-xs text-emerald-300 italic">
                  {transcript}...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Bar */}
        {!isComplete && (
          <div className="absolute bottom-6 left-0 w-full z-20 pointer-events-none">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 md:pr-64">
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 shadow-2xl rounded-2xl p-4 pointer-events-auto">
                {mode === "voice" ? (
                  <div className="flex flex-col items-center space-y-3">
                    <button
                      onClick={handleMicClick}
                      disabled={thinking || isSpeaking}
                      className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-xl disabled:opacity-40 ${
                        listening
                          ? "bg-rose-600 hover:bg-rose-500 text-white scale-105 animate-pulse ring-4 ring-rose-500/30"
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {listening ? "🛑" : "🎙️"}
                    </button>
                    <p className="text-xs text-slate-400 text-center">
                      {listening
                        ? "Listening to you... Stays silent 2.5s to submit"
                        : "Tap mic and speak your answer"}
                    </p>
                  </div>
                ) : (
                  <div className="flex space-x-3 items-end">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={thinking}
                      placeholder="Type your answer here..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 text-white"
                      rows={2}
                    />
                    <button
                      onClick={handleTextSend}
                      disabled={!textInput.trim() || thinking}
                      className="h-12 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
