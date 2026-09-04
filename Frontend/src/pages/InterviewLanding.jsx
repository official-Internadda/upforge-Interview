import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function InterviewLanding() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [docId, setDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [candidateNameInput, setCandidateNameInput] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    async function fetchSession() {
      try {
        const q = query(collection(db, "sessions"), where("sessionId", "==", sessionId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setNotFound(true);
        } else {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          setSession(data);
          setDocId(docSnap.id);
          setCandidateNameInput(data.candidateName || "");
          if (data.resumeText) setUploaded(true);
        }
      } catch (err) {
        setNotFound(true);
      }
      setLoading(false);
    }
    fetchSession();
  }, [sessionId]);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setUploadError("");
    } else {
      setUploadError("Please upload a PDF file.");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setUploadError("");
    } else {
      setUploadError("Please drop a PDF file.");
    }
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await fetch(`${BACKEND}/parse-resume`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      await updateDoc(doc(db, "sessions", docId), {
        resumeText: data.text,
        candidateName: candidateNameInput.trim() || session.candidateName || "Candidate",
        status: "in_progress",
        resumeUploadedAt: new Date().toISOString(),
      });
      setUploaded(true);
    } catch (err) {
      setUploadError(err.message || "Something went wrong. Try again.");
    }
    setUploading(false);
  }

  async function enableTestCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraStream(mediaStream);
      setCameraError("");
    } catch (err) {
      setCameraError("Camera/Microphone access denied. Please allow permissions to proceed.");
    }
  }

  function handleStartInterview() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    navigate(`/interview/${sessionId}/start`);
  }

  useEffect(() => {
    const videoObj = document.getElementById("setupVideo");
    if (videoObj && cameraStream) {
      videoObj.srcObject = cameraStream;
    }
  }, [cameraStream, uploaded, setupComplete]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Invalid Session</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">This interview link doesn't exist or has expired.</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  if (session?.startTime && now < new Date(session.startTime)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Not Started</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Scheduled to start at:</p>
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg inline-block">
            <p className="font-medium text-blue-800 dark:text-blue-300">{new Date(session.startTime).toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  if (session?.endTime && now > new Date(session.endTime) && session.status !== "completed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Time Exceeded</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The allowed time window for this interview has expired.</p>
        </div>
      </div>
    );
  }

  if (session?.status === "completed") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Interview Already Completed</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Your responses have already been recorded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Interview Portal</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Role: {session.role}</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Your AI Interview
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Interview for Position: <span className="font-semibold text-blue-600 dark:text-blue-400">{session.role}</span>
          </p>
        </div>

        {!uploaded ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-8 sm:p-10 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={candidateNameInput}
                  onChange={(e) => setCandidateNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Resume (PDF)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${
                    dragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10" : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input id="file-upload" type="file" className="sr-only" accept="application/pdf" onChange={handleFileChange} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 10MB</p>
                  </div>
                </div>

                {file && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-md text-sm text-gray-800 dark:text-gray-200">
                    Selected: {file.name}
                  </div>
                )}

                {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/10 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || uploading || !candidateNameInput.trim()}
                className="px-6 py-2.5 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {uploading ? "Parsing Resume..." : "Continue to Setup"}
              </button>
            </div>
          </div>
        ) : !setupComplete ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">Check Camera & Rules</h2>
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {cameraStream ? (
                <video id="setupVideo" autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              ) : (
                <button onClick={enableTestCamera} className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium">
                  Enable Camera & Mic
                </button>
              )}
            </div>
            {cameraError && <p className="text-red-500 text-sm">{cameraError}</p>}
            <button
              onClick={() => setSetupComplete(true)}
              disabled={!cameraStream}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-bold disabled:opacity-50"
            >
              Start Interview
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ready for your interview</h2>
            <p className="text-gray-600 dark:text-gray-300">Microphone and Camera configured successfully.</p>
            <button
              onClick={handleStartInterview}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg"
            >
              Enter Interview Room Now
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
