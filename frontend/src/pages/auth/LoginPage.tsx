import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { KSButton } from "../../components/ui";
import { Sprout, Tractor, ShieldAlert } from "lucide-react";

type Role = "farmer" | "provider" | "admin";

import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [role, setRole] = useState<Role>("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await login(email, password, role);
      
      // Navigate to respective dashboard
      if (role === "farmer") {
        navigate("/farmer");
      } else if (role === "provider") {
        navigate("/provider");
      } else if (role === "admin") {
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to manage your agricultural tasks & bookings"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        {/* Role Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRole("farmer")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                role === "farmer"
                  ? "border-green-700 bg-green-50 text-green-700 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-500"
              }`}
            >
              <Sprout className="mb-1" size={24} />
              <span className="text-xs">Farmer</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("provider")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                role === "provider"
                  ? "border-green-700 bg-green-50 text-green-700 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-500"
              }`}
            >
              <Tractor className="mb-1" size={24} />
              <span className="text-xs">Provider</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                role === "admin"
                  ? "border-green-700 bg-green-50 text-green-700 font-bold"
                  : "border-slate-200 hover:border-slate-300 text-slate-500"
              }`}
            >
              <ShieldAlert className="mb-1" size={24} />
              <span className="text-xs">Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="enter your email (e.g. farmer@kisan.com)"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
          />
        </div>

        {/* Password Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Password
            </label>
            <a href="#" className="text-xs font-semibold text-green-700 hover:underline">
              Forgot Password?
            </a>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
          />
        </div>

        {/* Action Button */}
        <KSButton type="submit" disabled={loading} className="w-full py-4 text-center justify-center">
          {loading ? "Signing In..." : "Sign In"}
        </KSButton>

        {/* Register Redirection */}
        <div className="text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="font-bold text-green-700 hover:underline cursor-pointer"
          >
            Register Here
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
