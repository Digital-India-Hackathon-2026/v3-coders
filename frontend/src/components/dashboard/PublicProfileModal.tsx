import { useState, useEffect } from "react";
import { Star, Phone, MapPin, Tractor, Wrench, Loader2, X, Award } from "lucide-react";
import API from "../../services/api";

interface PublicProfile {
  id: number;
  name: string;
  phone: string;
  role: string;
  extraInfo: string;
  address_city: string;
  address_state: string;
  documents?: { selfie?: string };
  created_at: string;
}

interface Review {
  rating: number;
  feedback: string | null;
  booking_date: string;
  reviewer_name: string;
  service_name?: string;
}

interface Service {
  id: number;
  name: string;
  type: string;
  price_per_hour: string;
  pricing_model?: string;
  description: string;
}

interface Props {
  userId: number | null;
  onClose: () => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={14} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} />
      ))}
    </div>
  );
}

export default function PublicProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [avgRating, setAvgRating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    API.get(`/auth/user/${userId}/public`)
      .then((res) => {
        setProfile(res.data.user);
        setReviews(res.data.reviews || []);
        setServices(res.data.services || []);
        setAvgRating(res.data.avgRating);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-extrabold text-slate-800">Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-green-600" size={32} />
          </div>
        ) : !profile ? (
          <div className="p-8 text-center text-slate-400">Profile not found.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              {profile.documents?.selfie ? (
                <img src={profile.documents.selfie} alt="selfie" className="w-20 h-20 rounded-2xl object-cover border-2 border-green-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-extrabold">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">{profile.name}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  profile.role === 'provider' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {profile.role === 'provider' ? '🚜 Service Provider' : '🌾 Farmer'}
                </span>
                {avgRating && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <StarRating rating={Math.round(parseFloat(avgRating))} />
                    <span className="text-sm font-bold text-slate-700">{avgRating}</span>
                    <span className="text-xs text-slate-400">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact & Location */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-green-600 shrink-0" />
                <span className="font-semibold text-slate-700">{profile.phone}</span>
              </div>
              {(profile.address_city || profile.address_state) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-orange-500 shrink-0" />
                  <span className="text-slate-600">{[profile.address_city, profile.address_state].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {profile.extraInfo && (
                <div className="flex items-start gap-2 text-sm">
                  <Award size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 leading-relaxed">{profile.extraInfo}</span>
                </div>
              )}
            </div>

            {/* Services (Provider only) */}
            {services.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5"><Tractor size={16} /> Available Services</h4>
                <div className="space-y-2">
                  {services.map((s) => (
                    <div key={s.id} className="flex justify-between items-center bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{s.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-green-700">
                          ₹{parseFloat(s.price_per_hour).toLocaleString('en-IN')}
                          {s.pricing_model === 'fixed' ? ' (Fixed)' : '/hr'}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.pricing_model === 'fixed' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {s.pricing_model === 'fixed' ? 'Fixed' : 'Hourly'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5"><Star size={16} className="text-yellow-500" /> Reviews</h4>
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{r.reviewer_name}</p>
                          {r.service_name && <p className="text-xs text-slate-400">{r.service_name}</p>}
                        </div>
                        <StarRating rating={r.rating} />
                      </div>
                      {r.feedback && <p className="text-sm text-slate-600 mt-2 leading-relaxed italic">"{r.feedback}"</p>}
                      <p className="text-xs text-slate-400 mt-2">{new Date(r.booking_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviews.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No reviews yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
