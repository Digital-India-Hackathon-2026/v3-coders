import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Tractor, Users } from "lucide-react";

function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-28 bg-slate-900 relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 text-green-400 text-xs font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Start Today — It's Free
          </span>

          <h2 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Transform Your Farm{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              This Season
            </span>
          </h2>

          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-14 leading-relaxed">
            Join 2,500+ farmers and 500+ service providers already using KisanSeeva to save time, reduce costs, and grow smarter.
          </p>

          {/* Two Cards */}
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-16">
            {/* Farmer Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate("/register?role=farmer")}
              className="cursor-pointer bg-green-500 hover:bg-green-400 rounded-3xl p-7 text-left shadow-2xl shadow-green-500/30 group transition-colors"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">I'm a Farmer</h3>
              <p className="text-green-100 text-sm leading-relaxed mb-5">
                Book tractors, harvesters, and more. Get the best services at your farm.
              </p>
              <span className="flex items-center gap-2 text-white font-bold text-sm group-hover:gap-3 transition-all">
                Register as Farmer <ArrowRight size={16} />
              </span>
            </motion.div>

            {/* Provider Card */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => navigate("/register?role=provider")}
              className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-3xl p-7 text-left shadow-2xl group transition-colors"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
                <Tractor size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">I'm a Provider</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                List your equipment, accept bookings, and grow your agricultural service business.
              </p>
              <span className="flex items-center gap-2 text-green-400 font-bold text-sm group-hover:gap-3 transition-all">
                Register as Provider <ArrowRight size={16} />
              </span>
            </motion.div>
          </div>

          {/* Already have account */}
          <p className="text-slate-500 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-400 font-semibold hover:text-green-300 transition underline underline-offset-4"
            >
              Sign in here
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
