import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useMemo, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../../utils/utils.js";
import { EMBLEM_BASE64 } from "../../../../utils/logoBase64.js";
import { ActivityIndicator } from "react-native";
import * as Print from 'expo-print';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import StatusModal from "../../../../components/common/StatusModal";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RenderHtml from 'react-native-render-html';
import CustomDropdown from "../../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../../components/forms/CustomDropdownLabel";
import SideMenu from "../../../../components/navigation/SideMenu";
import DashboardHeader from "../../../dashboard/components/DashboardHeader";
import {
  getDashboardHeaderTitle,
  getDashboardMenu,
} from "../../../dashboard/config/dashboardMenu";

function formatSubmittedAt(raw) {
  if (raw == null || raw === "" || raw === "Submitted") {
    return "18 July, 2025";
  }
  return raw;
}

export default function TwoYearPlanMemberDetails({ route, navigation }) {
  const member = route?.params?.member;
  const role = route?.params?.role ?? "management";
  const roleLabel =
    route?.params?.roleLabel ??
    (role === "user" ? "Test User" : "Test Management");
  const headerTitle = getDashboardHeaderTitle(role);

  const [currentUserName, setCurrentUserName] = useState(roleLabel);

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) {
          const u = JSON.parse(uStr);
          if (u && u.name) {
            setCurrentUserName(u.name);
          }
        }
      } catch (err) {
        console.error("Error loading user in TwoYearPlanMemberDetails:", err);
      }
    };
    loadUserName();
  }, []);

  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Two Year Plan - ${member?.name ?? "Member"}` });
  }, [nav, member]);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompact = width < 560;

  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const menuItems = useMemo(() => getDashboardMenu(role), [role]);
  const [expandedParentIds, setExpandedParentIds] = useState({
    directives: true,
  });

  const drawerPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(-12)
        .failOffsetY([-20, 20])
        .onEnd((e) => {
          const farEnough = e.translationX < -56;
          const fastLeft = e.velocityX < -650;
          if (farEnough || fastLeft) {
            runOnJS(closeMenu)();
          }
        }),
    [closeMenu]
  );

  function handleMenuSelect(id) {
    setMenuOpen(false);
    navigation.navigate({
      name: "Dashboard",
      params: { activeItemId: id },
      merge: true,
    });
  }

  const yearOptions = useMemo(
    () => [
      { value: "2025", label: "2025" },
      { value: "2026", label: "2026" },
    ],
    []
  );

  const quarterOptions = useMemo(
    () => ["Q1", "Q2", "Q3", "Q4"].map((q) => ({ value: q, label: q })),
    []
  );

  const activityOptions = useMemo(
    () => [
      { value: "sectoral", label: "Sectoral Development Plan" },
      { value: "policy", label: "Policy Review" },
      { value: "advisory", label: "Advisory Notes" },
      { value: "assessment", label: "Assessment Reports" },
      { value: "cdwp/ecnec", label: "CDWP/ECNEC Participation" },
      { value: "section", label: "Section Capacity Building" },
      { value: "minister", label: "Minister/DCPC Assigned Tasks" },
    ],
    []
  );

  const [year, setYear] = useState(null);
  const [quarter, setQuarter] = useState(null);
  const [activity, setActivity] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { title, message }

  useEffect(() => {
    const fetchMemberPlan = async () => {
      if (!member?.id) return;
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/form/two-year-plan?user=${member.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const plans = await res.json();
          setPlan(Array.isArray(plans) ? plans[0] : plans);
        }
      } catch (err) {
        console.error("Error loading member plan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberPlan();
  }, [member?.id]);

  const activityLabel =
    activityOptions.find((o) => o.value === activity)?.label ?? "";

  const planItem = useMemo(() => {
    if (!plan || !plan.plan) return null;
    return plan.plan.find(p => p.activityArea === activityLabel);
  }, [plan, activityLabel]);

  function getPlanHTML() {
    if (!planItem) return "";
    let idx = -1;
    const qIdx = ["Q1", "Q2", "Q3", "Q4"].indexOf(quarter);
    if (year === "2025") {
      idx = qIdx;
    } else if (year === "2026") {
      idx = qIdx + 4;
    }
    if (idx !== -1 && planItem.quarters) {
      return planItem.quarters[idx] || "";
    }
    return "";
  }

  function stripHtml(html) {
    if (!html) return "No plan details specified for this quarter.";
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  const filtersComplete =
    year != null && quarter != null && activity != null;

  const summaryTitle = filtersComplete
    ? `${year} - ${activityLabel} - ${quarter}`
    : "";

  const submittedAtDisplay = formatSubmittedAt(member?.submittedAt);

  async function handlePrintPdf() {
    try {
      // Build rows for each activity area
      const rowsHTML = activityOptions.map(option => {
        const item = plan?.plan?.find(p => p.activityArea === option.label);
        const qCells = [];
        for (let i = 0; i < 8; i++) {
          const rawCell = item?.quarters?.[i] || "";
          qCells.push(`<td>${rawCell ? rawCell : "-"}</td>`);
        }
        return `
          <tr>
            <td class="activity-col">${option.label}</td>
            ${qCells.join('')}
          </tr>
        `;
      }).join('');

      const html = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                color: #333;
                margin: 20px;
                background-color: #fff;
              }
              .header-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              .header-table td {
                border: 2px solid #000;
                padding: 10px;
                text-align: center;
                vertical-align: middle;
              }
              .logo-container {
                width: 15%;
              }
              .logo-img {
                width: 70px;
                height: 70px;
              }
              .title-container {
                width: 70%;
              }
              .gov-title {
                font-size: 15px;
                font-weight: bold;
                text-transform: uppercase;
                margin: 0;
              }
              .sub-title {
                font-size: 11px;
                margin: 3px 0 0 0;
                text-transform: uppercase;
                font-weight: bold;
              }
              .doc-title {
                font-size: 16px;
                font-weight: bold;
                margin-top: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .meta-info {
                margin-bottom: 20px;
                font-size: 12px;
                line-height: 1.5;
              }
              .meta-item {
                font-weight: bold;
              }
              .plan-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              .plan-table th, .plan-table td {
                border: 1px solid #000;
                padding: 6px 8px;
                font-size: 10px;
                text-align: left;
                vertical-align: top;
                word-wrap: break-word;
              }
              .plan-table th {
                background-color: #f3f4f6;
                font-weight: bold;
                text-align: center;
              }
              .activity-col {
                width: 16%;
                font-weight: bold;
              }
              @media print {
                body {
                  margin: 10px;
                }
                .plan-table th {
                  background-color: #e5e7eb !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <table class="header-table">
              <tr>
                <td class="logo-container">
                  <img class="logo-img" src="${EMBLEM_BASE64}" />
                </td>
                <td class="title-container">
                  <div class="gov-title">Government of Pakistan</div>
                  <div class="sub-title">Planning Commission</div>
                  <div class="sub-title">Ministry of Planning, Development & Special Initiatives</div>
                  <div class="doc-title">Two Year Plan</div>
                </td>
                <td style="width: 15%;"></td>
              </tr>
            </table>
            
            <div class="meta-info">
              <div><span class="meta-item">Name:</span> ${member?.name || 'N/A'}</div>
              <div><span class="meta-item">Designation:</span> ${member?.designation || 'Member'}</div>
              <div><span class="meta-item">Submitted At:</span> ${submittedAtDisplay}</div>
            </div>

            <table class="plan-table">
              <thead>
                <tr>
                  <th class="activity-col">Activity Area</th>
                  <th>2025 Q1</th>
                  <th>2025 Q2</th>
                  <th>2025 Q3</th>
                  <th>2025 Q4</th>
                  <th>2026 Q1</th>
                  <th>2026 Q2</th>
                  <th>2026 Q3</th>
                  <th>2026 Q4</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (error) {
      // "Printing did not complete" fires when the user cancels/dismisses the
      // native print dialog (or no print service is configured on the device/
      // emulator) - not an actual failure to generate the PDF, so don't alert.
      if (String(error?.message || "").toLowerCase().includes("did not complete")) {
        return;
      }
      console.error("Print Error:", error);
      setStatus({ title: "Print Failed", message: "An error occurred while preparing the PDF for printing." });
    }
  }

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      {/* <View style={{ paddingTop: insets.top }} className="bg-white"> */}
      <DashboardHeader
        roleLabel={currentUserName}
        navigation={navigation}
        headerTitle={headerTitle}
        onMenuPress={() => setMenuOpen(true)}
      />
      {/* </View> */}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 28,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View className="border-b border-gray-100 bg-white px-4 pb-4 pt-3">
          <View
            className={
              isCompact
                ? "w-full flex-col gap-3"
                : "w-full flex-row items-start justify-between gap-3"
            }
          >
            <View className="min-w-0 flex-1">
              <Text
                className="text-[17px] font-extrabold text-gray-900"
                numberOfLines={3}
              >
                {`2 Year Plan - ${member?.name ?? "Member"}`}
              </Text>
              <Text
                className="mt-1 text-[13px] font-semibold text-[#0B5D4E]"
                numberOfLines={2}
              >
                {`(Submitted At: ${submittedAtDisplay})`}
              </Text>
            </View>

            <View
              className={
                isCompact
                  ? "w-full flex-row gap-2"
                  : "flex-shrink-0 flex-row items-center gap-2"
              }
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className={`flex-row items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2.5 ${isCompact ? "flex-1" : ""}`}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Text className="text-[14px] font-semibold text-gray-800">
                  Back
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePrintPdf}
                className={`flex-row items-center justify-center gap-2 rounded-xl bg-[#0B5D4E] px-3 py-2.5 ${isCompact ? "flex-1" : ""}`}
                accessibilityRole="button"
                accessibilityLabel="Print or share PDF"
              >
                <Ionicons name="print-outline" size={18} color="#FFFFFF" />
                <Text className="text-[14px] font-semibold text-white">
                  Print PDF
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="px-4 pt-4 bg-[#0D4429]">
          <View
            className={
              isCompact ? "w-full flex-col" : "w-full flex-row flex-wrap gap-3"
            }
          >
            <View className={isCompact ? "w-full" : "min-w-[140px] flex-1"}>
              <CustomDropdownLabel label="Select Year" required>
                <CustomDropdown
                  value={year}
                  onSelect={setYear}
                  options={yearOptions}
                  placeholder="Select Year"
                />
              </CustomDropdownLabel>
            </View>
            <View className={isCompact ? "w-full" : "min-w-[140px] flex-1"}>
              {/* <Dropdown
                label="Select Quarter"
                value={quarter}
                options={quarterOptions}
                onChange={setQuarter}
              /> */}
              <CustomDropdownLabel label="Select Quarter" required>
                <CustomDropdown
                  value={quarter}
                  onSelect={setQuarter}
                  options={quarterOptions}
                  placeholder="Select Quarter"
                />
              </CustomDropdownLabel>
            </View>
            <View className={isCompact ? "w-full" : "min-w-[160px] flex-1"}>
              <CustomDropdownLabel label="Select Activity Area" required>
                <CustomDropdown
                  value={activity}
                  onSelect={setActivity}
                  options={activityOptions}
                  placeholder="Select Activity Area"
                />
              </CustomDropdownLabel>
            </View>
          </View>

          {!filtersComplete ? (
            <Text className="mt-3 text-[13px] text-yellow-500">
              Select year, quarter, and activity area to view plan details below.
            </Text>
          ) : (
            <View className="mt-2 w-full max-w-full rounded-2xl border border-gray-200 bg-white p-4">
              <Text className="text-[15px] font-extrabold text-gray-900">
                {summaryTitle}
              </Text>
              {getPlanHTML() ? (
                <View style={{ marginTop: 12 }}>
                  <RenderHtml
                    contentWidth={width - 32}
                    source={{ html: getPlanHTML() }}
                    tagsStyles={{
                      body: {
                        fontSize: 14,
                        lineHeight: 22,
                        color: "#374151",
                      },
                      p: {
                        margin: 0,
                        marginBottom: 8,
                      },
                      ul: {
                        margin: 0,
                        paddingLeft: 20,
                      },
                      ol: {
                        margin: 0,
                        paddingLeft: 20,
                      },
                      li: {
                        marginBottom: 4,
                      },
                      b: {
                        fontWeight: 'bold',
                      },
                      strong: {
                        fontWeight: 'bold',
                      },
                      i: {
                        fontStyle: 'italic',
                      },
                      em: {
                        fontStyle: 'italic',
                      },
                      u: {
                        textDecorationLine: 'underline',
                      }
                    }}
                  />
                </View>
              ) : (
                <Text className="mt-3 text-[14px] text-gray-500 italic">
                  No plan details specified for this quarter.
                </Text>
              )}
              <Text className="mt-3 text-[14px] text-gray-500">—</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {menuOpen ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 flex-row">
              <GestureDetector gesture={drawerPan}>
                <View
                  className="h-full w-[88%] max-w-[380px] overflow-hidden rounded-tr-3xl bg-white shadow-2xl"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 4, height: 0 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                    elevation: 16,
                  }}
                >
                  <SideMenu
                    items={menuItems}
                    activeItemId="two-year-plan"
                    onSelectItem={handleMenuSelect}
                    expandedParentIds={expandedParentIds}
                    onToggleParent={(parentId) =>
                      setExpandedParentIds((prev) => ({
                        ...prev,
                        [parentId]: !prev[parentId],
                      }))
                    }
                    onClose={closeMenu}
                    userName={currentUserName}
                    userSubtitle={headerTitle}
                    onChangePassword={() => {
                      setMenuOpen(false);
                      navigation.replace("ChangePassword");
                    }}
                    onLogout={() => {
                      setMenuOpen(false);
                      navigation?.dispatch(
                        CommonActions.reset({
                          index: 0,
                          routes: [{ name: "Login" }],
                        })
                      );
                    }}
                  />
                </View>
              </GestureDetector>

              <Pressable
                className="flex-1 bg-black/45"
                onPress={closeMenu}
                accessibilityRole="button"
                accessibilityLabel="Dismiss menu"
              />
            </View>
          </GestureHandlerRootView>
        </View>
      ) : null}

      <StatusModal
        visible={status !== null}
        type="error"
        title={status?.title}
        message={status?.message}
        onClose={() => setStatus(null)}
      />
    </View>
  );
}