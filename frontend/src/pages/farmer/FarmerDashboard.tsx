import { useState, useEffect } from "react";
import { Sprout, Tractor, CloudSun, CheckCircle2, IndianRupee, AlertCircle } from "lucide-react";
import { KSCard, KSBadge } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import WeatherWidget from "../../components/dashboard/WeatherWidget";

interface Booking {
  id: number;
  service_name: string;
  provider_name: string;
  booking_date: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  total_price: string;
}

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Weather recommendation
  const weather = {
    temp: "32°C",
    condition: "Sunny / Clear",
    recommendation: "Perfect conditions for land preparation and sowing.",
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get("/bookings/farmer");
        setBookings(res.data.bookings);
      } catch (err: any) {
        console.error("Error fetching farmer dashboard data", err);
        setError("Could not load your dashboard stats. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Calculate statistics
  const activeBookingsCount = bookings.filter(b => b.status === "pending" || b.status === "confirmed").length;
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const totalSpent = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

  const stats = [
    { title: "Active Bookings", value: activeBookingsCount.toString(), icon: <Tractor className="text-yellow-600" size={24} />, bg: "bg-yellow-50" },
    { title: "Completed Services", value: completedCount.toString(), icon: <CheckCircle2 className="text-green-700" size={24} />, bg: "bg-green-50" },
    { title: "Total Spent", value: `₹${totalSpent.toLocaleString("en-IN")}`, icon: <IndianRupee className="text-blue-600" size={24} />, bg: "bg-blue-50" },
  ];

  // Find recent 5 bookings
  const recentBookings = bookings.slice(0, 5);

  // Find any pending booking to show in the alert
  const pendingBooking = bookings.find(b => b.status === "pending");

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
            Namaste {user?.name ? `${user.name} ji` : "Farmer ji"}!
          </h1>
          <p className="text-slate-500 mt-1">Here is an overview of your farm services and suggestions.</p>
        </div>
        <button
          onClick={() => navigate("/farmer/book")}
          className="bg-green-700 hover:bg-green-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition"
        >
          🚜 Book New Service
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Stats Cards */}
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

      {/* Weather & Recommendations Widget */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeatherWidget />
        </div>

        <KSCard className="flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="font-bold text-slate-800">Booking Alert</h4>
              <p className="text-sm text-slate-500 mt-1">
                {pendingBooking ? (
                  `Your booking request KS-${pendingBooking.id} is pending approval from ${pendingBooking.provider_name}.`
                ) : (
                  "You have no pending booking requests at the moment."
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/farmer/bookings")}
            className="text-sm font-bold text-green-700 hover:text-green-800 mt-4 text-left"
          >
            Check booking status →
          </button>
        </KSCard>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">Recent Bookings</h3>
          <button
            onClick={() => navigate("/farmer/bookings")}
            className="text-sm font-bold text-green-700 hover:underline"
          >
            View All
          </button>
        </div>
        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No bookings found. Get started by booking a service!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold text-sm">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Provider</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">KS-{b.id}</td>
                    <td className="px-6 py-4 font-semibold">{b.service_name}</td>
                    <td className="px-6 py-4">{b.provider_name}</td>
                    <td className="px-6 py-4 text-sm">{formatSQLDate(b.booking_date)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{parseFloat(b.total_price).toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <KSBadge
                        variant={
                          b.status === "completed"
                            ? "success"
                            : b.status === "pending"
                            ? "warning"
                            : b.status === "confirmed"
                            ? "info"
                            : "danger"
                        }
                      >
                        {b.status}
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

export default FarmerDashboard;
