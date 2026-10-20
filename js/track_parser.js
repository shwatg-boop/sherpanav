// SherpaNav - Client-Side GPX & KML Parser & Local Storage Manager

export class TrackParser {
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
