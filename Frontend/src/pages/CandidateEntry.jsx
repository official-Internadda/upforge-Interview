import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CandidateEntry() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { setCandidate } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const handleStart = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setCandidate({
      name: name.trim(),
      email: email.trim(),
      interviewId: id,
    });

    navigate(`/interview/${id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-2 text-center">Start Your AI Interview</h2>
        <p className="text-xs text-slate-400 mb-6 text-center">
          Enter your basic info to begin your session.
        </p>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="text-xs text-slate-300 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg text-sm transition mt-2 shadow-lg shadow-emerald-600/20"
          >
            Join Interview Room
          </button>
        </form>
      </div>
    </div>
  );
}
