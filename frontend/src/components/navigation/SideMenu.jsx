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
  const accent = "#0B5D4E";
  const accentSoft = "bg-[#0B5D4E]/12";
  const insets = useSafeAreaInsets();
const statusBarFallback =
  Platform.OS === "android"
    ? StatusBar.currentHeight ?? 0
    : Constants.statusBarHeight ?? 0;
const topInset = Math.max(insets.top, statusBarFallback);
const bottomInset = Math.max(insets.bottom, 0);

  return (
    <View 
    className="flex-1 bg-white"
    style={{ paddingTop: topInset, paddingBottom: bottomInset }}
    >
      {onClose ? (
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <Text className="text-lg font-bold text-gray-900">Menu</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <Ionicons name="close" size={26} color="#374151" />
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        {/* Profile card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPressProfile}
          disabled={!onPressProfile}
          className="mb-6 flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
        >
          <View
            className={`h-14 w-14 items-center justify-center rounded-full ${accentSoft}`}
          >
            <Ionicons name="person" size={28} color={accent} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold" style={{ color: accent }}>
              {userName}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={2}>
              {userSubtitle}
            </Text>
          </View>
          {onPressProfile ? (
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          ) : null}
        </TouchableOpacity>

        <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
          Navigation
        </Text>

        <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          {items.map((item, index) => {
            const hasChildren =
              Array.isArray(item.children) && item.children.length > 0;
            const expanded = !!expandedParentIds[item.id];
            const isLastRoot = index === items.length - 1;

            if (!hasChildren) {
              const active = activeItemId === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectItem(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className={`flex-row items-center px-4 py-4 ${
                    !isLastRoot ? "border-b border-gray-100" : ""
                  } ${active ? "bg-emerald-50" : ""}`}
                  style={
                    active
                      ? { borderLeftWidth: 4, borderLeftColor: accent }
                      : undefined
                  }
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${accentSoft}`}
                  >
                    <Ionicons name={item.icon} size={20} color={accent} />
                  </View>
                  <Text
                    className={`ml-3 flex-1 text-base ${
                      active ? "font-bold" : "font-medium"
                    } text-gray-800`}
                  >
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              );
            }

            return (
              <View
                key={item.id}
                className={!isLastRoot ? "border-b border-gray-100" : ""}
              >
                <TouchableOpacity
                  onPress={() => onToggleParent?.(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  className="flex-row items-center px-4 py-4"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-xl ${accentSoft}`}
                  >
                    <Ionicons name={item.icon} size={20} color={accent} />
                  </View>
                  <Text className="ml-3 flex-1 text-base font-medium text-gray-800">
                    {item.label}
                  </Text>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {expanded ? (
                  <View className="bg-gray-50/80 px-3 pb-3 pt-0">
                    {item.children.map((child) => {
                      const active = activeItemId === child.id;
                      return (
                        <TouchableOpacity
                          key={child.id}
                          onPress={() => onSelectItem(child.id)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          className={`mt-2 rounded-xl px-4 py-3.5 ${
                            active ? "bg-[#0B5D4E]" : "bg-[#0B5D4E]/85"
                          }`}
                        >
                          <Text className="text-center text-sm font-semibold text-white">
                            {child.label}
                            {child.badge != null ? ` (${child.badge})` : ""}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer — same idea as reference img 2 */}
      <View className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        {onChangePassword ? (
          <TouchableOpacity
            onPress={onChangePassword}
            className="flex-row items-center py-3"
            accessibilityRole="button"
          >
            <Ionicons name="key-outline" size={22} color={accent} />
            <Text
              className="ml-3 text-base font-medium"
              style={{ color: accent }}
            >
              Change password
            </Text>
          </TouchableOpacity>
        ) : null}

        {onLogout ? (
          <TouchableOpacity
            onPress={onLogout}
            className="flex-row items-center py-3"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
            <Text className="ml-3 text-base font-semibold text-red-600">
              Logout
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}