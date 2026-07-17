import React, { useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    Text,
    View,
} from "react-native";

export default function Dropdown({
  label,
  value,
  options,
  placeholder = "Select...",
  error,
  onChange,
  labelClassName = "mb-2 font-semibold text-gray-700",
  triggerClassName = "rounded-xl border border-gray-300 bg-white px-3 py-3",
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <View className="mb-3 w-full">
      {label ? <Text className={labelClassName}>{label}</Text> : null}

      <Pressable
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between ${triggerClassName} ${
          error ? "border-red-500" : ""
        }`}
      >
        <Text
          className={`flex-1 text-base ${
            value ? "text-gray-900" : "text-gray-400"
          }`}
          numberOfLines={2}
        >
          {selectedLabel ?? placeholder}
        </Text>
        <Text className="ml-2 text-base text-gray-500">▾</Text>
      </Pressable>

      {!!error && (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      )}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/40 px-6"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[70%] overflow-hidden rounded-2xl bg-white"
            onPress={() => {}}
          >
            <View className="border-b border-gray-200 px-4 py-4">
              <Text className="text-lg font-bold text-gray-900">
                {label || "Select"}
              </Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`border-b border-gray-100 px-4 py-4 ${
                      isSelected ? "bg-emerald-50" : "bg-white"
                    }`}
                  >
                    <Text
                      className={`text-base ${
                        isSelected
                          ? "font-semibold text-emerald-800"
                          : "text-gray-800"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}