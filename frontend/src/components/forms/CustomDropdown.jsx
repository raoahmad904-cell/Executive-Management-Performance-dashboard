import { useState } from "react";
import { Modal, Text, TouchableOpacity, View, ScrollView } from "react-native";

export default function CustomDropdown({
  value,
  onSelect,
  options,
  placeholder,
  multiple = false,
  /** Modal header; defaults to `placeholder`. */
  modalTitle,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const headerTitle = modalTitle ?? placeholder;

  function summaryText() {
    if (multiple) {
      const ids = Array.isArray(value) ? value : [];
      if (ids.length === 0) return null;
      return ids
        .map((id) => options.find((o) => o.value === id)?.label)
        .filter(Boolean)
        .join(", ");
    }
    const selected = options.find((o) => o.value === value);
    return selected ? selected.label : null;
  }

  const summary = summaryText();
  const selectedCount =
    multiple && Array.isArray(value) ? value.length : 0;

  return (
    <View>
      <TouchableOpacity
        className={`flex-row items-center justify-between rounded-xl bg-white px-4 h-12 ${disabled ? 'opacity-60' : ''}`}
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={
          multiple
            ? `${placeholder}. Multi-select. ${selectedCount} selected.`
            : placeholder
        }
      >
        <Text
          className={`flex-1 text-base ${summary ? "text-gray-800" : "text-gray-400"}`}
          numberOfLines={multiple ? 4 : 1}
        >
          {summary ?? placeholder}
        </Text>
        <Text className="ml-2 text-xs text-gray-400">
          {multiple ? " ▼" : "▼"}
        </Text>
      </TouchableOpacity>

      {multiple && summary ? (
        <Text className="mt-1.5 text-xs text-emerald-100/90">
          {selectedCount} user{selectedCount === 1 ? "" : "s"} selected — tap field to change
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View
              className="overflow-hidden rounded-2xl bg-white"
              style={{
                elevation: 10,
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <View className="bg-[#1B5E3B] px-5 pb-4 pt-4">
                <View className="flex-row items-start justify-between">
                  <View className="min-w-0 flex-1 pr-2">
                    <Text className="text-base font-bold text-white">
                      {headerTitle}
                    </Text>
                    {multiple ? (
                      <Text className="mt-2 text-xs leading-4 text-white/90">
                        Tap a name to select or deselect. You can choose more
                        than one. Tap Done when finished.
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setOpen(false)}
                    className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20"
                    accessibilityLabel="Close"
                  >
                    <Text className="text-sm font-bold text-white">✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={{ maxHeight: 350 }} showsVerticalScrollIndicator={true}>
                {options.map((opt, idx) => {
                  const selected = multiple
                    ? Array.isArray(value) && value.includes(opt.value)
                    : opt.value === value;
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      className={[
                        "flex-row items-center justify-between px-5 py-4",
                        idx < options.length - 1 ? "border-b border-gray-100" : "",
                        selected ? "bg-emerald-50" : "bg-white",
                      ].join(" ")}
                      onPress={() => {
                        if (multiple) {
                          const ids = Array.isArray(value) ? [...value] : [];
                          const i = ids.indexOf(opt.value);
                          if (i >= 0) ids.splice(i, 1);
                          else ids.push(opt.value);
                          onSelect(ids);
                          return;
                        }
                        onSelect(opt.value);
                        setOpen(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        className={`flex-1 pr-2 text-base ${selected ? "font-semibold text-[#1B5E3B]" : "text-gray-700"}`}
                      >
                        {opt.label}
                      </Text>
                      {multiple ? (
                        <Text
                          className={`text-sm font-semibold ${selected ? "text-[#1B5E3B]" : "text-gray-400"}`}
                        >
                          {selected ? "Selected" : "Add"}
                        </Text>
                      ) : selected ? (
                        <Text className="text-base font-bold text-[#1B5E3B]">
                          ✓
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {multiple ? (
                <View className="flex-row items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
                  <Text className="text-sm text-gray-700">
                    {selectedCount === 0
                      ? "No users selected yet"
                      : `${selectedCount} user${selectedCount === 1 ? "" : "s"} selected`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setOpen(false)}
                    className="rounded-xl bg-[#1B5E3B] px-5 py-2.5"
                    accessibilityRole="button"
                    accessibilityLabel="Done selecting users"
                  >
                    <Text className="text-sm font-bold text-white">Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}