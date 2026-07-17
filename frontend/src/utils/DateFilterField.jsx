import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { fmtDate } from "../utils/utils";
import CalendarPickerModal from "./CalendarPickerModal";

export default function DateFilterField({ label, value, onSelect,
    labelClassName = "mb-1 text-sm font-semibold text-white/95",
    triggerClassName = "rounded-xl border-0 bg-white px-3 py-3.5",
    containerClassName = "flex-1"
 }) {
    const [open, setOpen] = useState(false);
    return (
      <View className={containerClassName}>
        <Text className={labelClassName}>{label}</Text>
        <TouchableOpacity
        className={`flex-row items-center justify-between ${triggerClassName}`}
        onPress={() => setOpen(true)}
          activeOpacity={0.75}
        >
          <Text className={`text-sm flex-1 ${value ? 'text-gray-800' : 'text-gray-400'}`}>
            {fmtDate(value)}
          </Text>
          <Text className="text-base">📅</Text>
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