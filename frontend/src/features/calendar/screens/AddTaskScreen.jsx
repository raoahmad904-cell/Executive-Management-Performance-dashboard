import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DateFilterField from "../../../utils/DateFilterField";
import { fmtDate } from "../../../utils/utils";

// ─── Option Lists ─────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { label: "Minister Directive", value: "Minister directive" },
  { label: "Meeting Directive", value: "Meeting directive" },
  { label: "Routine", value: "Routine" },
];
const PRIORITY_OPTIONS = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];
const ASSIGNED_BY_OPTIONS = [
  { label: "Self", value: "Self" },
  { label: "Minister", value: "Minister" },
  { label: "Plan Coordination User", value: "Plan Coordination User" },
  { label: "SA to Minister", value: "SA to Minister" },
  { label: "Test Management", value: "Test Management" },
  { label: "Secretary", value: "Secretary" },
];

function FieldLabel({ children, required }) {
  return (
    <Text className="mb-1.5 text-sm font-semibold text-white/95">
      {children}
      {required ? <Text className="text-amber-300"> *</Text> : null}
    </Text>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddTaskScreen({
  selectedKey,
  displayDate,
  onSubmit,
  onClose,
  onBack,
}) {
  const today = new Date();

  const [taskTitle, setTaskTitle] = useState("");
  const [category, setCategory] = useState("");
  const [startDateObj, setStartDateObj] = useState(today);
  const [endDateObj, setEndDateObj] = useState(today);
  const [priority, setPriority] = useState("");
  const [assignedBy, setAssignedBy] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");

  const labelCls = "mb-1.5 text-sm font-semibold text-white/95";
  const triggerCls = "rounded-xl border-0 bg-white px-3.5 h-12 flex-row items-center justify-between";

  function reset() {
    setTaskTitle("");
    setCategory("");
    setPriority("");
    setAssignedBy("");
    setDescription("");
    setRemarks("");
    setStartDateObj(today);
    setEndDateObj(today);
  }

  function handleSubmit() {
    if (!taskTitle.trim() || !category || !priority || !assignedBy) {
      Alert.alert(
        "Required Fields",
        "Please fill in all required fields marked with *"
      );
      return;
    }
    onSubmit({
      title: taskTitle,
      category,
      startDate: fmtDate(startDateObj),
      endDate: fmtDate(endDateObj),
      priority,
      assignedBy,
      description,
      remarks,
    });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl bg-[#0D4429] p-4">
        {/* Header */}
        <View className="pb-3 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white text-lg font-bold" numberOfLines={1}>
              Add New Task
            </Text>
            {selectedKey && (
              <Text className="text-white/70 text-sm mt-0.5">
                {displayDate(selectedKey)}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="flex-row items-center bg-white rounded-xl px-4 py-2.5"
            activeOpacity={0.8}
          >
            <Text className="text-[#1B5E3B] font-bold text-sm">← Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        >
          {/* Task Title */}
          <View className="mb-4">
            <FieldLabel required>Task Title</FieldLabel>
            <TextInput
              className="h-12 rounded-xl bg-white px-3.5 text-base text-gray-900"
              placeholder="Enter task title"
              placeholderTextColor="#9ca3af"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <CustomDropdownLabel label="Category" required>
              <CustomDropdown
                value={category}
                onSelect={setCategory}
                options={CATEGORY_OPTIONS}
                placeholder="Select Category"
              />
            </CustomDropdownLabel>
          </View>

          {/* Start Date & Expected End Date in 1 Row */}
          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <FieldLabel>Start Date</FieldLabel>
              <DateFilterField
                label=""
                value={startDateObj}
                onSelect={setStartDateObj}
                labelClassName="hidden"
                triggerClassName={triggerCls}
              />
            </View>

            <View className="flex-1">
              <FieldLabel>Expected End Date</FieldLabel>
              <DateFilterField
                label=""
                value={endDateObj}
                onSelect={setEndDateObj}
                labelClassName="hidden"
                triggerClassName={triggerCls}
              />
            </View>
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

          {/* Assigned By */}
          <View className="mb-4">
            <CustomDropdownLabel label="Assigned By" required>
              <CustomDropdown
                value={assignedBy}
                onSelect={setAssignedBy}
                options={ASSIGNED_BY_OPTIONS}
                placeholder="Select Assigned By"
              />
            </CustomDropdownLabel>
          </View>

          {/* Description */}
          <View className="mb-4">
            <FieldLabel>Description</FieldLabel>
            <TextInput
              className="min-h-[110px] rounded-xl bg-white p-3.5 text-base text-gray-900"
              placeholder="Task description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              blurOnSubmit={false}
              textAlignVertical="top"
            />
          </View>

          {/* Remarks */}
          <View className="mb-4">
            <FieldLabel>Remarks</FieldLabel>
            <TextInput
              className="min-h-[110px] rounded-xl bg-white p-3.5 text-base text-gray-900"
              placeholder="Add remarks (optional)"
              placeholderTextColor="#9ca3af"
              value={remarks}
              onChangeText={setRemarks}
              multiline
              blurOnSubmit={false}
              textAlignVertical="top"
            />
          </View>

          {/* Save Task Button */}
          <View className="mt-2 mb-4">
            <TouchableOpacity
              className="h-12 w-full bg-amber-400 rounded-xl items-center justify-center"
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text className="text-[#0D4429] font-bold text-base">
                Save Task
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}