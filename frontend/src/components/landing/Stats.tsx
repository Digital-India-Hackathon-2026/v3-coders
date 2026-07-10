import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Tractor, CalendarCheck2, Star, TrendingUp } from "lucide-react";

function useCountUp(end: number, duration = 2000, decimals = 0, started = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (!started) return;
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

const statsData = [
  { icon: Users, number: 2500, suffix: "+", label: "Farmers Registered", color: "text-blue-500", bg: "bg-blue-50 border-blue-100", trend: "+12% this month" },
  { icon: Tractor, number: 500, suffix: "+", label: "Verified Providers", color: "text-green-500", bg: "bg-green-50 border-green-100", trend: "+8% this month" },
  { icon: CalendarCheck2, number: 15000, suffix: "+", label: "Bookings Completed", color: "text-purple-500", bg: "bg-purple-50 border-purple-100", trend: "+23% this month" },
  { icon: Star, number: 4.8, decimals: 1, suffix: "/5.0", label: "Average Rating", color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-100", trend: "Based on 5,200 reviews" },
];

function StatCard({ item, index }: { item: typeof statsData[0]; index: number }) {
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
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((item, i) => (
            <StatCard key={item.label} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;