import { useState, useEffect } from "react";
import { Cloud, CloudRain, Sun, Wind, MapPin, Loader2, AlertCircle } from "lucide-react";

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
}

const weatherCodeMap: Record<number, { text: string; icon: JSX.Element }> = {
  0: { text: "Clear sky", icon: <Sun className="text-yellow-500" size={32} /> },
  1: { text: "Mainly clear", icon: <Sun className="text-yellow-500" size={32} /> },
  2: { text: "Partly cloudy", icon: <Cloud className="text-slate-400" size={32} /> },
  3: { text: "Overcast", icon: <Cloud className="text-slate-500" size={32} /> },
  45: { text: "Fog", icon: <Cloud className="text-slate-400" size={32} /> },
  48: { text: "Depositing rime fog", icon: <Cloud className="text-slate-400" size={32} /> },
  51: { text: "Light drizzle", icon: <CloudRain className="text-blue-400" size={32} /> },
  53: { text: "Moderate drizzle", icon: <CloudRain className="text-blue-400" size={32} /> },
  55: { text: "Dense drizzle", icon: <CloudRain className="text-blue-500" size={32} /> },
  61: { text: "Slight rain", icon: <CloudRain className="text-blue-400" size={32} /> },
  63: { text: "Moderate rain", icon: <CloudRain className="text-blue-500" size={32} /> },
  65: { text: "Heavy rain", icon: <CloudRain className="text-blue-600" size={32} /> },
  71: { text: "Slight snow", icon: <Cloud className="text-slate-300" size={32} /> },
  73: { text: "Moderate snow", icon: <Cloud className="text-slate-300" size={32} /> },
  75: { text: "Heavy snow", icon: <Cloud className="text-slate-300" size={32} /> },
  95: { text: "Thunderstorm", icon: <CloudRain className="text-indigo-500" size={32} /> },
};

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationName, setLocationName] = useState<string>("Locating...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Fetch Weather
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          if (!weatherRes.ok) throw new Error("Failed to fetch weather");
          const weatherData = await weatherRes.json();
          setWeather(weatherData.current_weather);

          // Reverse Geocoding (using a free API like OpenStreetMap Nominatim)
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            const city =
              geoData.address.city ||
              geoData.address.town ||
              geoData.address.village ||
              geoData.address.county ||
              "Unknown Location";
            setLocationName(city);
          } else {
            setLocationName("Current Location");
          }
        } catch (err: any) {
          setError(err.message || "Could not fetch weather data");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        setError(
          geoError.code === 1
            ? "Location permission denied"
            : "Could not get your location"
        );
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center h-32">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-medium">Fetching local weather...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-center justify-center h-32">
        <div className="flex flex-col items-center gap-2 text-red-500 text-center">
          <AlertCircle size={24} />
          <span className="text-sm font-medium">{error}</span>
          <span className="text-xs opacity-80">Enable location access for weather</span>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const weatherDetails = weatherCodeMap[weather.weathercode] || {
    text: "Unknown",
    icon: <Sun size={32} />,
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100/50 shadow-sm flex items-center justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-blue-800 font-semibold mb-1">
          <MapPin size={16} />
          <span className="text-sm">{locationName}</span>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-black text-slate-800 tracking-tighter">
            {Math.round(weather.temperature)}°C
          </span>
          <div className="mb-1 flex flex-col">
            <span className="text-sm font-bold text-slate-700">{weatherDetails.text}</span>
            <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <Wind size={12} /> {weather.windspeed} km/h
            </div>
          </div>
        </div>
      </div>
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
        {weatherDetails.icon}
      </div>
    </div>
  );
}

export default WeatherWidget;
