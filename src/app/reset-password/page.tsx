"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: "Invalid or missing reset token." });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/auth/reset-password", { token, newPassword });
      setMessage({ type: "success", text: res.data.message });
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to reset password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#1B2838] rounded-3xl p-8 border border-white/10 shadow-2xl">
      <div className="text-center mb-10">
        <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="text-primary w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-white">Reset Password</h1>
        <p className="text-gray-400 mt-2 text-sm">Create a strong new password for your account.</p>
      </div>

      {!token ? (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-6 rounded-2xl text-center">
          <AlertCircle size={40} className="mx-auto mb-4" />
          <p className="font-bold">Invalid Reset Link</p>
          <p className="text-xs mt-2">The link is missing a token. Please check your email again.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-dark font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] p-4 font-inter">
      <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
