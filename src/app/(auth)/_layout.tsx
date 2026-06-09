import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="admin/login" />
      <Stack.Screen name="super-admin/login" />
    </Stack>
  );
}
