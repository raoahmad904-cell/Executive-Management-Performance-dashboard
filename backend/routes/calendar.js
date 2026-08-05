const express = require('express');
const router = express.Router();
const { getTasks, addTask, deleteTask, updateTask, getAllNonManagementTasks } = require('../controllers/calendarController');
const { auth } = require('../middleware/auth');
const CalendarTask = require('../models/CalendarTask');

router.get('/tasks', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const date = req.query.date;
    const month = req.query.month;
    const dueDateTo = req.query.dueDateTo;
    const userParam = req.query.user;

    // Management/exec dashboard: fetch all tasks due till a date for all users
    if (dueDateTo && userParam === 'all') {
      // Parse date
      const toDate = new Date(dueDateTo);
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid dueDateTo' });
      }
      // Find all tasks with date <= dueDateTo
      const tasks = await CalendarTask.find({
        date: { $lte: toDate.toISOString() }
      }).populate('user');
        const filteredTasks = tasks.filter(t => {
            const designation = t.user?.designation?.toLowerCase();
            return designation !== 'admin' && designation !== 'minister';
        });
      return res.json(filteredTasks);
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // If a specific user is requested or 'all' is requested, handle accordingly
    let tasks;
    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      if (userParam === 'all') {
        // Allow only management users with designation 'Member' to request all users' tasks
        const reqRole = (req.user.role || '').toLowerCase();
        const reqDesig = (req.user.designation || '').toLowerCase();
        if (reqRole === 'management' && reqDesig === 'member') {
          tasks = await CalendarTask.find({
            date: { $gte: startOfMonth.toISOString(), $lt: endOfMonth.toISOString() }
          }).populate('user');
          // filter out admin/minister tasks for safety
          tasks = tasks.filter(t => {
            const designation = t.user?.designation?.toLowerCase();
            return designation !== 'admin' && designation !== 'minister';
          });
        } else {
          return res.status(403).json({ error: 'Not authorized to view all users tasks' });
        }
      } else if (userParam) {
        // userParam provided and not 'all' -> treat as userId
        tasks = await CalendarTask.find({
          user: userParam,
          date: { $gte: startOfMonth.toISOString(), $lt: endOfMonth.toISOString() }
        });
      } else {
        // default: only current user's tasks
        tasks = await CalendarTask.find({
          user: userId,
          date: { $gte: startOfMonth.toISOString(), $lt: endOfMonth.toISOString() }
        });
      }
    } else if (date) {
      if (userParam) {
        tasks = await CalendarTask.find({ user: userParam, date });
      } else {
        tasks = await CalendarTask.find({ user: userId, date });
      }
    } else {
      return res.status(400).json({ error: 'Date or month required' });
    }

    res.json(tasks);
  } catch (err) {
    console.error('Error in /tasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/tasks', auth, addTask);
router.delete('/tasks/:id', auth, deleteTask);
router.patch('/tasks/:id', auth, updateTask);
router.get('/tasks/all-non-management', getAllNonManagementTasks);

module.exports = router;
