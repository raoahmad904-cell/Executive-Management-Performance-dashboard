import { useNavigation } from "@react-navigation/native";
import React, { useLayoutEffect, useState, useEffect } from "react";
import { ActivityIndicator, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DirectivesSection from "../components/DirectivesSection";
import FullscreenLandscapeCard from "../components/FullscreenLandscapeCard";
import StatCard from "../components/StatCard";
import YearlyTrendlineChart from "../components/YearlyTrendlineChart";

const PROGRESS_FACET_OPTIONS = [
  { label: "Directives", value: "Directives" },
  { label: "Tasks", value: "Tasks" },
];

const DESIGNATION_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Member", value: "Member" },
  { label: "Consultant", value: "Consultant" },
  { label: "Secretary", value: "Secretary" },
  { label: "Additional Secretary", value: "Additional Secretary" },
  { label: "JS Admin", value: "JS Admin" },
  { label: "Chief Economist", value: "Chief Economist" },  
  { label: "JCE", value: "JCE" },
  { label: "Sector Specialist", value: "Sector Specialist" },
  { label: "Project Director", value: "Project Director" },
];

export default function DashboardHome() {
  const [progressFacet, setProgressFacet] = useState("Directives");
  const [designation, setDesignation] = useState("All");
  const [officer, setOfficer] = useState("All");
  const [officerOptions, setOfficerOptions] = useState([{ label: "All", value: "All" }]);
  const [stats, setStats] = useState({ total: 0, completed: 0, inProcess: 0, overdue: 0 });
  const [statLists, setStatLists] = useState({ completed: [], inProcess: [], overdue: [] });
  const [trendData, setTrendData] = useState(null);

  // Stat card modal details state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Dashboard` });
  }, [nav]);

  const openStatDetails = (label, items) => {
    setModalTitle(`${progressFacet} - ${label}`);
    setModalItems(items);
    setModalLoading(false);
    setModalVisible(true);
  };

  // 1. Fetch officers list when designation changes.
  // Sourced from the plain, unfiltered /api/auth/users list (pre-existing,
  // untouched endpoint) and filtered client-side by designation.
  useEffect(() => {
    setOfficer("All");
    if (designation === "All") {
      setOfficerOptions([{ label: "All", value: "All" }]);
      return;
    }

    const fetchOfficers = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/auth/users`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const matching = data.filter(u => u.designation === designation);
          const options = [{ label: "All", value: "All" }, ...matching.map(u => ({ label: u.name, value: u._id }))];
          setOfficerOptions(options);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOfficers();
  }, [designation]);

  function isPastDate(dateVal) {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  function parseDateSafe(v) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  // Yearly trend (12 calendar-month buckets for the current year), computed
  // from the same filtered raw records used for the stat cards - no extra
  // network call, no backend trend endpoint.
  function computeTrend(records, facet) {
    const currentYear = new Date().getFullYear();
    const months = [];
    for (let m = 0; m < 12; m++) {
      months.push({
        start: new Date(currentYear, m, 1, 0, 0, 0, 0),
        end: new Date(currentYear, m + 1, 0, 23, 59, 59, 999),
      });
    }
    const assigned = Array(12).fill(0);
    const completed = Array(12).fill(0);
    const overdue = Array(12).fill(0);
    const inProcess = Array(12).fill(0);
    const currentMonthIdx = new Date().getMonth();

    for (let m = 0; m < 12; m++) {
      const period = months[m];
      records.forEach(record => {
        let S, C, D;
        if (facet === "Tasks") {
          S = parseDateSafe(record.startDate) || parseDateSafe(record.createdAt);
          C = record.completed
            ? (parseDateSafe(record.completedAt) || parseDateSafe(record.updatedAt) || parseDateSafe(record.expectedEndDate) || parseDateSafe(record.createdAt))
            : null;
          D = parseDateSafe(record.expectedEndDate);
        } else {
          S = parseDateSafe(record.duration?.start) || parseDateSafe(record.directiveDate) || parseDateSafe(record.createdAt);
          C = record.status === "closed"
            ? (parseDateSafe(record.closedAt) || parseDateSafe(record.updatedAt) || parseDateSafe(record.duration?.end) || parseDateSafe(record.createdAt))
            : null;
          D = parseDateSafe(record.duration?.end);
        }
        if (!S) return;
        S = new Date(S); S.setHours(0, 0, 0, 0);
        if (C) { C = new Date(C); C.setHours(0, 0, 0, 0); }
        if (D) { D = new Date(D); D.setHours(0, 0, 0, 0); }

        if (S >= period.start && S <= period.end) assigned[m]++;
        if (C && C >= period.start && C <= period.end) completed[m]++;
        if (m <= currentMonthIdx && D && D <= period.end) {
          if (!C || C > period.end) overdue[m]++;
        }
        if (S <= period.end) {
          const notCompletedYet = !C || C >= period.start;
          const notOverdueYet = !D || D >= period.start;
          if (notCompletedYet && notOverdueYet) inProcess[m]++;
        }
      });
    }
    return { assigned, completed, overdue, inProcess };
  }

  // 2. Fetch stats when filters change. Computed entirely on the frontend
  // from the raw, pre-existing list endpoints (no dedicated backend
  // stats/trend endpoint is used):
  //   Directives -> GET /api/directive/threads (unfiltered = every thread)
  //   Tasks      -> GET /api/calendar/tasks/all-non-management
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem("token");

        let completed = [];
        let inProcess = [];
        let overdue = [];
        let matchedRaw = [];

        if (progressFacet === "Tasks") {
          const res = await fetch(`${API_BASE_URL}api/calendar/tasks/all-non-management`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
          const tasks = await res.json();

          tasks.forEach(t => {
            const uid = t.user?._id || t.user;
            const uDesig = t.user?.designation;
            if (officer !== "All" && String(uid) !== String(officer)) return;
            if (officer === "All" && designation !== "All" && uDesig !== designation) return;

            matchedRaw.push(t);
            const normalized = {
              _id: t._id,
              subject: t.name,
              status: t.completed ? "Completed" : (isPastDate(t.expectedEndDate) ? "Overdue" : "In Process"),
              priority: t.priority,
              user: t.user ? { name: t.user.name, designation: t.user.designation } : null,
              startDate: t.startDate,
              endDate: t.expectedEndDate,
            };
            if (normalized.status === "Completed") completed.push(normalized);
            else if (normalized.status === "Overdue") overdue.push(normalized);
            else inProcess.push(normalized);
          });
        } else {
          const res = await fetch(`${API_BASE_URL}api/directive/threads`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
          const threads = await res.json();

          threads.forEach(d => {
            const members = d.members || [];
            const matchesOfficer = officer !== "All" && members.some(m => String(m?._id) === String(officer));
            const matchesDesignation = officer === "All" && designation !== "All" && members.some(m => m?.designation === designation);
            const matchesAll = officer === "All" && designation === "All";
            if (!(matchesOfficer || matchesDesignation || matchesAll)) return;

            matchedRaw.push(d);
            const member = members[0];
            const normalized = {
              _id: d._id,
              subject: d.subject,
              status: d.status === "closed" ? "Completed" : (isPastDate(d.duration?.end) ? "Overdue" : "In Process"),
              priority: d.priority,
              user: member ? { name: member.name, designation: member.designation } : null,
              startDate: d.duration?.start,
              endDate: d.duration?.end,
            };
            if (normalized.status === "Completed") completed.push(normalized);
            else if (normalized.status === "Overdue") overdue.push(normalized);
            else inProcess.push(normalized);
          });
        }

        setStatLists({ completed, inProcess, overdue });
        setStats({
          total: completed.length + inProcess.length + overdue.length,
          completed: completed.length,
          inProcess: inProcess.length,
          overdue: overdue.length,
        });
        setTrendData(computeTrend(matchedRaw, progressFacet));
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setStatLists({ completed: [], inProcess: [], overdue: [] });
        setStats({ total: 0, completed: 0, inProcess: 0, overdue: 0 });
        setTrendData(null);
      }
    };
    fetchStats();
  }, [progressFacet, designation, officer]);

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="light-content" backgroundColor="#1a3a5c" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-[#0D4429] px-3 pb-4 pt-3 rounded-xl mx-4 mt-2">
          <View className="flex-row gap-1.5">
            <View className="flex-[1.15]">
              <CustomDropdownLabel label="Progress Facet">
                <CustomDropdown
                  options={PROGRESS_FACET_OPTIONS}
                  value={progressFacet}
                  onSelect={setProgressFacet}
                  placeholder="Select Progress Facet"
                />
              </CustomDropdownLabel>
            </View>

            <View className="flex-[0.92]">
              <CustomDropdownLabel label="Designation">
                <CustomDropdown
                  options={DESIGNATION_OPTIONS}
                  value={designation}
                  onSelect={setDesignation}
                  placeholder="Select Designation"
                />
              </CustomDropdownLabel>
            </View>

            <View className="flex-[0.92]">
              <CustomDropdownLabel label="Officer">
                <CustomDropdown
                  options={officerOptions}
                  value={officer}
                  onSelect={setOfficer}
                  placeholder="Select Officer"
                />
              </CustomDropdownLabel>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row px-4">
          <StatCard
            label="Total"
            value={String(stats.total)}
            color="#1a3a5c"
            iconName="bar-chart-outline"
            bgTint="#E8EEF5"
            onPress={() => openStatDetails("Total", [...statLists.completed, ...statLists.inProcess, ...statLists.overdue])}
          />
          <StatCard
            label="Completed"
            value={String(stats.completed)}
            color="#15803d"
            iconName="checkmark-circle-outline"
            bgTint="#DCFCE7"
            onPress={() => openStatDetails("Completed", statLists.completed)}
          />
          <StatCard
            label="In Process"
            value={String(stats.inProcess)}
            color="#1d4ed8"
            iconName="sync-outline"
            bgTint="#DBEAFE"
            onPress={() => openStatDetails("In Process", statLists.inProcess)}
          />
          <StatCard
            label="Overdue"
            value={String(stats.overdue)}
            color="#b91c1c"
            iconName="alert-circle-outline"
            bgTint="#FEE2E2"
            onPress={() => openStatDetails("Overdue", statLists.overdue)}
          />
        </View>

        <View className="mt-2 px-4">
          <FullscreenLandscapeCard
            title="Yearly trendline"
            renderChart={(w, h, opts) => (
              <YearlyTrendlineChart
                width={w}
                height={h}
                expanded={opts?.expanded === true}
                trendData={trendData}
              />
            )}
          />
        </View>

        <DirectivesSection />
      </ScrollView>

      {/* ── Custom Stat Details Modal (Identical Style to Tasks & MoMs) ── */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 360,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 18 }}>
              {/* Header Icon + Title */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 14 }}>
                  <Ionicons name="bar-chart-outline" size={34} color="#0D4429" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#111827', marginTop: 10, textAlign: 'center' }}>
                  {modalTitle}{modalLoading ? '' : ` (${modalItems.length})`}
                </Text>
              </View>

              {/* Modal Body */}
              {modalLoading ? (
                <View style={{ paddingVertical: 35, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#0D4429" />
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>Loading items...</Text>
                </View>
              ) : modalItems.length === 0 ? (
                <View style={{ paddingVertical: 35, alignItems: 'center' }}>
                  <Ionicons name="folder-open-outline" size={36} color="#9CA3AF" />
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 8 }}>No records found.</Text>
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: 360 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={{ gap: 10 }}>
                    {modalItems.map((item, idx) => {
                      const titleStr = item.subject || item.title || "Untitled";
                      const isCompleted = item.status === 'Completed';
                      const isOverdue = item.status === 'Overdue';
                      const statusBg = isCompleted ? '#DCFCE7' : isOverdue ? '#FEE2E2' : '#DBEAFE';
                      const statusColor = isCompleted ? '#15803D' : isOverdue ? '#B91C1C' : '#1D4ED8';

                      const prio = item.priority || 'Medium';
                      const prioBg = String(prio).toLowerCase() === 'high' ? '#FEE2E2' : String(prio).toLowerCase() === 'medium' ? '#FEF3C7' : '#F3F4F6';
                      const prioColor = String(prio).toLowerCase() === 'high' ? '#B91C1C' : String(prio).toLowerCase() === 'medium' ? '#B45309' : '#374151';

                      const uName = item.user?.name || "Unassigned";
                      const uDesig = item.user?.designation ? ` (${item.user.designation})` : "";

                      const formatDateClean = (dateVal) => {
                        if (!dateVal) return "";
                        const str = String(dateVal).trim();
                        if (str.includes("T")) {
                          return str.split("T")[0];
                        }
                        if (str.length > 10) {
                          const d = new Date(str);
                          if (!isNaN(d.getTime())) {
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          }
                        }
                        return str;
                      };

                      const startStr = formatDateClean(item.startDate || item.directiveDate);
                      const endStr = formatDateClean(item.endDate);

                      return (
                        <View
                          key={item._id || idx}
                          style={{
                            backgroundColor: '#F9FAFB',
                            borderRadius: 14,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB'
                          }}
                        >
                          {/* Row 1: Title & Status Badge */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8, lineHeight: 20 }}>
                              #{idx + 1}. {titleStr}
                            </Text>
                            <View style={{ backgroundColor: statusBg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>
                                {item.status || 'In Process'}
                              </Text>
                            </View>
                          </View>

                          {/* Row 2: User Name & Designation */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Ionicons name="person-circle-outline" size={15} color="#0D4429" style={{ marginRight: 5 }} />
                            <Text style={{ fontSize: 12, color: '#374151', fontWeight: '600', flex: 1 }} numberOfLines={2}>
                              {uName}{uDesig}
                            </Text>
                          </View>

                          {/* Row 3: Priority Badge */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', marginRight: 6 }}>Priority:</Text>
                            <View style={{ backgroundColor: prioBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: prioColor }}>
                                {String(prio).toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          {/* Row 4: Clean Formatted Dates */}
                          {(startStr || endStr) ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', gap: 12 }}>
                              <Ionicons name="calendar-outline" size={13} color="#6B7280" style={{ marginRight: -4 }} />
                              {startStr ? (
                                <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>Start: <Text style={{ fontWeight: '700', color: '#374151' }}>{startStr}</Text></Text>
                              ) : null}
                              {endStr ? (
                                <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>End: <Text style={{ fontWeight: '700', color: '#374151' }}>{endStr}</Text></Text>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#0D4429',
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginTop: 14
                }}
                activeOpacity={0.8}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 15 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
