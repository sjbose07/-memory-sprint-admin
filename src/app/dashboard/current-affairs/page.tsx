"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import {
    Plus,
    Newspaper,
    Trash2,
    Edit3,
    Search,
    Calendar,
    Tag,
    CheckCircle2,
    XCircle,
    Filter,
    Upload,
    Eye,
    MessageSquare,
    Sparkles,
    Loader2,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Type
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import AIAssistPanel from "@/components/AIAssistPanel";
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

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
        <div className="md-editor-dark space-y-2">
            <div className="flex items-center gap-2 mb-2 bg-[#1B2838] p-2 rounded-xl border border-white/5 w-fit">
                <button type="button" onClick={() => wrapAlignment('left')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Align Left"><AlignLeft size={18} /></button>
                <button type="button" onClick={() => wrapAlignment('center')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Align Center"><AlignCenter size={18} /></button>
                <button type="button" onClick={() => wrapAlignment('right')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Align Right"><AlignRight size={18} /></button>
                <button type="button" onClick={() => wrapAlignment('justify')} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-all" title="Justify"><AlignJustify size={18} /></button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button type="button" onClick={() => onChange(`${value}\n\n<span style="color: red">TEXT</span>`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-all" title="Red Text"><Type size={18} className="text-red-500" /></button>
                <button type="button" onClick={() => onChange(`${value}\n\n<span style="color: green">TEXT</span>`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-green-500 transition-all" title="Green Text"><Type size={18} className="text-green-500" /></button>
                <button type="button" onClick={() => onChange(`${value}\n\n<span style="font-size: 24px">LARGE TEXT</span>`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all font-bold" title="Large Text">A+</button>
            </div>
            <MdEditor
                value={value}
                style={{ height: '280px', border: 'none' }}
                renderHTML={(text) => mdParser.render(text)}
                onChange={handleEditorChange}
                onImageUpload={handleImageUpload}
                placeholder="Write the detailed news content here (supports **bold**, *italic*, HTML alignment, tables...)..."
                config={{
                    view: { menu: true, md: true, html: true },
                    canView: { menu: true, md: true, html: true, fullScreen: true, hideMenu: true },
                    table: { maxRow: 20, maxCol: 10 },
                }}
            />
        </div>
    );
};

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

export default function CurrentAffairsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center animate-pulse font-bold text-gray-500 uppercase tracking-widest">Initializing...</div>}>
            <CurrentAffairsContent />
        </Suspense>
    );
}

function CurrentAffairsContent() {
    const [caList, setCaList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [filterYear, setFilterYear] = useState<number | "">("");
    const [filterMonth, setFilterMonth] = useState<number | "">("");
    const [filterTopic, setFilterTopic] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<"oneliner" | "mcq">("oneliner");
    const [viewContent, setViewContent] = useState<any | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    // markdown editor — no extra state needed

    const [formData, setFormData] = useState({
        id: "",
        title: "",
        content: "",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        topic: "",
        tags: "",
        is_practice_enabled: false,
        type: "oneliner"
    });

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: "",
        name: ""
    });

    const fetchCA = async () => {
        try {
            setLoading(true);
            const res = await api.get("/current-affairs");
            setCaList(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCA();
    }, []);

    useEffect(() => {
        const q = searchParams.get("q");
        if (q) setSearchQuery(q);
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== "")
        };

        try {
            if (formData.id) {
                await api.patch(`/current-affairs/${formData.id}`, payload);
            } else {
                await api.post("/current-affairs", payload);
            }
            setShowAddModal(false);
            resetForm();
            fetchCA();
        } catch (err) {
            alert("Failed to save current affairs");
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/current-affairs/${deleteModal.id}`);
            fetchCA();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const resetForm = () => {
        setFormData({
            id: "",
            title: "",
            content: "",
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            topic: PREDEFINED_CATEGORIES[0],
            tags: "",
            is_practice_enabled: activeTab === "mcq",
            type: activeTab
        });
    };

    const handleEditClick = (ca: any) => {
        setFormData({
            id: ca.id,
            title: ca.title,
            content: ca.content,
            year: ca.year,
            month: ca.month,
            topic: ca.topic || "",
            tags: (ca.tags || []).join(", "),
            is_practice_enabled: ca.is_practice_enabled,
            type: ca.type || "oneliner"
        });
        setShowAddModal(true);
    };

    const filteredCA = caList.filter(ca => {
        const matchesTab = ca.type === activeTab || (!ca.type && activeTab === "oneliner");
        if (!matchesTab) return false;

        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === "" ||
            ca.title.toLowerCase().includes(searchLower) ||
            (ca.topic && ca.topic.toLowerCase().includes(searchLower)) ||
            (ca.tags && ca.tags.some((t: string) => t.toLowerCase().includes(searchLower.replace("#", ""))));

        const matchesYear = filterYear === "" || ca.year === filterYear;
        const matchesMonth = filterMonth === "" || ca.month === filterMonth;
        const matchesTopic = filterTopic === "" || ca.topic === filterTopic;

        return matchesSearch && matchesYear && matchesMonth && matchesTopic;
    });

    const years = Array.from(new Set(caList.map(ca => ca.year))).sort((a, b) => b - a);
    const topics = Array.from(new Set(caList.map(ca => ca.topic).filter(Boolean))).sort();

    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tight">Current Affairs</h1>
                    <p className="text-gray-400 mt-2 text-lg font-medium">Manage daily and monthly news for students.</p>
                </div>
                <div className="flex gap-4 items-center">
                    {activeTab === "mcq" && (
                        <Link
                            href="/dashboard/current-affairs/bulk-upload"
                            className="bg-secondary text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-secondary/20 border border-secondary/30"
                        >
                            <Upload size={20} />
                            Bulk Upload MCQ
                        </Link>
                    )}
                    {activeTab === "oneliner" && (
                        <button
                            onClick={() => { resetForm(); setShowAddModal(true); }}
                            className="bg-primary text-dark font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                        >
                            <Plus size={24} strokeWidth={3} />
                            Add News Entry
                        </button>
                    )}
                </div>
            </header>

            {/* Tab Bar */}
            <div className="flex bg-[#1B2838] p-1.5 rounded-2xl w-fit border border-white/5">
                <button
                    onClick={() => setActiveTab("oneliner")}
                    className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === "oneliner" ? "bg-primary text-dark shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"}`}
                >
                    <MessageSquare size={18} />
                    One-Liners
                </button>
                <button
                    onClick={() => setActiveTab("mcq")}
                    className={`px-8 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${activeTab === "mcq" ? "bg-secondary text-white shadow-lg shadow-secondary/20" : "text-gray-500 hover:text-white"}`}
                >
                    <CheckCircle2 size={18} />
                    MCQ Practice
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Entries" value={caList.filter(c => c.type === activeTab).length.toString()} icon={<Newspaper size={20} />} color="primary" />
                <StatCard title="Current Month" value={caList.filter(c => c.type === activeTab && c.month === (new Date().getMonth() + 1)).length.toString()} icon={<Calendar size={20} />} color="secondary" />
                <StatCard title="Topics Covered" value={new Set(caList.filter(c => c.type === activeTab).map(c => c.topic)).size.toString()} icon={<Tag size={20} />} color="primary" />
                <StatCard title={activeTab === "oneliner" ? "Read Points" : "Practice Ready"} value={caList.filter(c => c.type === activeTab && (activeTab === "oneliner" ? true : c.is_practice_enabled)).length.toString()} icon={<CheckCircle2 size={20} />} color="secondary" />
            </div>

            {/* Toolbar */}
            <div className="space-y-4">
                <div className="flex bg-[#1B2838] p-4 rounded-2xl border border-white/5 items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by title, #tag or topic..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#0D1B2A] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-primary text-dark' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                    >
                        <Filter size={20} />
                        <span>Filters</span>
                    </button>
                    {(filterYear !== "" || filterMonth !== "" || filterTopic !== "") && (
                        <button
                            onClick={() => { setFilterYear(""); setFilterMonth(""); setFilterTopic(""); }}
                            className="text-red-500 text-xs font-bold uppercase tracking-widest hover:text-red-400 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="bg-[#1B2838] p-6 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Year</label>
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value === "" ? "" : parseInt(e.target.value))}
                                className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="">All Years</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Month</label>
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value === "" ? "" : parseInt(e.target.value))}
                                className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="">All Months</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Topic</label>
                            <select
                                value={filterTopic}
                                onChange={(e) => setFilterTopic(e.target.value)}
                                className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                            >
                                <option value="">All Topics</option>
                                {topics.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="bg-[#1B2838] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Title & Topic</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Period</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Practice</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Created At</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center animate-pulse font-bold text-gray-500 uppercase tracking-widest">Loading Current Affairs...</td></tr>
                        ) : filteredCA.map((ca) => (
                            <tr key={ca.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold group-hover:text-primary transition-colors">{ca.title}</span>
                                        <span className="text-gray-500 text-xs mt-1">{ca.topic || "General"}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                        <Calendar size={14} className="text-secondary" />
                                        <span className="text-sm font-bold text-gray-300">{getMonthName(ca.month)} {ca.year}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {activeTab === "mcq" ? (
                                        ca.is_practice_enabled ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary">
                                                <CheckCircle2 size={14} /> Ready ({ca.question_count || 0} MCQs)
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
                                                <XCircle size={14} /> Setup Needed
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-sm text-gray-400 font-medium">Read Only</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                    {new Date(ca.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {activeTab === "mcq" && ca.is_practice_enabled && (
                                            <Link
                                                href={`/dashboard/content/upload?caId=${ca.id}&caName=${encodeURIComponent(ca.title)}`}
                                                className="w-10 h-10 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-xl flex items-center justify-center transition-all"
                                                title="Upload MCQs"
                                            >
                                                <Upload size={18} />
                                            </Link>
                                        )}
                                        {activeTab === "oneliner" && (
                                            <Link
                                                href={`/dashboard/current-affairs/${ca.id}/articles?title=${encodeURIComponent(ca.title)}`}
                                                className="w-10 h-10 bg-white/5 hover:bg-primary hover:text-dark text-white rounded-xl flex items-center justify-center transition-all"
                                                title="Manage Articles"
                                            >
                                                <Newspaper size={18} />
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => handleEditClick(ca)}
                                            className="w-10 h-10 bg-primary/10 hover:bg-primary text-primary hover:text-dark rounded-xl flex items-center justify-center transition-all"
                                            title="Edit Entry"
                                        >
                                            <Edit3 size={18} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, id: ca.id, name: ca.title })}
                                            className="w-10 h-10 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all"
                                            title="Delete Entry"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && filteredCA.length === 0 && (
                            <tr><td colSpan={5} className="py-20 text-center text-gray-500 font-medium">No current affairs entries found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-md shadow-2xl overflow-y-auto pt-10 pb-20">
                    <div className="bg-[#1B2838] w-full max-w-2xl rounded-3xl p-8 border-2 border-primary/20 animate-in zoom-in-95 duration-200 mt-10 shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    {formData.id ? <Edit3 size={24} /> : <Plus size={24} />}
                                </div>
                                <h2 className="text-3xl font-black">{formData.id ? "Edit News" : "New News Entry"}</h2>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <XCircle size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value, is_practice_enabled: e.target.value === "mcq" })}
                                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-bold"
                                    >
                                        <option value="oneliner">One-Liner</option>
                                        <option value="mcq">MCQ Practice</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Enter title..."
                                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none font-bold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Year</label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-bold"
                                    >
                                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Month</label>
                                    <select
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-bold"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Topic / Category</label>
                                    <select
                                        value={formData.topic}
                                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none font-bold"
                                    >
                                        <option value="" disabled>Select a Category...</option>
                                        {PREDEFINED_CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tags (Comma separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        placeholder="tag1, tag2..."
                                        className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                    />
                                </div>
                            </div>


                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-all bg-white/5 border border-white/5"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-primary hover:bg-primary/90 text-dark px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary/20"
                                >
                                    {formData.id ? "Update Entry" : "Create Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Content Modal */}
            {viewContent && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 backdrop-blur-md shadow-2xl overflow-y-auto pt-10 pb-20">
                    <div className="bg-[#1B2838] w-full max-w-4xl rounded-[2.5rem] p-10 border border-white/10 animate-in zoom-in-95 fade-in duration-300 relative shadow-2xl shadow-black">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 sticky top-0 bg-[#1B2838] z-10">
                            <h2 className="text-4xl font-black italic tracking-tight pr-10">{viewContent.title}</h2>
                            <button
                                onClick={() => setViewContent(null)}
                                className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 transition-all rounded-full border border-white/5"
                            >
                                <XCircle size={28} />
                            </button>
                        </div>
                        <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white prose-lg">
                            <div className="whitespace-pre-wrap text-xl leading-relaxed text-gray-200 font-medium">
                                {viewContent.content}
                            </div>
                        </div>
                        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap gap-6 items-center">
                            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border border-primary/20">
                                Topic: {viewContent.topic || "General"}
                            </div>
                            <div className="bg-secondary/10 text-secondary px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border border-secondary/20">
                                {getMonthName(viewContent.month)} {viewContent.year}
                            </div>
                            <div className="flex-1"></div>
                            <button 
                                onClick={() => setViewContent(null)}
                                className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-8 py-4 rounded-2xl font-black transition-all border border-white/10"
                            >
                                Close Reader
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleDelete}
                title="Delete Current Affairs"
                itemName={deleteModal.name}
            />
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: any, color: "primary" | "secondary" }) {
    const colorClass = color === "primary" ? "text-primary bg-primary/10" : "text-secondary bg-secondary/10";
    return (
        <div className="bg-[#1B2838] p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform duration-500 ${color === 'primary' ? 'text-primary' : 'text-secondary'}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">{title}</p>
            <h4 className="text-3xl font-black text-white">{value}</h4>
        </div>
    );
}

function getMonthName(month: number) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return months[month - 1];
}
