"use client";

import { useState } from "react";
import { Mail, Check, Lock } from "lucide-react";
import { signInWithEmail, signInWithPassword } from "@/lib/auth";

export default function SignIn() {
  const [mode, setMode] = useState("password"); // password | magic
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setError("");
    try {
      if (mode === "password") {
        const { error } = await signInWithPassword(email.trim(), password);
        if (error) throw error;
        // On success the auth listener swaps this screen for the app.
        setStatus("idle");
      } else {
        const { error } = await signInWithEmail(email.trim());
        if (error) throw error;
        setStatus("sent");
      }
    } catch (err) {
      console.error("Sign-in failed", err);
      setError(err?.message || "Could not sign in.");
      setStatus("error");
    }
  }

  function switchMode(next) {
    setMode(next);
    setStatus("idle");
    setError("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">Visual Funnel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to access your funnels.
        </p>

        {/* Mode tabs */}
        <div className="mt-5 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
          <button
            onClick={() => switchMode("password")}
            className={`rounded-md px-3 py-1 ${
              mode === "password"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => switchMode("magic")}
            className={`rounded-md px-3 py-1 ${
              mode === "magic"
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500"
            }`}
          >
            Email link
          </button>
        </div>

        {status === "sent" ? (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <Check size={18} className="mb-1" />
            Check <span className="font-medium">{email}</span> for a sign-in link.
            Open it on this device to continue.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
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

            {mode === "password" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mode === "password" ? <Lock size={16} /> : <Mail size={16} />}
              {status === "sending"
                ? mode === "password"
                  ? "Signing in…"
                  : "Sending…"
                : mode === "password"
                ? "Sign in"
                : "Email me a sign-in link"}
            </button>

            {status === "error" && (
              <p className="text-xs text-rose-600">{error}</p>
            )}

            <p className="text-[11px] text-slate-400">
              {mode === "password"
                ? "Set up your account in Supabase → Authentication → Users (Add user, with Auto Confirm)."
                : "No password needed — we'll email you a one-time link."}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
