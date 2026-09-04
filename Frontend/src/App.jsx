import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import CreateSession from "./pages/CreateSession";
import SessionReport from "./pages/SessionReport";
import InterviewLanding from "./pages/InterviewLanding";
import InterviewRoom from "./pages/InterviewRoom";

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes - Protected by hardcoded Master Key */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/create"
            element={
              <AdminRoute>
                <CreateSession />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/report/:sessionId"
            element={
              <AdminRoute>
                <SessionReport />
              </AdminRoute>
            }
          />

          {/* Candidate Direct Routes - No Login, Direct Link Access */}
          <Route path="/interview/:sessionId" element={<InterviewLanding />} />
          <Route path="/interview/:sessionId/start" element={<InterviewRoom />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
