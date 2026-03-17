"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
    FileQuestion,
    Search,
    Filter,
    Trash2,
    Edit3,
    Book,
    Layers,
    ArrowRight,
    ExternalLink,
    X
} from "lucide-react";
import Link from "next/link";

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubject, setFilterSubject] = useState("");
    const [filterChapter, setFilterChapter] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const res = await api.get("/questions");
            setQuestions(res.data);
        } catch (err) {
            console.error("Failed to fetch questions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this question?")) return;
        try {
            await api.delete(`/questions/${id}`);
            setQuestions(questions.filter(q => q.id !== id));
        } catch (err) {
            alert("Failed to delete question");
        }
    };

    // Derive unique subjects and chapters from questions data
    const subjects = Array.from(new Set(questions.map(q => q.subject_name))).sort();
    const activeChapters = filterSubject
        ? Array.from(new Set(questions.filter(q => q.subject_name === filterSubject).map(q => q.chapter_name))).sort()
        : [];

    const filteredQuestions = questions.filter(q => {
        const searchLower = searchTerm.toLowerCase();

        // Match against text, chapter name, or tags
        let searchMatch = false;
        if (searchTerm.startsWith('#')) {
            // Explicit tag search
            const tagToSearch = searchLower.substring(1);
            searchMatch = (q.chapter_tags && q.chapter_tags.some((tag: string) =>
                tag.toLowerCase().replace('#', '').includes(tagToSearch)
            ));
        } else {
            searchMatch =
                q.question_text.toLowerCase().includes(searchLower) ||
                (q.chapter_name && q.chapter_name.toLowerCase().includes(searchLower)) ||
                (q.current_affair_title && q.current_affair_title.toLowerCase().includes(searchLower)) ||
                (q.chapter_tags && q.chapter_tags.some((tag: string) => tag.toLowerCase().includes(searchLower)));
        }

        const subjectMatch = filterSubject === "" || q.subject_name === filterSubject;
        const chapterMatch = filterChapter === "" || q.chapter_name === filterChapter;

        return searchMatch && subjectMatch && chapterMatch;
    });

    // Handle Subject change - reset chapter filter
    const handleSubjectChange = (subject: string) => {
        setFilterSubject(subject);
        setFilterChapter("");
    };

    const clearFilters = () => {
        setFilterSubject("");
        setFilterChapter("");
        setSearchTerm("");
    };

    const hasActiveFilters = filterSubject !== "" || filterChapter !== "" || searchTerm !== "";

    return (
        <div className="space-y-10">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <FileQuestion size={28} />
                        </div>
                        <h1 className="text-4xl font-black italic tracking-tight uppercase">Question Bank</h1>
                    </div>
                    <p className="text-gray-400 mt-2 text-lg font-medium max-w-2xl">Browse, search and manage all available questions across the curriculum with precision filters.</p>
                </div>

                <div className="flex flex-col w-full lg:w-auto items-end gap-4">
                    <div className="flex w-full gap-3">
                        <div className="relative flex-1 md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search text, #tags, or chapters..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1B2838] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-gray-600 shadow-inner"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-6 py-4 rounded-2xl font-black flex items-center gap-3 transition-all ${showFilters ? 'bg-primary text-dark shadow-xl shadow-primary/30 ring-2 ring-primary/20' : 'bg-[#1B2838] text-gray-400 hover:text-white border border-white/10 shadow-lg'}`}
                        >
                            <Filter size={20} strokeWidth={3} />
                            <span className="hidden sm:inline uppercase tracking-widest text-xs">Filters</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Premium Pill Filters */}
            {showFilters && (
                <div className="bg-[#1B2838] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary font-black tracking-widest text-[10px] uppercase">
                                    <Book size={14} strokeWidth={3} /> Subjects
                                </div>
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearFilters}
                                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                                    >
                                        <X size={12} strokeWidth={3} /> Clear All
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => handleSubjectChange("")}
                                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterSubject === "" ? "bg-primary text-dark shadow-lg shadow-primary/20" : "bg-[#0D1B2A] text-gray-500 hover:text-white border border-white/5"}`}
                                >
                                    All Subjects
                                </button>
                                {subjects.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => handleSubjectChange(s as string)}
                                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterSubject === s ? "bg-primary text-dark shadow-lg shadow-primary/20" : "bg-[#0D1B2A] text-gray-500 hover:text-white border border-white/5"}`}
                                    >
                                        {s as string}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filterSubject && activeChapters.length > 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 text-secondary font-black tracking-widest text-[10px] uppercase">
                                    <Layers size={14} strokeWidth={3} /> Chapters
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={() => setFilterChapter("")}
                                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterChapter === "" ? "bg-secondary text-dark shadow-lg shadow-secondary/20" : "bg-[#0D1B2A] text-gray-500 hover:text-white border border-white/5"}`}
                                    >
                                        All Chapters
                                    </button>
                                    {activeChapters.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFilterChapter(c as string)}
                                            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterChapter === c ? "bg-secondary text-dark shadow-lg shadow-secondary/20" : "bg-[#0D1B2A] text-gray-500 hover:text-white border border-white/5"}`}
                                        >
                                            {c as string}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="bg-[#1B2838] rounded-[2rem] p-32 border border-white/5 text-center">
                    <p className="text-gray-500 font-black italic tracking-widest animate-pulse text-xl">MINING QUESTIONS FROM DATABASE...</p>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="bg-[#1B2838] rounded-[2rem] p-32 border border-dashed border-white/10 text-center">
                    <FileQuestion size={64} className="mx-auto text-gray-700 mb-6" />
                    <p className="text-gray-500 font-bold italic tracking-wider text-xl">No questions match your criteria.</p>
                    <Link href="/dashboard/content" className="mt-8 inline-block text-primary font-black uppercase hover:underline">
                        Go to Curriculum to Upload
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredQuestions.map((q) => (
                        <div key={q.id} className="group bg-[#1B2838] rounded-3xl p-8 border border-white/5 hover:border-primary/30 transition-all duration-500 shadow-xl flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{q.subject_name || "Static Content"}</span>
                                    {q.chapter_name ? (
                                        <span className="bg-secondary/20 text-secondary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{q.chapter_name}</span>
                                    ) : q.current_affair_title ? (
                                        <span className="bg-purple-500/20 text-purple-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">CA: {q.current_affair_title}</span>
                                    ) : null}
                                    {q.chapter_tags && q.chapter_tags.map((tag: string, i: number) => (
                                        <span key={i} className="bg-white/5 text-gray-400 text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
                                            {tag.startsWith('#') ? tag : `#${tag}`}
                                        </span>
                                    ))}
                                    <span className="text-[10px] text-gray-600 font-bold ml-auto">{new Date(q.created_at).toLocaleDateString()}</span>
                                </div>

                                <h3 className="text-xl font-bold leading-relaxed">{q.question_text}</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    <Option label="A" text={q.option_a} isCorrect={q.correct_option === 'A'} />
                                    <Option label="B" text={q.option_b} isCorrect={q.correct_option === 'B'} />
                                    <Option label="C" text={q.option_c} isCorrect={q.correct_option === 'C'} />
                                    <Option label="D" text={q.option_d} isCorrect={q.correct_option === 'D'} />
                                </div>

                                {q.explanation && (
                                    <div className="mt-4 p-4 bg-[#0D1B2A] rounded-2xl border border-white/5 text-sm text-gray-400">
                                        <span className="font-black text-xs text-primary block mb-2 tracking-widest uppercase">Expert Tip / Explanation</span>
                                        {q.explanation}
                                    </div>
                                )}
                            </div>

                            <div className="flex md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="flex-1 md:w-14 h-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all group/del"
                                    title="Delete Question"
                                >
                                    <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Option({ label, text, isCorrect }: { label: string, text: string, isCorrect: boolean }) {
    return (
        <div className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${isCorrect
            ? 'bg-green-500/10 border-green-500/40 text-white'
            : 'bg-[#0D1B2A] border-white/5 text-gray-400'
            }`}>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${isCorrect ? 'bg-green-500 text-dark' : 'bg-white/5 text-gray-500'
                }`}>
                {label}
            </span>
            <span className="text-sm font-medium">{text}</span>
        </div>
    );
}
