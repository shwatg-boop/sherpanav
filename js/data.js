// SherpaNav - Data Loader & Query Repository
import { TrackParser } from './track_parser.js';

export class DataRepository {
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

export const dataRepo = new DataRepository();
