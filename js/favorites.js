/**
 * Favorites & Inspiration Collection Manager
 * Persists user bookmarks into localStorage
 */
class FavoritesManager {
  constructor() {
    this.STORAGE_KEY = 'typography_showcase_favorites_v1';
    this.favorites = new Set(this.load());
    this.listeners = new Set();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.warn('Failed to load favorites from localStorage', e);
    }
    return [];
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.favorites)));
    } catch (e) {
      console.warn('Failed to save favorites to localStorage', e);
    }
    this.notify();
  }

  has(id) {
    return this.favorites.has(Number(id));
  }

  toggle(id) {
    const numId = Number(id);
    let state = false;
    if (this.favorites.has(numId)) {
      this.favorites.delete(numId);
      state = false;
    } else {
      this.favorites.add(numId);
      state = true;
    }
    this.save();
    return state;
  }

  count() {
    return this.favorites.size;
  }

  getAll() {
    return Array.from(this.favorites);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const fn of this.listeners) {
      try {
        fn(this.count(), this.getAll());
      } catch (e) {
        console.error(e);
      }
    }
  }
}

window.favoritesManager = new FavoritesManager();
