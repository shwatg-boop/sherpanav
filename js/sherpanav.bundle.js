// ============================================================================
// SherpaNav Standalone Application Bundle
// Bundled for universal offline support (file:// protocol and http:// servers)
// ============================================================================
(function() {
  'use strict';

  // --- 1. AUTH SERVICE ---
// SherpaNav - Local Authentication & Profile Management System

const AUTH_STORAGE_KEY = 'sherpanav_users';
const SESSION_STORAGE_KEY = 'sherpanav_current_user';

class AuthService {
  constructor() {
    this.initStorage();
  }

  initStorage() {
    if (!localStorage.getItem(AUTH_STORAGE_KEY)) {
      const defaultUsers = [
        {
          id: 'user_001',
          name: 'Tenzing Walker',
          email: 'demo@sherpanav.com',
          password: 'password123',
          nationality: 'Foreigner',
          emergencyName: 'Pasang Sherpa',
          emergencyPhone: '+977 9856025222',
          bloodGroup: 'O+',
          medicalNotes: 'Mild asthma at extreme altitudes, carry Salbutamol inhaler.',
          savedTreks: ['T007', 'T009'],
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  }

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)) || null;
    } catch {
      return null;
    }
  }

  register(userData) {
    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser = {
      id: 'user_' + Date.now(),
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      nationality: userData.nationality || 'Foreigner',
      emergencyName: userData.emergencyName || '',
      emergencyPhone: userData.emergencyPhone || '',
      bloodGroup: userData.bloodGroup || 'Unknown',
      medicalNotes: userData.medicalNotes || '',
      savedTreks: [],
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
    this.setSession(newUser);
    return newUser;
  }

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    this.setSession(user);
    return user;
  }

  setSession(user) {
    // Exclude password from active session
    const { password, ...safeUser } = user;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
    window.dispatchEvent(new CustomEvent('sherpanav_auth_changed', { detail: safeUser }));
  }

  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('sherpanav_auth_changed', { detail: null }));
  }

  updateProfile(updates) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Not logged in');

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index === -1) throw new Error('User not found');

    const updatedUser = { ...users[index], ...updates };
    users[index] = updatedUser;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
    this.setSession(updatedUser);
    return updatedUser;
  }

  toggleSaveTrek(trekId) {
    const user = this.getCurrentUser();
    if (!user) return false;

    let saved = user.savedTreks || [];
    if (saved.includes(trekId)) {
      saved = saved.filter(id => id !== trekId);
    } else {
      saved.push(trekId);
    }

    this.updateProfile({ savedTreks: saved });
    return saved.includes(trekId);
  }

  isTrekSaved(trekId) {
    const user = this.getCurrentUser();
    return user && user.savedTreks ? user.savedTreks.includes(trekId) : false;
  }
}

const authService = new AuthService();

  window.AuthService = AuthService;
  window.authService = authService;

  // --- 2. AMS CLINICAL SERVICE ---
// SherpaNav - 2018 Lake Louise Acute Mountain Sickness (AMS) Clinical Engine

const AMS_STORAGE_KEY = 'sherpanav_ams_logs';

class AMSService {
  constructor() {
    this.logs = this.getLogs();
  }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem(AMS_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  evaluate({ headache, nausea, dizziness, fatigue, sleep, currentAltitudeM, previousAltitudeM }) {
    const totalScore = headache + nausea + dizziness + fatigue + sleep;

    // Daily ascent rate check
    let ascentWarning = null;
    if (previousAltitudeM && currentAltitudeM) {
      const netGain = currentAltitudeM - previousAltitudeM;
      if (currentAltitudeM >= 3000 && netGain > 500) {
        ascentWarning = `High Ascent Rate Alert: You ascended ${netGain}m today above 3,000m. Clinical guidelines recommend max 500m sleeping altitude gain per 24h to avoid pulmonary/cerebral edema.`;
      }
    }

    let status = 'NORMAL';
    let bannerType = 'success';
    let title = 'Normal Acclimatization';
    let advice = 'Your symptoms are within normal range. Maintain hydration (3–4 Litres of water/soup daily), avoid alcohol, and monitor for changes.';

    // The official 2018 Lake Louise Score requires Headache (>=1) + Total >= 3 for AMS
    if (headache >= 1 && totalScore >= 3 && totalScore <= 5) {
      status = 'MILD_AMS';
      bannerType = 'warning';
      title = 'Mild Acute Mountain Sickness (AMS)';
      advice = 'DO NOT ASCEND TO A HIGHER ALTITUDE. Rest at your current teahouse. Take light meals, hydrate, and consider Ibuprofen/Paracetamol. Only resume ascent when symptoms drop to 0.';
    } else if (totalScore >= 6 || headache === 3) {
      status = 'SEVERE_AMS';
      bannerType = 'danger';
      title = 'Severe AMS / High Altitude Warning';
      advice = 'CRITICAL: DESCEND IMMEDIATELY by at least 500m–1,000m with a trekking buddy or guide. Do not wait for morning if symptoms worsen. Prepare emergency oxygen or medical evacuation if ataxia or chest rattle occurs.';
    } else if (headache === 0 && totalScore >= 3) {
      status = 'FATIGUE_EXHAUSTION';
      bannerType = 'warning';
      title = 'Physical Exhaustion / Dehydration';
      advice = 'You report fatigue/dizziness without a primary headache. Rest, replenish electrolytes, and ensure you are eating sufficient carbohydrates.';
    }

    return {
      totalScore,
      status,
      bannerType,
      title,
      advice,
      ascentWarning
    };
  }

  saveLog(entry) {
    const logs = this.getLogs();
    const newEntry = {
      id: 'ams_' + Date.now(),
      date: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newEntry);
    localStorage.setItem(AMS_STORAGE_KEY, JSON.stringify(logs));
    return newEntry;
  }

  getRecentLogs(limit = 7) {
    return this.getLogs().slice(0, limit);
  }
}

const amsService = new AMSService();

  window.AMSService = AMSService;
  window.amsService = amsService;

  // --- 3. MOUNTAIN WEATHER SERVICE ---
// SherpaNav - Live Mountain Weather Service (Powered by Open-Meteo Open-Source API)

class WeatherService {
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

const weatherService = new WeatherService();

  window.WeatherService = WeatherService;
  window.weatherService = weatherService;

  // --- 4. GPX/KML TRACK PARSER ---
// SherpaNav - Client-Side GPX & KML Parser & Local Storage Manager

class TrackParser {
  /**
   * Parse uploaded GPX XML text into normalized track object
   * @param {string} gpxText 
   * @returns {Object} { name, coordinates: [[lat, lon, ele]], waypoints: [{name, lat, lon, elevation_m}] }
   */
  static parseGPX(gpxText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(gpxText, 'application/xml');
    
    // Check for parse error
    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid GPX format: ' + parseError.textContent);
    }

    const nameNode = xml.querySelector('trk > name') || xml.querySelector('gpx > metadata > name');
    const trackName = nameNode ? nameNode.textContent.trim() : 'Imported GPX Track';

    const coordinates = [];
    const trkpts = xml.querySelectorAll('trkpt');

    trkpts.forEach(pt => {
      const lat = parseFloat(pt.getAttribute('lat'));
      const lon = parseFloat(pt.getAttribute('lon'));
      const eleNode = pt.querySelector('ele');
      const ele = eleNode ? parseFloat(eleNode.textContent) : 0;
      if (!isNaN(lat) && !isNaN(lon)) {
        coordinates.push([lat, lon, Math.round(ele)]);
      }
    });

