import { useState, useEffect } from "react";
import { Tractor, IndianRupee, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { KSCard, KSBadge } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

interface Booking {
  id: number;
  farmer_name: string;
  farmer_phone: string;
  service_name: string;
  service_type: string;
  booking_date: string;
  hours_required: string;
  total_price: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  location: string;
}

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProviderData = async () => {
      try {
        const res = await API.get("/bookings/provider");
        setBookings(res.data.bookings);
      } catch (err: any) {
        console.error("Error loading provider bookings", err);
        setError("Unable to load dashboard details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProviderData();
  }, []);

  // Calculate statistics
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const totalEarnings = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

  const stats = [
    { title: "Pending Requests", value: pendingCount.toString(), icon: <Clock className="text-yellow-600" size={24} />, bg: "bg-yellow-50" },
    { title: "Completed Bookings", value: completedCount.toString(), icon: <CheckCircle2 className="text-green-700" size={24} />, bg: "bg-green-50" },
    { title: "Total Earnings", value: `₹${totalEarnings.toLocaleString("en-IN")}`, icon: <IndianRupee className="text-blue-600" size={24} />, bg: "bg-blue-50" },
  ];

  const recentRequests = bookings.slice(0, 5);

  const formatSQLDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Welcome back, {user?.name || "Provider"}!
          </h1>
          <p className="text-slate-500 mt-1">Manage jobs, schedule equipment and review your weekly revenue.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <KSCard key={stat.title} className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>{stat.icon}</div>
            <div>
              <p className="text-sm font-semibold text-slate-400">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
            </div>
          </KSCard>
        ))}
      </div>

      {/* Revenue & Overview Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <KSCard className="lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Chart (Weekly)</h3>
          {/* Simple Inline SVG representing a bar chart */}
          <div className="h-48 flex items-end justify-between gap-4 pt-4 border-b border-l border-slate-100 px-4">
            {[40, 60, 45, 80, 55, 95, 75].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full bg-yellow-500 rounded-t-lg hover:bg-yellow-600 transition-all duration-300"
                />
                <span className="text-xs font-semibold text-slate-400">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
              </div>
            ))}
          </div>
        </KSCard>

        <KSCard className="flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Platform Advisory</h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Harvesting demand is expected to spike in the Warangal region over the next 4 days. Keep your machinery ready and check online availability.
            </p>
          </div>
          <button
            onClick={() => navigate("/provider/services")}
            className="text-sm font-bold text-yellow-600 hover:text-yellow-700 mt-4 text-left flex items-center gap-1"
          >
            Manage equipment list <ChevronRight size={16} />
          </button>
        </KSCard>
      </div>

      {/* Booking Requests */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Active Requests</h3>
          <button
            onClick={() => navigate("/provider/bookings")}
            className="text-sm font-bold text-yellow-600 hover:underline"
          >
            Manage All
          </button>
        </div>
        {recentRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No service requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold text-sm">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Farmer</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">KS-{r.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{r.farmer_name}</td>
                    <td className="px-6 py-4">{r.service_name}</td>
                    <td className="px-6 py-4">{r.hours_required} hrs</td>
                    <td className="px-6 py-4 text-sm">{formatSQLDate(r.booking_date)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{parseFloat(r.total_price).toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <KSBadge
                        variant={
                          r.status === "completed"
                            ? "success"
                            : r.status === "pending"
                            ? "warning"
                            : r.status === "confirmed"
                            ? "info"
                            : "danger"
                        }
                      >
                        {r.status}
                      </KSBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
