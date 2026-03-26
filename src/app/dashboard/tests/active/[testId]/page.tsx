"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    Timer,
    AlertCircle,
    ChevronRight,
    XCircle,
    CheckCircle2,
    Trophy,
    ArrowLeft,
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
}

interface TestConfig {
    id: string;
    title: string;
    timer_minutes: number;
    negative_marking: boolean;
    is_strict: boolean;
}

export default function ActiveTestPage() {
    const { testId } = useParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
    const [attemptId, setAttemptId] = useState<string | null>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial load: Start the test
    useEffect(() => {
        const startSession = async () => {
            try {
                const res = await api.post(`/tests/${testId}/start`);
                setQuestions(res.data.questions);
                setTestConfig(res.data.test);
                setAttemptId(res.data.attempt_id);
                setTimeLeft(res.data.test.timer_minutes * 60);
                setLoading(false);
            } catch (err) {
                console.error("Failed to start test", err);
                router.push("/dashboard/tests");
            }
        };
        startSession();
    }, [testId, router]);

    // Timer logic
    useEffect(() => {
        if (loading || completed || timeLeft <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev: any) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, completed, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (option: string) => {
        if (completed || submitting) return;
        setAnswers((prev: any) => ({
            ...prev,
            [questions[currentIndex].id]: option
        }));
    };

    const handleSubmit = async () => {
        if (submitting || completed) return;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const formattedAnswers = questions.map(q => ({
                question_id: q.id,
                selected_option: answers[q.id] || null
            }));

            const res = await api.post(`/attempts/${attemptId}/submit`, {
                answers: formattedAnswers
            });
            setResult(res.data);
            setCompleted(true);
        } catch (err) {
            console.error("Failed to submit test", err);
            alert("Critical error: Failed to submit test results. Please do not close this window and contact admin.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev: any) => prev + 1);
        } else {
            if (confirm("Are you sure you want to finish the test?")) {
                handleSubmit();
            }
        }
    };

    const handleBack = () => {
        if (testConfig?.is_strict) return;
        if (currentIndex > 0) {
            setCurrentIndex((prev: any) => prev - 1);
        }
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="text-center">
                    <h2 className="text-xl font-black uppercase tracking-[0.2em]">Synchronizing Assessment</h2>
                    <p className="text-gray-500 font-medium">Securing connection to exam server...</p>
                </div>
            </div>
        );
    }

    if (completed && result) {
        const percentage = result.percentage;
        return (
            <div className="max-w-2xl mx-auto py-12 animate-in zoom-in-95 duration-500">
                <div className="bg-[#1B2838] rounded-[3rem] p-12 text-center border-2 border-primary/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary/20">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>

                    <Trophy size={80} className="mx-auto text-primary mb-6 animate-bounce" />
                    <h1 className="text-4xl font-black mb-2">Assessment Complete!</h1>
                    <p className="text-gray-400 font-medium mb-10 text-lg">Results for <span className="text-white font-bold">{testConfig?.title}</span></p>

                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className="bg-[#0D1B2A] p-8 rounded-[2rem] border border-white/5">
                            <div className="text-4xl font-black text-white mb-1">{result.score} / {result.total}</div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Score</div>
                        </div>
                        <div className="bg-[#0D1B2A] p-8 rounded-[2rem] border border-white/5">
                            <div className="text-4xl font-black text-primary mb-1">{percentage}%</div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Efficiency</div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <Link
                            href="/dashboard/tests"
                            className="w-full bg-primary text-dark py-5 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                        >
                            Return to Portfolio
                            <ChevronRight size={20} strokeWidth={3} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const selected = answers[currentQuestion.id];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header className="flex justify-between items-center bg-[#1B2838] p-6 rounded-[2rem] border border-white/5 shadow-xl">
                <div>
                    <h2 className="text-xl font-black tracking-tight">{testConfig?.title}</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ongoing Assessment</span>
                        {testConfig?.is_strict && (
                            <span className="bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-widest">Strict Mode</span>
                        )}
                        {testConfig?.negative_marking && (
                            <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest">Negative marking active</span>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border ${timeLeft < 60 ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-[#0D1B2A] border-white/10 text-primary'}`}>
                    <Timer size={24} className={timeLeft < 60 ? 'animate-pulse' : ''} />
                    <span className="text-2xl font-black tracking-widest tabular-nums">{formatTime(timeLeft)}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Exam Area */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="bg-[#1B2838] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <span className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest">Question {currentIndex + 1}</span>
                                {selected && <span className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12} /> Answer Selected</span>}
                            </div>
                            <h2 className="text-2xl font-bold leading-relaxed">{currentQuestion.question_text}</h2>

                            <div className="grid grid-cols-1 gap-4">
                                {['A', 'B', 'C', 'D'].map((opt) => {
                                    const optionText = currentQuestion[`option_${opt.toLowerCase()}` as keyof Question];
                                    const isSelected = selected === opt;

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleOptionSelect(opt)}
                                            className={`w-full p-6 rounded-2xl border text-left flex items-center gap-5 transition-all duration-300 group ${isSelected ? 'bg-primary/10 border-primary text-white shadow-xl shadow-primary/5' : 'bg-[#0D1B2A] border-white/5 text-gray-400 hover:border-primary/30'
                                                }`}
                                        >
                                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isSelected ? 'bg-primary text-dark font-black' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                                                }`}>
                                                {opt}
                                            </span>
                                            <span className="text-lg font-medium">{optionText}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-10 mt-10 border-t border-white/5">
                            <button
                                onClick={handleBack}
                                disabled={currentIndex === 0 || testConfig?.is_strict}
                                className="flex items-center gap-2 text-gray-500 font-bold hover:text-white disabled:opacity-0 transition-all"
                            >
                                <ArrowLeft size={20} /> Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="bg-primary text-dark px-10 py-4 rounded-xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Continue'}
                                {currentIndex !== questions.length - 1 && <ChevronRight size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Navigator */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#1B2838] p-8 rounded-[2rem] border border-white/5 shadow-xl h-fit">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Navigation Palette</h3>
                        <div className="grid grid-cols-4 gap-3">
                            {questions.map((q, i) => (
                                <button
                                    key={q.id}
                                    onClick={() => !testConfig?.is_strict && setCurrentIndex(i)}
                                    disabled={testConfig?.is_strict}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all border ${currentIndex === i
                                            ? 'bg-primary text-dark border-primary scale-110 shadow-lg shadow-primary/20'
                                            : answers[q.id]
                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                : 'bg-[#0D1B2A] text-gray-600 border-white/5'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
                            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                                <span>Answered</span>
                                <span>{Object.keys(answers).length} / {questions.length}</span>
                            </div>
                            <div className="h-2 w-full bg-[#0D1B2A] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <button
                                onClick={() => confirm("Ready to finalize your assessment?") && handleSubmit()}
                                disabled={submitting}
                                className="w-full mt-6 bg-white/5 hover:bg-red-500 hover:text-white text-gray-500 py-4 rounded-xl font-black transition-all text-xs uppercase tracking-widest border border-transparent hover:border-red-400"
                            >
                                {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'Final Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
