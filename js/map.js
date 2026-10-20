// SherpaNav - Interactive OpenStreetMap & High-Density Elevation Profile Engine

export class MapEngine {
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

export const mapEngine = new MapEngine();

