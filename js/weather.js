// SherpaNav - Live Mountain Weather Service (Powered by Open-Meteo Open-Source API)

export class WeatherService {
  constructor() {
    this.cache = new Map();
    this.weatherCodes = {
      0: { text: "Clear Sky", icon: "☀️", color: "text-amber-400" },
      1: { text: "Mainly Clear", icon: "🌤️", color: "text-amber-300" },
      2: { text: "Partly Cloudy", icon: "⛅", color: "text-blue-300" },
      3: { text: "Overcast", icon: "☁️", color: "text-gray-400" },
      45: { text: "Mountain Fog", icon: "🌫️", color: "text-gray-300" },
      48: { text: "Depositing Rime Fog", icon: "🌫️", color: "text-gray-300" },
      51: { text: "Light Drizzle", icon: "🌦️", color: "text-blue-400" },
      53: { text: "Moderate Drizzle", icon: "🌧️", color: "text-blue-500" },
      55: { text: "Dense Drizzle", icon: "🌧️", color: "text-blue-600" },
      61: { text: "Slight Rain", icon: "🌦️", color: "text-blue-400" },
      63: { text: "Moderate Rain", icon: "🌧️", color: "text-blue-500" },
      65: { text: "Heavy Mountain Rain", icon: "⛈️", color: "text-indigo-400" },
      71: { text: "Slight Snowfall", icon: "🌨️", color: "text-cyan-200" },
      73: { text: "Moderate Snowfall", icon: "❄️", color: "text-cyan-300" },
      75: { text: "Heavy Blizzard / Snow", icon: "❄️⚠️", color: "text-cyan-400" },
      77: { text: "Snow Grains", icon: "🌨️", color: "text-cyan-200" },
      80: { text: "Slight Rain Showers", icon: "🌦️", color: "text-blue-400" },
      81: { text: "Moderate Showers", icon: "🌧️", color: "text-blue-500" },
      82: { text: "Violent Showers", icon: "⛈️", color: "text-indigo-500" },
      85: { text: "Slight Snow Showers", icon: "🌨️", color: "text-cyan-200" },
      86: { text: "Heavy Snow Showers", icon: "❄️", color: "text-cyan-300" },
      95: { text: "Thunderstorm", icon: "⚡", color: "text-yellow-400" },
      96: { text: "Thunderstorm with Hail", icon: "⛈️❄️", color: "text-purple-400" }
    };
  }

  getWeatherDescription(code) {
    return this.weatherCodes[code] || { text: "Variable Mountain Climate", icon: "⛅", color: "text-gray-300" };
  }

  async fetchLiveWeather(lat, lon, elevationM = null) {
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    const now = Date.now();

    // Check memory cache (valid for 15 minutes)
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < 15 * 60 * 1000) {
        return cached.data;
      }
    }

    try {
      // Open-Meteo open-source endpoint
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=Asia%2FKathmandu`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather network error');
      const data = await response.json();

      const current = data.current || {};
      const daily = data.daily || {};
      const weatherDesc = this.getWeatherDescription(current.weather_code);

      // Determine mountain alerts
      const alerts = [];
      if (current.apparent_temperature < -5) {
        alerts.push({ type: 'warning', text: 'Sub-zero wind chill! Thermal layers mandatory.' });
      }
      if (current.wind_speed_10m > 35) {
        alerts.push({ type: 'danger', text: 'High mountain wind speeds (>35 km/h). Pass crossing hazard.' });
      }
      if ([71, 73, 75, 85, 86].includes(current.weather_code)) {
        alerts.push({ type: 'info', text: 'Active snowfall recorded along upper ridges.' });
      }

      const weatherResult = {
        stationName: '',
        lat,
        lon,
        elevationM,
        tempC: Math.round(current.temperature_2m),
        apparentTempC: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeedKmh: Math.round(current.wind_speed_10m),
        weatherCode: current.weather_code,
        conditionText: weatherDesc.text,
        icon: weatherDesc.icon,
        iconColor: weatherDesc.color,
        todayMaxC: daily.temperature_2m_max ? Math.round(daily.temperature_2m_max[0]) : null,
        todayMinC: daily.temperature_2m_min ? Math.round(daily.temperature_2m_min[0]) : null,
        sunrise: daily.sunrise ? daily.sunrise[0]?.split('T')[1] : '06:00',
        sunset: daily.sunset ? daily.sunset[0]?.split('T')[1] : '18:00',
        alerts,
        dailyForecast: (daily.time || []).map((date, idx) => ({
          date: date,
          dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          maxC: Math.round(daily.temperature_2m_max[idx]),
          minC: Math.round(daily.temperature_2m_min[idx]),
          code: daily.weather_code[idx],
          desc: this.getWeatherDescription(daily.weather_code[idx]),
          precipProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0
        }))
      };

      this.cache.set(cacheKey, { timestamp: now, data: weatherResult });
      return weatherResult;
    } catch (err) {
      console.warn('Weather fetch fallback triggered:', err);
      // Fallback synthetic mountain approximation if offline
      return {
        lat,
        lon,
        elevationM,
        tempC: elevationM ? Math.round(18 - (elevationM / 1000) * 6.5) : 12,
        apparentTempC: elevationM ? Math.round(15 - (elevationM / 1000) * 7.0) : 10,
        humidity: 60,
        windSpeedKmh: 14,
        conditionText: 'Mild Mountain Breeze (Offline Estimate)',
        icon: '⛅',
        iconColor: 'text-amber-300',
        todayMaxC: 14,
        todayMinC: 2,
        alerts: [{ type: 'info', text: 'Offline mode: displaying elevation-calibrated estimate.' }],
        dailyForecast: []
      };
    }
  }
}

export const weatherService = new WeatherService();
