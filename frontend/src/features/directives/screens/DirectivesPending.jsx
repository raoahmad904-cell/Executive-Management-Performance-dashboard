import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useMemo, useState, useEffect } from "react";
import { FlatList, Text, View, ActivityIndicator, Modal, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

  // Custom Popups State
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, title }
  const [successInfo, setSuccessInfo] = useState(null); // { title, message }
  const [errorInfo, setErrorInfo] = useState(null); // { title, message }

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
      setErrorInfo({ title: "Error", message: "Could not connect to the backend server." });
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

  function handleTriggerEndorse(id, title) {
    setConfirmTarget({ id, title });
  }

  async function executeEndorse() {
    if (!confirmTarget) return;
    const { id } = confirmTarget;
    setConfirmTarget(null);

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
        setSuccessInfo({
          title: "Success",
          message: "Directive endorsed successfully!"
        });
      } else {
        setErrorInfo({
          title: "Error",
          message: "Failed to endorse directive."
        });
      }
    } catch (error) {
      console.error("Error endorsing directive:", error);
      setErrorInfo({
        title: "Error",
        message: "Could not connect to the backend server."
      });
    }
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
              onEndorse={() => handleTriggerEndorse(item.id, item.title)}
            />
          )}
          ListEmptyComponent={
            <View className="mt-6 items-center">
              <Text className="text-white/80">No pending directives found.</Text>
            </View>
          }
        />
      )}

      {/* 1. Custom Endorse Confirmation Modal */}
      <Modal
        visible={confirmTarget !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmTarget(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 340,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color="#0D4429" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Endorse Directive
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 22, lineHeight: 20 }}>
                Are you sure you want to endorse <Text style={{ fontWeight: 'bold', color: '#111827' }}>"{confirmTarget?.title}"</Text>?
              </Text>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setConfirmTarget(null)}
                  style={{
                    flex: 1,
                    backgroundColor: '#F3F4F6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E5E7EB'
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#4B5563' }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={executeEndorse}
                  style={{
                    flex: 1,
                    backgroundColor: '#0D4429',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>Endorse</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. Custom Success Modal */}
      <Modal
        visible={successInfo !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessInfo(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 340,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#DCFCE7', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={42} color="#16A34A" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                {successInfo?.title || "Success"}
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 22, lineHeight: 20 }}>
                {successInfo?.message}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSuccessInfo(null)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D4429',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Custom Error Modal */}
      <Modal
        visible={errorInfo !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorInfo(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#DC2626',
            width: '100%',
            maxWidth: 340,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20, alignItems: 'center' }}>
              <View style={{ backgroundColor: '#FEE2E2', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="alert-circle" size={42} color="#DC2626" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                {errorInfo?.title || "Error"}
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 22, lineHeight: 20 }}>
                {errorInfo?.message}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setErrorInfo(null)}
                style={{
                  width: '100%',
                  backgroundColor: '#DC2626',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}