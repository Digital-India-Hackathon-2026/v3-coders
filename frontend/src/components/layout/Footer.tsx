import { Link } from "react-router-dom";
import { Tractor, Mail, Phone, MapPin } from "lucide-react";

const socialLinks = [
  {
    label: "Twitter",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

function Footer() {
  const services = ["Tractor Service", "Harvesting", "Drone Spraying", "Rotavator", "Transport", "Cultivation"];
  const company = ["About Us", "How It Works", "Pricing", "Blog", "Careers", "Contact"];
  const support = ["Help Center", "Farmer Guide", "Provider Guide", "Terms of Service", "Privacy Policy"];

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-6 group w-fit">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30">
                <Tractor size={20} className="text-white" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                Kisan<span className="text-green-400">Seeva</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed text-sm mb-8 max-w-xs">
              India's most trusted platform connecting farmers with verified agricultural service providers.
              Serving Telangana & Andhra Pradesh.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              <a href="mailto:support@kisanseeva.com" className="flex items-center gap-3 text-slate-400 hover:text-green-400 transition text-sm">
                <Mail size={15} className="text-green-500" />
                support@kisanseeva.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-3 text-slate-400 hover:text-green-400 transition text-sm">
                <Phone size={15} className="text-green-500" />
                +91 98765 43210
              </a>
              <div className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin size={15} className="text-green-500 shrink-0" />
                Plot 42, HITEC City, Hyderabad — 500081
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-3 mt-8">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="w-9 h-9 bg-slate-800 hover:bg-green-600 border border-slate-700 hover:border-green-600 rounded-xl flex items-center justify-center transition-all duration-200 text-slate-400 hover:text-white"
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Services</h4>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item}>
                  <a href="#services" className="text-slate-400 hover:text-green-400 transition text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Company</h4>
            <ul className="space-y-3">
              {company.map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-green-400 transition text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Support</h4>
            <ul className="space-y-3">
              {support.map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-green-400 transition text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>

            {/* App Badges */}
            <div className="mt-8 space-y-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Available On</p>
              <div className="flex flex-col gap-2">
                <a href="#" className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl px-4 py-2.5 transition group">
                  <span className="text-xl">🍎</span>
                  <div>
                    <p className="text-[10px] text-slate-500 leading-none">Download on the</p>
                    <p className="text-xs font-bold text-white">App Store</p>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-green-600 rounded-xl px-4 py-2.5 transition group">
                  <span className="text-xl">▶️</span>
                  <div>
                    <p className="text-[10px] text-slate-500 leading-none">Get it on</p>
                    <p className="text-xs font-bold text-white">Google Play</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 KisanSeeva Technologies Pvt. Ltd. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;