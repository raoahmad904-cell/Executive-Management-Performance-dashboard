import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect, useMemo, useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
  Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import { EMBLEM_BASE64 } from "../../../utils/logoBase64.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import DateFilterField from "../../../utils/DateFilterField";
import * as Print from 'expo-print';

const SECTION_OPTIONS = [
  { label: "All Sections", value: "" },
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

const labelCls = "mb-1 text-sm font-semibold text-white/95";
const triggerCls = "rounded-xl border-0 bg-white px-3 py-3.5";
const ITEMS_PER_PAGE = 5;

function parseRecordDate(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatCustomDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MinutesRepository() {
  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: "Minutes Repository" });
  }, [nav]);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewTargetItem, setViewTargetItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) setCurrentUser(JSON.parse(uStr));
      } catch (e) {
        console.error("Error loading user info:", e);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const loadMoMs = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/moms/all`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(d => ({
            id: d._id,
            subject: d.subject,
            date: formatCustomDate(d.date),
            rawDate: d.date,
            meetingNo: d.meetingNumber,
            section: d.concernedSection,
            attachment: d.attachment,
            submittedBy: d.submittedBy
          }));
          setRecords(mapped);
        } else {
          console.error("Failed to fetch all MoMs");
        }
      } catch (err) {
        console.error("Network error fetching MoMs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadMoMs();
  }, []);

  // filter inputs
  const [quickSearch, setQuickSearch] = useState("");
  const [section, setSection] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // applied filters
  const [activeFilters, setActiveFilters] = useState({
    text: "",
    section: "",
    from: null,
    to: null,
  });

  const [page, setPage] = useState(0);

  function applySearch() {
    setActiveFilters({
      text: quickSearch.trim(),
      section,
      from: fromDate,
      to: toDate,
    });
    setPage(0);
  }

  function clearFilters() {
    setQuickSearch("");
    setSection("");
    setFromDate(null);
    setToDate(null);
    setActiveFilters({ text: "", section: "", from: null, to: null });
    setPage(0);
  }

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = quickSearch.trim().toLowerCase();
      if (
        q &&
        !r.subject.toLowerCase().includes(q) &&
        !r.section.toLowerCase().includes(q) &&
        !r.meetingNo.toLowerCase().includes(q)
      )
        return false;
      if (activeFilters.section && r.section !== activeFilters.section)
        return false;
      if (activeFilters.from || activeFilters.to) {
        const d = parseRecordDate(r.rawDate);
        if (d) {
          if (activeFilters.from) {
            const f = new Date(activeFilters.from);
            f.setHours(0, 0, 0, 0);
            if (d < f) return false;
          }
          if (activeFilters.to) {
            const t = new Date(activeFilters.to);
            t.setHours(0, 0, 0, 0);
            if (d > t) return false;
          }
        } else {
          return false;
        }
      }
      return true;
    });
  }, [records, quickSearch, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageData = filtered.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  function handleView(item) {
    setViewTargetItem(item);
  }

  function handleDownload(item) {
    if (!item.attachment) {
      Alert.alert("Notice", "No file attachment found for this record.");
      return;
    }
    const url = `${API_BASE_URL}api/moms/download/${item.attachment}`;
    Linking.openURL(url).catch(err => {
      console.error("Failed to open URL:", err);
      Alert.alert("Error", "Could not trigger download.");
    });
  }

  async function handlePrint() {
    if (filtered.length === 0) {
      Alert.alert("Notice", "No records available to print.");
      return;
    }

    try {
      const rowsHtml = filtered.map((item, idx) => `
        <tr>
          <td class="text-center" style="text-align: center; border: 1px solid #000; padding: 10px; font-size: 12px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 10px; font-size: 12px; font-weight: bold;">${item.subject}</td>
          <td style="border: 1px solid #000; padding: 10px; font-size: 12px;">${item.date}</td>
          <td style="border: 1px solid #000; padding: 10px; font-size: 12px; text-align: center;">${item.meetingNo}</td>
          <td style="border: 1px solid #000; padding: 10px; font-size: 12px;">${item.section}</td>
        </tr>
      `).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            padding: 20px;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid #000;
            margin-bottom: 25px;
          }
          .header-cell {
            padding: 12px;
            vertical-align: middle;
            text-align: center;
            border: 1.5px solid #000;
          }
          .logo-cell {
            width: 15%;
          }
          .logo-img {
            height: 70px;
            width: 70px;
            object-fit: contain;
          }
          .title-cell {
            width: 70%;
            text-align: center;
          }
          .title-govt {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            color: #000;
          }
          .title-main {
            font-size: 15px;
            font-weight: bold;
            margin: 5px 0 0 0;
          }
          .side-cell {
            width: 15%;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 10px;
            font-size: 12px;
            text-align: left;
          }
          .data-table th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .data-table tr:nth-child(even) {
            background-color: #fafafa;
          }
          .text-center {
            text-align: center !important;
          }
          .meta-info {
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.6;
            color: #374151;
          }
          .meta-item {
            font-weight: bold;
          }
        </style>
        </head>
        <body>

        <table class="header-table">
          <tr>
            <td class="header-cell logo-cell">
              <img src="${EMBLEM_BASE64}" class="logo-img" alt="Emblem" />
            </td>
            <td class="header-cell title-cell">
              <div class="title-govt">Government of Pakistan</div>
              <div class="title-govt" style="font-size: 12px; font-weight: bold; margin-top: 3px;">Planning Commission</div>
              <div class="title-govt" style="font-size: 11px; font-weight: 500; margin-top: 3px;">Ministry of Planning, Development & Special Initiatives</div>
              <div class="title-main" style="margin-top: 10px; font-size: 15px; font-weight: bold; text-decoration: underline;">Minutes of Meetings Report</div>
            </td>
            <td class="header-cell side-cell">
            </td>
          </tr>
        </table>

        <div class="meta-info">
          <div><span class="meta-item">Name:</span> ${currentUser?.name || 'Test Management'}</div>
          <div><span class="meta-item">Designation:</span> ${currentUser?.designation || 'Director / Officer'}</div>
          <div><span class="meta-item">Report Date:</span> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 8%; text-align: center;">Sr No</th>
              <th style="width: 30%;">Subject</th>
              <th style="width: 20%;">Date</th>
              <th style="width: 15%; text-align: center;">Meeting No</th>
              <th style="width: 27%;">Section</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        </body>
        </html>
      `;

      await Print.printAsync({ html: htmlContent });
    } catch (err) {
      // "Printing did not complete" fires when the user cancels/dismisses the
      // native print dialog (or no print service is configured on the device/
      // emulator) - not an actual failure to generate the PDF, so don't alert.
      if (String(err?.message || "").toLowerCase().includes("did not complete")) {
        return;
      }
      console.error("Print error:", err);
      Alert.alert("Error", "Could not generate print document.");
    }
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 16 }}
    >
      {/* ── Filter Card ─────────────────────────────────────────────────── */}
      <View
        className="mx-2 mt-1 mb-3 rounded-2xl bg-[#0D4429] p-4"
        style={{
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        {/* Title + Quick Search */}
        <View className="flex-row items-center mb-4" style={{ gap: 10 }}>
          <Text className="text-amber-400 text-base font-bold flex-1">
            Search Meetings
          </Text>
          <View
            className="flex-row items-center bg-white rounded-xl px-3 py-2.5"
            style={{ flex: 1 }}
          >
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              className="ml-2 flex-1 text-sm text-gray-700"
              placeholder="Quick Search…"
              placeholderTextColor="#9ca3af"
              value={quickSearch}
              onChangeText={(text) => {
                setQuickSearch(text);
                setPage(0);
              }}
              returnKeyType="search"
              onSubmitEditing={applySearch}
            />
            {quickSearch.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuickSearch("");
                  setPage(0);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section dropdown */}
        <View className="mb-3">
          <Text className={labelCls}>Section</Text>
          <CustomDropdown
            value={section}
            options={SECTION_OPTIONS}
            placeholder="Select"
            onSelect={setSection}
          />
        </View>

        {/* From / To date */}
        <View className="flex-row mb-4" style={{ gap: 10 }}>
          <DateFilterField
            label="From"
            value={fromDate}
            onSelect={setFromDate}
            labelClassName={labelCls}
            triggerClassName={triggerCls}
          />
          <DateFilterField
            label="To"
            value={toDate}
            onSelect={setToDate}
            labelClassName={labelCls}
            triggerClassName={triggerCls}
          />
        </View>

        {/* Search + Clear */}
        <View className="flex-row" style={{ gap: 8 }}>
          <TouchableOpacity
            onPress={applySearch}
            activeOpacity={0.85}
            className="rounded-xl px-6 py-2.5 items-center"
            style={{ backgroundColor: "#F59E0B" }}
          >
            <Text className="text-[#0D4429] font-bold text-sm">Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearFilters}
            activeOpacity={0.8}
            className="rounded-xl px-6 py-2.5 items-center border border-white/30"
          >
            <Text className="text-white font-semibold text-sm">Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Results Card ────────────────────────────────────────────────── */}
      <View
        className="mx-2 mb-2 rounded-2xl bg-[#0D4429] p-4"
        style={{
          elevation: 3,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        {/* Print icon */}
        <View className="items-end mb-3">
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handlePrint}
          >
            <Ionicons name="print-outline" size={22} color="#5eead4" />
          </TouchableOpacity>
        </View>

        {/* Cards */}
        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : pageData.length === 0 ? (
          <View className="items-center justify-center px-8 py-16">
            <Text style={{ fontSize: 48, lineHeight: 60 }}>📄</Text>
            <Text className="mt-2 text-base font-semibold text-gray-200">
              No records found
            </Text>
            <Text className="mt-1 text-center text-sm text-white/50">
              Try adjusting your search filters
            </Text>
          </View>
        ) : (
          <View>
            {pageData.map((item, idx) => {
              const globalIdx = page * ITEMS_PER_PAGE + idx;
              return (
                <View
                  key={item.id}
                  className="mb-3 overflow-hidden rounded-2xl border border-gray-100 bg-white"
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <View className="flex-1 p-4">
                    {/* Row 1 — Sr No + Subject */}
                    <View className="mb-2 flex-row items-start">
                      <Text className="mr-2 mt-0.5 text-sm text-gray-400">
                        #{globalIdx + 1}
                      </Text>
                      <Text
                        className="flex-1 text-base font-bold text-gray-900"
                        numberOfLines={2}
                      >
                        {item.subject}
                      </Text>
                    </View>

                    {/* Row 2 — Date */}
                    <View
                      className="mb-1 flex-row items-center"
                      style={{ gap: 6 }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text className="text-sm text-gray-500">{item.date}</Text>
                    </View>

                    {/* Row 3 — Meeting No */}
                    <View
                      className="mb-1 flex-row items-center"
                      style={{ gap: 6 }}
                    >
                      <Ionicons
                        name="document-outline"
                        size={14}
                        color="#6b7280"
                      />
                      <Text className="text-sm text-gray-500">
                        Meeting No: {item.meetingNo}
                      </Text>
                    </View>

                    {/* Row 4 — Section */}
                    <View
                      className="mb-3 flex-row items-start"
                      style={{ gap: 6 }}
                    >
                      <Ionicons
                        name="business-outline"
                        size={14}
                        color="#6b7280"
                        style={{ marginTop: 2 }}
                      />
                      <Text
                        className="flex-1 text-sm text-gray-500"
                        numberOfLines={2}
                      >
                        {item.section}
                      </Text>
                    </View>

                    {/* Action buttons — View + Download */}
                    <View className="flex-row" style={{ gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleView(item)}
                        activeOpacity={0.8}
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-teal-200 bg-teal-50 py-2.5"
                      >
                        <Ionicons
                          name="eye-outline"
                          size={16}
                          color="#0d9488"
                        />
                        <Text className="ml-1.5 text-sm font-semibold text-teal-700">
                          View
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDownload(item)}
                        activeOpacity={0.8}
                        className="flex-1 flex-row items-center justify-center rounded-xl border border-amber-200 bg-amber-50 py-2.5"
                      >
                        <Ionicons
                          name="download-outline"
                          size={16}
                          color="#d97706"
                        />
                        <Text className="ml-1.5 text-sm font-semibold text-amber-700">
                          Download
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Pagination ─────────────────────────────────────────────── */}
        <View
          className="mt-2 flex-row items-center justify-between rounded-xl bg-white px-3"
          style={{ paddingTop: 6, paddingBottom: 6 }}
        >
          <TouchableOpacity
            className={`rounded-xl px-5 py-3 ${page === 0 ? "bg-gray-100" : "bg-[#0D4429]"}`}
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold ${page === 0 ? "text-gray-400" : "text-white"}`}
            >
              ← Prev
            </Text>
          </TouchableOpacity>

          <Text className="text-sm font-medium text-gray-600">
            {filtered.length > 0
              ? `Page ${page + 1} of ${totalPages}  ·  ${filtered.length} record${filtered.length !== 1 ? "s" : ""}`
              : "—"}
          </Text>

          <TouchableOpacity
            className={`rounded-xl px-5 py-3 ${page >= totalPages - 1 ? "bg-gray-100" : "bg-[#0D4429]"}`}
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            activeOpacity={0.8}
          >
            <Text
              className={`text-sm font-semibold ${page >= totalPages - 1 ? "text-gray-400" : "text-white"}`}
            >
              Next →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={viewTargetItem !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setViewTargetItem(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
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
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 18,
              padding: 20
            }}>
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 18 }}>
                  <Ionicons name="document-text-outline" size={38} color="#0D4429" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 14 }}>
                  Meeting Details
                </Text>
              </View>

              {viewTargetItem && (
                <View style={{ gap: 14, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="create-outline" size={20} color="#0D4429" style={{ width: 24, marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.subject}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="calendar-outline" size={20} color="#0D4429" style={{ width: 24, marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.date}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="folder-open-outline" size={20} color="#0D4429" style={{ width: 24, marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Meeting No</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.meetingNo}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="business-outline" size={20} color="#0D4429" style={{ width: 24, marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Concerned Section</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.section}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="person-outline" size={20} color="#0D4429" style={{ width: 24, marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Submitted By</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.submittedBy || 'N/A'}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Ionicons name="attach-outline" size={20} color="#0D4429" style={{ width: 24, marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Attachment</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.attachment ? 'Yes' : 'No'}</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={() => setViewTargetItem(null)}
                style={{ height: 50, borderRadius: 12, backgroundColor: '#0D4429', alignItems: 'center', justifyContent: 'center', marginTop: 28 }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}