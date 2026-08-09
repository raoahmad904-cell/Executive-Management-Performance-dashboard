import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import React, { useLayoutEffect, useMemo, useState, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import AttachMinutesForm from "./AttachMinutesForm";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const ACCENT        = "#0D4429";
const ITEMS_PER_PAGE = 5;

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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MinutesOfMeeting() {
  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: "Minutes of Meeting" });
  }, [nav]);

  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [query,      setQuery]      = useState("");
  const [page,       setPage]       = useState(0);
  const [showForm,   setShowForm]   = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [viewTargetItem, setViewTargetItem] = useState(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showAttachSuccessModal, setShowAttachSuccessModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) {
          const user = JSON.parse(uStr);
          setCurrentUser(user);
          await loadMoMs(user);
        }
      } catch (err) {
        console.error("Error loading user:", err);
      }
    };
    init();
  }, []);

  async function loadMoMs(userObj) {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const role = userObj.role?.toLowerCase() || '';
      const isMgmt = role === 'management' || role === 'admin' || role === 'jmanagement';

      const endpoint = isMgmt ? 'api/mom/all' : 'api/mom';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map(d => ({
          id: d._id,
          subject: d.subject,
          date: formatCustomDate(d.date),
          fileNo: d.meetingNumber,
          section: d.concernedSection,
          attachment: d.attachment,
          submittedBy: d.submittedBy
        }));
        setRecords(mapped);
      } else {
        const errData = await res.json();
        console.error("Error fetching MoMs:", errData);
      }
    } catch (err) {
      console.error("Network error fetching MoMs:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAttachSubmit = async (record) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append('subject', record.subject);
      formData.append('date', record.date);
      formData.append('meetingNumber', record.meetingNumber);
      formData.append('concernedSection', record.concernedSection);

      if (record.fileAsset) {
        formData.append('attachment', {
          uri: record.fileAsset.uri,
          name: record.fileAsset.name,
          type: record.fileAsset.mimeType || 'application/octet-stream'
        });
      }

      const res = await fetch(`${API_BASE_URL}api/mom/attach`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setShowForm(false);
        setPage(0);
        if (currentUser) {
          await loadMoMs(currentUser);
        }
        setShowAttachSuccessModal(true);
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.message || "Failed to attach Minutes of Meeting.");
      }
    } catch (err) {
      console.error("Error attaching MoM:", err);
      Alert.alert("Error", "Network error. Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };



  function applySearch() {
    setQuery(searchText.trim());
    setPage(0);
  }

  function handleSearchChange(text) {
    setSearchText(text);
    setQuery(text.trim());
    setPage(0);
  }

  function clearSearch() {
    setSearchText("");
    setQuery("");
    setPage(0);
  }

  const filtered = useMemo(() => {
    if (!query) return records;
    const q = query.toLowerCase();
    return records.filter(
      (r) =>
        r.subject.toLowerCase().includes(q) ||
        r.section.toLowerCase().includes(q) ||
        r.fileNo.toLowerCase().includes(q)
    );
  }, [records, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageData   = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  function handleView(item) {
    setViewTargetItem(item);
  }

  async function handleDownload(item) {
    if (!item.attachment) {
      Alert.alert("Notice", "No file attachment found for this record.");
      return;
    }
    try {
      // The download route requires auth, and Linking.openURL can't attach a
      // Bearer token - download it locally (with the header) then share/open it.
      const token = await AsyncStorage.getItem("token");
      const url = `${API_BASE_URL}api/mom/download/${item.attachment}`;
      const localUri = FileSystem.cacheDirectory + item.attachment;
      const { uri, status } = await FileSystem.downloadAsync(url, localUri, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (status !== 200) {
        Alert.alert("Error", "Could not download the attachment.");
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Downloaded", `File saved to ${uri}`);
      }
    } catch (err) {
      console.error("Failed to download attachment:", err);
      Alert.alert("Error", "Could not download the attachment.");
    }
  }

  async function performDelete(id) {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/mom/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
        setPage(0);
        setShowDeleteSuccessModal(true);
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.message || "Failed to delete record.");
      }
    } catch (err) {
      Alert.alert("Error", "Network error. Failed to delete record.");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id) {
    setDeleteTargetId(id);
  }

  if (showForm) {
    return (
      <AttachMinutesForm
        onSubmit={handleAttachSubmit}
        onClose={() => setShowForm(false)}
      />
    );
  }

  return (
    <View
      className="mx-2 mb-2 mt-1 flex-1 rounded-2xl bg-[#0D4429]"
      style={{ padding: 16, paddingBottom: 16 }}
    >
      {/* ── Search Bar ───────────────────────────────────────────── */}
      <View className="mb-4 flex-row items-center">
        <View className="flex-1 flex-row items-center rounded-xl bg-white px-3 py-2.5">
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            className="ml-2 flex-1 text-sm text-gray-700"
            placeholder="Quick Search…"
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Cards ───────────────────────────────────────────────────────── */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {pageData.length === 0 ? (
          <View className="items-center justify-center px-8 py-20">
            <Text style={{ fontSize: 48, lineHeight: 60 }}>📄</Text>
            <Text className="mt-2 text-base font-semibold text-gray-200">
              No records found
            </Text>
            <Text className="mt-1 text-center text-sm text-white/50">
              Try adjusting your search
            </Text>
          </View>
        ) : (
          <View className="py-1">
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
                      <View className="mb-1 flex-row items-center" style={{ gap: 6 }}>
                        <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-500">{item.date}</Text>
                      </View>

                      {/* Row 3 — File No */}
                      <View className="mb-1 flex-row items-center" style={{ gap: 6 }}>
                        <Ionicons name="document-outline" size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-500">
                          File No: {item.fileNo}
                        </Text>
                      </View>

                      {/* Row 4 — Section */}
                      <View className="mb-3 flex-row items-start" style={{ gap: 6 }}>
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

                      {/* Action buttons */}
                      <View className="flex-row" style={{ gap: 8 }}>
                        {/* View */}
                        <TouchableOpacity
                          onPress={() => handleView(item)}
                          activeOpacity={0.8}
                          className="flex-1 flex-row items-center justify-center rounded-xl border border-teal-200 bg-teal-50 py-2.5"
                        >
                          <Ionicons name="eye-outline" size={16} color="#0d9488" />
                          <Text className="ml-1.5 text-sm font-semibold text-teal-700">
                            View
                          </Text>
                        </TouchableOpacity>

                        {/* Download */}
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

                        {/* Delete */}
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id)}
                          activeOpacity={0.8}
                          className="flex-1 flex-row items-center justify-center rounded-xl border border-red-200 bg-red-50 py-2.5"
                        >
                          <Ionicons name="trash-outline" size={16} color="#dc2626" />
                          <Text className="ml-1.5 text-sm font-semibold text-red-600">
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      )}

      {/* ── Attach Minutes of Meeting Button ────────────────────────────── */}
      <TouchableOpacity
        onPress={() => setShowForm(true)}
        activeOpacity={0.85}
        className="mt-2 mb-2 rounded-xl py-3 items-center"
        style={{ backgroundColor: "#FBBF24" }}
      >
        <Text style={{ color: "#0D4429", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 }}>
          Attach Minutes of Meeting
        </Text>
      </TouchableOpacity>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
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

      <Modal
        visible={deleteTargetId !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteTargetId(null)}
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
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 18 }}>
                  <Ionicons name="trash-outline" size={38} color="#0D4429" />
                </View>
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 }}>
                Confirm Delete
              </Text>
              <Text style={{ fontSize: 14, color: '#4b5563', textAlign: 'center', lineHeight: 21, marginBottom: 28 }}>
                Are you sure you want to delete this record? This action cannot be undone.
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setDeleteTargetId(null)}
                  style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={async () => {
                    const id = deleteTargetId;
                    setDeleteTargetId(null);
                    await performDelete(id);
                  }}
                  style={{ flex: 1, height: 50, borderRadius: 12, backgroundColor: '#0D4429', alignItems: 'center', justifyContent: 'center' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff' }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

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
                      <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>File No</Text>
                      <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 1 }}>{viewTargetItem.fileNo}</Text>
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

      {/* ── Custom Delete Success Modal ────────────────────────────── */}
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
              <View style={{ backgroundColor: '#E6F4EA', borderRadius: 50, padding: 18, marginBottom: 16 }}>
                <Ionicons name="checkmark-circle" size={42} color="#0D4429" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Deleted
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Minutes of Meeting deleted successfully.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowDeleteSuccessModal(false)}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#0D4429',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Custom Attach Success Modal ────────────────────────────── */}
      <Modal
        visible={showAttachSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachSuccessModal(false)}
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
                <Ionicons name="checkmark-circle" size={42} color="#0D4429" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                Success
              </Text>

              <Text style={{ fontSize: 14, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                Minutes of Meeting attached successfully!
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowAttachSuccessModal(false)}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#0D4429',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}