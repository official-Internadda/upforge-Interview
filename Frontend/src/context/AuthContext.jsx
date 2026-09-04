"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// MASTER ADMIN CREDENTIALS (Code me hardcoded)
export const MASTER_ADMIN = {
  key: "UPFORGE_ADMIN_2026",
  email: "admin@internadda.com",
  password: "SuperSecretAdmin123#@"
};

interface CandidateData {
  name: string;
  email: string;
  interviewId?: string;
}

interface AuthContextType {
  isAdmin: boolean;
  adminLogin: (email: string, pass: string) => boolean;
  adminLogout: () => void;
  candidate: CandidateData | null;
  setCandidate: (data: CandidateData) => void;
  clearCandidate: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  adminLogin: () => false,
  adminLogout: () => {},
  candidate: null,
  setCandidate: () => {},
  clearCandidate: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [candidate, setCandidateState] = useState<CandidateData | null>(null);

  useEffect(() => {
    // Check Admin session
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("upforge_admin_logged");
      if (adminToken === MASTER_ADMIN.key) {
        setIsAdmin(true);
      }
      
      // Check Candidate session
      const savedCandidate = localStorage.getItem("upforge_active_candidate");
      if (savedCandidate) {
        try {
          setCandidateState(JSON.parse(savedCandidate));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const adminLogin = (email: string, pass: string) => {
    if (
      (email.trim() === MASTER_ADMIN.email && pass.trim() === MASTER_ADMIN.password) ||
      pass.trim() === MASTER_ADMIN.key
    ) {
      localStorage.setItem("upforge_admin_logged", MASTER_ADMIN.key);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    localStorage.removeItem("upforge_admin_logged");
    setIsAdmin(false);
  };

  const setCandidate = (data: CandidateData) => {
    localStorage.setItem("upforge_active_candidate", JSON.stringify(data));
    setCandidateState(data);
  };

  const clearCandidate = () => {
    localStorage.removeItem("upforge_active_candidate");
    setCandidateState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminLogin,
        adminLogout,
        candidate,
        setCandidate,
        clearCandidate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
