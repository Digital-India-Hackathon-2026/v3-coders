import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Tractor, CalendarCheck2, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import axios from "axios";
import API from "../../services/api";

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
  gradient: string;
  glow: string;
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 rounded-3xl p-8 overflow-hidden transition-all duration-300 cursor-default"
    >
      {/* Background glow */}
      <div className={`absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${item.gradient}`} />

      {/* Icon */}
      <div className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-xl ${item.glow} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        <Icon size={24} className="text-white" />
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${item.gradient} blur-md -z-10 scale-125 opacity-0 group-hover:opacity-60 transition-opacity`} />
      </div>

      {/* Number */}
      <h3 className="text-5xl font-black text-white mb-2 tracking-tight">
        {count.toFixed(item.decimals ?? 0)}{item.suffix}
      </h3>
      <p className="text-slate-300 font-semibold mb-4 text-base">{item.label}</p>

      {/* Trend */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <TrendingUp size={12} />
        {item.trend}
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </motion.div>
  );
}

function Stats() {
  const [liveStats, setLiveStats] = useState({ farmers: 0, providers: 0, bookings: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/admin/public-stats`)
      .then((res) => setLiveStats(res.data))
      .catch(() => setLiveStats({ farmers: 0, providers: 0, bookings: 0, completed: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const statsData: StatItem[] = [
    { icon: Users, number: liveStats.farmers, suffix: "+", label: "Farmers Registered", gradient: "from-blue-500 to-cyan-400", glow: "shadow-blue-500/30", trend: "Growing community" },
    { icon: Tractor, number: liveStats.providers, suffix: "+", label: "Verified Providers", gradient: "from-emerald-500 to-green-400", glow: "shadow-emerald-500/30", trend: "Trusted service experts" },
    { icon: CalendarCheck2, number: liveStats.bookings, suffix: "+", label: "Total Bookings", gradient: "from-violet-500 to-purple-400", glow: "shadow-violet-500/30", trend: "All time bookings" },
    { icon: CheckCircle2, number: liveStats.completed, suffix: "+", label: "Services Completed", gradient: "from-amber-500 to-yellow-400", glow: "shadow-amber-500/30", trend: "Successfully delivered" },
  ];

  return (
    <section className="py-28 bg-slate-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(5,150,105,0.06)_0%,_transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold px-5 py-2.5 rounded-full mb-6 uppercase tracking-widest">
            <Sparkles size={12} />
            Live Platform Stats
          </span>
          <h2 className="text-5xl font-black text-white mb-4">
            Numbers That Tell{" "}
            <span className="gradient-text">Our Story</span>
          </h2>
          <div className="section-divider mb-5" />
          <p className="text-slate-400 text-base">
            Live data — updated in real time as our community grows.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-8 rounded-3xl border border-white/5 bg-slate-900/60 animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-white/5 mb-6" />
                <div className="h-12 w-24 bg-white/5 rounded-xl mb-3" />
                <div className="h-4 w-32 bg-white/5 rounded mb-4" />
                <div className="h-3 w-28 bg-white/5 rounded" />
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
