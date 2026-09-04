import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export default function CreateSession() {
  const navigate = useNavigate();
  const [candidateName, setCandidateName] = useState("");
  const [role, setRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const sessionId = crypto.randomUUID();
      if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
        setError("End time must be after the start time.");
        setLoading(false);
        return;
      }
      await addDoc(collection(db, "sessions"), {
        sessionId,
        candidateName: candidateName.trim() || "Candidate",
        candidateEmail: "",
        role: role.trim(),
        experienceLevel,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        status: "pending",
        createdBy: "admin_master_uid",
        createdAt: new Date().toISOString(),
        resumeText: null,
        transcript: [],
        report: null,
      });
      navigate("/admin");
    } catch (err) {
      console.error(err);
      setError("Failed to create session. Try again.");
    }
    setLoading(false);
  }

  const inputClass =
    "block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 px-4 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-blue-500 shadow-sm transition";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">Interview Manager</span>
              </div>
            </div>
            <Link
              to="/admin"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Interview Session</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Configure role and schedule to generate candidate link
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreate} className="px-6 py-8 sm:p-10">
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Interview Details</h2>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Candidate Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="candidateName"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role / Position
                    </label>
                    <input
                      type="text"
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="e.g. Frontend Developer"
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Difficulty / Experience Level
                    </label>
                    <select
                      id="experienceLevel"
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="fresher">Fresher (0 - 1 years)</option>
                      <option value="junior">Junior (1 - 2 years)</option>
                      <option value="mid">Mid-level (2 - 4 years)</option>
                      <option value="senior">Senior (4+ years)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-6 border-t border-gray-100 dark:border-gray-700/50 pt-6 mt-2">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Time Constraints (Optional)</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Start Time
                        </label>
                        <input
                          type="datetime-local"
                          id="startTime"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Time
                        </label>
                        <input
                          type="datetime-local"
                          id="endTime"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-3 inline-flex items-center rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating..." : "Create Session & Generate Link"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
