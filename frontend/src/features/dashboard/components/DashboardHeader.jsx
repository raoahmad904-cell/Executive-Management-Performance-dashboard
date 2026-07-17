import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import Constants from "expo-constants";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardHeader({
  roleLabel = "Test User",
  navigation,
  headerTitle = "PERFORMANCE DASHBOARD",
  onMenuPress,
}) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const statusBarFallback =
    Platform.OS === "android"
      ? StatusBar.currentHeight ?? 0
      : Constants.statusBarHeight ?? 0;
  const topInset = Math.max(insets.top, statusBarFallback);

  return (
    <View style={{ paddingTop: topInset }} className="bg-white">
      {/* Top row: menu + logo + user */}
      <View className="z-10 flex-row items-center bg-white px-3 py-3">
        {onMenuPress ? (
          <TouchableOpacity
            onPress={onMenuPress}
            className="mr-2 p-1"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={28} color="#0B5D4E" />
          </TouchableOpacity>
        ) : null}

        <Image
          source={require("../../../assets/images/login_logo.jpeg")}
          className="h-10 w-10"
          resizeMode="contain"
        />

        <View className="flex-1" />

        <View className="relative">
          <TouchableOpacity
            onPress={() => setOpen((v) => !v)}
            className="flex-row items-center gap-1 px-1 py-1"
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
          >
            <Ionicons name="person-circle-outline" size={26} color="#0A92E2" />
            <Text
              className="max-w-[140px] text-[#0A92E2] font-semibold"
              numberOfLines={1}
            >
              {roleLabel}
            </Text>
          </TouchableOpacity>

          {open && (
            <View className="absolute right-0 top-11 z-20 w-60 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-lg">
              <TouchableOpacity
                onPress={() => {
                  setOpen(false);
                  navigation?.replace("ChangePassword");
                }}
                className="flex-1 items-center py-1.5"
              >
                <Text className="text-gray-800 font-bold text-[13px] text-center">Change Password</Text>
              </TouchableOpacity>

              <View style={{ width: 1, height: 16, backgroundColor: '#E5E7EB' }} />

              <TouchableOpacity
                onPress={() => {
                  setOpen(false);
                  navigation?.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: "Login" }],
                    })
                  );
                }}
                className="w-20 items-center py-1.5"
              >
                <Text className="text-red-500 font-bold text-[13px] text-center">Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Green title bar */}
      <View className="bg-[#0B5D4E] py-3">
        <Text className="px-2 text-center text-sm font-bold uppercase tracking-wide text-white">
          {headerTitle}
        </Text>
      </View>
    </View>
  );
}