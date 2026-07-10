import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { KSButton } from "../../components/ui";
import { Sprout, Tractor, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type Role = "farmer" | "provider";

const RegisterPage = () => {
  const [role, setRole] = useState<Role>("farmer");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [extraInfo, setExtraInfo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();

  const handleNext = () => {
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!phone.trim()) { setError("Please enter your phone number"); return; }
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError("");
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authRegister({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        password,
        extraInfo: extraInfo.trim(),
      });
      navigate(role === "farmer" ? "/farmer" : "/provider");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition text-slate-800 placeholder:text-slate-400";

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the KisanSeeva network to grow your farming operations"
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[1, 2].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${s <= step ? "text-green-600" : "text-slate-400"}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  s < step
                    ? "bg-green-500 border-green-500 text-white"
                    : s === step
                    ? "border-green-500 text-green-600"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                {s < step ? <CheckCircle2 size={16} /> : s}
              </div>
              <span className="text-sm font-semibold hidden sm:block">
                {s === 1 ? "Basic Info" : "Details"}
              </span>
            </div>
            {s < 2 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > 1 ? "bg-green-400" : "bg-slate-200"}`} />}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        {step === 1 ? (
          <>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Register As
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("farmer")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    role === "farmer"
                      ? "border-green-400 bg-green-50 text-green-700 font-bold shadow-sm shadow-green-100"
                      : "border-slate-200 hover:border-slate-300 text-slate-500"
                  }`}
                >
                  <Sprout className="mb-2" size={26} />
                  <span className="text-sm">Farmer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("provider")}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                    role === "provider"
                      ? "border-green-400 bg-green-50 text-green-700 font-bold shadow-sm shadow-green-100"
                      : "border-slate-200 hover:border-slate-300 text-slate-500"
                  }`}
                >
                  <Tractor className="mb-2" size={26} />
                  <span className="text-sm">Provider</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Inputs */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className={inputClass + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <KSButton type="button" onClick={handleNext} className="w-full py-4 text-center justify-center">
              Continue →
            </KSButton>
          </>
        ) : (
          <>
            <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-sm text-green-800">
              <p className="font-semibold mb-0.5">Almost done, {name.split(" ")[0]}! 🌾</p>
              <p className="text-green-700">Tell us a little about your {role === "farmer" ? "farm" : "equipment"}.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {role === "farmer" ? "Farm Details (Optional)" : "Machinery Details (Optional)"}
              </label>
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                rows={4}
                placeholder={
                  role === "farmer"
                    ? "e.g. 5 acres of paddy & cotton in Warangal district"
                    : "e.g. Mahindra 475 DI tractor, available daily from 6 AM"
                }
                className={inputClass}
              />
              <p className="text-xs text-slate-400 mt-1.5">You can skip this and update later from your profile.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <KSButton
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => { setStep(1); setError(""); }}
                className="w-1/3 py-4 text-center justify-center"
              >
                ← Back
              </KSButton>
              <KSButton type="submit" disabled={loading} className="flex-1 py-4 text-center justify-center">
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : "Create Account 🚀"}
              </KSButton>
            </div>
          </>
        )}

        <div className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="font-semibold text-green-600 hover:text-green-700 hover:underline cursor-pointer"
          >
            Sign in here
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
