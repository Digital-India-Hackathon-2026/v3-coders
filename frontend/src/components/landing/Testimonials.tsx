import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ramesh Kumar",
    village: "Warangal, Telangana",
    role: "Paddy Farmer • 5 Acres",
    rating: 5,
    review:
      "Booking a tractor was very simple. The provider Balaji arrived on time and completed ploughing in just one day. Earlier I used to wait 3–4 days searching manually. KisanSeeva saved my season!",
    avatar: "RK",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Suresh Reddy",
    village: "Nizamabad, Telangana",
    role: "Cotton Farmer • 8 Acres",
    rating: 5,
    review:
      "The weather recommendations helped me plan harvesting before heavy rainfall. I saved almost 40% of my crop compared to last year. Really useful platform, would recommend to every farmer.",
    avatar: "SR",
    color: "from-green-500 to-green-600",
  },
  {
    name: "Lakshmi Devi",
    village: "Karimnagar, Telangana",
    role: "Vegetable Farmer • 3 Acres",
    rating: 5,
    review:
      "Very simple interface. Even I could book a rotavator within minutes on my phone. I received regular updates and the provider was professional. The pricing was also fair and transparent.",
    avatar: "LD",
    color: "from-purple-500 to-purple-600",
  },
  {
    name: "Venkat Naidu",
    village: "Medak, Telangana",
    role: "Sugarcane Farmer • 12 Acres",
    rating: 5,
    review:
      "Drone spraying saved me 3 full days of manual labour and used 30% less pesticide. The results were much better than traditional spraying. This is truly the future of farming.",
    avatar: "VN",
    color: "from-orange-500 to-red-500",
  },
];

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const active = testimonials[activeIndex];

  return (
    <section id="testimonials" className="py-28 bg-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white to-emerald-50/30" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-100 rounded-full blur-3xl opacity-40" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-yellow-50 text-yellow-700 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest border border-yellow-200 mb-5">
            Farmer Stories
          </span>
          <h2 className="text-5xl font-extrabold text-slate-800 mb-4">
            Trusted by Real Farmers
          </h2>
          <p className="text-slate-500 text-lg">
            Thousands of farmers across Telangana share their experience.
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.5 }}
              className="w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-10 md:p-14 relative overflow-hidden"
            >
              {/* Large Quote Icon */}
              <Quote size={100} className="absolute top-4 left-4 text-green-50" fill="currentColor" />

              <div className="relative z-10">
                {/* Stars */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: active.rating }).map((_, i) => (
                    <Star key={i} size={18} className="text-yellow-400" fill="currentColor" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xl md:text-2xl text-slate-700 italic leading-relaxed mb-10 max-w-3xl">
                  "{active.review}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${active.color} flex items-center justify-center text-white font-black text-lg shadow-lg`}>
                    {active.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{active.name}</p>
                    <p className="text-green-600 font-medium text-sm">{active.village}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{active.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-green-700 hover:border-green-200 hover:shadow-md transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-8 h-3 bg-green-600" : "w-3 h-3 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % testimonials.length)}
            className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-green-700 hover:border-green-200 hover:shadow-md transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Testimonials;