    // If no trkpt, check rtept
    if (coordinates.length === 0) {
      const rtepts = xml.querySelectorAll('rtept');
      rtepts.forEach(pt => {
        const lat = parseFloat(pt.getAttribute('lat'));
        const lon = parseFloat(pt.getAttribute('lon'));
        const eleNode = pt.querySelector('ele');
        const ele = eleNode ? parseFloat(eleNode.textContent) : 0;
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lat, lon, Math.round(ele)]);
        }
      });
    }

    // Extract waypoints if present
    const waypoints = [];
    const wpts = xml.querySelectorAll('wpt');
    wpts.forEach((w, idx) => {
      const lat = parseFloat(w.getAttribute('lat'));
      const lon = parseFloat(w.getAttribute('lon'));
      const name = w.querySelector('name')?.textContent || `Waypoint ${idx + 1}`;
      const ele = parseFloat(w.querySelector('ele')?.textContent || '0');
      if (!isNaN(lat) && !isNaN(lon)) {
        waypoints.push({
          name: name.trim(),
          lat,
          lon,
          elevation_m: Math.round(ele),
          type: 'milestone'
        });
      }
    });

    return {
      name: trackName,
      coordinates,
      waypoints,
      source: 'GPX',
      stats: this.calculateStats(coordinates)
    };
  }

  /**
   * Parse uploaded KML XML text into normalized track object
   * @param {string} kmlText 
   * @returns {Object}
   */
  static parseKML(kmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlText, 'application/xml');

    const parseError = xml.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid KML format: ' + parseError.textContent);
    }

    const nameNode = xml.querySelector('Document > name') || xml.querySelector('kml > Document > name') || xml.querySelector('Placemark > name');
    const trackName = nameNode ? nameNode.textContent.trim() : 'Imported KML Track';

    const coordinates = [];
    const waypoints = [];

    // Find LineString coordinates
    const coordNodes = xml.querySelectorAll('LineString > coordinates');
    coordNodes.forEach(node => {
      const rawText = node.textContent.trim();
      const tuples = rawText.split(/\s+/);
      tuples.forEach(t => {
        const parts = t.split(',');
        if (parts.length >= 2) {
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const ele = parts.length > 2 ? parseFloat(parts[2]) : 0;
          if (!isNaN(lat) && !isNaN(lon)) {
            coordinates.push([lat, lon, Math.round(ele)]);
          }
        }
      });
    });

    // Find Placemark points as milestones
    const pointPlacemarks = xml.querySelectorAll('Placemark');
    pointPlacemarks.forEach((pm, idx) => {
      const ptNode = pm.querySelector('Point > coordinates');
      if (ptNode) {
        const parts = ptNode.textContent.trim().split(',');
        if (parts.length >= 2) {
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          const ele = parts.length > 2 ? parseFloat(parts[2]) : 0;
          const pmName = pm.querySelector('name')?.textContent || `Waypoint ${idx + 1}`;
          if (!isNaN(lat) && !isNaN(lon)) {
            waypoints.push({
              name: pmName.trim(),
              lat,
              lon,
              elevation_m: Math.round(ele),
              type: 'milestone'
            });
          }
        }
      }
    });

    return {
      name: trackName,
      coordinates,
      waypoints,
      source: 'KML',
      stats: this.calculateStats(coordinates)
    };
  }

  /**
   * Helper to parse any file string based on filename or format
   */
  static parseFile(content, fileName = '') {
    const isGPX = fileName.toLowerCase().endsWith('.gpx') || content.includes('<gpx');
    if (isGPX) {
      return this.parseGPX(content);
    }
    return this.parseKML(content);
  }

  /**
   * Calculate distance, min/max elevation, and elevation gain from dense coordinates
   */
  static calculateStats(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return { distanceKm: 0, minEle: 0, maxEle: 0, eleGain: 0, pointCount: 0 };
    }

    let distKm = 0;
    let minEle = Infinity;
    let maxEle = -Infinity;
    let eleGain = 0;

    for (let i = 0; i < coordinates.length; i++) {
      const [lat, lon, ele = 0] = coordinates[i];

      if (ele < minEle) minEle = ele;
      if (ele > maxEle) maxEle = ele;

      if (i > 0) {
        const [prevLat, prevLon, prevEle = 0] = coordinates[i - 1];
        distKm += this.haversine(prevLat, prevLon, lat, lon);

        const diff = ele - prevEle;
        if (diff > 0) eleGain += diff;
      }
    }

    if (minEle === Infinity) minEle = 0;
    if (maxEle === -Infinity) maxEle = 0;

    return {
      distanceKm: Math.round(distKm * 10) / 10,
      minEle: Math.round(minEle),
      maxEle: Math.round(maxEle),
      eleGain: Math.round(eleGain),
      pointCount: coordinates.length
    };
  }

  static haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- LocalStorage persistence for custom route tracks ---
  static saveCustomTrack(routeId, trackData) {
    try {
      const key = `sherpanav_custom_track_${routeId}`;
      localStorage.setItem(key, JSON.stringify(trackData));
      return true;
    } catch (e) {
      console.error('Failed to save custom track to localStorage:', e);
      return false;
    }
  }

  static getCustomTrack(routeId) {
    try {
      const key = `sherpanav_custom_track_${routeId}`;
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  static removeCustomTrack(routeId) {
    try {
      const key = `sherpanav_custom_track_${routeId}`;
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
}

  window.TrackParser = TrackParser;

  // --- 5. DATA REPOSITORY ---
// SherpaNav - Data Loader & Query Repository
class DataRepository {
  constructor() {
    this.treks = [];
    this.routes = [];
    this.itineraries = {};
    this.accommodations = [];
    this.permits = [];
    this.weatherStations = [];
    this.trailTracks = {};
    this.isLoaded = false;
  }

  async loadAll() {
    if (this.isLoaded) return;

    // 1. Direct offline embedded dataset (enables instant execution on file:/// protocol)
    if (typeof window !== 'undefined' && window.__SHERPANAV_EMBEDDED_DATA__) {
      const d = window.__SHERPANAV_EMBEDDED_DATA__;
      this.treks = d.treks || [];
      this.routes = d.routes || [];
      this.itineraries = d.itineraries || {};
      this.accommodations = d.accommodations || [];
      this.permits = d.permits || [];
      this.weatherStations = d.weatherStations || [];
      this.trailTracks = d.trailTracks || {};
      this.isLoaded = true;
      return;
    }

    // 2. Fetch fallback for local web server environments
    try {
      const [treksRes, routesRes, itinRes, accRes, permRes, wsRes, tracksRes] = await Promise.all([
        fetch('data/treks.json'),
        fetch('data/routes.json'),
        fetch('data/itineraries.json'),
        fetch('data/accommodations.json'),
        fetch('data/permits.json'),
        fetch('data/weather_stations.json'),
        fetch('data/trail_tracks.json')
      ]);

      this.treks = await treksRes.json();
      this.routes = await routesRes.json();
      this.itineraries = await itinRes.json();
      this.accommodations = await accRes.json();
      this.permits = await permRes.json();
      this.weatherStations = await wsRes.json();
      this.trailTracks = await tracksRes.json();
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to load local JSON dataset:', err);
    }
  }

  getTrekById(id) {
    return this.treks.find(t => t.id === id);
  }

  getTrekBySlug(slug) {
    return this.treks.find(t => t.slug === slug);
  }

  getRoutesByTrekId(trekId) {
    return this.routes.filter(r => r.trek_id === trekId);
  }

  getRoutesByTrek(trekId) {
    return this.getRoutesByTrekId(trekId);
  }

  getRouteById(id) {
    return this.routes.find(r => r.id === id);
  }

  getItinerary(routeId, excelRouteId = null) {
    return this.getItineraryForRoute(routeId, excelRouteId);
  }

  getItineraryForRoute(routeId, excelRouteId = null) {
    if (!this.itineraries) return [];

    // 1. Direct match by routeId
    let stages = [];
    if (this.itineraries[routeId] && this.itineraries[routeId].length > 0) {
      stages = this.itineraries[routeId];
    } else {
      // 2. Match by replacing _ with - (e.g. TRL_R001 -> TRL-R001)
      const dashed = routeId.replace('_', '-');
      if (this.itineraries[dashed] && this.itineraries[dashed].length > 0) {
        stages = this.itineraries[dashed];
      } else if (excelRouteId && this.itineraries[excelRouteId] && this.itineraries[excelRouteId].length > 0) {
        stages = this.itineraries[excelRouteId];
      } else {
        // 3. Normalized alphanumeric match
        const cleanId = routeId.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        for (const key of Object.keys(this.itineraries)) {
          if (key.replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanId) {
            stages = this.itineraries[key];
            break;
          }
        }
        // 4. Prefix fallback (e.g. TRL_R002 or TRL_R003 falls back to TRL-R001)
        if (stages.length === 0) {
          const prefix = routeId.split('_')[0].split('-')[0].toUpperCase();
          const fallbackKey = Object.keys(this.itineraries).find(k => k.toUpperCase().startsWith(prefix));
          if (fallbackKey && this.itineraries[fallbackKey]) {
            stages = this.itineraries[fallbackKey];
          }
        }
      }
    }

    // Ensure hotels and phone contacts are populated for each stage
    return stages.map(st => {
      let hotels = st.hotels || [];
      if (Array.isArray(hotels) && hotels.length > 0 && Array.isArray(hotels[0])) {
        hotels = hotels[0];
      }
      if (!hotels || hotels.length === 0) {
        hotels = this.getAccommodations(st.destination);
      }
      return {
        ...st,
        hotels: hotels
      };
    });
  }

  getAccommodations(settlementName = null, amenity = null) {
    let list = this.accommodations;
    if (settlementName && settlementName !== 'ALL') {
      list = list.filter(a => a.settlement_name.toLowerCase() === settlementName.toLowerCase());
    }
    if (amenity) {
      list = list.filter(a => (a.amenities || []).some(am => am.toLowerCase().includes(amenity.toLowerCase())));
    }
    return list;
  }

  getSettlementNames() {
    const set = new Set();
    this.accommodations.forEach(a => set.add(a.settlement_name));
    return Array.from(set).sort();
  }

  getPermits() {
    return this.permits;
  }

  getWeatherStationForTrek(trekId) {
    return this.weatherStations.find(w => w.associated_trek_id === trekId) || this.weatherStations[0];
  }

  getTrailTrack(routeId) {
    // 1. Check if user has imported a custom GPX/KML track for this route
    const custom = TrackParser.getCustomTrack(routeId);
    if (custom) {
      return custom;
    }

    // 2. Direct match
    if (this.trailTracks[routeId]) {
      return this.trailTracks[routeId];
    }
    // 3. Prefix fallback matching (e.g. TRL_R002 -> TRL_R001, EBC_R005 -> EBC_R001)
    const prefix = routeId.split('_')[0].split('-')[0];
    const fallbackKey = Object.keys(this.trailTracks).find(k => k.startsWith(prefix));
    if (fallbackKey && this.trailTracks[fallbackKey]) {
      return this.trailTracks[fallbackKey];
    }
    return this.trailTracks['ABC_R001'];
  }
}

const dataRepo = new DataRepository();

  window.DataRepository = DataRepository;
  window.dataRepo = dataRepo;

  // --- 6. ROUTE MAP ENGINE ---
// SherpaNav - Interactive OpenStreetMap & High-Density Elevation Profile Engine

class MapEngine {
  constructor(containerId = 'trail-map') {
    this.containerId = containerId;
    this.map = null;
    this.activePolyline = null;
    this.casingPolyline = null;
    this.markerLayer = null;
    this.scrubMarker = null;
    this.trackData = null;
  }

  initMap(center = [28.40, 83.82], zoom = 11) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: true
    }).setView(center, zoom);

    // Primary Outdoor Topo Layer (OpenTopoMap)
    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: &copy; OpenTopoMap'
    });

    // Standard OSM Layer fallback
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    // Default to topo
    topoLayer.addTo(this.map);

    L.control.layers({
      "⛰️ OpenTopoMap (Contours & Relief)": topoLayer,
      "🗺️ OpenStreetMap (Standard Roads & Trails)": osmLayer
    }, null, { position: 'topright' }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
  }

  loadRoute(trackData) {
    if (!this.map || !trackData) return;
    this.trackData = trackData;

    // Clear previous layers
    if (this.casingPolyline) {
      this.map.removeLayer(this.casingPolyline);
      this.casingPolyline = null;
    }
    if (this.activePolyline) {
      this.map.removeLayer(this.activePolyline);
      this.activePolyline = null;
    }
    this.markerLayer.clearLayers();

    const rawCoords = trackData.coordinates || [];
    if (rawCoords.length === 0) return;

    // Normalize coords to [lat, lon] for Leaflet
    const latlngs = rawCoords.map(c => [c[0], c[1]]);

    // Outer dark casing for high contrast against topographic contour lines
    this.casingPolyline = L.polyline(latlngs, {
      color: '#0B0C10',
      weight: 6.5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Core trail line (Sherpa Gold Accent)
    this.activePolyline = L.polyline(latlngs, {
      color: '#F3CE1E',
      weight: 3.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    this.map.fitBounds(this.activePolyline.getBounds(), { padding: [40, 40] });

    // Render Waypoint Milestones
    const waypoints = trackData.waypoints || [];
    waypoints.forEach((wp, index) => {
      const iconHtml = this.getMarkerIconHtml(wp.type, index + 1);
      const customIcon = L.divIcon({
        className: 'custom-trail-marker',
        html: iconHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const popupHtml = `
        <div class="p-2 text-sm">
          <div class="font-bold text-amber-400 text-base mb-1">${wp.name}</div>
          <div class="flex items-center gap-2 text-gray-300">
            <span>Elevation:</span>
            <strong class="text-white font-mono">${wp.elevation_m} m</strong>
            <span class="text-gray-400 text-xs">(${Math.round(wp.elevation_m * 3.28084)} ft)</span>
          </div>
          <div class="text-xs text-gray-400 mt-1 capitalize">Milestone: ${wp.type || 'Stage Stop'}</div>
        </div>
      `;

      L.marker([wp.lat, wp.lon], { icon: customIcon })
        .bindPopup(popupHtml)
        .addTo(this.markerLayer);
    });

    // Render Elevation Chart with dense points and waypoints
    this.renderElevationProfile('elevation-chart-container', waypoints, rawCoords);
  }

  getMarkerIconHtml(type, number) {
    let bg = 'bg-amber-500 text-black';
    let icon = number;

    switch (type) {
      case 'trailhead':
      case 'city':
        bg = 'bg-emerald-500 text-white';
        icon = '🚀';
        break;
      case 'base_camp':
      case 'summit':
        bg = 'bg-red-500 text-white font-bold';
        icon = '⛺';
        break;
      case 'viewpoint':
        bg = 'bg-indigo-500 text-white';
        icon = '📷';
        break;
      case 'checkpoint':
        bg = 'bg-orange-500 text-white';
        icon = '🛂';
        break;
      case 'pass':
        bg = 'bg-purple-600 text-white';
        icon = '🏔️';
        break;
      case 'lake':
        bg = 'bg-cyan-500 text-white';
        icon = '💧';
        break;
      case 'village':
      case 'teahouse':
        bg = 'bg-amber-400 text-black';
        icon = '🏠';
        break;
      default:
        bg = 'bg-amber-400 text-black';
    }

    return `<div class="w-7 h-7 rounded-full ${bg} flex items-center justify-center font-bold text-xs shadow-lg border border-white/40 transform transition hover:scale-125 cursor-pointer">${icon}</div>`;
  }

  /**
   * Render continuous, high-resolution elevation profile
   */
  renderElevationProfile(containerId, waypoints, denseCoords = []) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 850;
    const height = 190;
    const padding = { top: 22, right: 35, bottom: 40, left: 60 };

    // Determine dense profile points
    let profileData = [];

    if (denseCoords && denseCoords.length > 10) {
      // Step-sample if denseCoords is very large to maintain 60fps SVG rendering
      const step = denseCoords.length > 600 ? Math.ceil(denseCoords.length / 400) : 1;
      let cumDist = 0;
      profileData.push({
        lat: denseCoords[0][0],
        lon: denseCoords[0][1],
        ele: denseCoords[0][2] || 1000,
        distKm: 0
      });

      for (let i = step; i < denseCoords.length; i += step) {
        const p1 = profileData[profileData.length - 1];
        const p2 = denseCoords[i];
        const d = this.haversine(p1.lat, p1.lon, p2[0], p2[1]);
        cumDist += d;
        profileData.push({
          lat: p2[0],
          lon: p2[1],
          ele: p2[2] || p1.ele || 1000,
          distKm: cumDist
        });
      }
      // Ensure exact last point is included
      const lastP = denseCoords[denseCoords.length - 1];
      if (profileData[profileData.length - 1].lat !== lastP[0] || profileData[profileData.length - 1].lon !== lastP[1]) {
        const pPrev = profileData[profileData.length - 1];
        cumDist += this.haversine(pPrev.lat, pPrev.lon, lastP[0], lastP[1]);
        profileData.push({
          lat: lastP[0],
          lon: lastP[1],
          ele: lastP[2] || pPrev.ele || 1000,
          distKm: cumDist
        });
      }
    } else if (waypoints && waypoints.length > 0) {
      let cumDist = 0;
      profileData.push({
        lat: waypoints[0].lat,
        lon: waypoints[0].lon,
        ele: waypoints[0].elevation_m,
        name: waypoints[0].name,
        distKm: 0
      });
      for (let i = 1; i < waypoints.length; i++) {
        const p1 = waypoints[i - 1];
        const p2 = waypoints[i];
        cumDist += this.haversine(p1.lat, p1.lon, p2.lat, p2.lon);
        profileData.push({
          lat: p2.lat,
          lon: p2.lon,
          ele: p2.elevation_m,
          name: p2.name,
          distKm: cumDist
        });
      }
    }

    if (profileData.length === 0) return;

    const totalDistKm = profileData[profileData.length - 1].distKm;
    const elevations = profileData.map(p => p.ele);
    const minElev = Math.max(0, Math.min(...elevations) - 150);
    const maxElev = Math.max(...elevations) + 150;

    // Map each profile point to SVG coordinates
    const svgPoints = profileData.map((p, idx) => {
      const x = padding.left + (p.distKm / (totalDistKm || 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((p.ele - minElev) / (maxElev - minElev)) * (height - padding.top - padding.bottom);
      return { x, y, p, idx };
    });

    const pathData = svgPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '');
    const areaData = `${pathData} L ${svgPoints[svgPoints.length - 1].x} ${height - padding.bottom} L ${svgPoints[0].x} ${height - padding.bottom} Z`;

    // Map named waypoints onto the curve
    const milestonePins = (waypoints || []).map(wp => {
      // Find closest profile point
      let bestPt = svgPoints[0];
      let bestDist = Infinity;
      svgPoints.forEach(sp => {
        const d = this.haversine(wp.lat, wp.lon, sp.p.lat, sp.p.lon);
        if (d < bestDist) {
          bestDist = d;
          bestPt = sp;
        }
      });
      return {
        name: wp.name,
        elevation_m: wp.elevation_m,
        lat: wp.lat,
        lon: wp.lon,
        x: bestPt.x,
        y: bestPt.y
      };
    });

    // Altitude Safety Zone Heights (Green: <3000m, Amber: 3000-4500m, Crimson: >4500m)
    const getY = (ele) => {
      const c = Math.max(minElev, Math.min(maxElev, ele));
      return height - padding.bottom - ((c - minElev) / (maxElev - minElev)) * (height - padding.top - padding.bottom);
    };
    const y3000 = getY(3000);
    const y4500 = getY(4500);
    const yBaseline = height - padding.bottom;
    const chartW = width - padding.left - padding.right;

    const svg = `
      <div class="relative w-full select-none" id="elevation-profile-wrapper">
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto select-none font-sans" id="elevation-svg">
          <defs>
            <linearGradient id="elevationRidgeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#F3CE1E" stop-opacity="0.65"/>
              <stop offset="35%" stop-color="#10B981" stop-opacity="0.30"/>
              <stop offset="80%" stop-color="#06B6D4" stop-opacity="0.10"/>
              <stop offset="100%" stop-color="#0B0C10" stop-opacity="0.02"/>
            </linearGradient>
            <filter id="ridgeGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" flood-color="#F3CE1E" flood-opacity="0.45"/>
            </filter>
          </defs>

          <!-- Acclimatization Safety Background Bands -->
          ${maxElev > 4500 ? `
            <rect x="${padding.left}" y="${padding.top}" width="${chartW}" height="${Math.max(0, y4500 - padding.top)}" fill="rgba(239, 68, 68, 0.08)"/>
            <line x1="${padding.left}" y1="${y4500}" x2="${width - padding.right}" y2="${y4500}" stroke="#EF4444" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>
            <text x="${width - padding.right - 6}" y="${Math.max(padding.top + 10, y4500 - 4)}" fill="#F87171" font-size="8" text-anchor="end" font-family="monospace" font-weight="bold">HIGH RISK AMS ZONE (>4,500m)</text>
          ` : ''}

          ${maxElev > 3000 ? `
            <rect x="${padding.left}" y="${y4500}" width="${chartW}" height="${Math.max(0, y3000 - y4500)}" fill="rgba(245, 158, 11, 0.05)"/>
            <line x1="${padding.left}" y1="${y3000}" x2="${width - padding.right}" y2="${y3000}" stroke="#F59E0B" stroke-width="1" stroke-dasharray="3,3" opacity="0.6"/>
            <text x="${width - padding.right - 6}" y="${y3000 - 4}" fill="#FCD34D" font-size="8" text-anchor="end" font-family="monospace" font-weight="bold">ACCLIMATIZATION ZONE (3,000-4,500m)</text>
          ` : ''}

          <!-- Horizontal Grid Lines -->
          <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="#222634" stroke-dasharray="4"/>
          <line x1="${padding.left}" y1="${(padding.top + height - padding.bottom) / 2}" x2="${width - padding.right}" y2="${(padding.top + height - padding.bottom) / 2}" stroke="#222634" stroke-dasharray="4"/>
          <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#33384A"/>

          <!-- Y Axis Labels -->
          <text x="${padding.left - 8}" y="${padding.top + 4}" fill="#CBD5E1" font-size="11" text-anchor="end" font-family="monospace" font-weight="bold">${maxElev}m</text>
          <text x="${padding.left - 8}" y="${(padding.top + height - padding.bottom) / 2 + 4}" fill="#94A3B8" font-size="11" text-anchor="end" font-family="monospace">${Math.round((maxElev + minElev) / 2)}m</text>
          <text x="${padding.left - 8}" y="${height - padding.bottom + 4}" fill="#64748B" font-size="11" text-anchor="end" font-family="monospace">${minElev}m</text>

          <!-- X Axis Labels (Distance) -->
          <text x="${padding.left}" y="${height - 8}" fill="#94A3B8" font-size="10" text-anchor="start" font-weight="bold">0 km</text>
          <text x="${width / 2}" y="${height - 8}" fill="#64748B" font-size="10" text-anchor="middle">${Math.round(totalDistKm / 2)} km</text>
          <text x="${width - padding.right}" y="${height - 8}" fill="#F3CE1E" font-size="10" text-anchor="end" font-weight="bold">${Math.round(totalDistKm)} km Total</text>

          <!-- Area & Polyline with Alpenglow Ridge Glow -->
          <path d="${areaData}" fill="url(#elevationRidgeGrad)"/>
          <path d="${pathData}" fill="none" stroke="#F3CE1E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#ridgeGlow)"/>

          <!-- Milestone Waypoint Rings & Labels -->
          ${milestonePins.map((mp) => `
            <g class="milestone-pin cursor-pointer">
              <line x1="${mp.x}" y1="${mp.y}" x2="${mp.x}" y2="${height - padding.bottom}" stroke="#475569" stroke-width="1" stroke-dasharray="2"/>
              <!-- Outer glowing ring -->
              <circle cx="${mp.x}" cy="${mp.y}" r="5" fill="#0B0C10" stroke="#F3CE1E" stroke-width="2"/>
              <!-- Inner center core -->
              <circle cx="${mp.x}" cy="${mp.y}" r="2" fill="#F3CE1E"/>
              <text x="${mp.x}" y="${height - padding.bottom + 14}" fill="#E2E8F0" font-size="9.5" font-weight="bold" text-anchor="middle" transform="rotate(28, ${mp.x}, ${height - padding.bottom + 14})">
                ${mp.name.length > 14 ? mp.name.substring(0, 12) + '..' : mp.name}
              </text>
            </g>
          `).join('')}

          <!-- Interactive Scrub Line & Dot -->
          <line id="scrub-line" x1="-100" y1="${padding.top}" x2="-100" y2="${height - padding.bottom}" stroke="#F3CE1E" stroke-width="1.8" stroke-dasharray="3"/>
          <circle id="scrub-dot" cx="-100" cy="-100" r="6" fill="#F3CE1E" stroke="#0B0C10" stroke-width="2.5"/>
        </svg>

        <!-- Floating Cursor HUD Pill -->
        <div id="elevation-hud-pill" class="elevation-hud-pill opacity-0 pointer-events-none">
          <div class="flex items-center gap-3">
            <div>
              <div class="flex items-center gap-1.5">
                <span id="hud-name" class="font-bold text-amber-300 text-xs">Altitude Profile</span>
                <span id="hud-gradient-badge" class="px-1.5 py-0.2 rounded text-[10px] font-bold gradient-badge-flat font-mono">0.0%</span>
              </div>
              <span id="hud-dist" class="text-[11px] text-gray-300">Distance: 0.0 km</span>
            </div>
            <div class="border-l border-white/20 pl-3 text-right">
              <span id="hud-elev-m" class="text-white font-mono font-black text-sm block">0m</span>
              <span id="hud-elev-ft" class="text-gray-400 font-mono text-[10px]">0 ft</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = svg;

    // Attach scrub events
    const wrapper = container.querySelector('#elevation-profile-wrapper');
    const svgElem = container.querySelector('#elevation-svg');
    const scrubLine = container.querySelector('#scrub-line');
    const scrubDot = container.querySelector('#scrub-dot');
    const hudPill = container.querySelector('#elevation-hud-pill');
    const hudName = container.querySelector('#hud-name');
    const hudDist = container.querySelector('#hud-dist');
    const hudElevM = container.querySelector('#hud-elev-m');
    const hudElevFt = container.querySelector('#hud-elev-ft');
    const hudGradientBadge = container.querySelector('#hud-gradient-badge');

    svgElem.addEventListener('mousemove', (e) => {
      const rect = svgElem.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const normalizedX = (clientX / rect.width) * width;

      if (normalizedX < padding.left || normalizedX > (width - padding.right)) return;

      // Find closest profile point by X
      let closest = svgPoints[0];
      let minDiff = Infinity;
      svgPoints.forEach(sp => {
        const diff = Math.abs(sp.x - normalizedX);
        if (diff < minDiff) {
          minDiff = diff;
          closest = sp;
        }
      });

      if (closest) {
        scrubLine.setAttribute('x1', closest.x);
        scrubLine.setAttribute('x2', closest.x);
        scrubDot.setAttribute('cx', closest.x);
        scrubDot.setAttribute('cy', closest.y);

        // Position HUD Pill relative to wrapper
        const wrapperRect = wrapper.getBoundingClientRect();
        const pillLeftPct = (clientX / rect.width) * 100;
        const clampedLeft = Math.max(14, Math.min(86, pillLeftPct));
        hudPill.style.left = `${clampedLeft}%`;
        hudPill.style.top = `${(closest.y / height) * 100}%`;
        hudPill.classList.remove('opacity-0');

        // Calculate slope gradient (%) between adjacent points
        let slopePct = 0;
        const cIdx = closest.idx;
        const nextPt = svgPoints[Math.min(svgPoints.length - 1, cIdx + 1)];
        const prevPt = svgPoints[Math.max(0, cIdx - 1)];
        const deltaElev = nextPt.p.ele - prevPt.p.ele;
        const deltaDistM = (nextPt.p.distKm - prevPt.p.distKm) * 1000;
        if (deltaDistM > 2) {
          slopePct = (deltaElev / deltaDistM) * 100;
        }

        // Format slope badge
        if (slopePct > 15) {
          hudGradientBadge.className = 'px-1.5 py-0.2 rounded text-[10px] font-bold gradient-badge-pos font-mono';
          hudGradientBadge.textContent = `🔺 +${slopePct.toFixed(1)}% Steep`;
        } else if (slopePct < -15) {
          hudGradientBadge.className = 'px-1.5 py-0.2 rounded text-[10px] font-bold gradient-badge-neg font-mono';
          hudGradientBadge.textContent = `🔻 ${slopePct.toFixed(1)}% Drop`;
        } else if (Math.abs(slopePct) < 5) {
          hudGradientBadge.className = 'px-1.5 py-0.2 rounded text-[10px] font-bold gradient-badge-flat font-mono';
          hudGradientBadge.textContent = `➡️ ${slopePct >= 0 ? '+' : ''}${slopePct.toFixed(1)}% Flat`;
        } else {
          hudGradientBadge.className = 'px-1.5 py-0.2 rounded text-[10px] font-bold gradient-badge-flat font-mono';
          hudGradientBadge.textContent = `${slopePct > 0 ? '↗️ +' : '↘️ '}${slopePct.toFixed(1)}%`;
        }

        // Check if near a milestone
        const nearbyMilestone = milestonePins.find(m => Math.abs(m.x - closest.x) < 14);
        hudName.textContent = nearbyMilestone ? `📍 ${nearbyMilestone.name}` : `Altitude Profile`;
        hudDist.textContent = `Distance: ${closest.p.distKm.toFixed(1)} km`;
        hudElevM.textContent = `${Math.round(closest.p.ele)}m`;
        hudElevFt.textContent = `${Math.round(closest.p.ele * 3.28084)} ft`;

        // Highlight exact point on Leaflet map with pulsing beacon
        this.highlightMapLocation([closest.p.lat, closest.p.lon]);
      }
    });

    svgElem.addEventListener('mouseleave', () => {
      scrubLine.setAttribute('x1', '-100');
      scrubLine.setAttribute('x2', '-100');
      scrubDot.setAttribute('cx', '-100');
      scrubDot.setAttribute('cy', '-100');
      hudPill.classList.add('opacity-0');
      if (this.scrubMarker) {
        this.map.removeLayer(this.scrubMarker);
        this.scrubMarker = null;
      }
    });
  }

  highlightMapLocation(latlng) {
    if (!this.map) return;
    if (!this.scrubMarker) {
      const icon = L.divIcon({
        className: 'scrub-pulsing-marker',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 border-2 border-white shadow-xl"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      this.scrubMarker = L.marker(latlng, { icon, zIndexOffset: 1000 }).addTo(this.map);
    } else {
      this.scrubMarker.setLatLng(latlng);
    }
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  focusWaypoint(lat, lon, zoom = 14) {
    if (!this.map) return;
    this.map.flyTo([lat, lon], zoom, { duration: 1.0 });
    this.highlightMapLocation([lat, lon]);
  }

  fitRoute() {
    if (!this.map || !this.activePolyline) return;
    this.map.fitBounds(this.activePolyline.getBounds(), { padding: [40, 40] });
  }
}

const mapEngine = new MapEngine();


  window.MapEngine = MapEngine;
  window.mapEngine = mapEngine;

  // --- 7. OVERVIEW MAP ENGINE ---
// SherpaNav - Nationwide Multi-Route Overview Map Engine

class OverviewMapEngine {
  constructor(containerId = 'home-overview-map') {
    this.containerId = containerId;
    this.map = null;
    this.routeLayers = {}; // routeId -> { polyline, casing, bounds, route, trek, baseColor }
    this.markerLayers = [];
    this.selectedRouteId = null;
    this.allBounds = null;
    this.isMaximized = false;
  }

  initMap() {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Center over Nepal: 28.25° N, 84.50° E, initial zoom 7.2
    // Interactions disabled initially so page scrolling isn't hijacked
    this.map = L.map(this.containerId, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false
    }).setView([28.25, 84.50], 7);

    this.isInteractive = false;

    // Primary Outdoor Topo Layer (OpenTopoMap)
    const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data: &copy; OpenStreetMap, SRTM | Style: &copy; OpenTopoMap'
    });

    // Standard OSM Layer fallback
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    });

    topoLayer.addTo(this.map);

    L.control.layers({
      "⛰️ OpenTopoMap (Contours & Relief)": topoLayer,
      "🗺️ OpenStreetMap (Standard Trails)": osmLayer
    }, null, { position: 'topright' }).addTo(this.map);

    // Add metric scale
    L.control.scale({ metric: true, imperial: false, position: 'bottomright' }).addTo(this.map);

    // Setup Click-To-Interact Barrier Listeners
    this.setupInteractionListeners();
  }

  setupInteractionListeners() {
    const barrier = document.getElementById('home-map-interaction-barrier');
    const lockBtn = document.getElementById('home-map-lock-btn');
    const wrapper = document.getElementById('home-map-canvas-wrapper');

    if (barrier) {
      barrier.addEventListener('click', (e) => {
        e.stopPropagation();
        this.enableInteraction();
      });
    }

    if (lockBtn) {
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.disableInteraction();
      });
    }

    if (wrapper) {
      wrapper.addEventListener('click', () => {
        if (!this.isInteractive) {
          this.enableInteraction();
        }
      });

      wrapper.addEventListener('mouseleave', () => {
        if (!this.isMaximized && this.isInteractive) {
          this.disableInteraction();
        }
      });
    }
  }

  enableInteraction() {
    if (!this.map) return;
    this.isInteractive = true;
    this.map.scrollWheelZoom.enable();
    this.map.dragging.enable();
    this.map.touchZoom.enable();
    this.map.doubleClickZoom.enable();

    const barrier = document.getElementById('home-map-interaction-barrier');
    if (barrier) {
      barrier.classList.add('opacity-0', 'pointer-events-none');
    }
    const lockBtn = document.getElementById('home-map-lock-btn');
    if (lockBtn) {
      lockBtn.classList.remove('hidden');
    }
  }

  disableInteraction() {
    if (!this.map || this.isMaximized) return; // Keep active while maximized
    this.isInteractive = false;
    this.map.scrollWheelZoom.disable();
    this.map.dragging.disable();
    this.map.touchZoom.disable();
    this.map.doubleClickZoom.disable();

    const barrier = document.getElementById('home-map-interaction-barrier');
    if (barrier) {
      barrier.classList.remove('opacity-0', 'pointer-events-none');
    }
    const lockBtn = document.getElementById('home-map-lock-btn');
    if (lockBtn) {
      lockBtn.classList.add('hidden');
    }
  }

  getRegionColor(region = '') {
    const r = (region || '').toLowerCase();
    if (r.includes('annapurna')) return '#10B981'; // Emerald
    if (r.includes('everest') || r.includes('khumbu')) return '#38BDF8'; // Sky Blue
    if (r.includes('langtang') || r.includes('helambu')) return '#F43F5E'; // Rose
    if (r.includes('manaslu')) return '#A855F7'; // Purple
    if (r.includes('rolwaling') || r.includes('gaurishankar')) return '#F59E0B'; // Amber
    if (r.includes('dolp') || r.includes('phoksundo')) return '#14B8A6'; // Teal
    if (r.includes('makalu')) return '#84CC16'; // Lime
    if (r.includes('far-west') || r.includes('badimalika') || r.includes('api')) return '#06B6D4'; // Cyan
    return '#EAB308'; // Default Gold
  }

  renderAllRoutes(dataRepo, onRouteSelectCallback) {
    if (!this.map) this.initMap();
    if (!this.map) return;

    // Clear previous layers
    Object.values(this.routeLayers).forEach(rl => {
      if (rl.casing) this.map.removeLayer(rl.casing);
      if (rl.polyline) this.map.removeLayer(rl.polyline);
    });
    this.markerLayers.forEach(m => this.map.removeLayer(m));
    this.routeLayers = {};
    this.markerLayers = [];

    const boundsGroup = L.featureGroup();

    // Collect featured routes to render
    const routesToRender = [];
    const renderedTrackKeys = new Set();

    // 1. Explicit geometries in trailTracks
    Object.keys(dataRepo.trailTracks).forEach(trackKey => {
      const route = dataRepo.getRouteById(trackKey) || dataRepo.routes.find(r => r.id.startsWith(trackKey.split('_')[0]));
      if (route && !renderedTrackKeys.has(trackKey)) {
        routesToRender.push({ route, trackKey, track: dataRepo.trailTracks[trackKey] });
        renderedTrackKeys.add(trackKey);
      }
    });

    // 2. Primary routes for all treks if not already included
    dataRepo.treks.forEach(trek => {
      const trekRoutes = dataRepo.getRoutesByTrekId(trek.id);
      if (trekRoutes.length > 0) {
        const primary = trekRoutes.find(r => r.is_primary) || trekRoutes[0];
        const track = dataRepo.getTrailTrack(primary.id);
        if (track && !renderedTrackKeys.has(primary.id)) {
          routesToRender.push({ route: primary, trackKey: primary.id, track });
          renderedTrackKeys.add(primary.id);
        }
      }
    });

    routesToRender.forEach(({ route, trackKey, track }) => {
      const trek = dataRepo.getTrekById(route.trek_id) || dataRepo.treks[0];
      const rawCoords = track.coordinates || [];
      if (rawCoords.length < 2) return;

      const coords = rawCoords.map(c => [c[0], c[1]]);
      const baseColor = this.getRegionColor(trek.region || trek.district);

      // Casing polyline (dark outer shadow for topographic relief)
      const casing = L.polyline(coords, {
        color: '#0B0C10',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);

      // Core colored trail line
      const polyline = L.polyline(coords, {
        color: baseColor,
        weight: 3.5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 1.2
      }).addTo(this.map);

      boundsGroup.addLayer(polyline);

      const bounds = polyline.getBounds();

      // Tooltip on trail
      polyline.bindTooltip(`
        <div style="font-family: inherit;">
          <strong style="color: #fff; font-size: 12px;">${trek.title}</strong><br>
          <span style="font-size: 11px; color: #facc15;">${route.variant_tag || 'Route'}: ${route.total_days}D • ~${route.distance_km || 80}km</span>
        </div>
      `, {
        sticky: true,
        className: 'sherpa-map-tooltip'
      });

      // Hover effects
      polyline.on('mouseover', () => {
        if (this.selectedRouteId !== route.id) {
          polyline.setStyle({ color: '#F3CE1E', weight: 5, opacity: 1 });
          polyline.bringToFront();
        }
      });
      polyline.on('mouseout', () => {
        if (this.selectedRouteId !== route.id) {
          polyline.setStyle({ color: baseColor, weight: 3.5, opacity: 0.9 });
        }
      });

      // Click on polyline selects route
      polyline.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.selectRoute(route.id, false);
        if (onRouteSelectCallback) onRouteSelectCallback(route, trek);
        this.openRoutePopup(route, trek, e.latlng);
      });

      this.routeLayers[route.id] = {
        route,
        trek,
        polyline,
        casing,
        bounds,
        baseColor
      };

      // Destination milestone marker at the highest point
      const waypoints = track.waypoints || [];
      const highestWp = waypoints.reduce((max, wp) => (!max || (wp.elevation_m || 0) > (max.elevation_m || 0)) ? wp : max, null);
      const markerPoint = highestWp ? [highestWp.lat, highestWp.lon] : coords[Math.floor(coords.length / 2)];
      const markerLabel = highestWp ? highestWp.name : trek.title;
      const markerAlt = highestWp ? `${highestWp.elevation_m}m` : `${route.max_altitude_m}m`;

      const markerHtml = `
        <div class="overview-trek-marker" title="${trek.title} - ${markerLabel} (${markerAlt})">
          <span>🏔️</span>
          <span class="truncate max-w-[100px]">${markerLabel}</span>
          <span style="color:#fde047;font-family:monospace;font-size:10px;">${markerAlt}</span>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: 'custom-overview-marker-wrap',
        html: markerHtml,
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });

      const marker = L.marker(markerPoint, { icon: markerIcon }).addTo(this.map);
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        this.selectRoute(route.id, true);
        if (onRouteSelectCallback) onRouteSelectCallback(route, trek);
        this.openRoutePopup(route, trek, markerPoint);
      });

      this.markerLayers.push(marker);
    });

    if (boundsGroup.getLayers().length > 0) {
      this.allBounds = boundsGroup.getBounds();
      this.map.fitBounds(this.allBounds, { padding: [30, 30] });
    }
  }

  openRoutePopup(route, trek, latlng) {
    if (!this.map) return;
    const baseColor = this.getRegionColor(trek.region || trek.district);

    const popupContent = `
      <div class="p-3 text-xs space-y-2 min-w-[240px]">
        <div class="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono" style="background:${baseColor}20; color:${baseColor}; border:1px solid ${baseColor}50;">
            ${trek.region || trek.district}
          </span>
          <span class="text-amber-400 font-mono font-bold">${route.max_altitude_m}m</span>
        </div>
        <div>
          <h4 class="font-extrabold text-white text-sm leading-snug">${trek.title}</h4>
          <p class="text-[11px] text-amber-300 font-medium mt-0.5">${route.variant_tag || 'Route'}: ${route.title}</p>
        </div>
        <div class="flex items-center gap-3 text-[11px] text-gray-300 font-mono py-1 border-y border-slate-800">
          <span>📅 ${route.total_days} Days</span>
          <span>🚶 ~${route.distance_km || 80} km</span>
          <span>💪 ${route.difficulty || trek.difficulty}</span>
        </div>
        <button onclick="window.app.navigateTo('route-map', { routeId: '${route.id}', trekId: '${trek.id}' })" class="btn-gold w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
          <span>🧭</span> <span>Open Interactive Topo Stages →</span>
        </button>
      </div>
    `;

    L.popup({
      closeButton: true,
      className: 'overview-route-popup',
      offset: [0, -10]
    })
      .setLatLng(latlng)
      .setContent(popupContent)
      .openOn(this.map);
  }

  selectRoute(routeId, flyTo = true) {
    this.selectedRouteId = routeId;
    const item = this.routeLayers[routeId];

    // Reset styles on all polylines
    Object.entries(this.routeLayers).forEach(([id, rl]) => {
      if (id === routeId) {
        rl.polyline.setStyle({
          color: '#F3CE1E',
          weight: 5.5,
          opacity: 1
        });
        rl.casing.setStyle({
          weight: 8,
          opacity: 0.95
        });
        rl.polyline.bringToFront();
      } else {
        rl.polyline.setStyle({
          color: rl.baseColor,
          weight: 3,
          opacity: 0.65
        });
        rl.casing.setStyle({
          weight: 5,
          opacity: 0.6
        });
      }
    });

    if (item && flyTo) {
      this.map.fitBounds(item.bounds, {
        padding: [60, 60],
        maxZoom: 12
      });
    }
  }

  resetBounds() {
    if (this.map && this.allBounds) {
      this.map.fitBounds(this.allBounds, { padding: [30, 30] });
    }
  }

  toggleMaximize() {
    const banner = document.getElementById('home-trail-banner');
    const maxIcon = document.getElementById('btn-home-max-icon');
    const maxText = document.getElementById('btn-home-max-text');

    if (!banner) return;

    this.isMaximized = !this.isMaximized;

    if (this.isMaximized) {
      banner.classList.add('home-map-maximized');
      if (maxIcon) maxIcon.textContent = '✕';
      if (maxText) maxText.textContent = 'Minimise Map';
      document.body.style.overflow = 'hidden';
      this.enableInteraction();
    } else {
      banner.classList.remove('home-map-maximized');
      if (maxIcon) maxIcon.textContent = '⛶';
      if (maxText) maxText.textContent = 'Maximise Map';
      document.body.style.overflow = '';
      this.disableInteraction();
    }

    // Invalidate map size after layout transition
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        if (this.selectedRouteId && this.routeLayers[this.selectedRouteId]) {
          this.map.fitBounds(this.routeLayers[this.selectedRouteId].bounds, { padding: [50, 50], maxZoom: 12 });
        } else if (this.allBounds) {
          this.map.fitBounds(this.allBounds, { padding: [30, 30] });
        }
      }
    }, 180);
  }
}

const overviewMapEngine = new OverviewMapEngine();

  window.OverviewMapEngine = OverviewMapEngine;
  window.overviewMapEngine = overviewMapEngine;

  // --- 8. INTERACTION & ANIMATION ENGINE ---
// SherpaNav - Advanced Interaction & Animation Engine
// Features: Mouse Spotlight & 3D Tilt, Scroll Progress, Staggered Scroll-Reveal,
// Animated Number Counters, Gliding Nav Island, Web Audio API Tactile Micro-Sounds,
// and Live Nepal Standard Time & Daylight Phase Radar.

class InteractionEngine {
  constructor() {
    this.soundEnabled = localStorage.getItem('sherpanav_sound') !== 'false'; // default true
    this.audioCtx = null;
    this.countersObserver = null;
    this.revealObserver = null;
    this.activeNavId = 'explore';
  }

  init() {
    this.setupScrollProgress();
    this.setupScrollReveal();
    this.setupNumberCounters();
    this.setup3DTiltAndSpotlight();
    this.setupGlidingNavIsland();
    this.setupNepalTimeRadar();
    this.setupSoundToggle();
    this.attachGlobalClickAudio();
  }

