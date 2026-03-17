"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Upload,
  ChevronLeft,
  FileText,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Tag,
  Type
} from "lucide-react";
import Link from "next/link";

const PREDEFINED_CATEGORIES = [
    "Monthly",
    "Yearly",
    "Quarterly",
    "Banking",
    "Science & Tech",
    "Environment",
    "Defence",
    "Sports",
    "Awards",
    "Appointments",
    "Books",
    "Important Days",
    "Summits",
    "Reports",
    "Obituaries",
    "Government Schemes",
    "Miscellaneous",
    "Other"
];

export default function CABulkUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    topic: PREDEFINED_CATEGORIES[0],
    tags: "",
    content: "", // This will be the CA entry "content"
    mcqText: ""   // This will be parsed into questions
  });

  const handlePreview = async () => {
    if (!formData.mcqText.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/questions/preview", { text_content: formData.mcqText });
      setPreview(res.data.questions);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to parse questions" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndUpload = async () => {
    if (!formData.title || !formData.content) {
      setMessage({ type: "error", text: "Title and Description/Content are required." });
      return;
    }

    setLoading(true);
    try {
      // 1. Create the Current Affairs entry
      const caPayload = {
        title: formData.title,
        content: formData.content,
        year: formData.year,
        month: formData.month,
        topic: formData.topic,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        is_practice_enabled: true,
        type: "mcq"
      };

      const caRes = await api.post("/current-affairs", caPayload);
      const caId = caRes.data.id;

      // 2. Upload the questions
      if (formData.mcqText.trim()) {
        await api.post("/questions/bulk", {
          current_affair_id: caId,
          text_content: formData.mcqText
        });
      }

      setMessage({ type: "success", text: `Successfully created CA entry and uploaded ${preview.length} questions!` });
      setTimeout(() => router.push("/dashboard/current-affairs"), 1500);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save. Check format and fields." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Link href="/dashboard/current-affairs" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold group w-fit">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Current Affairs
      </Link>

      <header>
        <h1 className="text-4xl font-black italic tracking-tight">Bulk MCQ Upload</h1>
        <p className="text-gray-400 mt-2 text-lg font-medium">Create a new MCQ Practice entry and upload questions in one go.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Metadata & Input */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1B2838] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Type size={20} />
                </div>
                Metadata & Content
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Title</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g. March 2026 Sports"
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Topic</label>
                    <select
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-bold"
                    >
                        <option value="" disabled>Select a Category...</option>
                        {PREDEFINED_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Year</label>
                    <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold appearance-none"
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Month</label>
                    <select
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold appearance-none"
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Tags (Comma Sep)</label>
                    <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="sports, cricket..."
                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                </div>
            </div>

            <div className="space-y-2 mb-10">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Description / Short Summary</label>
                <textarea
                    required
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Briefly describe this set of questions..."
                    className="w-full bg-[#0D1B2A] border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                />
            </div>

            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                    <FileText size={20} />
                </div>
                Bulk MCQ Questions
            </h2>

            <textarea
              value={formData.mcqText}
              onChange={(e) => setFormData({ ...formData, mcqText: e.target.value })}
              placeholder="Question text here?&#10;A. Opt 1 B. Opt 2&#10;C. Opt 3 D. Opt 4&#10;ANSWER: A"
              className="w-full h-80 bg-[#0D1B2A] border border-white/10 rounded-[2rem] p-8 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono text-sm leading-relaxed"
            />

            <div className="mt-8 flex justify-between items-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                {formData.mcqText.length} characters entered
              </div>
              <button
                onClick={handlePreview}
                disabled={loading || !formData.mcqText.trim()}
                className="bg-white/5 text-white hover:bg-white/10 font-black px-10 py-4 rounded-2xl transition-all disabled:opacity-50 border border-white/10"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Process & Preview"}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-8 rounded-3xl border flex items-center gap-4 animate-in fade-in slide-in-from-left-4 ${message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-500" : "bg-red-500/10 border-red-500/50 text-red-500"
              }`}>
              {message.type === "success" ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
              <p className="font-bold text-lg">{message.text}</p>
            </div>
          )}
        </div>

        {/* Right: Help/Format */}
        <div className="space-y-6">
          <div className="bg-[#1B2838] p-10 rounded-[2.5rem] border border-white/5 shadow-xl">
            <h3 className="text-2xl font-black mb-6 flex items-center gap-3 italic">
              <AlertCircle size={24} className="text-primary" />
              Guide
            </h3>
            <div className="space-y-6 text-gray-400 font-medium leading-relaxed">
              <p>Separate questions with a <span className="text-white font-bold">blank line</span>.</p>
              <div className="bg-[#0D1B2A] p-6 rounded-2xl font-mono text-xs text-primary/80 border border-white/5 leading-loose">
                Question text here?<br />
                A. Opt 1 B. Opt 2<br />
                C. Opt 3 D. Opt 4<br />
                <span className="text-white font-bold">ANSWER: A</span>
              </div>
              <p>The <span className="text-white font-bold">ANSWER:</span> line is mandatory for parsing.</p>
              
              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-gray-500 uppercase font-black mb-4">Pro Tip</p>
                <p>Ensure options are on separate lines or clearly delimited for best results.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
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
              {loading ? <Loader2 className="animate-spin" /> : <><Upload size={24} strokeWidth={3} /> Save & Create Entry</>}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preview.map((q, i) => (
              <div key={i} className="bg-[#1B2838] p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all shadow-xl group">
                <div className="flex justify-between items-start mb-6">
                    <span className="bg-white/5 text-gray-500 px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest">Q{i + 1}</span>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
