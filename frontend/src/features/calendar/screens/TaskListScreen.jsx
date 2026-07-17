import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { formatCompletedAt } from '../../../utils/utils';

function StatusBadge({ status, completedAt }) {
  const done = status === 'Completed';
  return (
    <View className={`self-start rounded-xl px-3 py-1 ${done ? 'bg-green-100' : 'bg-amber-100'}`}>
      <Text className={`text-xs font-bold ${done ? 'text-green-700' : 'text-amber-700'}`}>
        {done && completedAt ? `Completed at\n${formatCompletedAt(completedAt)}` : status}
      </Text>
    </View>
  );
}

export default function TaskListScreen({
  selectedKey,
  displayDate,
  tasks,
  onAddTask,
  onViewTask,
  onComplete,
  onClose,
}) {
  return (
    <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl overflow-hidden bg-[#1B5E3B]">
      {/* Header */}
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-bold">
              To Do List{tasks.length > 0 ? `  (${tasks.length})` : ''}
            </Text>
            {selectedKey && (
              <Text className="text-white/70 text-sm mt-0.5">{displayDate(selectedKey)}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="flex-row items-center bg-white rounded-xl px-4 py-2.5"
            activeOpacity={0.8}
          >
            <Text className="text-[#1B5E3B] font-bold text-sm">← Back</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mt-3 self-start flex-row items-center bg-amber-400 rounded-xl px-5 py-2.5"
          onPress={onAddTask}
          activeOpacity={0.8}
        >
          <Text className="text-[#1B5E3B] font-bold text-sm" numberOfLines={1}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {tasks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-5xl mb-3">📋</Text>
          <Text className="text-white text-base font-semibold">No tasks for this date</Text>
          <Text className="text-white/70 text-sm mt-1 text-center">Tap "+ Add Task" to get started</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="px-4 py-3">
          {tasks.map(task => {
            const done = task.status === 'Completed';
            const priStripe = task.priority === 'High'
              ? 'bg-red-400'
              : task.priority === 'Medium'
              ? 'bg-amber-400'
              : 'bg-green-400';

            return (
              <View
                key={task.id}
                className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-100"
                style={{ elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
              >
                <View className="flex-row">
                  {/* Priority colour stripe */}
                  <View className={`w-1.5 ${priStripe}`} />

                  <View className="flex-1 p-4">
                    {/* Title & Status */}
                    <View className="flex-row items-start justify-between mb-2">
                      <Text
                        className="text-gray-900 text-base font-bold flex-1 mr-3"
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>
                      <StatusBadge status={task.status} completedAt={task.completedAt} />
                    </View>

                    {/* Meta */}
                    <Text className="text-gray-500 text-sm mb-1">
                      {task.category}  ·  {task.priority} Priority
                    </Text>

                    {/* Action buttons */}
                    <View className="flex-row mt-2" style={{ gap: 8 }}>
                      <TouchableOpacity
                        className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 items-center"
                        onPress={() => onViewTask(task)}
                        activeOpacity={0.8}
                      >
                        <Text className="text-[#1B5E3B] font-semibold text-sm">View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`flex-1 py-2.5 rounded-xl items-center ${done ? 'bg-gray-100 border border-gray-300' : 'bg-green-500'}`}
                        onPress={() => onComplete(task.id)}
                        activeOpacity={0.8}
                      >
                        <Text className={`font-semibold text-sm ${done ? 'text-gray-500' : 'text-white'}`}>
                          {done ? 'Mark Incomplete' : 'Mark Complete'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          <View className="h-4" />
        </ScrollView>
      )}
    </View>
  );
}