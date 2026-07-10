import { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Tractor, User, MapPin, RefreshCw, BookOpen } from "lucide-react";
import API from "../../services/api";

interface Booking {
  id: number;
  farmer_name: string;
  farmer_email: string;
  service_name: string;
  service_type: string;
  provider_name: string;
  booking_date: string;
  total_price: number;
  status: string;
  location: string;
  created_at: string;
}

const STATUS_OPTIONS = ["all", "pending", "confirmed", "completed", "cancelled"];

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get("/admin/bookings");
      setBookings(res.data.bookings);
    } catch (err: any) {
      console.error("Fetch bookings error:", err);
      setError("Failed to load bookings from the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filtered = bookings.filter((b) => {
    const matchesFilter = filter === "all" ? true : b.status === filter;
    const term = search.toLowerCase();
    const matchesSearch =
      `ks-${b.id}`.includes(term) ||
      b.farmer_name.toLowerCase().includes(term) ||
      b.provider_name.toLowerCase().includes(term) ||
      b.service_name.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  const statusCounts = STATUS_OPTIONS.slice(1).reduce((acc, s) => {
    acc[s] = bookings.filter((b) => b.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-950/40 text-green-500 border-green-500/20";
      case "confirmed": return "bg-blue-950/40 text-blue-400 border-blue-500/20";
      case "cancelled": return "bg-red-950/40 text-red-500 border-red-500/20";
      default: return "bg-yellow-950/40 text-yellow-500 border-yellow-500/20";
    }
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-blue-500" size={28} />
            System Bookings
          </h1>
          <p className="text-slate-400 mt-1">
            Complete platform log of all bookings, transactions and service statuses.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-600 transition text-sm font-semibold"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Status Summary Chips */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold border transition ${
                filter === s
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <span className="capitalize">{s === "all" ? "All Bookings" : s}</span>
              {s !== "all" && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === s ? "bg-white/20" : "bg-slate-800"}`}>
                  {statusCounts[s] || 0}
                </span>
              )}
              {s === "all" && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === s ? "bg-white/20" : "bg-slate-800"}`}>
                  {bookings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, Farmer, Provider or Service..."
          className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 text-red-400 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex justify-center items-center h-52">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No bookings found for selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-400 font-semibold text-sm border-b border-slate-800">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Farmer</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Scheduled Date</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-bold text-white font-mono text-sm">KS-{b.id}</td>
                    <td className="px-6 py-4 font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <Tractor size={14} className="text-slate-500 shrink-0" />
                        {b.service_name}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">{b.service_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5">
                        <User size={14} className="text-slate-500 shrink-0" />
                        <span>
                          <p className="font-semibold text-white">{b.farmer_name}</p>
                          <p className="text-xs text-slate-500">{b.farmer_email}</p>
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">{b.provider_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        {formatDate(b.booking_date)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-slate-500" />
                        {b.location || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      ₹{b.total_price ? Number(b.total_price).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle(b.status)}`}>
                        <span className="capitalize">{b.status}</span>
                      </span>
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
          Showing {filtered.length} of {bookings.length} bookings
        </p>
      )}
    </div>
  );
};

export default BookingsPage;
