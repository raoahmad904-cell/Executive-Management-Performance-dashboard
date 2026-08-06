import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
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
  const senderName = senderObj.name || "User";
  const senderDesig = senderObj.designation ? ` (${senderObj.designation})` : "";
  const timeStr = message.createdAt ? new Date(message.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }) : "";

  const handleDownloadFile = (att) => {
    // Attachments are served statically from /uploads (see backend app.js),
    // and each message attachment already carries its own relative url.
    const relativeUrl = att?.url || (att?.filename ? `/uploads/directives/${att.filename}` : null);
    if (!relativeUrl) return;
    const url = `${API_BASE_URL}${relativeUrl.replace(/^\//, "")}`;
    Linking.openURL(url).catch(err => {
      console.error("Failed to open URL:", err);
      Alert.alert("Error", "Could not trigger attachment download.");
    });
  };

  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0;
  const messageText = message.message || message.text || "";

  return (
    <View className={`mb-3 ${isMine ? "items-end" : "items-start"}`}>
      <Text className="mb-1 text-[11px] text-white/60">{timeStr}</Text>
      <View
        className={`max-w-[88%] rounded-2xl border px-3 py-2.5 ${
          isMine
            ? "border-emerald-700 bg-[#0F5D4A]"
            : "border-gray-200 bg-white"
        }`}
      >
        <Text className={`text-[12px] font-bold ${isMine ? "text-amber-300" : "text-[#0D4429]"}`}>
          {isMine ? "You:" : `${senderName}${senderDesig}:`}
        </Text>

        {messageText ? (
          <Text className={`mt-1 text-[14px] leading-5 ${isMine ? "text-white" : "text-gray-800"}`}>
            {messageText}
          </Text>
        ) : null}

        {/* Attachments rendering */}
        {hasAttachments && (
          <View className={`mt-2 gap-1.5 pt-1.5 ${messageText ? (isMine ? "border-t border-white/20" : "border-t border-gray-200") : ""}`}>
            {message.attachments.map((att, idx) => {
              const displayName = att.originalName || att.filename || "Attachment";
              return (
                <TouchableOpacity
                  key={att._id || idx}
                  onPress={() => handleDownloadFile(att)}
                  activeOpacity={0.75}
                  className={`flex-row items-center rounded-lg px-2.5 py-1.5 ${
                    isMine ? "bg-white/20" : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Ionicons
                    name="document-attach-outline"
                    size={16}
                    color={isMine ? "#FFFFFF" : "#0D4429"}
                  />
                  <Text
                    className={`ml-1.5 text-xs font-semibold flex-1 ${
                      isMine ? "text-white" : "text-[#0D4429]"
                    }`}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>
                  <Ionicons
                    name="download-outline"
                    size={16}
                    color={isMine ? "#FFFFFF" : "#0D4429"}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
        mimeType: a.mimeType,
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
      const formData = new FormData();
      formData.append("threadId", directive.id);
      if (reply.trim()) {
        formData.append("message", reply.trim());
      }

      attachments.forEach((file) => {
        const fileUri = Platform.OS === "android" ? file.uri : file.uri.replace("file://", "");
        formData.append("attachments", {
          uri: fileUri,
          name: file.name || "attachment",
          type: file.mimeType || file.type || "application/octet-stream"
        });
      });

      const res = await fetch(`${API_BASE_URL}api/directive/reply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const updatedThread = await res.json();
        setMessages(updatedThread.messages || []);
        setReply("");
        setAttachments([]);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error", errJson.error || "Failed to send message.");
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
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 25}
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

        {/* Compact Composer */}
        <View
          className="border-t border-gray-200 bg-white px-3 py-2.5"
          style={{ paddingBottom: Math.max(insets.bottom, 10) }}
        >
          {/* Picked attachments chips */}
          {attachments.length > 0 && (
            <View className="mb-2 flex-row flex-wrap gap-1.5">
              {attachments.map((file, index) => (
                <View
                  key={`${file.uri}-${index}`}
                  className="flex-row items-center rounded-lg bg-gray-100 px-2.5 py-1"
                >
                  <Text className="mr-1.5 max-w-[150px] text-[11px] text-gray-700" numberOfLines={1}>
                    📎 {file.name}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Text input + Action buttons row */}
          <View className="flex-row items-end gap-2">
            <TextInput
              className="flex-1 min-h-[44px] max-h-[85px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[14px] text-gray-800"
              placeholder="Type your reply..."
              placeholderTextColor="#9CA3AF"
              value={reply}
              onChangeText={setReply}
              multiline
              textAlignVertical="top"
            />

            {/* Attach button */}
            <TouchableOpacity
              onPress={handlePickFiles}
              activeOpacity={0.8}
              className="h-[44px] w-[44px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
            >
              <Ionicons name="attach-outline" size={20} color="#374151" />
            </TouchableOpacity>

            {/* Send button */}
            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
              className={`h-[44px] px-4 flex-row items-center justify-center rounded-xl bg-amber-400 ${canSend ? "" : "opacity-50"}`}
            >
              <Ionicons name="send" size={16} color="#111827" style={{ marginRight: 4 }} />
              <Text className="text-xs font-bold text-gray-900">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}