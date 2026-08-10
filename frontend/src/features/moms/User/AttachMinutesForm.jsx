import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import DateFilterField from "../../../utils/DateFilterField";
import StatusModal from "../../../components/common/StatusModal";

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCENT = "#0D4429";
const SUBMIT_GREEN = "#157347";

const labelCls = "mb-1 text-sm font-semibold text-white/95";
const triggerCls = "rounded-xl border-0 bg-white px-3 py-3.5";

const SECTION_OPTIONS = [
  { label: "HUMAN RESOURCE MANAGEMENT WING", value: "HUMAN RESOURCE MANAGEMENT WING" },
  { label: "ADMINISTRATION WING", value: "ADMINISTRATION WING" },
  { label: "SPECIAL INITIATIVE WING", value: "SPECIAL INITIATIVE WING" },
  { label: "DEVELOPMENT", value: "DEVELOPMENT" },
  { label: "ORGANISATION SECTION", value: "ORGANISATION SECTION" },
  { label: "LIT/ORG SECTION", value: "LIT/ORG SECTION" },
  { label: "CHIEF FINANCE & ACCOUNTS OFFICER (CF&AO)", value: "CHIEF FINANCE & ACCOUNTS OFFICER (CF&AO)" },
  { label: "FINANCIAL ADVISOR OFFICE", value: "FINANCIAL ADVISOR OFFICE" },
  { label: "D.F.A.(PLANNING) OFFICE", value: "D.F.A.(PLANNING) OFFICE" },
  { label: "ECONOMIC SECTIONS", value: "ECONOMIC SECTIONS" },
  { label: "ENVIRONMENT AND CLIMATE CHANGE SECTION", value: "ENVIRONMENT AND CLIMATE CHANGE SECTION" },
  { label: "INTERNATIONAL TRADE & FINANCE SECTION", value: "INTERNATIONAL TRADE & FINANCE SECTION" },
  { label: "MACRO ECONOMIC SECTION", value: "MACRO ECONOMIC SECTION" },
  { label: "MONEY, PRICES AND FISCAL POLICY SECTION", value: "MONEY, PRICES AND FISCAL POLICY SECTION" },
  { label: "PLAN COORDINATION SECTION", value: "PLAN COORDINATION SECTION" },
  { label: "Sustain Development Goal's (SGD) Section", value: "Sustain Development Goal's (SGD) Section" },
  { label: "PUBLIC INVESTMENT AUTHORIZATION SECTION", value: "PUBLIC INVESTMENT AUTHORIZATION SECTION" },
  { label: "PUBLIC INVESTMENT PROGRAMMING SECTION", value: "PUBLIC INVESTMENT PROGRAMMING SECTION" },
  { label: "FOREIGN ASSISTANCE SECTION", value: "FOREIGN ASSISTANCE SECTION" },
  { label: "TECHNICAL SECTION", value: "TECHNICAL SECTION" },
  { label: "FOOD & AGRICULTURE SECTION", value: "FOOD & AGRICULTURE SECTION" },
  { label: "DEVOLUTION AND AREA DEVELOPMENT SECTION", value: "DEVOLUTION AND AREA DEVELOPMENT SECTION" },
  { label: "EDUCATION SECTION", value: "EDUCATION SECTION" },
  { label: "FOOD AGRICULTURE AND CLIMATE CHANGE SECTION", value: "FOOD AGRICULTURE AND CLIMATE CHANGE SECTION" },
  { label: "GOVERNANCE SECTION", value: "GOVERNANCE SECTION" },
  { label: "HEALTH SECTION (PPMI Building)", value: "HEALTH SECTION (PPMI Building)" },
  { label: "EIS and C/ICT (INFORMATION COMMUNICATION TECHNOLOGY SECTION)", value: "EIS and C/ICT (INFORMATION COMMUNICATION TECHNOLOGY SECTION)" },
  { label: "INDUSTRIES AND COMMERCE SECTION", value: "INDUSTRIES AND COMMERCE SECTION" },
  { label: "MANPOWER SECTION", value: "MANPOWER SECTION" },
  { label: "MASS MEDIA, CULTURE, SPORTS, TOURISM AND YOUTH AFFAIRS SECTION", value: "MASS MEDIA, CULTURE, SPORTS, TOURISM AND YOUTH AFFAIRS SECTION" },
  { label: "NUTRITION SECTION", value: "NUTRITION SECTION" },
  { label: "PHYSICAL PLANNING AND HOUSING SECTION", value: "PHYSICAL PLANNING AND HOUSING SECTION" },
  { label: "POPULATION & SOCIAL PLANNING SECTION", value: "POPULATION & SOCIAL PLANNING SECTION" },
  { label: "RECOVERY AND RECONSTRUCTION UNIT (RRU) SECTION", value: "RECOVERY AND RECONSTRUCTION UNIT (RRU) SECTION" },
  { label: "SCIENCE & TECHNOLOGY SECTION", value: "SCIENCE & TECHNOLOGY SECTION" },
  { label: "SOCIAL WELFARE SECTION", value: "SOCIAL WELFARE SECTION" },
  { label: "TRANSPORT & COMMUNICATION SECTION", value: "TRANSPORT & COMMUNICATION SECTION" },
  { label: "WATER RESOURCES SECTION", value: "WATER RESOURCES SECTION" },
  { label: "DRAINAGE WING SECTION", value: "DRAINAGE WING SECTION" },
  { label: "ENERGY WING", value: "ENERGY WING" },
  { label: "ENERGY APPRAISAL & PLAN FORMULATION (POWER)", value: "ENERGY APPRAISAL & PLAN FORMULATION (POWER)" },
  { label: "ENERGY, FINANCE AND ECONOMIC SECTION", value: "ENERGY, FINANCE AND ECONOMIC SECTION" },
  { label: "ENERGY APPRAISAL & PLAN FORMULATION (Feul)", value: "ENERGY APPRAISAL & PLAN FORMULATION (Feul)" },
  { label: "DEVELOPMENT COMMUNICATION PROJECT", value: "DEVELOPMENT COMMUNICATION PROJECT" },
  { label: "MARITIME AFFAIRS WING", value: "MARITIME AFFAIRS WING" },
  { label: "JAWAID AZFAR COMPUTER CENTRE", value: "JAWAID AZFAR COMPUTER CENTRE" },
  { label: "PAKISTAN INSTITUTE OF DEVELOPMENT ECONOMICS", value: "PAKISTAN INSTITUTE OF DEVELOPMENT ECONOMICS" },
  { label: "PAKISTAN PLANNING AND MANAGEMENT INSTITUTE", value: "PAKISTAN PLANNING AND MANAGEMENT INSTITUTE" },
  { label: "URAF PROJECT CELL", value: "URAF PROJECT CELL" }
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttachMinutesForm({ onSubmit, onClose }) {
  const today = new Date();

  const [subject,    setSubject]    = useState("");
  const [dateObj,    setDateObj]    = useState(today);
  const [fileNumber, setFileNumber] = useState("");
  const [section,    setSection]    = useState("");
  const [fileName,   setFileName]   = useState("");
  const [fileAsset,  setFileAsset]  = useState(null);
  const [status, setStatus] = useState(null); // { title, message }

  function reset() {
    setSubject("");
    setDateObj(today);
    setFileNumber("");
    setSection("");
    setFileName("");
    setFileAsset(null);
  }

  async function handleChooseFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setFileAsset(asset);
      setFileName(asset.name);
    } catch {
      setStatus({ title: "Error", message: "Could not open the document picker." });
    }
  }

  function handleSubmit() {
    if (!subject.trim() || !fileNumber.trim() || !section || !fileAsset) {
      setStatus({
        title: "Required Fields",
        message: "Please fill in Subject, File Number, Concerned Section, and choose a file.",
      });
      return;
    }

    onSubmit({
      subject: subject.trim(),
      date: dateObj.toISOString(),
      meetingNumber: fileNumber.trim(),
      concernedSection: section,
      fileAsset
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
      keyboardVerticalOffset={90}
    >
      <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl bg-[#0D4429] p-4">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View className="pb-3 flex-row items-center justify-between">
          <Text className="text-white text-lg font-bold flex-1 mr-3" numberOfLines={1}>
            Attach Minutes of Meeting
          </Text>
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
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
        >
          {/* ── Subject ────────────────────────────────────────────── */}
          <View className="mb-3">
            <Text className={labelCls}>
              Subject <Text className="text-amber-400">*</Text>
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 text-gray-800 text-sm"
              placeholder="Enter subject"
              placeholderTextColor="#9ca3af"
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* ── Date ───────────────────────────────────────────────── */}
          <View className="mb-3">
            <DateFilterField
              label="Date"
              value={dateObj}
              onSelect={setDateObj}
              labelClassName={labelCls}
              triggerClassName={triggerCls}
              containerClassName=""
            />
          </View>

          {/* ── File Number ────────────────────────────────────────── */}
          <View className="mb-3">
            <Text className={labelCls}>
              File Number <Text className="text-amber-400">*</Text>
            </Text>
            <TextInput
              className="bg-white rounded-xl px-4 py-3 text-gray-800 text-sm"
              placeholder="Enter file number"
              placeholderTextColor="#9ca3af"
              value={fileNumber}
              onChangeText={setFileNumber}
              keyboardType="default"
            />
          </View>

          {/* ── Concerned Section ──────────────────────────────────── */}
          <View className="mb-3">
            <Text className={labelCls}>
              Concerned Section <Text className="text-amber-400">*</Text>
            </Text>
            <CustomDropdown
              value={section}
              options={SECTION_OPTIONS}
              placeholder="Select Section"
              onSelect={setSection}
            />
          </View>

          {/* ── Choose File ────────────────────────────────────────── */}
          <View className="mb-4">
            <Text className={labelCls}>
              Attach File <Text className="text-amber-400">*</Text>
            </Text>

            <TouchableOpacity
              onPress={handleChooseFile}
              activeOpacity={0.85}
              className="rounded-xl overflow-hidden"
              style={{
                borderWidth: 2,
                borderColor: fileAsset ? "#157347" : "rgba(255,255,255,0.25)",
                borderStyle: "dashed",
                backgroundColor: fileAsset ? "rgba(21,115,71,0.15)" : "rgba(255,255,255,0.08)",
              }}
            >
              <View className="items-center justify-center py-5 px-4">
                {/* Icon */}
                <View
                  className="mb-3 items-center justify-center rounded-full"
                  style={{
                    width: 52,
                    height: 52,
                    backgroundColor: fileAsset ? "rgba(21,115,71,0.3)" : "rgba(255,255,255,0.15)",
                  }}
                >
                  <Ionicons
                    name={fileAsset ? "document-text" : "cloud-upload-outline"}
                    size={26}
                    color={fileAsset ? "#4ade80" : "#ffffff"}
                  />
                </View>

                {fileAsset ? (
                  <>
                    <Text className="text-green-400 font-bold text-sm text-center mb-0.5">
                      File Selected
                    </Text>
                    <Text
                      className="text-white/80 text-xs text-center"
                      numberOfLines={2}
                    >
                      {fileName}
                    </Text>
                    <Text className="text-white/40 text-xs mt-2">
                      Tap to change file
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white font-semibold text-sm text-center mb-0.5">
                      Tap to Browse File
                    </Text>
                    <Text className="text-white/50 text-xs text-center">
                      PDF, Word, Excel and more
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Submit Button ──────────────────────────────────────── */}
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            className="rounded-xl py-3 items-center"
            style={{ backgroundColor: "#FBBF24" }}
          >
            <Text style={{ color: "#0D4429", fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 }}>
              Submit MoMs
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <StatusModal
        visible={status !== null}
        type="error"
        title={status?.title}
        message={status?.message}
        onClose={() => setStatus(null)}
      />
    </KeyboardAvoidingView>
  );
}