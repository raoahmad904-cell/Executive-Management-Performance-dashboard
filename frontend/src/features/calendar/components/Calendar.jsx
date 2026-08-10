import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../utils/utils.js";
import AddTaskScreen from '../screens/AddTaskScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import TaskListScreen from '../screens/TaskListScreen';
import ViewAllTasksScreen from '../screens/ViewAllTasksScreen';
import StatusModal from '../../../components/common/StatusModal';

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

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Backend's CalendarTask has no status string, just `completed` + `expectedEndDate` -
// derive the same Completed/Overdue/In Process status the UI already expects.
function computeStatus(t) {
  if (t.completed) return 'Completed';
  if (t.expectedEndDate) {
    const end = new Date(t.expectedEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end < today) return 'Overdue';
  }
  return 'In Process';
}

// Translate a raw CalendarTask document into the shape TaskListScreen /
// ViewAllTasksScreen / TaskDetailsScreen already expect (title/status/dateKey/endDate).
function normalizeTask(t) {
  return {
    ...t,
    id: t._id,
    title: t.name,
    dateKey: t.date,
    endDate: t.expectedEndDate,
    priority: capitalize(t.priority),
    status: computeStatus(t),
  };
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
  const [status, setStatus] = useState(null); // { title, message }

  // Load tasks from backend on mount
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/calendar/tasks/all-non-management`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Group tasks by date
        const grouped = {};
        data.forEach(t => {
          const normalized = normalizeTask(t);
          const key = normalized.dateKey || todayKey;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(normalized);
        });
        setTasks(grouped);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatus({ title: "Error Loading Tasks", message: errJson.error || `Server responded with status ${res.status}` });
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setStatus({ title: "Network Error", message: `Could not connect to backend server at: ${API_BASE_URL}` });
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

          // Fetched for every role, not just Management: ViewAllTasksScreen uses
          // this to resolve a task's "assignedBy" (a raw User id) to a display
          // name, which any role's own tasks can need, not just Management's.
          const token = await AsyncStorage.getItem("token");
          const res = await fetch(`${API_BASE_URL}api/auth/users`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUsersList(data);
          }
        }
      } catch (err) {
        console.error("Error initializing calendar data:", err);
      }
    };
    initData();
  }, []);

  // /all-non-management excludes Admin/Minister-designation users entirely, so a
  // logged-in user with either of those designations would never see their own
  // tasks from fetchTasks() above. /tasks?month= has no such exclusion (it's
  // simply scoped to the logged-in user), so merge it in for whichever month is
  // currently displayed to guarantee the current user's own tasks are complete
  // regardless of their designation.
  useEffect(() => {
    const fetchOwnMonthTasks = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;
        const res = await fetch(`${API_BASE_URL}api/calendar/tasks?month=${monthStr}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(prev => {
            const next = { ...prev };
            data.forEach(t => {
              const normalized = normalizeTask(t);
              const key = normalized.dateKey || todayKey;
              const existing = next[key] || [];
              if (!existing.some(x => x.id === normalized.id)) {
                next[key] = [...existing, normalized];
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error("Error fetching own month tasks:", err);
      }
    };
    fetchOwnMonthTasks();
  }, [calMonth, calYear]);

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
      const res = await fetch(`${API_BASE_URL}api/calendar/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.title.trim(),
          category: formData.category,
          startDate: formData.startDate,
          expectedEndDate: formData.endDate,
          priority: formData.priority,
          // Not sent: "assignedBy" here is a free-text label ("Self", "Minister", ...)
          // but the backend field is a User ObjectId reference - sending the label
          // would fail Mongoose's ObjectId cast, so it's kept UI-only for now.
          description: formData.description.trim(),
          remarks: formData.remarks.trim(),
          date: selectedKey
        })
      });

      if (res.ok) {
        const newTask = await res.json();
        const normalized = normalizeTask(newTask);
        setTasks(prev => ({
          ...prev,
          [selectedKey]: [...(prev[selectedKey] || []), normalized],
        }));
        setShowAddTask(false);
        setShowTaskList(true);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatus({ title: "Error Creating Task", message: errJson.error || `Server error: ${res.status}` });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      setStatus({ title: "Connection Failed", message: "Could not submit task. Please check if backend server is running." });
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

    const targetCompleted = currentTask.status !== 'Completed';

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/calendar/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: targetCompleted
        })
      });

      if (res.ok) {
        const updated = await res.json();
        const normalized = normalizeTask(updated);
        setTasks(prev => ({
          ...prev,
          [key]: (prev[key] || []).map(t => (t.id !== taskId ? t : normalized)),
        }));
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatus({ title: "Error Updating Task", message: errJson.error || "Could not update task status." });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      setStatus({ title: "Network Error", message: "Could not connect to the server." });
    }
  }

  // 3. Delete Task via API
  async function handleDelete(taskId, dateKey) {
    if (!dateKey) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}api/calendar/tasks/${taskId}`, {
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
        setStatus({ title: "Error Deleting Task", message: errJson.error || "Could not delete task." });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      setStatus({ title: "Network Error", message: "Could not connect to the server." });
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

  const statusModal = (
    <StatusModal
      visible={status !== null}
      type="error"
      title={status?.title}
      message={status?.message}
      onClose={() => setStatus(null)}
    />
  );

  if (showAddTask) {
    return (
      <>
        <AddTaskScreen
          selectedKey={selectedKey}
          displayDate={displayDate}
          onSubmit={handleAddTask}
          onClose={() => { setShowAddTask(false); setSelectedKey(null); }}
          onBack={dayTasks.length > 0 ? () => { setShowAddTask(false); setShowTaskList(true); } : null}
        />
        {statusModal}
      </>
    );
  }

  if (showTaskList) {
    return (
      <>
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
        {statusModal}
      </>
    );
  }

  if (showTaskDetails) {
    return (
      <>
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
        {statusModal}
      </>
    );
  }

  if (showViewAllTasks) {
    return (
      <>
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
        {statusModal}
      </>
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
      {statusModal}
    </View>
  );
}
