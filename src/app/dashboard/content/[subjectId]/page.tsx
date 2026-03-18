"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import Link from "next/link";
import {
  Plus,
  ChevronLeft,
  Trash2,
  GripVertical,
  Upload,
  Trophy,
  Edit3,
  FileText,
  FileQuestion,
  Eye,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import MdEditor from 'react-markdown-editor-lite';
import MarkdownIt from 'markdown-it';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt({ html: true, linkify: true, typographer: true }).enable('table');

const MarkdownEditor = ({ value, onChange, subject }: { value: string; onChange: (text: string) => void; subject: any }) => {
    const handleChange = useCallback(({ text }: { text: string }) => {
        onChange(text);
    }, [onChange]);

    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("subject", subject?.name || "General");
        formData.append("type", "image");
        formData.append("file", file);
        const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        return res.data.url;
    };

    return (
        <div className="md-editor-dark">
            <MdEditor
                value={value}
                style={{ height: '350px', border: 'none' }}
                renderHTML={(text) => mdParser.render(text)}
                onChange={handleChange}
                onImageUpload={handleImageUpload}
                placeholder="Write study content here... Supports **bold**, *italic*, tables (| Col | Col |), lists, code blocks and more."
                config={{
                    view: { menu: true, md: true, html: true },
                    canView: { menu: true, md: true, html: true, fullScreen: true, hideMenu: true },
                    table: { maxRow: 20, maxCol: 10 },
                }}
            />
        </div>
    );
};

