import { motion } from "framer-motion";
import { Tractor, Combine, Droplets, Sprout, Truck, Wheat, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const services = [
  {
    icon: Tractor,
    title: "Tractor Service",
    desc: "Book tractors for ploughing, sowing and field preparation. Available same day.",
    price: "From ₹800/hr",
    color: "from-blue-400 to-blue-500",
    glow: "shadow-blue-400/20",
    badge: "Most Booked",
  },
  {
    icon: Combine,
    title: "Harvesting",
    desc: "Modern combine harvesters to cut your paddy, wheat and other crops efficiently.",
    price: "From ₹3,000/acre",
    color: "from-green-400 to-emerald-500",
    glow: "shadow-green-400/20",
    badge: "Seasonal",
  },
  {
    icon: Droplets,
    title: "Drone Spraying",
    desc: "Precision pesticide and fertiliser spraying with GPS-guided agricultural drones.",
    price: "From ₹400/acre",
    color: "from-cyan-400 to-blue-400",
    glow: "shadow-cyan-400/20",
    badge: "New Tech",
  },
  {
    icon: Sprout,
    title: "Rotavator",
    desc: "Deep soil preparation, mulching and soil aeration with rotavator attachments.",
    price: "From ₹600/hr",
    color: "from-emerald-400 to-green-500",
    glow: "shadow-emerald-400/20",
  },
  {
    icon: Truck,
    title: "Transport",
    desc: "Crop transportation from farm to mandi, warehouse or processing unit.",
    price: "From ₹1,500/trip",
    color: "from-orange-400 to-red-400",
    glow: "shadow-orange-400/20",
  },
  {
    icon: Wheat,
    title: "Cultivation Support",
    desc: "Full cultivation packages including seeding, watering and crop management.",
    price: "Custom Pricing",
    color: "from-yellow-400 to-orange-400",
    glow: "shadow-yellow-400/20",
  },
];

function Services() {
  const navigate = useNavigate();

  return (
    <section id="services" className="py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="inline-block bg-green-50 text-green-600 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-green-100 mb-5">
            Our Services
          </span>
          <h2 className="text-5xl font-extrabold text-slate-800 mb-4">
            Everything Your Farm Needs
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            From soil preparation to harvest — book trusted agricultural equipment and operators
            from verified providers in your district.
          </p>
        </motion.div>

        {/* Service Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative bg-white rounded-3xl p-7 shadow-sm hover:shadow-2xl hover:shadow-slate-200 border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer"
                onClick={() => navigate("/register?role=farmer")}
              >
                {/* Badge */}
                {service.badge && (
                  <span className={`absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${service.color} text-white`}>
                    {service.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} shadow-lg ${service.glow} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} className="text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-800 mb-2">{service.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{service.desc}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-green-600">{service.price}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400 font-semibold group-hover:text-green-600 group-hover:gap-2 transition-all">
                    Book Now <ArrowRight size={14} />
                  </span>
                </div>

                {/* Hover glow bottom border */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl`} />
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <button
            onClick={() => navigate("/register?role=farmer")}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-green-400/25 transition-all hover:gap-3"
          >
            Browse All Services <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

export default Services;