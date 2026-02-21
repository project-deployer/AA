const API_BASE = "/api";

export type ApiError = { detail?: string; message?: string };

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as ApiError;
    throw new Error(err.detail || err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    verify: (idToken: string, payload?: { phone?: string; email?: string; display_name?: string }) =>
      request<{ success: boolean; farmer_id: number }>("/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          id_token: idToken,
          ...payload,
        }),
      }),
  },
  crops: {
    list: (token: string) =>
      request<Crop[]>("/crops", { headers: { Authorization: `Bearer ${token}` } }),
    create: (token: string, data: CreateCropInput) =>
      request<Crop>("/crops", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    update: (token: string, id: number, data: Partial<CreateCropInput>) =>
      request<Crop>(`/crops/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    delete: (token: string, id: number) =>
      request<{ success: boolean }>(`/crops/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    score: (token: string, id: number) =>
      request<CropRecommendationItem>(`/crops/${id}/score`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
  chat: {
    send: (token: string, fieldId: number, content: string) =>
      request<ChatResponse>("/chat", {
        method: "POST",
        body: JSON.stringify({ field_id: fieldId, content }),
        headers: { Authorization: `Bearer ${token}` },
      }),
    history: (token: string, fieldId: number) =>
      request<ChatMessage[]>(`/chat/${fieldId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
  plan: {
    get: (token: string, fieldId: number, cropName?: string, month?: number) => {
      const params = new URLSearchParams();
      if (cropName) params.set("crop_name", cropName);
      if (month && month > 0) params.set("month", String(month));
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<PlanResponse>(`/plan/${fieldId}${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
  },
  recommend: {
    generate: (token: string, data: RecommendInput) =>
      request<RecommendResponse>("/recommend", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${token}` },
      }),
    history: (token: string, fieldId?: number) =>
      request<RecommendationHistoryItem[]>(`/recommend/history${fieldId ? `?field_id=${fieldId}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
  weather: {
    byLocation: (token: string, location: string) =>
      request<WeatherResponse>(`/weather/${encodeURIComponent(location)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
  },
};

export interface CreateCropInput {
  name?: string;
  land_area_acres: number;
  soil_type: string;
  crop_name?: string;
  location: string;
  season: "kharif" | "rabi" | "zaid";
  water_availability: "low" | "medium" | "high";
  investment_level: "low" | "medium" | "high";
}

export interface DayPlanItem {
  day: number;
  date: string;
  title: string;
  description: string;
  icon: string;
  image_url?: string;
}

export interface CropPlan {
  crop_name: string;
  duration_days: number;
  estimated_cost: number;
  expected_yield: string;
  estimated_profit: number;
  fertilizer_recommendations: string[];
  irrigation_guidance: string;
  monthly_plans: MonthlyPlanItem[];
  day_plan: DayPlanItem[];
}

export interface MonthlyPlanItem {
  month_number: number;
  month_label: string;
  focus: string;
  day_plan: DayPlanItem[];
}

export interface Crop {
  id: number;
  name: string;
  land_area_acres: number;
  soil_type: string;
  crop_name: string;
  water_availability: string;
  investment_level: string;
  created_at: string;
  plan: CropPlan | null;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface PlanResponse {
  crop_name: string;
  weather: { temp: string; condition: string; icon: string };
  current_date: string;
  current_time: string;
  duration_progress: number;
  plan: CropPlan;
}

export interface WeatherResponse {
  location: string;
  temperature_c: number;
  rainfall_mm: number;
  condition: string;
  source: string;
}

export interface CropRecommendationItem {
  crop_name: string;
  suitability_score: number;
  risk_score: "Low" | "Medium" | "High";
  expected_yield_estimation: string;
  estimated_investment_cost: number;
  estimated_profit_min: number;
  estimated_profit_max: number;
}

export interface RecommendInput {
  soil_type: string;
  area_acres: number;
  location: string;
  season: "kharif" | "rabi" | "zaid";
  water_availability: "low" | "medium" | "high";
  investment_level: "low" | "medium" | "high";
  field_id?: number;
}

export interface RecommendResponse {
  recommendation_id: number;
  weather: WeatherResponse;
  recommendations: CropRecommendationItem[];
}

export interface RecommendationHistoryItem {
  id: number;
  field_id: number | null;
  soil_type: string;
  area_acres: number;
  location: string;
  season: string;
  water_availability: string;
  investment_level: string;
  weather: WeatherResponse | null;
  recommendations: CropRecommendationItem[];
  created_at: string;
}
