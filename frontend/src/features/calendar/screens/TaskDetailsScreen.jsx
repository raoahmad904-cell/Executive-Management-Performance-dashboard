import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatCompletedAt } from '../../../utils/utils';

// ─── Stacked Detail Row (label above value — easier to read for management) ───
function DetailRow({ label, value }) {
  return (
    <View className="py-2 border-b border-white/20">
      <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">
        {label}
      </Text>
      <Text className="text-white text-base font-medium">{value || '-'}</Text>
    </View>
  );
}

function PriorityBadge({ priority }) {
  const map = {
    High:   { bg: 'bg-red-100',   text: 'text-red-700'   },
    Medium: { bg: 'bg-amber-100', text: 'text-amber-700' },
    Low:    { bg: 'bg-green-100', text: 'text-green-700' },
  };
  const cls = map[priority] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  return (
    <View className={`self-start rounded-full px-4 py-1 ${cls.bg}`}>
      <Text className={`text-sm font-bold ${cls.text}`}>{priority}</Text>
    </View>
  );
}

export default function TaskDetailsScreen({ task, onClose, onComplete }) {

  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Task Details` });
  }, [nav]);

  if (!task) return null;
  const isPending = task.status !== 'Completed';

  return (
    <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl bg-[#0D4429] p-4">
      {/* Header */}
      <View className="pb-4 flex-row items-center justify-end">
        <TouchableOpacity
          onPress={onClose}
          className="flex-row items-center bg-white rounded-xl px-4 py-2.5"
          activeOpacity={0.8}
        >
          <Text className="text-[#1B5E3B] font-bold text-sm">← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Title block */}
        <View className="py-2 border-b border-white/20">
          <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Title</Text>
          <Text className="text-white text-lg font-bold leading-6">{task.title}</Text>
        </View>

        <DetailRow label="Category"          value={task.category} />
        <DetailRow label="Start Date"         value={task.startDate} />
        <DetailRow label="Expected End Date"  value={task.endDate} />

        {/* Priority with badge */}
        <View className="py-2 border-b border-white/20">
          <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Priority</Text>
          <PriorityBadge priority={task.priority} />
        </View>

        {/* Status with badge */}
        <View className="py-2 border-b border-white/20">
          <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Status</Text>
          <View className={`self-start rounded-full px-4 py-1 ${task.status === 'Completed' ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Text className={`text-sm font-bold ${task.status === 'Completed' ? 'text-green-700' : 'text-amber-700'}`}>
              {task.status}
            </Text>
          </View>
        </View>

        <DetailRow label="Completed At" value={formatCompletedAt(task.completedAt)} />
        <DetailRow label="Assigned By"  value={task.assignedBy} />

        {/* Description block */}
        <View className="py-2 border-b border-white/20">
          <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Description</Text>
          <Text className="text-white text-base leading-6">{task.description}</Text>
        </View>

        {/* Remarks block */}
        <View className="py-2 border-b border-white/20">
          <Text className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">Remarks</Text>
          <Text className="text-white text-base leading-6">{task.remarks}</Text>
        </View>

        {/* Mark as Complete — inside scroll so it's never behind the Android nav bar */}
        {isPending && onComplete && (
          <TouchableOpacity
            className="bg-green-500 rounded-xl py-3 items-center mt-4"
            onPress={() => { onComplete(task.id, task.dateKey); onClose(); }}
            activeOpacity={0.85}
          >
            <Text className="text-white font-bold text-base">Mark as Complete</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}