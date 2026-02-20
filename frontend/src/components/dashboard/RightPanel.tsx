import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, Crop, CropRecommendationItem, PlanResponse, RecommendationHistoryItem, WeatherResponse } from "../../api/client";
import { getCropImageUrl, getCropEmoji } from "../../utils/cropImages";
import { fetchWeatherByCoords } from "../../utils/weather";

interface Props {
  fieldId: number | null;
  crop: Crop | undefined;
}

const ICONS: Record<string, string> = {
  sprout: "🌱",
  water: "💧",
  "shield-check": "🛡️",
};

export default function RightPanel({ fieldId, crop }: Props) {
  const { token } = useAuth();
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [recommendations, setRecommendations] = useState<CropRecommendationItem[]>([]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [cropScore, setCropScore] = useState<CropRecommendationItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [cropImageLoaded, setCropImageLoaded] = useState(false);

  useEffect(() => {
    if (!fieldId || !token) {
      setPlan(null);
      return;
    }
    setLoading(true);
    api.plan
      .get(token, fieldId)
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [fieldId, token]);

  useEffect(() => {
    if (!fieldId || !token) {
      setRecommendations([]);
      setWeather(null);
      setCropScore(null);
      return;
    }

    // Load recommendation history + weather from last recommendation
    api.recommend
      .history(token, fieldId)
      .then((rows: RecommendationHistoryItem[]) => {
        const latest = rows[0];
        setRecommendations(latest?.recommendations || []);
        setWeather(latest?.weather || null);
      })
      .catch(() => {
        setRecommendations([]);
        setWeather(null);
      });

    // Load crop score for selected field
    api.crops
      .score(token, fieldId)
      .then(setCropScore)
      .catch(() => setCropScore(null));
  }, [fieldId, token]);

  // Live weather update via geolocation (runs continuously)
  useEffect(() => {
    let mounted = true;
    let geoWatchId: number | null = null;

    async function setupLiveWeather() {
      if (!token || !("geolocation" in navigator)) return;

      // Request permission and update weather
      geoWatchId = navigator.geolocation.watchPosition(
        async (pos) => {
          if (!mounted || !token) return;
          try {
            // Reverse geocode to get location name, then fetch weather
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            // Use simple lat/lon query to weather API
            const w = await fetchWeatherByCoords(lat, lon);
            if (!mounted || !w) return;

            // Update both plan weather and recommendation weather
            setPlan((p) => (p ? { ...p, weather: w } : p));
            const tempC = Number.parseInt(w.temp.replace("°C", ""), 10) || 28;
            setWeather((prev) =>
              prev
                ? { ...prev, temperature_c: tempC, condition: w.condition }
                : { location: "Current Location", temperature_c: tempC, rainfall_mm: 0, condition: w.condition, source: "geolocation" }
            );
          } catch (err) {
            console.error("Weather update error:", err);
          }
        },
        (err) => {
          console.warn("Geolocation error:", err);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 } // Cache for 5 min
      );
    }

    setupLiveWeather();

    return () => {
      mounted = false;
      if (geoWatchId !== null) {
        navigator.geolocation.clearWatch(geoWatchId);
      }
    };
  }, [token]);

  if (!fieldId) {
    return (
      <aside className="flex flex-col flex-1 glass-panel-light p-6 border-l border-gray-200">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="text-6xl mb-4">📋</div>
          <p className="font-display font-bold text-gray-900">My Plan</p>
          <p className="text-sm">Select a crop to see plan</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col flex-1 min-h-0 glass-panel-light overflow-hidden border-l border-gray-200 dark:border-purple-400/20">
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-5 dark:text-gray-100">
        {loading ? (
          <div className="text-center py-16 text-gray-600 font-medium">Loading plan...</div>
        ) : !plan ? (
          <div className="text-center py-16 text-gray-600 font-medium">No plan</div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              {cropImageLoaded ? (
                <img
                  src={getCropImageUrl(crop?.crop_name ?? plan.crop_name)}
                  alt={plan.crop_name}
                  onLoad={() => setCropImageLoaded(true)}
                  onError={() => setCropImageLoaded(false)}
                  loading="lazy"
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-2 ring-green-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl flex-shrink-0 ring-2 ring-green-200 bg-gradient-to-br from-emerald-200 to-green-200 flex items-center justify-center">
                  <span className="text-2xl">{getCropEmoji(crop?.crop_name ?? plan.crop_name)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{plan.crop_name}</p>
                <p className="text-sm text-gray-600">Your crop plan</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border-gray-200">
              <span className="text-4xl">🌤️</span>
              <div>
                <p className="font-bold text-gray-900 text-lg">
                  {weather ? `${Math.round(weather.temperature_c)}°C` : plan.weather.temp}
                </p>
                <p className="text-sm text-gray-600">{weather?.condition || plan.weather.condition}</p>
                {weather?.rainfall_mm !== undefined && (
                  <p className="text-xs text-gray-500">Rainfall: {weather.rainfall_mm} mm</p>
                )}
              </div>
              <div className="ml-auto text-right text-sm text-gray-600">
                <p>{plan.current_date}</p>
                <p>{plan.current_time}</p>
                {weather?.location && <p className="text-xs">{weather.location}</p>}
              </div>
            </div>

            {cropScore && (
              <div className="p-4 rounded-2xl glass-card border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <p className="text-sm font-bold text-gray-900 mb-1">Crop Suitability Score</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-extrabold text-emerald-700">{cropScore.suitability_score}/100</p>
                  <p className="text-sm font-semibold text-gray-700">Risk: {cropScore.risk_score}</p>
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="p-4 rounded-2xl glass-card border-gray-200">
                <h3 className="font-display font-bold text-gray-900 mb-3">Recommended Crops (Top 3)</h3>
                <div className="space-y-2">
                  {recommendations.map((item, idx) => (
                    <div key={item.crop_name} className="p-3 rounded-xl border border-gray-200 bg-white/70">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900">#{idx + 1} {item.crop_name}</p>
                        <p className="text-sm font-bold text-emerald-700">{item.suitability_score}</p>
                      </div>
                      <p className="text-xs text-gray-600">Risk: {item.risk_score} · Yield: {item.expected_yield_estimation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="p-4 rounded-2xl glass-card border-gray-200">
                <h3 className="font-display font-bold text-gray-900 mb-3">Profit Comparison</h3>
                <div className="space-y-3">
                  {recommendations.map((item) => {
                    const maxProfit = Math.max(...recommendations.map((r) => r.estimated_profit_max));
                    const width = maxProfit > 0 ? Math.round((item.estimated_profit_max / maxProfit) * 100) : 0;
                    return (
                      <div key={`${item.crop_name}-profit`}>
                        <div className="flex justify-between text-xs text-gray-700 mb-1">
                          <span>{item.crop_name}</span>
                          <span>₹{item.estimated_profit_min.toLocaleString()} - ₹{item.estimated_profit_max.toLocaleString()}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl glass-card border-gray-200">
              <p className="text-sm font-bold text-gray-900 mb-2">Progress</p>
              <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-500"
                  style={{ width: `${Math.round(plan.duration_progress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">{plan.plan.duration_days} days total</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl glass-card border-gray-200">
                <p className="text-xs font-semibold text-gray-700 uppercase">Est. Cost</p>
                <p className="font-bold text-gray-900">₹{plan.plan.estimated_cost?.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl glass-card border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <p className="text-xs font-semibold text-green-700 uppercase">Est. Profit</p>
                <p className="font-bold text-green-700">₹{plan.plan.estimated_profit?.toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border-gray-200">
              <p className="text-xs font-semibold text-gray-700 uppercase mb-1">Expected Yield</p>
              <p className="text-sm font-bold text-gray-900">{plan.plan.expected_yield}</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-gray-900 mb-3">Day-to-day Plan</h3>
              <div className="space-y-2">
                {plan.plan.day_plan?.slice(0, 10).map((d) => (
                  <div
                    key={d.day}
                    className="flex gap-4 p-4 rounded-2xl glass-card border-gray-200"
                  >
                    <span className="text-2xl">{ICONS[d.icon] || "📌"}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900">{d.title}</p>
                      <p className="text-xs text-gray-600">{d.date}</p>
                      <p className="text-xs text-gray-700 mt-1">{d.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {plan.plan.fertilizer_recommendations?.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-gray-900 mb-2">Fertilizers</h3>
                <div className="p-4 rounded-2xl glass-card border-gray-200">
                  <ul className="space-y-1">
                    {plan.plan.fertilizer_recommendations.map((f, i) => (
                      <li key={i} className="text-sm font-medium text-gray-800">• {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {plan.plan.irrigation_guidance && (
              <div>
                <h3 className="font-display font-bold text-gray-900 mb-2">Irrigation</h3>
                <p className="text-sm text-gray-800 p-4 rounded-2xl glass-card border-gray-200">
                  {plan.plan.irrigation_guidance}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
