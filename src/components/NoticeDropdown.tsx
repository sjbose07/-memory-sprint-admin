"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Trash2, X, AlertCircle, Info, ShieldAlert } from "lucide-react";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Notice {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NoticeDropdown() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notices.filter((n) => !n.is_read).length;

  const fetchNotices = async () => {
    try {
      const res = await api.get("/admin/notices");
      setNotices(res.data);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
    // Refresh every 3 minutes
    const interval = setInterval(fetchNotices, 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/admin/notices/${id}/read`);
      setNotices(notices.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const deleteNotice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/admin/notices/${id}`);
      setNotices(notices.filter(n => n.id !== id));
      if (selectedNotice?.id === id) setSelectedNotice(null);
    } catch (err) {
      console.error("Failed to delete notice:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SYSTEM_ERROR': return <AlertCircle size={18} className="text-danger" />;
      case 'SECURITY_ALERT': return <ShieldAlert size={18} className="text-warning" />;
      default: return <Info size={18} className="text-primary" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-card hover:text-primary text-body-text transition-colors"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 z-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unreadCount}
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-40"></span>
          </span>
        )}
        <Bell size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute -right-27 mt-2.5 flex h-90 w-75 flex-col rounded-sm border border-stroke bg-card shadow-default sm:right-0 sm:w-105 z-[999]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-stroke bg-card">
            <h5 className="text-sm font-bold text-title-text uppercase tracking-widest">System Notices</h5>
            {unreadCount > 0 && <span className="text-[10px] bg-danger/10 text-danger px-2 py-0.5 rounded-full font-bold">{unreadCount} NEW</span>}
          </div>

          <ul className="flex h-auto flex-col overflow-y-auto no-scrollbar py-2">
            {notices.length === 0 ? (
              <li className="flex flex-col items-center justify-center py-20 opacity-50">
                <Bell size={40} className="mb-2" />
                <p className="text-sm font-medium">No notices yet</p>
              </li>
            ) : (
              notices.map((notice) => (
                <li key={notice.id} className="px-2">
                  <div
                    onClick={() => {
                      setSelectedNotice(notice);
                      if (!notice.is_read) markAsRead(notice.id);
                    }}
                    className={`flex flex-col gap-3 rounded-lg border-b border-transparent px-5 py-5 hover:bg-body cursor-pointer transition-all duration-200 mb-1 ${!notice.is_read ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:shadow-sm'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getIcon(notice.type)}
                        <p className="text-sm font-bold text-title-text truncate w-48 sm:w-64">
                          {notice.title}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => deleteNotice(notice.id, e)}
                        className="text-body-text hover:text-danger opacity-30 hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-body-text line-clamp-2 ml-8 opacity-80 leading-relaxed">
                      {notice.message}
                    </p>
                    <p className="text-[10px] text-body-text/60 ml-8 font-medium">
                      {formatDistanceToNow(new Date(notice.created_at))} ago
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {/* Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-card border border-stroke rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stroke bg-body/50">
              <div className="flex items-center gap-3">
                {getIcon(selectedNotice.type)}
                <h3 className="text-lg font-black text-title-text tracking-tight uppercase">Notice Details</h3>
              </div>
              <button 
                onClick={() => setSelectedNotice(null)}
                className="text-body-text hover:text-title-text transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="text-[10px] font-black text-body-text uppercase tracking-widest block mb-1">Subject</label>
                <h2 className="text-xl font-bold text-title-text leading-tight">{selectedNotice.title}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedNotice.type === 'SYSTEM_ERROR' ? 'bg-danger/10 text-danger' : 
                    selectedNotice.type === 'SECURITY_ALERT' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                  }`}>
                    {selectedNotice.type}
                  </span>
                  <span className="text-[10px] text-body-text font-bold">
                    {new Date(selectedNotice.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mb-8">
                <label className="text-[10px] font-black text-body-text uppercase tracking-widest block mb-2">Detailed Payload / Message</label>
                <div className="bg-body border border-stroke rounded-md p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs text-body-text font-mono whitespace-pre-wrap break-all leading-relaxed">
                    {selectedNotice.message}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="px-6 py-2.5 rounded-md font-bold text-sm bg-body border border-stroke hover:bg-stroke text-title-text transition-all"
                >
                  Close
                </button>
                <button
                  onClick={(e) => {
                    deleteNotice(selectedNotice.id, e as any);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-md font-bold text-sm bg-danger text-white hover:bg-danger/90 transition-all shadow-lg shadow-danger/20"
                >
                  <Trash2 size={16} />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
