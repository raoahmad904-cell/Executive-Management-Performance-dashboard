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
      <View className="z-10 flex-row items-center bg-white px-3 py-2.5">
        {onMenuPress ? (
          <TouchableOpacity
            onPress={onMenuPress}
            className="mr-2 p-1"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={28} color="#0D4429" />
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
              className="max-w-[140px] text-[#0A92E2] font-semibold text-sm"
              numberOfLines={1}
            >
              {roleLabel}
            </Text>
          </TouchableOpacity>

          {/* Vertical Profile Dropdown Menu */}
          {open && (
            <View
              className="absolute right-0 top-11 z-50 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
              style={{
                width: 175,
                elevation: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              {/* Change Password option */}
              <TouchableOpacity
                onPress={() => {
                  setOpen(false);
                  navigation?.replace("ChangePassword");
                }}
                activeOpacity={0.7}
                className="flex-row items-center rounded-lg px-3 py-2.5 active:bg-emerald-50"
              >
                <Ionicons name="key-outline" size={16} color="#0D4429" style={{ marginRight: 8 }} />
                <Text className="text-[#0D4429] font-bold text-[13px]" numberOfLines={1}>
                  Change Password
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="my-1 h-[1px] bg-gray-100" />

              {/* Logout option */}
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
                activeOpacity={0.7}
                className="flex-row items-center rounded-lg px-3 py-2.5 active:bg-red-50"
              >
                <Ionicons name="log-out-outline" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                <Text className="text-red-500 font-bold text-[13px]" numberOfLines={1}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Green title bar (Single line on all devices) */}
      <View className="bg-[#0D4429] px-3 py-2.5 items-center justify-center">
        <Text
          className="text-center font-bold uppercase tracking-wide text-white"
          style={{ fontSize: 13, lineHeight: 18 }}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.75}
        >
          {headerTitle}
        </Text>
      </View>
    </View>
  );
}