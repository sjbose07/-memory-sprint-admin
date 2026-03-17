"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    itemName: string;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    itemName
}: DeleteConfirmModalProps) {
    const [step, setStep] = useState(1);
    const [inputVal, setInputVal] = useState("");

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setInputVal("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1 && inputVal === "CONFIRM") {
            setStep(2);
            setInputVal("");
        } else if (step === 2 && inputVal === "YES") {
            onConfirm();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#1B2838] w-full max-w-md rounded-[2.5rem] border-2 border-red-500/20 shadow-2xl shadow-red-500/10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                            <AlertTriangle size={32} />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <h2 className="text-3xl font-black mb-2">{title}</h2>
                    <p className="text-gray-400 font-medium mb-8">
                        You are about to delete <span className="text-white font-bold underline decoration-red-500/50 underline-offset-4">"{itemName}"</span>. This action is permanent and cannot be undone.
                    </p>

                    <form onSubmit={handleNextStep} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                {step === 1 ? 'Type "CONFIRM" to proceed' : 'Type "YES" for final deletion'}
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={inputVal}
                                onChange={(e) => setInputVal(e.target.value)}
                                placeholder={step === 1 ? "CONFIRM" : "YES"}
                                className={`w-full bg-[#0D1B2A] border ${inputVal === (step === 1 ? "CONFIRM" : "YES") ? 'border-primary' : 'border-white/10'} rounded-2xl py-4 px-6 text-white text-center font-black tracking-[0.2em] focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-white/5`}
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={inputVal !== (step === 1 ? "CONFIRM" : "YES")}
                                className={`flex-1 px-8 py-4 rounded-2xl font-black shadow-lg transition-all ${inputVal === (step === 1 ? "CONFIRM" : "YES")
                                        ? 'bg-red-500 text-white shadow-red-500/20 hover:scale-105 active:scale-95'
                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                {step === 1 ? "Submit" : "Final Delete"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 flex justify-center gap-2">
                        <div className={`w-12 h-1.5 rounded-full transition-all ${step === 1 ? 'bg-red-500' : 'bg-red-500/20'}`}></div>
                        <div className={`w-12 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-red-500' : 'bg-red-500/20'}`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
