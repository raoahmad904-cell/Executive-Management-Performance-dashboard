import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Change Password` });
  }, [nav]);

  return (
    <View className="flex-1 bg-black/40 items-center justify-center px-6">
      <View className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <View className="px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
          <Text className="text-gray-900 font-bold text-lg">Change Password</Text>
          <Pressable onPress={() => navigation.replace("Dashboard")} hitSlop={10}>
            <Ionicons name="close" size={18} color="#6b7280" />
          </Pressable>
        </View>

        {/* Fields */}
        <View className="p-5 gap-3">
          <TextInput
            placeholder="Old Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={oldPassword}
            onChangeText={setOldPassword}
            className="border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
          />
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            className="border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
          />
          <TextInput
            placeholder="Confirm New Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            className="border border-gray-200 rounded-lg px-4 py-3 text-gray-900"
          />

          {/* Buttons */}
          <View className="flex-row justify-end gap-3 pt-2">
            <Pressable
              onPress={() => navigation.replace("Dashboard")}
              className="bg-gray-600 rounded-lg px-4 py-3"
            >
              <Text className="text-white font-semibold">Cancel</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                // TODO: call your API + validate confirm password
              }}
              className="bg-blue-600 rounded-lg px-4 py-3"
            >
              <Text className="text-white font-semibold">Update Password</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}