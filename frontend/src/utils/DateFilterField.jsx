import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fmtDate } from "../utils/utils";
import CalendarPickerModal from "./CalendarPickerModal";

export default function DateFilterField({
  label,
  value,
  onSelect,
  labelClassName = "mb-1 text-sm font-semibold text-white/95",
  triggerClassName = "rounded-xl border-0 bg-white px-3 py-3.5",
  containerClassName = "w-full",
  iconColor = "#0D4429"
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className={containerClassName}>
      {label ? <Text className={labelClassName}>{label}</Text> : null}
      <TouchableOpacity
        className={`flex-row items-center justify-between ${triggerClassName}`}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text className={`text-sm flex-1 ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {fmtDate(value)}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={iconColor} />
      </TouchableOpacity>
      <CalendarPickerModal
        visible={open}
        value={value}
        onSelect={d => { onSelect(d); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}