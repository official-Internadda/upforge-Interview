"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// SUPER SECRET ADMIN CREDENTIALS (Code me chupa hua)
export const ADMIN_SECRET_KEY = "UPFORGE_ADMIN_SECRET_2026";
export const ADMIN_CREDENTIALS = {
  email: "admin@internadda.com",
  password: "SuperSecretPassword123#@"
};

interface AuthContextType {
  isAdmin: boolean;
  adminLogin: (email: string, pass: string) => boolean;
  adminLogout: () => void;
  candidateName: string;
  candidateEmail: string;
  setCandidateSession: (name: string, email: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  adminLogin: () => false,
  adminLogout: () => {},
  candidateName: "",
  candidateEmail: "",
  setCandidateSession: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>("");
  const [candidateEmail, setCandidateEmail] = useState<string>("");

  useEffect(() => {
    // Check saved session in browser
    const storedAdmin = localStorage.getItem("upforge_admin_token");
    if (storedAdmin === ADMIN_SECRET_KEY) {
      setIsAdmin(true);
    }
    const cName = localStorage.getItem("upforge_candidate_name");
    const cEmail = localStorage.getItem("upforge_candidate_email");
    if (cName) setCandidateName(cName);
    if (cEmail) setCandidateEmail(cEmail);
  }, []);

  const adminLogin = (email: string, pass: string) => {
    if (
      (email === ADMIN_CREDENTIALS.email && pass === ADMIN_CREDENTIALS.password) ||
      pass === ADMIN_SECRET_KEY
    ) {
      localStorage.setItem("upforge_admin_token", ADMIN_SECRET_KEY);
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    localStorage.removeItem("upforge_admin_token");
    setIsAdmin(false);
  };

  const setCandidateSession = (name: string, email: string) => {
    localStorage.setItem("upforge_candidate_name", name);
    localStorage.setItem("upforge_candidate_email", email);
    setCandidateName(name);
    setCandidateEmail(email);
  };

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminLogin,
        adminLogout,
        candidateName,
        candidateEmail,
        setCandidateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
