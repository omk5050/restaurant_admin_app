import { AppSettings } from "@/types";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Extract host IP for Android/iOS device support in local development
const hostUri = Constants.expoConfig?.hostUri;
const ip = hostUri ? hostUri.split(":")[0] : "localhost";

// Detect browser host domain dynamically when run on Render (deployed)
// But NOT when running locally — window.location.origin would be the Expo dev server port, not :3000
let relativeApiUrl = "";
if (Platform.OS === "web" && typeof window !== "undefined") {
  const origin = window.location.origin;
  const isLocal = origin.includes("localhost") || origin.includes("127.0.0.1");
  if (!isLocal) {
    // Deployed (e.g. Render) — use same origin as backend
    relativeApiUrl = origin;
  }
}

// Once you deploy to Render, paste your web service URL here (e.g., "https://restaurant-pos-api.onrender.com")
export const DEPLOYED_API_URL = "https://restaurant-admin-app-q86t.onrender.com";

// Allow overriding via environment variable, otherwise fall back to relative or local URL
export const API_URL = process.env.EXPO_PUBLIC_API_URL || relativeApiUrl || (Platform.OS === "web" ? `http://localhost:3000` : `http://${ip}:3000`);

export const APP_CONFIG = {
  gstPercent: 5,
  lowStockWarning: 8,
};

export const DEFAULT_SETTINGS: AppSettings = {
  restaurantName: "Hotel Grand",
  address: "123 MG Road, Your City",
  gstNumber: "07AABC1234D1Z5",
  gstPercent: APP_CONFIG.gstPercent,
  currency: "₹",
  tableCount: 14,
  restaurantTableCount: 6,
  familyTableCount: 4,
  takeawayTableCount: 4,
};

