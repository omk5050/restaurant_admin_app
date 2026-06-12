import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ImageBackground, ScrollView } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from "expo-router";
import { API_URL } from '@/constants/config';
import { CustomAlert } from '@/components/ui/CustomAlert';

export default function SuperAdminLoginScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  // Custom Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [redirectOnClose, setRedirectOnClose] = useState(false);

  const triggerAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info',
    shouldRedirect = false
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setRedirectOnClose(shouldRedirect);
    setAlertVisible(true);
  };

  const handleCloseAlert = () => {
    setAlertVisible(false);
    if (redirectOnClose) {
      router.push('/(auth)/admin/login');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !companyName.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      triggerAlert(
        'Incomplete Details',
        'Please fill in all mandatory fields to request access.',
        'warning'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      triggerAlert(
        'Invalid Email',
        'Please enter a valid email address.',
        'warning'
      );
      return;
    }

    if (password !== confirmPassword) {
      triggerAlert(
        'Mismatched Passwords',
        'Passwords do not match. Please verify.',
        'warning'
      );
      return;
    }

    if (password.length < 6) {
      triggerAlert(
        'Weak Password',
        'Password must be at least 6 characters long.',
        'warning'
      );
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          restaurantName: companyName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      triggerAlert(
        'Request Submitted',
        'Signed up successfully. The dispatcher will contact you soon.',
        'success',
        true // Redirect back to login on close
      );
    } catch (e: any) {
      triggerAlert(
        'Registration Failed',
        e.message || 'Failed to submit registration request. Please try again.',
        'error'
      );
    }
  };

  return (
    <ImageBackground
      source={require('../../../assets/images/background-image.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Sign Up</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <TextInput
              placeholder="Company Name"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
            />

            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Create Account & Request Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/admin/login")}
            style={{
              marginTop: 18,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#ff7043",
              }}
            >
              Log In
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={handleCloseAlert}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  card: {
    width: '85%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  input: {
    height: 48,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
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
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
