import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, getPaginationRange } from "../../../utils/utils.js";
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DirectiveCard from "./DirectiveCard";

const PAGE_SIZE = 5;

const MONTH_OPTIONS = [
  { label: "All", value: "All" },
  ...[
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ].map((m) => ({ label: m, value: m })),
];

const YEAR_OPTIONS = [
  { label: "All", value: "All" },
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Completed", value: "Completed" },
  { label: "Overdue", value: "Overdue" },
  { label: "In Process", value: "In Process" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isPastDate(dateVal) {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export default function DirectivesSection() {
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  const [allThreads, setAllThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch every directive thread once from the pre-existing endpoint;
  // month/year/status filtering and pagination are computed client-side.
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}api/directive/threads`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllThreads(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Directives fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const filtered = allThreads
    .map(d => {
      const effectiveDate = d.duration?.start || d.directiveDate || d.createdAt;
      const derivedStatus = d.status === "closed" ? "Completed" : (isPastDate(d.duration?.end) ? "Overdue" : "In Process");
      return { raw: d, effectiveDate, derivedStatus };
    })
    .filter(({ effectiveDate, derivedStatus }) => {
      if (status !== "All" && derivedStatus !== status) return false;
      if (month !== "All" || year !== "All") {
        const dateObj = effectiveDate ? new Date(effectiveDate) : null;
        if (!dateObj || isNaN(dateObj.getTime())) return false;
        if (year !== "All" && String(dateObj.getFullYear()) !== year) return false;
        if (month !== "All" && MONTH_NAMES[dateObj.getMonth()] !== month) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.raw.createdAt) - new Date(a.raw.createdAt))
    .map(({ raw, derivedStatus }) => {
      const member = (raw.members || [])[0];
      return {
        id: raw._id,
        subject: raw.subject,
        startDate: raw.duration?.start || "N/A",
        endDate: raw.duration?.end || "N/A",
        status: derivedStatus,
        users: member ? member.name : "N/A",
      };
    });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const directives = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusTab = (s) => {
    setStatus(s);
    setPage(1);
  };

  return (
    <View className="mt-2 px-4">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-800">All Directives</Text>
        <Text className="text-xs text-gray-400">{totalCount} records</Text>
      </View>

      <View className="flex-row bg-[#0D4429] rounded-xl p-2 mb-2">
        {/* Month */}
        <View className="flex-1 mr-1">
          <CustomDropdownLabel label="Month">
            <CustomDropdown
              options={MONTH_OPTIONS}
              value={month}
              onSelect={(v) => {
                setMonth(v);
                setPage(1);
              }}
              placeholder="Select Month"
            />
          </CustomDropdownLabel>
        </View>

        {/* Year */}
        <View className="flex-1 ml-1">
          <CustomDropdownLabel label="Year">
            <CustomDropdown
              options={YEAR_OPTIONS}
              value={year}
              onSelect={(v) => {
                setYear(v);
                setPage(1);
              }}
              placeholder="Select Year"
            />
          </CustomDropdownLabel>
        </View>
      </View>

      {/* Status Tab Pills — Non-scrollable flex-1 layout */}
      <View className="flex-row mb-4" style={{ gap: 6 }}>
        {STATUS_OPTIONS.map((s) => {
          const active = status === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              onPress={() => handleStatusTab(s.value)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: active ? "#0D4429" : "#FFFFFF",
                borderColor: active ? "#0D4429" : "#E5E7EB",
                borderWidth: 1,
                borderRadius: 999,
                paddingVertical: 8,
                paddingHorizontal: 2,
                alignItems: "center",
                justifyContent: "center",
                elevation: active ? 2 : 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: active ? 0.08 : 0,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: "700",
                  color: active ? "#FFFFFF" : "#4B5563",
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cards & Load States */}
      {loading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator size="large" color="#0D4429" />
          <Text className="text-gray-400 text-xs mt-2">Loading directives...</Text>
        </View>
      ) : directives.length === 0 ? (
        <View className="items-center py-10">
          <Text className="text-3xl mb-2">📭</Text>
          <Text className="text-gray-400 text-sm">No directives found</Text>
        </View>
      ) : (
        directives.map((item, i) => (
          <DirectiveCard
            key={item.id}
            item={item}
            index={(page - 1) * PAGE_SIZE + i + 1}
          />
        ))
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="flex-row flex-wrap items-center justify-center gap-2 mt-2 mb-4">
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`w-8 h-8 rounded-lg items-center justify-center border ${page === 1 ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}
          >
            <Text className={`text-sm ${page === 1 ? "text-gray-300" : "text-gray-600"}`}>‹</Text>
          </TouchableOpacity>

          {getPaginationRange(page, totalPages).map((p, idx) =>
            p === '...' ? (
              <View key={`ellipsis-${idx}`} className="w-8 h-8 items-center justify-center">
                <Text className="text-xs font-bold text-gray-400">…</Text>
              </View>
            ) : (
              <TouchableOpacity
                key={p}
                onPress={() => setPage(p)}
                className={`w-8 h-8 rounded-lg items-center justify-center ${page === p ? "bg-[#0D4429]" : "bg-white border border-gray-200"}`}
              >
                <Text className={`text-xs font-bold ${page === p ? "text-white" : "text-gray-600"}`}>{p}</Text>
              </TouchableOpacity>
            )
          )}

          <TouchableOpacity
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`w-8 h-8 rounded-lg items-center justify-center border ${page === totalPages ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}
          >
            <Text className={`text-sm ${page === totalPages ? "text-gray-300" : "text-gray-600"}`}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
