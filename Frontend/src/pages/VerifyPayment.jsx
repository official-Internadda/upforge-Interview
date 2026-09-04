import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

const BACKEND = import.meta.env.VITE_API_BASE_URL || "https://interview-api.internadda.com";

export default function VerifyPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState("Verifying payment security...");

  useEffect(() => {
    async function verify() {
      if (!orderId) {
        setStatus("Invalid payment session reference.");
        return;
      }

      try {
        const res = await fetch(`${BACKEND}/verify-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();

        if (data.success) {
          setStatus("Payment Verified! Preparing your terminal assessment...");

          const q = query(collection(db, "sessions"), where("orderId", "==", orderId));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docRef = doc(db, "sessions", snap.docs[0].id);
            const sessionData = snap.docs[0].data();

            await updateDoc(docRef, {
              paymentStatus: "PAID",
              status: "ready_to_start",
              paidAt: new Date().toISOString(),
            });

            setTimeout(() => {
              navigate(`/room/${sessionData.sessionId}`);
            }, 1000);
          } else {
            setStatus("Session reference not found. Please contact support.");
          }
        } else {
          setStatus("Payment transaction incomplete. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setStatus("Verification network error. Please refresh.");
      }
    }

    verify();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 px-4">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center max-w-md w-full shadow-lg">
        <div className="w-12 h-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-bold mb-2 text-slate-900">Validating Cashfree Transaction</h2>
        <p className="text-xs text-slate-500 font-mono">{status}</p>
      </div>
    </div>
  );
}
