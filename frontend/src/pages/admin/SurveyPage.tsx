import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { PlusCircle, BarChart3, Clock, CheckCircle2, X, ChevronDown, ChevronUp, IndianRupee, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Survey {
  id: number;
  title: string;
  service_type: string;
  description: string;
  deadline: string;
  status: "open" | "closed";
  finalized_price: number | null;
  response_count: number;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  created_by_name: string;
  created_at: string;
}

interface SurveyDetail {
  survey: Survey;
  responses: { id: number; user_name: string; user_role: string; suggested_price: number; comment: string; created_at: string }[];
  stats: { total: number; avg_price: number; min_price: number; max_price: number; median_price: number };
}

const SERVICE_TYPES = ["Tractor", "Harvester", "Seeder", "Sprayer", "Thresher", "Rotavator", "Plough", "Other"];

export default function SurveyPage() {
  const { token } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SurveyDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [finalizePrice, setFinalizePrice] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Create form state
  const [form, setForm] = useState({ title: "", service_type: "Tractor", description: "", deadline: "" });
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/surveys", { headers });
      setSurveys(res.data.surveys);
    } catch { /* empty */ }
    setLoading(false);
  };

  const fetchDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/surveys/${id}`, { headers });
      setDetail(res.data);
    } catch { /* empty */ }
    setDetailLoading(false);
  };

  useEffect(() => { fetchSurveys(); }, []);

  const handleToggleExpand = (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
    } else {
      setExpandedId(id);
      setDetail(null);
      fetchDetail(id);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await axios.post("http://localhost:5000/api/surveys", form, { headers });
      setShowCreate(false);
      setForm({ title: "", service_type: "Tractor", description: "", deadline: "" });
      fetchSurveys();
      setActionMsg("✅ Survey created! Notifications sent to all users.");
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err: any) {
      setActionMsg("❌ " + (err.response?.data?.message || "Failed to create survey."));
    }
    setCreating(false);
  };

  const handleFinalize = async (id: number) => {
    if (!finalizePrice || isNaN(parseFloat(finalizePrice))) return;
    try {
      await axios.put(`http://localhost:5000/api/surveys/${id}/finalize`, { finalized_price: finalizePrice }, { headers });
      setFinalizePrice("");
      fetchSurveys();
      fetchDetail(id);
      setActionMsg("✅ Survey finalized! All users notified of the recommended price.");
      setTimeout(() => setActionMsg(""), 4000);
    } catch (err: any) {
      setActionMsg("❌ " + (err.response?.data?.message || "Failed to finalize."));
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeadline = tomorrow.toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Pricing Surveys</h1>
          <p className="text-slate-400 text-sm mt-0.5">Collect price suggestions from farmers & providers and set fair rates.</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-green-600/20"
        >
          <PlusCircle size={18} />
          Create Survey
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${actionMsg.startsWith("✅") ? "bg-green-900/40 text-green-300 border border-green-700/40" : "bg-red-900/40 text-red-300 border border-red-700/40"}`}>
          {actionMsg}
        </div>
      )}

      {/* Create Survey Form */}
      {showCreate && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">New Pricing Survey</h2>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-1">Survey Title</label>
              <input
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:border-green-500"
                placeholder="e.g. Tractor Rate Survey Q3 2026"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Service Type</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:border-green-500"
                value={form.service_type}
                onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}
              >
                {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Deadline</label>
              <input
                type="date"
                min={minDeadline}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:border-green-500"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-1">Description (optional)</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:border-green-500 resize-none"
                placeholder="Provide context for the users about why you need this survey..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 border border-slate-600 text-slate-300 rounded-xl text-sm hover:bg-slate-700 transition">Cancel</button>
              <button type="submit" disabled={creating} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60">
                {creating ? "Creating..." : "Create & Notify Users"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Surveys List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800 rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-48 bg-slate-700 rounded mb-2" />
              <div className="h-4 w-64 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-40" />
          <p className="font-semibold">No surveys yet</p>
          <p className="text-sm mt-1">Create your first pricing survey to collect community input.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(survey => (
            <div key={survey.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
              {/* Survey Header Row */}
              <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-750" onClick={() => handleToggleExpand(survey.id)}>
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${survey.status === "open" ? "bg-green-900/50 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                    {survey.status === "open" ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{survey.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${survey.status === "open" ? "bg-green-900/50 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                        {survey.status === "open" ? "OPEN" : "CLOSED"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 font-semibold">{survey.service_type}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {survey.response_count} response{survey.response_count !== 1 ? "s" : ""} • Deadline: {new Date(survey.deadline).toLocaleDateString("en-IN")}
                      {survey.avg_price && <span className="ml-2 text-green-400 font-semibold">• Avg ₹{parseFloat(survey.avg_price.toString()).toFixed(2)}/hr</span>}
                      {survey.finalized_price && <span className="ml-2 text-yellow-400 font-semibold">• Finalized: ₹{parseFloat(survey.finalized_price.toString()).toFixed(2)}/hr</span>}
                    </p>
                  </div>
                </div>
                <div className="text-slate-400">{expandedId === survey.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
              </div>

              {/* Expanded Detail Panel */}
              {expandedId === survey.id && (
                <div className="border-t border-slate-700 p-5 space-y-5">
                  {detailLoading ? (
                    <div className="py-8 text-center text-slate-400 animate-pulse">Loading responses...</div>
                  ) : detail ? (
                    <>
                      {/* Stats Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Responses", value: detail.stats.total, icon: Users, color: "text-blue-400" },
                          { label: "Avg Price/hr", value: detail.stats.avg_price ? `₹${parseFloat(detail.stats.avg_price.toString()).toFixed(2)}` : "—", icon: IndianRupee, color: "text-green-400" },
                          { label: "Min Price/hr", value: detail.stats.min_price ? `₹${parseFloat(detail.stats.min_price.toString()).toFixed(2)}` : "—", icon: TrendingDown, color: "text-red-400" },
                          { label: "Max Price/hr", value: detail.stats.max_price ? `₹${parseFloat(detail.stats.max_price.toString()).toFixed(2)}` : "—", icon: TrendingUp, color: "text-yellow-400" },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-900 rounded-xl p-3 text-center">
                            <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                            <p className="text-lg font-bold text-white">{s.value}</p>
                            <p className="text-xs text-slate-400">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Finalize (if open) */}
                      {survey.status === "open" && (
                        <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-700">
                          <IndianRupee size={18} className="text-yellow-400 shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Finalize & Set Recommended Price</p>
                            <p className="text-xs text-slate-400 mt-0.5">This will close the survey and notify all users with the final rate.</p>
                          </div>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder={detail.stats.avg_price ? `Avg: ${parseFloat(detail.stats.avg_price.toString()).toFixed(2)}` : "₹ per hour"}
                            value={finalizePrice}
                            onChange={e => setFinalizePrice(e.target.value)}
                            className="w-36 px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded-xl text-sm focus:outline-none focus:border-yellow-500"
                          />
                          <button
                            onClick={() => handleFinalize(survey.id)}
                            disabled={!finalizePrice}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 shrink-0"
                          >
                            Finalize
                          </button>
                        </div>
                      )}

                      {survey.finalized_price && (
                        <div className="flex items-center gap-3 p-4 bg-green-900/20 rounded-xl border border-green-700/40">
                          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                          <p className="text-sm text-green-300 font-semibold">
                            Final Recommended Price: ₹{parseFloat(survey.finalized_price.toString()).toFixed(2)}/hour for {survey.service_type}
                          </p>
                        </div>
                      )}

                      {/* Responses Table */}
                      {detail.responses.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-bold text-slate-300 mb-3">Individual Responses ({detail.responses.length})</h4>
                          <div className="overflow-x-auto rounded-xl border border-slate-700">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-900">
                                <tr>
                                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">User</th>
                                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">Role</th>
                                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">Suggested Price/hr</th>
                                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">Comment</th>
                                  <th className="text-left px-4 py-3 text-slate-400 font-semibold">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.responses.map((r, i) => (
                                  <tr key={r.id} className={`border-t border-slate-700 ${i % 2 === 0 ? "bg-slate-800" : "bg-slate-800/50"}`}>
                                    <td className="px-4 py-3 text-white font-medium">{r.user_name}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${r.user_role === "farmer" ? "bg-green-900/50 text-green-400" : "bg-blue-900/50 text-blue-400"}`}>
                                        {r.user_role}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-yellow-400 font-bold">₹{parseFloat(r.suggested_price.toString()).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-slate-300 max-w-xs truncate">{r.comment || <span className="text-slate-500 italic">No comment</span>}</td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-500 text-sm">No responses yet for this survey.</div>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
