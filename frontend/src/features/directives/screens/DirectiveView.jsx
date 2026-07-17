import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";

const ACCENT = "#0D4429";

function MessageBubble({ message, currentUserId }) {
  const senderObj = message.sender || {};
  const senderId = typeof senderObj === "object" ? senderObj._id || senderObj.id : senderObj;
  const isMine = senderId === currentUserId;
  const senderName = senderObj.name || "System";
  const senderDesig = senderObj.designation ? ` (${senderObj.designation})` : "";
  const timeStr = message.createdAt ? new Date(message.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }) : "";

  return (
    <View className={`mb-3 ${isMine ? "items-end" : "items-start"}`}>
      <Text className="mb-1 text-[11px] text-white/60">{timeStr}</Text>
      <View
        className={`max-w-[88%] rounded-2xl border px-3 py-2.5 ${
          isMine
            ? "border-sky-300 bg-sky-100"
            : "border-gray-200 bg-white"
        }`}
      >
        <Text className="text-[13px] font-bold text-gray-900">
          {isMine ? "You:" : `${senderName}${senderDesig}:`}
        </Text>
        <Text className="mt-1 text-[14px] leading-5 text-gray-800">
          {message.message || message.text}
        </Text>
      </View>
    </View>
  );
}

export default function DirectiveView({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const directive = route?.params?.directive;
  const initialMessages = route?.params?.messages ?? [];

  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) {
          const u = JSON.parse(uStr);
          setCurrentUserId(u._id || u.id);
        }
      } catch (err) {
        console.error("Error loading current user:", err);
      }
    };
    loadUser();
  }, []);

  const title = directive?.title ?? "Directive";
  const canSend = reply.trim().length > 0 || attachments.length > 0;

  async function handlePickFiles() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: "*/*",
      });
      if (result.canceled) return;

      const picked = (result.assets ?? []).map((a) => ({
        name: a.name ?? "file",
        uri: a.uri,
      }));

      setAttachments((prev) => [...prev, ...picked]);
    } catch {
      Alert.alert("Attachments", "Could not open file picker.");
    }
  }

  function handleRemoveAttachment(index) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if (!canSend) return;

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/directives/${directive.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: reply.trim()
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setMessages(updated.messages || []);
        setReply("");
        setAttachments([]);
      } else {
        Alert.alert("Error", "Failed to send message.");
      }
    } catch (error) {
      console.error("Error replying to directive:", error);
      Alert.alert("Error", "Could not send message to the server.");
    }
  }

  const listData = useMemo(() => messages, [messages]);

  return (
    <View className="flex-1 bg-[#F8F9FA]" style={{ paddingTop: insets.top }}>
      {/* Top bar */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-3 py-3">
  <View className="flex-1 flex-row items-center mr-2">
    <Ionicons name="chatbubble-ellipses-outline" size={20} color={ACCENT} />
    <Text
      className="ml-2 flex-1 text-[15px] font-bold text-gray-900"
      numberOfLines={1}
    >
      {title}
    </Text>
  </View>

  <TouchableOpacity
    onPress={() => navigation.goBack()}
    className="flex-row items-center rounded-xl bg-white px-4 py-2.5 border border-gray-200"
    activeOpacity={0.8}
  >
    <Text className="text-[#1B5E3B] text-sm font-bold">← Back</Text>
  </TouchableOpacity>
</View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 100}
      >
        {/* Thread */}
        <View className="mx-2 mt-2 flex-1 rounded-2xl bg-[#0D4429] p-3">
          <FlatList
            ref={listRef}
            data={listData}
            keyExtractor={(item) => item._id || item.id || String(item.createdAt || Math.random())}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={({ item }) => <MessageBubble message={item} currentUserId={currentUserId} />}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-10">
                <Text className="text-sm text-white/70">
                  No messages yet. Start the conversation below.
                </Text>
              </View>
            }
          />
        </View>

        {/* Composer */}
        <View
          className="border-t border-gray-200 bg-white px-3 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Text className="mb-1 text-sm font-semibold text-gray-800">
            Reply
          </Text>

          <TextInput
            className="min-h-[96px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-[14px] text-gray-800"
            placeholder="Type your reply..."
            placeholderTextColor="#9CA3AF"
            value={reply}
            onChangeText={setReply}
            multiline
            textAlignVertical="top"
          />

          <Text className="mb-1 mt-3 text-sm font-semibold text-gray-800">
            Attachments
          </Text>

          <TouchableOpacity
            onPress={handlePickFiles}
            activeOpacity={0.85}
            className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-3"
          >
            <Ionicons name="attach-outline" size={18} color="#374151" />
            <Text className="ml-2 text-[13px] text-gray-700">
              Choose files
            </Text>
          </TouchableOpacity>

          {attachments.length > 0 ? (
            <View className="mt-2">
              {attachments.map((file, index) => (
                <View
                  key={`${file.uri}-${index}`}
                  className="mb-1 flex-row items-center justify-between rounded-lg bg-gray-100 px-3 py-2"
                >
                  <Text className="mr-2 flex-1 text-[12px] text-gray-700" numberOfLines={1}>
                    {file.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
                    <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text className="mt-1 text-[12px] text-gray-500">No file chosen</Text>
          )}

          <View className="mt-3 flex-row justify-end">
          <TouchableOpacity
  onPress={handleSend}
  disabled={!canSend}
  activeOpacity={0.85}
  className={`rounded-xl px-6 py-3 bg-amber-400 ${canSend ? "" : "opacity-50"}`}
>
  <Text className="text-sm font-bold text-black">Send</Text>
</TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}