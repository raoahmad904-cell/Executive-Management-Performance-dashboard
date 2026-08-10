import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import StatusModal from "../../../components/common/StatusModal";

const ACCENT = "#0D4429";

function PasswordField({ placeholder, value, onChangeText, icon }) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="flex-row items-center rounded-xl bg-white px-3.5 h-12 mb-3">
      <Ionicons name={icon} size={18} color="#6b7280" style={{ marginRight: 8 }} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={!visible}
        value={value}
        onChangeText={onChangeText}
        className="flex-1 text-base text-gray-900"
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setVisible(v => !v)} hitSlop={8}>
        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={18} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
}

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState(null);

  // Single status popup for this screen - covers validation errors, backend
  // errors (e.g. wrong old password), and the success confirmation, all with
  // the same in-app styled modal used elsewhere instead of native Alert.alert.
  const [status, setStatus] = useState(null); // { type: 'error'|'success', title, message }

  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Change Password` });
  }, [nav]);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) {
          const u = JSON.parse(uStr);
          const roleLower = u.role ? u.role.toLowerCase() : "user";
          setRole(roleLower === "management" || roleLower === "jmanagement" ? roleLower : "user");
        }
      } catch (err) {
        console.error("Error loading user role:", err);
      }
    };
    loadRole();
  }, []);

  // navigation.replace("ChangePassword") swaps out the Dashboard route entirely,
  // so there's nothing to goBack() to - route back explicitly, and with the
  // correct role, otherwise Dashboard defaults to "management" for everyone.
  function goToDashboard() {
    navigation.replace("Dashboard", { role: role || "user" });
  }

  function resetFields() {
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  function showError(title, message) {
    setStatus({ type: "error", title, message });
  }

  async function handleUpdate() {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showError("Required Fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      showError("Weak Password", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showError("Password Mismatch", "New password and confirmation do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (res.ok) {
        resetFields();
        setStatus({
          type: "success",
          title: "Password Updated",
          message: "Your password has been changed successfully.",
        });
      } else {
        const errJson = await res.json().catch(() => ({}));
        showError("Error", errJson.error || "Failed to update password.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showError("Network Error", "Could not connect to the backend server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-black/50 items-center justify-center px-6">
      <View
        style={{
          width: "100%",
          maxWidth: 380,
          backgroundColor: "#ffffff",
          borderRadius: 24,
          borderWidth: 3,
          borderColor: ACCENT,
          padding: 8,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}
      >
        <View style={{ backgroundColor: "#ffffff", borderRadius: 18, overflow: "hidden" }}>
          {/* Header */}
          <View className="items-center pt-6 pb-4 px-5" style={{ backgroundColor: ACCENT }}>
            <Pressable
              onPress={goToDashboard}
              hitSlop={10}
              style={{ position: "absolute", top: 14, right: 14 }}
            >
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
            </Pressable>
            <View style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 50, padding: 14 }}>
              <Ionicons name="key-outline" size={30} color="#ffffff" />
            </View>
            <Text className="text-white font-bold text-lg mt-3">Change Password</Text>
            <Text className="text-white/70 text-xs mt-1 text-center">
              Choose a new password for your account
            </Text>
          </View>

          {/* Fields */}
          <View className="p-5">
            <PasswordField
              placeholder="Old Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              icon="lock-closed-outline"
            />
            <PasswordField
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              icon="lock-open-outline"
            />
            <PasswordField
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              icon="checkmark-done-outline"
            />

            {/* Buttons */}
            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={goToDashboard}
                disabled={submitting}
                activeOpacity={0.8}
                className="flex-1 h-12 rounded-xl border border-gray-300 items-center justify-center"
              >
                <Text className="text-gray-700 font-semibold text-sm">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUpdate}
                disabled={submitting}
                activeOpacity={0.85}
                className="flex-1 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: "#FBBF24", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={ACCENT} />
                ) : (
                  <Text className="font-bold text-sm" style={{ color: ACCENT }}>
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <StatusModal
        visible={status !== null}
        type={status?.type}
        title={status?.title}
        message={status?.message}
        onClose={() => {
          const wasSuccess = status?.type === "success";
          setStatus(null);
          if (wasSuccess) goToDashboard();
        }}
      />
    </View>
  );
}
