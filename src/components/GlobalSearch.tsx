"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Users, FileQuestion, BookOpen, Trophy,
  Newspaper, LayoutDashboard, Settings, ArrowRight, X, Command
} from "lucide-react";

// ── Pages that can be navigated to directly ─────────────────────────────────
const PAGES = [
  { label: "Dashboard",       href: "/dashboard",                  icon: LayoutDashboard, keywords: ["home", "overview", "stats"] },
  { label: "User Management", href: "/dashboard/users",            icon: Users,           keywords: ["users", "accounts", "members", "approve", "ban"] },
  { label: "Curriculum",      href: "/dashboard/content",          icon: BookOpen,        keywords: ["subjects", "chapters", "content", "curriculum"] },
  { label: "Current Affairs", href: "/dashboard/current-affairs",  icon: Newspaper,       keywords: ["news", "current", "affairs", "ca"] },
  { label: "Question Bank",   href: "/dashboard/questions",        icon: FileQuestion,    keywords: ["questions", "mcq", "bank", "quiz"] },
  { label: "Test Factory",    href: "/dashboard/tests",            icon: Trophy,          keywords: ["tests", "exams", "factory", "create"] },
  { label: "Settings",        href: "/dashboard/settings",         icon: Settings,        keywords: ["security", "settings", "password", "config"] },
];

// ── "Search in X" quick actions ──────────────────────────────────────────────
const SEARCH_ACTIONS = [
  { label: "Search Questions",       href: "/dashboard/questions",        icon: FileQuestion },
  { label: "Search Users",           href: "/dashboard/users",            icon: Users        },
  { label: "Search Curriculum",      href: "/dashboard/content",          icon: BookOpen     },
  { label: "Search Current Affairs", href: "/dashboard/current-affairs",  icon: Newspaper    },
  { label: "Search Tests",           href: "/dashboard/tests",            icon: Trophy       },
];

export default function GlobalSearch() {
  const [query, setQuery]     = useState("");
  const [open, setOpen]       = useState(false);
  const [cursor, setCursor]   = useState(0);
  const router                = useRouter();
  const inputRef              = useRef<HTMLInputElement>(null);
  const containerRef          = useRef<HTMLDivElement>(null);

  // ── Filter pages by label / keywords ────────────────────────────────────
  const q = query.trim().toLowerCase();
  const matchedPages = q
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(q) ||
        p.keywords.some(kw => kw.includes(q))
      )
    : PAGES;

  // Only show search-in actions when there's a query
  const matchedActions = q ? SEARCH_ACTIONS : [];

  const allResults = [...matchedPages, ...matchedActions];
  const total = allResults.length;

  // ── Navigate to a result ─────────────────────────────────────────────────
  const navigate = useCallback(
    (idx: number) => {
      const item = allResults[idx];
      if (!item) return;
      const isAction = idx >= matchedPages.length;
      const url = isAction && q
        ? `${item.href}?q=${encodeURIComponent(query.trim())}`
        : item.href;
      router.push(url);
      setQuery("");
      setOpen(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allResults, matchedPages.length, q, query, router]
  );

  // ── Keyboard navigation ──────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, total - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); navigate(cursor); }
    if (e.key === "Escape")    { setOpen(false); setQuery(""); }
  };

  // ── Click outside closes ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Reset cursor when results change ─────────────────────────────────────
  useEffect(() => { setCursor(0); }, [query]);

  // ── Global keyboard shortcut: Ctrl+K / Cmd+K ────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {/* ── Search input ───────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-body-text pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages…"
          className="w-64 xl:w-80 bg-stroke/40 border border-stroke rounded-lg pl-9 pr-10 py-2 text-sm text-title-text placeholder:text-body-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-card transition-all"
        />
        {/* Shortcut badge */}
        {!query && (
          <span className="absolute right-3 flex items-center gap-0.5 text-[10px] text-body-text/50 font-mono select-none">
            <Command size={10} />K
          </span>
        )}
        {/* Clear button */}
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 text-body-text hover:text-title-text transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Dropdown results ───────────────────────────────────────────── */}
      {open && total > 0 && (
        <div className="absolute top-full left-0 mt-2 w-80 xl:w-96 bg-card border border-stroke rounded-2xl shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Page navigation results */}
          {matchedPages.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-body-text/50 px-4 pt-3 pb-1">
                Pages
              </p>
              {matchedPages.map((page, i) => {
                const Icon = page.icon;
                const isActive = cursor === i;
                return (
                  <button
                    key={page.href}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => navigate(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-title-text hover:bg-stroke/50"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-primary" : "text-body-text"} />
                    <span className="flex-1 text-sm font-medium">{page.label}</span>
                    {isActive && <ArrowRight size={14} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search-in-page actions (only when there's a query) */}
          {matchedActions.length > 0 && (
            <div className="border-t border-stroke">
              <p className="text-[10px] font-bold uppercase tracking-widest text-body-text/50 px-4 pt-3 pb-1">
                Search In
              </p>
              {matchedActions.map((action, j) => {
                const Icon = action.icon;
                const idx = matchedPages.length + j;
                const isActive = cursor === idx;
                return (
                  <button
                    key={action.label}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => navigate(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-title-text hover:bg-stroke/50"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-primary" : "text-body-text"} />
                    <span className="flex-1 text-sm font-medium">
                      {action.label}{" "}
                      <span className="font-bold">&ldquo;{query}&rdquo;</span>
                    </span>
                    {isActive && <ArrowRight size={14} />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer hint */}
          <div className="border-t border-stroke px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] text-body-text/40 font-mono">↑ ↓ navigate</span>
            <span className="text-[10px] text-body-text/40 font-mono">↵ select</span>
            <span className="text-[10px] text-body-text/40 font-mono">esc close</span>
          </div>
        </div>
      )}
    </div>
  );
}