export default function ChaptersPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "mcq" | "oneliner") || "mcq";
  
  const { subjectId } = useParams();
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterTags, setNewChapterTags] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [newMaterialContent, setNewMaterialContent] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterName, setEditChapterName] = useState("");
  const [editChapterTags, setEditChapterTags] = useState("");
  const [editChapterDesc, setEditChapterDesc] = useState("");

  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; description: string } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: ""
  });

  const [activeTab, setActiveTab ] = useState<"mcq" | "oneliner">(initialTab);
  
  // Study Materials State
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [selectedChapterForMaterials, setSelectedChapterForMaterials] = useState<any>(null);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    content: "",
    tags: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch subject details to get the name
      const subjectsRes = await api.get("/subjects");
      const currentSub = subjectsRes.data.find((s: any) => s.id === subjectId);
      setSubject(currentSub);

      // Fetch chapters
      const res = await api.get(`/subjects/${subjectId}/chapters`);
      setChapters(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async (chapterId: string) => {
    try {
      setLoadingMaterials(true);
      const res = await api.get(`/study-materials?chapter_id=${chapterId}`);
      setMaterials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleOpenMaterials = (chapter: any) => {
    setSelectedChapterForMaterials(chapter);
    fetchMaterials(chapter.id);
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = materialForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      const data = {
        title: materialForm.title,
        content: materialForm.content,
        tags: tagsArray,
        chapter_id: selectedChapterForMaterials.id
      };

      if (editingMaterial) {
        await api.patch(`/study-materials/${editingMaterial.id}`, data);
      } else {
        await api.post(`/study-materials`, data);
      }

      setMaterialForm({ title: "", content: "", tags: "" });
      setEditingMaterial(null);
      fetchMaterials(selectedChapterForMaterials.id);
      fetchData(); // Refresh counts
    } catch (err) {
      alert("Failed to save study material");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this study material?")) return;
    try {
      await api.delete(`/study-materials/${id}`);
      fetchMaterials(selectedChapterForMaterials.id);
      fetchData(); // Refresh counts
    } catch (err) {
      alert("Failed to delete material");
    }
  };

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title,
      content: material.content,
      tags: material.tags ? material.tags.join(", ") : ""
    });
  };

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const tagsArray = newChapterTags.split(",").map(t => t.trim()).filter(Boolean);
      // 1. Create the chapter
      const chapterRes = await api.post(`/subjects/${subjectId}/chapters`, {
        name: newChapterName,
        order: chapters.length + 1,
        tags: tagsArray,
        description: newChapterDesc,
        type: activeTab
      });

      // 2. If we are making a One-Liner and content was provided, instantly create the study material inside it.
      if (activeTab === "oneliner" && newMaterialContent.trim() !== "") {
        const chapterId = chapterRes.data.id;
        await api.post(`/study-materials`, {
            chapter_id: chapterId,
            title: newMaterialTitle || newChapterName, // Default to chapter name if no title given
            content: newMaterialContent,
            tags: tagsArray
        });
      }

      setNewChapterName("");
      setNewChapterTags("");
      setNewChapterDesc("");
      setNewMaterialTitle("");
      setNewMaterialContent("");
      setShowAddChapter(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData();
    } catch (err) {
      alert("Failed to create chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async () => {
    try {
      await api.delete(`/subjects/${subjectId}/chapters/${deleteModal.id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const handleEditClick = (chapter: any) => {
    setEditingChapterId(chapter.id);
    setEditChapterName(chapter.name);
    setEditChapterTags(chapter.tags ? chapter.tags.join(", ") : "");
    setEditChapterDesc(chapter.description || "");
  };

  const handleEditSubjectClick = () => {
    if (subject) {
      setEditingSubject({ id: subject.id, name: subject.name, description: subject.description || "" });
    }
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
      fetchData();
    } catch (err) {
      alert("Failed to update subject");
    }
  };

  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = editChapterTags.split(",").map(t => t.trim()).filter(Boolean);
      await api.patch(`/subjects/${subjectId}/chapters/${editingChapterId}`, {
        name: editChapterName,
        tags: tagsArray,
        description: editChapterDesc
      });
      setEditingChapterId(null);
      fetchData();
    } catch (err) {
      alert("Failed to update chapter");
    }
  };

  return (
    <div className="space-y-8">
      <Link href="/dashboard/content" className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors font-bold group w-fit">
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Subjects
      </Link>

      <header className="flex justify-between items-end">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black">{subject?.name || "Loading..."}</h1>
            {subject && (
              <button
                onClick={handleEditSubjectClick}
                className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-dark transition-all rounded-lg border border-primary/20"
                title="Edit Subject"
              >
                <Edit3 size={18} />
              </button>
            )}
          </div>
          <p className="text-gray-400 mt-2 text-lg font-medium">
            {subject?.description || "Manage chapters and content for this subject."}
          </p>
        </div>

      </header>

      {/* Bulk Upload Button */}
      <div className="flex justify-between items-center bg-[#1B2838] p-2 rounded-2xl border border-white/5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("oneliner")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "oneliner" ? 'bg-primary text-dark shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            One-Liner Chapters
          </button>
          <button
            onClick={() => setActiveTab("mcq")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === "mcq" ? 'bg-primary text-dark shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            MCQ Practice Chapters
          </button>
        </div>
        <div className="flex gap-3">
            {activeTab === "oneliner" ? (
              <button
                onClick={() => setShowAddChapter(true)}
                className="bg-primary/20 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-dark transition-all shadow-lg shadow-primary/10 hover:scale-105"
              >
                <Plus size={18} />
                Add One-Liner Chapter
              </button>
            ) : (
              <Link
                href={`/dashboard/content/${subjectId}/bulk-upload?type=mcq`}
                className="bg-primary/20 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary hover:text-dark transition-all shadow-lg shadow-primary/10 hover:scale-105"
              >
                <Upload size={18} />
                Bulk Upload MCQs
              </Link>
            )}
        </div>
      </div>



      {showSuccess && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300">
            <Trophy size={20} />
            Successfully added!
        </div>
      )}

      {showAddChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0D1B2A] w-full max-w-5xl max-h-[90vh] rounded-[2rem] flex flex-col shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1B2838]">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                      setShowAddChapter(false);
                      setNewMaterialTitle("");
                      setNewMaterialContent("");
                  }} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Plus size={24} />
                    </div>
                    <h2 className="text-2xl font-black">Add {activeTab === "oneliner" ? "One-Liner Chapter" : "MCQ Chapter"}</h2>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 bg-[#0D1B2A]">
              <form onSubmit={handleCreateChapter} className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex gap-4 items-start w-full">
                      <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chapter Name</label>
                      <input
                          type="text"
                          required
                          autoFocus
                          value={newChapterName}
                          onChange={(e) => setNewChapterName(e.target.value)}
                          placeholder="e.g. Newton's Laws"
                          className="w-full bg-[#1B2838] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                      </div>
                      <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Description (Optional)</label>
                      <input
                          type="text"
                          value={newChapterDesc}
                          onChange={(e) => setNewChapterDesc(e.target.value)}
                          placeholder="Brief summary..."
                          className="w-full bg-[#1B2838] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                      </div>
                      <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tags (Optional)</label>
                      <input
                          type="text"
                          value={newChapterTags}
                          onChange={(e) => setNewChapterTags(e.target.value)}
                          placeholder="#tag1, #tag2"
                          className="w-full bg-[#1B2838] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                      </div>
                  </div>

                  {/* Instant Material Form for One-Liners */}
                  {activeTab === "oneliner" && (
                      <div className="border-t border-white/10 pt-6 space-y-6">
                          <h3 className="text-lg font-black flex items-center gap-2">
                              <FileText size={20} className="text-primary" />
                              Initial Study Material
                          </h3>
                          
                          <div className="space-y-2">
                              <label className="text-xs font-black text-gray-500 uppercase ml-1">Material Title (Defaults to Chapter Name)</label>
                              <input
                                  type="text"
                                  value={newMaterialTitle}
                                  onChange={(e) => setNewMaterialTitle(e.target.value)}
                                  placeholder={`e.g. ${newChapterName || "Introduction"}`}
                                  className="w-full bg-[#1B2838] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                              />
                          </div>

                          <div className="space-y-2">
                              <label className="text-xs font-black text-gray-500 uppercase ml-1">Material Content (Rich Text / Markdown support)</label>
                              <div className="rounded-2xl overflow-hidden border border-white/10 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                                   <MarkdownEditor 
                                       value={newMaterialContent} 
                                       onChange={setNewMaterialContent} 
                                       subject={subject}
                                   />
                               </div>
                          </div>
                      </div>
                  )}

                  <div className="flex gap-3 justify-end mt-8">
                  <button
                      type="button"
                      onClick={() => {
                          setShowAddChapter(false);
                          setNewMaterialTitle("");
                          setNewMaterialContent("");
                      }}
                      className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition-all bg-white/5"
                  >
                      Cancel
                  </button>
                  <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-dark px-8 py-3 rounded-xl font-black shadow-lg shadow-primary/20 transition-all"
                  >
                      {isSubmitting ? "Adding..." : `Add ${activeTab === "oneliner" ? "Chapter & Material" : "Chapter"}`}
                  </button>
                  </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-20 text-gray-500">Loading chapters...</p>
        ) : chapters.filter(c => (c.type || 'mcq') === activeTab).length === 0 ? (
          <div className="bg-[#1B2838] rounded-3xl p-20 text-center border border-dashed border-white/10">
            <p className="text-gray-500 font-bold italic tracking-wider">No {activeTab === 'mcq' ? 'MCQ' : 'One-Liner'} chapters found for this subject. Create one to get started!</p>
          </div>
        ) : chapters.filter(c => (c.type || 'mcq') === activeTab).map((chapter, index) => (
          <div key={chapter.id} className="group bg-[#1B2838] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all flex items-center gap-6">
            <div className="flex items-center gap-4 flex-1">
              <GripVertical className="text-gray-600 cursor-grab" />
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-bold text-gray-400">
                {index + 1}
              </div>
              <div>
                <h3 className="text-xl font-bold">{chapter.name}</h3>
                <p className="text-xs text-gray-500 uppercase font-black tracking-widest mt-1">
                  {activeTab === 'mcq' ? `${chapter.mcq_count || 0} MCQs` : `${chapter.material_count || 0} Materials`}
                </p>
                {chapter.description && (
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2 max-w-2xl">{chapter.description}</p>
                )}
                {chapter.tags && chapter.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {chapter.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md font-bold tracking-wider">{tag.startsWith('#') ? tag : `#${tag}`}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeTab === "mcq" ? (
                <>
                  {chapter.last_practice_score !== null && (
                    <div className="mr-4 text-right">
                      <div className="text-xs font-black text-gray-500 uppercase tracking-widest">Last Practice</div>
                      <div className="text-lg font-black text-primary">
                        {chapter.last_practice_score} / {chapter.last_practice_total}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/content/${subjectId}/practice/${chapter.id}`}
                    className="bg-primary/20 hover:bg-primary text-primary hover:text-dark py-3 px-6 rounded-xl font-bold transition-all flex items-center gap-2 border border-primary/20"
                  >
                    <FileQuestion size={18} />
                    Practice
                  </Link>
                  <Link
                    href={`/dashboard/tests/create?chapterId=${chapter.id}&chapterName=${encodeURIComponent(chapter.name)}&subjectId=${subjectId}`}
                    className="bg-white/5 hover:bg-primary text-white hover:text-dark py-3 px-6 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Trophy size={18} />
                    Create Test
                  </Link>
                  <Link
                    href={`/dashboard/content/${subjectId}/bulk-edit/${chapter.id}?type=mcq`}
                    className="bg-white/5 hover:bg-secondary/20 text-white hover:text-secondary py-3 px-4 rounded-xl font-bold transition-all flex items-center gap-2 border border-transparent hover:border-secondary/30"
                    title="Bulk Edit"
                  >
                    <FileText size={18} />
                    Bulk
                  </Link>
                  <Link
                    href={`/dashboard/content/upload?chapterId=${chapter.id}&chapterName=${encodeURIComponent(chapter.name)}`}
                    className="bg-white/5 hover:bg-secondary text-white py-3 px-6 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Upload
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => handleOpenMaterials(chapter)}
                  className="bg-white/5 hover:bg-cyan-500/20 text-white hover:text-cyan-400 py-3 px-5 rounded-xl font-bold transition-all flex items-center gap-2 border border-transparent hover:border-cyan-500/30"
                >
                  <FileText size={18} />
                  Manage Materials
                </button>
              )}
              
              <button
                onClick={() => handleEditClick(chapter)}
                className="p-3 bg-primary/10 text-primary hover:bg-primary hover:text-dark transition-all rounded-xl border border-primary/20"
                title="Edit Chapter"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={() => setDeleteModal({ isOpen: true, id: chapter.id, name: chapter.name })}
                className="p-3 text-gray-500 hover:text-white hover:bg-red-500/20 transition-all bg-white/5 rounded-xl"
                title="Delete Chapter"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDeleteChapter}
        title="Delete Chapter"
        itemName={deleteModal.name}
      />

      {editingChapterId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1B2838] w-full max-w-lg rounded-3xl p-8 border-2 border-primary/20 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Edit3 size={24} />
              </div>
              <h2 className="text-3xl font-black">Edit Chapter</h2>
            </div>
            <form onSubmit={handleUpdateChapter} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chapter Name</label>
                <input
                  type="text"
                  required
                  value={editChapterName}
                  onChange={(e) => setEditChapterName(e.target.value)}
                  className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chapter Content / Description</label>
                <textarea
                  rows={4}
                  value={editChapterDesc}
                  onChange={(e) => setEditChapterDesc(e.target.value)}
                  placeholder="Detailed content or summary of this chapter..."
                  className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Comma-separated Tags</label>
                <input
                  type="text"
                  value={editChapterTags}
                  onChange={(e) => setEditChapterTags(e.target.value)}
                  placeholder="e.g. #physics, #logic"
                  className="w-full bg-[#0D1B2A] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setEditingChapterId(null)}
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

      {/* Study Materials Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0D1B2A] w-full max-w-6xl max-h-[90vh] rounded-[2rem] flex flex-col shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1B2838]">
              <div className="flex items-center gap-4">
                <button onClick={() => setShowMaterialModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <XCircle size={24} className="text-gray-400" />
                </button>
                <div>
                  <h2 className="text-2xl font-black">Study Materials</h2>
                  <p className="text-sm text-primary font-bold">{selectedChapterForMaterials?.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingMaterial(null);
                  setMaterialForm({ title: "", content: "", tags: "" });
                }}
                className="bg-primary text-dark px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Plus size={18} />
                New Material
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Materials List */}
              <div className="w-1/3 border-r border-white/5 overflow-y-auto p-6 space-y-4 bg-[#0A1624]">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Chapter Materials</h3>
                {loadingMaterials ? (
                  <p className="text-center py-10 text-gray-500">Loading...</p>
                ) : materials.length === 0 ? (
                  <p className="text-center py-10 text-gray-500 italic">No materials yet.</p>
                ) : (
                  materials.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => handleEditMaterial(m)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group ${editingMaterial?.id === m.id ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white group-hover:text-primary transition-colors">{m.title}</h4>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(m.id); }}
                          className="p-1 text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">Added {new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Editor Section */}
              <div className="flex-1 overflow-y-auto p-10 bg-[#0D1B2A]">
                <form onSubmit={handleSaveMaterial} className="space-y-6 max-w-3xl mx-auto">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase ml-1">Material Title</label>
                        <input
                            type="text"
                            required
                            value={materialForm.title}
                            onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                            placeholder="e.g. Introduction to Thermodynamics"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white text-xl font-black focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase ml-1">Tags (Comma-separated)</label>
                        <input
                            type="text"
                            value={materialForm.tags}
                            onChange={(e) => setMaterialForm({ ...materialForm, tags: e.target.value })}
                            placeholder="theory, basics, exams"
                            className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-6 text-white font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-500 uppercase ml-1">Content (Rich Text)</label>
                        <div className="rounded-2xl overflow-hidden border border-white/5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                            <MarkdownEditor 
                                value={materialForm.content} 
                                onChange={(html) => setMaterialForm({ ...materialForm, content: html })} 
                                subject={subject}
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => { setEditingMaterial(null); setMaterialForm({ title: "", content: "", tags: "" }); }}
                            className="px-8 py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-all"
                        >
                            Reset Form
                        </button>
                        <button
                            type="submit"
                            className="bg-primary text-dark px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-xl shadow-primary/20"
                        >
                            {editingMaterial ? "Update Material" : "Save & Launch"}
                        </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
