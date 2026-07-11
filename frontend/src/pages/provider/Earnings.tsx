import React, { useState, useEffect } from "react";
import { IndianRupee, ArrowUpRight, TrendingUp, Calendar, CreditCard } from "lucide-react";
import { KSCard, KSBadge } from "../../components/ui";
import API from "../../services/api";

interface Booking {
  id: number;
  farmer_name: string;
  service_name: string;
  booking_date: string;
  hours_required: string;
  total_price: string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  payment_transaction_id?: string;
}

const Earnings = () => {
  const [completedJobs, setCompletedJobs] = useState<Booking[]>([]);
  const [confirmedJobs, setConfirmedJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        const res = await API.get("/bookings/provider");
        const allBookings = res.data.bookings as Booking[];
        setCompletedJobs(allBookings.filter(b => b.status === "completed"));
        setConfirmedJobs(allBookings.filter(b => b.status === "confirmed"));
      } catch (err: any) {
        console.error("Error loading earnings data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarningsData();
  }, []);

  const totalEarnings = completedJobs.reduce((sum, b) => sum + parseFloat(b.total_price), 0);
  const paidToAccount = completedJobs
    .filter(b => b.payment_status === "paid")
    .reduce((sum, b) => sum + parseFloat(b.total_price) * 0.95, 0);
  
  const pendingEarnings = confirmedJobs.reduce((sum, b) => sum + parseFloat(b.total_price), 0) + 
    completedJobs.filter(b => b.payment_status !== "paid").reduce((sum, b) => sum + parseFloat(b.total_price), 0);

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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Earnings & Payouts</h1>
        <p className="text-slate-500 mt-1">Track your completed jobs, payout statuses, and financial analytics.</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KSCard className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400">Total Revenue</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{totalEarnings.toLocaleString("en-IN")}</h3>
            <span className="text-xs font-semibold text-green-700 mt-2 flex items-center gap-1">
              <TrendingUp size={14} /> Direct booking revenue
            </span>
          </div>
          <div className="p-4 bg-green-50 text-green-700 rounded-2xl">
            <IndianRupee size={28} />
          </div>
        </KSCard>

        <KSCard className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400">Paid to Account (95%)</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{paidToAccount.toLocaleString("en-IN")}</h3>
            <span className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
              <Calendar size={14} /> Less 5% KisanSeeva platform fee
            </span>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <ArrowUpRight size={28} />
          </div>
        </KSCard>

        <KSCard className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400">Pending Payouts</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">₹{pendingEarnings.toLocaleString("en-IN")}</h3>
            <span className="text-xs font-semibold text-yellow-600 mt-2 flex items-center gap-1">
              <CreditCard size={14} /> Escrowed or completed unpaid
            </span>
          </div>
          <div className="p-4 bg-yellow-50 text-yellow-600 rounded-2xl">
            <IndianRupee size={28} />
          </div>
        </KSCard>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Job Payout History</h3>
        </div>
        {completedJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No payout transactions found. Earnings appear once jobs are marked completed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold text-sm">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Job Type</th>
                  <th className="px-6 py-4">Farmer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {completedJobs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">TXN-{t.id}</td>
                    <td className="px-6 py-4 text-sm">{formatSQLDate(t.booking_date)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{t.service_name}</td>
                    <td className="px-6 py-4">{t.farmer_name}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">₹{parseFloat(t.total_price).toLocaleString("en-IN")}</td>
                    <td className="px-6 py-4">
                      <KSBadge variant={t.payment_status === "paid" ? "success" : "danger"}>
                        <span>{t.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
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

export default Earnings;
