"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.token) {
        if (response.data.user.role !== "admin") {
          setError("Access denied. Admin privileges required.");
          setLoading(false);
          return;
        }

        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login detailed error:", err);
      if (err.response) {
        // The server responded with a status code that falls out of the range of 2xx
        setError(`${err.response.data?.error || "Invalid Credentials"} (Status: ${err.response.status})`);
      } else if (err.request) {
        // The request was made but no response was received
        setError("No response from server. Check Hugging Face Space status or CORS.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Request error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D1B2A] p-4">
      <div className="w-full max-w-md bg-[#1B2838] rounded-3xl p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-10">
          <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-gray-400 mt-2 text-sm">Secure access to MCQ Practice control</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="admin@mcq.dev"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <Link href="/forgot-password" title="Forgot Password" icon-name="ExternalLink" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm py-3 px-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-dark font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
          <p className="text-[10px] text-gray-500 text-center leading-relaxed">
            Note: Admin signup is disabled for security. <br />
            Contact the system administrator to create a new admin account.
          </p>
        </div>
      </div>
    </div>

  );
}

