import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useLayoutEffect, useState, useCallback } from "react";
import { Alert, FlatList, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import DirectiveCard from "../components/DirectiveCard";

export default function UserDirectives() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("existing"); // "existing" or "closed"
  const [directives, setDirectives] = useState([]);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: "My Directives" });
  }, [navigation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      // userType=member scopes this server-side to the logged-in user's own directives
      const res = await fetch(`${API_BASE_URL}api/directive/threads?userType=member`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDirectives(data.filter(d => activeTab === "existing" ? d.status !== "closed" : d.status === "closed"));
      }
    } catch (error) {
      console.error("Error loading user directives:", error);
      Alert.alert("Error", "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab])
  );

  const formattedDirectives = React.useMemo(() => {
    return directives.map(d => {
      const createdDate = new Date(d.createdAt);
      const today = new Date();
      const diffTime = Math.max(0, today - createdDate);
      const pendingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const endDate = new Date(d.duration?.end);
      const diffRemaining = endDate - today;
      const remainingDays = Math.ceil(diffRemaining / (1000 * 60 * 60 * 24));
      const remaining = remainingDays > 0 ? `${remainingDays} days left` : "Overdue";

      const member = (d.members || [])[0];
      return {
        id: d._id,
        title: d.subject,
        priority: d.priority ? d.priority.charAt(0).toUpperCase() + d.priority.slice(1) : "Medium",
        type: d.type || "Minister Directive",
        assignee: member ? `${member.name} (${member.designation})` : "Unassigned",
        assigneeUserId: member?._id,
        owner: "Management",
        createdAt: new Date(d.createdAt).toLocaleDateString(),
        closedAt: d.closedAt ? new Date(d.closedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        pendingDays,
        remaining,
        messages: d.messages || []
      };
    });
  }, [directives]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0D4429', padding: 12, borderRadius: 16, margin: 8 }}>
      {/* Tabs */}
      <View className="mb-4 flex-row gap-2">
        <TouchableOpacity
          onPress={() => setActiveTab("existing")}
          className={`flex-1 items-center justify-center rounded-xl py-3 border ${
            activeTab === "existing"
              ? "bg-[#0A6FD3] border-[#0A6FD3]"
              : "bg-transparent border-white/20"
          }`}
        >
          <Text className="text-sm font-bold text-white">Existing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("closed")}
          className={`flex-1 items-center justify-center rounded-xl py-3 border ${
            activeTab === "closed"
              ? "bg-[#0A6FD3] border-[#0A6FD3]"
              : "bg-transparent border-white/20"
          }`}
        >
          <Text className="text-sm font-bold text-white">Closed</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justify: 'center', marginTop: 32 }}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={{ color: '#ffffff', fontSize: 12, marginTop: 8 }}>Loading directives...</Text>
        </View>
      ) : (
        <FlatList
          data={formattedDirectives}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <DirectiveCard
              item={item}
              mode={activeTab === "existing" ? "pending" : "closed"}
              onView={() => {
                navigation.navigate("DirectiveView", {
                  directive: item,
                  messages: item.messages ?? [],
                });
              }}
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
              <Text className="text-white/80">No directives found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}