"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield,
  Sparkles,
  User,
  X,
  Smartphone,
  Calendar,
  Layers,
  Heart,
  BookOpen,
  Trash2,
  Edit,
  UserPlus,
} from "lucide-react";
import { clsx } from "clsx";

interface ApiUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  userType: string;
  tier: string;
  isActive: boolean;
  isSuperuser: boolean;
  requestsToday: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const tierLabels: Record<string, string> = {
  admin: "Admin",
  ultra: "Ultra",
  pro: "Pro",
  basic: "Basic",
};

const tierColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-400 border-red-500/20",
  ultra: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  pro: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  basic: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

const tierIcons: Record<string, React.ElementType> = {
  admin: Crown,
  ultra: Sparkles,
  pro: Shield,
  basic: User,
};

export default function UsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  
  // 360 Degree profile states
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Add User states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
    userType: "owner",
    tier: "basic",
  });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit User states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    userType: "owner",
    tier: "basic",
    isActive: true,
  });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete User states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (search) params.set("search", search);
    if (filterTier !== "all") params.set("tier", filterTier);
    if (filterStatus !== "all") params.set("status", filterStatus);

    try {
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      let filtered = data.users || [];
      if (filterType !== "all") {
        filtered = filtered.filter((u: ApiUser) => u.userType === filterType);
      }
      setUsers(filtered);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterTier, filterStatus, filterType]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Inline switch toggle action
  const handleToggleActive = async (user: ApiUser) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          displayName: user.displayName || user.username,
          userType: user.userType,
          tier: user.tier,
          isActive: !user.isActive,
        }),
      });
      if (res.ok) {
        fetchUsers(pagination.page);
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  // Add user submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setIsAddModalOpen(false);
      setAddForm({
        username: "",
        email: "",
        password: "",
        displayName: "",
        userType: "owner",
        tier: "basic",
      });
      fetchUsers(1);
    } catch (err: any) {
      setAddError(err.message || "An error occurred");
    } finally {
      setAddLoading(false);
    }
  };

  // Edit user submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          displayName: editForm.displayName,
          userType: editForm.userType,
          tier: editForm.tier,
          isActive: editForm.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setIsEditModalOpen(false);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setEditError(err.message || "An error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete user submit
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setIsDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setDeleteError(err.message || "An error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Quản lý Người dùng
          </h1>
          <p className="text-muted text-sm mt-1">
            Hệ thống Unified Identity tích hợp xuyên suốt sản phẩm ({pagination.total} tài khoản).
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)] align-self-start sm:align-self-center animate-in fade-in duration-300"
        >
          <UserPlus size={14} />
          Thêm User Mới
        </button>
      </div>

      {/* Filters Form (Glassmorphism layout) */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản theo tên, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/20 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
            {/* Filter Tier */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-2.5 text-xs bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="all" className="bg-[#090D16]">Tất cả Tiers</option>
              <option value="admin" className="bg-[#090D16]">Admin</option>
              <option value="pro" className="bg-[#090D16]">Pro</option>
              <option value="basic" className="bg-[#090D16]">Basic</option>
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 text-xs bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="all" className="bg-[#090D16]">Tất cả Trạng thái</option>
              <option value="active" className="bg-[#090D16]">Active</option>
              <option value="inactive" className="bg-[#090D16]">Inactive</option>
            </select>

            {/* Filter User Type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="col-span-2 sm:col-span-1 px-3 py-2.5 text-xs bg-black/20 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="all" className="bg-[#090D16]">Tất cả Loại User</option>
              <option value="owner" className="bg-[#090D16]">Account Owner</option>
              <option value="child" className="bg-[#090D16]">Child (Trẻ em)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table Glass Container */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-muted text-xs font-semibold uppercase tracking-wider">
                <th className="px-5 py-4">Tài khoản</th>
                <th className="px-5 py-4 hidden md:table-cell">Email</th>
                <th className="px-5 py-4">Subscription</th>
                <th className="px-5 py-4">Loại User</th>
                <th className="px-5 py-4 hidden lg:table-cell">Tương tác hôm nay</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-muted">
                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mx-auto mb-2" />
                    Đang nạp dữ liệu người dùng...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const TierIcon = tierIcons[user.tier] || User;
                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-foreground flex items-center gap-1.5">
                              {user.displayName || user.username}
                              {user.isSuperuser && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-extrabold rounded uppercase tracking-wider">
                                  Admin
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-muted font-mono shrink-0">ID: {user.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted hidden md:table-cell font-medium">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border", tierColors[user.tier])}>
                          <TierIcon size={12} />
                          {tierLabels[user.tier] || user.tier}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-bold tracking-wide uppercase ${
                          user.userType === "owner" ? "text-purple-400" :
                          user.userType === "child" ? "text-success" :
                          user.isSuperuser ? "text-red-400" : "text-amber-500"
                        }`}>
                          {user.userType === "owner" ? "Owner" :
                           user.userType === "child" ? "Child" :
                           user.isSuperuser ? "Admin" : "Demo / Guest"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="font-mono text-xs text-foreground bg-white/5 border border-white/5 px-2 py-0.5 rounded">{user.requestsToday} reqs</span>
                      </td>
                      {/* Switch Inline Toggle */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={clsx(
                            "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            user.isActive ? "bg-success" : "bg-white/10"
                          )}
                        >
                          <span
                            className={clsx(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              user.isActive ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2 py-1 bg-white/5 border border-white/5 hover:border-white/10 rounded-lg text-xs font-semibold text-accent transition-colors cursor-pointer"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditForm({
                                displayName: user.displayName || "",
                                userType: user.userType || "owner",
                                tier: user.tier || "basic",
                                isActive: user.isActive,
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 rounded-lg text-xs font-semibold text-amber-400 transition-colors cursor-pointer"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteOpen(true);
                            }}
                            className="px-2 py-1 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 rounded-lg text-xs font-semibold text-red-400 transition-colors cursor-pointer"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/5 bg-white/5">
          <p className="text-xs text-muted">
            Hiển thị trang {pagination.page} / {pagination.totalPages} ({pagination.total} người dùng)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="p-1.5 rounded-lg border border-white/5 disabled:opacity-30 hover:bg-white/5 text-muted transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-xs font-bold bg-accent text-white rounded-lg">
              {pagination.page}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="p-1.5 rounded-lg border border-white/5 disabled:opacity-30 hover:bg-white/5 text-muted transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Detail 360 Degree Modal */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)} />
          
          <div className="glass-card rounded-2xl max-w-xl w-full p-6 relative overflow-hidden z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/20 border border-accent flex items-center justify-center text-accent text-xl font-bold">
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-foreground leading-tight">
                    {selectedUser.displayName || selectedUser.username}
                  </h2>
                  <p className="text-xs text-muted mt-0.5">Tài khoản Unified ID: {selectedUser.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone size={10} className="text-accent" />
                  Loại đối tượng
                </p>
                <p className="text-sm font-bold text-foreground mt-1 capitalize">{selectedUser.userType}</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={10} className="text-accent" />
                  Ngày khởi tạo
                </p>
                <p className="text-sm font-bold text-foreground mt-1">
                  {new Date(selectedUser.createdAt).toLocaleDateString("vi-VN", { dateStyle: "long" })}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-purple-400" />
                Sơ đồ Enroll dịch vụ & Thiết bị tương ứng
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 bg-[#0C101A]/60 border border-white/5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Robot PTalk Assistant</h4>
                      <p className="text-[10px] text-muted mt-0.5">Thiết bị gán: Serial-PT-8819</p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-success/10 text-success border border-success/20 font-bold px-2 py-0.5 rounded uppercase">
                    Active
                  </span>
                </div>

                <div className={clsx(
                  "p-3 border rounded-xl flex items-center justify-between transition-opacity",
                  selectedUser.userType === "child" 
                    ? "bg-[#0C101A]/60 border-white/5 opacity-100" 
                    : "bg-black/10 border-white/5 opacity-40"
                )}>
                  <div className="flex items-center gap-3">
                    <BookOpen size={14} className="text-accent" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Kid Mentor App</h4>
                      <p className="text-[10px] text-muted mt-0.5">Tiến độ bài học: 12/45 bài</p>
                    </div>
                  </div>
                  <span className={clsx(
                    "text-[9px] font-bold px-2 py-0.5 rounded uppercase",
                    selectedUser.userType === "child" 
                      ? "bg-accent/10 text-accent border border-accent/20" 
                      : "bg-white/5 text-muted"
                  )}>
                    {selectedUser.userType === "child" ? "Active" : "Not Enrolled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-5 mt-6 border-t border-white/5">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          
          <form onSubmit={handleAddSubmit} className="glass-card rounded-2xl max-w-md w-full p-6 relative overflow-hidden z-10 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserPlus size={20} className="text-accent" />
                Thêm User Mới
              </h2>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs font-semibold rounded-xl">
                ⚠️ {addError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full px-3.5 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="Nhập email..."
                  className="w-full px-3.5 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                  className="w-full px-3.5 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Tên hiển thị (Tùy chọn)</label>
                <input
                  type="text"
                  value={addForm.displayName}
                  onChange={(e) => setAddForm({ ...addForm, displayName: e.target.value })}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full px-3.5 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Loại User</label>
                  <select
                    value={addForm.userType}
                    onChange={(e) => setAddForm({ ...addForm, userType: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="owner" className="bg-[#090D16]">Account Owner</option>
                    <option value="child" className="bg-[#090D16]">Child (Bé)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Gói Gói cước (Tier)</label>
                  <select
                    value={addForm.tier}
                    onChange={(e) => setAddForm({ ...addForm, tier: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="basic" className="bg-[#090D16]">Basic (Demo)</option>
                    <option value="pro" className="bg-[#090D16]">Pro</option>
                    <option value="ultra" className="bg-[#090D16]">Ultra</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={addLoading}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                {addLoading ? "Đang tạo..." : "Xác nhận tạo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          
          <form onSubmit={handleEditSubmit} className="glass-card rounded-2xl max-w-md w-full p-6 relative overflow-hidden z-10 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Edit size={20} className="text-amber-500" />
                Chỉnh sửa User: {selectedUser.username}
              </h2>
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-xs font-semibold rounded-xl">
                ⚠️ {editError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Tên hiển thị</label>
                <input
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="Nhập tên hiển thị..."
                  className="w-full px-3.5 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Loại User</label>
                <select
                  value={editForm.userType}
                  onChange={(e) => setEditForm({ ...editForm, userType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="owner" className="bg-[#090D16]">Account Owner</option>
                  <option value="child" className="bg-[#090D16]">Child (Bé)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Gói cước (Subscription Tier)</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-black/30 border border-white/5 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="basic" className="bg-[#090D16]">Basic (Demo)</option>
                  <option value="pro" className="bg-[#090D16]">Pro</option>
                  <option value="ultra" className="bg-[#090D16]">Ultra</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Trạng thái hoạt động</h4>
                  <p className="text-[10px] text-muted">Khoá/Mở khoá quyền sử dụng của tài khoản</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                  className={clsx(
                    "relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    editForm.isActive ? "bg-success" : "bg-white/10"
                  )}
                >
                  <span
                    className={clsx(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      editForm.isActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
              <button 
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={editLoading}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
          
          <div className="glass-card rounded-2xl max-w-sm w-full p-6 relative overflow-hidden z-10 animate-in fade-in zoom-in duration-200 space-y-4">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-danger/10 border border-danger/20 rounded-full flex items-center justify-center text-danger mb-3">
                <Trash2 size={24} />
              </div>
              <h2 className="text-base font-bold text-foreground">Bạn có chắc chắn muốn xoá?</h2>
              <p className="text-xs text-muted leading-relaxed">
                Tài khoản **{selectedUser.username}** sẽ bị xoá vĩnh viễn khỏi hệ thống cùng với toàn bộ thiết bị gán, lịch sử chat và quyền hạn liên quan. Hành động này **không thể hoàn tác**!
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-danger/10 border border-danger/20 text-danger text-[11px] font-semibold rounded-xl text-left">
                ⚠️ {deleteError}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 py-2 bg-white/5 border border-white/5 hover:border-white/10 text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteLoading}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40"
              >
                {deleteLoading ? "Đang xoá..." : "Xác nhận xoá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
