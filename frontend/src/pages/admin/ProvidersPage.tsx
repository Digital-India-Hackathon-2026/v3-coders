import { useState, useEffect, useCallback } from "react";
import { Check, ShieldAlert, ShieldCheck, Phone, MapPin, RefreshCw, Tractor, Search } from "lucide-react";
import API from "../../services/api";

interface Provider {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  extra_info: Record<string, any> | null;
  status: string;
  created_at: string;
}

const ProvidersPage = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/admin/users", { params: { role: "provider" } });
      setProviders(res.data.users);
    } catch (err: any) {
      console.error("Fetch providers error:", err);
      setError("Failed to load service providers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleToggleStatus = async (provider: Provider) => {
    const newStatus = provider.status === "active" ? "suspended" : "active";
    setTogglingId(provider.id);
    try {
      await API.put(`/admin/users/${provider.id}/status`, { status: newStatus });
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, status: newStatus } : p))
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to update provider status.";
      alert(`Error: ${msg}`);
    } finally {
      setTogglingId(null);
    }
  };

  const getBusinessName = (p: Provider) => p.extra_info?.business_name || p.name;
  const getLocation = (p: Provider) => p.extra_info?.location || p.extra_info?.village || "—";
  const getServices = (p: Provider) => p.extra_info?.services_offered || "—";

  const filteredProviders = providers.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      getBusinessName(p).toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      getLocation(p).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Tractor className="text-orange-500" size={28} />
            Manage Service Providers
          </h1>
          <p className="text-slate-400 mt-1">
            Review provider registrations, business details and manage account statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-4 top-3 text-slate-500" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search providers..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition text-sm"
            />
          </div>
          <button
            onClick={fetchProviders}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Providers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex justify-center items-center h-52">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Tractor size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No service providers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 font-semibold text-sm border-b border-slate-800">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Business / Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Base Location</th>
                  <th className="px-6 py-4">Services Offered</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredProviders.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{p.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-white">{getBusinessName(p)}</p>
                      <p className="text-xs text-slate-500">{p.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-slate-500" />
                        {p.phone || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-500" />
                        {getLocation(p)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{getServices(p)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${
                        p.status === "active"
                          ? "bg-green-950/40 text-green-500 border-green-500/20"
                          : "bg-red-950/40 text-red-500 border-red-500/20"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        disabled={togglingId === p.id}
                        title={p.status === "active" ? "Suspend Provider" : "Reactivate Provider"}
                        className={`p-2 rounded-xl transition disabled:opacity-50 ${
                          p.status === "active"
                            ? "bg-red-950/30 hover:bg-red-950/60 text-red-500 border border-red-500/20"
                            : "bg-green-950/30 hover:bg-green-950/60 text-green-500 border border-green-500/20"
                        }`}
                      >
                        {togglingId === p.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b border-current" />
                        ) : p.status === "active" ? (
                          <ShieldAlert size={16} />
                        ) : (
                          <ShieldCheck size={16} />
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

      {!loading && (
        <p className="text-xs text-slate-600 text-right">
          Showing {filteredProviders.length} of {providers.length} providers
        </p>
      )}
    </div>
  );
};

export default ProvidersPage;
