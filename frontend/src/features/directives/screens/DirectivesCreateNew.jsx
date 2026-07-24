import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import React, { useLayoutEffect, useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DateFilterField from "../../../utils/DateFilterField";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
];

const DIRECTIVE_TYPE_OPTIONS = [
  { label: "Minister Directive", value: "minister" },
  { label: "Meeting Directive", value: "meeting" },
];

function FieldLabel({ children, required }) {
  return (
    <Text className="mb-1.5 text-sm font-semibold text-white/95">
      {children}
      {required ? <Text className="text-amber-300"> *</Text> : null}
    </Text>
  );
}

export default function DirectivesCreateNew({ navigation, onSubmitted }) {
  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: "Directives" });
  }, [nav]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userOptions, setUserOptions] = useState([]);

  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [directiveType, setDirectiveType] = useState("minister");
  const [ministerRef, setMinisterRef] = useState("");
  const [directiveDate, setDirectiveDate] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState([]);

  const labelCls = "mb-1.5 text-sm font-semibold text-white/95";
  const triggerCls = "rounded-xl border-0 bg-white px-3.5 h-12 flex-row items-center justify-between";

  // Fetch actual users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/auth/users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserOptions(data.map(u => ({ label: `${u.name} (${u.designation})`, value: u._id })));
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  async function handlePickFiles() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (res.canceled) return;
      const next = res.assets ?? (res.uri ? [res] : []);
      setAttachments((prev) => [
        ...prev,
        ...next.map((a) => ({
          name: a.name ?? "file",
          uri: a.uri,
        })),
      ]);
    } catch (e) {
      Alert.alert("Attachments", "Could not open file picker.");
    }
  }

  async function handleSubmit() {
    if (selectedUserIds.length === 0) {
      Alert.alert("Validation", "Select at least one user.");
      return;
    }
    if (!subject.trim()) {
      Alert.alert("Validation", "Subject is required.");
      return;
    }
    if (!details.trim()) {
      Alert.alert("Validation", "Directive Details is required.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/directives/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: subject.trim(),
          startDate: startDate || new Date().toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
          userIds: selectedUserIds,
          priority,
          directiveType,
          ministerRef,
          directiveDate,
          durationDays,
          details: details.trim()
        })
      });

      if (res.ok) {
        Alert.alert("Directive", "Submitted Successfully.", [
          {
            text: "OK",
            onPress: () => {
              if (onSubmitted) {
                onSubmitted();
                return;
              }
              navigation?.replace?.("Dashboard");
            },
          },
        ]);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error", errJson.error || "Failed to submit directive.");
      }
    } catch (error) {
      console.error("Error creating directive:", error);
      Alert.alert("Network Error", "Could not connect to the backend server.");
    }
  }

  return (
    <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl bg-[#0D4429] p-4">
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 28 }}
      >
        {/* User(s) */}
        <View className="mb-4">
          <CustomDropdownLabel label="User(s)" required>
            <CustomDropdown
              multiple
              value={selectedUserIds}
              onSelect={setSelectedUserIds}
              options={userOptions}
              modalTitle="Select User(s)"
              placeholder="Select User(s)"
            />
          </CustomDropdownLabel>
          <Text className="mt-1.5 text-xs leading-4 text-yellow-500">
            At least one user is required. You can select multiple users.
          </Text>
        </View>

        {/* Subject */}
        <View className="mb-4">
          <FieldLabel>Subject</FieldLabel>
          <TextInput
            placeholder="Enter Subject"
            placeholderTextColor="#9ca3af"
            value={subject}
            onChangeText={setSubject}
            className="h-12 rounded-xl bg-white px-3.5 text-base text-gray-900"
          />
        </View>

        {/* Priority */}
        <View className="mb-4">
          <CustomDropdownLabel label="Priority" required>
            <CustomDropdown
              value={priority}
              onSelect={setPriority}
              options={PRIORITY_OPTIONS}
              placeholder="Select Priority"
            />
          </CustomDropdownLabel>
        </View>

        {/* Directive Type */}
        <View className="mb-4">
          <CustomDropdownLabel label="Directive Type" required>
            <CustomDropdown
              value={directiveType}
              onSelect={setDirectiveType}
              options={DIRECTIVE_TYPE_OPTIONS}
              placeholder="Select Directive Type"
            />
          </CustomDropdownLabel>
        </View>

        {/* Minister Ref & Directive Date */}
        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <View style={{ height: 38, justifyContent: "flex-end", paddingBottom: 4 }}>
              <Text className="text-sm font-semibold text-white/95" numberOfLines={2}>
                Minister Directive Reference
              </Text>
            </View>
            <TextInput
              placeholder="Enter reference"
              placeholderTextColor="#9ca3af"
              value={ministerRef}
              onChangeText={setMinisterRef}
              className="h-12 rounded-xl bg-white px-3.5 text-base text-gray-900"
            />
          </View>

          <View className="flex-1">
            <View style={{ height: 38, justifyContent: "flex-end", paddingBottom: 4 }}>
              <Text className="text-sm font-semibold text-white/95" numberOfLines={1}>
                Directive Date
              </Text>
            </View>
            <DateFilterField
              label=""
              value={directiveDate}
              onSelect={setDirectiveDate}
              labelClassName="hidden"
              triggerClassName={triggerCls}
            />
          </View>
        </View>

        {/* Duration (Days) */}
        <View className="mb-4">
          <FieldLabel>Duration (Days)</FieldLabel>
          <TextInput
            placeholder="Enter duration in days"
            placeholderTextColor="#9ca3af"
            value={durationDays}
            onChangeText={setDurationDays}
            keyboardType="number-pad"
            className="h-12 rounded-xl bg-white px-3.5 text-base text-gray-900"
          />
        </View>

        {/* Start Date & End Date */}
        <View className="mb-4 flex-row gap-3">
          <View className="flex-1">
            <FieldLabel>Start Date</FieldLabel>
            <DateFilterField
              label=""
              value={startDate}
              onSelect={setStartDate}
              labelClassName="hidden"
              triggerClassName={triggerCls}
            />
          </View>

          <View className="flex-1">
            <FieldLabel>End Date</FieldLabel>
            <DateFilterField
              label=""
              value={endDate}
              onSelect={setEndDate}
              labelClassName="hidden"
              triggerClassName={triggerCls}
            />
          </View>
        </View>

        {/* Directive Details */}
        <View className="mb-4">
          <FieldLabel required>Directive Details</FieldLabel>
          <TextInput
            placeholder="Enter directive..."
            placeholderTextColor="#9ca3af"
            value={details}
            onChangeText={setDetails}
            multiline
            className="min-h-[120px] rounded-xl bg-white p-3.5 text-base text-gray-900"
            textAlignVertical="top"
          />
        </View>

        {/* Attachments */}
        <View className="mb-4">
          <FieldLabel>Attachments</FieldLabel>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickFiles}
            className="h-12 w-full flex-row items-center justify-between rounded-xl bg-white px-4"
          >
            <Text className="font-semibold text-[#0B5D4E]">
              {attachments.length > 0 ? `${attachments.length} file(s) selected` : "Choose files"}
            </Text>
            <Text className="text-base text-gray-400">📎</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View className="mt-2 mb-4">
          <TouchableOpacity
            className="h-12 w-full items-center justify-center rounded-xl bg-amber-400"
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Text className="text-base font-bold text-[#0D4429]">Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}