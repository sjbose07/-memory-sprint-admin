"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Trophy,
    RefreshCcw,
    AlertCircle,
    CircleDashed,
    Loader2
} from "lucide-react";
import Link from "next/link";

interface Question {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation: string;
}

interface PracticeResult {
    selected: string;
    isCorrect: boolean;
}

export default function PracticePage() {
    const { subjectId, chapterId } = useParams();
    const router = useRouter();

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // State to track answers for each question
    const [results, setResults] = useState<Record<string, PracticeResult>>({});
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const [completed, setCompleted] = useState(false);
    const [chapterName, setChapterName] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const subRes = await api.get(`/subjects/${subjectId}`);
                const chapter = subRes.data.chapters?.find((c: any) => c.id === chapterId);
                if (chapter) setChapterName(chapter.name);

                const res = await api.get(`/practice/${chapterId}/questions`);
                setQuestions(res.data);
            } catch (err) {
                console.error("Failed to fetch practice data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [chapterId, subjectId]);

    // When moving between questions, restore previous answer state if exists
    useEffect(() => {
        if (questions.length > 0 && questions[currentIndex]) {
            const prevResult = results[questions[currentIndex].id];
            if (prevResult) {
                setSelectedOption(prevResult.selected);
                setIsAnswered(true);
            } else {
                setSelectedOption(null);
                setIsAnswered(false);
            }
        }
    }, [currentIndex, questions, results]);

    const score = useMemo(() => {
        return Object.values(results).filter(r => r.isCorrect).length;
    }, [results]);

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleConfirm = () => {
        if (!selectedOption || isAnswered) return;

        const currentQ = questions[currentIndex];
        const isCorrect = selectedOption === currentQ.correct_option;

        setResults((prev: any) => ({
            ...prev,
            [currentQ.id]: { selected: selectedOption, isCorrect }
        }));
        setIsAnswered(true);
    };

    const handleNext = useCallback(async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev: any) => prev + 1);
        } else {
            handleFinish();
        }
    }, [currentIndex, questions]);

    const handleFinish = async () => {
        setSaving(true);
        try {
            await api.post(`/practice/${chapterId}/save-score`, {
                score: score,
                total: questions.length
            });
            setCompleted(true);
        } catch (err) {
            console.error("Failed to save practice score", err);
            setCompleted(true); // Still complete even if save fails
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-gray-500 font-black tracking-widest uppercase">Preparing Practice Session...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
                <AlertCircle size={64} className="text-gray-700" />
                <p className="text-xl font-bold text-gray-500">No questions available in this chapter.</p>
                <Link href={`/dashboard/content/${subjectId}`} className="text-primary font-black uppercase hover:underline">
                    Back to Content
                </Link>
            </div>
        );
    }

    if (completed) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="max-w-2xl mx-auto py-12 animate-in zoom-in-95 duration-500">
                <div className="bg-[#1B2838] rounded-[3rem] p-12 text-center border-2 border-primary/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary/20">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>

                    <Trophy size={80} className="mx-auto text-primary mb-6 animate-bounce" />
                    <h1 className="text-4xl font-black mb-2">Practice Complete!</h1>
                    <p className="text-gray-400 font-medium mb-10 text-lg">Great job mastering <span className="text-white font-bold">{chapterName}</span></p>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-[#0D1B2A] p-8 rounded-[2rem] border border-white/5">
                            <div className="text-4xl font-black text-white mb-1">{score} / {questions.length}</div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Correct</div>
                        </div>
                        <div className="bg-[#0D1B2A] p-8 rounded-[2rem] border border-white/5">
                            <div className="text-4xl font-black text-primary mb-1">{percentage}%</div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Efficiency</div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3"
                        >
                            <RefreshCcw size={20} />
                            Try Again
                        </button>
                        <Link
                            href={`/dashboard/content/${subjectId}`}
                            className="flex-1 bg-primary text-dark py-5 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            Back to Content
                            <ChevronRight size={20} strokeWidth={3} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-[#1B2838] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/content/${subjectId}`} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">{chapterName}</h2>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Interactive Practice Session</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Accuracy</div>
                        <div className="text-xl font-black text-primary">{Object.keys(results).length > 0 ? Math.round((score / Object.keys(results).length) * 100) : 0}%</div>
                    </div>
                    <div className="h-10 w-px bg-white/5 mx-2 hidden sm:block"></div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Score</div>
                        <div className="text-xl font-black text-white">{score} <span className="text-gray-500 text-sm">/ {questions.length}</span></div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-[#1B2838] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <span className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest">Question {currentIndex + 1}</span>
                                {isAnswered && (
                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${results[currentQuestion.id]?.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                        {results[currentQuestion.id]?.isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        {results[currentQuestion.id]?.isCorrect ? 'Correct' : 'Incorrect'}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-2xl font-bold leading-relaxed">{currentQuestion.question_text}</h2>

                            <div className="grid grid-cols-1 gap-4">
                                {['A', 'B', 'C', 'D'].map((opt) => {
                                    const optionText = currentQuestion[`option_${opt.toLowerCase()}` as keyof Question];
                                    const isSelected = selectedOption === opt;
                                    const isCorrect = isAnswered && opt === currentQuestion.correct_option;
                                    const isWrong = isAnswered && isSelected && opt !== currentQuestion.correct_option;

                                    let style = "bg-[#0D1B2A] border-white/5 text-gray-400 hover:border-primary/30";
                                    if (isSelected && !isAnswered) style = "bg-primary/10 border-primary text-white shadow-lg shadow-primary/5";
                                    if (isCorrect) style = "bg-green-500/20 border-green-500 text-white shadow-lg shadow-green-500/10";
                                    if (isWrong) style = "bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-500/10";

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleOptionSelect(opt)}
                                            disabled={isAnswered}
                                            className={`w-full p-6 rounded-2xl border text-left flex items-center gap-5 transition-all duration-300 group ${style}`}
                                        >
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isCorrect ? 'bg-green-500 text-dark' :
                                                    isWrong ? 'bg-red-500 text-white' :
                                                        isSelected ? 'bg-primary text-dark' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                                                }`}>
                                                {opt}
                                            </span>
                                            <span className="text-lg font-medium">{optionText}</span>
                                            {isCorrect && <CheckCircle2 className="ml-auto text-green-500" size={24} />}
                                            {isWrong && <XCircle className="ml-auto text-red-500" size={24} />}
                                        </button>
                                    );
                                })}
                            </div>

                            {isAnswered && (
                                <div className="p-8 bg-[#0D1B2A] rounded-3xl border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CircleDashed size={18} className="text-primary animate-spin-slow" />
                                        <span className="font-black uppercase tracking-widest text-xs text-primary">Explanation</span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed font-medium">
                                        {currentQuestion.explanation || "No explanation provided for this question."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-10 mt-10 border-t border-white/5">
                            <button
                                onClick={() => currentIndex > 0 && setCurrentIndex((prev: any) => prev - 1)}
                                disabled={currentIndex === 0}
                                className="flex items-center gap-2 text-gray-500 font-bold hover:text-white disabled:opacity-0 transition-all"
                            >
                                <ArrowLeft size={20} /> Previous
                            </button>

                            {!isAnswered ? (
                                <button
                                    onClick={handleConfirm}
                                    disabled={!selectedOption}
                                    className="bg-primary text-dark px-12 py-4 rounded-xl font-black shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale transition-all hover:scale-105"
                                >
                                    Confirm Answer
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    className="bg-primary text-dark px-12 py-4 rounded-xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 flex items-center gap-2"
                                >
                                    {currentIndex === questions.length - 1 ? (saving ? "Saving..." : "Finish") : "Next Question"}
                                    {currentIndex !== questions.length - 1 && <ChevronRight size={20} />}
                                    {saving && <Loader2 size={18} className="animate-spin" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Navigation Palette */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1B2838] p-8 rounded-[2rem] border border-white/5 shadow-xl h-fit">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Question Palette</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {questions.map((q, i) => {
                                const result = results[q.id];
                                const isCurrent = currentIndex === i;

                                let bgColor = "bg-[#0D1B2A]";
                                let textColor = "text-gray-600";
                                let borderColor = "border-white/5";

                                if (result) {
                                    bgColor = result.isCorrect ? "bg-green-500/10" : "bg-red-500/10";
                                    textColor = result.isCorrect ? "text-green-500" : "text-red-500";
                                    borderColor = result.isCorrect ? "border-green-500/30" : "border-red-500/30";
                                }

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => setCurrentIndex(i)}
                                        className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border-2 ${bgColor} ${textColor} ${borderColor} ${isCurrent ? 'border-primary scale-110 shadow-lg shadow-primary/20 z-10' : 'hover:border-white/20'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
                            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                                <span>Mastered</span>
                                <span>{Object.keys(results).length} / {questions.length}</span>
                            </div>
                            <div className="h-2 w-full bg-[#0D1B2A] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(Object.keys(results).length / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="flex flex-col gap-2 mt-6">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
                                    <span>Correct</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
                                    <span>Incorrect</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                                    <div className="w-3 h-3 rounded border-2 border-primary"></div>
                                    <span>Current</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl">
                        <p className="text-xs text-primary font-bold italic">
                            "Practice makes perfect. Use the palette to revisit questions and review explanations."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
