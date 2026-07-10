import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, Tractor } from "lucide-react";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "Testimonials", href: "#testimonials" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-600/30 group-hover:scale-105 transition-transform">
            <Tractor size={20} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-800">
            Kisan<span className="text-green-600">Seeva</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-600 hover:text-green-700 font-medium text-sm transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-green-700 border border-slate-200 hover:border-green-300 rounded-xl transition-all duration-200 bg-white hover:bg-green-50"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-200"
          >
            Get Started →
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-slate-700 hover:text-green-700 font-medium py-2 border-b border-slate-50"
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 mt-3">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex-1 text-center py-2.5 bg-green-600 rounded-xl text-sm font-semibold text-white"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;