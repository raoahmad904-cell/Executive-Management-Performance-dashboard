import { Text, View } from "react-native";

export default function CustomDropdownLabel({ label, children, required }) {
    return (
      <View className="mb-2">
        <View className="flex-row items-center mb-1.5">
          <Text className="text-white text-sm font-semibold" numberOfLines={1}>{label}</Text>
          {required && <Text className="text-amber-300 ml-1 text-sm">*</Text>}
        </View>
        {children}
      </View>
    );
  }