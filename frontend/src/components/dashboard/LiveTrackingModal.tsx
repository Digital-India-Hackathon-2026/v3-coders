import React, { useEffect, useState, useCallback } from "react";
import { X, Navigation, LocateFixed, MapPin, Loader } from "lucide-react";
import API from "../../services/api";
import { KSButton } from "../ui";

interface LatLng { lat: number; lng: number; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  role: "farmer" | "provider";
}

const LiveTrackingModal: React.FC<Props> = ({ isOpen, onClose, bookingId, role }) => {
  const [farmLocation, setFarmLocation] = useState<LatLng | null>(null);
  const [providerLocation, setProviderLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  // Get user's current location on open
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        () => setGpsLoading(false),
        { enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await API.get(`/bookings/${bookingId}/location`);
      const data = res.data.locationData;
      if (data.farm_lat && data.farm_lng) {
        setFarmLocation({ lat: parseFloat(data.farm_lat), lng: parseFloat(data.farm_lng) });
      }
      if (data.provider_lat && data.provider_lng) {
        setProviderLocation({ lat: parseFloat(data.provider_lat), lng: parseFloat(data.provider_lng) });
      }
    } catch {
      setError("Could not load tracking data.");
    }
  }, [bookingId]);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    } else {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setIsBroadcasting(false);
      }
      setFarmLocation(null);
      setProviderLocation(null);
      setUserLocation(null);
      setError("");
    }
  }, [isOpen]);

  // Farmer polls provider location every 10 seconds
  useEffect(() => {
    if (!isOpen || role !== "farmer") return;
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, [isOpen, role, fetchLocations]);

  const toggleBroadcast = () => {
    if (isBroadcasting && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsBroadcasting(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setProviderLocation({ lat, lng });
        setUserLocation({ lat, lng });
        try {
          await API.put(`/bookings/${bookingId}/location`, { lat, lng });
        } catch {
          console.error("Failed to push location to server");
        }
      },
      () => {
        setError("GPS access denied. Please allow location permissions.");
        setIsBroadcasting(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    setWatchId(id);
    setIsBroadcasting(true);
    setError("");
  };

  if (!isOpen) return null;

  // Choose which location to center the map on
  const mapCenter = providerLocation || farmLocation || userLocation;

  // Build OpenStreetMap embed URL with markers
  const buildMapUrl = () => {
    if (!mapCenter) return null;
    const { lat, lng } = mapCenter;
    const delta = 0.01;
    const bbox = `${(lng - delta).toFixed(6)}%2C${(lat - delta).toFixed(6)}%2C${(lng + delta).toFixed(6)}%2C${(lat + delta).toFixed(6)}`;
    // Show provider location as the marker (most relevant), fallback to farm
    const markerLoc = providerLocation || farmLocation;
    const markerParam = markerLoc ? `&marker=${markerLoc.lat.toFixed(6)}%2C${markerLoc.lng.toFixed(6)}` : "";
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${markerParam}`;
  };

  const mapUrl = buildMapUrl();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col" style={{ height: "88vh" }}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${role === "provider" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-700"}`}>
              <Navigation size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {role === "provider" ? "Share Your Location" : "Track Service Provider"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Booking ID: KS-{bookingId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Status Bar */}
        <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
          isBroadcasting
            ? "bg-blue-50 text-blue-700 border-blue-100"
            : providerLocation && role === "farmer"
            ? "bg-green-50 text-green-700 border-green-100"
            : "bg-amber-50 text-amber-700 border-amber-100"
        }`}>
          {role === "provider" ? (
            isBroadcasting
              ? <><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" /> Live — broadcasting your GPS to the farmer every few seconds</>
              : <><MapPin size={13} /> Press "Start Journey" to begin sharing your real-time location with the farmer</>
          ) : (
            providerLocation
              ? <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" /> Provider is en route — map auto‑refreshes every 10 s</>
              : <><MapPin size={13} /> Waiting for provider to start their journey and share location...</>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-2 text-sm font-semibold border-b border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-100">
          {gpsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader className="animate-spin" size={32} />
                <p className="text-sm font-semibold">Getting your current location…</p>
              </div>
            </div>
          )}

          {mapUrl ? (
            <iframe
              key={`${providerLocation?.lat}-${providerLocation?.lng}`}
              title="Live Location Map"
              src={mapUrl}
              style={{ border: 0, width: "100%", height: "100%" }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
              <div className="text-5xl">🗺️</div>
              <div className="text-center">
                <p className="font-bold text-slate-700 text-lg">Waiting for location data</p>
                <p className="text-sm text-slate-500 mt-1 max-w-xs">
                  {role === "provider"
                    ? "Click \"Start Journey\" to begin broadcasting your location."
                    : "The map will appear once the provider shares their location."}
                </p>
              </div>
              {/* Coordinates info panels */}
              <div className="flex gap-3 mt-2 text-xs">
                {farmLocation && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-green-700 font-semibold">
                    🌾 Farm: {farmLocation.lat.toFixed(4)}, {farmLocation.lng.toFixed(4)}
                  </div>
                )}
                {userLocation && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-blue-700 font-semibold">
                    📍 You: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend & Controls */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {userLocation && !providerLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow inline-block" />
                Your Location
              </span>
            )}
            {farmLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> 🌾 Farm Destination
              </span>
            )}
            {providerLocation && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> 🚜 Provider Location
              </span>
            )}
            <span className="text-slate-400 italic">Powered by OpenStreetMap</span>
          </div>

          <div className="flex gap-3">
            <KSButton variant="outline" onClick={onClose} className="px-5 py-2 text-sm">
              Close
            </KSButton>
            {role === "provider" && (
              <KSButton
                onClick={toggleBroadcast}
                className={`gap-2 px-5 py-2 text-sm border-0 font-bold ${
                  isBroadcasting
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {isBroadcasting
                  ? <><X size={14} /> Stop Sharing</>
                  : <><LocateFixed size={14} /> Start Journey</>
                }
              </KSButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingModal;
