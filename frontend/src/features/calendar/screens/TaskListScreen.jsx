import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onDelete,
  onClose,
}) {
  const [selectedViewTask, setSelectedViewTask] = useState(null);
  const [deleteTargetTask, setDeleteTargetTask] = useState(null);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  async function executeDeleteTask() {
    if (!deleteTargetTask) return;
    const { id } = deleteTargetTask;
    setDeleteTargetTask(null);
    if (onDelete) {
      await onDelete(id, selectedKey);
    }
    setShowDeleteSuccessModal(true);
  }

  return (
    <View className="mx-2 mb-2 mt-1 flex-1 rounded-2xl overflow-hidden bg-[#0D4429]">
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
        <ScrollView showsVerticalScrollIndicator={false} className="px-4 py-3 flex-1">
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
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      <TouchableOpacity
                        className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 items-center"
                        onPress={() => setSelectedViewTask(task)}
                        activeOpacity={0.8}
                      >
                        <Text className="text-[#1B5E3B] font-semibold text-sm">View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`flex-1 py-2.5 rounded-xl items-center ${done ? 'bg-gray-100 border border-gray-300' : 'bg-green-500'}`}
                        onPress={() => onComplete(task.id)}
                        activeOpacity={0.8}
                      >
                        <Text className={`font-semibold text-sm ${done ? 'text-gray-500' : 'text-white'}`}>
                          {done ? 'Incomplete' : 'Complete'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 items-center"
                        onPress={() => setDeleteTargetTask(task)}
                        activeOpacity={0.8}
                      >
                        <Text className="text-red-500 font-semibold text-sm">Delete</Text>
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
    </View>
  );
}