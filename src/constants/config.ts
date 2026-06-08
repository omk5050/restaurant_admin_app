import { AppSettings } from "@/types";
import Constants from "expo-constants";

// Extract host IP for Android/iOS device support in local development
const hostUri = Constants.expoConfig?.hostUri;
const ip = hostUri ? hostUri.split(":")[0] : "localhost";

// Once you deploy to Render, paste your web service URL here (e.g., "https://restaurant-pos-api.onrender.com")
export const DEPLOYED_API_URL = "https://restaurant-admin-app-q86t.onrender.com";

export const API_URL = DEPLOYED_API_URL || `http://${ip}:3000`;

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
  tableCount: 12,
};

