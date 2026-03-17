"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  UserCheck,
  UserX,
  Shield,
  Trash2,
  Search,
  MoreVertical,
  Mail,
  Calendar,
  Plus,
  X,
  Loader2
} from "lucide-react";

import DeleteConfirmModal from "@/components/DeleteConfirmModal";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: ""
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "user" });
  const [adding, setAdding] = useState(false);


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/users/${id}/approve`, { is_approved: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${deleteModal.id}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/auth/register", newUser);
      setAddModalOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to add user");
    } finally {
      setAdding(false);
    }
  };


  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black">User Management</h1>
          <p className="text-gray-400 mt-2 text-lg">Control access levels and verify new registrations.</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            Add New User
          </button>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1B2838] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

      </header>

      <div className="bg-[#1B2838] rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#0D1B2A]/50 border-b border-white/5">
            <tr>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">User Details</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Role</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500">Joined</th>
              <th className="p-6 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="p-20 text-center text-gray-500 italic">Loading user data...</td></tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center border border-white/10 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-gray-500">{u.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{u.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1"><Mail size={12} /> {u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="bg-[#0D1B2A] border border-white/10 rounded-lg px-3 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-6">
                  <button
                    onClick={() => handleApprove(u.id, u.is_approved)}
                    className={`
                      flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all
                      ${u.is_approved ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}
                    `}
                  >
                    {u.is_approved ? <UserCheck size={14} /> : <UserX size={14} />}
                    {u.is_approved ? "Approved" : "Pending"}
                  </button>
                </td>
                <td className="p-6">
                  <p className="text-sm text-gray-400 flex items-center gap-1"><Calendar size={14} /> {new Date(u.created_at).toLocaleDateString()}</p>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: u.id, name: u.name })}
                      className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button className="p-2 hover:bg-white/5 text-gray-500 hover:text-white rounded-lg transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={handleDelete}
        title="Delete User"
        itemName={deleteModal.name}
      />

      {/* Add User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-99 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#1B2838] rounded-3xl p-8 border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setAddModalOpen(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-3xl font-black mb-2">Add New User</h2>
            <p className="text-gray-400 mb-8">Manually register a user or administrator.</p>

            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="rahul@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-[#0D1B2A] border border-white/5 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-primary hover:bg-primary/90 text-dark font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
}
