import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, Platform } from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  confirmText?: string;
}

export function CustomAlert({
  visible,
  title,
  message,
  type,
  onClose,
  confirmText = "Continue",
}: CustomAlertProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return "✨";
      case "error":
        return "⚠️";
      case "warning":
        return "⏳";
      case "info":
        return "ℹ️";
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "success":
        return "#10B981"; // Emerald
      case "error":
        return "#EF4444"; // Rose/Red
      case "warning":
        return "#F59E0B"; // Amber
      case "info":
        return "#3B82F6"; // Blue
    }
  };

  const getBgLight = () => {
    switch (type) {
      case "success":
        return "#ECFDF5";
      case "error":
        return "#FEF2F2";
      case "warning":
        return "#FFFBEB";
      case "info":
        return "#EFF6FF";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          {/* Badge Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getBgLight(), borderColor: getHeaderColor() }]}>
            <Text style={styles.icon}>{getIcon()}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: getHeaderColor() }]}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: getHeaderColor() },
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)", // Dark, premium slate overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertBox: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.12)",
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  button: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
