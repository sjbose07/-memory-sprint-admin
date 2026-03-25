"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import GlobalSearch from "@/components/GlobalSearch";
import {
  Users,
  BookOpen,
  FileQuestion,
  Trophy,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  Search,
  MessageSquare,
  Database,
  Newspaper,
  ShieldCheck,
  Settings,
  User as UserIcon,
} from "lucide-react";
import api from "@/lib/api";
import Link from "next/link";
import NoticeDropdown from "@/components/NoticeDropdown";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [storage, setStorage] = useState<string>("Loading...");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Validate token with backend
    api.get("/auth/me")
      .then(res => {
        if (res.data.role !== 'admin') {
           // Not an admin anymore
           localStorage.clear();
           router.push("/login");
        } else {
           setUser(res.data);
           localStorage.setItem("user", JSON.stringify(res.data));
        }
      })
      .catch((err) => {
        console.error("Auth validation failed", err);
        // If it's a 401 or 403, the token is invalid/expired
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
           localStorage.clear();
           router.push("/login");
        }
      });

    // Fetch DB Storage if admin
    if (parsedUser.role === 'admin') {
      api.get("/analytics/database-stats")
        .then(res => {
          if (res.data.formatted_size) setStorage(res.data.formatted_size);
          else setStorage("Error");
        })
        .catch(() => setStorage("Error"));
    }
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-body">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72.5 flex-col overflow-y-hidden bg-card duration-300 ease-linear lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } border-r border-stroke`}
        style={{ width: sidebarOpen ? "290px" : "0px" }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5 mt-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center font-black text-white text-xl">M</div>
            <span className="text-2xl font-bold text-title-text tracking-tight">NextAdmin</span>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear px-4 py-4 lg:px-6">
          <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
            <div>
              <h3 className="mb-4 ml-4 text-sm font-semibold text-body-text uppercase tracking-widest">MENU</h3>
              <ul className="mb-6 flex flex-col gap-1.5">
                <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" active={pathname === "/dashboard"} />
                <NavItem href="/dashboard/users" icon={<Users size={18} />} label="User Management" active={pathname === "/dashboard/users"} />
                <NavItem href="/dashboard/content" icon={<BookOpen size={18} />} label="Curriculum" active={pathname.startsWith("/dashboard/content")} />
                <NavItem href="/dashboard/current-affairs" icon={<Newspaper size={18} />} label="Current Affairs" active={pathname.startsWith("/dashboard/current-affairs")} />
                <NavItem href="/dashboard/questions" icon={<FileQuestion size={18} />} label="Question Bank" active={pathname.startsWith("/dashboard/questions")} />
                <NavItem href="/dashboard/tests" icon={<Trophy size={18} />} label="Test Factory" active={pathname.startsWith("/dashboard/tests")} />
                <NavItem href="/dashboard/settings" icon={<Settings size={18} />} label="Security Settings" active={pathname === "/dashboard/settings"} />
              </ul>
            </div>
          </nav>

          <div className="mt-auto pb-10 px-6">
            <button
              onClick={handleLogout}
              className="group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-body-text duration-300 ease-in-out hover:bg-stroke hover:text-title-text w-full text-left"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex w-full bg-card drop-shadow-1 border-b border-stroke">
          <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="block rounded-sm border border-stroke bg-card p-1.5 shadow-sm">
                <Menu size={20} className="text-body-text" />
              </button>
            </div>

            <div className="hidden sm:block" ref={searchRef}>
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-3 2xsm:gap-7">
              {/* Storage Widget */}
              {user.role === 'admin' && (
                <div className="hidden sm:flex items-center gap-2 bg-[#1B2838] border border-white/5 px-4 py-2 rounded-full cursor-help group transition-all hover:border-primary/30" title="Total Database Storage Used">
                  <Database size={16} className="text-secondary group-hover:text-primary transition-colors" />
                  <span className="text-sm font-bold text-white tracking-wide">{storage} <span className="text-[10px] text-gray-500 font-bold uppercase ml-1">USED /500MB</span></span>
                </div>
              )}

              <ul className="flex items-center gap-2 2xsm:gap-4 ml-2">
                <li>
                  <NoticeDropdown />
                </li>
                <HeaderIcon icon={<MessageSquare size={20} />} />
              </ul>

              {/* User Menu */}
              <div ref={dropdownRef} className="relative ml-4">
                <div 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-4 cursor-pointer group"
                >
                  <span className="hidden text-right lg:block">
                    <span className="block text-sm font-medium text-title-text">{user.name}</span>
                    <span className="block text-[10px] text-body-text uppercase font-bold tracking-widest">{user.role}</span>
                  </span>
                  <span className="h-11 w-11 rounded-full overflow-hidden border border-stroke">
                    <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="User" />
                  </span>
                  <ChevronDown size={16} className={`text-body-text group-hover:text-primary transition-all ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-5.5 flex w-66 flex-col rounded-2xl border border-stroke bg-card shadow-2xl overflow-hidden backdrop-blur-sm">
                    <ul className="flex flex-col gap-1 border-b border-stroke p-3">
                      <li>
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-3.5 text-sm font-semibold duration-300 ease-in-out hover:text-primary lg:text-base p-2.5 rounded-xl hover:bg-stroke/50"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Settings size={20} className="text-secondary" />
                          Security Settings
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/dashboard/users"
                          className="flex items-center gap-3.5 text-sm font-semibold duration-300 ease-in-out hover:text-primary lg:text-base p-2.5 rounded-xl hover:bg-stroke/50"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Users size={20} className="text-secondary" />
                          User Management
                        </Link>
                      </li>
                    </ul>
                    <div className="p-3">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3.5 text-sm font-semibold duration-300 ease-in-out hover:text-red-500 lg:text-base p-2.5 rounded-xl hover:bg-red-500/10 w-full text-left"
                      >
                        <LogOut size={20} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="bg-body min-h-screen">
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: any, label: string, active?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out ${active ? "bg-stroke text-title-text" : "text-body-text hover:bg-stroke hover:text-title-text"
          }`}
      >
        {icon}
        {label}
      </Link>
    </li>
  );
}

function HeaderIcon({ icon, hasNotification = false }: { icon: any, hasNotification?: boolean }) {
  return (
    <li>
      <div
        className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-stroke bg-card hover:text-primary text-body-text cursor-pointer transition-colors"
      >
        {hasNotification && (
          <span className="absolute -top-0.5 right-0 z-1 h-2 w-2 rounded-full bg-danger">
            <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
          </span>
        )}
        {icon}
      </div>
    </li>
  );
}
