import React from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

const MOCK_USERS = [
  { id: "1", name: "Admin", email: "admin@admin.com", role: "Admin" },
];

export default function AllUsersScreen({ navigation }) {
  return (
    <View className="flex-1 bg-gray-50">
      
      {/* Header (SAME AS REGISTER SCREEN) */}
      <View className="bg-[#0c3b2e] mt-10 py-4 items-center">
        <Text className="text-white font-bold text-2xl">
          Admin Panel
        </Text>
      </View>

      {/* Buttons (SAME AS REGISTER SCREEN) */}
      <View className="flex-row px-4 py-3 gap-3">
        
        <TouchableOpacity
          className="bg-[#1a5c46] px-4 py-2 rounded"
          onPress={() => navigation.replace("Register")}
        >
          <Text className="text-yellow-400 font-semibold text-sm">
            + Add User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#0c3b2e] px-4 py-2 rounded"
        >
          <Text className="text-yellow-400 font-semibold text-sm">
            View All Users
          </Text>
        </TouchableOpacity>

      </View>

      {/* Title */}
      <Text className="text-[#0c3b2e] font-bold text-xl text-center mb-4">
        All Users
      </Text>

      {/* List */}
      <FlatList
        data={MOCK_USERS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between bg-white border-b border-gray-200 py-3 px-4 rounded mb-2">
            <Text className="text-gray-700 text-sm flex-1 mr-4">
              {item.name} ({item.email}) - {item.role}
            </Text>

            <TouchableOpacity className="bg-red-500 px-4 py-1 rounded">
              <Text className="text-white font-semibold text-sm">
                Disable
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-10">
            No users found.
          </Text>
        }
      />
    </View>
  );
}