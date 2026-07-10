import { useState, useEffect } from "react";
import { Search, Filter, Tractor, Star, CheckCircle2, XCircle, Clock, MessageSquare } from "lucide-react";
import { KSCard, KSBadge, KSButton, KSModal } from "../../components/ui";
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
  price_per_hour: string;
  provider_name: string;
  provider_phone: string;
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [trackingId, setTrackingId] = useState<number | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/bookings/farmer");
      setBookings(res.data.bookings);
    } catch (err: any) {
      console.error("Error fetching bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    
    setActionLoading(bookingId);
    try {
      await API.put(`/bookings/${bookingId}/status`, { status: "cancelled" });
      // Update state local
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (err: any) {
      console.error("Cancel booking error", err);
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setActionLoading(null);
    }
  };

  const openRatingModal = (id: number) => {
    setSelectedBookingId(id);
    setRating(5);
    setFeedback("");
    setIsRateOpen(true);
  };

  const submitRating = async () => {
    if (!selectedBookingId) return;
    setRatingSubmitting(true);
    try {
      await API.put(`/bookings/${selectedBookingId}/rate`, {
        rating,
        feedback,
      });
      setIsRateOpen(false);
      // Refresh list
      fetchBookings();
    } catch (err: any) {
      console.error("Submit rating error", err);
      alert(err.response?.data?.message || "Failed to submit rating.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    return b.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={16} className="text-green-700" />;
      case "cancelled":
      case "rejected":
        return <XCircle size={16} className="text-red-700" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

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
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 mt-1">View history, status, and track your agricultural bookings.</p>
        </div>

        {/* Filter Badges */}
        <div className="flex gap-2 bg-white p-1.5 border border-slate-100 rounded-2xl shadow-sm overflow-x-auto max-w-full">
          {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition whitespace-nowrap ${
                filter === item ? "bg-green-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Grid */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-12 text-center text-slate-400">
          No bookings found in this category.
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((b) => (
            <KSCard key={b.id} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-green-50 text-green-700 rounded-2xl shrink-0">
                  <Tractor size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{b.service_name}</h3>
                    <span className="text-sm font-semibold text-slate-400">(KS-{b.id})</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Provider: <span className="font-semibold text-slate-700">{b.provider_name}</span> ({b.provider_phone})
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Location: <span className="text-slate-600">{b.location}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                    <span>Scheduled: <strong className="text-slate-700">{formatSQLDate(b.booking_date)}</strong></span>
                    <span>Duration: <strong className="text-slate-700">{b.hours_required} hrs</strong></span>
                    <span>Total Cost: <strong className="text-slate-700">₹{parseFloat(b.total_price).toLocaleString("en-IN")}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                <div className="self-start sm:self-center">
                  <KSBadge
                    variant={
                      b.status === "completed"
                        ? "success"
                        : b.status === "cancelled" || b.status === "rejected"
                        ? "danger"
                        : b.status === "confirmed"
                        ? "info"
                        : "warning"
                    }
                  >
                    {getStatusIcon(b.status)}
                    <span className="capitalize ml-1">{b.status}</span>
                  </KSBadge>
                </div>

                {/* Cancel Action */}
                {(b.status === "pending" || b.status === "confirmed") && (
                  <KSButton
                    variant="outline"
                    className="px-4 py-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    disabled={actionLoading === b.id}
                    onClick={() => handleCancel(b.id)}
                  >
                    {actionLoading === b.id ? "Cancelling..." : "Cancel Request"}
                  </KSButton>
                )}

                {/* Track Action */}
                {b.status === "confirmed" && (
                  <KSButton
                    className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 border-none"
                    onClick={() => setTrackingId(b.id)}
                  >
                    Track Provider
                  </KSButton>
                )}

                {/* Rate Action */}
                {b.status === "completed" && b.rating === null && (
                  <KSButton variant="outline" className="px-4 py-2 text-xs" onClick={() => openRatingModal(b.id)}>
                    Rate Provider
                  </KSButton>
                )}

                {/* Rating View */}
                {b.status === "completed" && b.rating !== null && (
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      {[...Array(b.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                      {[...Array(5 - (b.rating || 0))].map((_, i) => (
                        <Star key={i} size={16} className="text-slate-200" />
                      ))}
                    </div>
                    {b.feedback && (
                      <span className="text-xs text-slate-400 italic flex items-center gap-1">
                        <MessageSquare size={12} /> "{b.feedback}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            </KSCard>
          ))}
        </div>
      )}

      {/* Rating Modal */}
      <KSModal isOpen={isRateOpen} onClose={() => setIsRateOpen(false)} title="Rate Service Provider">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-slate-600">How was your experience with the booking?</p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  type="button"
                  className={`p-1 transition-transform active:scale-95 ${
                    rating >= star ? "text-yellow-500" : "text-slate-300"
                  }`}
                >
                  <Star size={36} fill={rating >= star ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Feedback / Comments (Optional)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about the quality of service, punctuality, and equipment behavior..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition text-sm"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <KSButton variant="outline" className="w-1/2 justify-center" disabled={ratingSubmitting} onClick={() => setIsRateOpen(false)}>
              Cancel
            </KSButton>
            <KSButton className="w-1/2 justify-center" disabled={ratingSubmitting} onClick={submitRating}>
              {ratingSubmitting ? "Submitting..." : "Submit Review"}
            </KSButton>
          </div>
        </div>
      </KSModal>

      {/* Live Tracking Modal */}
      {trackingId && (
        <LiveTrackingModal
          isOpen={!!trackingId}
          onClose={() => setTrackingId(null)}
          bookingId={trackingId}
          role="farmer"
        />
      )}
    </div>
  );
};

export default MyBookings;
