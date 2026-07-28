import { useState, useEffect } from "react";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, MessageSquare,
  ChevronDown, ChevronUp, Loader2, RefreshCw, Search, Filter, Send
} from "lucide-react";
import API from "../../services/api";

interface Complaint {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_role: string;
  category: string;
  subject: string;
  description: string;
  booking_ref: number | null;
  service_name: string | null;
  status: "open" | "in_review" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface Stats {
  open_count: number;
  in_review_count: number;
  resolved_count: number;
  closed_count: number;
  urgent_count: number;
  total_count: number;
}

const CATEGORIES = ["payment", "service_quality", "driver_behavior", "booking", "app_issue", "other"];
const STATUS_OPTIONS = ["open", "in_review", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];

const priorityBadge: Record<string, string> = {
  low: "bg-slate-700/40 text-slate-300",
  normal: "bg-blue-900/40 text-blue-300",
  high: "bg-orange-900/40 text-orange-300",
  urgent: "bg-red-900/40 text-red-400 animate-pulse",
};

const statusBadge: Record<string, string> = {
  open: "bg-amber-900/40 text-amber-300",
  in_review: "bg-blue-900/40 text-blue-300",
  resolved: "bg-green-900/40 text-green-400",
  closed: "bg-slate-700/40 text-slate-400",
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Update state per complaint
  const [updating, setUpdating] = useState<number | null>(null);
  const [responseText, setResponseText] = useState<Record<number, string>>({});
  const [newStatus, setNewStatus] = useState<Record<number, string>>({});
  const [newPriority, setNewPriority] = useState<Record<number, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterPriority) params.append("priority", filterPriority);

      const [complaintsRes, statsRes] = await Promise.all([
        API.get(`/complaints?${params.toString()}`),
        API.get("/complaints/stats"),
      ]);
      setComplaints(complaintsRes.data.complaints);
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPriority]);

  const handleUpdate = async (id: number) => {
    setUpdating(id);
    try {
      await API.put(`/complaints/${id}`, {
        status: newStatus[id] || undefined,
        priority: newPriority[id] || undefined,
        admin_response: responseText[id] !== undefined ? responseText[id] : undefined,
      });
      setExpandedId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update complaint.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = complaints.filter((c) =>
    search === "" ||
    c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.user_name.toLowerCase().includes(search.toLowerCase()) ||
    String(c.id).includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-400" size={24} />
            Complaints Management
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Review, prioritize, and resolve farmer & provider grievances.</p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition border border-slate-700"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total", value: stats.total_count, color: "border-slate-700 text-white" },
            { label: "Open", value: stats.open_count, color: "border-amber-500/30 text-amber-300" },
            { label: "In Review", value: stats.in_review_count, color: "border-blue-500/30 text-blue-300" },
            { label: "Resolved", value: stats.resolved_count, color: "border-green-500/30 text-green-400" },
            { label: "Closed", value: stats.closed_count, color: "border-slate-600 text-slate-400" },
            { label: "🚨 Urgent", value: stats.urgent_count, color: "border-red-500/30 text-red-400" },
          ].map((s) => (
            <div key={s.label} className={`bg-slate-900 border rounded-2xl p-4 text-center ${s.color}`}>
              <p className={`text-2xl font-extrabold ${s.color.split(" ")[1]}`}>{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by ID, subject, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-sm focus:outline-none focus:border-orange-500"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
          ))}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-xl text-sm focus:outline-none focus:border-orange-500"
        >
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20 text-slate-500">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center">
          <p className="text-slate-400 font-semibold">No complaints found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-800/50 transition"
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
              >
                {/* Priority dot */}
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  c.priority === "urgent" ? "bg-red-500 shadow-[0_0_6px_#ef4444]" :
                  c.priority === "high" ? "bg-orange-400" :
                  c.priority === "normal" ? "bg-blue-400" : "bg-slate-600"
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">#{c.id}</span>
                    <span className="font-bold text-white truncate">{c.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-slate-500">
                    <span className="capitalize">{c.user_role}</span>
                    <span>·</span>
                    <span>{c.user_name}</span>
                    <span>·</span>
                    <span className="capitalize">{c.category.replace("_", " ")}</span>
                    {c.booking_ref && <><span>·</span><span>Booking KS-{c.booking_ref}</span></>}
                    <span>·</span>
                    <span>{new Date(c.created_at).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase ${priorityBadge[c.priority]}`}>
                    {c.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase ${statusBadge[c.status]}`}>
                    {c.status.replace("_", " ")}
                  </span>
                  {c.admin_response && <span title="Admin responded"><MessageSquare size={14} className="text-blue-400" /></span>}
                  {expandedId === c.id ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </div>
              </div>

              {/* Expanded */}
              {expandedId === c.id && (
                <div className="border-t border-slate-800 px-5 pb-5 pt-4 space-y-5">
                  {/* User info */}
                  <div className="grid sm:grid-cols-3 gap-3 text-xs bg-slate-800/50 rounded-xl p-4">
                    <div><span className="text-slate-500">Name:</span> <span className="text-white font-semibold">{c.user_name}</span></div>
                    <div><span className="text-slate-500">Email:</span> <span className="text-white font-semibold">{c.user_email}</span></div>
                    <div><span className="text-slate-500">Phone:</span> <span className="text-white font-semibold">{c.user_phone || "—"}</span></div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">User's Description</p>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800/40 rounded-xl p-4">{c.description}</p>
                  </div>

                  {/* Existing admin response */}
                  {c.admin_response && (
                    <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl p-4">
                      <p className="text-xs font-bold text-blue-400 mb-1">Previous Admin Response:</p>
                      <p className="text-sm text-slate-300">{c.admin_response}</p>
                    </div>
                  )}

                  {/* Admin actions */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Update Status</label>
                      <select
                        defaultValue={c.status}
                        onChange={(e) => setNewStatus({ ...newStatus, [c.id]: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ").toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Set Priority</label>
                      <select
                        defaultValue={c.priority}
                        onChange={(e) => setNewPriority({ ...newPriority, [c.id]: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>{p.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Response to User <span className="text-slate-600 font-normal">(optional — user will be notified)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write a response or resolution note for the user..."
                      defaultValue={c.admin_response || ""}
                      onChange={(e) => setResponseText({ ...responseText, [c.id]: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:border-orange-500 resize-none transition"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setExpandedId(null)}
                      className="px-5 py-2.5 border border-slate-700 text-slate-400 hover:bg-slate-800 rounded-xl text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(c.id)}
                      disabled={updating === c.id}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition"
                    >
                      {updating === c.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {updating === c.id ? "Saving..." : "Save & Notify"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
