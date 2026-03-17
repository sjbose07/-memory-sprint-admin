"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Save, AlertTriangle, FileText } from "lucide-react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function BulkEditPage() {
    const { subjectId, chapterId } = useParams();
    const router = useRouter();

    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [chapterName, setChapterName] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                // Fetch subject to get chapter name
                const subjectRes = await api.get(`/subjects/${subjectId}`);
                const chapter = subjectRes.data.chapters?.find((c: any) => c.id === chapterId);
                if (chapter) setChapterName(chapter.name);

                const res = await api.get(`/questions/bulk-export/${chapterId}`);
                setContent(res.data.text_content);
            } catch (err) {
                console.error("Failed to fetch chapter/questions for bulk edit", err);
            } finally {
                setLoading(false);
            }
        };
        if (chapterId && subjectId) fetchContent();
    }, [chapterId, subjectId]);

    const handleSync = async () => {
        try {
            setSaving(true);
            await api.put(`/questions/bulk-sync/${chapterId}`, { text_content: content });
            router.push(`/dashboard/content/${subjectId}`);
        } catch (err: any) {
            alert(err.response?.data?.error || "Failed to sync questions");
        } finally {
            setSaving(false);
            setShowConfirm(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link
                    href={`/dashboard/content/${subjectId}`}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-4xl font-black flex items-center gap-3">
                        <FileText className="text-primary" size={32} />
                        Bulk Edit Questions
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">Editing: <span className="text-white font-bold">{chapterName || "Loading..."}</span></p>
                </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex gap-4 items-start">
                <AlertTriangle className="text-red-500 shrink-0 mt-1" size={28} />
                <div>
                    <h3 className="text-lg font-black text-red-500">Warning: Destructive Action</h3>
                    <p className="text-red-400/80 mt-1 font-medium">
                        Saving changes here will <strong>completely replace</strong> all existing questions in this chapter with the text below.
                        Please ensure the format is correct.
                    </p>
                    <p className="text-sm font-bold text-gray-500 mt-3 uppercase tracking-wider">Format Rules:</p>
                    <ul className="text-sm text-gray-400 mt-1 list-disc ml-4 space-y-1">
                        <li>Question text must be on top</li>
                        <li>Options must be prefixed with A., B., C., D.</li>
                        <li>Answer must be on a new line prefixed with ANSWER:</li>
                        <li>(Optional) Explanation must be on a new line prefixed with EXPLANATION:</li>
                        <li>Separate each question block with an empty line.</li>
                    </ul>
                </div>
            </div>

            <div className="bg-[#1B2838] p-6 rounded-3xl border border-white/5 shadow-xl">
                {loading ? (
                    <div className="h-[600px] flex items-center justify-center animate-pulse text-gray-500 font-bold tracking-widest uppercase">
                        Loading Questions...
                    </div>
                ) : (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-[600px] bg-[#0D1B2A] text-gray-200 p-6 rounded-2xl border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm leading-relaxed resize-y custom-scrollbar"
                        placeholder="Question 1...&#10;A. opt&#10;B. opt&#10;ANSWER: A"
                        spellCheck="false"
                    />
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={loading || saving}
                    className="bg-primary text-dark font-black px-10 py-5 rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? "Syncing..." : "Save and Sync Content"}
                    {!saving && <Save size={24} />}
                </button>
            </div>

            <DeleteConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleSync}
                title="Sync All Questions"
                itemName={`All questions in ${chapterName}`}
            />
        </div>
    );
}
