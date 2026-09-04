import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiCopy, FiTrash2, FiExternalLink, FiLogOut, FiUsers, FiDollarSign, FiCheckCircle } from "react-icons/fi";

export default function AdminDashboard() {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState("");

  useEffect(() => {
    const q = query(collection(db, "sessions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSessions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const copyUniversalLink = (role) => {
    const link = `${window.location.origin}/test/${role.toLowerCase().replace(/\s+/g, "-")}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(role);
    setTimeout(() => setCopiedLink(""), 2000);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this candidate assessment record?")) {
      await deleteDoc(doc(db, "sessions", id));
    }
  };

  const paidCount = sessions.filter((s) => s.paymentStatus === "PAID").length;
  const totalRevenue = paidCount * 29;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-[#0c1222] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/logo.jpg" alt="Logo" className="h-8 w-auto rounded" />
          <span className="font-bold text-white text-base">UpForge & InternAdda Admin Console</span>
        </div>

        <button
          onClick={() => {
            adminLogout();
            navigate("/login");
          }}
          className="flex items-center space-x-2 text-xs text-red-400 hover:text-red-300 bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/50"
        >
          <FiLogOut />
          <span>Sign out</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Total Applicants</span>
              <FiUsers className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-white">{sessions.length}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Completed / Paid</span>
              <FiCheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-emerald-400">{paidCount}</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Total Pipeline Revenue (₹29)</span>
              <FiDollarSign className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold mt-2 text-sky-400 font-mono">₹{totalRevenue}</div>
          </div>
        </div>

        {/* Shareable Role Track Links */}
        <div className="mb-8 p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-2">Universal Candidate Links (Share with 10,000+ Students)</h3>
          <p className="text-xs text-slate-400 mb-4">
            Candidates who click will complete verification, pay ₹29 via Cashfree, and start their personalized proctored test.
          </p>

          <div className="flex flex-wrap gap-3">
            {["Software Engineer", "Data Analyst", "Frontend Engineer", "AI ML Intern"].map((r, i) => (
              <button
                key={i}
                onClick={() => copyUniversalLink(r)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition"
              >
                <FiCopy className="text-indigo-400" />
                <span>{copiedLink === r ? "Link Copied!" : `Copy Link: ${r}`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Assessment Records */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Live Candidate Pipeline</h3>
            <span className="text-xs text-slate-500 font-mono">Auto-sync with Firestore</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">AI Score</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{s.candidateName}</div>
                      <div className="text-[11px] text-slate-500">{s.candidateEmail}</div>
                      <div className="text-[10px] text-slate-600 font-mono">{s.candidatePhone}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">{s.role}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.paymentStatus === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {s.paymentStatus || "PENDING"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-400 capitalize">{s.status?.replace("_", " ")}</span>
                    </td>
                    <td className="p-4">
                      {s.report ? (
                        <span className="font-bold text-emerald-400 text-sm">{s.report.overallScore}/10</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      {s.report && (
                        <Link
                          to={`/admin/report/${s.sessionId}`}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center"
                        >
                          <FiExternalLink className="mr-1" /> Report
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
