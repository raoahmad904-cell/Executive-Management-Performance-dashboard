import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useMemo, useState, useEffect } from "react";
import { FlatList, Text, View, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DirectiveCard from "../components/DirectiveCard";

export default function DirectivesClosed({ showUserFilter = true }) {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: "Closed Directives" });
  }, [navigation]);

  const [officer, setOfficer] = useState("all");
  const [directives, setDirectives] = useState([]);
  const [userOptions, setUserOptions] = useState([{ label: "All", value: "all" }]);
  const [loading, setLoading] = useState(false);

  const fetchClosedData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      // 1. Fetch all directive threads and keep only the closed ones
      const res = await fetch(`${API_BASE_URL}api/directive/threads`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDirectives(data.filter(d => d.status === "closed"));
      }

      // 2. Fetch users for dropdown filtering
      if (showUserFilter) {
        const usersRes = await fetch(`${API_BASE_URL}api/auth/users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          const mapped = usersData.map(u => ({ label: `${u.name} (${u.designation})`, value: u._id }));
          setUserOptions([{ label: "All", value: "all" }, ...mapped]);
        }
      }
    } catch (error) {
      console.error("Error loading closed directives:", error);
      Alert.alert("Error", "Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosedData();
  }, []);

  const formattedDirectives = useMemo(() => {
    return directives.map(d => {
      const member = (d.members || [])[0];
      return {
        id: d._id,
        title: d.subject,
        priority: d.priority ? d.priority.charAt(0).toUpperCase() + d.priority.slice(1) : "Medium",
        type: d.type || "Minister Directive",
        assignee: member ? `${member.name} (${member.designation})` : "Unassigned",
        assigneeUserId: member?._id,
        closedAt: d.closedAt ? new Date(d.closedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        messages: d.messages || []
      };
    });
  }, [directives]);

  const filtered = useMemo(() => {
    if (!showUserFilter || officer === "all") return formattedDirectives;
    return formattedDirectives.filter((d) => d.assigneeUserId === officer);
  }, [officer, formattedDirectives, showUserFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D4429', padding: 12, borderRadius: 16, margin: 8 }}>
      {showUserFilter && (
        <CustomDropdownLabel label="Select User" required>
          <CustomDropdown
            value={officer}
            onSelect={setOfficer}
            options={userOptions}
            placeholder="Select User"
          />
        </CustomDropdownLabel>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justify: 'center', marginTop: 32 }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 12, marginTop: 8 }}>Loading closed directives...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <DirectiveCard
              item={item}
              mode="closed"
              onHistory={() => {
                navigation.navigate("DirectiveHistory", {
                  directive: item,
                  messages: item.messages ?? [],
                });
              }}
            />
          )}
          ListEmptyComponent={
            <View className="mt-6 items-center">
              <Text className="text-white/80">No closed directives found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}