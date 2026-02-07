import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, Crop, PlanResponse } from "../../api/client";
import { getCropImageUrl } from "../../utils/cropImages";
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
  const [loading, setLoading] = useState(false);

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

  // attempt to fetch real-time weather by geolocation and override plan.weather
  useEffect(() => {
    let mounted = true;
    async function loadWeather() {
      if (!("geolocation" in navigator)) return;
      try {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          if (!mounted) return;
          const w = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
          if (!mounted || !w) return;
          setPlan((p) => (p ? { ...p, weather: w } : p));
        });
      } catch {}
    }
    loadWeather();
    return () => {
      mounted = false;
    };
  }, []);

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
              <img
                src={getCropImageUrl(crop?.crop_name ?? plan.crop_name)}
                alt={plan.crop_name}
                loading="lazy"
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 ring-2 ring-green-200"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{plan.crop_name}</p>
                <p className="text-sm text-gray-600">Your crop plan</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl glass-card border-gray-200">
              <span className="text-4xl">🌤️</span>
              <div>
                <p className="font-bold text-gray-900 text-lg">{plan.weather.temp}</p>
                <p className="text-sm text-gray-600">{plan.weather.condition}</p>
              </div>
              <div className="ml-auto text-right text-sm text-gray-600">
                <p>{plan.current_date}</p>
                <p>{plan.current_time}</p>
              </div>
            </div>

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
