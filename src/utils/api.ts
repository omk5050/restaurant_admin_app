import AsyncStorage from '@react-native-async-storage/async-storage';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await AsyncStorage.getItem('authToken');
  const selectedAdminId = await AsyncStorage.getItem('selectedAdminId');

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (selectedAdminId) {
    headers.set('X-Selected-Admin-Id', selectedAdminId);
  }

  // Set default JSON headers if not already set and body is present
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