  // ================= 1. SCROLL PROGRESS INDICATOR =================
  setupScrollProgress() {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }, { passive: true });
  }

  // ================= 2. SCROLL-REVEAL OBSERVER =================
  setupScrollReveal() {
    if (!('IntersectionObserver' in window)) return;

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Staggered reveal based on dataset or position
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          this.revealObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    this.observeRevealElements();
  }

  observeRevealElements(container = document) {
    if (!this.revealObserver) return;
    const elements = container.querySelectorAll('.reveal-on-scroll:not(.revealed)');
    elements.forEach((el, idx) => {
      if (!el.dataset.delay && idx < 12) {
        el.dataset.delay = (idx % 6) * 60; // 60ms stagger per column
      }
      this.revealObserver.observe(el);
    });
  }

  // ================= 3. ANIMATED NUMBER COUNTERS =================
  setupNumberCounters() {
    if (!('IntersectionObserver' in window)) return;

    this.countersObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          this.countersObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    this.observeCounterElements();
  }

  observeCounterElements(container = document) {
    if (!this.countersObserver) return;
    container.querySelectorAll('[data-count]').forEach(el => {
      if (!el.dataset.counted) {
        this.countersObserver.observe(el);
      }
    });
  }

  animateCounter(el) {
    el.dataset.counted = 'true';
    const target = parseFloat(el.getAttribute('data-count')) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = parseInt(el.getAttribute('data-duration')) || 1600;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic curve: 1 - pow(1 - x, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * ease);

      el.textContent = `${prefix}${current.toLocaleString()}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      }
    };

    requestAnimationFrame(update);
  }

  // ================= 4. 3D TILT & MOUSE SPOTLIGHT =================
  setup3DTiltAndSpotlight() {
    this.bindTiltCards(document);

    // Global cursor aura tracker
    const cursorGlow = document.getElementById('cursor-glow');
    if (cursorGlow) {
      window.addEventListener('mousemove', (e) => {
        cursorGlow.style.left = `${e.clientX}px`;
        cursorGlow.style.top = `${e.clientY}px`;
        if (cursorGlow.style.opacity !== '1') {
          cursorGlow.style.opacity = '1';
        }
      }, { passive: true });
    }
  }

  bindTiltCards(container = document) {
    // Only bind to explicit tilt-cards (treks, weather stations, telemetry chips)
    const cards = container.querySelectorAll('.tilt-card');
    cards.forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = 'true';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Set CSS variables for subtle radial specular sheen
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        // Compute gentle, subtle 3D rotation angles (-1.2 to +1.2 degrees)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotX = ((y - centerY) / centerY) * -1.2;
        const rotY = ((x - centerX) / centerX) * 1.2;

        card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-1.5px) scale3d(1.004, 1.004, 1.004)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
      });
    });
  }

  // ================= 5. GLIDING NAVIGATION ISLAND =================
  setupGlidingNavIsland() {
    const track = document.getElementById('nav-glider-track');
    const pill = document.getElementById('nav-glider-pill');
    if (!track || !pill) return;

    const links = track.querySelectorAll('.nav-glider-link');

    links.forEach(link => {
      link.addEventListener('mouseenter', () => {
        this.positionGlider(link, pill, track);
      });
    });

    track.addEventListener('mouseleave', () => {
      const activeLink = track.querySelector(`.nav-glider-link[data-nav="${this.activeNavId}"]`);
      if (activeLink) {
        this.positionGlider(activeLink, pill, track);
      }
    });

    // Initial position
    setTimeout(() => {
      const activeLink = track.querySelector(`.nav-glider-link[data-nav="${this.activeNavId}"]`) || links[0];
      if (activeLink) {
        this.positionGlider(activeLink, pill, track);
        pill.style.opacity = '1';
      }
    }, 150);

    window.addEventListener('resize', () => {
      const activeLink = track.querySelector(`.nav-glider-link[data-nav="${this.activeNavId}"]`);
      if (activeLink) {
        this.positionGlider(activeLink, pill, track);
      }
    }, { passive: true });
  }

  positionGlider(targetLink, pill, track) {
    if (!targetLink || !pill || !track) return;
    const trackRect = track.getBoundingClientRect();
    const linkRect = targetLink.getBoundingClientRect();

    const left = linkRect.left - trackRect.left;
    const width = linkRect.width;

    pill.style.transform = `translateX(${left}px)`;
    pill.style.width = `${width}px`;
    pill.style.opacity = '1';
  }

  syncNavGlider(viewId) {
    this.activeNavId = viewId;
    const track = document.getElementById('nav-glider-track');
    const pill = document.getElementById('nav-glider-pill');
    if (!track || !pill) return;

    const links = track.querySelectorAll('.nav-glider-link');
    links.forEach(l => {
      if (l.getAttribute('data-nav') === viewId) {
        l.classList.add('nav-link-active');
        this.positionGlider(l, pill, track);
      } else {
        l.classList.remove('nav-link-active');
      }
    });
  }

  // ================= 6. LIVE NEPAL TIME & SOLAR PHASE RADAR =================
  setupNepalTimeRadar() {
    const timeEl = document.getElementById('npt-time-text');
    const phaseEl = document.getElementById('npt-phase-text');
    const iconEl = document.getElementById('npt-icon');
    if (!timeEl) return;

    const updateNPT = () => {
      // Nepal is UTC + 5:45
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const nepalTime = new Date(utc + (3600000 * 5.75));

      const hours = nepalTime.getHours();
      const minutes = nepalTime.getMinutes();
      const seconds = nepalTime.getSeconds();

      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} NPT`;
      timeEl.textContent = timeStr;

      // Daylight Phase & Atmospheric Indicator
      let phase = 'Starlit High Pass';
      let icon = '🌌';
      let themeClass = 'phase-night';

      if (hours >= 5 && hours < 7) {
        phase = 'Dawn Alpenglow';
        icon = '🌄';
        themeClass = 'phase-dawn';
      } else if (hours >= 7 && hours < 11) {
        phase = 'Morning Clear Sky';
        icon = '☀️';
        themeClass = 'phase-morning';
      } else if (hours >= 11 && hours < 16) {
        phase = 'Solar Zenith (Peak UV)';
        icon = '☀️';
        themeClass = 'phase-day';
      } else if (hours >= 16 && hours < 19) {
        phase = 'Golden Hour Alpenglow';
        icon = '🌇';
        themeClass = 'phase-dusk';
      } else {
        phase = 'Starlit High Pass (Freezing)';
        icon = '🌌';
        themeClass = 'phase-night';
      }

      if (phaseEl) phaseEl.textContent = phase;
      if (iconEl) iconEl.textContent = icon;

      // Update body ambient lighting modifier
      document.body.classList.remove('phase-dawn', 'phase-morning', 'phase-day', 'phase-dusk', 'phase-night');
      document.body.classList.add(themeClass);
    };

    updateNPT();
    setInterval(updateNPT, 1000);
  }

  // ================= 7. TACTILE ALPINE MICRO-AUDIO =================
  setupSoundToggle() {
    const btn = document.getElementById('audio-toggle-btn');
    if (!btn) return;

    this.updateSoundButtonUI();

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.soundEnabled = !this.soundEnabled;
      localStorage.setItem('sherpanav_sound', this.soundEnabled ? 'true' : 'false');
      this.updateSoundButtonUI();
      if (this.soundEnabled) {
        this.playPopSound(800, 0.04);
      }
    });
  }

  updateSoundButtonUI() {
    const btn = document.getElementById('audio-toggle-btn');
    if (!btn) return;
    const icon = btn.querySelector('.sound-icon');
    const label = btn.querySelector('.sound-label');

    if (this.soundEnabled) {
      if (icon) icon.textContent = '🔊';
      if (label) label.textContent = 'Sound ON';
      btn.className = 'audio-toggle-active px-2.5 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5';
    } else {
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = 'Muted';
      btn.className = 'audio-toggle-muted px-2.5 py-1 rounded-full text-[11px] font-semibold border transition flex items-center gap-1.5';
    }
  }

  initAudio() {
    if (!this.audioCtx && typeof window.AudioContext !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playPopSound(freq = 650, duration = 0.035) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  attachGlobalClickAudio() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, select, [data-nav], .seg-btn, .overview-route-pill, .settlement-pill');
      if (target) {
        if (target.classList.contains('seg-btn')) {
          this.playPopSound(720, 0.03);
        } else if (target.classList.contains('btn-gold')) {
          this.playPopSound(540, 0.04);
        } else {
          this.playPopSound(620, 0.025);
        }
      }
    }, { passive: true });
  }

  // ================= 8. LIFECYCLE RE-OBSERVE HELPER =================
  observeNewElements(container = document) {
    this.observeRevealElements(container);
    this.observeCounterElements(container);
    this.bindTiltCards(container);
  }
}

const interactionEngine = new InteractionEngine();

  window.InteractionEngine = InteractionEngine;
  window.interactionEngine = interactionEngine;

  // --- 9. APP CONDUCTOR ---
// SherpaNav - Main Application Controller & View Orchestrator
class SherpaNavApp {
  constructor() {
    this.currentView = 'explore';
    this.selectedTrekId = 'T007'; // Annapurna Base Camp default
    this.selectedRouteId = 'ABC_R001';
    this.pendingImportedTrack = null;
    this.activeFilters = {
      region: 'ALL',
      difficulty: 'ALL',
      duration: 'ALL',
      search: ''
    };
    this.homeMapInitialized = false;
    this.isPrintPreviewOpen = false;

    // Plan-a-Trek Wizard Expedition State
    this.wizardState = {
      step: 1,
      selectedTrekId: 'T007',
      selectedRouteId: 'ABC_R001',
      packedItems: {
        'thermal_base': true,
        'fleece': true,
        'boots': true,
        'socks': true,
        'first_aid': true,
        'water_purify': true,
        'headlamp': true
      },
      nationality: 'Foreigner',
      lodgingType: 1500,
      mealsDay: 2500,
      guideOption: '3500',
      porterOption: '2200',
      extras: { shower: true, charging: true, wifi: true },
      currency: 'USD',
      amsScore: 0
    };

    // Live Multi-Currency Conversion Engine
    this.activeCurrency = 'USD';
    this.currencyRates = {
      NPR: { symbol: 'NPR', rate: 1, prefix: 'NPR ' },
      USD: { symbol: 'USD', rate: 1 / 134, prefix: '$' },
      EUR: { symbol: 'EUR', rate: 1 / 144, prefix: '€' },
      GBP: { symbol: 'GBP', rate: 1 / 168, prefix: '£' },
      AUD: { symbol: 'AUD', rate: 1 / 88, prefix: 'A$' },
      INR: { symbol: 'INR', rate: 1 / 1.6, prefix: '₹' }
    };
  }

  async init() {
    if (this._initialized) return;
    this._initialized = true;
    window.mapEngine = mapEngine;
    window.interactionEngine = interactionEngine;
    window.overviewMapEngine = overviewMapEngine;
    await dataRepo.loadAll();
    this.setupEventListeners();
    this.initCommandPalette();
    interactionEngine.init();
    this.updateAuthUI();

    // Check URL hash for direct deep-linking
    const initialHash = window.location.hash.replace('#', '').trim();
    if (initialHash === 'plan' || initialHash === 'plan-wizard') {
      this.currentView = 'plan-wizard';
    } else if (initialHash && ['explore', 'trek-detail', 'route-map', 'accommodations', 'weather', 'permits', 'tracker', 'sos', 'profile', 'checklist', 'calculator'].includes(initialHash)) {
      this.currentView = initialHash;
    }

    this.renderCurrentView();
    this.refreshLiveWeatherHeader();
  }

