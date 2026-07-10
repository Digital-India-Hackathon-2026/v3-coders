import React, { useState, useEffect } from "react";
import { User, Phone, ShieldCheck, Tractor, Briefcase } from "lucide-react";
import { KSCard, KSButton, KSBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const ProviderProfile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setBusinessName(user.name);
      setPhone(user.phone);
      setExtraInfo(user.extraInfo || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !phone) {
      setError("Business name and contact phone are required.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await updateUserProfile({
        name: businessName,
        phone,
        extraInfo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Business Profile</h1>
        <p className="text-slate-500 mt-1">Configure your agency details, service radius, and verify identity.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-2">
            <ShieldCheck size={20} />
            <span className="font-semibold">Business profile details updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="grid gap-6">
          {/* Business Info */}
          <KSCard className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Briefcase className="text-yellow-600" size={20} />
              Agency Information
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition text-sm"
                required
              />
            </div>
          </KSCard>

          {/* Logistics / Operations */}
          <KSCard className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Tractor className="text-yellow-600" size={20} />
              Machinery Capabilities & Details
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Fleet details, models, and service range</label>
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Enter tractor/harvester models, plate numbers, and typical daily availability."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition text-sm"
              />
            </div>

            <div className="pt-2">
              <p className="text-sm font-semibold text-slate-700 mb-2">Verification Status</p>
              <KSBadge variant="success">
                <ShieldCheck size={14} /> Verified Provider
              </KSBadge>
            </div>
          </KSCard>
        </div>

        <div className="flex justify-end">
          <KSButton type="submit" disabled={submitting} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold border-0 px-8">
            {submitting ? "Saving..." : "Save Business Profile"}
          </KSButton>
        </div>
      </form>
    </div>
  );
};

export default ProviderProfile;
