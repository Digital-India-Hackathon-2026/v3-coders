import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tractor, Droplets, Combine, Sprout, Truck, Sparkles, MapPin, Calendar, CreditCard, User } from "lucide-react";
import { KSCard, KSButton, KSModal } from "../../components/ui";
import API from "../../services/api";

interface Service {
  id: number;
  provider_id: number;
  name: string;
  type: string;
  price_per_hour: string;
  description: string;
  status: string;
  provider_name: string;
  provider_phone: string;
}

const BookService = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState("");
  const [address, setAddress] = useState("");
  const [farmLat, setFarmLat] = useState<number | null>(null);
  const [farmLng, setFarmLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [hours, setHours] = useState("4");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await API.get("/services");
        setServices(res.data.services);
        if (res.data.services.length > 0) {
          setSelectedService(res.data.services[0]);
        }
      } catch (err: any) {
        console.error("Error fetching services", err);
        setError("Unable to load services list. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !date || !address || !hours) {
      alert("Please fill in all required fields.");
      return;
    }
    setIsModalOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedService) return;
    setSubmitting(true);
    try {
      await API.post("/bookings", {
        serviceId: selectedService.id,
        bookingDate: date,
        hoursRequired: parseFloat(hours),
        location: address,
        farmLat,
        farmLng,
      });
      setIsModalOpen(false);
      navigate("/farmer/bookings");
    } catch (err: any) {
      console.error("Booking error", err);
      alert(err.response?.data?.message || "Booking request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to choose icon based on type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "tractor":
        return <Tractor size={32} />;
      case "harvester":
        return <Combine size={32} />;
      case "seeder":
        return <Sprout size={32} />;
      case "sprayer":
        return <Droplets size={32} />;
      default:
        return <Tractor size={32} />;
    }
  };

  const getEstimatedCost = () => {
    if (!selectedService) return 0;
    return parseFloat(selectedService.price_per_hour) * parseFloat(hours || "0");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Book Service</h1>
        <p className="text-slate-500 mt-1">Select the agricultural service you need and enter farm details.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleBooking} className="grid md:grid-cols-3 gap-8">
        {/* Service Type Selection */}
        <div className="md:col-span-2 space-y-6">
          <KSCard>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="text-green-700" size={20} />
              1. Choose Available Service
            </h3>
            {services.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No services are currently listed on the platform.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between h-44 ${
                      selectedService?.id === service.id
                        ? "border-green-700 bg-green-50/50"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2.5 rounded-xl ${
                        selectedService?.id === service.id ? "bg-green-700 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {getTypeIcon(service.type)}
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ₹{parseFloat(service.price_per_hour).toLocaleString("en-IN")}/hr
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mt-2 line-clamp-1">{service.name}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <User size={12} /> Provider: {service.provider_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </KSCard>

          {/* Details Form */}
          <KSCard className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <MapPin className="text-green-700" size={20} />
              2. Service Location & Schedule
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Preferred Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hours Required</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  min="1"
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Full Farm Address</label>
                <button
                  type="button"
                  onClick={() => {
                    setLocating(true);
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setFarmLat(pos.coords.latitude);
                        setFarmLng(pos.coords.longitude);
                        setLocating(false);
                        alert("Farm location captured successfully! 📍");
                      },
                      (err) => {
                        setLocating(false);
                        alert("Could not get location. Please ensure location services are enabled.");
                      }
                    );
                  }}
                  disabled={locating}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <MapPin size={12} /> {locating ? "Locating..." : "Pinpoint Current Location"}
                </button>
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Village name, Mandi road, Landmark description..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition"
                required
              />
              {farmLat && farmLng && (
                <p className="text-xs text-green-600 mt-2 font-semibold">
                  ✓ Exact farm coordinates attached: {farmLat.toFixed(5)}, {farmLng.toFixed(5)}
                </p>
              )}
            </div>
          </KSCard>
        </div>

        {/* Summary Card */}
        <div className="space-y-6">
          <KSCard className="sticky top-24 bg-gradient-to-b from-slate-50 to-white">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CreditCard className="text-green-700" size={20} />
              Booking Summary
            </h3>
            
            <div className="space-y-3 text-sm text-slate-600 border-b border-slate-100 pb-4">
              <div className="flex justify-between">
                <span>Service Selected:</span>
                <span className="font-bold text-slate-800">{selectedService?.name || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-semibold text-slate-800">{selectedService?.provider_name || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Date:</span>
                <span className="font-semibold text-slate-800">{date || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-semibold text-slate-800">{hours} Hours</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center mb-6">
              <span className="font-bold text-slate-800">Estimated Cost:</span>
              <span className="text-2xl font-extrabold text-green-700">
                ₹{getEstimatedCost().toLocaleString("en-IN")}
              </span>
            </div>

            <KSButton type="submit" className="w-full justify-center" disabled={!selectedService}>
              Proceed to Book
            </KSButton>
          </KSCard>
        </div>
      </form>

      {/* Confirmation Modal */}
      <KSModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Booking Request">
        <div className="space-y-4">
          <p className="text-slate-600">
            Your booking request for <span className="font-bold text-slate-800">{selectedService?.name}</span> will be submitted to provider <span className="font-bold text-slate-800">{selectedService?.provider_name}</span>.
          </p>
          <div className="bg-slate-50 p-4 rounded-2xl text-sm space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-400">Date:</span>
              <span className="font-semibold text-slate-800">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Duration:</span>
              <span className="font-semibold text-slate-800">{hours} Hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Cost:</span>
              <span className="font-bold text-green-700">₹{getEstimatedCost().toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">{address}</span>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <KSButton variant="outline" className="w-1/2 justify-center" disabled={submitting} onClick={() => setIsModalOpen(false)}>
              Cancel
            </KSButton>
            <KSButton className="w-1/2 justify-center" disabled={submitting} onClick={confirmBooking}>
              {submitting ? "Booking..." : "Confirm"}
            </KSButton>
          </div>
        </div>
      </KSModal>
    </div>
  );
};

export default BookService;
