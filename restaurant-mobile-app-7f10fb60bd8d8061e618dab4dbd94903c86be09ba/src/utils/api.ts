import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * An authenticated wrapper around the standard `fetch` API.
 * Automatically injects the stored JWT token from AsyncStorage into the "Authorization" header.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await AsyncStorage.getItem("userToken");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
