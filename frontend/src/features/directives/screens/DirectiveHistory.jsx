import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState, useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default function DirectiveHistory({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
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

  const directive = route?.params?.directive;
  const messages = route?.params?.messages ?? [];
  const title = directive?.title ?? "Directive History";

  return (
    <View className="flex-1 bg-[#F8F9FA]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-3 py-3">
        <View className="mr-2 flex-1 flex-row items-center">
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
          className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5"
          activeOpacity={0.8}
        >
          <Text className="text-sm font-bold text-[#1B5E3B]">← Back</Text>
        </TouchableOpacity>
      </View>

      {/* History thread only */}
      <View className="mx-2 mt-2 mb-2 flex-1 rounded-2xl bg-[#0D4429] p-3">
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id || item.id || String(item.createdAt || Math.random())}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => <MessageBubble message={item} currentUserId={currentUserId} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-sm text-white/70">
                No history found for this directive.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}