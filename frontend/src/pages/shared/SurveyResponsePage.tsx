import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { BarChart3, Clock, CheckCircle2, IndianRupee, Send, Users, AlertCircle } from "lucide-react";

interface Survey {
  id: number;
  title: string;
  service_type: string;
  description: string;
  deadline: string;
  status: string;
  finalized_price: number | null;
  my_suggestion: number | null;
  my_comment: string | null;
  total_responses: number;
}

export default function SurveyResponsePage() {
  const { token } = useAuth();
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [closedSurveys, setClosedSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "closed">("active");
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [messages, setMessages] = useState<Record<number, { text: string; ok: boolean }>>({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const [activeRes, closedRes] = await Promise.all([
        axios.get("http://localhost:5000/api/surveys/user/active", { headers }),
        axios.get("http://localhost:5000/api/surveys/user/closed", { headers }),
      ]);
      setActiveSurveys(activeRes.data.surveys);
      setClosedSurveys(closedRes.data.surveys);
    } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { fetchSurveys(); }, []);

  const handleSubmit = async (surveyId: number) => {
    const price = prices[surveyId];
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setMessages(m => ({ ...m, [surveyId]: { text: "Please enter a valid price.", ok: false } }));
      return;
    }

    setSubmitting(surveyId);
    try {
      await axios.post(`http://localhost:5000/api/surveys/${surveyId}/respond`, {
        suggested_price: parseFloat(price),
        comment: comments[surveyId] || ""
      }, { headers });
      setMessages(m => ({ ...m, [surveyId]: { text: "Your suggestion has been submitted!", ok: true } }));
      fetchSurveys();
    } catch (err: any) {
      setMessages(m => ({ ...m, [surveyId]: { text: err.response?.data?.message || "Failed to submit.", ok: false } }));
    }
    setSubmitting(null);
  };

  const daysLeft = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Pricing Surveys</h1>
        <p className="text-slate-500 text-sm mt-0.5">Share your price suggestions to help set fair rates in your community.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab("active")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${tab === "active" ? "bg-white border border-b-white border-slate-200 text-green-700 -mb-px" : "text-slate-500 hover:text-slate-700"}`}
        >
          <span className="flex items-center gap-2">
            <Clock size={14} />
            Active Surveys
            {activeSurveys.length > 0 && (
              <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full">{activeSurveys.length}</span>
            )}
          </span>
        </button>
        <button
          onClick={() => setTab("closed")}
          className={`px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${tab === "closed" ? "bg-white border border-b-white border-slate-200 text-green-700 -mb-px" : "text-slate-500 hover:text-slate-700"}`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            Completed Surveys
          </span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
              <div className="h-5 w-48 bg-slate-100 rounded mb-3" />
              <div className="h-4 w-64 bg-slate-100 rounded mb-4" />
              <div className="h-10 w-full bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : tab === "active" ? (
        activeSurveys.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">No active surveys</p>
            <p className="text-sm mt-1">When admin creates a pricing survey, it will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSurveys.map(survey => {
              const left = daysLeft(survey.deadline);
              const alreadySubmitted = !!survey.my_suggestion;
              return (
                <div key={survey.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  {/* Survey Meta */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-slate-800 text-lg">{survey.title}</h3>
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{survey.service_type}</span>
                        {alreadySubmitted && (
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> Submitted
                          </span>
                        )}
                      </div>
                      {survey.description && <p className="text-slate-500 text-sm">{survey.description}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Users size={12} />{survey.total_responses} response{survey.total_responses !== 1 ? "s" : ""}</span>
                        <span className={`flex items-center gap-1 font-semibold ${left <= 2 ? "text-red-500" : left <= 5 ? "text-yellow-600" : "text-slate-500"}`}>
                          <Clock size={12} />{left > 0 ? `${left} day${left !== 1 ? "s" : ""} left` : "Deadline today!"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* If already submitted — show current suggestion */}
                  {alreadySubmitted && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
                      <p className="text-blue-700 font-semibold">Your current suggestion: ₹{parseFloat(survey.my_suggestion!.toString()).toFixed(2)}/hour</p>
                      {survey.my_comment && <p className="text-blue-600 text-xs mt-0.5">"{survey.my_comment}"</p>}
                      <p className="text-blue-500 text-xs mt-1">You can update your suggestion below.</p>
                    </div>
                  )}

                  {/* Message */}
                  {messages[survey.id] && (
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${messages[survey.id].ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                      {messages[survey.id].ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {messages[survey.id].text}
                    </div>
                  )}

                  {/* Submit Form */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Your Suggested Price for {survey.service_type} (₹ per hour)
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          placeholder={alreadySubmitted ? `Current: ${parseFloat(survey.my_suggestion!.toString()).toFixed(2)}` : "e.g. 500"}
                          value={prices[survey.id] || ""}
                          onChange={e => setPrices(p => ({ ...p, [survey.id]: e.target.value }))}
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200"
                        />
                      </div>
                      <button
                        onClick={() => handleSubmit(survey.id)}
                        disabled={submitting === survey.id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 shrink-0"
                      >
                        <Send size={14} />
                        {submitting === survey.id ? "Submitting..." : alreadySubmitted ? "Update" : "Submit"}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Optional: Add a comment or reason for your suggestion..."
                      value={comments[survey.id] || ""}
                      onChange={e => setComments(c => ({ ...c, [survey.id]: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-500 text-slate-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Closed surveys */
        closedSurveys.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-40" />
            <p className="font-semibold">No completed surveys yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {closedSurveys.map(survey => (
              <div key={survey.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-800">{survey.title}</h3>
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{survey.service_type}</span>
                      <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">Closed</span>
                    </div>
                    <p className="text-slate-400 text-xs">{survey.total_responses} total response{survey.total_responses !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {survey.finalized_price && (
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
                      <p className="text-yellow-700 font-bold text-lg">₹{parseFloat(survey.finalized_price.toString()).toFixed(2)}</p>
                      <p className="text-yellow-600 text-xs">Admin's Final Price/hr</p>
                    </div>
                  )}
                  {survey.avg_price && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                      <p className="text-green-700 font-bold text-lg">₹{parseFloat((survey as any).avg_price.toString()).toFixed(2)}</p>
                      <p className="text-green-600 text-xs">Community Average/hr</p>
                    </div>
                  )}
                  {survey.my_suggestion && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                      <p className="text-blue-700 font-bold text-lg">₹{parseFloat(survey.my_suggestion.toString()).toFixed(2)}</p>
                      <p className="text-blue-600 text-xs">Your Suggestion/hr</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
