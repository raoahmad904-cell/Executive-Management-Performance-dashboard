import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { Platform, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SideMenu({
  items,
  activeItemId,
  onSelectItem,
  expandedParentIds = {},
  onToggleParent,
  onClose,
  userName = "User",
  userSubtitle = "Performance Dashboard",
  onPressProfile,
  onChangePassword,
  onLogout,
}) {
  const insets = useSafeAreaInsets();
  const statusBarFallback =
    Platform.OS === "android"
      ? StatusBar.currentHeight ?? 0
      : Constants.statusBarHeight ?? 0;
  const topInset = Math.max(insets.top, statusBarFallback);
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View className="flex-1 bg-white">
      {/* ── 1. Dark Green Header ─────────────────────────────────────────── */}
      <View
        className="bg-[#0F5D4A] px-5 pb-6 rounded-tr-[28px]"
        style={{ paddingTop: topInset + 12 }}
      >
        {/* Top bar with Close button */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">
            Menu
          </Text>
          {onClose ? (
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-8 h-8 rounded-full bg-white/15 items-center justify-center"
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* User Profile Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPressProfile}
          disabled={!onPressProfile}
          className="flex-row items-center"
        >
          {/* Avatar + Online Indicator */}
          <View className="relative mr-3.5">
            <View className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 items-center justify-center">
              <Ionicons name="person" size={26} color="#FFFFFF" />
            </View>
            <View className="w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0F5D4A] absolute bottom-0 right-0" />
          </View>

          {/* Name & Role */}
          <View className="flex-1">
            <Text className="text-[18px] font-bold text-white leading-[22px]" numberOfLines={2}>
              {userName}
            </Text>
            <Text className="text-[12px] font-semibold text-white/90 mt-0.5 leading-[16px]">
              {userSubtitle}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 2. Navigation Section ─────────────────────────────────────────── */}
      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Section Label */}
        <Text className="text-[12px] font-medium text-gray-400 tracking-[1px] mb-3">
          Navigation
        </Text>

        {/* Menu Items Container */}
        <View className="gap-2.5">
          {items.map((item) => {
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const expanded = !!expandedParentIds[item.id];
            const active = activeItemId === item.id;

            if (!hasChildren) {
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectItem(item.id)}
                  activeOpacity={0.8}
                  className={`h-14 flex-row items-center rounded-2xl px-4 relative overflow-hidden ${active ? "bg-[#EAF8F2]" : "bg-white border border-gray-100"
                    }`}
                  style={
                    active
                      ? {
                        elevation: 2,
                        shadowColor: "#0F5D4A",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                      }
                      : null
                  }
                >
                  {/* Dark green vertical active indicator */}
                  {active && (
                    <View className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-md bg-[#0F5D4A]" />
                  )}

                  {/* Icon */}
                  <View className="w-8 items-center justify-center mr-3">
                    <Ionicons
                      name={item.icon || "ellipse-outline"}
                      size={24}
                      color={active ? "#0F5D4A" : "#4B5563"}
                    />
                  </View>

                  {/* Title */}
                  <Text
                    className={`flex-1 text-[16px] ${active ? "font-bold text-[#0F5D4A]" : "font-semibold text-gray-700"
                      }`}
                  >
                    {item.label}
                  </Text>

                  {/* Chevron */}
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={active ? "#0F5D4A" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              );
            }

            // Parent item with children
            return (
              <View key={item.id} className="rounded-2xl overflow-hidden bg-white border border-gray-100">
                <TouchableOpacity
                  onPress={() => onToggleParent?.(item.id)}
                  activeOpacity={0.8}
                  className="h-14 flex-row items-center px-4"
                >
                  <View className="w-8 items-center justify-center mr-3">
                    <Ionicons name={item.icon || "ellipse-outline"} size={24} color="#4B5563" />
                  </View>
                  <Text className="flex-1 text-[16px] font-semibold text-gray-700">
                    {item.label}
                  </Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {expanded && (
                  <View className="bg-[#EAF8F2]/40 px-3 pb-3 pt-1 gap-2">
                    {item.children.map((child) => {
                      const childActive = activeItemId === child.id;
                      return (
                        <TouchableOpacity
                          key={child.id}
                          onPress={() => onSelectItem(child.id)}
                          activeOpacity={0.8}
                          className={`h-11 rounded-xl px-4 flex-row items-center justify-between ${childActive ? "bg-[#0F5D4A]" : "bg-white border border-gray-200/60"
                            }`}
                        >
                          <Text
                            className={`text-[14px] font-semibold ${childActive ? "text-white" : "text-[#0F5D4A]"
                              }`}
                          >
                            {child.label}
                          </Text>
                          {child.badge != null ? (
                            <View
                              className={`px-2 py-0.5 rounded-full ${childActive ? "bg-white/20" : "bg-[#EAF8F2]"
                                }`}
                            >
                              <Text
                                className={`text-xs font-bold ${childActive ? "text-white" : "text-[#0F5D4A]"
                                  }`}
                              >
                                {child.badge}
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ── 3. Bottom Pinned Section ─────────────────────────────────────────── */}
      <View
        className="px-5 py-4 border-t border-gray-100 bg-white"
        style={{ paddingBottom: bottomInset + 8 }}
      >
        <View className="rounded-2xl bg-gray-50/80 p-1.5 gap-1 border border-gray-100">
          {onChangePassword && (
            <TouchableOpacity
              onPress={onChangePassword}
              activeOpacity={0.8}
              className="h-12 flex-row items-center px-3.5 rounded-xl active:bg-emerald-50"
            >
              <View className="w-8 items-center justify-center mr-3">
                <Ionicons name="key-outline" size={22} color="#0F5D4A" />
              </View>
              <Text className="text-[15px] font-semibold text-[#0F5D4A]">
                Change password
              </Text>
            </TouchableOpacity>
          )}

          {onLogout && (
            <TouchableOpacity
              onPress={onLogout}
              activeOpacity={0.8}
              className="h-12 flex-row items-center px-3.5 rounded-xl active:bg-red-50"
            >
              <View className="w-8 items-center justify-center mr-3">
                <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              </View>
              <Text className="text-[15px] font-semibold text-red-600">
                Logout
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}