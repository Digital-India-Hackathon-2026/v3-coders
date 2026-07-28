import { useState, useEffect } from "react";
import { AlertTriangle, Send, Clock, CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronUp, Loader2, PlusCircle, RefreshCw } from "lucide-react";
import { KSCard, KSButton, KSBadge } from "../../components/ui";
import API from "../../services/api";

interface Complaint {
  id: number;
  category: string;
  subject: string;
  description: string;
  booking_id: number | null;
  booking_ref: number | null;
  service_name: string | null;
  status: "open" | "in_review" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
}

const CATEGORIES = [
  { value: "payment", label: "💰 Payment Issue" },
  { value: "service_quality", label: "🔧 Service Quality" },
  { value: "driver_behavior", label: "🚜 Driver / Provider Behavior" },
  { value: "booking", label: "📅 Booking Problem" },
  { value: "app_issue", label: "📱 App / Technical Issue" },
  { value: "other", label: "❓ Other" },
];

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" }> = {
  open: { label: "Open", variant: "warning" },
  in_review: { label: "In Review", variant: "info" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "danger" },
};

const priorityColors: Record<string, string> = {
  low: "text-slate-400",
  normal: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export default function ComplaintPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [form, setForm] = useState({
    category: "payment",
    subject: "",
    description: "",
    booking_id: "",
  });

  const fetchComplaints = async () => {
    try {
      const res = await API.get("/complaints/my");
      setComplaints(res.data.complaints);
    } catch (err) {
      console.error("Failed to fetch complaints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.description.trim().length < 20) {
      setErrorMsg("Please describe your issue in at least 20 characters.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await API.post("/complaints", {
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        booking_id: form.booking_id ? parseInt(form.booking_id) : null,
      });
      setSuccessMsg("✅ Complaint submitted! Our team will review it shortly.");
      setForm({ category: "payment", subject: "", description: "", booking_id: "" });
      setShowForm(false);
      fetchComplaints();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to submit complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCount = complaints.filter((c) => c.status === "open" || c.status === "in_review").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={30} />
            Complaints & Grievances
          </h1>
          <p className="text-slate-500 mt-1">
            Raise an issue and our team will respond within 24–48 hours.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setLoading(true); fetchComplaints(); }}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 border border-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setErrorMsg(""); }}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition"
          >
            <PlusCircle size={18} />
            {showForm ? "Cancel" : "Raise Complaint"}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Filed", value: complaints.length, color: "bg-slate-50 border-slate-200", text: "text-slate-700" },
          { label: "Open / In Review", value: openCount, color: "bg-orange-50 border-orange-100", text: "text-orange-600" },
          { label: "Resolved", value: complaints.filter(c => c.status === "resolved").length, color: "bg-green-50 border-green-100", text: "text-green-700" },
          { label: "Closed", value: complaints.filter(c => c.status === "closed").length, color: "bg-slate-50 border-slate-200", text: "text-slate-500" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-extrabold ${s.text}`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Success / Error Banner */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-3.5 rounded-2xl font-semibold text-sm">
          {successMsg}
        </div>
      )}

      {/* Complaint Form */}
      {showForm && (
        <KSCard className="border-orange-200 bg-orange-50/30">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Send size={20} className="text-orange-500" />
            New Complaint
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 bg-white transition"
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Related Booking ID <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 42"
                  value={form.booking_id}
                  onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Brief title of your complaint..."
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                maxLength={200}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Describe your issue <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                placeholder="Please describe your issue in detail — what happened, when it happened, and how it affected you. Minimum 20 characters."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition resize-none"
                required
              />
              <p className={`text-xs mt-1 ${form.description.length < 20 ? "text-red-400" : "text-slate-400"}`}>
                {form.description.length} / 20 characters minimum
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-4 pt-1">
              <KSButton
                type="button"
                variant="outline"
                className="w-1/2 justify-center"
                onClick={() => { setShowForm(false); setErrorMsg(""); }}
              >
                Cancel
              </KSButton>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl transition flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        </KSCard>
      )}

      {/* Complaints List */}
      <div>
        <h3 className="text-base font-bold text-slate-700 mb-4">Your Complaints</h3>
        {loading ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-500 font-semibold">No complaints filed yet.</p>
            <p className="text-slate-400 text-sm mt-1">If you face any issue, use the "Raise Complaint" button above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* Header row */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition"
                  onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl ${
                      c.status === "resolved" ? "bg-green-100" :
                      c.status === "in_review" ? "bg-blue-100" :
                      c.status === "closed" ? "bg-slate-100" :
                      "bg-orange-100"
                    }`}>
                      {c.status === "resolved" ? <CheckCircle2 size={20} className="text-green-600" /> :
                       c.status === "closed" ? <XCircle size={20} className="text-slate-500" /> :
                       c.status === "in_review" ? <Clock size={20} className="text-blue-600" /> :
                       <AlertTriangle size={20} className="text-orange-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{c.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400">
                          #{c.id} · {CATEGORIES.find(cat => cat.value === c.category)?.label || c.category}
                        </span>
                        {c.booking_ref && (
                          <span className="text-xs text-blue-500 font-medium">· Booking KS-{c.booking_ref}</span>
                        )}
                        <span className={`text-xs font-semibold ${priorityColors[c.priority]}`}>
                          · {c.priority.toUpperCase()} priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <KSBadge variant={statusConfig[c.status].variant}>
                      {statusConfig[c.status].label}
                    </KSBadge>
                    {expandedId === c.id ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === c.id && (
                  <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Your Description</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>Filed: {new Date(c.created_at).toLocaleString("en-IN")}</span>
                      {c.resolved_at && <span>· Resolved: {new Date(c.resolved_at).toLocaleString("en-IN")}</span>}
                    </div>
                    {c.admin_response ? (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <p className="text-xs font-bold text-blue-600 flex items-center gap-1.5 mb-1">
                          <MessageSquare size={13} /> Admin Response
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">{c.admin_response}</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-400 flex items-center gap-2">
                        <Clock size={15} />
                        Awaiting admin review. You will be notified when there's a response.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
