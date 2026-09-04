import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import CandidateStart from "./pages/CandidateStart";

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" replace />;
}

function AdminDashboard() {
  const { adminLogout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Portal</h1>
          <button
            onClick={adminLogout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Direct candidate interview link:
        </p>
        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-emerald-400 font-mono text-sm">
          {window.location.origin}/start
        </div>
      </div>
    </div>
  );
}

function DefaultNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-slate-400 mb-4">Page not found</p>
      <a href="/start" className="text-blue-400 underline text-sm">Go to Candidate Start</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/start" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/start" element={<CandidateStart />} />
          <Route path="/start/:id" element={<CandidateStart />} />
          <Route path="/interview/:id" element={<CandidateStart />} />
          <Route path="*" element={<DefaultNotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
