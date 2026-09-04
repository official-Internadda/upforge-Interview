import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import CandidateStart from "./pages/CandidateStart";
// Baki tumhare components import rahenge...

// Sirf Admin ke routes ko protect karne ke liye:
function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Admin Login */}
          <Route path="/login" element={<Login />} />

          {/* Direct Candidate Entry link: /start ya /start/:id */}
          <Route path="/start/:id" element={<CandidateStart />} />
          <Route path="/start" element={<CandidateStart />} />

          {/* Baki tumhare existing routes yahan rahenge */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
