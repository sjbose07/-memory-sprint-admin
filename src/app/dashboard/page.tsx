"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Users,
  BookOpen,
  FileQuestion,
  Trophy,
  PlusCircle,
  Activity
} from "lucide-react";

const data = [
  { name: 'Math', accuracy: 80 },
  { name: 'Physics', accuracy: 65 },
  { name: 'Chemistry', accuracy: 92 },
  { name: 'Biology', accuracy: 75 },
  { name: 'History', accuracy: 88 },
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchData = async () => {
      try {
        const [statsRes, perfRes] = await Promise.all([
          api.get("/analytics/global-stats"),
          api.get("/analytics/performance")
        ]);
        setStats(statsRes.data);
        setPerformance(perfRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = performance?.subjectAccuracy?.map((s: any) => ({
    name: s.subject_name.split(' ')[0],
    accuracy: parseFloat(s.accuracy)
  })) || data;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-title-text">Welcome back, {user?.name || "Admin"}!</h2>
          <p className="text-sm text-body-text mt-1">Here's a snapshot of your platform's performance.</p>
        </div>
        <Link href="/dashboard/tests" className="btn-primary">
          <Trophy size={18} />
          Manage Test Factory
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-primary" />}
          label="Total Users"
          value={loading ? "..." : (stats?.total_users || 0).toLocaleString()}
          change="Real-time"
        />
        <StatCard
          icon={<BookOpen className="text-secondary" />}
          label="Subjects"
          value={loading ? "..." : (stats?.total_subjects || 0).toLocaleString()}
          change={`${stats?.total_tests || 0} Tests`}
        />
        <StatCard
          icon={<FileQuestion className="text-success" />}
          label="Total Questions"
          value={loading ? "..." : (stats?.total_questions || 0).toLocaleString()}
          change="Bank Capacity"
        />
        <StatCard
          icon={<Activity className="text-warning" />}
          label="Total Attempts"
          value={loading ? "..." : (stats?.total_attempts || 0).toLocaleString()}
          change="All sessions"
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
        <div className="lg:col-span-3 card p-6">
          <h3 className="font-semibold text-lg text-title-text mb-4">Subject Accuracy (Avg)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#8a99af" fontSize={12} />
              <YAxis stroke="#8a99af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a222c',
                  borderColor: '#313d4a',
                  color: '#fff'
                }}
              />
              <Legend iconSize={10} />
              <Bar dataKey="accuracy" fill="#3c50e0" name="Avg Accuracy %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-lg text-title-text mb-4">Recent Submissions</h3>
          <div className="space-y-4">
            {loading ? (
              <p className="text-center py-10 text-body-text">Loading activity...</p>
            ) : performance?.recentActivity?.length > 0 ? (
              performance.recentActivity.slice(-5).reverse().map((act: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-body rounded-md border border-stroke">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                      {new Date(act.date).getDate()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-title-text">{new Date(act.date).toLocaleDateString()}</p>
                      <p className="text-xs text-body-text">{act.attempt_count} Attempts today</p>
                    </div>
                  </div>
                  <p className="text-primary font-bold text-lg">{Math.round(act.avg_score)}%</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-body-text italic">No recent activity found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import api from "@/lib/api";
import Link from "next/link";

function StatCard({ icon, label, value, change }: { icon: any, label: string, value: string, change: string }) {
  return (
    <div className="card p-6 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div className="w-12 h-12 rounded-full bg-body flex items-center justify-center">
          {icon}
        </div>
        <span className={`text-xs font-medium ${change.startsWith('+') ? 'text-success' : 'text-danger'}`}>{change}</span>
      </div>
      <div className="mt-4">
        <h4 className="text-2xl font-bold text-title-text">{value}</h4>
        <p className="text-sm font-medium text-body-text mt-1">{label}</p>
      </div>
    </div>
  );
}
