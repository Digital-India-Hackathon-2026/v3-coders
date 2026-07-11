import React, { useEffect, useState, useCallback } from "react";
import { APIProvider, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { X, Navigation, LocateFixed, MapPin, Loader } from "lucide-react";
import API from "../../services/api";
import { KSButton } from "../ui";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string || "DEMO_MAP_ID";

interface LatLng { lat: number; lng: number; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  role: "farmer" | "provider";
}

// Inner component that has access to the map instance
const MapMarkers: React.FC<{
  farmLocation: LatLng | null;
  providerLocation: LatLng | null;
  userLocation: LatLng | null;
}> = ({ farmLocation, providerLocation, userLocation }) => {
  const map = useMap();
  const markerLib = useMapsLibrary("marker");

  useEffect(() => {
    if (!map || !markerLib) return;
    const { AdvancedMarkerElement } = markerLib as any;
    if (!AdvancedMarkerElement) return;

    const markers: any[] = [];

    // Farm marker — green with 🌾
    if (farmLocation) {
      const el = document.createElement("div");
      el.style.cssText = `
        background: #16a34a; color: white; font-size: 22px;
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
        width: 44px; height: 44px; display: flex; align-items: center;
        justify-content: center; border: 3px solid #15803d;
        box-shadow: 0 4px 12px rgba(22,163,74,0.5);
        cursor: pointer;
      `;
      const inner = document.createElement("span");
      inner.style.transform = "rotate(45deg)";
      inner.textContent = "🌾";
      el.appendChild(inner);

      const m = new AdvancedMarkerElement({ map, position: farmLocation, content: el, title: "Farm Location" });
      markers.push(m);
    }

    // Provider / tractor marker — blue with 🚜
    if (providerLocation) {
      const el = document.createElement("div");
      el.style.cssText = `
        background: #2563eb; color: white; font-size: 22px;
        border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
        width: 44px; height: 44px; display: flex; align-items: center;
        justify-content: center; border: 3px solid #1d4ed8;
        box-shadow: 0 4px 12px rgba(37,99,235,0.5);
        cursor: pointer;
      `;
      const inner = document.createElement("span");
      inner.style.transform = "rotate(45deg)";
      inner.textContent = "🚜";
      el.appendChild(inner);

      const m = new AdvancedMarkerElement({ map, position: providerLocation, content: el, title: "Service Provider" });
      markers.push(m);
    }

    // User's current position marker — pulsing blue dot
    if (userLocation && !providerLocation) {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 20px; height: 20px; border-radius: 50%;
        background: #3b82f6; border: 3px solid white;
        box-shadow: 0 0 0 6px rgba(59,130,246,0.25);
        animation: pulse 2s infinite;
      `;
      const m = new AdvancedMarkerElement({ map, position: userLocation, content: el, title: "Your Location" });
      markers.push(m);
    }

    return () => markers.forEach(m => { m.map = null; });
  }, [map, markerLib, farmLocation, providerLocation, userLocation]);

  // Pan & zoom to most relevant location
  useEffect(() => {
    if (!map) return;
    const target = providerLocation || farmLocation || userLocation;
    if (target) {
      map.panTo(target);
      map.setZoom(18);
    }
  }, [map, farmLocation, providerLocation, userLocation]);

  return null;
};

const LiveTrackingModal: React.FC<Props> = ({ isOpen, onClose, bookingId, role }) => {
  const [farmLocation, setFarmLocation] = useState<LatLng | null>(null);
  const [providerLocation, setProviderLocation] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapError, setMapError] = useState(false);

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
    } catch (err) {
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

  const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India fallback
  const initialCenter = userLocation || farmLocation || providerLocation || defaultCenter;
  const initialZoom = userLocation || farmLocation || providerLocation ? 18 : 5;

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
              ? <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" /> Provider is en route — map auto‑refreshes every 10 s</>
              : <><MapPin size={13} /> Waiting for provider to start their journey and share location...</>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-2 text-sm font-semibold border-b border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {gpsLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader className="animate-spin" size={32} />
                <p className="text-sm font-semibold">Getting your current location…</p>
              </div>
            </div>
          )}
          <APIProvider
            apiKey={GOOGLE_MAPS_KEY}
            onLoad={() => setMapError(false)}
            onError={() => setMapError(true)}
          >
            {mapError ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-50">
                <div className="text-5xl">🗺️</div>
                <div className="text-center">
                  <p className="font-bold text-slate-700 text-lg">Maps could not load</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    The Google Maps API key is not authorized for this URL.
                    Add <code className="bg-slate-200 px-1 rounded text-xs">http://localhost:5173/*</code> to your
                    key's HTTP referrers in Google Cloud Console.
                  </p>
                </div>
              </div>
            ) : (
              <Map
                defaultCenter={initialCenter}
                defaultZoom={initialZoom}
                gestureHandling="greedy"
                mapId={GOOGLE_MAPS_MAP_ID}
                style={{ width: "100%", height: "100%" }}
              >
                <MapMarkers
                  farmLocation={farmLocation}
                  providerLocation={providerLocation}
                  userLocation={userLocation}
                />
              </Map>
            )}
          </APIProvider>
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
