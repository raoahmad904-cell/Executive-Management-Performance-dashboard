import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

const PALETTES = {
  error: {
    border: "#DC2626",
    iconBg: "#FEE2E2",
    icon: "alert-circle",
    iconColor: "#DC2626",
    buttonBg: "#DC2626",
  },
  success: {
    border: "#0D4429",
    iconBg: "#DCFCE7",
    icon: "checkmark-circle",
    iconColor: "#16A34A",
    buttonBg: "#0D4429",
  },
  warning: {
    border: "#D97706",
    iconBg: "#FEF3C7",
    icon: "alert-circle",
    iconColor: "#D97706",
    buttonBg: "#D97706",
  },
};

/**
 * App-wide styled status popup (error/success/warning) - the consistent
 * in-app replacement for the plain native Alert.alert(), matching the
 * green-bordered white-card design already used across the app's other
 * confirmation/success modals.
 */
export default function StatusModal({
  visible,
  type = "error",
  title,
  message,
  buttonText = "OK",
  onClose,
}) {
  const palette = PALETTES[type] || PALETTES.error;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{
          backgroundColor: '#ffffff',
          borderRadius: 24,
          borderWidth: 3,
          borderColor: palette.border,
          width: '100%',
          maxWidth: 340,
          padding: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10
        }}>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
            <View style={{ backgroundColor: palette.iconBg, borderRadius: 50, padding: 18, marginBottom: 16 }}>
              <Ionicons name={palette.icon} size={42} color={palette.iconColor} />
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
              {title}
            </Text>

            {message ? (
              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                {message}
              </Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: palette.buttonBg,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
