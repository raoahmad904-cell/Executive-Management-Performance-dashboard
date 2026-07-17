import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";

/** Format YYYY-MM-DD from calendar to dd/mm/yyyy for display */
function formatDisplay(iso) {
  if (!iso || typeof iso !== "string") return null;
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Same visual language as `Dropdown` + form TextInputs.
 * On dark green forms, pass e.g. labelClassName + triggerClassName like `Dropdown`.
 */
export default function DateInput({
  label,
  value,
  onChange,
  error,
  placeholder = "dd/mm/yyyy",
  labelClassName = "mb-1 text-sm font-semibold text-gray-700",
  triggerClassName = "rounded-xl border border-gray-300 bg-white px-3 py-3.5",
}) {
  const [open, setOpen] = useState(false);

  const displayText = useMemo(() => {
    if (!value) return null;
    return formatDisplay(value) ?? value;
  }, [value]);

  const markedDates = useMemo(() => {
    if (!value) return {};
    return {
      [value]: {
        selected: true,
        selectedColor: "#0B5D4E",
      },
    };
  }, [value]);

  return (
    <View className="mb-3 w-full">
      {label ? <Text className={labelClassName}>{label}</Text> : null}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        className={`flex-row items-center justify-between ${triggerClassName} ${
          error ? "border-red-500" : ""
        }`}
      >
        <Text
          className={`min-h-[22px] flex-1 text-base ${
            displayText ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {displayText ?? placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={22} color="#6b7280" />
      </TouchableOpacity>

      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/50 px-4"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[85%] overflow-hidden rounded-2xl bg-white"
            onPress={() => {}}
          >
            <Calendar
              onDayPress={(day) => {
                onChange(day.dateString);
                setOpen(false);
              }}
              markedDates={markedDates}
              theme={{
                todayTextColor: "#0B5D4E",
                selectedDayBackgroundColor: "#0B5D4E",
                selectedDayTextColor: "#ffffff",
                arrowColor: "#0B5D4E",
                monthTextColor: "#111827",
                textMonthFontWeight: "700",
                textDayFontSize: 16,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 13,
              }}
            />
            <TouchableOpacity
              onPress={() => setOpen(false)}
              className="items-center border-t border-gray-200 py-4"
            >
              <Text className="text-base font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}