"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
  Upload,
  ChevronLeft,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Type,
  Tag
} from "lucide-react";
import Link from "next/link";

export default function SubjectBulkUploadPage() {
  const router = useRouter();
  const { subjectId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "mcq"; // 'mcq' or 'oneliner'
  
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [successState, setSuccessState] = useState(false);

  const [formData, setFormData] = useState({
    chapterName: "",
    tags: "",
    description: "",
    textContent: ""
  });

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await api.get(`/subjects`);
        const currentSub = res.data.find((s: any) => s.id === subjectId);
        setSubject(currentSub);
      } catch (err) {
        console.error("Failed to fetch subject", err);
      }
    };
    if (subjectId) fetchSubject();
  }, [subjectId]);

  const handlePreview = async () => {
    if (!formData.textContent.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/questions/preview", { text_content: formData.textContent });
      setPreview(res.data.questions);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to parse content" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndUpload = async () => {
    if (!formData.chapterName) {
      setMessage({ type: "error", text: "Chapter Name is required." });
      return;
    }
    setLoading(true);
    try {
      const chapterPayload = {
        name: formData.chapterName,
        description: formData.description,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        order_num: 0
      };
      const chapterRes = await api.post(`/subjects/${subjectId}/chapters`, chapterPayload);
      const newChapterId = chapterRes.data.id;

      if (type === "mcq" && formData.textContent.trim()) {
        await api.post("/questions/bulk", {
          chapter_id: newChapterId,
          text_content: formData.textContent
        });
      }

      setSuccessState(true);
      setTimeout(() => router.push(`/dashboard/content/${subjectId}?tab=${type}`), 2500);
    } catch (err: any) {
      console.error("Upload error:", err.response?.data || err.message);
      setMessage({ type: "error", text: "Failed to save: " + (err.response?.data?.error || err.message) });
    } finally {
      setLoading(false);
    }
  };

  if (successState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500/30">
          <CheckCircle2 size={64} className="text-green-500 animate-bounce" />
        </div>
        <h2 className="text-4xl font-black text-white italic tracking-tight text-center">
          Upload Successful!
        </h2>
        <p className="text-green-400 font-bold text-lg text-center bg-green-500/10 px-6 py-2 rounded-full">
          Successfully processed {preview.length} {type === 'mcq' ? 'Questions' : 'Items'}
        </p>
        <div className="flex items-center gap-3 text-gray-500 mt-8 animate-pulse">
          <Loader2 size={18} className="animate-spin" />
          <span className="font-bold text-sm tracking-widest uppercase">
            Returning to {type === 'mcq' ? 'MCQ Table' : 'One-Liners'}...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Link href={`/dashboard/content/${subjectId}`} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold group w-fit">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to {subject?.name || "Subject"}
      </Link>

      <header>
        <h1 className="text-4xl font-black italic tracking-tight">Bulk {type === 'mcq' ? 'MCQ' : 'One-liner'} Upload</h1>
        <p className="text-gray-400 mt-2 text-lg font-medium">Create a new chapter and upload content in one go.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1B2838] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Type size={20} />
                </div>
                Chapter Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Chapter Name</label>
                    <input
                        type="text"
                        required
                        value={formData.chapterName}
                        onChange={(e) => setFormData({ ...formData, chapterName: e.target.value })}
                        placeholder="e.g. Ancient History Part 1"
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Tags (Comma Sep)</label>
                    <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="history, ancient..."
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2 mb-10">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Description / Short Summary</label>
                <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly describe this chapter..."
                    className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                />
            </div>

            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                    <FileText size={20} />
                </div>
                Bulk {type === 'mcq' ? 'MCQ Questions' : 'One-liner Content'}
            </h2>

            <textarea
              value={formData.textContent}
              onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
              placeholder={type === 'mcq' ? "Question text here?\nA. Opt 1 B. Opt 2\nC. Opt 3 D. Opt 4\nANSWER: A" : "Paste your one-liner content here..."}
              className="w-full h-80 bg-[#0D1B2A] border border-white/10 rounded-[2rem] p-8 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono text-sm leading-relaxed"
            />

            <div className="mt-8 flex justify-between items-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                {formData.textContent.length} characters entered
              </div>
              {type === 'mcq' && (
                <button
                  onClick={handlePreview}
                  disabled={loading || !formData.textContent.trim()}
                  className="bg-white/5 text-white hover:bg-white/10 font-black px-10 py-4 rounded-2xl transition-all disabled:opacity-50 border border-white/10"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Process & Preview"}
                </button>
              )}
            </div>
            
            {type === 'oneliner' && (
               <button
                  onClick={handleSaveAndUpload}
                  disabled={loading || !formData.chapterName}
                  className="w-full mt-6 bg-primary text-dark font-black px-10 py-4 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Create Chapter"}
                </button>
            )}
          </div>

          {message && (
            <div className={`p-8 rounded-3xl border flex items-center gap-4 animate-in fade-in slide-in-from-left-4 ${message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"
              }`}>
              {message.type === "success" ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              <p className="font-bold text-lg">{message.text}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#1B2838] p-10 rounded-[2.5rem] border border-white/5 shadow-xl">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
              <AlertCircle size={24} className="text-primary" />
              Guide
            </h3>
            <div className="space-y-6 text-gray-400 font-medium leading-relaxed">
              {type === 'mcq' ? (
                <>
                  <p>Separate questions with a <span className="text-white font-bold">blank line</span>.</p>
                  <div className="bg-[#0D1B2A] p-6 rounded-2xl font-mono text-xs text-primary/80 border border-white/5 leading-loose">
                    Question text here?<br />
                    A. Opt 1 B. Opt 2<br />
                    C. Opt 3 D. Opt 4<br />
                    <span className="text-white font-bold">ANSWER: A</span>
                  </div>
                  <p>The <span className="text-white font-bold">ANSWER:</span> line is mandatory for parsing.</p>
                </>
              ) : (
                <p>Paste your reading material or one-liners. This will be saved as the chapter's content for students to read.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {preview.length > 0 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 pt-10">
          <div className="flex justify-between items-center bg-[#1B2838] p-8 rounded-[2rem] border border-white/5 sticky top-4 z-20 shadow-2xl">
            <div>
                <h2 className="text-3xl font-black italic tracking-tight">Parsing Preview</h2>
                <p className="text-gray-500 font-bold mt-1 uppercase tracking-tighter">{preview.length} Questions Ready to Ship</p>
            </div>
            <button
              onClick={handleSaveAndUpload}
              disabled={loading}
              className="bg-green-500 text-white font-black px-16 py-6 rounded-[2rem] hover:bg-green-600 transition-all shadow-[0_20px_50px_rgba(34,197,94,0.3)] flex items-center gap-3 text-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Upload size={24} strokeWidth={3} /> Save & Create Chapter</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preview.map((q, i) => (
              <div key={i} className="bg-[#1B2838] p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all shadow-xl group">
                <div className="flex justify-between items-start mb-6">
                    <span className="bg-white/5 text-gray-500 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">Q{i + 1}</span>
                </div>
                <p className="font-bold text-lg mb-6 leading-relaxed">{q.question_text}</p>
                <div className="grid grid-cols-1 gap-3">
                  <OptionPreview label="A" text={q.option_a} isCorrect={q.correct_option === 'A'} />
                  <OptionPreview label="B" text={q.option_b} isCorrect={q.correct_option === 'B'} />
                  <OptionPreview label="C" text={q.option_c} isCorrect={q.correct_option === 'C'} />
                  <OptionPreview label="D" text={q.option_d} isCorrect={q.correct_option === 'D'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OptionPreview({ label, text, isCorrect }: { label: string, text: string, isCorrect: boolean }) {
    return (
        <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isCorrect ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'bg-black/20 border-white/5 text-gray-400'}`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${isCorrect ? 'bg-green-500 text-dark' : 'bg-white/5'}`}>{label}</span>
            <span className="font-medium text-sm">{text}</span>
        </div>
    );
}
