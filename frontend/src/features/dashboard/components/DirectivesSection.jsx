import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
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

export default function DirectivesSection() {
  const [month, setMonth] = useState("All");
  const [year, setYear] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);
  
  const [directives, setDirectives] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch directives list from backend
  useEffect(() => {
    const fetchDirectives = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(
          `${API_BASE_URL}api/dashboard/directives?month=${month}&year=${year}&status=${status}&page=${page}&limit=${PAGE_SIZE}`,
          { headers: { "Authorization": `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setDirectives(data.directives || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
        }
      } catch (err) {
        console.error("Directives fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDirectives();
  }, [month, year, status, page]);

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

      {/* Status Tab Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
        <View className="flex-row gap-2">
          {STATUS_OPTIONS.map((s) => {
            const active = status === s.value;
            const colors = {
              All: active ? "bg-gray-800" : "bg-white border-gray-200",
              Completed: active ? "bg-green-600" : "bg-white border-gray-200",
              Overdue: active ? "bg-red-500" : "bg-white border-gray-200",
              "In Process": active ? "bg-blue-600" : "bg-white border-gray-200",
            };
            return (
              <TouchableOpacity
                key={s.value}
                onPress={() => handleStatusTab(s.value)}
                className={`px-4 py-1.5 rounded-full border ${colors[s.value]}`}
              >
                <Text className={`text-xs font-semibold ${active ? "text-white" : "text-gray-500"}`}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
        <View className="flex-row items-center justify-center gap-2 mt-2 mb-4">
          <TouchableOpacity
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`w-8 h-8 rounded-lg items-center justify-center border ${page === 1 ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"}`}
          >
            <Text className={`text-sm ${page === 1 ? "text-gray-300" : "text-gray-600"}`}>‹</Text>
          </TouchableOpacity>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setPage(p)}
              className={`w-8 h-8 rounded-lg items-center justify-center ${page === p ? "bg-[#0D4429]" : "bg-white border border-gray-200"}`}
            >
              <Text className={`text-xs font-bold ${page === p ? "text-white" : "text-gray-600"}`}>{p}</Text>
            </TouchableOpacity>
          ))}

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
