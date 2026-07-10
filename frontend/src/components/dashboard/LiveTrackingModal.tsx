import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { X, Navigation, LocateFixed } from "lucide-react";
import API from "../../services/api";
import { KSModal, KSButton } from "../ui";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const tractorIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3211/3211414.png", // Free tractor icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const farmIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3004/3004128.png", // Free farm icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  role: "farmer" | "provider";
}

// Component to recenter map
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

const LiveTrackingModal: React.FC<Props> = ({ isOpen, onClose, bookingId, role }) => {
  const [farmLocation, setFarmLocation] = useState<[number, number] | null>(null);
  const [providerLocation, setProviderLocation] = useState<[number, number] | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Fetch initial booking locations
  const fetchLocations = async () => {
    try {
      const res = await API.get(`/bookings/${bookingId}/location`);
      const data = res.data.locationData;
      if (data.farm_lat && data.farm_lng) {
        setFarmLocation([parseFloat(data.farm_lat), parseFloat(data.farm_lng)]);
      }
      if (data.provider_lat && data.provider_lng) {
        setProviderLocation([parseFloat(data.provider_lat), parseFloat(data.provider_lng)]);
      }
    } catch (err) {
      console.error("Failed to fetch location", err);
      setError("Could not load tracking data.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    } else {
      // Clean up watch when closed
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setIsBroadcasting(false);
      }
    }
  }, [isOpen, bookingId]);

  // Polling for Farmer to see Provider's live location
  useEffect(() => {
    let interval: any;
    if (isOpen && role === "farmer") {
      interval = setInterval(fetchLocations, 10000); // Poll every 10 seconds
    }
    return () => clearInterval(interval);
  }, [isOpen, role]);

  // Start broadcasting location (Provider)
  const toggleBroadcast = () => {
    if (isBroadcasting && watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsBroadcasting(false);
    } else {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        return;
      }
      
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setProviderLocation([lat, lng]);
          
          try {
            await API.put(`/bookings/${bookingId}/location`, { lat, lng });
          } catch (err) {
            console.error("Failed to update broadcast location", err);
          }
        },
        (err) => {
          setError("Failed to access GPS location.");
          setIsBroadcasting(false);
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      setWatchId(id);
      setIsBroadcasting(true);
      setError("");
    }
  };

  if (!isOpen) return null;

  const defaultCenter: [number, number] = [20.5937, 78.9629]; // Center of India
  const mapCenter = providerLocation || farmLocation || defaultCenter;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {role === "provider" ? "Broadcast Location to Farmer" : "Live Provider Tracking"}
            </h2>
            <p className="text-sm text-slate-500">Booking ID: KS-{bookingId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 text-sm font-semibold border-b border-red-100">
            {error}
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative z-0">
          <MapContainer center={mapCenter} zoom={farmLocation || providerLocation ? 14 : 5} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {farmLocation && (
              <Marker position={farmLocation} icon={farmIcon}>
                <Popup>
                  <strong>Farm Location</strong><br/>This is the destination.
                </Popup>
              </Marker>
            )}
            {providerLocation && (
              <Marker position={providerLocation} icon={tractorIcon}>
                <Popup>
                  <strong>Service Provider</strong><br/>
                  {role === "provider" ? "You are here" : "Arriving soon"}
                </Popup>
              </Marker>
            )}
            <MapUpdater center={mapCenter} />
          </MapContainer>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="text-sm">
            {role === "farmer" && (
              providerLocation ? (
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <Navigation size={16} className="animate-pulse" /> Provider is on the way (Live)
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Provider has not started broadcasting location yet.</span>
              )
            )}
            {role === "provider" && (
              <span className="text-slate-600 font-medium">
                {isBroadcasting ? "You are currently sharing your location." : "Start sharing location when you begin your journey."}
              </span>
            )}
          </div>

          <div>
            {role === "provider" && (
              <KSButton 
                onClick={toggleBroadcast} 
                className={`gap-2 ${isBroadcasting ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {isBroadcasting ? (
                  <>Stop Broadcasting <X size={16} /></>
                ) : (
                  <>Start Journey <LocateFixed size={16} /></>
                )}
              </KSButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingModal;
