import { useState, useEffect } from "react";
import { Users, Tractor, CalendarCheck, IndianRupee, Bell, AlertTriangle } from "lucide-react";
import { KSCard, KSBadge } from "../../components/ui";
import API from "../../services/api";

interface Stats {
  totalFarmers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
}

interface RecentBooking {
  id: number;
  farmer_name: string;
  service_name: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalFarmers: 0,
    totalProviders: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data.stats);
        setRecentBookings(res.data.recentBookings);
      } catch (err: any) {
        console.error("Error loading admin stats", err);
        setError("Failed to fetch system overview analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const statsCards = [
    { title: "Total Farmers Registered", value: stats.totalFarmers.toLocaleString("en-IN"), icon: <Users className="text-blue-500" size={24} />, bg: "bg-blue-950/40 border border-blue-500/20" },
    { title: "Active Service Providers", value: stats.totalProviders.toLocaleString("en-IN"), icon: <Tractor className="text-yellow-500" size={24} />, bg: "bg-yellow-950/40 border border-yellow-500/20" },
    { title: "Total Bookings Managed", value: stats.totalBookings.toLocaleString("en-IN"), icon: <CalendarCheck className="text-green-500" size={24} />, bg: "bg-green-950/40 border border-green-500/20" },
    { title: "Platform Volume", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: <IndianRupee className="text-purple-500" size={24} />, bg: "bg-purple-950/40 border border-purple-500/20" },
  ];

  const formatTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return "Recent";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Overview Dashboard</h1>
        <p className="text-slate-400 mt-1">Platform analytics, registration flows and critical queues.</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-500/35 text-red-400 p-4 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <div key={stat.title} className={`p-6 rounded-3xl ${stat.bg} flex items-center justify-between`}>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{stat.value}</h3>
            </div>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics chart and logs */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Simple Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Booking Volume (Monthly Trend)</h3>
          <div className="h-56 flex items-end justify-between gap-3 pt-4 border-b border-l border-slate-800 px-4">
            {[30, 45, 60, 40, 75, 90, 85, 95, 110, 100, 120, 135].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${(h / 140) * 100}%` }}
                  className="w-full bg-red-600 rounded-t-sm hover:bg-red-500 transition-all"
                />
                <span className="text-[10px] font-semibold text-slate-500">
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="text-red-500" size={20} />
              Recent Booking Actions
            </h3>
            {recentBookings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No recent booking activities.
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((log) => (
                  <div key={log.id} className="flex justify-between items-start gap-4 text-sm border-b border-slate-800 pb-3 last:border-0">
                    <p className="text-slate-300">
                      Farmer <strong className="text-white">{log.farmer_name}</strong> requested <strong className="text-white">{log.service_name}</strong> (KS-{log.id}). status: <span className="text-yellow-500 font-semibold">{log.status}</span>
                    </p>
                    <span className="text-xs font-medium text-slate-500 shrink-0">{formatTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3 mt-4">
            <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-yellow-500/80 leading-relaxed">
              Ensure regular review of disputes. Suspended users won't be allowed to login to prevent abuse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
