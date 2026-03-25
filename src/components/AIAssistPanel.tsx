"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Image as ImageIcon, FileText, Loader2, Upload, X } from "lucide-react";
import api from "@/lib/api";

interface AIAssistPanelProps {
  onOutput: (text: string) => void;
  mode: "mcq" | "oneliner";
}

export default function AIAssistPanel({ onOutput, mode }: AIAssistPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStyle, setActiveStyle] = useState<"standard" | "fancy">("standard");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial fetch of models
    api.get("/ai/models")
      .then(res => {
        if (res.data.models) {
          setAvailableModels(res.data.models);
          // Set default if exists (prefer 1.5-flash for free tier stability)
          const defaultModel = res.data.models.find((m: string) => m.includes("flash") && m.includes("1.5")) || res.data.models[0];
          setSelectedModel(defaultModel || "");
        }
      })
      .catch(err => console.error("Failed to fetch AI models:", err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Basic validation
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 10 * 1024 * 1024) {
          setError("File limits to 10MB to guarantee stable uploads.");
          return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleGenerate = async () => {
     if (!file && !prompt.trim()) {
        setError("Please provide either a file or a text prompt.");
        return;
     }

     try {
         setIsProcessing(true);
         setError("");
         const formData = new FormData();
         
         let apiMode: string = mode;
         if (mode === 'oneliner' && activeStyle === 'fancy') {
             apiMode = 'fancy_oneliner';
         }

         formData.append('mode', apiMode);
         if (selectedModel) formData.append('model', selectedModel);
         if (prompt.trim()) formData.append('prompt_text', prompt);
         if (file) formData.append('document', file);

         const res = await api.post('/ai/process', formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
         });

         if (res.data.result) {
            onOutput(res.data.result);
         }
     } catch (err: any) {
         console.error("AI Process Error:", err);
         setError(err.response?.data?.error || err.message || "Failed to process document");
     } finally {
         setIsProcessing(false);
     }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2 text-purple-400 font-bold mb-1">
        <Sparkles className="w-5 h-5" />
        <h3>AI Document Extractor & Enhancer {mode === 'mcq' && '(MCQ Mode)'}</h3>
      </div>
      
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={mode === 'mcq' ? "Any specific instructions? (e.g. 'Extract only difficult history questions')" : "Any specific instructions for one-liner? (e.g. 'Force historical facts only')"}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[80px] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y transition-all"
          disabled={isProcessing}
        />

        {mode === 'oneliner' && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStyle("standard")}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border ${activeStyle === 'standard' ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'}`}
              >
                Standard Style
              </button>
              <button
                type="button"
                onClick={() => setActiveStyle("fancy")}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border ${activeStyle === 'fancy' ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/20' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'}`}
              >
                🌟 Fancy Q&A Style
              </button>
            </div>

            {availableModels.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isProcessing}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m} className="bg-gray-900 text-white">{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {mode === 'mcq' && availableModels.length > 0 && (
           <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">AI Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isProcessing}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-purple-300 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              >
                {availableModels.map(m => (
                  <option key={m} value={m} className="bg-gray-900 text-white">{m}</option>
                ))}
              </select>
            </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileChange} 
             accept=".pdf,image/*" 
             className="hidden" 
             disabled={isProcessing}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-gray-300 hover:text-white"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload PDF / Image</span>
          </button>
          
          {file && (
             <div className="flex items-center gap-2 bg-purple-500/10 text-purple-300 px-3 py-2 rounded-xl border border-purple-500/20 text-sm">
                {file.type === 'application/pdf' ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                <button type="button" onClick={clearFile} disabled={isProcessing} className="hover:text-white ml-2">
                  <X className="w-4 h-4" />
                </button>
             </div>
          )}

          <button
             type="button"
             onClick={handleGenerate}
             disabled={isProcessing || (!file && !prompt.trim())}
             className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
          >
             {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
             <span>{mode === 'mcq' ? "Generate MCQs" : "Process & Enhance"}</span>
          </button>
        </div>

        {error && (
            <div className="text-red-400 text-sm mt-2 font-medium bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                <p>{error}</p>
            </div>
        )}
      </div>
    </div>
  );
}
