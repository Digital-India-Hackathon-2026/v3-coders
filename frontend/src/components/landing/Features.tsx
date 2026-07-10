import { motion } from "framer-motion";
import { ShieldCheck, CloudSun, MapPinned, Bell, Zap, IndianRupee } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Providers Only",
    desc: "Every service provider undergoes KYC verification including Aadhaar, equipment documents and field background checks before getting listed.",
    color: "text-green-500",
    bg: "bg-green-50 border-green-100",
    glow: "group-hover:shadow-green-50",
  },
  {
    icon: CloudSun,
    title: "Weather-Aware Farming",
    desc: "Integrated weather forecasting gives you crop-specific recommendations before you schedule any farm activity.",
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-100",
    glow: "group-hover:shadow-blue-50",
  },
  {
    icon: MapPinned,
    title: "Hyperlocal Discovery",
    desc: "Our village-level location system helps you find equipment available within 5–20 km of your farm — not in another district.",
    color: "text-violet-500",
    bg: "bg-violet-50 border-violet-100",
    glow: "group-hover:shadow-violet-50",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    desc: "Stay updated with instant booking confirmations, provider arrival alerts, and payment receipts directly on your phone.",
    color: "text-orange-500",
    bg: "bg-orange-50 border-orange-100",
    glow: "group-hover:shadow-orange-50",
  },
  {
    icon: Zap,
    title: "Instant Booking",
    desc: "No phone calls, no waiting. Book your equipment slot in under 60 seconds from any smartphone or feature phone.",
    color: "text-yellow-500",
    bg: "bg-yellow-50 border-yellow-100",
    glow: "group-hover:shadow-yellow-50",
  },
  {
    icon: IndianRupee,
    title: "Transparent Pricing",
    desc: "No hidden charges. See exact pricing upfront before confirming. Pay securely after service completion.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 border-emerald-100",
    glow: "group-hover:shadow-emerald-50",
  },
];

function Features() {
  return (
    <section id="features" className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block bg-purple-50 text-purple-700 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-purple-200 mb-5">
            Why KisanSeeva?
          </span>
          <h2 className="text-5xl font-extrabold text-slate-800 mb-5">
            Built for Indian Farmers
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Every feature is designed around the real challenges faced by smallholder farmers
            across Telangana, Andhra Pradesh and beyond.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`group p-8 bg-white rounded-3xl border shadow-sm hover:shadow-xl ${feature.glow} transition-all duration-300`}
              >
                <div className={`inline-flex p-3.5 rounded-2xl ${feature.bg} border mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} className={feature.color} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;