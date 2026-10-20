// SherpaNav - 2018 Lake Louise Acute Mountain Sickness (AMS) Clinical Engine

const AMS_STORAGE_KEY = 'sherpanav_ams_logs';

export class AMSService {
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

export const amsService = new AMSService();
