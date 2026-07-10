import { useState, useEffect, useCallback } from "react";
import { Search, UserCheck, UserX, MapPin, Phone, RefreshCw, Users } from "lucide-react";
import API from "../../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  extra_info: Record<string, any> | null;
  status: string;
  created_at: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"farmer" | "provider" | "all">("farmer");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = roleFilter !== "all" ? { role: roleFilter } : {};
      const res = await API.get("/admin/users", { params });
      setUsers(res.data.users);
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setError("Failed to load users. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "suspended" : "active";
    setTogglingId(user.id);
    try {
      await API.put(`/admin/users/${user.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update user status.";
      alert(`Error: ${msg}`);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  });

  const getLocation = (user: User) => {
    if (user.extra_info?.village) return user.extra_info.village;
    if (user.extra_info?.location) return user.extra_info.location;
    return "—";
  };

  const getDetail = (user: User) => {
    if (user.role === "farmer" && user.extra_info?.land_size) {
      return `${user.extra_info.land_size} Acres`;
    }
    if (user.role === "provider" && user.extra_info?.business_name) {
      return user.extra_info.business_name;
    }
    return "—";
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="text-red-500" size={28} />
            Manage Users
          </h1>
          <p className="text-slate-400 mt-1">
            View and manage registered farmers and service providers. Suspend or reactivate accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Role Filter */}
          <div className="flex gap-1 bg-slate-900 p-1 border border-slate-800 rounded-2xl">
            {(["farmer", "provider", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                  roleFilter === r
                    ? "bg-red-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {r === "all" ? "All Users" : r === "farmer" ? "Farmers" : "Providers"}
              </button>
            ))}
          </div>

          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex justify-center items-center h-52">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 font-semibold text-sm border-b border-slate-800">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{u.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                        u.role === "farmer"
                          ? "bg-blue-950/40 text-blue-400 border-blue-500/20"
                          : "bg-orange-950/40 text-orange-400 border-orange-500/20"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-500" />
                        {u.phone || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-500" />
                        {getLocation(u)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">{getDetail(u)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        u.status === "active"
                          ? "bg-green-950/40 text-green-500 border-green-500/20"
                          : "bg-red-950/40 text-red-500 border-red-500/20"
                      }`}>
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={togglingId === u.id}
                        title={u.status === "active" ? "Suspend User" : "Reactivate User"}
                        className={`p-2 rounded-xl transition disabled:opacity-50 ${
                          u.status === "active"
                            ? "bg-red-950/30 hover:bg-red-950/60 text-red-500 border border-red-500/20"
                            : "bg-green-950/30 hover:bg-green-950/60 text-green-500 border border-green-500/20"
                        }`}
                      >
                        {togglingId === u.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b border-current" />
                        ) : u.status === "active" ? (
                          <UserX size={16} />
                        ) : (
                          <UserCheck size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-slate-600 text-right">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      )}
    </div>
  );
};

export default UsersPage;
