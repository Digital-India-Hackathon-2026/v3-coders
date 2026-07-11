import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Tractor, CalendarCheck2, CheckCircle2, TrendingUp } from "lucide-react";
import axios from "axios";

function useCountUp(end: number, duration = 2000, decimals = 0, started = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!started || end === 0) return;
    startTime.current = null;
    const step = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration, decimals, started]);

  return count;
}

type StatItem = {
  icon: React.ElementType;
  number: number;
  suffix: string;
  label: string;
  color: string;
  bg: string;
  trend: string;
  decimals?: number;
};

function StatCard({ item, index }: { item: StatItem; index: number }) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);
  const count = useCountUp(item.number, 2000, item.decimals ?? 0, started);
  const Icon = item.icon;

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <motion.div
      ref={setRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative p-7 rounded-3xl border ${item.bg} bg-white overflow-hidden group cursor-default`}
    >
      {/* Subtle glow */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-30 ${item.color.replace("text-", "bg-")}`} />

      <div className={`inline-flex p-3 rounded-2xl ${item.bg} border ${item.bg.split(" ")[1]} mb-5`}>
        <Icon size={24} className={item.color} />
      </div>

      <h3 className="text-4xl font-black text-slate-800 mb-1">
        {count.toFixed(item.decimals ?? 0)}{item.suffix}
      </h3>
      <p className="text-slate-600 font-semibold mb-3">{item.label}</p>
      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
        <TrendingUp size={12} />
        {item.trend}
      </div>
    </motion.div>
  );
}

function Stats() {
  const [liveStats, setLiveStats] = useState({ farmers: 0, providers: 0, bookings: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:5000/api/admin/public-stats")
      .then((res) => setLiveStats(res.data))
      .catch(() => {
        // fallback to placeholder values if API is unreachable
        setLiveStats({ farmers: 0, providers: 0, bookings: 0, completed: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const statsData: StatItem[] = [
    { icon: Users, number: liveStats.farmers, suffix: "+", label: "Farmers Registered", color: "text-blue-500", bg: "bg-blue-50 border-blue-100", trend: "Active members" },
    { icon: Tractor, number: liveStats.providers, suffix: "+", label: "Verified Providers", color: "text-green-500", bg: "bg-green-50 border-green-100", trend: "Trusted service providers" },
    { icon: CalendarCheck2, number: liveStats.bookings, suffix: "+", label: "Total Bookings", color: "text-purple-500", bg: "bg-purple-50 border-purple-100", trend: "All time bookings" },
    { icon: CheckCircle2, number: liveStats.completed, suffix: "+", label: "Services Completed", color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-100", trend: "Successfully delivered" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-green-50 text-green-600 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-green-100 mb-4">
            Trusted Platform
          </span>
          <h2 className="text-4xl font-extrabold text-slate-800">
            Numbers That Tell Our Story
          </h2>
          <p className="text-slate-500 mt-2 text-base">
            Live data — updated in real time as our community grows.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-7 rounded-3xl border border-slate-100 bg-white animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 mb-5" />
                <div className="h-10 w-24 bg-slate-100 rounded-xl mb-2" />
                <div className="h-4 w-32 bg-slate-100 rounded mb-3" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((item, i) => (
              <StatCard key={item.label} item={item} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Stats;