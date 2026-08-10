import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomDropdown from "../../../components/forms/CustomDropdown";
import CustomDropdownLabel from "../../../components/forms/CustomDropdownLabel";
import DateFilterField from "../../../utils/DateFilterField";
import { formatCompletedAt } from "../../../utils/utils";
import { EMBLEM_BASE64 } from "../../../utils/logoBase64";
import * as Print from 'expo-print';
import StatusModal from "../../../components/common/StatusModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const labelCls = "mb-1 text-sm font-semibold text-white/95";
const triggerCls = "rounded-xl border-0 bg-white px-3 h-12";

const ITEMS_PER_PAGE = 5;

function parseDate(str) {
  if (!str) return null;
  const cleaned = String(str).trim();

  // Format 1: MM/DD/YYYY
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2].split('T')[0], 10);
      if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
        const date = new Date(y, m - 1, d);
        if (!isNaN(date.getTime())) return date;
      }
    }
  }

  // Format 2: YYYY-MM-DD or DD-MM-YYYY
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2].split('T')[0], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
          const date = new Date(y, m - 1, d);
          if (!isNaN(date.getTime())) return date;
        }
      } else {
        // DD-MM-YYYY or MM-DD-YYYY
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2].split('T')[0], 10);
        if (!isNaN(m) && !isNaN(d) && !isNaN(y)) {
          let date = new Date(y, m - 1, d);
          if (m > 12) {
            // MM-DD-YYYY
            date = new Date(y, d - 1, m);
          }
          if (!isNaN(date.getTime())) return date;
        }
      }
    }
  }

  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { label: '--All Categories--', value: '' },
  { label: 'Minister Directive', value: 'Minister directive' },
  { label: 'Meeting Directive', value: 'Meeting Directives' },
  { label: 'Routine', value: 'Routine' },
];

