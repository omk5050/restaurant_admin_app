import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from "expo-router";
import { CustomAlert } from '@/components/ui/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <LinearGradient
      colors={['#0f172a', '#1e1b4b']} // Premium dark slate to deep indigo gradient
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
              <Text style={styles.title}>Admin Login</Text>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
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
              <TouchableOpacity style={styles.button} onPress={handleSubmit} activeOpacity={0.85}>
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/super-admin/login")}
                style={styles.signupLink}
              >
                <Text style={styles.signupLinkText}>Sign Up</Text>
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
        onClose={() => setAlertVisible(false)}
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
    marginBottom: 28,
    textAlign: 'center',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  input: {
    height: 52,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    color: '#0f172a',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ff7043',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 8,
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff7043',
  },
});
