"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Upload,
  ChevronLeft,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2
} from "lucide-react";
import Link from "next/link";
import AIAssistPanel from "@/components/AIAssistPanel";

export default function UploadPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chapterId = searchParams.get("chapterId");
  const chapterName = searchParams.get("chapterName");
  const caId = searchParams.get("caId");
  const caName = searchParams.get("caName");

  const typeParam = searchParams.get("type") as "mcq" | "oneliner" | null;

  const [questionType, setQuestionType] = useState<"mcq" | "oneliner">(typeParam === "oneliner" ? "oneliner" : "mcq");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    if (!chapterId && !caId) router.push("/dashboard/content");
  }, [chapterId, caId, router]);

  const handlePreview = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/questions/preview", { 
        text_content: content,
        type: questionType
      });
      setPreview(res.data.questions);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to parse questions" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      await api.post("/questions/bulk", {
        chapter_id: chapterId,
        current_affair_id: caId,
        text_content: content,
        type: questionType
      });
      const tabName = questionType === 'mcq' ? 'MCQ Upload' : 'One-Liner';  
      setMessage({ type: "success", text: `✅ ${preview.length} questions uploaded! They will appear in the "${tabName}" tab.` });
      setPreview([]);
      setContent("");
    } catch (err) {
      setMessage({ type: "error", text: "Upload failed. Check format." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Link href={caId ? "/dashboard/current-affairs" : `/dashboard/content/${chapterId}`} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold group w-fit">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to {caId ? "Current Affairs" : chapterName}
      </Link>

      <header>
        <h1 className="text-4xl font-black">Question Upload</h1>
        <p className="text-gray-400 mt-2 text-lg font-medium">Add questions to <span className="text-primary">{caId ? caName : chapterName}</span></p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1B2838] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
            <div className="flex flex-wrap gap-6 mb-8 items-end">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 block">Question Type</label>
                <div className="relative">
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as "mcq" | "oneliner")}
                    className="appearance-none bg-[#0D1B2A] border border-white/10 text-white font-bold rounded-2xl py-3 pl-5 pr-12 focus:ring-2 focus:ring-primary/50 outline-none cursor-pointer min-w-[200px] transition-all hover:border-primary/50"
                  >
                    <option value="mcq">📝 MCQ Question</option>
                    <option value="oneliner">💡 One-Liner</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Badge showing active type */}
              <div className={`px-4 py-2 rounded-xl text-sm font-black border ${questionType === 'mcq' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
                Will appear in: <span className="uppercase">{questionType === 'mcq' ? 'MCQ Upload tab' : 'One-liner tab'}</span>
              </div>
            </div>

            <AIAssistPanel 
              mode={questionType}
              onOutput={(text) => setContent((prev: any) => prev ? prev + '\n\n' + text : text)}
            />



            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"Question text...\nA. Option A  B. Option B...\nANSWER: A"}
              className={`w-full h-80 bg-[#0D1B2A] border border-white/10 rounded-2xl p-6 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono text-sm leading-relaxed`}
            />

            <div className="mt-6 flex justify-between items-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                {content.length} characters entered
              </div>
              <button
                onClick={handlePreview}
                disabled={loading || !content.trim()}
                className="bg-primary text-dark font-black px-10 py-4 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Process & Preview"}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-6 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-left-4 ${message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"
              }`}>
              {message.type === "success" ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              <p className="font-bold">{message.text}</p>
            </div>
          )}
        </div>

        {/* Right: Help/Format */}
        <div className="space-y-6">
          <div className="bg-[#1B2838] p-8 rounded-[2rem] border border-white/5">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-primary" />
              Formatting Guide
            </h3>
            <div className="space-y-4 text-sm text-gray-400 font-medium">
              <p>Separate questions with a <span className="text-white">blank line</span>.</p>
              <div className="bg-[#0D1B2A] p-4 rounded-xl font-mono text-[10px] text-primary/70 border border-white/5">
                Question text here?<br />
                A. Opt 1 B. Opt 2<br />
                C. Opt 3 D. Opt 4<br />
                ANSWER: A
              </div>
              <p>The <span className="text-white">ANSWER:</span> line is mandatory for parsing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black italic">Parsing Preview ({preview.length})</h2>
            <button
              onClick={handleUpload}
              className="bg-green-500 text-white font-black px-12 py-4 rounded-2xl hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
            >
              Confirm & Upload All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preview.map((q, i) => (
              <div key={i} className="bg-[#1B2838] p-6 rounded-2xl border border-white/5">
                <p className="text-xs font-black text-gray-500 uppercase mb-2">Question {i + 1}</p>
                <p className="font-bold mb-4">{q.question_text}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2 rounded-lg border ${q.correct_option === 'A' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-black/20 border-white/5'}`}>A: {q.option_a}</div>
                  <div className={`p-2 rounded-lg border ${q.correct_option === 'B' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-black/20 border-white/5'}`}>B: {q.option_b}</div>
                  <div className={`p-2 rounded-lg border ${q.correct_option === 'C' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-black/20 border-white/5'}`}>C: {q.option_c}</div>
                  <div className={`p-2 rounded-lg border ${q.correct_option === 'D' ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-black/20 border-white/5'}`}>D: {q.option_d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


