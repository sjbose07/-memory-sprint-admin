"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import api from "@/lib/api";
import Link from "next/link";
import {
    Plus,
    ChevronLeft,
    Trash2,
    Edit3,
    FileText,
    Eye,
    XCircle,
    Loader2,
    Calendar,
    Sparkles,
    CheckCircle2,
    Save,
    Newspaper,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Type
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import AIAssistPanel from "@/components/AIAssistPanel";
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt({ html: true, linkify: true, typographer: true }).enable('table');

const MarkdownEditor = ({ value, onChange }: { value: string; onChange: (text: string) => void }) => {
    const handleEditorChange = useCallback(({ text }: { text: string }) => {
        onChange(text);
    }, [onChange]);

    const wrapAlignment = (align: string) => {
        if (align === 'justify') {
            onChange(`<div style="text-align: justify">\n\n${value}\n\n</div>`);
        } else {
            onChange(`<div align="${align}">\n\n${value}\n\n</div>`);
        }
    };

    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("subject", "Current Affairs");
        formData.append("type", "image");
        formData.append("file", file);
        const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        return res.data.url;
    };

    return (
        <div className="md-editor-dark space-y-2 flex flex-col h-full">
            <div className="flex items-center gap-2 m-4 bg-[#1B2838] p-2 rounded-xl border border-white/5 w-fit">
                <button type="button" onClick={() => wrapAlignment('left')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Align Left"><AlignLeft size={18} /></button>
                <button type="button" onClick={() => wrapAlignment('center')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Align Center"><AlignCenter size={18} /></button>
                <button type="button" onClick={() => wrapAlignment('right')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Align Right"><AlignRight size={18} /></button>
                <button type="button" onClick={() => wrapAlignment('justify')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Justify"><AlignJustify size={18} /></button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button type="button" onClick={() => onChange(`${value}\n\n<span style="color: #ff4757">TEXT</span>`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-all" title="Red Text"><Type size={18} className="text-[#ff4757]" /></button>
                <button type="button" onClick={() => onChange(`${value}\n\n<span style="color: #2ed573">TEXT</span>`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-green-500 transition-all" title="Green Text"><Type size={18} className="text-[#2ed573]" /></button>
                <button type="button" onClick={() => onChange(`${value}\n\n<span style="font-size: 24px">LARGE TEXT</span>`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all font-bold" title="Large Text">A+</button>
            </div>
            <div className="flex-1 min-h-[500px]">
                <MdEditor
                    value={value}
                    style={{ height: '100%', border: 'none' }}
                    renderHTML={(text) => mdParser.render(text)}
                    onChange={handleEditorChange}
                    onImageUpload={handleImageUpload}
                    placeholder="Write news content here... Supports **bold**, *italic*, HTML alignment, etc."
                    config={{
                        view: { menu: true, md: true, html: true },
                        canView: { menu: true, md: true, html: true, fullScreen: true, hideMenu: true },
                    }}
                />
            </div>
        </div>
    );
};

export default function CAArticlesPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse text-gray-500 font-black">STABILIZING EDITOR...</div>}>
            <CAArticlesContent />
        </Suspense>
    );
}

function CAArticlesContent() {
    const params = useParams();
    const searchParams = useSearchParams();
    
    // Memoize the ID to ensure stability across parent re-renders
    const id = useMemo(() => params?.id as string, [params?.id]);
    const caTitle = useMemo(() => searchParams?.get("title") || "Monthly News", [searchParams]);

    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [formData, setFormData] = useState({ title: "", content: "", tags: "" });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false, id: "", name: ""
    });

    // Move render log to useEffect to prevent noise during render loops
    useEffect(() => {
        if (id) console.log('[DEBUG] Current Affairs Material Editor Active. ID:', id);
    }, [id]);

    const fetchMaterials = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await api.get(`/study-materials?current_affair_id=${id}`);
            setMaterials(res.data);
            
            // Sync current editor if something was being edited
            setEditingMaterial((prev: any) => {
                if (!prev) return null;
                return res.data.find((m: any) => m.id === prev.id) || prev;
            });
        } catch (err) {
            console.error('[ERROR] fetchMaterials:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]); // Dependent on the memoized callback

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving || !formData.title.trim() || !formData.content.trim()) return;

        try {
            setIsSaving(true);
            const payload = {
                title: formData.title.trim(),
                content: formData.content,
                current_affair_id: id,
                tags: (formData.tags || "").split(",").map(t => t.trim()).filter(Boolean)
            };

            const res = editingMaterial 
                ? await api.patch(`/study-materials/${editingMaterial.id}`, payload)
                : await api.post("/study-materials", payload);

            setEditingMaterial(res.data);
            alert(editingMaterial ? "Article updated! ✓" : "Article published! ✓");
            await fetchMaterials();
        } catch (err: any) {
            console.error("[ERROR] handleSave:", err.response?.data || err.message);
            alert("Failed to save article. Check console for details.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/study-materials/${deleteModal.id}`);
            setDeleteModal({ ...deleteModal, isOpen: false });
            if (editingMaterial?.id === deleteModal.id) {
                setEditingMaterial(null);
                setFormData({ title: "", content: "", tags: "" });
            }
            fetchMaterials();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const selectMaterial = (m: any) => {
        setEditingMaterial(m);
        setFormData({
            title: m.title,
            content: m.content || "",
            tags: (m.tags || []).join(", ")
        });
    };

    const handleNewArticleBtn = () => {
        setEditingMaterial(null);
        setFormData({ title: "", content: "", tags: "" });
    };

    return (
        <div className="space-y-8 flex flex-col h-full animate-in fade-in duration-500">
            <header className="flex justify-between items-end shrink-0">
                <div className="space-y-4">
                    <Link href="/dashboard/current-affairs" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold group w-fit">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to List
                    </Link>
                    <h1 className="text-4xl font-black italic tracking-tight flex items-center gap-4">
                        <Newspaper className="text-primary" size={32} />
                        {caTitle}
                    </h1>
                </div>
                <button
                    onClick={handleNewArticleBtn}
                    className="bg-primary hover:bg-primary/90 text-dark font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                    <Plus size={20} strokeWidth={3} />
                    New Article
                </button>
            </header>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Sidebar */}
                <aside className="w-80 bg-[#1B2838] rounded-[2rem] border border-white/5 flex flex-col overflow-hidden shrink-0 shadow-2xl">
                    <div className="p-6 border-b border-white/5">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Material List</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {loading && materials.length === 0 ? (
                            <div className="p-10 text-center animate-pulse text-gray-500 font-bold uppercase text-[10px] tracking-widest">Loading...</div>
                        ) : materials.length === 0 ? (
                            <div className="p-10 text-center text-gray-500 italic text-sm">No articles found.</div>
                        ) : (
                            materials.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => selectMaterial(m)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all relative group cursor-pointer ${editingMaterial?.id === m.id ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold text-sm ${editingMaterial?.id === m.id ? 'text-primary' : 'text-white'} truncate pr-8`}>{m.title}</h4>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, id: m.id, name: m.title }); }}
                                            className="absolute top-4 right-4 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest italic opacity-50">
                                        {new Date(m.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Editor Surface */}
                <main className="flex-1 bg-[#1B2838] rounded-[2rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
                    <form onSubmit={handleSave} className="flex flex-col h-full">
                        <div className="p-8 border-b border-white/5 space-y-6">
                            <div className="flex gap-6">
                                <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Article Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Headline..."
                                        className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 px-6 text-white text-xl font-black focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
                                    />
                                </div>
                                <div className="w-64 space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tags</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="politics, world..."
                                        className="w-full bg-black/20 border border-white/5 rounded-xl py-4 px-6 text-white font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col bg-black/10">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                                <AIAssistPanel 
                                    mode="oneliner" 
                                    onOutput={(text) => setFormData(prev => ({ ...prev, content: text }))} 
                                />
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.title.trim()}
                                    className="bg-secondary hover:bg-secondary/90 text-white px-10 py-3 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-secondary/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {editingMaterial ? "Update" : "Publish"}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <MarkdownEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                />
                            </div>
                        </div>
                    </form>
                </main>
            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleDelete}
                title="Delete News Article"
                itemName={deleteModal.name}
            />
        </div>
    );
}
