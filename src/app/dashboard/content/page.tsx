"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Plus,
  Book,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit3,
  Layers,
  FileText
} from "lucide-react";
import Link from "next/link";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function ContentPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectDesc, setNewSubjectDesc] = useState("");

  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; description: string } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: ""
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subjects");
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/subjects", { name: newSubjectName, description: newSubjectDesc });
      setNewSubjectName("");
      setNewSubjectDesc("");
      setShowAddSubject(false);
      fetchSubjects();
    } catch (err) {
      alert("Failed to create subject");
    }
  };

  const handleDeleteSubject = async () => {
    try {
      await api.delete(`/subjects/${deleteModal.id}`);
      fetchSubjects();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleEditClick = (sub: any) => {
    setEditingSubject({ id: sub.id, name: sub.name, description: sub.description || "" });
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    try {
      await api.patch(`/subjects/${editingSubject.id}`, {
        name: editingSubject.name,
        description: editingSubject.description
      });
      setEditingSubject(null);
      fetchSubjects();
    } catch (err) {
      alert("Failed to update subject");
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black italic tracking-tight">Curriculum</h1>
          <p className="text-gray-400 mt-2 text-lg font-medium">Structure your educational content by subjects and chapters.</p>
        </div>
        <button
          onClick={() => setShowAddSubject(true)}
          className="bg-primary text-dark font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={24} strokeWidth={3} />
          Create New Subject
        </button>
      </header>

      {showAddSubject && (
        <div className="bg-[#1B2838] p-8 rounded-3xl border-2 border-primary/30 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreateSubject} className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Subject Name</label>
              <input
                type="text"
                required
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Higher Mathematics"
                className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div className="flex-[2] space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Short Description</label>
              <input
                type="text"
                value={newSubjectDesc}
                onChange={(e) => setNewSubjectDesc(e.target.value)}
                placeholder="Briefly describe what this subject covers..."
                className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowAddSubject(false)}
                className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-dark px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/10"
              >
                Save Subject
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          <p className="col-span-full text-center py-20 text-gray-500 animate-pulse font-bold tracking-widest uppercase">Fetching Subject Data...</p>
        ) : subjects.map((sub) => (
          <div key={sub.id} className="group relative bg-[#1B2838] rounded-[2rem] p-8 border border-white/5 hover:border-primary/40 transition-all duration-500 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] group-hover:bg-primary/10 transition-colors flex items-start justify-end p-6">
              <Book className="text-primary/20 group-hover:text-primary/40 transition-all" size={32} />
            </div>

            <div className="relative">
              <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">{sub.name}</h3>
              <p className="text-gray-400 mt-2 text-sm line-clamp-2 h-10 font-medium">{sub.description || "No description provided."}</p>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">{sub.chapter_count || 0}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Chapters</span>
                </div>
                <div className="h-8 w-px bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">0</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Questions</span>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <Link href={`/dashboard/content/${sub.id}`} className="flex-1 h-14 bg-white/5 hover:bg-primary text-white hover:text-dark rounded-2xl flex items-center justify-center gap-2 font-bold transition-all group/btn whitespace-nowrap text-sm px-4">
                  Manage Chapters
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform shrink-0" />
                </Link>
                <button
                  onClick={() => handleEditClick(sub)}
                  className="w-14 h-14 bg-primary/10 hover:bg-primary text-primary hover:text-dark rounded-2xl flex items-center justify-center transition-all border border-primary/20"
                  title="Edit Subject"
                >
                  <Edit3 size={20} />
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: true, id: sub.id, name: sub.name })}
                  className="w-14 h-14 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        itemName={deleteModal.name}
      />

      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1B2838] w-full max-w-lg rounded-3xl p-8 border-2 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Edit3 size={24} />
              </div>
              <h2 className="text-3xl font-black">Edit Subject</h2>
            </div>
            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                  className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description</label>
                <textarea
                  rows={3}
                  value={editingSubject.description}
                  onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                  className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-all bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-dark px-8 py-3 rounded-xl font-black transition-all shadow-lg shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
