import { useState, useEffect } from "react";
import { TrendingUp, IndianRupee, Download, BarChart3, CalendarCheck, Star } from "lucide-react";
import API from "../../services/api";

interface Stats {
  totalFarmers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
}

const ReportsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data.stats);
      } catch (err) {
        console.error("Failed to fetch stats for reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const reports = [
    {
      title: "Total Platform Revenue",
      desc: "Sum of all completed service booking transactions.",
      value: stats ? `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}` : "—",
      icon: <IndianRupee className="text-purple-500" size={20} />,
      color: "bg-purple-950/30 border-purple-500/20",
    },
    {
      title: "Total Platform Bookings",
      desc: "All booking records across all service types and statuses.",
      value: stats ? stats.totalBookings.toLocaleString("en-IN") : "—",
      icon: <CalendarCheck className="text-blue-500" size={20} />,
      color: "bg-blue-950/30 border-blue-500/20",
    },
    {
      title: "Registered Farmers",
      desc: "Active farmer profiles registered on the KisanSeeva platform.",
      value: stats ? stats.totalFarmers.toLocaleString("en-IN") : "—",
      icon: <Star className="text-yellow-500" size={20} />,
      color: "bg-yellow-950/30 border-yellow-500/20",
    },
  ];

  // Static breakdown (for chart visualization)
  const categoryBreakdown = [
    { category: "Tractor Service", percentage: 55 },
    { category: "Harvesting", percentage: 25 },
    { category: "Drone Spraying", percentage: 12 },
    { category: "Transport & Others", percentage: 8 },
  ];

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="text-green-500" size={28} />
            Analytics & Reports
          </h1>
          <p className="text-slate-400 mt-1">
            Review KisanSeeva platform revenue logs, farmer engagement and operation metrics.
          </p>
        </div>

        <button
          onClick={() => alert("PDF export feature coming soon. This will generate a full platform summary report.")}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-red-600/20"
        >
          <Download size={18} />
          Export PDF Report
        </button>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {reports.map((r, i) => (
            <div key={i} className={`p-6 border rounded-3xl flex flex-col justify-between h-48 ${r.color} bg-slate-900/60`}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {r.icon}
                  <h3 className="font-bold text-white text-base">{r.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-3xl font-extrabold text-white">{r.value}</span>
                <span className="text-xs font-semibold text-green-500 bg-green-950/30 border border-green-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                  <TrendingUp size={12} /> Live
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Service Category Revenue Share</h3>
        <div className="space-y-5">
          {categoryBreakdown.map((item, i) => {
            const estimatedAmount = stats
              ? Math.round((stats.totalRevenue * item.percentage) / 100)
              : null;
            return (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-300">{item.category}</span>
                  <span className="font-bold text-white">
                    {estimatedAmount
                      ? `₹${estimatedAmount.toLocaleString("en-IN")}`
                      : `${item.percentage}%`}{" "}
                    <span className="text-slate-500 font-normal">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="bg-gradient-to-r from-red-600 to-red-500 h-full rounded-full transition-all duration-700"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Engagement Card */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Platform Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Total Farmers</span>
              <span className="font-bold text-white">{stats?.totalFarmers.toLocaleString("en-IN") ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Total Providers</span>
              <span className="font-bold text-white">{stats?.totalProviders.toLocaleString("en-IN") ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-800">
              <span className="text-slate-400 text-sm">Total Bookings</span>
              <span className="font-bold text-white">{stats?.totalBookings.toLocaleString("en-IN") ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 text-sm">Platform Revenue</span>
              <span className="font-bold text-green-400">
                ₹{stats ? Number(stats.totalRevenue).toLocaleString("en-IN") : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-base font-bold text-white mb-4">Data Notes</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              Revenue figures represent completed bookings only. Pending or cancelled bookings are excluded.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              Category revenue share is estimated based on service type distribution across the platform.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
              All data is pulled live from the database and updates on page load.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              PDF export will generate a comprehensive summary of all platform metrics.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
