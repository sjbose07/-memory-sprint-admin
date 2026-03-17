"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Trophy,
  Trash2,
  Search,
  Timer,
  Hash,
  Copy,
  CheckCircle2,
  Eye,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/tests");
      setTests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this test? This will also delete all student attempts for this test.")) return;
    try {
      await api.delete(`/tests/${id}`);
      fetchTests();
    } catch (err) {
      alert("Failed to delete test");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredTests = tests.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.subject_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Test Management</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Monitor active tests and manage share codes.</p>
        </div>
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tests or subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B2838] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-20 text-center animate-pulse text-gray-500 font-bold uppercase tracking-widest">
            Scanning Test Database...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="bg-[#1B2838] rounded-3xl p-20 text-center border border-dashed border-white/10">
            <Trophy size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500 font-bold italic">No active tests found. Create one from the curriculum section.</p>
          </div>
        ) : filteredTests.map((test) => (
          <div key={test.id} className="bg-[#1B2838] rounded-[2rem] p-8 border border-white/5 hover:border-primary/30 transition-all flex flex-col lg:flex-row lg:items-center gap-8 group">

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border border-primary/20">
                  {test.subject_name}
                </span>
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">•</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{test.chapter_name}</span>
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">{test.title}</h3>

              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Timer size={16} className="text-gray-500" />
                  <span className="text-sm font-bold">{test.timer_minutes}m</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Hash size={16} className="text-gray-500" />
                  <span className="text-sm font-bold">{test.question_count} Qs</span>
                </div>
                {test.is_strict && (
                  <div className="flex items-center gap-2 text-orange-400 bg-orange-400/10 px-3 py-1 rounded-lg border border-orange-400/20">
                    <AlertTriangle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Strict Mode</span>
                  </div>
                )}
                {test.negative_marking && (
                  <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1 rounded-lg border border-red-400/20">
                    <span className="text-[10px] font-black uppercase tracking-widest">Negative Marking</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Link
                  href={`/dashboard/tests/active/${test.id}`}
                  className="bg-primary text-dark font-black px-8 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Trophy size={20} />
                  Join Test
                </Link>
                <button
                  onClick={() => copyToClipboard(test.share_code)}
                  className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center gap-2"
                >
                  Code: {test.share_code}
                  {copiedCode === test.share_code ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
              </div>

              <div className="h-12 w-px bg-white/5 lg:block hidden"></div>

              <div className="flex items-center gap-2">
                <button className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:text-white" title="View Statistics">
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => handleDelete(test.id)}
                  className="w-12 h-12 bg-red-500/10 hover:bg-red-500 rounded-xl flex items-center justify-center transition-all text-red-500 hover:text-white" title="Delete Test"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
