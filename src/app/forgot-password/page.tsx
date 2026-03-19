"use client";

import { useState } from "react";
import { Mail, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage({ type: "success", text: res.data.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to send reset email" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] p-4 font-inter">
      <div className="w-full max-w-md bg-[#1B2838] rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-sm font-bold group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">Forgot Password?</h1>
          <p className="text-gray-400 mt-2 text-sm">No worries, we'll send you reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                placeholder="admin@mcq.dev"
                required
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"
            }`}>
              {message.type === "success" ? <CheckCircle2 size={20} /> : <Mail size={20} />}
              <p className="text-sm font-bold">{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-dark font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}
