// SherpaNav - Advanced Interaction & Animation Engine
// Features: Mouse Spotlight & 3D Tilt, Scroll Progress, Staggered Scroll-Reveal,
// Animated Number Counters, Gliding Nav Island, Web Audio API Tactile Micro-Sounds,
// and Live Nepal Standard Time & Daylight Phase Radar.

export class InteractionEngine {
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

export const interactionEngine = new InteractionEngine();
