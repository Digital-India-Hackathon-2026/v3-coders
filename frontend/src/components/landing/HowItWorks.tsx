import { motion } from "framer-motion";
import { UserCircle, Search, CalendarCheck, Star } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserCircle,
    title: "Create Your Account",
    desc: "Register as a farmer in under 2 minutes. Just your name, phone number and village location.",
    color: "bg-green-400",
    glow: "shadow-green-400/30",
    lineColor: "from-green-400 to-yellow-300",
  },
  {
    step: "02",
    icon: Search,
    title: "Browse & Select a Service",
    desc: "Choose from tractors, harvesters, drones and more. Filter by your location and preferred date.",
    color: "bg-yellow-300",
    glow: "shadow-yellow-300/30",
    lineColor: "from-yellow-300 to-blue-400",
  },
  {
    step: "03",
    icon: CalendarCheck,
    title: "Confirm Your Booking",
    desc: "Pick a date and time slot. Your booking is instantly sent to the provider for confirmation.",
    color: "bg-blue-400",
    glow: "shadow-blue-400/30",
    lineColor: "from-blue-400 to-emerald-400",
  },
  {
    step: "04",
    icon: Star,
    title: "Service Delivered & Rate",
    desc: "Provider arrives at your farm, completes the work. Pay and leave a rating for the community.",
    color: "bg-emerald-400",
    glow: "shadow-emerald-400/30",
    lineColor: "",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-blue-200 mb-5">
            Simple Process
          </span>
          <h2 className="text-5xl font-extrabold text-slate-800 mb-4">How It Works</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Get agricultural equipment delivered to your farm in four effortless steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-4 gap-8">
          {/* Connecting dashed line */}
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-slate-200 z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                {/* Step Number Badge */}
                <div className="relative mb-6">
                  <div className={`w-20 h-20 rounded-2xl ${step.color} shadow-xl ${step.glow} flex items-center justify-center`}>
                    <Icon size={34} className="text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs font-black text-white border-2 border-white">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Visual Strip */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.7 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 rounded-3xl bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 p-10 text-white text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_white_0%,_transparent_60%)]" />
          <h3 className="text-3xl font-extrabold mb-3 relative z-10">
            Ready to Book Your First Service?
          </h3>
          <p className="text-green-100 text-base mb-6 relative z-10">
            Join thousands of farmers who save time and money with KisanSeeva every season.
          </p>
          <div className="flex flex-wrap gap-4 justify-center relative z-10">
            <a
              href="/register?role=farmer"
              className="bg-white text-green-700 font-bold px-7 py-3 rounded-xl hover:bg-green-50 transition shadow-lg"
            >
              🌾 Register as Farmer
            </a>
            <a
              href="/register?role=provider"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-7 py-3 rounded-xl border border-white/25 transition"
            >
              🚜 Register as Provider
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorks;
