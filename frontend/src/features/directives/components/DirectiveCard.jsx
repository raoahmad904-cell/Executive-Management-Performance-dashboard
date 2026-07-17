import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

function Chip({ text, tone = "gray" }) {
  const tones = {
    gray: { bg: "bg-gray-200", fg: "text-gray-800" },
    yellow: { bg: "bg-yellow-300", fg: "text-gray-900" },
    slate: { bg: "bg-slate-200", fg: "text-slate-800" },
    cyan: { bg: "bg-cyan-200", fg: "text-cyan-900" },
  };
  const t = tones[tone] ?? tones.gray;

  return (
    <View className={`mr-2 mt-2 rounded-md px-2 py-1 ${t.bg}`}>
      <Text className={`text-[11px] font-semibold ${t.fg}`}>{text}</Text>
    </View>
  );
}

function StatPill({ label, value }) {
  return (
    <View className="mb-1 self-end rounded-md bg-gray-100 px-2 py-1">
      <Text className="text-[11px] text-gray-700">
        <Text className="font-semibold">{label}: </Text>
        {value}
      </Text>
    </View>
  );
}

/**
 * Reusable directive card for Pending/Closed lists.
 *
 * `mode`:
 * - "pending": shows Pending Days + Duration + View/Endorse buttons
 * - "closed": shows Closed At pill + History button
 */
export default function DirectiveCard({
  item,
  mode = "pending",
  onView,
  onEndorse,
  onHistory,
}) {
  const isPending = mode === "pending";
  const isClosed = mode === "closed";

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-white"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="px-4 py-3">
        {/* Title row (closed shows right pill) */}
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-[15px] font-bold text-[#0A6FD3]">
            {item.title}
          </Text>

          {isClosed && item.closedAt ? (
            <View className="rounded-md bg-gray-100 px-2 py-1">
              <Text className="text-[11px] text-gray-700">
                <Text className="font-semibold">Closed at: </Text>
                {item.closedAt}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Chips */}
        <View className="flex-row flex-wrap">
          {item.priority ? <Chip text={item.priority} tone="yellow" /> : null}
          {item.type ? <Chip text={item.type} tone="slate" /> : null}
          {item.assignee ? <Chip text={item.assignee} tone="cyan" /> : null}
        </View>

        {/* Owner line (pending style) */}
        {item.owner && item.createdAt ? (
          <Text className="mt-2 text-[12px] text-gray-700">
            <Text className="font-semibold">{item.owner}</Text>:{" "}
            <Text className="text-gray-600">{item.createdAt}</Text>
          </Text>
        ) : null}

        {/* Pending stats */}
        {isPending ? (
          <View className="mt-3">
            <StatPill label="Pending Days" value={String(item.pendingDays ?? "")} />
            <StatPill label="Duration" value={item.remaining ?? ""} />
          </View>
        ) : null}

        {/* Actions */}
        <View className="mt-3 flex-row justify-end gap-2">
          {isPending ? (
            <>
              <TouchableOpacity
                onPress={() => onView?.(item)}
                className="rounded-lg bg-indigo-600 px-4 py-2"
              >
                <Text className="text-[12px] font-semibold text-white">
                  View
                </Text>
              </TouchableOpacity>

              {onEndorse ? (
                <TouchableOpacity
                  onPress={() => onEndorse?.(item)}
                  className="rounded-lg bg-emerald-700 px-4 py-2"
                >
                  <Text className="text-[12px] font-semibold text-white">
                    Endorse
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {isClosed ? (
            <TouchableOpacity
              onPress={() => onHistory?.(item)}
              className="rounded-lg bg-indigo-600 px-4 py-2"
            >
              <Text className="text-[12px] font-semibold text-white">
                History
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}