import React from "react";
import { Text, View } from "react-native";

const STATUS_CONFIG = {
  Overdue:    { bg: "bg-red-50",    border: "border-red-200",   dot: "#e53935", text: "text-red-600"   },
  Completed:  { bg: "bg-green-50",  border: "border-green-200", dot: "#43a047", text: "text-green-700" },
  "In Process":{ bg: "bg-blue-50", border: "border-blue-200",  dot: "#1e88e5", text: "text-blue-700"  },
};

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  // If ISO string: "2026-07-20T19:00:00.000Z"
  let cleanDate = dateStr;
  if (dateStr.includes('T')) {
    cleanDate = dateStr.split('T')[0]; // "2026-07-20"
  }
  // If YYYY-MM-DD format: "2026-07-20" -> convert to "20-07-2026"
  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-');
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return cleanDate;
}

export default function DirectiveCard({ item, index }) {
  const sc = STATUS_CONFIG[item.status] ?? {
    bg: "bg-gray-50", border: "border-gray-200", dot: "#9ca3af", text: "text-gray-600",
  };

  return (
    <View className={`rounded-2xl border mb-3 p-4 ${sc.bg} ${sc.border}`}>
      {/* Top row — Sr No + Subject + Status badge */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          {/* Index bubble */}
          <View className="w-6 h-6 rounded-full bg-white border border-gray-200 items-center justify-center mr-2">
            <Text className="text-xs font-bold text-gray-500">{index}</Text>
          </View>
          <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={2}>
            {item.subject}
          </Text>
        </View>

        {/* Status badge */}
        <View className="flex-row items-center bg-white border rounded-full px-2 py-1 gap-1" style={{ borderColor: sc.dot + "55" }}>
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }} />
          <Text className={`text-xs font-semibold ${sc.text}`}>{item.status}</Text>
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-black/5 mb-2" />

      {/* Bottom row — dates + user */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row gap-3">
          <View>
            <Text className="text-xs text-gray-400 mb-0.5">Start</Text>
            <Text className="text-xs font-medium text-gray-600">{formatDate(item.startDate)}</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View>
            <Text className="text-xs text-gray-400 mb-0.5">End</Text>
            <Text className="text-xs font-medium text-gray-600">{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {/* User pill */}
        <View className="bg-white/80 border border-gray-200 rounded-full px-3 py-1 max-w-[120px]">
          <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
            👤 {item.users}
          </Text>
        </View>
      </View>
    </View>
  );
}