import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import AddTaskScreen from '../screens/AddTaskScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import TaskListScreen from '../screens/TaskListScreen';
import ViewAllTasksScreen from '../screens/ViewAllTasksScreen';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function displayDate(key) {
  const [y, m, d] = key.split('-');
  return `${d}-${m}-${y}`;
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function makeTimestamp() {
  return new Date().toISOString();
}

export default function CalendarComponent({ resetViewTrigger }) {
  const nav = useNavigation();
  useLayoutEffect(() => {
    nav.setOptions({ title: `Personal Calendar` });
  }, [nav]);

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [tasks, setTasks] = useState({});
  const [selectedKey, setSelectedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [usersList, setUsersList] = useState([]);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showViewAllTasks, setShowViewAllTasks] = useState(false);

  const [viewTask, setViewTask] = useState(null);
  const [detailsReturn, setDetailsReturn] = useState('list');

  // Load tasks from backend on mount
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/tasks`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Group tasks by dateKey
        const grouped = {};
        data.forEach(t => {
          const key = t.dateKey || todayKey;
          if (!grouped[key]) grouped[key] = [];
          // Map MongoDB _id to frontend id
          grouped[key].push({ ...t, id: t._id });
        });
        setTasks(grouped);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error Loading Tasks", errJson.error || `Server responded with status ${res.status}`);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      Alert.alert("Network Error", `Could not connect to backend server at: ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchTasks();
      try {
        const uStr = await AsyncStorage.getItem("user");
        if (uStr) {
          const userObj = JSON.parse(uStr);
          setCurrentUser(userObj);

          const roleLower = userObj.role ? userObj.role.toLowerCase() : '';
          if (roleLower === 'management' || roleLower === 'admin' || roleLower === 'jmanagement') {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}api/auth/users`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              setUsersList(data);
            }
          }
        }
      } catch (err) {
        console.error("Error initializing calendar data:", err);
      }
    };
    initData();
  }, []);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setShowAddTask(false);
    setShowTaskList(false);
    setShowTaskDetails(false);
    setShowViewAllTasks(false);
    setSelectedKey(null);
    setViewTask(null);
  }, [resetViewTrigger]);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function goToToday() {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
  }

  // 1. Add Task via API
  async function handleAddTask(formData) {
    if (!selectedKey) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          category: formData.category,
          startDate: formData.startDate,
          endDate: formData.endDate,
          priority: formData.priority,
          assignedBy: formData.assignedBy,
          description: formData.description.trim(),
          remarks: formData.remarks.trim(),
          dateKey: selectedKey
        })
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks(prev => ({
          ...prev,
          [selectedKey]: [...(prev[selectedKey] || []), { ...newTask, id: newTask._id }],
        }));
        setShowAddTask(false);
        setShowTaskList(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error Creating Task", errJson.error || `Server error: ${res.status}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Connection Failed", "Could not submit task. Please check if backend server is running.");
    }
  }

  function openDay(day) {
    const key = toKey(calYear, calMonth, day);
    if (key < todayKey) return;
    setSelectedKey(key);
    if ((tasks[key] || []).length > 0) setShowTaskList(true);
    else setShowAddTask(true);
  }

  // 2. Complete/Toggle Task via API
  async function handleComplete(taskId, dateKey) {
    const key = dateKey || selectedKey;
    if (!key) return;

    const taskList = tasks[key] || [];
    const currentTask = taskList.find(t => t.id === taskId);
    if (!currentTask) return;

    const ts = makeTimestamp();
    const targetStatus = currentTask.status === 'Completed' ? 'In Process' : 'Completed';
    const targetCompletedAt = currentTask.status === 'Completed' ? null : ts;

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: targetStatus,
          completedAt: targetCompletedAt
        })
      });

      if (res.ok) {
        setTasks(prev => ({
          ...prev,
          [key]: (prev[key] || []).map(t => {
            if (t.id !== taskId) return t;
            return { ...t, status: targetStatus, completedAt: targetCompletedAt };
          }),
        }));
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error Updating Task", errJson.error || "Could not update task status.");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  }

  // 3. Delete Task via API
  async function handleDelete(taskId, dateKey) {
    if (!dateKey) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        setTasks(prev => ({
          ...prev,
          [dateKey]: (prev[dateKey] || []).filter(t => t.id !== taskId),
        }));
        setShowTaskDetails(false);
      } else {
        const errJson = await res.json().catch(() => ({}));
        Alert.alert("Error Deleting Task", errJson.error || "Could not delete task.");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    }
  }

  const dayTasks = selectedKey ? (tasks[selectedKey] || []).filter(t => {
    const taskUserId = t.user?._id || t.user?.id || t.user;
    const currentUserId = currentUser?._id || currentUser?.id;
    return String(taskUserId) === String(currentUserId);
  }) : [];

  const allTasks = Object.entries(tasks).flatMap(([key, list]) =>
    list.map(t => ({ ...t, dateKey: key }))
  );

  const rows = buildGrid(calYear, calMonth);

  if (showAddTask) {
    return (
      <AddTaskScreen
        selectedKey={selectedKey}
        displayDate={displayDate}
        onSubmit={handleAddTask}
        onClose={() => { setShowAddTask(false); setSelectedKey(null); }}
        onBack={dayTasks.length > 0 ? () => { setShowAddTask(false); setShowTaskList(true); } : null}
      />
    );
  }

  if (showTaskList) {
    return (
      <TaskListScreen
        selectedKey={selectedKey}
        displayDate={displayDate}
        tasks={dayTasks}
        onAddTask={() => { setShowTaskList(false); setShowAddTask(true); }}
        onViewTask={task => {
          setViewTask(task);
          setDetailsReturn('list');
          setShowTaskList(false);
          setShowTaskDetails(true);
        }}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onClose={() => { setShowTaskList(false); setSelectedKey(null); }}
      />
    );
  }

  if (showTaskDetails) {
    return (
      <TaskDetailsScreen
        task={viewTask}
        displayDate={displayDate}
        onComplete={(id) => {
          handleComplete(id, viewTask.dateKey);
          setViewTask(prev => ({
            ...prev,
            status: prev.status === 'Completed' ? 'In Process' : 'Completed',
            completedAt: prev.status === 'Completed' ? null : makeTimestamp()
          }));
        }}
        onDelete={(id) => handleDelete(id, viewTask.dateKey)}
        onClose={() => {
          setShowTaskDetails(false);
          if (detailsReturn === 'list') setShowTaskList(true);
          else setShowViewAllTasks(true);
        }}
      />
    );
  }

  if (showViewAllTasks) {
    return (
      <ViewAllTasksScreen
        tasks={allTasks}
        displayDate={displayDate}
        currentUser={currentUser}
        usersList={usersList}
        onViewTask={task => {
          setViewTask(task);
          setDetailsReturn('viewAll');
          setShowViewAllTasks(false);
          setShowTaskDetails(true);
        }}
        onComplete={handleComplete}
        onDelete={handleDelete}
        onClose={() => setShowViewAllTasks(false)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6', padding: 12 }}>
      {/* Month Header Banner */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0D4429',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 12
      }}>
        <TouchableOpacity onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToToday} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            {MONTH_NAMES[calMonth]} {calYear}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0D4429" />
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 8 }}>Loading calendar...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Calendar Grid Card */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            {/* Weekdays Row */}
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {DAY_NAMES.map((d, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: i >= 5 ? '#ef4444' : '#6b7280'
                  }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid Cells */}
            {rows.map((row, rIdx) => (
              <View key={rIdx} style={{ flexDirection: 'row', marginVertical: 4 }}>
                {row.map((day, cIdx) => {
                  if (day === null) {
                    return <View key={cIdx} style={{ flex: 1, aspectRatio: 1 }} />;
                  }

                  const key = toKey(calYear, calMonth, day);
                  const list = (tasks[key] || []).filter(t => {
                    const taskUserId = t.user?._id || t.user?.id || t.user;
                    const currentUserId = currentUser?._id || currentUser?.id;
                    return String(taskUserId) === String(currentUserId);
                  });
                  const isToday = key === todayKey;
                  const isPast = key < todayKey;
                  const hasTasks = list.length > 0;

                  return (
                    <TouchableOpacity
                      key={cIdx}
                      onPress={() => openDay(day)}
                      disabled={isPast}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        margin: 2,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isToday ? '#0D4429' : (isPast ? '#f3f4f6' : '#fff'),
                        borderWidth: 1,
                        borderColor: isToday ? '#0D4429' : (hasTasks ? '#fbbf24' : '#e5e7eb'),
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: isToday ? '#fff' : (isPast ? '#9ca3af' : '#1f2937')
                      }}>{day}</Text>

                      {/* Task dot indicator */}
                      {hasTasks && (
                        <View style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: isToday ? '#fff' : '#fbbf24',
                          marginTop: 2
                        }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Legend indicators */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0D4429' }} />
                <Text style={{ fontSize: 11, color: '#4b5563', fontWeight: '500' }}>Today</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fbbf24' }} />
                <Text style={{ fontSize: 11, color: '#4b5563', fontWeight: '500' }}>Has Tasks</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#f3f4f6' }} />
                <Text style={{ fontSize: 11, color: '#4b5563', fontWeight: '500' }}>Past Date</Text>
              </View>
            </View>
          </View>

          {/* View All Tasks Button */}
          <TouchableOpacity
            onPress={() => setShowViewAllTasks(true)}
            style={{
              backgroundColor: '#0D4429',
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 16,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>View All Tasks</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
