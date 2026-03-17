"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
  Trophy,
  ChevronLeft,
  Timer,
  Hash,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  Sparkles
} from "lucide-react";
import Link from "next/link";

function CreateTestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapterId = searchParams.get("chapterId");
  const chapterName = searchParams.get("chapterName");
  const subjectId = searchParams.get("subjectId");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    chapter_id: chapterId || "",
    timer_minutes: 30,
    question_count: 10,
    negative_marking: true,
    is_strict: false
  });

  useEffect(() => {
    if (chapterId) {
      setFormData(prev => ({ ...prev, chapter_id: chapterId }));
    }
    if (chapterName && !formData.title) {
      setFormData(prev => ({ ...prev, title: `Test: ${chapterName}` }));
    }
  }, [chapterId, chapterName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post("/tests", formData);
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/tests");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to create test. Please check if you have enough questions in this chapter.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-primary/40">
          <CheckCircle2 size={48} className="text-dark" strokeWidth={3} />
        </div>
        <h2 className="text-4xl font-black mb-2 tracking-tight">Test Created!</h2>
        <p className="text-gray-400 font-bold">Redirecting to test management...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link 
        href={`/dashboard/content/${subjectId}`} 
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-bold transition-colors group"
      >
        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
        Back to Curriculum
      </Link>

      <div className="bg-[#1B2838] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
              <Trophy size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Create New Test</h1>
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">
                Chapter: <span className="text-primary">{chapterName || "Global"}</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 flex items-start gap-3 animate-shake">
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-1">Test Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Master Quiz: Newton's 1st Law"
                className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white text-lg font-bold focus:ring-2 focus:ring-primary/50 focus:border-primary/30 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Timer size={14} className="text-primary" />
                  Time Limit (m)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.timer_minutes}
                  onChange={(e) => setFormData({ ...formData, timer_minutes: parseInt(e.target.value) })}
                  className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-center focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Hash size={14} className="text-secondary" />
                  Questions Count
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.question_count}
                  onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) })}
                  className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-center focus:ring-2 focus:ring-secondary/50 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, negative_marking: !formData.negative_marking })}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  formData.negative_marking 
                    ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                    : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                }`}
              >
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-widest">Negative marking</p>
                  <p className="text-[10px] font-bold opacity-60">Incorrect answers reduce points</p>
                </div>
                {formData.negative_marking ? <Settings2 size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-600" />}
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_strict: !formData.is_strict })}
                className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                  formData.is_strict 
                    ? "bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)]" 
                    : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                }`}
              >
                <div className="text-left">
                  <p className="font-black text-sm uppercase tracking-widest">Strict Mode</p>
                  <p className="text-[10px] font-bold opacity-60">Prevents app switching/exit</p>
                </div>
                {formData.is_strict ? <Sparkles size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-600" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-dark py-5 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-2xl shadow-primary/20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-4 border-dark border-t-transparent rounded-full animate-spin" />
                  Generating Test...
                </div>
              ) : (
                <>
                  <Sparkles size={24} />
                  Launch Test Factory
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CreateTestPage() {
  return (
    <div className="min-h-screen py-10">
      <Suspense fallback={
        <div className="max-w-2xl mx-auto py-20 bg-[#1B2838] rounded-[2.5rem] border border-white/5 animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white/5 rounded-2xl mb-4" />
          <div className="w-48 h-6 bg-white/5 rounded-full" />
          <div className="w-32 h-4 bg-white/5 rounded-full opacity-50" />
        </div>
      }>
        <CreateTestForm />
      </Suspense>
    </div>
  );
}
