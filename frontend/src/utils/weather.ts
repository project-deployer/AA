const WEATHER_KEY = import.meta.env.VITE_WEATHER_API_KEY || "";

export interface WeatherInfo {
  temp: string;
  condition: string;
  icon: string;
}

export async function fetchWeatherByCoords(lat: number, lon: number): Promise<WeatherInfo | null> {
  if (!WEATHER_KEY) return null;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const temp = Math.round(j.main.temp) + "°C";
    const condition = j.weather?.[0]?.main || "";
    const icon = j.weather?.[0]?.icon ? `https://openweathermap.org/img/wn/${j.weather[0].icon}@2x.png` : "";
    return { temp, condition, icon };
  } catch (e) {
    return null;
  }
}
