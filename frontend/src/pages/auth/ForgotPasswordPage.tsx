import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { KSButton } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState(""); // For dev mode fallback

  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(true);
      if (res.devResetToken) {
        setDevToken(res.devResetToken); // For local dev without email configured
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link."
    >
      {success ? (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Check your email</h3>
            <p className="text-slate-500 text-sm mt-2">
              We've sent a password reset link to <span className="font-semibold text-slate-700">{email}</span>.
            </p>
          </div>
          
          {devToken && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <p className="text-xs font-bold text-amber-800 mb-2">Dev Mode Active (Email not sent)</p>
              <p className="text-xs text-amber-700 mb-3">Since SMTP is not configured, click here to reset:</p>
              <KSButton onClick={() => navigate(`/reset-password?token=${devToken}`)} className="w-full text-xs py-2">
                Simulate Email Click
              </KSButton>
            </div>
          )}

          <KSButton variant="outline" onClick={() => navigate("/login")} className="w-full py-3">
            Back to Login
          </KSButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition"
            />
          </div>

          <KSButton type="submit" disabled={loading} className="w-full py-4 text-center justify-center">
            {loading ? "Sending..." : "Send Reset Link"}
          </KSButton>

          <div className="text-center text-sm">
            <span
              onClick={() => navigate("/login")}
              className="font-semibold text-slate-500 hover:text-slate-800 cursor-pointer transition"
            >
              Back to Login
            </span>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
