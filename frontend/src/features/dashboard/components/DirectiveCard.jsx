import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const STATUS_CONFIG = {
  Overdue: {
    bg: "#FEE2E2",
    text: "#B91C1C",
    dot: "#DC2626",
    label: "Overdue",
  },
  Completed: {
    bg: "#DCFCE7",
    text: "#15803D",
    dot: "#16A34A",
    label: "Completed",
  },
  "In Process": {
    bg: "#EEF4FF",
    text: "#2563EB",
    dot: "#2563EB",
    label: "In Process",
  },
};

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatDateFormatted(dateStr) {
  if (!dateStr) return "N/A";
  let cleanDate = dateStr;
  if (dateStr.includes("T")) {
    cleanDate = dateStr.split("T")[0];
  }
  if (cleanDate.includes("-")) {
    const parts = cleanDate.split("-");
    let day, month, year;
    if (parts[0].length === 4) {
      year = parts[0];
      month = parseInt(parts[1], 10) - 1;
      day = parts[2];
    } else {
      day = parts[0];
      month = parseInt(parts[1], 10) - 1;
      year = parts[2];
    }
    const mName = MONTH_NAMES_SHORT[month] ?? parts[1];
    const padDay = String(day).padStart(2, "0");
    return `${padDay} ${mName} ${year}`;
  }
  return cleanDate;
}

export default function DirectiveCard({ item, index }) {
  const sc = STATUS_CONFIG[item.status] ?? {
    bg: "#F3F4F6",
    text: "#4B5563",
    dot: "#9CA3AF",
    label: item.status || "N/A",
  };

  const formattedId = `ID #${String(index).padStart(3, "0")}`;

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderLeftWidth: 5,
        borderLeftColor: "#0F6A52",
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      }}
    >
      {/* Header Row: Title & ID on Left, Status Pill on Top Right */}
      <View className="flex-row items-start justify-between mb-2.5">
        <View className="flex-1 pr-2">
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1F2937", lineHeight: 22 }}>
            {item.subject}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "500", color: "#6B7280", marginTop: 2 }}>
            {formattedId}
          </Text>
        </View>

        {/* Status Pill */}
        <View
          style={{
            backgroundColor: sc.bg,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: sc.dot,
              marginRight: 5,
            }}
          />
          <Text style={{ fontSize: 11, fontWeight: "600", color: sc.text }}>
            {sc.label}
          </Text>
        </View>
      </View>

      {/* Date Container - Compact */}
      <View
        style={{
          backgroundColor: "#F8FAFC",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons name="calendar-outline" size={16} color="#0F6A52" style={{ marginRight: 6 }} />
          <View>
            <Text style={{ fontSize: 10, color: "#6B7280", fontWeight: "500" }}>Start Date</Text>
            <Text style={{ fontSize: 12.5, color: "#1F2937", fontWeight: "600", marginTop: 1 }}>
              {formatDateFormatted(item.startDate)}
            </Text>
          </View>
        </View>

        <View style={{ width: 1, height: 22, backgroundColor: "#E5E7EB", marginHorizontal: 8 }} />

        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Ionicons name="flag-outline" size={16} color="#0F6A52" style={{ marginRight: 6 }} />
          <View>
            <Text style={{ fontSize: 10, color: "#6B7280", fontWeight: "500" }}>End Date</Text>
            <Text style={{ fontSize: 12.5, color: "#1F2937", fontWeight: "600", marginTop: 1 }}>
              {formatDateFormatted(item.endDate)}
            </Text>
          </View>
        </View>
      </View>

      {/* Assigned User Section - Single-line Layout */}
      {item.users ? (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
          <Ionicons name="person-circle-outline" size={16} color="#0F6A52" style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 12.5, color: "#6B7280", fontWeight: "500" }}>
            Assigned To: <Text style={{ color: "#1F2937", fontWeight: "600" }}>{item.users}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}