const PRIORITY_COLORS = {
  High: { bg: 'bg-red-100', text: 'text-red-600', stripe: 'bg-red-400' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-600', stripe: 'bg-amber-400' },
  Low: { bg: 'bg-green-100', text: 'text-green-600', stripe: 'bg-green-400' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewAllTasksScreen({ tasks, onViewTask, onComplete, onDelete, onClose, currentUser, usersList = [] }) {
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(0);

  // Custom Modal States
  const [selectedViewTask, setSelectedViewTask] = useState(null);
  const [deleteTargetTask, setDeleteTargetTask] = useState(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [status, setStatus] = useState(null); // { type, title, message }

  const isManagement = useMemo(() => {
    const roleLower = currentUser?.role ? currentUser.role.toLowerCase() : '';
    return roleLower === 'management' || roleLower === 'admin' || roleLower === 'jmanagement';
  }, [currentUser]);

  const userOptions = useMemo(() => {
    const opts = [{ label: '--Select User--', value: '' }];

    if (currentUser) {
      opts.push({
        label: `${currentUser.name} (Self - ${currentUser.designation})`,
        value: currentUser._id || currentUser.id
      });
    }

    usersList.forEach(u => {
      const uId = u._id || u.id;
      const currentUserId = currentUser?._id || currentUser?.id;
      if (uId !== currentUserId) {
        opts.push({
          label: `${u.name} (${u.designation})`,
          value: uId
        });
      }
    });
    return opts;
  }, [usersList, currentUser]);

  // "assignedBy" on older tasks is a raw User ObjectId (the backend doesn't
  // populate it on the list endpoints) - resolve it to a display name here.
  const nameById = useMemo(() => {
    const map = {};
    usersList.forEach(u => { map[u._id || u.id] = u.name; });
    if (currentUser) map[currentUser._id || currentUser.id] = currentUser.name;
    return map;
  }, [usersList, currentUser]);

  function resolveAssignedBy(assignedBy) {
    if (!assignedBy) return 'Self';
    return nameById[assignedBy] || assignedBy;
  }

  function applySearch() {
    setPage(0);
  }

  function clearFilters() {
    setSearchText('');
    setFilterCategory('');
    setFilterUser('');
    setFromDate(null);
    setToDate(null);
    setPage(0);
  }

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      if (isManagement) {
        const taskUserId = task.user?._id || task.user?.id || task.user;
        const currentUserId = currentUser?._id || currentUser?.id;
        if (filterUser) {
          if (String(taskUserId) !== String(filterUser)) {
            return false;
          }
        } else {
          if (String(taskUserId) !== String(currentUserId)) {
            return false;
          }
        }
      }

      const title = task.title || task.name || '';
      if (searchText.trim() && !title.toLowerCase().includes(searchText.trim().toLowerCase())) {
        return false;
      }

      if (filterCategory) {
        const cat = task.category || '';
        if (cat.trim().toLowerCase() !== filterCategory.trim().toLowerCase()) {
          return false;
        }
      }

      if (fromDate || toDate) {
        const startD = parseDate(task.startDate);
        const endD = parseDate(task.endDate || task.startDate);

        if (fromDate && startD) {
          startD.setHours(0, 0, 0, 0);
          const f = new Date(fromDate);
          if (!isNaN(f.getTime())) {
            f.setHours(0, 0, 0, 0);
            if (startD < f) return false;
          }
        }

        if (toDate && endD) {
          endD.setHours(0, 0, 0, 0);
          const t = new Date(toDate);
          if (!isNaN(t.getTime())) {
            t.setHours(0, 0, 0, 0);
            if (endD > t) return false;
          }
        }

        if (fromDate && !startD) return false;
        if (toDate && !endD) return false;
      }
      return true;
    });
  }, [tasks, searchText, filterCategory, filterUser, fromDate, toDate, isManagement, currentUser]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageData = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  async function executeDeleteTask() {
    if (!deleteTargetTask) return;
    const { id, dateKey } = deleteTargetTask;
    setDeleteTargetTask(null);
    if (onDelete) {
      await onDelete(id, dateKey);
    }
    setShowDeleteSuccessModal(true);
  }

  async function handlePrint() {
    if (filtered.length === 0) {
      setStatus({ type: "warning", title: "Notice", message: "No tasks available to print." });
      return;
    }

    try {
      const rowsHtml = filtered.map((task, idx) => `
        <tr>
          <td style="text-align: center; border: 1px solid #000; padding: 8px; font-size: 11px;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; font-weight: bold;">${task.title || task.name}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${task.category || 'Routine'}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${task.priority || 'Medium'}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${task.startDate || '-'}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center;">${task.endDate || '-'}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px; text-align: center; font-weight: bold; color: ${task.status === 'Completed' ? '#157347' : task.status === 'Overdue' ? '#dc2626' : '#d97706'}">${task.status || 'In Process'}</td>
          <td style="border: 1px solid #000; padding: 8px; font-size: 11px;">${task.description || '-'}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 20px; color: #111827; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .header-cell { vertical-align: middle; }
          .logo-cell { width: 15%; }
          .logo-img { width: 80px; height: auto; }
          .title-cell { width: 70%; text-align: center; }
          .title-govt { font-size: 14px; font-weight: bold; color: #0D4429; text-transform: uppercase; }
          .title-main { font-size: 18px; font-weight: bold; color: #0D4429; margin-top: 5px; }
          .side-cell { width: 15%; }
          .data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .data-table th, .data-table td { border: 1px solid #000; padding: 8px; font-size: 11px; text-align: left; }
          .data-table th { background-color: #f2f2f2; font-weight: bold; }
          .data-table tr:nth-child(even) { background-color: #fafafa; }
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
              <div class="title-main" style="margin-top: 10px; font-size: 15px; font-weight: bold; text-decoration: underline;">Tasks Progress Report</div>
            </td>
            <td class="header-cell side-cell"></td>
          </tr>
        </table>
        <div style="margin-bottom: 20px; font-size: 13px; line-height: 1.6; color: #374151;">
          <div><span style="font-weight: bold;">Name:</span> ${currentUser?.name || 'Test User'}</div>
          <div><span style="font-weight: bold;">Designation:</span> ${currentUser?.designation || 'Member'}</div>
          <div><span style="font-weight: bold;">Report Date:</span> ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">Sr No</th>
              <th style="width: 20%;">Task Title</th>
              <th style="width: 12%;">Category</th>
              <th style="width: 10%; text-align: center;">Priority</th>
              <th style="width: 11%; text-align: center;">Start Date</th>
              <th style="width: 11%; text-align: center;">End Date</th>
              <th style="width: 11%; text-align: center;">Status</th>
              <th style="width: 20%;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
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
      setStatus({ type: "error", title: "Print Failed", message: "An error occurred while preparing the PDF for printing." });
    }
  }

  return (
    <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl bg-[#0D4429]" style={{ padding: 16 }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ── Filter Header ─────────────────────────────────────────────── */}
        <View className="pb-3">
          {/* Title + Close */}
          <View className="flex-row items-center justify-end mb-4">
            <TouchableOpacity
              onPress={onClose}
              className="flex-row items-center bg-white rounded-xl px-4 py-2.5"
              activeOpacity={0.8}
            >
              <Text className="text-[#1B5E3B] font-bold text-sm">← Back</Text>
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View className="flex-row items-center bg-white rounded-xl px-4 h-12 mb-2">
            <Text className="text-gray-400 mr-2 text-base">🔍</Text>
            <TextInput
              className="text-gray-700 text-sm flex-1"
              style={{ height: '100%', paddingVertical: 0 }}
              placeholder="Search tasks by title..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              onSubmitEditing={applySearch}
            />
          </View>

          {/* User filter */}
          {isManagement && (
            <View className="mb-2">
              <CustomDropdownLabel label="User" required>
                <CustomDropdown
                  value={filterUser}
                  onSelect={setFilterUser}
                  options={userOptions}
                  placeholder="Select User"
                />
              </CustomDropdownLabel>
            </View>
          )}

          {/* Category filter */}
          <View className="mb-2">
            <CustomDropdownLabel label="Category" required>
              <CustomDropdown
                value={filterCategory}
                onSelect={setFilterCategory}
                options={CATEGORY_OPTIONS}
                placeholder="Select Category"
              />
            </CustomDropdownLabel>
          </View>

          {/* Date range */}
          <View className="flex-row mb-2" style={{ gap: 12 }}>
            <View className="flex-1">
              <DateFilterField label="From Date" value={fromDate} onSelect={setFromDate} labelClassName={labelCls} triggerClassName={triggerCls} />
            </View>
            <View className="flex-1">
              <DateFilterField label="To Date" value={toDate} onSelect={setToDate} labelClassName={labelCls} triggerClassName={triggerCls} />
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              className="flex-1 bg-amber-400 rounded-xl py-2 items-center"
              onPress={applySearch}
              activeOpacity={0.85}
            >
              <Text className="text-[#0D4429] font-bold text-sm">Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-xl py-2 items-center border border-white/30"
              onPress={clearFilters}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-sm">Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-10 h-9 rounded-xl bg-white/20 items-center justify-center"
              activeOpacity={0.8}
              onPress={handlePrint}
            >
              <Text className="text-white text-base">🖨️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Task Card List ─────────────────────────────────────────────── */}
        {pageData.length === 0 ? (
          <View className="py-12 items-center justify-center px-8">
            <Text className="mb-4" style={{ fontSize: 48, lineHeight: 60 }}>🔍</Text>
            <Text className="text-gray-200 text-base font-semibold">No tasks found</Text>
            <Text className="text-white/60 text-sm mt-1 text-center">
              Try adjusting your search filters
            </Text>
          </View>
        ) : (
          <View className="py-3">
            {pageData.map((task, idx) => {
              const done = task.status === 'Completed';
              const globalIdx = page * ITEMS_PER_PAGE + idx;
              const priC = PRIORITY_COLORS[task.priority] || { bg: 'bg-gray-100', text: 'text-gray-600', stripe: 'bg-gray-300' };

              const taskUserId = task.user?._id || task.user?.id || (typeof task.user === 'string' ? task.user : null);
              const currentUserId = currentUser?._id || currentUser?.id || (typeof currentUser === 'string' ? currentUser : null);
              const isOwnTask = !isManagement || (taskUserId && currentUserId && String(taskUserId) === String(currentUserId));

              return (
                <View
                  key={task.id}
                  className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-100"
                  style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
                >
                  <View className="flex-row">
                    {/* Priority stripe */}
                    <View className={`w-1.5 ${priC.stripe}`} />

                    <View className="flex-1 p-4">
                      {/* Row 1 — number + title + status badge */}
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-row items-start flex-1 mr-2">
                          <Text className="text-gray-400 text-sm mr-2 mt-0.5">#{globalIdx + 1}</Text>
                          <Text className="text-gray-900 text-base font-bold flex-1" numberOfLines={2}>
                            {task.title}
                          </Text>
                        </View>
                        <View className={`rounded-full px-3 py-1 ${done ? 'bg-green-100' : 'bg-amber-100'}`}>
                          <Text className={`text-xs font-bold ${done ? 'text-green-700' : 'text-amber-700'}`}>
                            {task.status}
                          </Text>
                        </View>
                      </View>

                      {/* Row 2 — category + priority badge */}
                      <View className="flex-row items-center mb-1.5" style={{ gap: 8 }}>
                        <Text className="text-gray-500 text-sm flex-1" numberOfLines={1}>
                          {task.category}
                        </Text>
                        <View className={`rounded-full px-3 py-0.5 ${priC.bg}`}>
                          <Text className={`text-xs font-semibold ${priC.text}`}>{task.priority}</Text>
                        </View>
                      </View>

                      {/* Row 3 — dates */}
                      <View className="flex-row items-center mb-1" style={{ gap: 6 }}>
                        <Text className="text-gray-400 text-xs">Start: {task.startDate}</Text>
                        <Text className="text-gray-300">·</Text>
                        <Text className="text-gray-400 text-xs">End: {task.endDate}</Text>
                      </View>

                      {/* Row 4 — assigned by */}
                      <Text className="text-gray-400 text-xs mb-1">By: {resolveAssignedBy(task.assignedBy)}</Text>
                      {isManagement && task.user && (
                        <Text className="text-[#0D4429] font-semibold text-xs mb-1">
                          User: {task.user.name} ({task.user.designation})
                        </Text>
                      )}
                      {done && task.completedAt && (
                        <Text className="text-gray-400 text-xs mb-1">Completed: {formatCompletedAt(task.completedAt)}</Text>
                      )}

                      {/* Action buttons */}
                      <View className="flex-row mt-3" style={{ gap: 8 }}>
                        <TouchableOpacity
                          className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 items-center"
                          onPress={() => setSelectedViewTask(task)}
                          activeOpacity={0.8}
                        >
                          <Text className="text-[#1B5E3B] font-semibold text-sm">View</Text>
                        </TouchableOpacity>
                        {isOwnTask && !done && (
                          <TouchableOpacity
                            className="flex-1 py-2.5 rounded-xl bg-green-500 items-center"
                            onPress={() => onComplete(task.id, task.dateKey)}
                            activeOpacity={0.8}
                          >
                            <Text className="text-white font-semibold text-sm">Complete</Text>
                          </TouchableOpacity>
                        )}
                        {isOwnTask && !done && (
                          <TouchableOpacity
                            className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 items-center"
                            onPress={() => setDeleteTargetTask(task)}
                            activeOpacity={0.8}
                          >
                            <Text className="text-red-500 font-semibold text-sm">Delete</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between rounded-xl bg-white px-3 mt-2" style={{ paddingTop: 6, paddingBottom: 6 }}>
          <TouchableOpacity
            className={`px-5 py-3 rounded-xl ${page === 0 ? 'bg-gray-100' : 'bg-[#1B5E3B]'}`}
            onPress={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            activeOpacity={0.8}
          >
            <Text className={`text-sm font-semibold ${page === 0 ? 'text-gray-400' : 'text-white'}`}>
              ← Prev
            </Text>
          </TouchableOpacity>

          <Text className="text-gray-600 text-sm font-medium">
            {filtered.length > 0
              ? `Page ${page + 1} of ${totalPages}  ·  ${filtered.length} task${filtered.length !== 1 ? 's' : ''}`
              : '—'}
          </Text>

          <TouchableOpacity
            className={`px-5 py-3 rounded-xl ${page >= totalPages - 1 ? 'bg-gray-100' : 'bg-[#1B5E3B]'}`}
            onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            activeOpacity={0.8}
          >
            <Text className={`text-sm font-semibold ${page >= totalPages - 1 ? 'text-gray-400' : 'text-white'}`}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── 1. Custom View Task Details Modal ───────────────────────────── */}
      <Modal
        visible={selectedViewTask !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedViewTask(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            borderWidth: 3,
            borderColor: '#0D4429',
            width: '100%',
            maxWidth: 350,
            padding: 8,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10
          }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 18, padding: 20 }}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 16 }}>
                  <Ionicons name="document-text-outline" size={38} color="#0D4429" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 12 }}>
                  Task Details
                </Text>
              </View>

              {selectedViewTask && (
                <ScrollView style={{ maxHeight: 300, marginBottom: 16 }} showsVerticalScrollIndicator={true}>
                  <View style={{ gap: 12 }}>
                    {/* Title */}
                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 }}>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Task Title</Text>
                      <Text style={{ fontSize: 15, color: '#111827', fontWeight: '700', marginTop: 2 }}>{selectedViewTask.title || selectedViewTask.name}</Text>
                    </View>

                    {/* Category & Priority */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Category</Text>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2 }}>{selectedViewTask.category || 'Routine'}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Priority</Text>
                        <Text style={{ fontSize: 14, color: selectedViewTask.priority === 'High' ? '#DC2626' : selectedViewTask.priority === 'Medium' ? '#D97706' : '#16A34A', fontWeight: '700', marginTop: 2 }}>
                          {selectedViewTask.priority || 'Medium'}
                        </Text>
                      </View>
                    </View>

                    {/* Status */}
                    <View style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 }}>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Status</Text>
                      <Text style={{ fontSize: 14, color: selectedViewTask.status === 'Completed' ? '#16A34A' : '#D97706', fontWeight: '700', marginTop: 2 }}>
                        {selectedViewTask.status || 'In Process'}
                        {selectedViewTask.completedAt ? ` (${formatCompletedAt(selectedViewTask.completedAt)})` : ''}
                      </Text>
                    </View>

                    {/* Dates */}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Start Date</Text>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2 }}>{selectedViewTask.startDate || '-'}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>End Date</Text>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2 }}>{selectedViewTask.endDate || '-'}</Text>
                      </View>
                    </View>

                    {/* Assigned By */}
                    <View>
                      <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Assigned By</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2 }}>{selectedViewTask.assignedBy || 'Self'}</Text>
                    </View>

                    {/* Description */}
                    {selectedViewTask.description ? (
                      <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Description</Text>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2, lineHeight: 20 }}>{selectedViewTask.description}</Text>
                      </View>
                    ) : null}

                    {/* Remarks */}
                    {selectedViewTask.remarks ? (
                      <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' }}>Remarks</Text>
                        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '700', marginTop: 2, lineHeight: 20 }}>{selectedViewTask.remarks}</Text>
                      </View>
                    ) : null}
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedViewTask(null)}
                style={{
                  width: '100%',
                  backgroundColor: '#0D4429',
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 2. Custom Delete Confirmation Modal ─────────────────────────── */}
      <Modal
        visible={deleteTargetTask !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteTargetTask(null)}
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
                <Ionicons name="trash-outline" size={40} color="#0D4429" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Delete Task
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 22, lineHeight: 20 }}>
                Are you sure you want to delete <Text style={{ fontWeight: 'bold', color: '#111827' }}>"{deleteTargetTask?.title || deleteTargetTask?.name}"</Text>? This action cannot be undone.
              </Text>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeleteTargetTask(null)}
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
                  onPress={executeDeleteTask}
                  style={{
                    flex: 1,
                    backgroundColor: '#DC2626',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── 3. Custom Delete Verification / Success Modal ────────────────── */}
      <Modal
        visible={showDeleteSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccessModal(false)}
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
                Task Deleted
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 22, lineHeight: 20 }}>
                Task has been deleted successfully!
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowDeleteSuccessModal(false)}
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

      <StatusModal
        visible={status !== null}
        type={status?.type}
        title={status?.title}
        message={status?.message}
        onClose={() => setStatus(null)}
      />
    </View>
  );
}