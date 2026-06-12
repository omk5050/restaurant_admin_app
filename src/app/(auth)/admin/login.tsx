import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from "expo-router";
import { CustomAlert } from '@/components/ui/CustomAlert';

export default function AdminLoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const triggerAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleSubmit = async () => {
    if (!email.trim() && !password.trim()) {
      triggerAlert(
        'Empty Credentials',
        'Please enter your email and password to log in.',
        'warning'
      );
      return;
    }
    if (!email.trim()) {
      triggerAlert(
        'Email Required',
        'Please enter your email address to log in.',
        'warning'
      );
      return;
    }
    if (!password.trim()) {
      triggerAlert(
        'Password Required',
        'Please enter your password to log in.',
        'warning'
      );
      return;
    }

    try {
      await signIn(email.trim(), password, 'admin');
    } catch (e: any) {
      triggerAlert(
        'Access Denied',
        'Invalid email or password. Please verify your credentials.',
        'error'
      );
    }
  };

  return (
    <ImageBackground
      source={require('../../../../assets/images/background-image.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark premium overlay */}
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Admin Login</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/super-admin/login")}
            style={{
              marginTop: 20,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#ff7043", // Warm orange accent matching the restaurant theme
              }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // Premium dark slate filter
  },
  card: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)', // Frosted glass-like layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 24,
    textAlign: 'center',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  input: {
    height: 50,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#ff7043',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
