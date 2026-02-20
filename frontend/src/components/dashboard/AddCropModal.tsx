import { useState } from "react";
import { api, CreateCropInput, Crop } from "../../api/client";

const SOIL_OPTIONS = [
  { value: "black", label: "Black" },
  { value: "red", label: "Red" },
  { value: "alluvial", label: "Alluvial" },
  { value: "laterite", label: "Laterite" },
  { value: "clay", label: "Clay" },
  { value: "sandy", label: "Sandy" },
  { value: "loam", label: "Loam" },
];

const SEASON_OPTIONS: Array<{ value: "kharif" | "rabi" | "zaid"; label: string }> = [
  { value: "kharif", label: "Kharif" },
  { value: "rabi", label: "Rabi" },
  { value: "zaid", label: "Zaid" },
];

interface Props {
  token: string;
  onClose: () => void;
  onSuccess: (crop: Crop) => void;
}

export default function AddCropModal({ token, onClose, onSuccess }: Props) {
  const [name, setName] = useState("My Field");
  const [landArea, setLandArea] = useState("");
  const [soilType, setSoilType] = useState("alluvial");
  const [location, setLocation] = useState("Hyderabad");
  const [season, setSeason] = useState<"kharif" | "rabi" | "zaid">("kharif");
  const [waterAvailability, setWaterAvailability] = useState<"low" | "medium" | "high">("medium");
  const [investmentLevel, setInvestmentLevel] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const area = parseFloat(landArea);
    if (isNaN(area) || area <= 0 || area > 1000) {
      setError("Please enter a valid land area (0–1000 acres).");
      return;
    }
    if (!location.trim()) {
      setError("Please enter your location.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data: CreateCropInput = {
        name: name.trim() || "My Field",
        land_area_acres: area,
        soil_type: soilType,
        location: location.trim(),
        season,
        water_availability: waterAvailability,
        investment_level: investmentLevel,
      };
      const crop = await api.crops.create(token, data);
      onSuccess(crop);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto glass-panel rounded-t-3xl sm:rounded-3xl border-gray-200 animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 glass-panel-light rounded-t-3xl border-b border-gray-200 px-6 py-5 flex items-center justify-between z-10">
          <h2 className="font-display font-extrabold text-xl text-gray-900">Add Field (AI Recommend)</h2>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-gray-100 text-gray-600 min-w-[44px] min-h-[44px] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Field name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Field"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Land area (acres)</label>
            <input
              type="number"
              value={landArea}
              onChange={(e) => setLandArea(e.target.value)}
              placeholder="e.g. 2"
              min={0.1}
              max={1000}
              step={0.1}
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Soil type</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="glass-input"
            >
              {SOIL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hyderabad"
              className="glass-input"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as "kharif" | "rabi" | "zaid")}
              className="glass-input"
            >
              {SEASON_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Water availability</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWaterAvailability(w)}
                  className={`flex-1 py-4 rounded-2xl text-sm font-bold min-h-[48px] transition-all ${
                    waterAvailability === w
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md"
                      : "glass-card border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Investment level</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInvestmentLevel(i)}
                  className={`flex-1 py-4 rounded-2xl text-sm font-bold min-h-[48px] transition-all ${
                    investmentLevel === i
                      ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md"
                      : "glass-card border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            AI will recommend top 3 crops and automatically create your plan using the best option.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md disabled:opacity-60 min-h-[56px] border border-green-300 hover:shadow-lg transition-all active:scale-95"
          >
            {loading ? "Generating..." : "Get AI Recommendation"}
          </button>
        </form>
      </div>
    </div>
  );
}
