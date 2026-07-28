import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StatCard({ label, value, color, iconName, bgTint, icon, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="flex-1 bg-white rounded-2xl mx-1 px-1.5 py-3.5 items-center border border-gray-100"
      style={{
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-1"
        style={{ backgroundColor: bgTint || "#F3F4F6" }}
      >
        {iconName ? (
          <Ionicons name={iconName} size={22} color={color} />
        ) : (
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        )}
      </View>
      <Text className="text-xl font-extrabold mt-1" style={{ color }}>
        {value}
      </Text>
      <Text className="text-[11px] font-semibold text-gray-500 mt-0.5 text-center" numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}