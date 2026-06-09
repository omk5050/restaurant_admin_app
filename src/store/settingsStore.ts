import { create } from "zustand";
import { AppSettings } from "@/types";
import { API_URL, DEFAULT_SETTINGS } from "@/constants/config";
import { apiFetch } from "@/utils/api";

interface SettingsStore {
  settings: AppSettings;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  fetchSettings: async () => {
    try {
      const res = await apiFetch(`${API_URL}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        set({ settings: data });
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  },
  updateSettings: async (newSettings) => {
    try {
      const current = get().settings;
      const merged = { ...current, ...newSettings };
      const res = await apiFetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (res.ok) {
        const data = await res.json();
        set({ settings: data });
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update settings");
      }
    } catch (err) {
      console.error("Failed to update settings:", err);
      throw err;
    }
  },
}));

