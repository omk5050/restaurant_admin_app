import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from "expo-router";
import { API_URL } from '@/constants/config';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '@/components/ui/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';

export default function SuperAdminLoginScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <LinearGradient
      colors={['#0f172a', '#1e1b4b']} // Premium dark slate to deep indigo gradient matching Admin Login
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <Text style={styles.title}>Sign Up</Text>
              
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                placeholder="Company Name"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
              />

              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                placeholder="Phone Number"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.buttonText} numberOfLines={2}>
                  Create Account & Request Access
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push("/(auth)/admin/login")}
                style={styles.loginLink}
              >
                <Text style={styles.loginLinkText}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={handleCloseAlert}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 28,
    paddingVertical: 36,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  title: {
    fontSize: 30,
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
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#0f172a',
    fontSize: 15,
  },
  eyeIcon: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ff7043',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 16,
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff7043',
  },
});
