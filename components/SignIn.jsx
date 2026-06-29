"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { signInWithEmail } from "@/lib/auth";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError("");
    try {
      const { error } = await signInWithEmail(email.trim());
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      console.error("Sign-in failed", err);
      setError(err?.message || "Could not send the sign-in link.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">Journey Funnel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your email to access your journeys.
        </p>

        {status === "sent" ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <Check size={18} className="mb-1" />
            Check <span className="font-medium">{email}</span> for a sign-in link.
            Open it on this device to continue.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-500">
                Email
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={status === "sending"}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Mail size={16} />
              {status === "sending" ? "Sending…" : "Email me a sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-xs text-rose-600">{error}</p>
            )}
            <p className="text-[11px] text-slate-400">
              No password needed — we&apos;ll email you a one-time link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
