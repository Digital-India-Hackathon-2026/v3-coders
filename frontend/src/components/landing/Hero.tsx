import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, Star, CheckCircle } from "lucide-react";

function Hero() {
  const navigate = useNavigate();

  const trusted = ["2,500+ Farmers", "500+ Providers", "15,000+ Bookings", "4.8★ Rating"];

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 overflow-hidden flex items-center">
      {/* Animated Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-green-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-yellow-400/10 rounded-full blur-3xl" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 py-32 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-green-100 border border-green-200 text-green-700 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
              🌾 India's #1 Agri-Services Platform
            </motion.div>

            {/* Heading */}
            <h1 className="text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-slate-900 mb-8">
              Book Farm{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  Services
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full origin-left"
                />
              </span>
              <br />
              In{" "}
              <span className="text-yellow-500">Minutes</span>
            </h1>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-10">
              Connect with verified tractor owners, harvesting machines, drone spraying operators
              and transport services right in your village — fast, simple and trusted.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register?role=farmer")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-green-600/20 transition-all text-base"
              >
                🚜 Book a Service <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register?role=provider")}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-8 py-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm transition-all text-base"
              >
                <Play size={16} className="text-green-600" />
                Become a Provider
              </motion.button>
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap gap-3">
              {trusted.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-full">
                  <CheckCircle size={12} className="text-green-600" />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Visual Card Stack */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            className="relative lg:block hidden"
          >
            {/* Main Image Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80"
                alt="Farmer using KisanSeeva"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

              {/* Overlay Card - Live Booking */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md border border-white/50 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Booking Confirmed</p>
                    <p className="text-slate-900 font-extrabold text-base">Tractor Service — Warangal</p>
                    <p className="text-green-600 text-sm font-semibold mt-0.5">Balaji Agri Services • Arriving Tomorrow 6 AM</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={22} className="text-green-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Floating Rating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="absolute -top-6 -right-6 bg-yellow-400 text-slate-900 rounded-2xl px-5 py-3 shadow-2xl shadow-yellow-400/30 flex items-center gap-2 font-bold"
            >
              <Star size={18} fill="currentColor" />
              4.8 / 5 Rating
            </motion.div>

            {/* Floating Users Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="absolute -left-8 top-1/2 -translate-y-1/2 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-2xl flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {["🧑‍🌾", "👨‍🌾", "🧑‍🌾"].map((emoji, i) => (
                  <div key={i} className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm border-2 border-white">
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-slate-900 font-bold text-sm">2,500+</p>
                <p className="text-slate-500 text-xs font-medium">Active Farmers</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}

export default Hero;