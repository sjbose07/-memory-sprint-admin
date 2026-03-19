"use client";

import { useState } from "react";
import { Lock, ShieldCheck, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

export default function SettingsSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.post("/auth/change-password", {
        oldPassword: currentPassword,
        newPassword
      });
      setMessage({ type: "success", text: res.data.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let strength = 0;
    if (newPassword.length >= 8) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 25;
    if (/[!@#$%^&*()]/.test(newPassword)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 p-4 lg:p-10 font-inter">
      <header>
        <h1 className="text-4xl font-black text-white italic tracking-tight">Security Settings</h1>
        <p className="text-gray-400 mt-2 text-lg font-medium">Manage your account security and password.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-[#1B2838] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Lock className="text-primary" size={20} />
              Update Password
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Strength Meter */}
                <div className="mt-3 px-1">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        strength <= 25 ? 'bg-red-500' : strength <= 50 ? 'bg-orange-500' : strength <= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] font-bold uppercase tracking-tighter">
                    <span className={strength >= 25 ? 'text-primary' : 'text-gray-600'}>8+ Chars</span>
                    <span className={strength >= 50 ? 'text-primary' : 'text-gray-600'}>ABC/abc</span>
                    <span className={strength >= 75 ? 'text-primary' : 'text-gray-600'}>Number</span>
                    <span className={strength >= 100 ? 'text-primary' : 'text-gray-600'}>Symbol</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
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
                  {message.type === "success" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                  <p className="text-sm font-bold">{message.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (newPassword !== "" && strength < 100)}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/30 text-dark font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-lg shadow-xl shadow-primary/10"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Update Secure Password"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-red-500/5 border border-red-500/10 rounded-[2rem] p-8">
            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} />
              Important
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              Updating your password will require you to log in again on all other devices. 
              Always use a unique password that you don't use on other websites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