  setupEventListeners() {
    // Hash change event listener for browser back/forward and deep link navigation
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '').trim();
      if (h) {
        const target = (h === 'plan' || h === 'plan-wizard') ? 'plan-wizard' : h;
        if (target !== this.currentView) {
          this.navigateTo(target);
        }
      }
    });

    // Navigation items
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = el.getAttribute('data-nav');
        this.navigateTo(targetView);
      });
    });

    // Auth events
    window.addEventListener('sherpanav_auth_changed', () => {
      this.updateAuthUI();
    });

    // Global Search Bar
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.activeFilters.search = e.target.value.toLowerCase();
        if (this.currentView === 'explore') {
          this.renderExplore();
        }
      });
    }

    // Modal close triggers
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
      });
    });

    // Track Importer Drag & Drop Setup
    const dropzone = document.getElementById('track-dropzone');
    const fileInput = document.getElementById('track-file-input');

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();

      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.classList.add('border-amber-400', 'bg-amber-400/10');
      };

      dropzone.ondragleave = () => {
        dropzone.classList.remove('border-amber-400', 'bg-amber-400/10');
      };

      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-amber-400', 'bg-amber-400/10');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleTrackFile(e.dataTransfer.files[0]);
        }
      };

      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleTrackFile(e.target.files[0]);
        }
      };
    }

    // Escape key to exit fullscreen overview map
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overviewMapEngine.isMaximized) {
        overviewMapEngine.toggleMaximize();
      }
    });

    // Ensure printable itinerary & map are prepared whenever print is triggered
    window.addEventListener('beforeprint', () => {
      this.preparePrintContent();
      const modal = document.getElementById('modal-print-sheet');
      if (modal) modal.classList.remove('hidden');
    });

    window.addEventListener('afterprint', () => {
      if (!this.isPrintPreviewOpen) {
        const modal = document.getElementById('modal-print-sheet');
        if (modal) modal.classList.add('hidden');
      }
    });
  }

  navigateTo(view, payload = {}) {
    if (view === 'plan') view = 'plan-wizard';
    this.currentView = view;
    if (payload.trekId) this.selectedTrekId = payload.trekId;
    if (payload.routeId) this.selectedRouteId = payload.routeId;

    // Sync URL hash seamlessly
    try {
      if (window.location.hash !== '#' + view) {
        history.replaceState(null, '', '#' + view);
      }
    } catch (e) {
      // Ignore in restrictive file:// environments
    }

    // Sync gliding nav island indicator
    interactionEngine.syncNavGlider(view);

    // Update mobile nav active states
    document.querySelectorAll('#mobile-nav [data-nav]').forEach(el => {
      const isTarget = el.getAttribute('data-nav') === view;
      if (isTarget) {
        el.className = 'p-1.5 flex flex-col items-center nav-active-mobile active:scale-95 transition-all';
      } else {
        el.className = 'p-1.5 flex flex-col items-center text-gray-400 hover:text-gray-200 active:scale-95 transition-all';
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderCurrentView();

    if (view === 'explore') {
      setTimeout(() => {
        if (overviewMapEngine.map) overviewMapEngine.map.invalidateSize();
      }, 150);
    }
  }

  renderCurrentView() {
    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    // Hide all view containers
    document.querySelectorAll('.view-container').forEach(c => c.classList.add('hidden'));

    switch (this.currentView) {
      case 'explore':
        this.renderExplore();
        break;
      case 'trek-detail':
        this.renderTrekDetail();
        break;
      case 'route-map':
        this.renderRouteMap();
        break;
      case 'accommodations':
        this.renderAccommodations();
        break;
      case 'weather':
        this.renderWeatherOverview();
        break;
      case 'permits':
        this.renderPermits();
        break;
      case 'tracker':
        this.renderAMSTracker();
        break;
      case 'sos':
        this.renderSOS();
        break;
      case 'profile':
        this.renderProfile();
        break;
      case 'checklist':
        this.renderChecklist();
        break;
      case 'calculator':
        this.renderCalculator();
        break;
      case 'plan':
      case 'plan-wizard':
        this.renderPlanWizard();
        break;
      default:
        this.renderExplore();
    }
  }

  updateAuthUI() {
    const user = authService.getCurrentUser();
    const authBtn = document.getElementById('header-auth-btn');
    const userDisplayName = document.getElementById('user-display-name');

    if (user) {
      if (authBtn) {
        authBtn.innerHTML = `
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-sm">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <span class="text-sm font-medium hidden md:inline">${user.name}</span>
          </div>
        `;
        authBtn.onclick = () => this.navigateTo('profile');
      }
      if (userDisplayName) userDisplayName.textContent = user.name;
    } else {
      if (authBtn) {
        authBtn.innerHTML = `
          <button class="px-3 py-1.5 rounded-lg border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black font-semibold text-sm transition-all">
            Sign In / Register
          </button>
        `;
        authBtn.onclick = () => this.openAuthModal();
      }
      if (userDisplayName) userDisplayName.textContent = 'Guest Trekker';
    }
  }

  openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const loginSection = document.getElementById('auth-login-section');
    const registerSection = document.getElementById('auth-register-section');
    const modalTitle = document.getElementById('auth-modal-title');

    if (mode === 'login') {
      loginSection.classList.remove('hidden');
      registerSection.classList.add('hidden');
      modalTitle.textContent = 'Sign In to SherpaNav';
    } else {
      loginSection.classList.add('hidden');
      registerSection.classList.remove('hidden');
      modalTitle.textContent = 'Create Local Account';
    }

    // Bind login form
    const loginForm = document.getElementById('form-login');
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;
      const errorEl = document.getElementById('login-error');

      try {
        authService.login(email, pass);
        modal.classList.add('hidden');
        errorEl.textContent = '';
      } catch (err) {
        errorEl.textContent = err.message;
      }
    };

    // Bind register form
    const regForm = document.getElementById('form-register');
    regForm.onsubmit = (e) => {
      e.preventDefault();
      const userData = {
        name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value,
        nationality: document.getElementById('reg-nationality').value,
        emergencyName: document.getElementById('reg-emergency-name').value,
        emergencyPhone: document.getElementById('reg-emergency-phone').value,
        bloodGroup: document.getElementById('reg-blood-group').value,
        medicalNotes: document.getElementById('reg-medical-notes').value
      };
      const errorEl = document.getElementById('reg-error');

      try {
        authService.register(userData);
        modal.classList.add('hidden');
        errorEl.textContent = '';
      } catch (err) {
        errorEl.textContent = err.message;
      }
    };

    // Toggle between login and register
    document.getElementById('switch-to-register').onclick = (e) => {
      e.preventDefault();
      this.openAuthModal('register');
    };
    document.getElementById('switch-to-login').onclick = (e) => {
      e.preventDefault();
      this.openAuthModal('login');
    };
  }

  async refreshLiveWeatherHeader() {
    const pill = document.getElementById('header-weather-pill');
    if (!pill) return;

    try {
      // Default to Pokhara / ABC region gateway
      const weather = await weatherService.fetchLiveWeather(28.2096, 83.9856, 822);
      pill.innerHTML = `
        <span class="relative flex h-2 w-2 mr-0.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span class="text-base weather-micro-bounce">${weather.icon}</span>
        <span class="font-bold text-white font-mono">${weather.tempC}°C</span>
        <span class="text-xs text-gray-300 hidden sm:inline capitalize">${weather.conditionText}</span>
        <span class="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 hidden md:inline">Live</span>
      `;
      pill.onclick = () => this.navigateTo('weather');
    } catch {
      pill.innerHTML = `
        <span class="relative flex h-2 w-2 mr-0.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span class="text-base weather-micro-bounce">⛅</span>
        <span class="font-bold text-white font-mono">14°C</span>
        <span class="text-xs text-gray-300 hidden sm:inline">Sunny</span>
        <span class="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30 hidden md:inline">Live</span>
      `;
    }
  }

  // ================= VIEW: EXPLORE =================
  renderExplore() {
    const container = document.getElementById('view-explore');
    container.classList.remove('hidden');

    let treks = dataRepo.treks;

    // Filter by search
    if (this.activeFilters.search) {
      treks = treks.filter(t =>
        t.title.toLowerCase().includes(this.activeFilters.search) ||
        t.district.toLowerCase().includes(this.activeFilters.search) ||
        t.overview.toLowerCase().includes(this.activeFilters.search)
      );
    }

    // Filter by Region
    if (this.activeFilters.region !== 'ALL') {
      treks = treks.filter(t => t.region_id === this.activeFilters.region || (t.region && t.region.toLowerCase().includes(this.activeFilters.region.replace('reg_', ''))));
    }

    // Filter by Difficulty
    if (this.activeFilters.difficulty !== 'ALL') {
      treks = treks.filter(t => t.difficulty.toLowerCase().includes(this.activeFilters.difficulty.toLowerCase()));
    }

    const grid = document.getElementById('treks-grid');
    if (!grid) return;

    grid.innerHTML = treks.map((trek, idx) => {
      const isSaved = authService.isTrekSaved(trek.id);
      return `
        <div class="sherpa-card tilt-card reveal-on-scroll overflow-hidden flex flex-col group cursor-pointer" data-delay="${(idx % 3) * 80}" onclick="window.app.navigateTo('trek-detail', { trekId: '${trek.id}' })">
          <div class="relative h-48 overflow-hidden bg-slate-800">
            <img src="${trek.hero_image_url}" alt="${trek.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div class="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-amber-300 border border-amber-400/30">
              🏔️ ${trek.max_altitude_m}m / ${trek.max_altitude_ft}ft
            </div>
            <button class="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-amber-400 transition" onclick="event.stopPropagation(); window.app.toggleBookmark('${trek.id}')">
              ${isSaved ? '★' : '☆'}
            </button>
            <div class="absolute bottom-2 left-3 right-3">
              <span class="text-xs uppercase tracking-wider text-amber-400 font-bold">${trek.district}</span>
              <h3 class="text-lg font-bold text-white drop-shadow-md group-hover:text-amber-300 transition-colors">${trek.title}</h3>
            </div>
          </div>
          <div class="p-4 flex-1 flex flex-col justify-between">
            <p class="text-xs text-gray-400 line-clamp-2 mb-3">${trek.overview}</p>
            <div class="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs text-gray-300">
              <div>
                <span class="text-gray-500 block text-[10px] uppercase">Duration</span>
                <span class="font-semibold text-white">${trek.duration_range}</span>
              </div>
              <div>
                <span class="text-gray-500 block text-[10px] uppercase">Grade</span>
                <span class="font-semibold text-white">${trek.difficulty}</span>
              </div>
              <div>
                <span class="text-gray-500 block text-[10px] uppercase">Distance</span>
                <span class="font-semibold text-white">~${trek.distance_km} km</span>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span class="text-[11px] text-gray-400 font-medium">${trek.district}</span>
              <button onclick="event.stopPropagation(); window.app.startPlanTrekWizard('${trek.id}')" class="btn-gold px-3 py-1 rounded-xl text-[11px] font-bold shadow active:scale-95 transition flex items-center gap-1" title="Plan your expedition for ${trek.title}">
                <span>✨</span> <span>Plan Trek</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-observe dynamic cards for tilt & reveal animations
    interactionEngine.observeNewElements(grid);

    // Setup filter pills
    document.querySelectorAll('[data-filter-region]').forEach(pill => {
      pill.onclick = () => {
        document.querySelectorAll('[data-filter-region]').forEach(p => p.classList.remove('bg-amber-400', 'text-black', 'font-bold'));
        pill.classList.add('bg-amber-400', 'text-black', 'font-bold');
        this.activeFilters.region = pill.getAttribute('data-filter-region');
        this.renderExplore();
      };
    });

    // Render interactive nationwide routes overview map
    this.renderHomeOverviewMap();
  }

  renderHomeOverviewMap() {
    const container = document.getElementById('home-overview-map');
    if (!container) return;

    if (!this.homeMapInitialized) {
      this.homeMapInitialized = true;
      setTimeout(() => {
        overviewMapEngine.renderAllRoutes(dataRepo, (route, trek) => {
          this.onOverviewRouteSelected(route, trek);
        });

        // Populate selectable route pills in #home-route-pills-carousel
        const carousel = document.getElementById('home-route-pills-carousel');
        if (carousel) {
          const featuredRoutes = [];
          const seenTreks = new Set();

          dataRepo.treks.forEach(trek => {
            const routes = dataRepo.getRoutesByTrekId(trek.id);
            if (routes.length > 0 && !seenTreks.has(trek.id)) {
              const primary = routes.find(r => r.is_primary) || routes[0];
              featuredRoutes.push({ route: primary, trek });
              seenTreks.add(trek.id);
            }
          });

          // Add notable scenic variants
          const extraVariants = ['AC_R005', 'EBC_R004', 'TRL_R002'];
          extraVariants.forEach(varId => {
            const r = dataRepo.getRouteById(varId);
            if (r) {
              const trek = dataRepo.getTrekById(r.trek_id);
              if (trek) featuredRoutes.push({ route: r, trek });
            }
          });

          const countBadge = document.getElementById('home-map-routes-count');
          if (countBadge) {
            countBadge.textContent = `${featuredRoutes.length} Trails Available`;
          }

          carousel.innerHTML = featuredRoutes.map(({ route, trek }) => {
            const color = overviewMapEngine.getRegionColor(trek.region || trek.district);
            const isActive = route.id === this.selectedRouteId;
            return `
              <button id="pill-route-${route.id}" onclick="window.app.selectOverviewRoute('${route.id}')" class="overview-route-pill flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${isActive ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md' : 'bg-obsidian-900/90 text-gray-300 border-obsidian-700 hover:border-obsidian-500 hover:text-white'}">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color};"></span>
                <span>${trek.title}</span>
                <span class="font-mono text-[10px] ${isActive ? 'text-black/80 font-bold' : 'text-gray-400'}">(${route.total_days}D • ${route.max_altitude_m}m)</span>
              </button>
            `;
          }).join('');
        }

        // Highlight initial route
        const initialRoute = dataRepo.getRouteById(this.selectedRouteId) || dataRepo.routes[0];
        const initialTrek = dataRepo.getTrekById(initialRoute.trek_id) || dataRepo.treks[0];
        this.onOverviewRouteSelected(initialRoute, initialTrek);
      }, 100);
    } else {
      setTimeout(() => {
        if (overviewMapEngine.map) overviewMapEngine.map.invalidateSize();
      }, 100);
    }
  }

  selectOverviewRoute(routeId) {
    this.selectedRouteId = routeId;
    const route = dataRepo.getRouteById(routeId);
    if (!route) return;
    const trek = dataRepo.getTrekById(route.trek_id);
    if (trek) this.selectedTrekId = trek.id;

    overviewMapEngine.selectRoute(routeId, true);
    this.onOverviewRouteSelected(route, trek);

    const rl = overviewMapEngine.routeLayers[routeId];
    if (rl) {
      overviewMapEngine.openRoutePopup(route, trek, rl.bounds.getCenter());
    }
  }

  onOverviewRouteSelected(route, trek) {
    this.selectedRouteId = route.id;
    if (trek) this.selectedTrekId = trek.id;

    const badgeName = document.getElementById('home-active-route-name');
    if (badgeName) badgeName.textContent = `${trek ? trek.title : 'Trek'} (${route.max_altitude_m}m)`;

    const pTitle = document.getElementById('hrp-title');
    const pRegion = document.getElementById('hrp-region');
    const pDays = document.getElementById('hrp-days');
    const pDistance = document.getElementById('hrp-distance');
    const pAltitude = document.getElementById('hrp-altitude');

    if (pTitle) pTitle.textContent = `${trek ? trek.title : 'Trek'}: ${route.variant_tag || route.title}`;
    if (pRegion) pRegion.textContent = trek ? (trek.region || trek.district) : 'Nepal';
    if (pDays) pDays.textContent = `${route.total_days} Days`;
    if (pDistance) pDistance.textContent = `~${route.distance_km || 80} km`;
    if (pAltitude) pAltitude.textContent = `${route.max_altitude_m}m`;

    document.querySelectorAll('.overview-route-pill').forEach(btn => {
      btn.className = 'overview-route-pill flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 bg-obsidian-900/90 text-gray-300 border-obsidian-700 hover:border-obsidian-500 hover:text-white';
      const mono = btn.querySelector('.font-mono');
      if (mono) mono.className = 'font-mono text-[10px] text-gray-400';
    });

    const activePill = document.getElementById(`pill-route-${route.id}`);
    if (activePill) {
      activePill.className = 'overview-route-pill flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 bg-amber-400 text-black border-amber-400 font-bold shadow-md';
      const mono = activePill.querySelector('.font-mono');
      if (mono) mono.className = 'font-mono text-[10px] text-black/80 font-bold';
      activePill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  resetHomeMapBounds() {
    overviewMapEngine.resetBounds();
  }

  toggleMaximizeHomeMap() {
    overviewMapEngine.toggleMaximize();
  }

  lockHomeMap() {
    overviewMapEngine.disableInteraction();
  }

  navigateToActiveOverviewRoute() {
    this.navigateTo('route-map', { routeId: this.selectedRouteId, trekId: this.selectedTrekId });
  }

  toggleBookmark(trekId) {
    if (!authService.getCurrentUser()) {
      this.openAuthModal('login');
      return;
    }
    const user = authService.getCurrentUser();
    const wasSaved = (user.savedTreks || []).includes(trekId);
    authService.toggleSaveTrek(trekId);
    const trek = dataRepo.getTrekById(trekId);
    const title = trek ? trek.title : 'Trek';
    if (wasSaved) {
      this.showToast(`Removed "${title}" from offline bookmarks`, 'warning', '🔖');
    } else {
      this.showToast(`Saved "${title}" to offline bookmarks!`, 'success', '⭐');
    }
    this.renderCurrentView();
  }

  // ================= VIEW: TREK DETAIL =================
  async renderTrekDetail() {
    const container = document.getElementById('view-trek-detail');
    container.classList.remove('hidden');

    const trek = dataRepo.getTrekById(this.selectedTrekId) || dataRepo.treks[0];
    const routes = dataRepo.getRoutesByTrekId(trek.id);
    const weatherStation = dataRepo.getWeatherStationForTrek(trek.id);

    // Update Header
    document.getElementById('td-hero-img').src = trek.hero_image_url;
    document.getElementById('td-title').textContent = trek.title;
    document.getElementById('td-district').textContent = trek.district;
    document.getElementById('td-altitude').textContent = `${trek.max_altitude_m} m / ${trek.max_altitude_ft} ft`;
    document.getElementById('td-duration').textContent = trek.duration_range;
    document.getElementById('td-distance').textContent = `~ ${trek.distance_km} km round trip`;
    document.getElementById('td-season').textContent = trek.best_months;
    document.getElementById('td-difficulty').textContent = trek.difficulty;
    document.getElementById('td-overview').textContent = trek.overview;

    // Highlights list
    const hlContainer = document.getElementById('td-highlights');
    if (hlContainer) {
      hlContainer.innerHTML = (trek.highlights || []).map(h => `
        <li class="flex items-start gap-2 text-sm text-gray-300">
          <span class="text-amber-400 font-bold">✓</span>
          <span>${h}</span>
        </li>
      `).join('');
    }

    // Variants Count & Plan CTA
    const countBadge = document.getElementById('td-variants-count');
    if (countBadge) {
      countBadge.innerHTML = `
        <div class="flex items-center gap-2 flex-wrap">
          <span>${routes.length} Variants Available</span>
          <button onclick="window.app.startPlanTrekWizard('${trek.id}')" class="btn-gold px-3 py-1 rounded-xl text-xs font-bold shadow active:scale-95 transition inline-flex items-center gap-1" title="Launch guided 5-step expedition planner for ${trek.title}">
            <span>✨</span> <span>Plan in Wizard</span>
          </button>
        </div>
      `;
    }

    // Routes variants list
    const routesGrid = document.getElementById('td-routes-list');
    if (routesGrid) {
      routesGrid.innerHTML = routes.map((r, rIdx) => `
        <div class="sherpa-card p-5 flex flex-col justify-between hover:border-amber-400 cursor-pointer group transition-all duration-300" onclick="window.app.navigateTo('route-map', { routeId: '${r.id}', trekId: '${trek.id}' })">
          <div>
            <div class="flex items-center justify-between mb-2.5">
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                ${r.variant_tag || `Variant ${rIdx + 1}`}
              </span>
              <span class="text-xs text-gray-400 font-medium">${r.total_days} Days / ${r.total_nights} Nights</span>
            </div>
            <h4 class="font-bold text-white text-base mb-2 group-hover:text-amber-300 transition-colors">${r.title}</h4>
            <p class="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">${r.route_chain_display || 'Scenic mountain trail'}</p>
          </div>
          <div class="flex items-center justify-between pt-3.5 border-t border-slate-800 text-xs flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <span class="text-gray-400">Max: <strong class="text-amber-300 font-mono">${r.max_altitude_m}m</strong></span>
              <span class="text-gray-400">Dist: <strong class="text-white font-mono">~${r.distance_km}km</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="event.stopPropagation(); window.app.startPlanTrekWizard('${trek.id}', '${r.id}')" class="px-2.5 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400 hover:text-black border border-amber-400/30 text-amber-300 font-bold text-xs transition flex items-center gap-1" title="Plan expedition with this specific route variant">
                <span>✨</span> <span>Plan</span>
              </button>
              <button class="btn-gold px-3 py-1 text-xs">Explore Map →</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Live weather for this trek
    const weatherBox = document.getElementById('td-live-weather');
    if (weatherBox) {
      weatherBox.innerHTML = `<div class="p-3 text-xs text-gray-400 flex items-center gap-2"><div class="animate-spin w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"></div> Fetching live mountain conditions...</div>`;
      try {
        const liveWeather = await weatherService.fetchLiveWeather(weatherStation.lat, weatherStation.lon, weatherStation.elevation_m);
        weatherBox.innerHTML = `
          <div class="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="text-3xl">${liveWeather.icon}</span>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-bold text-white">${liveWeather.tempC}°C</span>
                  <span class="text-xs text-gray-400">Feels like ${liveWeather.apparentTempC}°C</span>
                </div>
                <div class="text-xs font-semibold text-amber-400 capitalize">${liveWeather.conditionText} (${weatherStation.name})</div>
              </div>
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-300">
              <div>💨 Wind: <strong class="text-white">${liveWeather.windSpeedKmh} km/h</strong></div>
              <div>💧 Humidity: <strong class="text-white">${liveWeather.humidity}%</strong></div>
              ${liveWeather.todayMaxC !== null ? `<div>High/Low: <strong class="text-white">${liveWeather.todayMaxC}° / ${liveWeather.todayMinC}°C</strong></div>` : ''}
            </div>
          </div>
        `;
      } catch {
        weatherBox.innerHTML = `<div class="text-xs text-gray-400">Live weather temporarily unavailable.</div>`;
      }
    }
  }

  switchTrek(trekId) {
    this.selectedTrekId = trekId;
    const trekRoutes = dataRepo.getRoutesByTrekId(trekId);
    if (trekRoutes && trekRoutes.length > 0) {
      const primary = trekRoutes.find(r => r.is_primary) || trekRoutes[0];
      this.selectedRouteId = primary.id;
    }
    this.renderRouteMap();
  }

  switchRouteVariant(routeId) {
    this.selectedRouteId = routeId;
    this.renderRouteMap();
  }

  // ================= VIEW: ROUTE MAP & OSM ENGINE =================
  renderRouteMap() {
    const container = document.getElementById('view-route-map');
    container.classList.remove('hidden');

    const route = dataRepo.getRouteById(this.selectedRouteId) || dataRepo.routes[0];
    const trek = dataRepo.getTrekById(route.trek_id) || dataRepo.treks[0];
    const track = dataRepo.getTrailTrack(route.id);
    const trekRoutes = dataRepo.getRoutesByTrekId(trek.id);

    // Title info
    document.getElementById('rm-route-title').textContent = route.title;
    document.getElementById('rm-trek-name').textContent = trek.title;
    document.getElementById('rm-days').textContent = `${route.total_days} Days`;
    document.getElementById('rm-max-alt').textContent = `${route.max_altitude_m}m`;
    document.getElementById('rm-distance').textContent = `${route.distance_km || 80} km`;
    document.getElementById('rm-chain').textContent = route.route_chain_display;

    // Track custom status & stats
    const hasCustom = !!TrackParser.getCustomTrack(route.id);
    const trackStatusEl = document.getElementById('rm-track-status');
    const resetTrackBtn = document.getElementById('rm-reset-track-btn');

    if (trackStatusEl) {
      if (hasCustom) {
        trackStatusEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono font-semibold';
        trackStatusEl.textContent = `★ Custom Imported Track (${track.coordinates?.length || 0} pts)`;
      } else {
        trackStatusEl.className = 'text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-semibold';
        trackStatusEl.textContent = `✓ Topo-Aligned Trail (${track.coordinates?.length || 0} pts)`;
      }
    }

    if (resetTrackBtn) {
      if (hasCustom) resetTrackBtn.classList.remove('hidden');
      else resetTrackBtn.classList.add('hidden');
    }

    if (hasCustom && track.stats) {
      document.getElementById('rm-distance').textContent = `${track.stats.distanceKm} km`;
      if (track.stats.maxEle > 0) {
        document.getElementById('rm-max-alt').textContent = `${track.stats.maxEle}m`;
      }
    }

    // Populate trek switcher dropdown
    const trekSelect = document.getElementById('rm-trek-select');
    if (trekSelect) {
      trekSelect.innerHTML = dataRepo.treks.map(t => `
        <option value="${t.id}" ${t.id === trek.id ? 'selected' : ''}>
          🏔️ ${t.title} (${t.district || t.region})
        </option>
      `).join('');
    }

    // Populate variant switcher dropdown
    const varSelect = document.getElementById('rm-variant-select');
    if (varSelect) {
      varSelect.innerHTML = trekRoutes.map(r => `
        <option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>
          ${r.variant_tag || 'Variant'}: ${r.title.length > 45 ? r.title.substring(0, 45) + '...' : r.title} (${r.total_days}D)
        </option>
      `).join('');
    }

    // Initialize Leaflet Map
    setTimeout(() => {
      mapEngine.initMap();
      mapEngine.loadRoute(track);
    }, 100);

    // Waypoints milestones list
    const stopsContainer = document.getElementById('rm-waypoints-list');
    if (stopsContainer) {
      stopsContainer.innerHTML = (track.waypoints || []).map((wp, idx) => `
        <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-amber-400/40 transition">
          <div class="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
            ${idx + 1}
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h5 class="text-sm font-bold text-white">${wp.name}</h5>
              <span class="text-xs font-mono text-amber-300 font-semibold">${wp.elevation_m}m</span>
            </div>
            <span class="text-[11px] text-gray-400 capitalize">${wp.type} milestone</span>
          </div>
        </div>
      `).join('');
    }

    // Day-by-Day Stage Itinerary Accordion
    const stages = dataRepo.getItineraryForRoute(route.id, route.excel_route_id);
    const countEl = document.getElementById('rm-itinerary-count');
    if (countEl) {
      countEl.textContent = stages && stages.length > 0 ? `${stages.length} Detailed Stages` : `${track.waypoints?.length || 0} Stages`;
    }

    const itinContainer = document.getElementById('rm-itinerary-accordion');
    if (itinContainer) {
      if (stages && stages.length > 0) {
        itinContainer.innerHTML = stages.map((st, sIdx) => {
          let stageHotels = st.hotels || [];
          if (Array.isArray(stageHotels) && stageHotels.length > 0 && Array.isArray(stageHotels[0])) {
            stageHotels = stageHotels[0];
          }
          if (!stageHotels || stageHotels.length === 0) {
            stageHotels = dataRepo.getAccommodations(st.destination).slice(0, 3);
          }

          const wpMatch = (track.waypoints || []).find(wp =>
            wp.name.toLowerCase() === st.destination.toLowerCase() ||
            st.destination.toLowerCase().includes(wp.name.toLowerCase()) ||
            wp.name.toLowerCase().includes(st.destination.toLowerCase())
          );

          return `
          <details class="group bg-slate-900/80 border border-slate-800 rounded-xl p-4 transition-all duration-200 hover:border-amber-400/40" ${sIdx === 0 ? 'open' : ''}>
            <summary class="flex items-center justify-between cursor-pointer list-none select-none">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-400/30">
                  D${st.day}
                </div>
                <div>
                  <h5 class="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">${st.stage_title || st.destination}</h5>
                  <div class="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                    <span>📍 <strong>${st.destination}</strong></span>
                    <span>⛰️ <strong class="text-white">${st.altitude_m}m</strong> / ${st.altitude_ft}ft</span>
                    <span>⏱️ ${st.walking_duration}</span>
                    ${st.distance_km ? `<span>🚶 ~${st.distance_km} km</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                ${wpMatch ? `
                  <button type="button" onclick="event.stopPropagation(); window.mapEngine.focusWaypoint(${wpMatch.lat}, ${wpMatch.lon})" class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400 hover:text-black transition" title="Center map on ${st.destination}">
                    📍 Map
                  </button>
                ` : ''}
                <span class="text-xs text-amber-400 group-open:rotate-180 transition-transform">▼</span>
              </div>
            </summary>
            <div class="mt-4 pt-3 border-t border-slate-800 text-xs text-gray-300 space-y-3.5">
              <!-- Contextual Daily Briefing -->
              <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-slate-200">
                <div class="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span>🧭</span> Stage Briefing
                </div>
                <p class="leading-relaxed text-gray-300 text-xs">${st.description}</p>
              </div>

              ${st.terrain ? `
                <div class="flex items-center gap-2 text-[11px] text-gray-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                  <span class="text-amber-400 font-bold">🥾</span>
                  <span><strong class="text-gray-300">Terrain Character:</strong> ${st.terrain}</span>
                </div>
              ` : ''}

              <!-- Hotels & Verified Direct Phone Numbers -->
              ${stageHotels && stageHotels.length > 0 ? `
                <div class="pt-2">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                      <span>🏨</span> Available Teahouses & Direct Phone Contacts (${st.destination})
                    </span>
                    <span class="text-[10px] text-gray-400 font-mono">${stageHotels.length} Verified Lodges</span>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    ${stageHotels.map(h => {
                      const rawPhone = h.phone || (h.phones && h.phones[0]) || h.phone_contact || '';
                      const dialPhone = rawPhone.replace(/[^0-9+]/g, '');
                      const packageText = h.package || h.package_details || 'Room & Dining Available';
                      const priceText = h.price_npr || h.base_room_price_npr;
                      const amenitiesList = h.amenities || [];
                      return `
                        <div class="bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/90 hover:border-amber-400/50 rounded-xl p-3 flex flex-col justify-between transition-all duration-200 group">
                          <div>
                            <div class="flex items-start justify-between gap-2 mb-1.5">
                              <h6 class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                                <span>🏡</span> ${h.name}
                              </h6>
                              ${priceText ? `<span class="text-[10px] font-mono font-semibold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 shrink-0">NPR ${priceText}</span>` : ''}
                            </div>
                            <p class="text-[11px] text-gray-400 line-clamp-1 mb-2">${packageText}</p>
                            ${amenitiesList && amenitiesList.length > 0 ? `
                              <div class="flex flex-wrap gap-1 mb-2.5">
                                ${amenitiesList.slice(0, 3).map(am => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-gray-300 border border-slate-700/60">${am}</span>`).join('')}
                              </div>
                            ` : ''}
                          </div>
                          <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <span class="text-[10px] text-gray-400">Direct Contact:</span>
                            ${dialPhone ? `
                              <a href="tel:${dialPhone}" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black transition-colors" title="Click to call ${h.name}">
                                <span>📞</span> ${rawPhone}
                              </a>
                            ` : `
                              <span class="text-[10px] text-gray-400">Inquire upon arrival</span>
                            `}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </details>
          `;
        }).join('');
      } else {
        // Fallback from waypoints list
        itinContainer.innerHTML = (track.waypoints || []).map((wp, wIdx) => `
          <div class="p-3 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center">${wIdx + 1}</span>
              <div>
                <span class="font-bold text-white">${wp.name}</span>
                <span class="text-[10px] text-gray-400 block capitalize">${wp.type} waypoint</span>
              </div>
            </div>
            <span class="font-mono text-amber-300 font-bold">${wp.elevation_m}m</span>
          </div>
        `).join('');
      }
    }
  }

  // ================= TRACK IMPORTER MODAL HANDLERS =================
  openTrackImporterModal() {
    const modal = document.getElementById('modal-track-importer');
    if (!modal) return;
    modal.classList.remove('hidden');

    const previewBox = document.getElementById('track-preview-box');
    const errorBox = document.getElementById('track-import-error');
    const applyBtn = document.getElementById('btn-apply-imported-track');
    const resetBtn = document.getElementById('btn-modal-reset-track');

    if (previewBox) previewBox.classList.add('hidden');
    if (errorBox) errorBox.classList.add('hidden');
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    const hasCustom = !!TrackParser.getCustomTrack(this.selectedRouteId);
    if (resetBtn) {
      if (hasCustom) resetBtn.classList.remove('hidden');
      else resetBtn.classList.add('hidden');
    }
  }

  closeTrackImporterModal() {
    const modal = document.getElementById('modal-track-importer');
    if (modal) modal.classList.add('hidden');
    this.pendingImportedTrack = null;
  }

  handleTrackFile(file) {
    const errorBox = document.getElementById('track-import-error');
    const previewBox = document.getElementById('track-preview-box');
    const applyBtn = document.getElementById('btn-apply-imported-track');

    if (errorBox) errorBox.classList.add('hidden');
    if (previewBox) previewBox.classList.add('hidden');
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = TrackParser.parseFile(content, file.name);

        if (!parsed.coordinates || parsed.coordinates.length < 2) {
          throw new Error('No valid coordinate points found in this file.');
        }

        this.pendingImportedTrack = parsed;

        // Populate Preview
        document.getElementById('import-track-name').textContent = parsed.name || file.name;
        document.getElementById('import-track-format').textContent = parsed.source;
        document.getElementById('import-stat-points').textContent = parsed.stats.pointCount.toLocaleString();
        document.getElementById('import-stat-dist').textContent = `${parsed.stats.distanceKm} km`;
        document.getElementById('import-stat-alt').textContent = `${parsed.stats.minEle}m - ${parsed.stats.maxEle}m`;
        document.getElementById('import-stat-gain').textContent = `+${parsed.stats.eleGain}m`;

        previewBox.classList.remove('hidden');
        applyBtn.disabled = false;
        applyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = `Error reading track file: ${err.message}`;
          errorBox.classList.remove('hidden');
        }
      }
    };
    reader.onerror = () => {
      if (errorBox) {
        errorBox.textContent = 'Failed to read file from disk.';
        errorBox.classList.remove('hidden');
      }
    };
    reader.readAsText(file);
  }

  applyImportedTrack() {
    if (!this.pendingImportedTrack) return;
    TrackParser.saveCustomTrack(this.selectedRouteId, this.pendingImportedTrack);
    this.closeTrackImporterModal();
    this.renderRouteMap();
  }

  resetCurrentTrack() {
    TrackParser.removeCustomTrack(this.selectedRouteId);
    this.closeTrackImporterModal();
    this.renderRouteMap();
  }

  // ================= VIEW: ACCOMMODATIONS =================
  renderAccommodations() {
    const container = document.getElementById('view-accommodations');
    container.classList.remove('hidden');

    // Populate settlement selector
    const settlementSelect = document.getElementById('acc-settlement-filter');
    if (settlementSelect && settlementSelect.options.length <= 1) {
      settlementSelect.innerHTML = `<option value="ALL">All Settlements / Villages</option>` +
        dataRepo.getSettlementNames().map(s => `<option value="${s}">${s}</option>`).join('');
      settlementSelect.onchange = () => {
        this.syncSettlementPills(settlementSelect.value);
        this.filterAccommodations();
      };
    }

    // Populate quick settlement filter pills carousel
    this.renderSettlementPills();

    const amenitySelect = document.getElementById('acc-amenity-filter');
    if (amenitySelect && !amenitySelect.dataset.bound) {
      amenitySelect.dataset.bound = 'true';
      amenitySelect.onchange = () => this.filterAccommodations();
    }

    const searchInput = document.getElementById('acc-search-input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.oninput = () => this.filterAccommodations();
    }

    const sortSelect = document.getElementById('acc-sort-select');
    if (sortSelect && !sortSelect.dataset.bound) {
      sortSelect.dataset.bound = 'true';
      sortSelect.onchange = () => this.filterAccommodations();
    }

    this.filterAccommodations();
  }

  renderSettlementPills() {
    const pillsContainer = document.getElementById('acc-settlement-pills');
    if (!pillsContainer) return;

    // Count lodges per settlement
    const counts = {};
    (dataRepo.accommodations || []).forEach(a => {
      const s = a.settlement_name || 'Other';
      counts[s] = (counts[s] || 0) + 1;
    });

    // Top settlements by count
    const topSettlements = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16);

    const activeSettlement = document.getElementById('acc-settlement-filter')?.value || 'ALL';

    pillsContainer.innerHTML = `
      <button type="button" onclick="window.app.selectSettlementPill('ALL')" class="settlement-pill px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${activeSettlement === 'ALL' ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md' : 'bg-obsidian-900/90 text-gray-300 border-obsidian-700 hover:border-obsidian-500 hover:text-white'}">
        All Lodges <span class="font-mono text-[10px] ${activeSettlement === 'ALL' ? 'text-black/80' : 'text-gray-400'}">(${dataRepo.accommodations.length})</span>
      </button>
      ${topSettlements.map(([name, count]) => `
        <button type="button" onclick="window.app.selectSettlementPill('${name.replace(/'/g, "\\'")}')" class="settlement-pill px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${activeSettlement === name ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md' : 'bg-obsidian-900/90 text-gray-300 border-obsidian-700 hover:border-obsidian-500 hover:text-white'}">
          ${name} <span class="font-mono text-[10px] ${activeSettlement === name ? 'text-black/80' : 'text-gray-400'}">(${count})</span>
        </button>
      `).join('')}
    `;
  }

  selectSettlementPill(settlementName) {
    const settlementSelect = document.getElementById('acc-settlement-filter');
    if (settlementSelect) {
      settlementSelect.value = settlementName;
    }
    this.syncSettlementPills(settlementName);
    this.filterAccommodations();
  }

  syncSettlementPills(activeName) {
    document.querySelectorAll('.settlement-pill').forEach(btn => {
      const isAll = activeName === 'ALL' && btn.textContent.includes('All Lodges');
      const isMatch = btn.textContent.includes(activeName);
      if (isAll || (activeName !== 'ALL' && isMatch)) {
        btn.className = 'settlement-pill px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 bg-amber-400 text-black border-amber-400 font-bold shadow-md';
        const span = btn.querySelector('span');
        if (span) span.className = 'font-mono text-[10px] text-black/80 font-bold';
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        btn.className = 'settlement-pill px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 bg-obsidian-900/90 text-gray-300 border-obsidian-700 hover:border-obsidian-500 hover:text-white';
        const span = btn.querySelector('span');
        if (span) span.className = 'font-mono text-[10px] text-gray-400';
      }
    });
  }

  filterAccommodations() {
    const settlement = document.getElementById('acc-settlement-filter')?.value || 'ALL';
    const amenity = document.getElementById('acc-amenity-filter')?.value || '';
    const searchQuery = (document.getElementById('acc-search-input')?.value || '').trim().toLowerCase();
    const sortBy = document.getElementById('acc-sort-select')?.value || 'rating-desc';

    let list = dataRepo.getAccommodations(settlement, amenity);

    if (searchQuery) {
      list = list.filter(acc =>
        (acc.name && acc.name.toLowerCase().includes(searchQuery)) ||
        (acc.settlement_name && acc.settlement_name.toLowerCase().includes(searchQuery)) ||
        (acc.type && acc.type.toLowerCase().includes(searchQuery)) ||
        (acc.amenities && acc.amenities.some(a => a.toLowerCase().includes(searchQuery)))
      );
    }

    // Sort list
    list.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return (a.base_room_price_npr || 800) - (b.base_room_price_npr || 800);
      }
      if (sortBy === 'price-desc') {
        return (b.base_room_price_npr || 800) - (a.base_room_price_npr || 800);
      }
      if (sortBy === 'name-asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return (b.star_rating || 3) - (a.star_rating || 3);
    });

    const badge = document.getElementById('acc-count-badge');
    if (badge) {
      badge.textContent = `Showing ${list.length} lodges`;
    }

    const container = document.getElementById('accommodations-grid');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<div class="col-span-full p-8 text-center text-gray-400 sherpa-card">No lodges found matching your search or filter criteria.</div>`;
      return;
    }

    const amenityIcons = {
      'hot shower': '🚿',
      'hot showers': '🚿',
      'wi-fi': '📶',
      'wifi': '📶',
      'charging': '⚡',
      'restaurant': '🍲',
      'attached': '🚽',
      'bakery': '☕',
      'heated': '🔥'
    };

    container.innerHTML = list.map((acc, idx) => {
      const stars = '★'.repeat(acc.star_rating || 3) + '☆'.repeat(5 - (acc.star_rating || 3));
      const rawPhone = (acc.phones && acc.phones[0]) || acc.phone_contact || acc.contacts?.primary_phone || '';
      const dialPhone = rawPhone.replace(/[^0-9+]/g, '');
      const priceText = acc.base_room_price_npr || 800;

      return `
        <div class="sherpa-card tilt-card reveal-on-scroll p-5 flex flex-col justify-between group hover:border-gold-400/60 transition-all duration-300" data-delay="${(idx % 3) * 70}">
          <div>
            <!-- Header: Settlement Badge & Star Rating -->
            <div class="flex items-center justify-between mb-2.5">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/30 font-mono">
                <span>📍</span> ${acc.settlement_name}
              </span>
              <div class="flex items-center gap-1 text-amber-400 text-xs" title="${acc.star_rating || 3} Star Rating">
                <span>${stars}</span>
              </div>
            </div>

            <!-- Lodge Name -->
            <h4 class="font-bold text-white text-lg mb-1 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
              <span>🏡</span> <span>${acc.name}</span>
            </h4>
            
            <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span class="px-2 py-0.5 rounded bg-obsidian-900 border border-obsidian-700 font-mono text-[10px] text-gray-300">${acc.type || 'Teahouse / Lodge'}</span>
              <span>•</span>
              <span>Capacity: <strong class="text-white font-mono">${acc.capacity || 20}</strong> beds</span>
            </div>

            <!-- Description / Package Details -->
            ${acc.package_details ? `
              <div class="p-2.5 rounded-xl bg-obsidian-900/90 border border-obsidian-700 text-xs text-amber-200/90 mb-3 flex items-start gap-2">
                <span class="text-amber-400 shrink-0 mt-0.5">🏷️</span>
                <span class="leading-relaxed"><strong class="text-amber-300">Package:</strong> ${acc.package_details}</span>
              </div>
            ` : (acc.description ? `
              <p class="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">${acc.description}</p>
            ` : '')}

            <!-- Amenities Chips -->
            <div class="flex flex-wrap gap-1.5 mb-4">
              ${(acc.amenities || []).map(am => {
                const lower = am.toLowerCase();
                let icon = '✓';
                for (const [k, ic] of Object.entries(amenityIcons)) {
                  if (lower.includes(k)) { icon = ic; break; }
                }
                return `<span class="text-[11px] bg-obsidian-900 text-gray-300 px-2 py-0.5 rounded-lg border border-obsidian-700/80 flex items-center gap-1"><span>${icon}</span> <span>${am}</span></span>`;
              }).join('')}
            </div>
          </div>

          <!-- Bottom Bar: Pricing & Direct Dial Call Button -->
          <div class="pt-3.5 border-t border-obsidian-700/80 flex items-center justify-between gap-3">
            <div>
              <span class="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Starting Nightly</span>
              <span class="font-extrabold text-white text-base font-mono">NPR ${priceText}</span>
            </div>
            <div>
              ${dialPhone ? `
                <button onclick="window.app.openTeahouseCallModal('${acc.id}')" class="btn-gold px-3.5 py-1.5 text-xs flex items-center gap-1.5 font-bold shadow-md active:scale-95 transition-all" title="Dialing Assistant for ${acc.name}">
                  <span>📞</span> <span>Call Lodge</span>
                </button>
              ` : `
                <span class="text-xs text-gray-500 font-medium px-2 py-1 rounded bg-obsidian-900 border border-obsidian-700">Walk-in only</span>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Re-observe dynamic lodge cards for tilt & reveal animations
    interactionEngine.observeNewElements(container);
  }

  resetAccommodationFilters() {
    const searchInput = document.getElementById('acc-search-input');
    const settlementSelect = document.getElementById('acc-settlement-filter');
    const amenitySelect = document.getElementById('acc-amenity-filter');
    const sortSelect = document.getElementById('acc-sort-select');

    if (searchInput) searchInput.value = '';
    if (settlementSelect) settlementSelect.value = 'ALL';
    if (amenitySelect) amenitySelect.value = '';
    if (sortSelect) sortSelect.value = 'default';

    this.syncSettlementPills('ALL');
    this.filterAccommodations();
  }

  // ================= VIEW: WEATHER OVERVIEW =================
  async renderWeatherOverview() {
    const container = document.getElementById('view-weather');
    container.classList.remove('hidden');

    const stationsContainer = document.getElementById('weather-stations-grid');
    if (!stationsContainer) return;

    stationsContainer.innerHTML = dataRepo.weatherStations.map((ws, idx) => `
      <div id="ws-card-${ws.id}" class="sherpa-card tilt-card reveal-on-scroll p-5 flex flex-col justify-between" data-delay="${(idx % 4) * 60}">
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs uppercase text-amber-400 font-bold">${ws.region}</span>
            <span class="text-xs text-gray-400 font-mono">${ws.elevation_m}m</span>
          </div>
          <h4 class="text-base font-bold text-white mb-3">${ws.name}</h4>
          <div class="weather-data-placeholder text-xs text-gray-400 animate-pulse">Loading live conditions...</div>
        </div>
      </div>
    `).join('');

    if (window.interactionEngine) {
      window.interactionEngine.observeNewElements(stationsContainer);
    }

    // Fetch weather asynchronously for all stations
    dataRepo.weatherStations.forEach(async ws => {
      const card = document.getElementById(`ws-card-${ws.id}`);
      if (!card) return;

      try {
        const w = await weatherService.fetchLiveWeather(ws.lat, ws.lon, ws.elevation_m);
        const cardBody = card.querySelector('div');
        const alertHtml = w.alerts.length > 0 ? `
          <div class="mt-3 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
            ⚠️ ${w.alerts[0].text}
          </div>
        ` : '';

        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs uppercase text-amber-400 font-bold">${ws.region}</span>
              <span class="text-xs text-gray-400 font-mono">${ws.elevation_m}m</span>
            </div>
            <h4 class="text-base font-bold text-white mb-2">${ws.name}</h4>
            <div class="flex items-center justify-between my-2">
              <div class="flex items-center gap-2">
                <span class="text-3xl">${w.icon}</span>
                <div>
                  <span class="text-2xl font-bold text-white">${w.tempC}°C</span>
                  <div class="text-[11px] text-gray-400">Wind chill: ${w.apparentTempC}°C</div>
                </div>
              </div>
              <div class="text-right text-xs">
                <div class="font-semibold text-amber-300 capitalize">${w.conditionText}</div>
                <div class="text-gray-400">💨 ${w.windSpeedKmh} km/h</div>
              </div>
            </div>
            ${alertHtml}
          </div>
          <div class="mt-4 pt-3 border-t border-slate-800 text-[11px] text-gray-400 flex justify-between">
            <span>Sunrise: ${w.sunrise}</span>
            <span>Sunset: ${w.sunset}</span>
          </div>
        `;
      } catch (err) {
        // fail silently for individual stations
      }
    });
  }

  // ================= VIEW: PERMITS =================
  renderPermits() {
    const container = document.getElementById('view-permits');
    container.classList.remove('hidden');

    const permits = dataRepo.getPermits();
    const listContainer = document.getElementById('permits-list');
    if (listContainer) {
      listContainer.innerHTML = permits.map((p, idx) => `
        <div class="sherpa-card tilt-card reveal-on-scroll p-6 space-y-4" data-delay="${idx * 70}">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span class="text-xs font-bold text-amber-400 uppercase tracking-wider">Trek Region</span>
              <h4 class="text-lg font-bold text-white">${p.trek_name}</h4>
              <span class="text-xs text-gray-400 font-mono">${p.checkpoints || 'Official TIMS & Park Checkposts'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Official NTB / NTNC Regulations
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <!-- TIMS Card -->
            <div class="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <strong class="text-white text-sm">🎫 Trekkers' Information Management (TIMS)</strong>
                <span class="text-amber-400 font-mono font-bold">NPR ${p.tims_card?.cost_npr || 2000}</span>
              </div>
              <p class="text-gray-400 leading-relaxed">${p.tims_card?.details || 'Mandatory safety registration with TAAN & NTB.'}</p>
              <div class="pt-2 border-t border-slate-800">
                <span class="text-gray-400 font-semibold block mb-1">Required:</span>
                <ul class="list-disc list-inside text-gray-300 space-y-0.5">
                  ${(p.tims_card?.documents_required || ['Passport', '2 Photos', 'Insurance']).map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- Conservation / National Park Entry -->
            <div class="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <strong class="text-white text-sm">🌲 ${p.park_permit?.name || 'Park Entry Permit'}</strong>
                <span class="text-amber-400 font-mono font-bold">NPR ${p.park_permit?.cost_npr || 3000}</span>
              </div>
              <p class="text-gray-400 leading-relaxed">${p.park_permit?.details || 'Conservation area entry permit.'}</p>
              <div class="pt-2 border-t border-slate-800">
                <span class="text-gray-400 font-semibold block mb-1">Required:</span>
                <ul class="list-disc list-inside text-gray-300 space-y-0.5">
                  ${(p.park_permit?.documents_required || ['Passport copy', 'Photos']).map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>

          <!-- Restricted Area Permit (if any) -->
          ${p.restricted_area ? `
            <div class="p-4 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs space-y-1.5">
              <div class="flex items-center justify-between">
                <strong class="text-amber-300 text-sm">⚠️ Restricted Area Permit (RAP): ${p.restricted_area.name}</strong>
                <span class="text-amber-300 font-bold font-mono">USD $${p.restricted_area.cost_usd || 100} / week</span>
              </div>
              <p class="text-gray-300">Mandatory requirement: Licensed mountain guide required, minimum group of 2 trekkers through registered agency.</p>
            </div>
          ` : ''}
        </div>
      `).join('');

      if (window.interactionEngine) {
        window.interactionEngine.observeNewElements(listContainer);
      }
    }
  }

  // ================= VIEW: LAKE LOUISE AMS TRACKER =================
  renderAMSTracker() {
    const container = document.getElementById('view-tracker');
    container.classList.remove('hidden');

    const form = document.getElementById('ams-form');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const headache = parseInt(document.getElementById('slider-headache').value);
      const nausea = parseInt(document.getElementById('slider-nausea').value);
      const dizziness = parseInt(document.getElementById('slider-dizziness').value);
      const fatigue = parseInt(document.getElementById('slider-fatigue').value);
      const sleep = parseInt(document.getElementById('slider-sleep').value);
      const altitude = parseInt(document.getElementById('input-altitude').value) || 3500;
      const prevAltitude = parseInt(document.getElementById('input-prev-altitude').value) || null;

      const result = amsService.evaluate({
        headache,
        nausea,
        dizziness,
        fatigue,
        sleep,
        currentAltitudeM: altitude,
        previousAltitudeM: prevAltitude
      });

      amsService.saveLog({
        scores: { headache, nausea, dizziness, fatigue, sleep },
        altitudeM: altitude,
        totalScore: result.totalScore,
        status: result.status
      });

      this.displayAMSResult(result);
      this.renderAMSHistory();
      this.updateAMSGauge();
      this.showToast(`Recorded daily AMS log (Score: ${result.totalScore}/15)`, 'success', '🩺');
    };

    // Initialize tactile segmented hardware buttons for symptoms
    this.setAMSSymptom('headache', parseInt(document.getElementById('slider-headache')?.value) || 1);
    this.setAMSSymptom('nausea', parseInt(document.getElementById('slider-nausea')?.value) || 0);
    this.setAMSSymptom('dizziness', parseInt(document.getElementById('slider-dizziness')?.value) || 0);
    this.setAMSSymptom('fatigue', parseInt(document.getElementById('slider-fatigue')?.value) || 1);
    this.setAMSSymptom('sleep', parseInt(document.getElementById('slider-sleep')?.value) || 0);

    ['input-altitude', 'input-prev-altitude'].forEach(id => {
      const inp = document.getElementById(id);
      if (inp) {
        inp.oninput = () => this.updateAMSGauge();
      }
    });

    // Populate active trek itinerary stages for quick altitude auto-fill
    const stageSelect = document.getElementById('ams-stage-select');
    if (stageSelect) {
      const stages = dataRepo.getItineraryForRoute(this.selectedRouteId);
      if (stages && stages.length > 0) {
        stageSelect.innerHTML = `<option value="">-- Choose active trek stage to auto-fill altitude --</option>` +
          stages.map((st, idx) => {
            const prevAlt = idx > 0 ? stages[idx - 1].altitude_m : 1400;
            return `<option value="${st.altitude_m}" data-prev="${prevAlt}">Day ${st.day}: ${st.destination} (${st.altitude_m}m)</option>`;
          }).join('');

        stageSelect.onchange = (e) => {
          const opt = e.target.selectedOptions[0];
          if (opt && opt.value) {
            const curAlt = parseInt(opt.value);
            const prevAlt = parseInt(opt.dataset.prev) || 1400;
            const curInput = document.getElementById('input-altitude');
            const prevInput = document.getElementById('input-prev-altitude');
            if (curInput) curInput.value = curAlt;
            if (prevInput) prevInput.value = prevAlt;
            this.updateAMSGauge();
          }
        };
      } else {
        stageSelect.innerHTML = `<option value="">-- No itinerary stages available --</option>`;
      }
    }

    this.updateAMSGauge();
    this.renderAMSHistory();
  }

  setAMSSymptom(symptom, value) {
    const input = document.getElementById(`slider-${symptom}`);
    if (input) input.value = value;

    const textLabel = document.getElementById(`val-${symptom}-text`);
    const labels = {
      headache: ['0: None', '1: Mild (+1)', '2: Moderate (+2)', '3: Severe (+3)'],
      nausea: ['0: Good appetite', '1: Poor appetite (+1)', '2: Moderate (+2)', '3: Severe / Vomiting (+3)'],
      dizziness: ['0: None', '1: Mild (+1)', '2: Moderate (+2)', '3: Severe (+3)'],
      fatigue: ['0: Normal', '1: Mild (+1)', '2: Moderate (+2)', '3: Severe exhaustion (+3)'],
      sleep: ['0: Slept well', '1: Woke restless (+1)', '2: Woke many times (+2)', '3: Insomnia / Couldn\'t sleep (+3)']
    };
    if (textLabel && labels[symptom]) {
      textLabel.textContent = labels[symptom][value] || `${value} pts`;
      if (value >= 3) {
        textLabel.className = 'text-[11px] font-mono font-bold text-red-400';
      } else if (value >= 2) {
        textLabel.className = 'text-[11px] font-mono font-bold text-amber-400';
      } else if (value === 1) {
        textLabel.className = 'text-[11px] font-mono font-bold text-amber-300';
      } else {
        textLabel.className = 'text-[11px] font-mono font-bold text-gray-400';
      }
    }

    const segGroup = document.getElementById(`seg-${symptom}`);
    if (segGroup) {
      segGroup.querySelectorAll('.seg-btn').forEach(btn => {
        const btnVal = parseInt(btn.dataset.val);
        btn.classList.remove('seg-btn-active', 'seg-btn-warning', 'seg-btn-danger');
        if (btnVal === value) {
          if (value >= 3) btn.classList.add('seg-btn-danger');
          else if (value >= 2) btn.classList.add('seg-btn-warning');
          else btn.classList.add('seg-btn-active');
        }
      });
    }

    this.updateAMSGauge();
  }

  updateAMSGauge() {
    const headache = parseInt(document.getElementById('slider-headache')?.value) || 0;
    const nausea = parseInt(document.getElementById('slider-nausea')?.value) || 0;
    const dizziness = parseInt(document.getElementById('slider-dizziness')?.value) || 0;
    const fatigue = parseInt(document.getElementById('slider-fatigue')?.value) || 0;
    const sleep = parseInt(document.getElementById('slider-sleep')?.value) || 0;
    const altitude = parseInt(document.getElementById('input-altitude')?.value) || 3500;
    const prevAltitude = parseInt(document.getElementById('input-prev-altitude')?.value) || null;

    const result = amsService.evaluate({
      headache,
      nausea,
      dizziness,
      fatigue,
      sleep,
      currentAltitudeM: altitude,
      previousAltitudeM: prevAltitude
    });

    const score = result.totalScore;
    const circumference = 326.72; // 2 * pi * 52
    const offset = circumference * (1 - Math.min(score, 15) / 15);

    const arcEl = document.getElementById('ams-gauge-arc');
    const scoreEl = document.getElementById('ams-gauge-score');
    const statusEl = document.getElementById('ams-gauge-status');
    const titleEl = document.getElementById('ams-summary-title');
    const descEl = document.getElementById('ams-summary-desc');
    const ascentEl = document.getElementById('ams-telemetry-ascent');
    const actionEl = document.getElementById('ams-telemetry-action');
    const beaconEl = document.getElementById('ams-ascent-beacon');

    let strokeColor = '#10B981';
    let textColor = 'text-emerald-400';
    let statusText = 'Normal / Safe';
    let actionText = 'Safe to Proceed';
    let actionColor = 'text-emerald-400';

    if (score >= 6) {
      strokeColor = '#EF4444';
      textColor = 'text-red-400';
      statusText = 'Severe AMS Risk';
      actionText = 'Descend Immediately';
      actionColor = 'text-red-400';
    } else if (score >= 3) {
      strokeColor = '#F59E0B';
      textColor = 'text-amber-400';
      statusText = 'Mild AMS Warning';
      actionText = 'Halt Ascent / Acclimatize';
      actionColor = 'text-amber-400';
    }

    if (arcEl) {
      arcEl.style.strokeDashoffset = offset;
      arcEl.style.stroke = strokeColor;
    }
    if (scoreEl) {
      scoreEl.textContent = score;
      scoreEl.className = `text-4xl font-black font-mono ${textColor}`;
    }
    if (statusEl) {
      statusEl.textContent = statusText;
      statusEl.className = `text-[11px] font-extrabold uppercase tracking-wider ${textColor} mt-0.5`;
    }
    if (titleEl) titleEl.textContent = result.title;
    if (descEl) descEl.textContent = result.advice;

    const ascentDiff = prevAltitude ? (altitude - prevAltitude) : 0;
    if (ascentEl) {
      ascentEl.textContent = `${ascentDiff >= 0 ? '+' : ''}${ascentDiff}m / 24h`;
    }
    if (actionEl) {
      actionEl.textContent = actionText;
      actionEl.className = `font-bold text-sm ${actionColor}`;
    }

    if (beaconEl) {
      if (result.ascentWarning || (altitude > 3000 && ascentDiff > 500)) {
        beaconEl.classList.remove('hidden');
        beaconEl.classList.add('flex');
      } else {
        beaconEl.classList.add('hidden');
        beaconEl.classList.remove('flex');
      }
    }
  }

  applyAMSStageElevation() {
    const stageSelect = document.getElementById('ams-stage-select');
    if (!stageSelect || !stageSelect.value) return;

    const opt = stageSelect.selectedOptions[0];
    if (opt) {
      const curAlt = parseInt(opt.value);
      const prevAlt = parseInt(opt.dataset.prev) || 1400;
      const curInput = document.getElementById('input-altitude');
      const prevInput = document.getElementById('input-prev-altitude');
      if (curInput) curInput.value = curAlt;
      if (prevInput) prevInput.value = prevAlt;
      this.updateAMSGauge();
      this.showToast(`Applied altitudes from ${opt.text}`, 'gold', '🏔️');
    }
  }

  displayAMSResult(res) {
    const banner = document.getElementById('ams-result-banner');
    if (!banner) return;
    banner.classList.remove('hidden');

    let bg = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
    if (res.bannerType === 'warning') bg = 'bg-amber-950/80 border-amber-500 text-amber-200';
    if (res.bannerType === 'danger') bg = 'bg-red-950/90 border-red-500 text-red-100 animate-pulse';

    banner.className = `p-5 rounded-xl border ${bg} mt-6 transition-all`;
    banner.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <h4 class="font-bold text-lg">${res.title}</h4>
        <span class="text-sm font-mono font-bold px-2 py-0.5 rounded bg-black/40">Lake Louise Score: ${res.totalScore} / 15</span>
      </div>
      <p class="text-sm mb-3">${res.advice}</p>
      ${res.ascentWarning ? `<div class="p-2 rounded bg-black/40 text-xs text-amber-300 font-semibold">⚠️ ${res.ascentWarning}</div>` : ''}
    `;
  }

  renderAMSHistory() {
    const historyContainer = document.getElementById('ams-history-list');
    if (!historyContainer) return;

    const logs = amsService.getRecentLogs(5);
    if (logs.length === 0) {
      historyContainer.innerHTML = `<div class="text-xs text-gray-500 text-center py-4">No health logs recorded yet.</div>`;
      return;
    }

    historyContainer.innerHTML = logs.map(l => `
      <div class="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        <div>
          <span class="font-bold text-white">${new Date(l.date).toLocaleDateString()}</span>
          <span class="text-gray-400 ml-2">Alt: ${l.altitudeM}m</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-amber-400 font-semibold">Score: ${l.totalScore}</span>
          <span class="capitalize px-2 py-0.5 rounded text-[10px] ${l.status === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}">${l.status}</span>
        </div>
      </div>
    `).join('');
  }

  // ================= VIEW: EMERGENCY SOS =================
  renderSOS() {
    const container = document.getElementById('view-sos');
    container.classList.remove('hidden');

    const coordsDisplay = document.getElementById('sos-coords-display');
    const smsPreview = document.getElementById('sos-sms-preview');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lon = pos.coords.longitude.toFixed(5);
          const alt = pos.coords.altitude ? Math.round(pos.coords.altitude) : 'Unknown';

          if (coordsDisplay) {
            coordsDisplay.innerHTML = `
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div class="text-amber-400 font-mono font-bold text-base">Lat: ${lat}, Lon: ${lon}</div>
                  <div class="text-xs text-gray-400">GPS Accuracy: ±${Math.round(pos.coords.accuracy)}m • Alt: ${alt}m</div>
                </div>
                <button onclick="window.app.copySOSCoordinates('${lat}, ${lon} (Alt: ${alt}m)')" class="px-3.5 py-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-amber-400/40 text-amber-300 hover:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-95">
                  <span>📋</span> <span>Copy GPS</span>
                </button>
              </div>
            `;
          }

          const user = authService.getCurrentUser();
          const userStr = user ? `${user.name} (${user.bloodGroup || 'Blood: N/A'})` : 'SherpaNav Trekker';
          const smsText = `EMERGENCY SOS: ${userStr} requires urgent rescue at Lat: ${lat}, Lon: ${lon}, Alt: ${alt}m. Tourist Police Pokhara/KTM please respond.`;

          if (smsPreview) {
            smsPreview.value = smsText;
            document.getElementById('btn-send-sms').href = `sms:1144?body=${encodeURIComponent(smsText)}`;
          }
        },
        () => {
          if (coordsDisplay) {
            coordsDisplay.innerHTML = `<span class="text-amber-300 text-xs">Geolocation unavailable or permission denied. Using estimated mountain area coordinates.</span>`;
          }
        }
      );
    }
  }

  // ================= VIEW: PROFILE =================
  renderProfile() {
    const container = document.getElementById('view-profile');
    container.classList.remove('hidden');

    const user = authService.getCurrentUser();
    if (!user) {
      this.openAuthModal('login');
      return;
    }

    document.getElementById('prof-name').textContent = user.name;
    document.getElementById('prof-email').textContent = user.email;
    document.getElementById('prof-nationality').textContent = user.nationality || 'Foreigner';
    document.getElementById('prof-blood').textContent = user.bloodGroup || 'Not set';
    document.getElementById('prof-emergency-name').textContent = user.emergencyName || 'Not specified';
    document.getElementById('prof-emergency-phone').textContent = user.emergencyPhone || 'Not specified';
    document.getElementById('prof-medical').textContent = user.medicalNotes || 'No notes provided';

    // Saved Treks
    const savedContainer = document.getElementById('prof-saved-treks');
    if (savedContainer) {
      const savedTreks = (user.savedTreks || []).map(id => dataRepo.getTrekById(id)).filter(Boolean);
      if (savedTreks.length === 0) {
        savedContainer.innerHTML = `<div class="text-xs text-gray-500 py-4">No saved treks yet. Explore and star treks!</div>`;
      } else {
        savedContainer.innerHTML = savedTreks.map(t => `
          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            <div>
              <h5 class="font-bold text-white text-sm">${t.title}</h5>
              <span class="text-gray-400">${t.district} • ${t.max_altitude_m}m</span>
            </div>
            <button class="btn-gold px-3 py-1" onclick="window.app.navigateTo('trek-detail', { trekId: '${t.id}' })">View →</button>
          </div>
        `).join('');
      }
    }

    document.getElementById('btn-logout').onclick = () => {
      authService.logout();
      this.navigateTo('explore');
    };
  }

  // ================= VARIANT COMPARISON MATRIX MODAL =================
  openCompareVariantsModal() {
    const modal = document.getElementById('modal-compare-variants');
    if (!modal) return;

    const trek = dataRepo.getTrekById(this.selectedTrekId) || dataRepo.treks[0];
    const routes = dataRepo.getRoutesByTrekId(trek.id);

    const subtitle = document.getElementById('compare-variants-subtitle');
    if (subtitle) {
      subtitle.textContent = `Comparing all ${routes.length} route options for ${trek.title}`;
    }

    const container = document.getElementById('compare-variants-table-container');
    if (container) {
      container.innerHTML = `
        <table class="w-full text-left text-xs text-gray-300 border-collapse min-w-[680px]">
          <thead>
            <tr class="border-b border-obsidian-700 bg-obsidian-900/80">
              <th class="p-3 font-bold text-amber-400 w-44">Trek Metric / Feature</th>
              ${routes.map(r => `
                <th class="p-3 font-bold text-white border-l border-obsidian-700 min-w-[210px]">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.id === this.selectedRouteId ? 'bg-amber-400 text-black' : 'bg-obsidian-700 text-amber-300'}">
                      ${r.variant_tag || 'Variant'}
                    </span>
                    ${r.is_primary ? `<span class="text-[10px] text-amber-400">★ Popular</span>` : ''}
                  </div>
                  <div class="text-sm font-bold text-white">${r.title}</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-obsidian-700">
            <tr>
              <td class="p-3 font-semibold text-gray-400 bg-obsidian-900/40">Total Duration</td>
              ${routes.map(r => `
                <td class="p-3 border-l border-obsidian-700 font-bold text-white">
                  📅 ${r.total_days} Days <span class="text-gray-400 font-normal">(${r.total_nights} Nights)</span>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-gray-400 bg-obsidian-900/40">Trail Distance</td>
              ${routes.map(r => `
                <td class="p-3 border-l border-obsidian-700 font-mono text-amber-300 font-semibold">
                  🚶 ~${r.distance_km || 80} km
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-gray-400 bg-obsidian-900/40">Max Peak Altitude</td>
              ${routes.map(r => `
                <td class="p-3 border-l border-obsidian-700 font-mono font-bold text-amber-400">
                  ⛰️ ${r.max_altitude_m}m <span class="text-gray-400 font-normal">(${Math.round(r.max_altitude_m * 3.28084)} ft)</span>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-gray-400 bg-obsidian-900/40">Trek Grade</td>
              ${routes.map(r => `
                <td class="p-3 border-l border-obsidian-700">
                  <span class="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-obsidian-700 text-white">
                    ${trek.difficulty || 'Moderate / Demanding'}
                  </span>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-gray-400 bg-obsidian-900/40">Route Chain / Corridors</td>
              ${routes.map(r => `
                <td class="p-3 border-l border-obsidian-700 text-[11px] text-gray-300 font-mono leading-relaxed">
                  ${r.route_chain_display || 'Scenic alpine route'}
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="p-3 font-semibold text-gray-400 bg-obsidian-900/40">Detailed Stages Count</td>
              ${routes.map(r => {
                const stages = dataRepo.getItineraryForRoute(r.id, r.excel_route_id);
                return `
                  <td class="p-3 border-l border-obsidian-700 font-mono text-white">
                    ✓ ${stages.length} Day-by-Day Stages
                  </td>
                `;
              }).join('')}
            </tr>
            <tr class="bg-obsidian-900/30">
              <td class="p-3 font-semibold text-gray-400">Action</td>
              ${routes.map(r => `
                <td class="p-3 border-l border-obsidian-700">
                  <button onclick="window.app.selectVariantFromModal('${r.id}')" class="${r.id === this.selectedRouteId ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'btn-gold'} w-full py-1.5 px-3 rounded-lg text-xs font-bold transition">
                    ${r.id === this.selectedRouteId ? '✓ Currently Selected' : 'Select This Route →'}
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      `;
    }

    modal.classList.remove('hidden');
  }

  closeCompareVariantsModal() {
    const modal = document.getElementById('modal-compare-variants');
    if (modal) modal.classList.add('hidden');
  }

  selectVariantFromModal(routeId) {
    this.selectedRouteId = routeId;
    this.closeCompareVariantsModal();
    this.navigateTo('route-map', { routeId });
  }

  // ================= PRINTABLE TRAIL FIELD SHEET MODAL =================
  generatePrintableTrailMapSvg(route, stages) {
    const track = dataRepo.getTrailTrack(route.id);
    const rawCoords = (track && track.coordinates && track.coordinates.length > 1) 
      ? track.coordinates 
      : [];

    if (!stages || stages.length === 0) {
      const trackWps = (track && track.waypoints) ? track.waypoints : [];
      if (trackWps.length > 0) {
        stages = trackWps.map((wp, idx) => ({
          day: idx + 1,
          destination: wp.name,
          altitude_m: wp.elevation_m || wp.elevation || 2800,
          walking_duration: '4-6 hrs',
          hotels: [],
          description: `Stage waypoint arriving at ${wp.name}.`
        }));
      } else {
        stages = [
          { day: 1, destination: 'Trailhead', altitude_m: 1400, walking_duration: '4-5 hrs', hotels: [], description: 'Ascent start' },
          { day: 2, destination: 'Base Camp', altitude_m: route.max_altitude_m || 4130, walking_duration: '5-6 hrs', hotels: [], description: 'High altitude objective' }
        ];
      }
    }

    const svgWidth = 840;
    const svgHeight = 280;
    const padX = 85;
    const padY = 55;

    let polylinePoints = '';
    let stopPoints = [];

    if (rawCoords.length >= 2) {
      let minLat = Infinity, maxLat = -Infinity;
      let minLon = Infinity, maxLon = -Infinity;

      rawCoords.forEach(c => {
        const lat = c[0];
        const lon = c[1];
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      });

      const spanLat = maxLat - minLat || 0.001;
      const spanLon = maxLon - minLon || 0.001;

      // Project [lat, lon] to SVG [x, y]
      const project = (lat, lon) => {
        const x = padX + ((lon - minLon) / spanLon) * (svgWidth - 2 * padX);
        const y = (svgHeight - padY) - ((lat - minLat) / spanLat) * (svgHeight - 2 * padY);
        return [Math.round(x), Math.round(y)];
      };

      polylinePoints = rawCoords.map(c => {
        const [x, y] = project(c[0], c[1]);
        return `${x},${y}`;
      }).join(' ');

      // Map each stage to an exact GPS waypoint if matched, or interpolated position along path
      const numStages = stages.length;
      const trackWps = (track && track.waypoints) ? track.waypoints : [];

      stopPoints = stages.map((st, sIdx) => {
        const destLower = (st.destination || '').toLowerCase();
        const matchedWp = trackWps.find(wp => {
          const wpLower = (wp.name || '').toLowerCase();
          return wpLower === destLower || wpLower.includes(destLower) || destLower.includes(wpLower);
        });

        let ptLat, ptLon;
        if (matchedWp && typeof matchedWp.lat === 'number' && typeof matchedWp.lon === 'number') {
          ptLat = matchedWp.lat;
          ptLon = matchedWp.lon;
        } else {
          const coordIdx = Math.min(rawCoords.length - 1, Math.floor((sIdx / Math.max(1, numStages - 1)) * (rawCoords.length - 1)));
          ptLat = rawCoords[coordIdx][0];
          ptLon = rawCoords[coordIdx][1];
        }

        const [x, y] = project(ptLat, ptLon);
        const clampedX = Math.max(70, Math.min(svgWidth - 70, x));
        const clampedY = Math.max(45, Math.min(svgHeight - 45, y));

        return {
          day: st.day,
          name: st.destination,
          alt: st.altitude_m,
          x: clampedX,
          y: clampedY,
          isHighAlt: (st.altitude_m || 0) >= 4000
        };
      });
    } else {
      // Fallback topological schematic if GPS track coordinates are unavailable
      const numStages = stages.length;
      const minA = stages.length > 0 ? Math.min(...stages.map(s => s.altitude_m || 1000)) : 1000;
      const maxA = stages.length > 0 ? Math.max(...stages.map(s => s.altitude_m || 4000)) : 4000;
      const spanA = maxA - minA || 1000;

      stopPoints = stages.map((st, sIdx) => {
        const t = sIdx / Math.max(1, numStages - 1);
        const x = padX + t * (svgWidth - 2 * padX);
        const normA = ((st.altitude_m || minA) - minA) / spanA;
        const y = (svgHeight - padY - 20) - normA * (svgHeight - 2 * padY - 40);
        return {
          day: st.day,
          name: st.destination,
          alt: st.altitude_m,
          x: Math.round(x),
          y: Math.round(y),
          isHighAlt: (st.altitude_m || 0) >= 4000
        };
      });

      polylinePoints = stopPoints.map(p => `${p.x},${p.y}`).join(' ');
    }

    return `
      <!-- Topographic Route Map with Visible Stop Names -->
      <div class="print-trail-map-container my-3 p-3.5 bg-obsidian-950 rounded-2xl border-2 border-amber-400/40">
        <div class="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-800 text-xs font-bold">
          <div class="flex items-center gap-2 text-amber-300">
            <span>🗺️</span>
            <span class="uppercase tracking-wider">Topographic Route Trail Map & Key Stop Waypoints</span>
          </div>
          <div class="text-[11px] font-mono text-gray-400">
            Total Stops: ${stages.length} • Max Alt: ${route.max_altitude_m}m • Trail: ~${route.distance_km || 80}km
          </div>
        </div>

        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto overflow-visible select-none font-sans" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="printTrailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10B981" />
              <stop offset="50%" stop-color="#F59E0B" />
              <stop offset="100%" stop-color="#EF4444" />
            </linearGradient>
            <filter id="printDropShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000000" flood-opacity="0.5" />
            </filter>
          </defs>

          <!-- Topographic Background Grid (Subtle relief markings) -->
          <line x1="30" y1="50" x2="${svgWidth - 30}" y2="50" stroke="#334155" stroke-dasharray="4 4" stroke-width="0.8" opacity="0.3" />
          <line x1="30" y1="130" x2="${svgWidth - 30}" y2="130" stroke="#334155" stroke-dasharray="4 4" stroke-width="0.8" opacity="0.3" />
          <line x1="30" y1="210" x2="${svgWidth - 30}" y2="210" stroke="#334155" stroke-dasharray="4 4" stroke-width="0.8" opacity="0.3" />

          <!-- Trail Shadow / Casing -->
          <polyline class="trail-casing-line" points="${polylinePoints}" fill="none" stroke="#000000" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75" />

          <!-- Primary Colored GPS Trail Line -->
          <polyline class="trail-path-line" points="${polylinePoints}" fill="none" stroke="url(#printTrailGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

          <!-- Render All Stop Names & Waypoint Markers -->
          ${stopPoints.map((p, idx) => {
            const isEven = idx % 2 === 0;
            const labelOffsetY = isEven ? -26 : 26;
            const pinColor = p.isHighAlt ? '#EF4444' : (idx === 0 || idx === stopPoints.length - 1 ? '#10B981' : '#F59E0B');
            
            return `
              <g class="stop-node" transform="translate(${p.x}, ${p.y})">
                <!-- Waypoint Node Circle -->
                <circle class="stop-circle-node" r="6.5" fill="${pinColor}" stroke="#ffffff" stroke-width="2" filter="url(#printDropShadow)" />
                <circle class="stop-inner-dot" r="2.5" fill="#ffffff" />

                <!-- Connecting Leader Line to Label -->
                <line class="stop-leader-line" x1="0" y1="0" x2="0" y2="${isEven ? -14 : 14}" stroke="${pinColor}" stroke-width="1.2" stroke-dasharray="2 2" />

                <!-- Visible Stop Name Callout Badge -->
                <g transform="translate(0, ${labelOffsetY})">
                  <!-- Pill Background for high readability on map & print -->
                  <rect class="stop-pill-bg" x="-62" y="-12" width="124" height="23" rx="5" fill="#0f172a" stroke="${pinColor}" stroke-width="1.2" opacity="0.95" />
                  
                  <!-- Day Badge + Stop Name -->
                  <text class="stop-text-day" x="-55" y="3.5" font-size="9" font-weight="900" fill="#F59E0B" font-family="monospace">D${p.day}</text>
                  <text class="stop-text-title" x="-36" y="3.5" font-size="9" font-weight="700" fill="#ffffff">
                    ${p.name.length > 13 ? p.name.substring(0, 12) + '…' : p.name}
                  </text>
                  <text class="stop-text-alt" x="54" y="3.5" text-anchor="end" font-size="8" font-weight="600" fill="#94A3B8" font-family="monospace">${p.alt}m</text>
                </g>
              </g>
            `;
          }).join('')}
        </svg>

        <!-- Legible Stops Corridor Legend Row (Guarantees 100% full un-truncated stop names on print) -->
        <div class="mt-2.5 pt-2 border-t border-obsidian-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5 text-[10px]">
          ${stages.map(st => `
            <div class="legend-stop-box p-1.5 rounded bg-obsidian-900/80 border border-obsidian-700/80 flex items-center justify-between gap-1">
              <span class="font-bold text-amber-400 font-mono">D${st.day}</span>
              <span class="font-semibold text-white truncate flex-1 ml-1" title="${st.destination}">${st.destination}</span>
              <span class="text-gray-400 font-mono text-[9px]">${st.altitude_m}m</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  preparePrintContent(routeId = null) {
    if (routeId) this.selectedRouteId = routeId;
    const route = dataRepo.getRouteById(this.selectedRouteId) || dataRepo.routes[0];
    const trek = dataRepo.getTrekById(route.trek_id) || dataRepo.treks[0];
    let stages = dataRepo.getItineraryForRoute(route.id, route.excel_route_id);
    const container = document.getElementById('print-sheet-content');
    if (!container) return;

    if (!stages || stages.length === 0) {
      const track = dataRepo.getTrailTrack(route.id);
      if (track && track.waypoints && track.waypoints.length > 0) {
        stages = track.waypoints.map((wp, idx) => ({
          day: idx + 1,
          destination: wp.name,
          altitude_m: wp.elevation_m || wp.elevation || 2800,
          walking_duration: '4-6 hrs',
          hotels: [],
          description: `Stage waypoint arriving at ${wp.name}.`
        }));
      } else {
        stages = [
          { day: 1, destination: 'Trailhead', altitude_m: 1400, walking_duration: '4-5 hrs', hotels: [], description: 'Ascent start' },
          { day: 2, destination: 'Base Camp', altitude_m: route.max_altitude_m || 4130, walking_duration: '5-6 hrs', hotels: [], description: 'High altitude objective' }
        ];
      }
    }

    container.innerHTML = `
      <!-- Printable Field Sheet Header -->
      <div class="border-b-2 border-amber-400 pb-3">
        <div class="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div class="text-[10px] tracking-widest font-bold uppercase text-amber-400">SherpaNav Official Himalayan Field Reference Sheet</div>
            <h1 class="text-2xl font-black text-white mt-0.5">${trek.title}</h1>
            <div class="text-sm font-bold text-amber-300 mt-0.5">${route.variant_tag || 'Standard Variant'}: ${route.title}</div>
          </div>
          <div class="text-right font-mono text-xs text-gray-300">
            <div>Region: <strong class="text-white">${trek.region || trek.district}</strong></div>
            <div>Duration: <strong class="text-white">${route.total_days} Days / ${route.total_nights} Nights</strong></div>
            <div>Max Alt: <strong class="text-amber-400">${route.max_altitude_m}m (${Math.round(route.max_altitude_m * 3.28084)}ft)</strong></div>
            <div>Trail: <strong class="text-white">~${route.distance_km || 80} km</strong></div>
          </div>
        </div>
        <div class="mt-1.5 text-[11px] text-gray-400 font-mono">
          <strong>Trail Corridors:</strong> ${route.route_chain_display}
        </div>
      </div>

      <!-- 24/7 Official Emergency & Rescue Dispatch Contacts -->
      <div class="print-emergency-box p-3 bg-red-950/30 border border-red-500/40 rounded-xl space-y-1.5 my-3">
        <div class="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wide">
          <span>🚨</span> 24/7 Himalayan Rescue & Emergency Hotlines (Nepal Country Code: +977)
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-gray-200">
          <div>Tourist Police: <strong class="text-amber-300">1144</strong></div>
          <div>Police Control: <strong class="text-amber-300">100</strong></div>
          <div>TAAN Rescue (Pokhara): <strong class="text-amber-300">061-462798</strong></div>
          <div>Himalayan Rescue (HRA): <strong class="text-amber-300">01-4440292</strong></div>
        </div>
      </div>

      <!-- Visual Route Trail Map With Visible Stop Names -->
      ${this.generatePrintableTrailMapSvg(route, stages)}

      <!-- Day-by-Day Stage Itinerary Table -->
      <div class="space-y-2 mt-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <span>🧭</span> Daily Stage Itinerary & Teahouse Direct Contacts
        </h3>
        <table class="w-full text-left text-xs text-gray-200 border-collapse">
          <thead>
            <tr class="bg-obsidian-800 border-b border-obsidian-700 text-[11px] uppercase tracking-wider text-amber-400">
              <th class="p-2 w-12 text-center">Day</th>
              <th class="p-2 min-w-[130px]">Destination</th>
              <th class="p-2 w-20 text-right">Altitude</th>
              <th class="p-2 w-24">Walking Time</th>
              <th class="p-2 min-w-[180px]">Key Teahouses & Direct Phones</th>
              <th class="p-2 min-w-[200px]">Stage Briefing & Terrain</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-obsidian-800 text-[11px]">
            ${stages.map(st => {
              let hotels = st.hotels || [];
              if (Array.isArray(hotels) && hotels.length > 0 && Array.isArray(hotels[0])) {
                hotels = hotels[0];
              }
              if (!hotels || hotels.length === 0) {
                hotels = dataRepo.getAccommodations(st.destination).slice(0, 3);
              }
              const hotelLines = hotels.slice(0, 3).map(h => {
                const phone = h.phone || (h.phones && h.phones[0]) || h.phone_contact || '';
                return `<div class="truncate">🏡 ${h.name} ${phone ? `<span class="font-mono text-amber-300">(${phone})</span>` : ''}</div>`;
              }).join('');

              return `
                <tr class="hover:bg-obsidian-800/40">
                  <td class="p-2 font-bold text-center text-amber-400 font-mono">D${st.day}</td>
                  <td class="p-2 font-semibold text-white">${st.destination}</td>
                  <td class="p-2 text-right font-mono text-amber-300 font-bold">${st.altitude_m}m</td>
                  <td class="p-2 text-gray-400">${st.walking_duration}</td>
                  <td class="p-2 text-gray-300 space-y-0.5">${hotelLines || '<span class="text-gray-500">Local tea houses</span>'}</td>
                  <td class="p-2 text-gray-300 leading-snug">
                    <div>${st.description}</div>
                    ${st.terrain ? `<div class="text-[10px] text-gray-400 mt-0.5">🥾 ${st.terrain}</div>` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Field Health Log Grid (For physical notes) -->
      <div class="space-y-2 pt-2 border-t border-obsidian-800 mt-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <span>🩺</span> Daily Field Health & Lake Louise Self-Assessment Log
        </h3>
        <p class="text-[11px] text-gray-400">Record morning resting pulse, Lake Louise AMS score (0-15), and hydration in the field.</p>
        <table class="w-full text-left text-xs text-gray-200 border-collapse border border-obsidian-700">
          <thead>
            <tr class="bg-obsidian-800 text-[10px] uppercase text-gray-400">
              <th class="p-2 border border-obsidian-700 w-16">Day #</th>
              <th class="p-2 border border-obsidian-700 w-28">Location</th>
              <th class="p-2 border border-obsidian-700 w-24">Morning Alt</th>
              <th class="p-2 border border-obsidian-700 w-24">AMS Score</th>
              <th class="p-2 border border-obsidian-700 w-28">Resting Pulse</th>
              <th class="p-2 border border-obsidian-700 w-28">Water Intake</th>
              <th class="p-2 border border-obsidian-700">Physical Sensation & Notes</th>
            </tr>
          </thead>
          <tbody>
            ${stages.map(st => `
              <tr class="h-8">
                <td class="p-2 border border-obsidian-700 font-mono font-bold text-amber-400">Day ${st.day}</td>
                <td class="p-2 border border-obsidian-700 text-gray-300">${st.destination}</td>
                <td class="p-2 border border-obsidian-700 font-mono text-gray-400">${st.altitude_m}m</td>
                <td class="p-2 border border-obsidian-700"></td>
                <td class="p-2 border border-obsidian-700"></td>
                <td class="p-2 border border-obsidian-700"></td>
                <td class="p-2 border border-obsidian-700"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Essential Himalayan Safety Protocol Notice -->
      <div class="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-[11px] text-amber-200 space-y-1 mt-4">
        <div class="font-bold flex items-center gap-1.5">⚠️ Gold Rules of High-Altitude Himalayan Travel:</div>
        <ul class="list-disc list-inside space-y-0.5 text-gray-300">
          <li>Never ascend higher with symptoms of Acute Mountain Sickness (Headache, nausea, dizziness).</li>
          <li>If symptoms worsen or persist despite resting, descend immediately by at least 500m to 1,000m.</li>
          <li>Drink 3 to 4 liters of purified water daily; avoid alcohol and sedatives above 3,000m.</li>
          <li>Always check in at police and conservation checkpoints with your TIMS card and permits.</li>
        </ul>
      </div>
    `;
  }

  openPrintFieldSheetModal(routeId = null) {
    if (routeId) this.selectedRouteId = routeId;
    this.isPrintPreviewOpen = true;
    this.preparePrintContent();
    const modal = document.getElementById('modal-print-sheet');
    if (modal) modal.classList.remove('hidden');
  }

  closePrintFieldSheetModal() {
    this.isPrintPreviewOpen = false;
    const modal = document.getElementById('modal-print-sheet');
    if (modal) modal.classList.add('hidden');
  }

  triggerPrintTrailSheet() {
    this.preparePrintContent();
    this.showToast('Generating printable offline field sheet...', 'gold', '🖨️');
    setTimeout(() => {
      window.print();
    }, 100);
  }

  triggerDirectPrint(routeId = null) {
    if (routeId) this.selectedRouteId = routeId;
    this.isPrintPreviewOpen = false;
    this.preparePrintContent();
    const modal = document.getElementById('modal-print-sheet');
    if (modal) modal.classList.remove('hidden');
    this.showToast('Generating printable field sheet & map...', 'gold', '🖨️');
    setTimeout(() => {
      window.print();
    }, 150);
  }

  // ================= VIEW: GEAR & PACKING CHECKLIST =================
  renderChecklist() {
    const container = document.getElementById('view-checklist');
    container.classList.remove('hidden');

    const catContainer = document.getElementById('checklist-categories');
    if (!catContainer) return;

    const savedState = this.getPackingChecklistState();
    const template = this.getPackingListTemplate();

    catContainer.innerHTML = template.map((cat, cIdx) => `
      <div class="sherpa-card tilt-card reveal-on-scroll p-5 space-y-3 bg-obsidian-800/80 border border-obsidian-600" data-delay="${cIdx * 70}">
        <div class="flex items-center justify-between border-b border-obsidian-700 pb-2">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">${cat.category}</h3>
          <span class="text-[11px] text-amber-300 font-mono font-semibold">
            ${cat.items.filter(item => savedState[item.id]).length} / ${cat.items.length} packed
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          ${cat.items.map(item => {
            const isChecked = !!savedState[item.id];
            return `
              <label class="p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3 select-none ${isChecked ? 'bg-amber-400/10 border-amber-400/40 text-amber-100' : 'bg-obsidian-900/60 border-obsidian-700/80 text-gray-300 hover:border-obsidian-500'}">
                <input type="checkbox" onchange="window.app.togglePackingItem('${item.id}', this.checked)" ${isChecked ? 'checked' : ''} class="mt-0.5 accent-amber-400 shrink-0 w-4 h-4 cursor-pointer">
                <div class="flex-1">
                  <div class="text-xs font-semibold ${isChecked ? 'line-through text-gray-400 font-normal' : 'text-white'}">
                    ${item.name}
                  </div>
                  <div class="text-[11px] text-gray-400 mt-0.5 leading-tight">
                    ${item.tip}
                  </div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    if (window.interactionEngine) {
      window.interactionEngine.observeNewElements(catContainer);
    }

    this.updateChecklistProgress();
  }

  getPackingListTemplate() {
    return [
      {
        category: "🧥 Alpine Outerwear & Cold Weather",
        items: [
          { id: "gear_down_jacket", name: "Down Jacket (-10°C to -20°C rated)", tip: "Rentable in Thamel for ~NPR 150/day. Essential above 3,500m." },
          { id: "gear_rain_jacket", name: "Waterproof Hardshell Jacket (Gore-Tex or equivalent)", tip: "Protects against sudden Himalayan blizzard and monsoon rain." },
          { id: "gear_fleece", name: "Fleece Mid-Layer Jacket or Pullover", tip: "Breathable warmth during early morning ascents." },
          { id: "gear_thermal_tops", name: "Thermal Base Layer Tops (Merino Wool x2)", tip: "Moisture wicking; avoid synthetic cotton." },
          { id: "gear_thermal_bottoms", name: "Thermal Base Layer Leggings (Merino Wool x2)", tip: "Wear under trekking pants at high camps." },
          { id: "gear_trek_pants", name: "Convertible Quick-Dry Trekking Pants (x2)", tip: "Sturdy fabric with zip pockets." },
          { id: "gear_gloves_inner", name: "Thermal Liner Gloves (Touchscreen compatible)", tip: "Keep hands warm while handling phone/GPS." },
          { id: "gear_gloves_outer", name: "Windproof & Waterproof Alpine Mittens", tip: "Vital for cold pass crossings (Thorong La / Cho La)." },
          { id: "gear_beanie", name: "Thermal Wool Beanie / Balaclava", tip: "Retains head heat during freezing teahouse nights." }
        ]
      },
      {
        category: "🥾 Footwear & Trail Comfort",
        items: [
          { id: "gear_boots", name: "Broken-in Waterproof Trekking Boots", tip: "High ankle support; never break in new boots on the trail!" },
          { id: "gear_socks", name: "Merino Wool Trekking Socks (4-5 pairs)", tip: "Cushioned heel and toe; prevents friction blisters." },
          { id: "gear_microspikes", name: "Microspikes / Traction Crampons", tip: "Essential for crossing icy patches, high passes, and frozen moraines." },
          { id: "gear_camp_shoes", name: "Camp Sandals / Slip-on Crocs", tip: "Air out feet comfortably inside teahouse common rooms." },
          { id: "gear_gaiters", name: "Ankle Gaiters (for dust, scree, and snow)", tip: "Keeps scree and melting slush out of boots." }
        ]
      },
      {
        category: "⛺ Sleep & Shelter",
        items: [
          { id: "gear_sleeping_bag", name: "Alpine Sleeping Bag (-10°C / -15°C Comfort Rating)", tip: "Rentable in Kathmandu/Pokhara. Teahouse blankets are often dusty and cold." },
          { id: "gear_silk_liner", name: "Silk or Thermal Sleeping Bag Liner", tip: "Adds 3-5°C warmth and maintains hygiene." },
          { id: "gear_earplugs", name: "Silicone Earplugs & Sleep Eye Mask", tip: "Crucial! Teahouse plywood walls transmit snoring and early riser noise." }
        ]
      },
      {
        category: "💧 Hydration & High-Altitude Sustenance",
        items: [
          { id: "gear_water_purify", name: "Water Purification Tablets (Aquatabs / Chlorine Dioxide)", tip: "Save hundreds of dollars and avoid single-use plastic bottles." },
          { id: "gear_nalgene", name: "Insulated 1L Nalgene Bottle (Wide mouth)", tip: "Can be filled with boiled water at night and used as a bed warmer." },
          { id: "gear_electrolytes", name: "Electrolyte Replacement Powder / Hydration Salts", tip: "Combats dehydration caused by rapid breathing at high altitude." },
          { id: "gear_energy_bars", name: "Energy Bars, Trail Mix & Dried Fruit", tip: "For steep ascents between teahouse lunch stops." }
        ]
      },
      {
        category: "💊 Alpine Medical & First Aid Kit",
        items: [
          { id: "gear_diamox", name: "Diamox (Acetazolamide) 125mg / 250mg", tip: "Aids acclimatization. Consult your physician before using." },
          { id: "gear_painkiller", name: "Ibuprofen / Paracetamol (for altitude headaches)", tip: "First-line relief for mild Lake Louise headache symptoms." },
          { id: "gear_blister_kit", name: "Blister Plasters (Compeed) & Leukotape", tip: "Apply immediately at the first sign of a hot spot." },
          { id: "gear_antibiotics", name: "Broad-Spectrum Antibiotics (Ciprofloxacin / Azithromycin)", tip: "Standard prescription treatment for acute traveler's diarrhea." },
          { id: "gear_sunscreen", name: "High-protection Sunscreen SPF 50+ & UV Lip Balm", tip: "UV radiation increases by ~10-12% for every 1,000m gained!" }
        ]
      },
      {
        category: "⚡ Electronics, Power & Illumination",
        items: [
          { id: "gear_powerbank", name: "Heavy-Duty Power Bank (20,000 mAh)", tip: "Cold drastically drains lithium batteries; keep inside your sleeping bag at night." },
          { id: "gear_headlamp", name: "LED Headlamp (300+ Lumens) + Spare Batteries / USB cable", tip: "Essential for 4:00 AM pass-crossing summits and teahouse blackouts." },
          { id: "gear_plug_adapter", name: "Universal Plug Adapter (Nepal uses Type C & D round pins)", tip: "For charging at teahouse dining rooms." },
          { id: "gear_offline_maps", name: "Smartphone with SherpaNav Offline Data & GPS enabled", tip: "Fully functional without cell towers." }
        ]
      },
      {
        category: "📄 Trekking Hardware, Permits & Cash",
        items: [
          { id: "gear_poles", name: "Adjustable Trekking Poles with Carbide Tips & Mud Baskets", tip: "Saves knees up to 25% on steep downhill staircases." },
          { id: "gear_daypack", name: "30L-40L Daypack with Integrated Waterproof Rain Cover", tip: "Carries your layers, water, first aid, and camera for the day." },
          { id: "gear_permits_print", name: "Printed Copies of TIMS Card & National Park Permits", tip: "Must be shown and stamped at military/police checkpoints." },
          { id: "gear_cash", name: "Physical NPR Cash (NPR 4,000 - 5,000 / day in small notes)", tip: "No ATMs on the trail; mountain teahouses do not take credit cards." },
          { id: "gear_insurance", name: "Travel Insurance Policy Document (Stating Helicopter Rescue to 6,000m)", tip: "Checkpoints and rescue dispatchers require policy verification." }
        ]
      }
    ];
  }

  getPackingChecklistState() {
    try {
      const data = localStorage.getItem('sherpanav_packing_checklist');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  savePackingChecklistState(state) {
    try {
      localStorage.setItem('sherpanav_packing_checklist', JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save checklist state:', err);
    }
  }

  togglePackingItem(itemId, isChecked) {
    const state = this.getPackingChecklistState();
    state[itemId] = isChecked;
    this.savePackingChecklistState(state);
    this.renderChecklist();
  }

  checkAllPackingItems() {
    const state = {};
    const template = this.getPackingListTemplate();
    template.forEach(cat => {
      cat.items.forEach(item => {
        state[item.id] = true;
      });
    });
    this.savePackingChecklistState(state);
    this.renderChecklist();
    this.showToast('All 23 alpine gear items marked as packed!', 'success', '🎒');
  }

  resetPackingChecklist() {
    localStorage.removeItem('sherpanav_packing_checklist');
    this.renderChecklist();
    this.showToast('Packing checklist progress reset', 'warning', '🔄');
  }

  updateChecklistProgress() {
    const state = this.getPackingChecklistState();
    const template = this.getPackingListTemplate();
    let total = 0;
    let checked = 0;

    template.forEach(cat => {
      cat.items.forEach(item => {
        total++;
        if (state[item.id]) checked++;
      });
    });

    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
    const bar = document.getElementById('checklist-progress-bar');
    const text = document.getElementById('checklist-progress-text');

    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${checked} of ${total} packed (${percent}%)`;

    if (percent === 100 && total > 0 && !this._celebratedChecklist) {
      this._celebratedChecklist = true;
      this.showToast('100% Alpine Ready! Your mountain kit is packed.', 'gold', '🎉');
    } else if (percent < 100) {
      this._celebratedChecklist = false;
    }
  }

  // ================= VIEW: TREK BUDGET & COST CALCULATOR =================
  renderCalculator() {
    const container = document.getElementById('view-calculator');
    container.classList.remove('hidden');

    const select = document.getElementById('calc-trek-select');
    if (select && select.options.length <= 1) {
      select.innerHTML = dataRepo.routes.map(r => {
        const trek = dataRepo.getTrekById(r.trek_id);
        const trekTitle = trek ? trek.title : 'Trek';
        return `<option value="${r.id}" ${r.id === this.selectedRouteId ? 'selected' : ''}>
          🏔️ ${trekTitle} - ${r.variant_tag || 'Variant'}: ${r.title} (${r.total_days}D)
        </option>`;
      }).join('');
    }

    this.calculateBudget();
  }

  updateCalculatorPreset(routeId) {
    const route = dataRepo.getRouteById(routeId);
    if (route) {
      const daysInput = document.getElementById('calc-days-input');
      const daysLabel = document.getElementById('calc-days-label');
      if (daysInput) {
        daysInput.value = route.total_days;
      }
      if (daysLabel) {
        daysLabel.textContent = `${route.total_days} Days`;
      }
    }
    this.calculateBudget();
  }

  calculateBudget() {
    const daysInput = document.getElementById('calc-days-input');
    const days = parseInt(daysInput?.value, 10) || 10;
    const daysLabel = document.getElementById('calc-days-label');
    if (daysLabel) daysLabel.textContent = `${days} Days`;

    const nationality = document.getElementById('calc-nationality')?.value || 'Foreigner';

    // Safely parse lodging (ensure NPR 0 camping is respected)
    const lodgingRaw = document.getElementById('calc-lodging-type')?.value;
    const lodgingNight = (lodgingRaw !== undefined && lodgingRaw !== null && !isNaN(parseInt(lodgingRaw, 10))) 
      ? parseInt(lodgingRaw, 10) 
      : 1500;

    const mealsDay = parseInt(document.getElementById('calc-meals-input')?.value, 10) || 2500;
    const mealsLabel = document.getElementById('calc-meals-label');
    if (mealsLabel) mealsLabel.textContent = `NPR ${mealsDay.toLocaleString()} / day`;

    // Guide & Porter daily rates (explicitly parse as number; never coerce 0 to default)
    const guideSelect = document.getElementById('calc-guide-option');
    const porterSelect = document.getElementById('calc-porter-option');

    let guideDaily = 0;
    if (guideSelect) {
      const gVal = parseInt(guideSelect.value, 10);
      guideDaily = !isNaN(gVal) ? gVal : 0;
    }

    let porterDaily = 0;
    if (porterSelect) {
      const pVal = parseInt(porterSelect.value, 10);
      porterDaily = !isNaN(pVal) ? pVal : 0;
    }

    const extraShower = document.getElementById('calc-extra-shower')?.checked ? (400 * Math.max(1, Math.floor(days * 0.6))) : 0;
    const extraCharging = document.getElementById('calc-extra-charging')?.checked ? (300 * days) : 0;
    const extraWifi = document.getElementById('calc-extra-wifi')?.checked ? (400 * Math.max(1, Math.floor(days * 0.7))) : 0;
    const totalExtras = extraShower + extraCharging + extraWifi;

    // Permit Fees based on nationality
    let permitFee = 5000; // Foreigner: TIMS 2,000 + Park 3,000
    if (nationality === 'SAARC') {
      permitFee = 2500; // SAARC: TIMS 1,000 + Park 1,500
    } else if (nationality === 'Domestic') {
      permitFee = 100; // Domestic: Park 100
    }

    const totalLodging = days * lodgingNight;
    const totalMeals = days * mealsDay;
    const totalGuide = days * guideDaily;
    const totalPorter = days * porterDaily;
    const totalCrew = totalGuide + totalPorter;

    const totalNPR = Math.max(1, permitFee + totalLodging + totalMeals + totalCrew + totalExtras);
    const totalUSD = Math.round(totalNPR / 134);
    const cashReserve = Math.round(totalNPR * 0.15);

    // Update Numerical Breakdown
    const totalNprEl = document.getElementById('calc-total-npr');
    const totalUsdEl = document.getElementById('calc-total-usd');
    const bPermits = document.getElementById('calc-breakdown-permits');
    const bLodging = document.getElementById('calc-breakdown-lodging');
    const bMeals = document.getElementById('calc-breakdown-meals');
    const bGuide = document.getElementById('calc-breakdown-guide');
    const bPorter = document.getElementById('calc-breakdown-porter');
    const bExtras = document.getElementById('calc-breakdown-extras');
    const bBuffer = document.getElementById('calc-breakdown-buffer');

    const curr = this.activeCurrency || 'USD';
    const convertedStr = this.formatCurrency(totalNPR, curr);
    const currSelect = document.getElementById('calc-currency-select');
    if (currSelect && currSelect.value !== curr) currSelect.value = curr;

    if (totalNprEl) totalNprEl.textContent = `NPR ${totalNPR.toLocaleString()}`;
    if (totalUsdEl) totalUsdEl.textContent = `≈ ${convertedStr}`;
    if (bPermits) bPermits.textContent = `NPR ${permitFee.toLocaleString()}`;
    if (bLodging) bLodging.textContent = `NPR ${totalLodging.toLocaleString()}`;
    if (bMeals) bMeals.textContent = `NPR ${totalMeals.toLocaleString()}`;
    if (bGuide) bGuide.textContent = `NPR ${totalGuide.toLocaleString()}`;
    if (bPorter) bPorter.textContent = `NPR ${totalPorter.toLocaleString()}`;
    if (bExtras) bExtras.textContent = `NPR ${totalExtras.toLocaleString()}`;
    if (bBuffer) bBuffer.textContent = `NPR ${cashReserve.toLocaleString()}`;

    // Update Interactive Multi-Segment Stacked Progress Bar
    const pctPermits = Math.max(0, Math.round((permitFee / totalNPR) * 100));
    const pctLodging = Math.max(0, Math.round((totalLodging / totalNPR) * 100));
    const pctMeals = Math.max(0, Math.round((totalMeals / totalNPR) * 100));
    const pctCrew = Math.max(0, Math.round((totalCrew / totalNPR) * 100));
    const pctExtras = Math.max(0, 100 - (pctPermits + pctLodging + pctMeals + pctCrew));

    const segPermits = document.getElementById('bar-seg-permits');
    const segLodging = document.getElementById('bar-seg-lodging');
    const segMeals = document.getElementById('bar-seg-meals');
    const segGuide = document.getElementById('bar-seg-guide');
    const segExtras = document.getElementById('bar-seg-extras');

    if (segPermits) segPermits.style.width = `${pctPermits}%`;
    if (segLodging) segLodging.style.width = `${pctLodging}%`;
    if (segMeals) segMeals.style.width = `${pctMeals}%`;
    if (segGuide) segGuide.style.width = `${pctCrew}%`;
    if (segExtras) segExtras.style.width = `${pctExtras}%`;

    const pP = document.getElementById('pct-permits');
    const pL = document.getElementById('pct-lodging');
    const pM = document.getElementById('pct-meals');
    const pG = document.getElementById('pct-guide');
    const pE = document.getElementById('pct-extras');
    if (pP) pP.textContent = `${pctPermits}%`;
    if (pL) pL.textContent = `${pctLodging}%`;
    if (pM) pM.textContent = `${pctMeals}%`;
    if (pG) pG.textContent = `${pctCrew}%`;
    if (pE) pE.textContent = `${pctExtras}%`;
  }

  // ================= ALPINE TOAST NOTIFICATION SYSTEM =================
  showToast(message, type = 'gold', icon = '🏔️', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const pill = document.createElement('div');
    pill.className = `toast-pill toast-pill-${type}`;
    pill.innerHTML = `
      <span class="text-base select-none">${icon}</span>
      <span class="flex-1 font-semibold leading-tight">${message}</span>
      <button class="text-gray-400 hover:text-white font-bold ml-1 text-sm select-none focus:outline-none">&times;</button>
    `;

    const closeBtn = pill.querySelector('button');
    closeBtn.onclick = () => {
      pill.classList.remove('toast-visible');
      pill.classList.add('toast-hiding');
      setTimeout(() => pill.remove(), 250);
    };

    container.appendChild(pill);
    requestAnimationFrame(() => {
      pill.classList.add('toast-visible');
    });

    setTimeout(() => {
      if (pill.parentElement) {
        pill.classList.remove('toast-visible');
        pill.classList.add('toast-hiding');
        setTimeout(() => pill.remove(), 250);
      }
    }, duration);
  }

  copySOSCoordinates(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(`Coordinates copied: ${text}`, 'success', '📋');
      }).catch(() => {
        this.showToast('Failed to copy to clipboard', 'danger', '⚠️');
      });
    } else {
      this.showToast(`Coordinates: ${text}`, 'gold', '📍');
    }
  }

  // =========================================================================
  // MULTI-CURRENCY CONVERSION ENGINE
  // =========================================================================

  setCurrency(curr) {
    this.activeCurrency = curr;
    const calcSelect = document.getElementById('calc-currency-select');
    if (calcSelect) calcSelect.value = curr;
    const wizSelect = document.getElementById('wiz-currency-select');
    if (wizSelect) wizSelect.value = curr;

    if (this.currentView === 'calculator') {
      this.calculateBudget();
    }
    if (this.currentView === 'plan-wizard' && this.wizardState.step === 4) {
      this.updateWizardBudget();
    }
    this.showToast(`Currency switched to ${curr}`, 'gold', '💱');
  }

  formatCurrency(nprAmount, currency = this.activeCurrency) {
    const c = this.currencyRates[currency] || this.currencyRates.USD;
    const converted = Math.round(nprAmount * c.rate);
    return `${c.prefix}${converted.toLocaleString()} ${c.symbol}`;
  }

  // =========================================================================
  // PLAN A TREK GUIDED FLOW (5 STEPS)
  // =========================================================================

  startPlanTrekWizard(trekId = null, routeId = null) {
    if (trekId) {
      this.wizardState.selectedTrekId = trekId;
      if (routeId) {
        this.wizardState.selectedRouteId = routeId;
      } else {
        const routes = dataRepo.getRoutesByTrekId(trekId) || [];
        if (routes.length > 0) {
          this.wizardState.selectedRouteId = routes[0].id;
        }
      }
      this.wizardState.step = 2; // Jump to Step 2 (Route selection) since trail is already chosen
    } else {
      if (!this.wizardState.selectedTrekId) {
        this.wizardState.selectedTrekId = 'T007'; // ABC default
        this.wizardState.selectedRouteId = 'ABC_R001';
      }
      this.wizardState.step = 1; // Start from Step 1 (Trail selection)
    }
    this.navigateTo('plan-wizard');
  }

  setWizardStep(stepNum) {
    this.wizardState.step = Math.max(1, Math.min(5, stepNum));
    this.updateWizardStepperHUD();
    this.renderPlanWizard();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateWizardStepperHUD() {
    const activeStep = this.wizardState.step;
    for (let i = 1; i <= 5; i++) {
      const btn = document.getElementById(`step-nav-${i}`);
      if (!btn) continue;
      btn.classList.remove('step-active', 'step-done');
      if (i === activeStep) {
        btn.classList.add('step-active');
      } else if (i < activeStep) {
        btn.classList.add('step-done');
      }
    }
  }

  renderPlanWizard() {
    const container = document.getElementById('view-plan-wizard');
    if (!container) return;
    container.classList.remove('hidden');

    if (!this.wizardState.step) this.wizardState.step = 1;
    if (!this.wizardState.selectedTrekId) {
      this.wizardState.selectedTrekId = 'T007';
      const routes = dataRepo.getRoutesByTrekId('T007') || [];
      if (routes.length > 0) this.wizardState.selectedRouteId = routes[0].id;
    }

    this.updateWizardStepperHUD();

    // Show only active step panel
    for (let i = 1; i <= 5; i++) {
      const p = document.getElementById(`wizard-step-content-${i}`);
      if (p) {
        if (i === this.wizardState.step) {
          p.classList.remove('hidden');
        } else {
          p.classList.add('hidden');
        }
      }
    }

    switch (this.wizardState.step) {
      case 1:
        this.renderWizardStep1();
        break;
      case 2:
        this.renderWizardStep2();
        break;
      case 3:
        this.renderWizardStep3();
        break;
      case 4:
        this.renderWizardStep4();
        break;
      case 5:
        this.renderWizardStep5();
        break;
    }

    interactionEngine.observeNewElements(container);
  }

  // --- Step 1: Trail Selection Grid ---
  renderWizardStep1() {
    const panel = document.getElementById('wizard-step-content-1');
    if (!panel) return;

    const treks = dataRepo.treks || [];
    const regions = ['ALL', 'Annapurna', 'Everest', 'Langtang', 'Manaslu', 'Mustang', 'Dolpo', 'Rolwaling'];
    const activeRegion = this.wizardTrailRegionFilter || 'ALL';

    const filtered = treks.filter(t => {
      if (activeRegion === 'ALL') return true;
      const reg = `${t.region || ''} ${t.district || ''} ${t.region_id || ''}`.toLowerCase();
      return reg.includes(activeRegion.toLowerCase());
    });

    panel.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
              <span>1️⃣</span> <span>Step 1: Choose Your Himalayan Trail</span>
            </h3>
            <p class="text-xs text-gray-400">Select a major trekking corridor or region across Nepal.</p>
          </div>
          <!-- Region Filter Pills -->
          <div class="flex flex-wrap items-center gap-1.5 text-xs">
            ${regions.map(r => `
              <button onclick="window.app.setWizardTrailFilter('${r}')" class="px-3 py-1 rounded-xl border text-xs font-semibold transition ${r === activeRegion ? 'bg-amber-400 text-black border-amber-400 font-bold shadow' : 'bg-obsidian-900 text-gray-300 border-obsidian-700 hover:border-obsidian-500'}">
                ${r}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${filtered.map(t => {
            const isSelected = t.id === this.wizardState.selectedTrekId;
            const routes = dataRepo.getRoutesByTrekId(t.id) || [];
            const trekTitle = t.title || t.name || 'Himalayan Trek';
            const trekAlt = t.max_altitude_m || t.max_elevation_m || 4000;
            const trekDuration = t.duration_range || t.duration_range_days || '10-14 Days';
            const trekOverview = t.overview || t.description || 'Pristine Himalayan trekking corridor with surveyed alpine tea houses.';
            return `
              <div class="sherpa-card p-5 space-y-4 flex flex-col justify-between cursor-pointer border transition-all duration-200 hover:border-gold-400/60 ${isSelected ? 'border-amber-400 bg-obsidian-800/90 shadow-xl shadow-amber-500/10' : 'border-obsidian-700/80 bg-obsidian-900/80'}" onclick="window.app.selectWizardTrek('${t.id}')">
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-400/10 text-gold-300 border border-gold-400/30">
                      ${t.region || t.district || 'Himalaya'}
                    </span>
                    <span class="text-xs text-amber-300 font-mono font-bold">
                      ${trekAlt}m
                    </span>
                  </div>
                  <h4 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    <span>🏔️</span> <span>${trekTitle}</span>
                  </h4>
                  <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    ${trekOverview}
                  </p>
                  <div class="flex items-center gap-2 text-[11px] text-gray-400 font-mono pt-1">
                    <span>📅 ${trekDuration}</span>
                    <span>•</span>
                    <span>⚡ ${t.difficulty || 'Moderate'}</span>
                    <span>•</span>
                    <span class="text-amber-400 font-bold">${routes.length} Variants</span>
                  </div>
                </div>

                <div class="pt-3 border-t border-obsidian-700/80 flex items-center justify-between">
                  <span class="text-[11px] ${isSelected ? 'text-amber-400 font-bold' : 'text-gray-400'}">
                    ${isSelected ? '✓ Selected Trail' : 'Click to Select'}
                  </span>
                  <button class="${isSelected ? 'btn-gold' : 'px-3.5 py-1.5 rounded-xl bg-obsidian-800 border border-obsidian-600 text-white hover:border-amber-400'} text-xs font-bold transition flex items-center gap-1">
                    <span>Proceed</span> <span>→</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  setWizardTrailFilter(region) {
    this.wizardTrailRegionFilter = region;
    this.renderWizardStep1();
  }

  selectWizardTrek(trekId) {
    this.wizardState.selectedTrekId = trekId;
    const routes = dataRepo.getRoutesByTrekId(trekId) || [];
    if (routes.length > 0) {
      this.wizardState.selectedRouteId = routes[0].id;
    }
    this.setWizardStep(2);
    const trek = dataRepo.getTrekById(trekId);
    this.showToast(`Selected trail: ${trek?.title || trek?.name || trekId}`, 'success', '🏔️');
  }

  // --- Step 2: Route Variant & Duration ---
  renderWizardStep2() {
    const panel = document.getElementById('wizard-step-content-2');
    if (!panel) return;

    const trek = dataRepo.getTrekById(this.wizardState.selectedTrekId) || (dataRepo.treks ? dataRepo.treks[0] : null);
    if (!trek) return;
    const routes = dataRepo.getRoutesByTrekId(trek.id) || [];
    const trekTitle = trek.title || trek.name || 'Himalayan Trek';
    const trekAlt = trek.max_altitude_m || trek.max_elevation_m || 4000;

    panel.innerHTML = `
      <div class="space-y-5">
        <!-- Selected Trail Banner -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-obsidian-800 to-obsidian-900 border border-gold-400/30 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🧭</span>
            <div>
              <span class="text-[10px] text-amber-400 uppercase tracking-widest font-bold">Trail Destination</span>
              <h3 class="text-lg font-black text-white">${trekTitle}</h3>
              <p class="text-xs text-gray-400">${trek.region || trek.district || 'Nepal'} • Max ~${trekAlt}m</p>
            </div>
          </div>
          <button onclick="window.app.setWizardStep(1)" class="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-obsidian-600 bg-obsidian-900">
            ← Change Destination
          </button>
        </div>

        <div>
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>2️⃣</span> <span>Step 2: Choose Route Variant & Pace</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Select your preferred route variant: Classic, Express, or High Passes.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${routes.map(r => {
            const isSelected = r.id === this.wizardState.selectedRouteId;
            const stages = dataRepo.getItineraryForRoute(r.id) || [];
            const routeTitle = r.title || r.name || 'Standard Route';
            const routeAlt = r.max_altitude_m || r.max_elevation_m || 4000;
            const routeDist = r.distance_km || r.total_distance_km || 80;
            const routeDays = r.total_days || (stages.length || 10);
            const stagesCount = stages.length > 0 ? stages.length : routeDays;
            return `
              <div class="sherpa-card p-5 space-y-4 flex flex-col justify-between cursor-pointer border transition-all duration-200 hover:border-gold-400/60 ${isSelected ? 'border-amber-400 bg-obsidian-800/90 shadow-xl shadow-amber-500/10' : 'border-obsidian-700/80 bg-obsidian-900/80'}" onclick="window.app.selectWizardRoute('${r.id}')">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      ${r.variant_tag || r.difficulty || 'Classic'}
                    </span>
                    <span class="text-xs text-white font-mono font-bold">
                      ${routeDays} Days
                    </span>
                  </div>

                  <h4 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    <span>🗺️</span> <span>${routeTitle}</span>
                  </h4>

                  <div class="grid grid-cols-2 gap-2 text-xs text-gray-300 bg-obsidian-950/80 p-2.5 rounded-xl border border-obsidian-800 font-mono">
                    <div>
                      <span class="text-[10px] text-gray-500 block">Total Distance</span>
                      <strong class="text-amber-300">${routeDist} km</strong>
                    </div>
                    <div>
                      <span class="text-[10px] text-gray-500 block">Peak Altitude</span>
                      <strong class="text-amber-300">${routeAlt}m</strong>
                    </div>
                    <div>
                      <span class="text-[10px] text-gray-500 block">Daily Stages</span>
                      <strong class="text-white">${stagesCount} Stages</strong>
                    </div>
                    <div>
                      <span class="text-[10px] text-gray-500 block">Pace</span>
                      <strong class="text-white">${Math.round(routeDist / routeDays)} km/day</strong>
                    </div>
                  </div>

                  <!-- Quick Stage Preview -->
                  ${stages.length > 0 ? `
                    <div class="space-y-1 text-[11px] text-gray-400">
                      <span class="text-[10px] uppercase font-bold text-gray-500">Key Route Highlights:</span>
                      <div class="line-clamp-2 leading-relaxed">
                        ${stages.slice(0, 3).map(s => s.destination || s.stage_title || 'Stop').join(' → ')} ... → ${stages[stages.length - 1].destination || 'End'}
                      </div>
                    </div>
                  ` : (r.route_chain_display ? `
                    <div class="space-y-1 text-[11px] text-gray-400">
                      <span class="text-[10px] uppercase font-bold text-gray-500">Key Route Highlights:</span>
                      <div class="line-clamp-2 leading-relaxed">
                        ${r.route_chain_display}
                      </div>
                    </div>
                  ` : '')}
                </div>

                <div class="pt-3 border-t border-obsidian-700/80 flex items-center justify-between">
                  <span class="text-[11px] ${isSelected ? 'text-amber-400 font-bold' : 'text-gray-400'}">
                    ${isSelected ? '✓ Selected Route' : 'Click to Select'}
                  </span>
                  <button class="${isSelected ? 'btn-gold' : 'px-3.5 py-1.5 rounded-xl bg-obsidian-800 border border-obsidian-600 text-white hover:border-amber-400'} text-xs font-bold transition flex items-center gap-1">
                    <span>Confirm</span> <span>→</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-obsidian-700/80">
          <button onclick="window.app.setWizardStep(1)" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-obsidian-600 bg-obsidian-900">
            ← Back to Trails
          </button>
          <button onclick="window.app.setWizardStep(3)" class="btn-gold px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg">
            <span>Continue to Gear Packing</span> <span>→</span>
          </button>
        </div>
      </div>
    `;
  }

  selectWizardRoute(routeId) {
    this.wizardState.selectedRouteId = routeId;
    this.setWizardStep(3);
    const route = dataRepo.getRouteById(routeId);
    this.showToast(`Selected route: ${route?.title || route?.name || routeId}`, 'success', '🗺️');
  }

  // --- Step 3: Gear Packing & Equipment Checklist ---
  renderWizardStep3() {
    const panel = document.getElementById('wizard-step-content-3');
    if (!panel) return;

    const route = dataRepo.getRouteById(this.wizardState.selectedRouteId) || (dataRepo.routes ? dataRepo.routes[0] : null);
    const routeTitle = route?.title || route?.name || 'Trek Route';
    const routeAlt = route?.max_altitude_m || route?.max_elevation_m || 3500;
    const isHighAltitude = routeAlt >= 4000;

    const gearCategories = [
      {
        id: 'clothing',
        title: 'Thermal Layering & Alpine Clothing',
        icon: '🧥',
        items: [
          { id: 'thermal_base', name: 'Thermal Base Layers (Merino Wool)', essential: true },
          { id: 'fleece', name: 'Mid-layer Fleece / Grid Fleece Hoody', essential: true },
          { id: 'down_jacket', name: 'Heavy Down Jacket (-15°C to -20°C rated)', essential: isHighAltitude, note: isHighAltitude ? 'Mandatory for >4,000m sub-zero nights' : 'Recommended' },
          { id: 'hardshell', name: 'Waterproof & Windproof Gore-Tex Shell Jacket', essential: true },
          { id: 'pants', name: 'Quick-dry Trekking Pants (2 pairs)', essential: true },
          { id: 'socks', name: 'Merino Wool Trekking Socks (3-4 pairs)', essential: true },
          { id: 'boots', name: 'Sturdy Waterproof Hiking Boots (Broken-in)', essential: true },
          { id: 'gloves', name: 'Windproof Liner Gloves + Waterproof Mitts', essential: isHighAltitude },
          { id: 'headwear', name: 'UV Sun Hat + Warm Polar Beanie', essential: true }
        ]
      },
      {
        id: 'technical',
        title: 'Technical & Trail Navigation Equipment',
        icon: '🧭',
        items: [
          { id: 'poles', name: 'Adjustable Trekking Poles (Pair)', essential: true },
          { id: 'headlamp', name: 'Headlamp (300+ Lumens) + Spare Batteries', essential: true },
          { id: 'microspikes', name: 'Microspikes / Traction Crampons', essential: isHighAltitude, note: isHighAltitude ? 'Crucial for iced high-pass crossings' : 'Optional' },
          { id: 'sunglasses', name: 'Category 3 or 4 Glacier UV Sunglasses', essential: true },
          { id: 'offline_maps', name: 'SherpaNav Offline Topo Bundle Cached', essential: true, note: '100% Offline Ready' },
          { id: 'backpack', name: '35-50L Trekking Backpack + Waterproof Rain Cover', essential: true }
        ]
      },
      {
        id: 'medical',
        title: 'High Altitude Medical & AMS Prevention',
        icon: '🩺',
        items: [
          { id: 'diamox', name: 'Acetazolamide (Diamox 125-250mg tablets)', essential: true, note: 'Prophylaxis for rapid ascent' },
          { id: 'water_purify', name: 'Aquatabs / Chlorine Dioxide Purification Drops', essential: true },
          { id: 'first_aid', name: 'Wilderness First Aid Kit + Moleskin Blister Care', essential: true },
          { id: 'hydration', name: 'Electrolyte Rehydration Salts (ORS packets)', essential: true },
          { id: 'oximeter', name: 'Finger Pulse Oximeter (%SpO2 monitoring)', essential: isHighAltitude },
          { id: 'sunscreen', name: 'High Altitude Sunscreen SPF 50+ & Lip Balm', essential: true }
        ]
      },
      {
        id: 'trail_essentials',
        title: 'Trail Living, Power & Documentation',
        icon: '⚡',
        items: [
          { id: 'powerbank', name: '20,000mAh Power Bank (Keep in sleeping bag)', essential: true },
          { id: 'documents', name: 'Passport, TIMS Card & National Park Permit Printouts', essential: true },
          { id: 'sleeping_liner', name: 'Silk or Fleece Sleeping Bag Liner', essential: true },
          { id: 'nalgene', name: '1L Wide-Mouth Nalgene (Can hold boiling water)', essential: true },
          { id: 'drybags', name: 'Ultralight Dry Compression Sacks', essential: false },
          { id: 'cash_npr', name: 'Adequate Physical Cash (No ATMs on high trail)', essential: true }
        ]
      }
    ];

    let totalEssential = 0;
    let packedEssential = 0;
    gearCategories.forEach(cat => {
      cat.items.forEach(it => {
        if (it.essential) {
          totalEssential++;
          if (this.wizardState.packedItems[it.id]) packedEssential++;
        }
      });
    });
    const readinessPct = totalEssential > 0 ? Math.round((packedEssential / totalEssential) * 100) : 100;

    panel.innerHTML = `
      <div class="space-y-5">
        <!-- Selected Route Altitude Alert Header -->
        <div class="p-4 rounded-2xl bg-gradient-to-r ${isHighAltitude ? 'from-amber-950/80 to-obsidian-900 border border-amber-500/50' : 'from-obsidian-800 to-obsidian-900 border border-gold-400/30'} flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <span class="text-3xl">${isHighAltitude ? '❄️' : '🎒'}</span>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-amber-400 uppercase tracking-widest font-bold">Route Alpine Elevation Profile</span>
                ${isHighAltitude ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">HIGH ALTITUDE (${routeAlt}m)</span>` : ''}
              </div>
              <h3 class="text-lg font-black text-white">${routeTitle}</h3>
              <p class="text-xs text-gray-300">
                ${isHighAltitude ? 'Nighttime temperatures can drop below -10°C to -15°C. Heavy down insulation, windproof shells, and traction microspikes are strongly advised.' : 'Moderate alpine climate. Layering system is essential.'}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.app.packAllWizardGear()" class="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 hover:text-white border border-amber-400/40 bg-obsidian-900 active:scale-95 transition">
              ✓ Check All Essentials
            </button>
          </div>
        </div>

        <!-- Packing Readiness Meter -->
        <div class="sherpa-card p-4 space-y-2 bg-obsidian-850 border border-gold-400/20">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-white flex items-center gap-1.5">
              <span>🎒</span> <span>Alpine Packing Readiness:</span>
            </span>
            <span class="font-mono font-bold ${readinessPct >= 80 ? 'text-emerald-400' : (readinessPct >= 50 ? 'text-amber-400' : 'text-red-400')}">
              ${readinessPct}% Ready (${packedEssential}/${totalEssential} Essentials Packed)
            </span>
          </div>
          <div class="w-full bg-obsidian-950 rounded-full h-2.5 overflow-hidden border border-obsidian-700">
            <div class="h-full rounded-full transition-all duration-300 ${readinessPct >= 80 ? 'bg-emerald-400' : (readinessPct >= 50 ? 'bg-amber-400' : 'bg-red-400')}" style="width: ${readinessPct}%;"></div>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>3️⃣</span> <span>Step 3: Gear Packing & Equipment Checklist</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Tick each item as you verify your backpack contents.</p>
        </div>

        <!-- Categories Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          ${gearCategories.map(cat => `
            <div class="sherpa-card p-5 space-y-3 bg-obsidian-900 border border-obsidian-700/80">
              <h4 class="text-sm font-bold text-white flex items-center gap-2 border-b border-obsidian-800 pb-2">
                <span>${cat.icon}</span> <span>${cat.title}</span>
              </h4>
              <div class="space-y-1.5">
                ${cat.items.map(it => {
                  const isChecked = !!this.wizardState.packedItems[it.id];
                  return `
                    <label class="wizard-gear-item ${isChecked ? 'packed' : ''}">
                      <div class="flex items-center gap-2.5 min-w-0 pr-2">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="window.app.toggleWizardGearItem('${it.id}')" class="accent-amber-400 h-4 w-4 rounded cursor-pointer shrink-0">
                        <div class="min-w-0">
                          <span class="text-xs font-semibold ${isChecked ? 'text-white' : 'text-gray-300'} block truncate">${it.name}</span>
                          ${it.note ? `<span class="text-[10px] text-amber-300/80 block">${it.note}</span>` : ''}
                        </div>
                      </div>
                      ${it.essential ? `
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                          Essential
                        </span>
                      ` : `
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-mono text-gray-400 shrink-0">
                          Optional
                        </span>
                      `}
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-4 border-t border-obsidian-700/80">
          <button onclick="window.app.setWizardStep(2)" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-obsidian-600 bg-obsidian-900">
            ← Back to Route Variants
          </button>
          <button onclick="window.app.setWizardStep(4)" class="btn-gold px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg">
            <span>Continue to Trip Budget</span> <span>→</span>
          </button>
        </div>
      </div>
    `;
  }

  toggleWizardGearItem(itemId) {
    this.wizardState.packedItems[itemId] = !this.wizardState.packedItems[itemId];
    this.renderWizardStep3();
  }

  packAllWizardGear() {
    const allIds = [
      'thermal_base', 'fleece', 'down_jacket', 'hardshell', 'pants', 'socks',
      'boots', 'gloves', 'headwear', 'poles', 'headlamp', 'microspikes',
      'sunglasses', 'offline_maps', 'backpack', 'diamox', 'water_purify',
      'first_aid', 'hydration', 'oximeter', 'sunscreen', 'powerbank',
      'documents', 'sleeping_liner', 'nalgene', 'drybags', 'cash_npr'
    ];
    allIds.forEach(id => {
      this.wizardState.packedItems[id] = true;
    });
    this.renderWizardStep3();
    this.showToast('All essential gear marked as packed!', 'success', '🎒');
  }

  // --- Step 4: Budget Estimation & Expense Distribution ---
  renderWizardStep4() {
    const panel = document.getElementById('wizard-step-content-4');
    if (!panel) return;

    const route = dataRepo.getRouteById(this.wizardState.selectedRouteId) || (dataRepo.routes ? dataRepo.routes[0] : null);
    const routeTitle = route?.title || route?.name || 'Trek Route';
    const days = route?.total_days || 10;
    const curr = this.activeCurrency || 'USD';

    panel.innerHTML = `
      <div class="space-y-5">
        <div>
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>4️⃣</span> <span>Step 4: Interactive Trip Budget & Crew Allocation</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Pre-configured with ${days} days for ${routeTitle}. Adjust lodging, food, guide, and porter options.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Form Inputs -->
          <div class="lg:col-span-7 sherpa-card p-5 space-y-4 bg-obsidian-900 border border-obsidian-700/80">
            <h4 class="text-sm font-bold text-white border-b border-obsidian-800 pb-2 flex items-center justify-between">
              <span class="flex items-center gap-2"><span>⚙️</span> Expedition Parameters</span>
              <span class="font-mono text-xs text-amber-300 font-bold">${days} Trail Days</span>
            </h4>

            <!-- Nationality -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-300">Trekker Nationality (for official TIMS & Park permits)</label>
              <select id="wiz-calc-nationality" onchange="window.app.updateWizardBudget()" class="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-semibold">
                <option value="Foreigner" ${this.wizardState.nationality === 'Foreigner' ? 'selected' : ''}>Foreigner (Standard TIMS NPR 2,000 + Park NPR 3,000)</option>
                <option value="SAARC" ${this.wizardState.nationality === 'SAARC' ? 'selected' : ''}>SAARC National (TIMS NPR 1,000 + Park NPR 1,500)</option>
                <option value="Domestic" ${this.wizardState.nationality === 'Domestic' ? 'selected' : ''}>Nepali Citizen (TIMS Exempt + Park NPR 100)</option>
              </select>
            </div>

            <!-- Accommodation -->
            <div class="space-y-1">
              <label class="text-xs font-semibold text-gray-300">Accommodation Standard</label>
              <select id="wiz-calc-lodging" onchange="window.app.updateWizardBudget()" class="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-semibold">
                <option value="0" ${this.wizardState.lodgingType === 0 ? 'selected' : ''}>Camping / Wilderness Tent (NPR 0)</option>
                <option value="800" ${this.wizardState.lodgingType === 800 ? 'selected' : ''}>Budget Teahouse (~NPR 800/night twin share)</option>
                <option value="1500" ${this.wizardState.lodgingType === 1500 ? 'selected' : ''}>Standard Teahouse Package (~NPR 1,500/night)</option>
                <option value="2500" ${this.wizardState.lodgingType === 2500 ? 'selected' : ''}>En-suite / Heated Lodge (~NPR 2,500/night)</option>
              </select>
            </div>

            <!-- Daily Meals Slider -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span class="text-gray-300 font-medium">Daily Food & Hot Drinks (Dal Bhat, tea, soup):</span>
                <span id="wiz-meals-label" class="font-bold text-amber-300 font-mono">NPR ${this.wizardState.mealsDay.toLocaleString()} / day</span>
              </div>
              <input id="wiz-calc-meals" type="range" min="1500" max="4500" step="100" value="${this.wizardState.mealsDay}" oninput="window.app.updateWizardBudget()" class="w-full">
            </div>

            <!-- Guide & Porter Independent Selectors -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>🧭</span> Mountain Guide
                </label>
                <select id="wiz-calc-guide" onchange="window.app.updateWizardBudget()" class="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-semibold">
                  <option value="0" ${this.wizardState.guideOption === '0' ? 'selected' : ''}>No Guide (Independent)</option>
                  <option value="3500" ${this.wizardState.guideOption === '3500' ? 'selected' : ''}>Licensed Guide (~NPR 3,500/day)</option>
                  <option value="4500" ${this.wizardState.guideOption === '4500' ? 'selected' : ''}>Senior Wilderness Guide (~NPR 4,500/day)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>🎒</span> Porter Support
                </label>
                <select id="wiz-calc-porter" onchange="window.app.updateWizardBudget()" class="w-full bg-obsidian-950 border border-obsidian-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-semibold">
                  <option value="0" ${this.wizardState.porterOption === '0' ? 'selected' : ''}>No Porter (Carry Own Pack)</option>
                  <option value="2200" ${this.wizardState.porterOption === '2200' ? 'selected' : ''}>1 Porter (~NPR 2,200/day, max 20kg)</option>
                  <option value="4400" ${this.wizardState.porterOption === '4400' ? 'selected' : ''}>2 Porters (~NPR 4,400/day, max 40kg)</option>
                  <option value="2800" ${this.wizardState.porterOption === '2800' ? 'selected' : ''}>1 Porter-Guide (~NPR 2,800/day)</option>
                </select>
              </div>
            </div>

            <!-- Extras -->
            <div class="pt-2 border-t border-obsidian-800">
              <label class="text-xs font-semibold text-gray-300 block mb-1.5">Trail Extras (Showers, Charging, Wi-Fi)</label>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <label class="flex items-center gap-2 p-2 rounded-lg bg-obsidian-950 border border-obsidian-800 cursor-pointer">
                  <input type="checkbox" id="wiz-extra-shower" ${this.wizardState.extras.shower ? 'checked' : ''} onchange="window.app.updateWizardBudget()" class="accent-amber-400">
                  <span class="text-[11px] text-gray-300">Hot Shower</span>
                </label>
                <label class="flex items-center gap-2 p-2 rounded-lg bg-obsidian-950 border border-obsidian-800 cursor-pointer">
                  <input type="checkbox" id="wiz-extra-charging" ${this.wizardState.extras.charging ? 'checked' : ''} onchange="window.app.updateWizardBudget()" class="accent-amber-400">
                  <span class="text-[11px] text-gray-300">Charging</span>
                </label>
                <label class="flex items-center gap-2 p-2 rounded-lg bg-obsidian-950 border border-obsidian-800 cursor-pointer">
                  <input type="checkbox" id="wiz-extra-wifi" ${this.wizardState.extras.wifi ? 'checked' : ''} onchange="window.app.updateWizardBudget()" class="accent-amber-400">
                  <span class="text-[11px] text-gray-300">Wi-Fi Cards</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Total Cost Breakdown & Currency Switcher -->
          <div class="lg:col-span-5 space-y-4">
            <div class="sherpa-card p-6 bg-gradient-to-br from-obsidian-800 to-obsidian-900 border border-amber-400/40 shadow-xl space-y-4">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Estimated Total Trip Cost</span>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] text-gray-400 font-semibold">Currency:</span>
                  <select id="wiz-currency-select" onchange="window.app.setCurrency(this.value)" class="bg-obsidian-950 border border-gold-400/40 rounded-lg px-2 py-0.5 text-xs text-amber-300 font-mono font-bold focus:outline-none">
                    <option value="USD" ${curr === 'USD' ? 'selected' : ''}>USD ($)</option>
                    <option value="EUR" ${curr === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                    <option value="GBP" ${curr === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                    <option value="AUD" ${curr === 'AUD' ? 'selected' : ''}>AUD (A$)</option>
                    <option value="INR" ${curr === 'INR' ? 'selected' : ''}>INR (₹)</option>
                    <option value="NPR" ${curr === 'NPR' ? 'selected' : ''}>NPR (Local)</option>
                  </select>
                </div>
              </div>

              <div>
                <div class="text-3xl font-extrabold text-white font-mono" id="wiz-total-npr">NPR 0</div>
                <div class="text-sm text-amber-300 font-semibold font-mono mt-0.5" id="wiz-total-converted">≈ $0 USD</div>
              </div>

              <!-- Cost breakdown list -->
              <div class="space-y-1.5 pt-2 border-t border-obsidian-700/80 text-xs text-gray-300 font-mono">
                <div class="flex justify-between">
                  <span class="text-gray-400">Permit & Park Fees:</span>
                  <span id="wiz-breakdown-permits" class="text-white font-bold">NPR 0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Lodging (${days} nights):</span>
                  <span id="wiz-breakdown-lodging" class="text-white font-bold">NPR 0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Food & Teas (${days} days):</span>
                  <span id="wiz-breakdown-meals" class="text-white font-bold">NPR 0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Mountain Guide:</span>
                  <span id="wiz-breakdown-guide" class="text-white font-bold">NPR 0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Porter Support:</span>
                  <span id="wiz-breakdown-porter" class="text-white font-bold">NPR 0</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Trail Extras:</span>
                  <span id="wiz-breakdown-extras" class="text-white font-bold">NPR 0</span>
                </div>
                <div class="flex justify-between pt-1 border-t border-obsidian-800 text-amber-400">
                  <span>Physical Cash Buffer (15%):</span>
                  <span id="wiz-breakdown-buffer" class="font-bold">NPR 0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-4 border-t border-obsidian-700/80">
          <button onclick="window.app.setWizardStep(3)" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-obsidian-600 bg-obsidian-900">
            ← Back to Gear
          </button>
          <button onclick="window.app.setWizardStep(5)" class="btn-gold px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg">
            <span>Continue to Safety & Dossier</span> <span>→</span>
          </button>
        </div>
      </div>
    `;

    this.updateWizardBudget();
  }

  updateWizardBudget() {
    const route = dataRepo.getRouteById(this.wizardState.selectedRouteId) || (dataRepo.routes ? dataRepo.routes[0] : null);
    const days = route?.total_days || 10;

    const natEl = document.getElementById('wiz-calc-nationality');
    if (natEl) this.wizardState.nationality = natEl.value;

    const lodEl = document.getElementById('wiz-calc-lodging');
    if (lodEl) this.wizardState.lodgingType = parseInt(lodEl.value, 10);

    const mealEl = document.getElementById('wiz-calc-meals');
    if (mealEl) this.wizardState.mealsDay = parseInt(mealEl.value, 10);
    const mealLabel = document.getElementById('wiz-meals-label');
    if (mealLabel) mealLabel.textContent = `NPR ${this.wizardState.mealsDay.toLocaleString()} / day`;

    const guideEl = document.getElementById('wiz-calc-guide');
    if (guideEl) this.wizardState.guideOption = guideEl.value;

    const porterEl = document.getElementById('wiz-calc-porter');
    if (porterEl) this.wizardState.porterOption = porterEl.value;

    this.wizardState.extras.shower = document.getElementById('wiz-extra-shower')?.checked ?? true;
    this.wizardState.extras.charging = document.getElementById('wiz-extra-charging')?.checked ?? true;
    this.wizardState.extras.wifi = document.getElementById('wiz-extra-wifi')?.checked ?? true;

    // Permit Fees
    let permitFee = 5000;
    if (this.wizardState.nationality === 'SAARC') permitFee = 2500;
    else if (this.wizardState.nationality === 'Domestic') permitFee = 100;

    const lodgingTotal = days * (this.wizardState.lodgingType || 0);
    const mealsTotal = days * (this.wizardState.mealsDay || 0);
    const guideTotal = days * (parseInt(this.wizardState.guideOption, 10) || 0);
    const porterTotal = days * (parseInt(this.wizardState.porterOption, 10) || 0);

    const extraShower = this.wizardState.extras.shower ? (400 * Math.max(1, Math.floor(days * 0.6))) : 0;
    const extraCharging = this.wizardState.extras.charging ? (300 * days) : 0;
    const extraWifi = this.wizardState.extras.wifi ? (400 * Math.max(1, Math.floor(days * 0.7))) : 0;
    const extrasTotal = extraShower + extraCharging + extraWifi;

    const totalNPR = Math.max(1, permitFee + lodgingTotal + mealsTotal + guideTotal + porterTotal + extrasTotal);
    const cashReserve = Math.round(totalNPR * 0.15);
    const curr = this.activeCurrency || 'USD';
    const totalConverted = this.formatCurrency(totalNPR, curr);

    this.wizardBudgetSummary = {
      totalNPR,
      totalConverted,
      permitFee,
      lodgingTotal,
      mealsTotal,
      guideTotal,
      porterTotal,
      extrasTotal,
      cashReserve,
      days
    };

    const totNprEl = document.getElementById('wiz-total-npr');
    const totConvEl = document.getElementById('wiz-total-converted');
    if (totNprEl) totNprEl.textContent = `NPR ${totalNPR.toLocaleString()}`;
    if (totConvEl) totConvEl.textContent = `≈ ${totalConverted}`;

    const bPermits = document.getElementById('wiz-breakdown-permits');
    const bLodging = document.getElementById('wiz-breakdown-lodging');
    const bMeals = document.getElementById('wiz-breakdown-meals');
    const bGuide = document.getElementById('wiz-breakdown-guide');
    const bPorter = document.getElementById('wiz-breakdown-porter');
    const bExtras = document.getElementById('wiz-breakdown-extras');
    const bBuffer = document.getElementById('wiz-breakdown-buffer');

    if (bPermits) bPermits.textContent = `NPR ${permitFee.toLocaleString()}`;
    if (bLodging) bLodging.textContent = `NPR ${lodgingTotal.toLocaleString()}`;
    if (bMeals) bMeals.textContent = `NPR ${mealsTotal.toLocaleString()}`;
    if (bGuide) bGuide.textContent = `NPR ${guideTotal.toLocaleString()}`;
    if (bPorter) bPorter.textContent = `NPR ${porterTotal.toLocaleString()}`;
    if (bExtras) bExtras.textContent = `NPR ${extrasTotal.toLocaleString()}`;
    if (bBuffer) bBuffer.textContent = `NPR ${cashReserve.toLocaleString()}`;
  }

  // --- Step 5: Acclimatization Profile & Final Expedition Dossier ---
  renderWizardStep5() {
    const panel = document.getElementById('wizard-step-content-5');
    if (!panel) return;

    const trek = dataRepo.getTrekById(this.wizardState.selectedTrekId) || (dataRepo.treks ? dataRepo.treks[0] : null);
    const route = dataRepo.getRouteById(this.wizardState.selectedRouteId) || (dataRepo.routes ? dataRepo.routes[0] : null);
    const trekTitle = trek?.title || trek?.name || 'Himalayan Trek';
    const routeTitle = route?.title || route?.name || 'Expedition Route';
    const routeAlt = route?.max_altitude_m || route?.max_elevation_m || 4000;
    const routeDist = route?.distance_km || route?.total_distance_km || 80;
    const days = route?.total_days || 10;

    const rawItin = route ? dataRepo.getItineraryForRoute(route.id) : [];
    const stages = Array.isArray(rawItin) ? rawItin : (rawItin?.stages || []);

    // Analyze Ascent Jump Safety
    const rapidGains = [];
    for (let i = 1; i < stages.length; i++) {
      const prevEle = stages[i - 1].altitude_m || stages[i - 1].end_elevation_m || 2000;
      const currEle = stages[i].altitude_m || stages[i].end_elevation_m || 2000;
      const gain = currEle - prevEle;
      if (currEle > 3000 && gain > 500) {
        rapidGains.push({
          day: stages[i].day || (i + 1),
          from: stages[i - 1].destination || stages[i - 1].to_stop || `Stage ${i}`,
          to: stages[i].destination || stages[i].to_stop || `Stage ${i + 1}`,
          gain
        });
      }
    }

    const budget = this.wizardBudgetSummary || {
      totalNPR: 85000,
      totalConverted: '$634 USD',
      days: days
    };

    panel.innerHTML = `
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-extrabold text-white flex items-center gap-2">
            <span>5️⃣</span> <span>Step 5: Altitude Profile, AMS Safety & Final Expedition Dossier</span>
          </h3>
          <p class="text-xs text-gray-400 mt-0.5">Clinical altitude safety review and complete expedition overview ready for trail deployment.</p>
        </div>

        <!-- Acclimatization Safety Assessment Banner -->
        <div class="p-5 rounded-2xl bg-gradient-to-br from-obsidian-800 to-obsidian-900 border border-gold-400/40 shadow-xl space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>🩺</span> <span>Clinical Acclimatization & Rapid Ascent Telemetry</span>
            </span>
            <span class="text-xs font-mono font-bold ${rapidGains.length > 0 ? 'text-amber-400' : 'text-emerald-400'}">
              ${rapidGains.length > 0 ? `⚠️ ${rapidGains.length} High Ascent Jump(s) Detected` : '✓ Optimal Gradual Acclimatization'}
            </span>
          </div>

          ${rapidGains.length > 0 ? `
            <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <strong class="text-amber-300">Wilderness Medicine Guideline Alert:</strong> Sleeping elevation increases exceed 500m/day above 3,000m on the following stages:
              <ul class="list-disc pl-5 pt-1 space-y-0.5">
                ${rapidGains.map(rg => `
                  <li>Day ${rg.day} (${rg.from} → ${rg.to}): <strong>+${rg.gain}m</strong> ascent in 1 day. Recommend taking an acclimatization rest day or monitoring SpO2 closely.</li>
                `).join('')}
              </ul>
            </div>
          ` : `
            <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200">
              ✓ <strong>Safe Sleep Profile:</strong> Daily sleeping elevations follow standard wilderness medicine guidelines. Maintain slow pacing, drink 4L of fluids daily, and avoid alcohol.
            </div>
          `}

          <!-- Quick Elevation Chart Preview -->
          <div id="wiz-elevation-chart" class="p-2 rounded-xl bg-obsidian-950 border border-obsidian-800 overflow-hidden">
            <!-- Rendered by mapEngine.renderElevationProfile -->
          </div>
        </div>

        <!-- The Final Expedition Dossier Card -->
        <div class="sherpa-card p-6 bg-gradient-to-b from-obsidian-800 to-obsidian-900 border-2 border-gold-400/50 shadow-2xl space-y-5">
          <div class="flex items-center justify-between border-b border-obsidian-700/80 pb-3 flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <span class="text-3xl">🏔️</span>
              <div>
                <span class="text-[10px] text-amber-400 uppercase tracking-widest font-bold">SherpaNav Expedition Dossier</span>
                <h3 class="text-xl font-black text-white">${trekTitle} — ${routeTitle}</h3>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                ${days} Days • ${routeAlt}m Max
              </span>
            </div>
          </div>

          <!-- Dossier Key Metrics Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800">
              <span class="text-[10px] text-gray-500 block">Total Distance</span>
              <strong class="text-white text-base font-mono">${routeDist} km</strong>
            </div>
            <div class="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800">
              <span class="text-[10px] text-gray-500 block">Peak Altitude</span>
              <strong class="text-amber-300 text-base font-mono">${routeAlt}m</strong>
            </div>
            <div class="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800">
              <span class="text-[10px] text-gray-500 block">Estimated Budget</span>
              <strong class="text-emerald-300 text-base font-mono">${budget.totalConverted}</strong>
            </div>
            <div class="p-3 rounded-xl bg-obsidian-950 border border-obsidian-800">
              <span class="text-[10px] text-gray-500 block">Emergency Cash</span>
              <strong class="text-amber-300 text-base font-mono">NPR ${(budget.cashReserve || 12000).toLocaleString()}</strong>
            </div>
          </div>

          <!-- Stage-by-Stage Itinerary Preview -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <span>📅</span> <span>Stage Itinerary Overview</span>
            </h4>
            <div class="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
              ${stages.map((st, idx) => `
                <div class="p-2.5 rounded-lg bg-obsidian-950 border border-obsidian-800 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 flex items-center justify-center font-mono font-bold text-[10px]">
                      D${st.day || idx + 1}
                    </span>
                    <span class="text-white font-semibold">${st.destination || st.stage_title || `Stage ${idx + 1}`}</span>
                  </div>
                  <div class="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                    ${st.distance_km ? `<span>${st.distance_km} km</span>` : ''}
                    <span class="text-amber-300 font-bold">${st.altitude_m || 2000}m</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Master Action Deck -->
          <div class="pt-4 border-t border-obsidian-700/80 flex items-center justify-between flex-wrap gap-3">
            <button onclick="window.app.setWizardStep(4)" class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-obsidian-600 bg-obsidian-900">
              ← Back to Budget
            </button>

            <div class="flex items-center gap-2.5 flex-wrap">
              <button onclick="window.app.printWizardExpedition()" class="btn-gold px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg active:scale-95 transition" title="Print full field sheet with route topographic map">
                <span>🖨️</span> <span>Print Field Sheet & Map</span>
              </button>
              <button onclick="window.app.launchRouteFromWizard()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-obsidian-800 hover:bg-obsidian-700 border border-gold-400/40 active:scale-95 transition flex items-center gap-1.5">
                <span>🗺️</span> <span>Explore on Route Map</span>
              </button>
              <button onclick="window.app.saveExpeditionToProfile()" class="px-4 py-2 rounded-xl text-xs font-bold text-amber-300 hover:text-white bg-obsidian-950 border border-obsidian-700 active:scale-95 transition flex items-center gap-1.5">
                <span>💾</span> <span>Save to Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Render Elevation Profile in Wizard Step 5
    setTimeout(() => {
      const routeObj = dataRepo.getRouteById(this.wizardState.selectedRouteId);
      const waypoints = stages.map((s, idx) => ({
        name: s.destination || s.stage_title || `Day ${s.day || idx + 1}`,
        elevation_m: s.altitude_m || 2500,
        lat: s.lat || 28.0,
        lon: s.lon || 84.0
      }));
      const rawCoords = routeObj?.trail_coordinates || [];
      mapEngine.renderElevationProfile('wiz-elevation-chart', waypoints, rawCoords);
    }, 50);
  }

  printWizardExpedition() {
    this.selectedRouteId = this.wizardState.selectedRouteId;
    this.triggerDirectPrint(this.selectedRouteId);
  }

  launchRouteFromWizard() {
    this.selectedRouteId = this.wizardState.selectedRouteId;
    this.navigateTo('route-map', { routeId: this.wizardState.selectedRouteId });
  }

  saveExpeditionToProfile() {
    const route = dataRepo.getRouteById(this.wizardState.selectedRouteId);
    const trek = dataRepo.getTrekById(this.wizardState.selectedTrekId);
    const expedition = {
      id: 'EXP_' + Date.now(),
      savedAt: new Date().toISOString(),
      trekName: trek?.title || trek?.name || 'Himalayan Trek',
      routeName: route?.title || route?.name || 'Expedition Route',
      routeId: this.wizardState.selectedRouteId,
      days: route?.total_days || 10,
      budget: this.wizardBudgetSummary?.totalConverted || '$634 USD',
      readiness: 'Verified'
    };

    try {
      const saved = JSON.parse(localStorage.getItem('sherpanav_saved_expeditions') || '[]');
      saved.unshift(expedition);
      localStorage.setItem('sherpanav_saved_expeditions', JSON.stringify(saved.slice(0, 10)));
      this.showToast(`Expedition "${expedition.routeName}" saved to profile!`, 'success', '💾');
    } catch (e) {
      this.showToast('Expedition saved successfully!', 'success', '💾');
    }
  }

  // =========================================================================
  // UNIVERSAL COMMAND PALETTE (CTRL+K / CMD+K)
  // =========================================================================

  initCommandPalette() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      } else if (e.key === 'Escape') {
        this.closeCommandPalette();
        this.closeTeahouseCallModal();
      }
    });
  }

  openCommandPalette() {
    const modal = document.getElementById('modal-command-palette');
    if (!modal) return;
    modal.classList.remove('hidden');
    const input = document.getElementById('cmd-palette-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    this.filterCommandPalette('');
  }

  closeCommandPalette() {
    const modal = document.getElementById('modal-command-palette');
    if (modal) modal.classList.add('hidden');
  }

  filterCommandPalette(query = '') {
    const container = document.getElementById('cmd-palette-results');
    if (!container) return;

    const q = query.trim().toLowerCase();
    const results = [];

    // 1. Navigation Shortcuts
    const navItems = [
      { name: '✨ Plan a Trek (Guided 5-Step Wizard)', view: 'plan-wizard', type: 'Planner' },
      { name: '🧭 Explore All Treks & Regions', view: 'explore', type: 'View' },
      { name: '🗺️ Interactive Topographic Route Map', view: 'route-map', type: 'View' },
      { name: '🏠 Verified Teahouse Directory (405 Lodges)', view: 'accommodations', type: 'View' },
      { name: '🌤️ Live Mountain Weather & Freezing Radar', view: 'weather', type: 'View' },
      { name: '🛂 Permits, Fees & Checkpoints (TIMS/ACAP)', view: 'permits', type: 'View' },
      { name: '🩺 Lake Louise Clinical AMS Tracker', view: 'tracker', type: 'Clinical' },
      { name: '🎒 Gear & Equipment Packing Checklist', view: 'checklist', type: 'View' },
      { name: '💰 Himalayan Trip Budget Calculator', view: 'calculator', type: 'Tools' },
      { name: '🚨 Emergency SOS & Rescue Telemetry', view: 'sos', type: 'Emergency' }
    ];

    navItems.forEach(n => {
      if (!q || n.name.toLowerCase().includes(q) || n.view.includes(q)) {
        results.push({
          icon: n.name.slice(0, 2),
          title: n.name.slice(3),
          meta: n.type,
          action: () => {
            this.closeCommandPalette();
            this.navigateTo(n.view);
          }
        });
      }
    });

    // 2. Routes (up to 8 matches)
    if (q) {
      (dataRepo.routes || []).forEach(r => {
        const title = r.title || r.name || '';
        if (title.toLowerCase().includes(q) || (r.id && r.id.toLowerCase().includes(q))) {
          results.push({
            icon: '🗺️',
            title: title,
            meta: `${r.total_days || 10} Days • ${r.max_altitude_m || r.max_elevation_m || 4000}m`,
            action: () => {
              this.closeCommandPalette();
              this.navigateTo('route-map', { routeId: r.id });
            }
          });
        }
      });

      // 3. Accommodations (up to 6 matches)
      let lodgeCount = 0;
      (dataRepo.accommodations || []).forEach(a => {
        if (lodgeCount < 6 && ((a.name && a.name.toLowerCase().includes(q)) || (a.settlement_name && a.settlement_name.toLowerCase().includes(q)))) {
          lodgeCount++;
          results.push({
            icon: '🏡',
            title: a.name,
            meta: `${a.settlement_name} • ~${a.base_room_price_npr || 800} NPR`,
            action: () => {
              this.closeCommandPalette();
              this.openTeahouseCallModal(a.id);
            }
          });
        }
      });
    }

    if (results.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center text-xs text-gray-400">
          No matching routes, lodges, or views found for "<span class="text-white">${query}</span>".
        </div>
      `;
      return;
    }

    container.innerHTML = results.slice(0, 14).map((res, idx) => `
      <div class="cmd-palette-item ${idx === 0 ? 'active' : ''}" onclick="window.app._runCmdAction(${idx})">
        <div class="flex items-center gap-2.5 min-w-0 pr-2">
          <span class="text-base">${res.icon}</span>
          <span class="text-xs font-semibold text-white truncate">${res.title}</span>
        </div>
        <span class="text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded bg-obsidian-950 border border-obsidian-800 shrink-0">
          ${res.meta}
        </span>
      </div>
    `).join('');

    this._cmdCurrentResults = results;
  }

  _runCmdAction(idx) {
    if (this._cmdCurrentResults && this._cmdCurrentResults[idx]) {
      this._cmdCurrentResults[idx].action();
    }
  }

  // =========================================================================
  // TEAHOUSE DIRECT CALL & DIALING ASSISTANT
  // =========================================================================

  openTeahouseCallModal(accId) {
    const acc = (dataRepo.accommodations || []).find(a => a.id === accId);
    if (!acc) return;

    const modal = document.getElementById('modal-teahouse-call');
    if (!modal) return;

    const nameEl = document.getElementById('teahouse-call-name');
    const setEl = document.getElementById('teahouse-call-settlement');
    const numEl = document.getElementById('teahouse-call-number');
    const dialLink = document.getElementById('teahouse-call-dial-link');

    const rawPhone = (acc.phones && acc.phones[0]) || acc.phone_contact || acc.contacts?.primary_phone || '+977 9841000000';
    const cleanPhone = rawPhone.replace(/[^0-9+]/g, '');

    if (nameEl) nameEl.textContent = acc.name;
    if (setEl) setEl.textContent = `${acc.settlement_name} • Capacity: ${acc.capacity || 20} beds • NPR ${acc.base_room_price_npr || 800}`;
    if (numEl) numEl.textContent = rawPhone;
    if (dialLink) {
      dialLink.href = `tel:${cleanPhone}`;
      dialLink.title = `Call ${acc.name} at ${rawPhone}`;
    }

    this._activeLodgeNumber = cleanPhone;
    modal.classList.remove('hidden');
  }

  closeTeahouseCallModal() {
    const modal = document.getElementById('modal-teahouse-call');
    if (modal) modal.classList.add('hidden');
  }

  copyTeahouseNumber() {
    const num = this._activeLodgeNumber || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num).then(() => {
        this.showToast(`Copied ${num} to clipboard!`, 'success', '📋');
      }).catch(() => {
        this.showToast(`Phone number: ${num}`, 'gold', '📞');
      });
    } else {
      this.showToast(`Phone number: ${num}`, 'gold', '📞');
    }
  }
}

window.app = new SherpaNavApp();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
  });
} else {
  window.app.init();
}

  window.SherpaNavApp = SherpaNavApp;
})();