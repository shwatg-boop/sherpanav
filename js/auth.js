// SherpaNav - Local Authentication & Profile Management System

const AUTH_STORAGE_KEY = 'sherpanav_users';
const SESSION_STORAGE_KEY = 'sherpanav_current_user';

export class AuthService {
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

export const authService = new AuthService();
