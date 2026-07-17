import React from "react";
import { Text, View } from "react-native";

export default function StatCard({ label, value, color, icon }) {
  return (
    <View className="flex-1 bg-white rounded-2xl mx-1 px-3 py-4 items-center shadow-sm border border-gray-100">
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text className="text-2xl font-bold mt-1" style={{ color }}>
        {value}
      </Text>
      <Text className="text-xs text-gray-500 mt-1 text-center">{label}</Text>
    </View>
  );
}