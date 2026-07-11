import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Mail } from "lucide-react";
import { KSButton } from "../../components/ui";

const PendingApprovalPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="text-amber-500" size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Under Review</h1>
        <p className="text-slate-500 mb-8">
          Thank you for registering with KisanSeeva! We've received your details and documents. Our admin team will review them shortly.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">What happens next?</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span>We verify your identity (Aadhaar & Selfie).</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span>We verify your machinery details (if Provider).</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span>You receive an email/SMS once approved.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <KSButton onClick={() => navigate("/login")} className="w-full py-3">
            Go to Login Page
          </KSButton>
          <a
            href="mailto:support@kisanseeva.com"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
          >
            <Mail size={16} /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
