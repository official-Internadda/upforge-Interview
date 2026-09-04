import React, { createContext, useContext, useState, useEffect } from "react";

export const MASTER_ADMIN = {
  key: "UPFORGE_ADMIN_2026",
  email: "admin@internadda.com",
  password: "SuperSecretAdmin123#@"
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidate, setCandidateState] = useState(null);

  useEffect(() => {
    const adminToken = localStorage.getItem("upforge_admin_logged");
    if (adminToken === MASTER_ADMIN.key) {
      setIsAdmin(true);
    }
    const savedCandidate = localStorage.getItem("upforge_active_candidate");
    if (savedCandidate) {
      try {
        setCandidateState(JSON.parse(savedCandidate));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const adminLogin = (email, pass) => {
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

  const setCandidate = (data) => {
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
