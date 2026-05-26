"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

interface MockUser {
  id: string;
  name: string;
  email: string;
  type: string;
  products: string[];
  status: "active" | "inactive";
  createdAt: string;
}

const mockUsers: MockUser[] = [
  {
    id: "U-001",
    name: "Nguyen Van An",
    email: "an.nv@example.com",
    type: "child",
    products: ["PTalk Assistant", "Kid Mentor"],
    status: "active",
    createdAt: "2026-05-01",
  },
  {
    id: "U-002",
    name: "Tran Thi Binh",
    email: "binh.tt@example.com",
    type: "elder",
    products: ["PTalk Assistant", "Elder Kare"],
    status: "active",
    createdAt: "2026-04-15",
  },
  {
    id: "U-003",
    name: "Le Van Cuong",
    email: "cuong.lv@example.com",
    type: "owner",
    products: ["PTalk Assistant"],
    status: "active",
    createdAt: "2026-03-20",
  },
  {
    id: "U-004",
    name: "Pham Thi Dung",
    email: "dung.pt@example.com",
    type: "child",
    products: ["Kid Mentor"],
    status: "inactive",
    createdAt: "2026-05-10",
  },
  {
    id: "U-005",
    name: "Hoang Van Em",
    email: "em.hv@example.com",
    type: "elder",
    products: ["Elder Kare"],
    status: "active",
    createdAt: "2026-04-28",
  },
  {
    id: "U-006",
    name: "Vo Thi Phuong",
    email: "phuong.vt@example.com",
    type: "owner",
    products: ["PTalk Assistant"],
    status: "active",
    createdAt: "2026-02-14",
  },
  {
    id: "U-007",
    name: "Dao Van Giang",
    email: "giang.dv@example.com",
    type: "child",
    products: ["PTalk Assistant", "Kid Mentor"],
    status: "active",
    createdAt: "2026-05-20",
  },
  {
    id: "U-008",
    name: "Bui Thi Hang",
    email: "hang.bt@example.com",
    type: "elder",
    products: ["PTalk Assistant", "Elder Kare"],
    status: "inactive",
    createdAt: "2026-01-10",
  },
];

const typeLabels: Record<string, string> = {
  child: "Trẻ em",
  elder: "Người cao tuổi",
  owner: "Account Owner",
  dashboard: "Dashboard",
};

const typeColors: Record<string, string> = {
  child: "bg-blue-100 text-blue-700",
  elder: "bg-purple-100 text-purple-700",
  owner: "bg-amber-100 text-amber-700",
  dashboard: "bg-gray-100 text-gray-700",
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = mockUsers.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || u.type === filterType;
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Quản lý User
          </h1>
          <p className="text-muted text-sm mt-1">
            Danh sách user toàn hệ sinh thái ({mockUsers.length} users)
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50 transition-colors">
            <Upload size={16} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors">
            <Plus size={16} />
            <span className="hidden sm:inline">Thêm User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card-bg rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none"
              >
                <option value="all">Tất cả loại</option>
                <option value="child">Trẻ em</option>
                <option value="elder">Người cao tuổi</option>
                <option value="owner">Account Owner</option>
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card-bg rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left font-medium text-muted px-4 py-3">
                  ID
                </th>
                <th className="text-left font-medium text-muted px-4 py-3">
                  Họ tên
                </th>
                <th className="text-left font-medium text-muted px-4 py-3 hidden md:table-cell">
                  Email
                </th>
                <th className="text-left font-medium text-muted px-4 py-3">
                  Loại
                </th>
                <th className="text-left font-medium text-muted px-4 py-3 hidden lg:table-cell">
                  Sản phẩm
                </th>
                <th className="text-left font-medium text-muted px-4 py-3">
                  Trạng thái
                </th>
                <th className="text-left font-medium text-muted px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {user.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-muted hidden md:table-cell">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        typeColors[user.type]
                      )}
                    >
                      {typeLabels[user.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {user.products.map((p) => (
                        <span
                          key={p}
                          className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-muted"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        user.status === "active"
                          ? "text-success"
                          : "text-muted"
                      )}
                    >
                      <span
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          user.status === "active"
                            ? "bg-success"
                            : "bg-gray-300"
                        )}
                      />
                      {user.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                      <MoreHorizontal size={16} className="text-muted" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted"
                  >
                    Không tìm thấy user nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted">
            Hiển thị {filtered.length} / {mockUsers.length} users
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="p-1.5 rounded border border-border disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 text-xs font-medium bg-accent text-white rounded">
              1
            </span>
            <button
              disabled
              className="p-1.5 rounded border border-border disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
