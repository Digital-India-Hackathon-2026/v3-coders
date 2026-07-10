import React, { useState, useEffect } from "react";
import { Check, X, Calendar, MapPin, Tractor, Clock, Navigation } from "lucide-react";
import { KSCard, KSBadge, KSButton } from "../../components/ui";
import LiveTrackingModal from "../../components/dashboard/LiveTrackingModal";
import API from "../../services/api";

interface Booking {
  id: number;
  farmer_id: number;
  service_id: number;
  booking_date: string;
  hours_required: string;
  total_price: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "rejected";
  location: string;
  rating: number | null;
  feedback: string | null;
  service_name: string;
  service_type: string;
  farmer_name: string;
  farmer_phone: string;
}

const ProviderBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchBookings = async () => {
    try {
      const res = await API.get("/bookings/provider");
      setBookings(res.data.bookings);
    } catch (err: any) {
      console.error("Error loading provider bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusChange = async (bookingId: number, newStatus: "confirmed" | "rejected" | "completed") => {
    setActionLoading(bookingId);
    try {
      await API.put(`/bookings/${bookingId}/status`, { status: newStatus });
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      console.error("Status update error", err);
      alert(err.response?.data?.message || "Failed to update booking status.");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Manage Bookings</h1>
          <p className="text-slate-500 mt-1">Accept incoming booking requests, manage active jobs, and complete them.</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white p-1.5 border border-slate-100 rounded-2xl shadow-sm overflow-x-auto max-w-full">
          {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition whitespace-nowrap ${
                filter === item ? "bg-yellow-500 text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center text-slate-400">
          No bookings found in this category.
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((b) => (
            <KSCard key={b.id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl shrink-0">
                  <Tractor size={32} />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-slate-800 text-lg leading-none">{b.service_name}</h3>
                    <span className="text-sm font-semibold text-slate-400">(KS-{b.id})</span>
                    <KSBadge
                      variant={
                        b.status === "completed" || b.status === "confirmed"
                          ? "success"
                          : b.status === "cancelled" || b.status === "rejected"
                          ? "danger"
                          : "warning"
                      }
                    >
                      <span className="capitalize">{b.status}</span>
                    </KSBadge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Farmer: <span className="font-bold text-slate-800">{b.farmer_name}</span> ({b.farmer_phone})
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {formatSQLDate(b.booking_date)}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {b.location}</span>
                    <span>Duration: {b.hours_required} hrs</span>
                    <span>Estimated Payout: <span className="font-bold text-slate-700">₹{parseFloat(b.total_price).toLocaleString("en-IN")}</span></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0">
                {b.status === "pending" && (
                  <>
                    <KSButton
                      onClick={() => handleStatusChange(b.id, "rejected")}
                      variant="outline"
                      disabled={actionLoading === b.id}
                      className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-1.5 px-4 py-2 text-sm cursor-pointer"
                    >
                      <X size={16} /> Reject
                    </KSButton>
                    <KSButton
                      onClick={() => handleStatusChange(b.id, "confirmed")}
                      disabled={actionLoading === b.id}
                      className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-1.5 px-4 py-2 text-sm border-0 cursor-pointer"
                    >
                      <Check size={16} /> Accept Job
                    </KSButton>
                  </>
                )}

                {b.status === "confirmed" && (
                  <>
                    <KSButton
                      onClick={() => setTrackingId(b.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 px-5 py-2 text-sm border-0 font-bold cursor-pointer"
                    >
                      <Navigation size={16} /> Share Location
                    </KSButton>
                    <KSButton
                      onClick={() => handleStatusChange(b.id, "completed")}
                      disabled={actionLoading === b.id}
                      className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 flex items-center gap-1.5 px-5 py-2 text-sm border-0 font-bold cursor-pointer"
                    >
                      <Check size={16} /> Mark Completed
                    </KSButton>
                  </>
                )}
              </div>
            </KSCard>
          ))}
        </div>
      )}

      {/* Live Tracking Modal */}
      {trackingId && (
        <LiveTrackingModal
          isOpen={!!trackingId}
          onClose={() => setTrackingId(null)}
          bookingId={trackingId}
          role="provider"
        />
      )}
    </div>
  );
};

export default ProviderBookings;
