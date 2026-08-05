import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, getPaginationRange } from "../../../utils/utils.js";

const PAGE_SIZE = 5;

export default function AllUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/auth/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        Alert.alert("Error", "Could not load users.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      Alert.alert("Network Error", "Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleDisabled = async (user) => {
    setBusyId(user._id);
    try {
      const token = await AsyncStorage.getItem("token");
      const action = user.disabled ? "enable" : "disable";
      const res = await fetch(`${API_BASE_URL}api/auth/users/${user._id}/${action}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, disabled: !user.disabled } : u));
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error", errJson.error || "Could not update user.");
      }
    } catch (err) {
      console.error("Error toggling user:", err);
      Alert.alert("Network Error", "Could not connect to the backend server.");
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      <View className="flex-row items-center justify-between px-4 mb-3">
        <Text className="text-[#0c3b2e] font-bold text-xl">
          All Users
        </Text>
        <Text className="text-xs text-gray-400">{users.length} records</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0c3b2e" />
          <Text className="text-gray-400 text-xs mt-2">Loading users...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          {pageUsers.length === 0 ? (
            <Text className="text-center text-gray-400 mt-10">
              No users found.
            </Text>
          ) : (
            pageUsers.map((item, i) => {
              const globalIdx = (page - 1) * PAGE_SIZE + i + 1;
              const isBusy = busyId === item._id;
              return (
                <View
                  key={item._id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    borderLeftWidth: 5,
                    borderLeftColor: item.disabled ? "#DC2626" : "#0c3b2e",
                    padding: 14,
                    marginBottom: 12,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 12,
                  }}
                >
                  {/* Row 1: Name & Status pill */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 pr-2">
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#1F2937" }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: "500", color: "#6B7280", marginTop: 1 }}>
                        ID #{String(globalIdx).padStart(3, "0")}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: item.disabled ? "#FEE2E2" : "#DCFCE7",
                        borderRadius: 999,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 6, height: 6, borderRadius: 3,
                          backgroundColor: item.disabled ? "#DC2626" : "#16A34A",
                          marginRight: 5,
                        }}
                      />
                      <Text style={{ fontSize: 11, fontWeight: "600", color: item.disabled ? "#B91C1C" : "#15803D" }}>
                        {item.disabled ? "Disabled" : "Active"}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Email */}
                  <View className="flex-row items-center mb-1.5">
                    <Ionicons name="mail-outline" size={14} color="#0c3b2e" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12.5, color: "#374151" }} numberOfLines={1}>
                      {item.email}
                    </Text>
                  </View>

                  {/* Row 3: Designation & Role */}
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="person-circle-outline" size={14} color="#0c3b2e" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12.5, color: "#374151" }} numberOfLines={1}>
                      {item.designation || "-"} · {item.role}
                    </Text>
                  </View>

                  {/* Action */}
                  <TouchableOpacity
                    onPress={() => toggleDisabled(item)}
                    disabled={isBusy}
                    className={`px-4 py-2 rounded items-center ${item.disabled ? "bg-emerald-600" : "bg-red-500"}`}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white font-semibold text-sm">
                      {isBusy ? "Updating..." : (item.disabled ? "Enable" : "Disable")}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <View className="flex-row flex-wrap items-center justify-center gap-2 mt-2 mb-2">
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`w-8 h-8 rounded-lg items-center justify-center border ${page === 1 ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}
              >
                <Text className={`text-sm ${page === 1 ? "text-gray-300" : "text-gray-600"}`}>‹</Text>
              </TouchableOpacity>

              {getPaginationRange(page, totalPages).map((p, idx) =>
                p === '...' ? (
                  <View key={`ellipsis-${idx}`} className="w-8 h-8 items-center justify-center">
                    <Text className="text-xs font-bold text-gray-400">…</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg items-center justify-center ${page === p ? "bg-[#0c3b2e]" : "bg-white border border-gray-200"}`}
                  >
                    <Text className={`text-xs font-bold ${page === p ? "text-white" : "text-gray-600"}`}>{p}</Text>
                  </TouchableOpacity>
                )
              )}

              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`w-8 h-8 rounded-lg items-center justify-center border ${page === totalPages ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}
              >
                <Text className={`text-sm ${page === totalPages ? "text-gray-300" : "text-gray-600"}`}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
