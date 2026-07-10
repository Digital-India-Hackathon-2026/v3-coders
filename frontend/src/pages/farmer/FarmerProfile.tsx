import React, { useState, useEffect } from "react";
import { User, Phone, Sprout, ShieldCheck } from "lucide-react";
import { KSCard, KSButton } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const FarmerProfile = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize fields on load or user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setExtraInfo(user.extraInfo || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError("Name and Phone fields are required.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await updateUserProfile({
        name,
        phone,
        extraInfo,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your farm profile, land details and credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-2xl flex items-center gap-2">
            <ShieldCheck size={20} />
            <span className="font-semibold">Profile details updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl">
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="grid gap-6">
          {/* General Details */}
          <KSCard className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <User className="text-green-700" size={20} />
              Personal Information
            </h3>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
                required
              />
            </div>
          </KSCard>

          {/* Farm Land Details */}
          <KSCard className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sprout className="text-green-700" size={20} />
              Farm & Land Details
            </h3>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Land details and crops cultivated</label>
              <textarea
                value={extraInfo}
                onChange={(e) => setExtraInfo(e.target.value)}
                placeholder="Enter land size (e.g. 5 acres), crop types (e.g. Paddy, Cotton), and location details."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition text-sm"
              />
            </div>
          </KSCard>
        </div>

        <div className="flex justify-end">
          <KSButton type="submit" disabled={submitting} className="px-8">
            {submitting ? "Saving..." : "Save Changes"}
          </KSButton>
        </div>
      </form>
    </div>
  );
};

export default FarmerProfile;
