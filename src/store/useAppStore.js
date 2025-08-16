import { create } from "zustand";

const LS = {
  get(key, def){
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? def; } catch { return def; }
  },
  set(key, v){ localStorage.setItem(key, JSON.stringify(v)); }
};

export const useAppStore = create((set, get) => ({
  // UI
  fiat: LS.get("ict:fiat", "USD"),
  days: LS.get("ict:days", 7),
  search: "",
  setFiat: (fiat) => { LS.set("ict:fiat", fiat); set({ fiat }); },
  setDays: (days) => { LS.set("ict:days", days); set({ days }); },
  setSearch: (search) => set({ search }),

  // favorites
  favorites: new Set(LS.get("ict:favs", [])),
  toggleFavorite: (id) => {
    const favs = new Set(get().favorites);
    favs.has(id) ? favs.delete(id) : favs.add(id);
    LS.set("ict:favs", [...favs]);
    set({ favorites: favs });
  }
}));
