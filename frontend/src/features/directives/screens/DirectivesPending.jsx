import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useMemo, useState, useEffect } from "react";
import { Alert, FlatList, Text, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DirectiveCard from "../components/DirectiveCard";

export default function DirectivesPending() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({ title: "Pending Directives" });
  }, [navigation]);

  const [officer, setOfficer] = useState("all");
  const [directives, setDirectives] = useState([]);
  const [userOptions, setUserOptions] = useState([{ label: "All", value: "all" }]);
  const [loading, setLoading] = useState(false);

  const fetchPendingData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");

      // 1. Fetch pending directives
      const res = await fetch(`${API_BASE_URL}api/directives/pending`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDirectives(data);
      }

      // 2. Fetch users for dropdown filtering
      const usersRes = await fetch(`${API_BASE_URL}api/auth/users`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const mapped = usersData.map(u => ({ label: `${u.name} (${u.designation})`, value: u._id }));
        setUserOptions([{ label: "All", value: "all" }, ...mapped]);
      }
    } catch (error) {
      console.error("Error loading pending directives:", error);
      Alert.alert("Error", "Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const formattedDirectives = useMemo(() => {
    return directives.map(d => {
      // Calculate pending days
      const createdDate = new Date(d.createdAt);
      const today = new Date();
      const diffTime = Math.max(0, today - createdDate);
      const pendingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Calculate remaining days
      const endDate = new Date(d.endDate);
      const diffRemaining = endDate - today;
      const remainingDays = Math.ceil(diffRemaining / (1000 * 60 * 60 * 24));
      const remaining = remainingDays > 0 ? `${remainingDays} days left` : "Overdue";

      return {
        id: d._id,
        title: d.subject,
        priority: d.priority ? d.priority.charAt(0).toUpperCase() + d.priority.slice(1) : "Medium",
        type: d.directiveType === "minister" ? "Minister Directive" : d.directiveType === "meeting" ? "Meeting Directive" : "Minister Directive",
        assignee: d.user ? `${d.user.name} (${d.user.designation})` : "Unassigned",
        assigneeUserId: d.user?._id,
        owner: "Management",
        createdAt: new Date(d.createdAt).toLocaleDateString(),
        pendingDays,
        remaining,
        messages: d.messages || []
      };
    });
  }, [directives]);

  const filtered = useMemo(() => {
    if (officer === "all") return formattedDirectives;
    return formattedDirectives.filter((d) => d.assigneeUserId === officer);
  }, [officer, formattedDirectives]);

  async function handleEndorse(id, title) {
    Alert.alert(
      "Endorse Directive",
      `Are you sure you want to endorse "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(`${API_BASE_URL}api/directives/${id}/endorse`, {
                method: "PATCH",
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });
              if (res.ok) {
                setDirectives(prev => prev.filter(d => d._id !== id));
                Alert.alert("Success", "Directive endorsed successfully!");
              } else {
                Alert.alert("Error", "Failed to endorse directive.");
              }
            } catch (error) {
              console.error("Error endorsing directive:", error);
              Alert.alert("Error", "Could not connect to the backend server.");
            }
          }
        }
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0D4429', padding: 12, borderRadius: 16, margin: 8 }}>
      <CustomDropdownLabel label="Select User" required>
        <CustomDropdown
          value={officer}
          onSelect={setOfficer}
          options={userOptions}
          placeholder="Select User"
        />
      </CustomDropdownLabel>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 12, marginTop: 8 }}>Loading pending directives...</Text>
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
              mode="pending"
              onView={() => {
                navigation.navigate("DirectiveView", {
                  directive: item,
                  messages: item.messages ?? [],
                });
              }}
              onEndorse={() => handleEndorse(item.id, item.title)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-6 items-center">
              <Text className="text-white/80">No pending directives found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}