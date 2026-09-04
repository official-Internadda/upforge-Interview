import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AssessmentGateway from "./pages/AssessmentGateway";
import TerminalRoom from "./pages/TerminalRoom";
import SessionReport from "./pages/SessionReport";
import VerifyPayment from "./pages/VerifyPayment";

function AdminRoute({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* High-Converting Corporate Landing Page */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Universal Assessment Link for Candidates */}
          <Route path="/test/:role" element={<AssessmentGateway />} />
          <Route path="/test" element={<AssessmentGateway />} />
          <Route path="/room/:sessionId" element={<TerminalRoom />} />
          <Route path="/verify-payment" element={<VerifyPayment />} />

          {/* Super Secret Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
