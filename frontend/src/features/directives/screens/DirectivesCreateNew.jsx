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
    <Text className="mb-1 text-sm font-semibold text-white/95 h-10" numberOfLines={2}>
      {children}
      {required ? <Text className="text-amber-200"> *</Text> : null}
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

  const labelCls = "mb-1 text-sm font-semibold text-white/95 h-10";
  const triggerCls = "rounded-xl border-0 bg-white px-3 h-12 flex-row items-center justify-between";

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

  function toggleUser(id) {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function usersSummary() {
    if (selectedUserIds.length === 0) return "Select user(s)";
    return selectedUserIds
      .map((id) => userOptions.find((o) => o.value === id)?.label)
      .filter(Boolean)
      .join(", ");
  }

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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
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

        <FieldLabel>Subject</FieldLabel>
        <TextInput
          placeholder="Enter Subject"
          placeholderTextColor="#9ca3af"
          value={subject}
          onChangeText={setSubject}
          className="mb-4 rounded-xl bg-white px-3 py-3.5 text-base text-gray-900"
        />

        <CustomDropdownLabel label="Priority" required>
          <CustomDropdown
            value={priority}
            onSelect={setPriority}
            options={PRIORITY_OPTIONS}
            placeholder="Select Priority"
          />
        </CustomDropdownLabel>

        <CustomDropdownLabel label="Directive Type" required>
          <CustomDropdown
            value={directiveType}
            onSelect={setDirectiveType}
            options={DIRECTIVE_TYPE_OPTIONS}
            placeholder="Select Directive Type"
          />
        </CustomDropdownLabel>

        <View className="mb-2 flex-row flex-nowrap gap-2">
          <View className="min-w-0 flex-1">
            <FieldLabel>Minister Directive Reference</FieldLabel>
            <TextInput
              value={ministerRef}
              onChangeText={setMinisterRef}
              className="rounded-xl bg-white px-3 h-12 text-base text-gray-900"
            />
          </View>
          <View className="min-w-0 flex-1">
            <DateFilterField label="Directive Date" value={directiveDate} onSelect={setDirectiveDate} labelClassName={labelCls} triggerClassName={triggerCls} />

          </View>
        </View>

        <View className="mb-2 flex-row flex-nowrap gap-2">
          <View className="min-w-0 flex-[0.8]">
            <FieldLabel>Duration (Days)</FieldLabel>
            <TextInput
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
              className="rounded-xl bg-white px-3 h-12 text-base text-gray-900"
            />
          </View>

          <View className="min-w-0 flex-1">
            <DateFilterField label="Start Date" value={startDate} onSelect={setStartDate} labelClassName={labelCls} triggerClassName={triggerCls} />
          </View>

          <View className="min-w-0 flex-1">
            <DateFilterField label="End Date" value={endDate} onSelect={setEndDate} labelClassName={labelCls} triggerClassName={triggerCls} />
          </View>
        </View>

        <FieldLabel>Directive Details</FieldLabel>
        <TextInput
          placeholder="Enter directive..."
          placeholderTextColor="#9ca3af"
          value={details}
          onChangeText={setDetails}
          multiline
          className="mb-4 min-h-[140px] rounded-xl bg-white px-3 py-3.5 text-base text-gray-900"
          textAlignVertical="top"
        />


        <FieldLabel>Attachments</FieldLabel>

        <TouchableOpacity
          onPress={handlePickFiles}
          className="mb-2 w-full flex-row items-center justify-between rounded-xl bg-white px-5 py-4"
        >
          <Text className="font-semibold text-[#0B5D4E]">
            Choose files
          </Text>

          {/* Optional icon */}
          <Text className="text-gray-400">📎</Text>
        </TouchableOpacity>

        {attachments.length > 0 ? (
          <Text className="mb-4 text-xs text-white/80">
            {attachments.length} file(s) selected
          </Text>
        ) : (
          <View className="mb-4" />
        )}

        <TouchableOpacity
          className="flex-1 bg-amber-400 rounded-xl py-3 items-center"
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text className="text-[#0D4429] font-bold text-sm">Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}