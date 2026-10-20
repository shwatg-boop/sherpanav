// SherpaNav - Nationwide Multi-Route Overview Map Engine

export class OverviewMapEngine {
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

export const overviewMapEngine = new OverviewMapEngine();
