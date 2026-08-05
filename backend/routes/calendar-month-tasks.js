const express = require('express');
const router = express.Router();
const CalendarTask = require('../models/CalendarTask');
const { auth } = require('../middleware/auth');

// ...existing routes...

// Get all tasks for a month (for calendar highlighting)
router.get('/month-tasks', auth, async (req, res) => {
  try {
    const { month } = req.query; // month format: YYYY-MM
    if (!month) {
      console.error('Month not provided in query');
      return res.status(400).json({ error: 'Month required' });
    }
    if (!req.user || !req.user._id) {
      console.error('User not authenticated or req.user missing:', req.user);
      return res.status(401).json({ error: 'Authentication required' });
    }
    const userId = req.user._id;
    const regex = new RegExp(`^${month}-\\d{2}$`); // matches YYYY-MM-DD

    // Defensive: Check if CalendarTask is defined
    if (!CalendarTask || !CalendarTask.find) {
      return res.status(500).json({ error: 'CalendarTask model error' });
    }
    const tasks = await CalendarTask.find({ user: userId, date: { $regex: regex } });
    // Group tasks by date
    const grouped = {};
    tasks.forEach(task => {
      if (!grouped[task.date]) grouped[task.date] = [];
      grouped[task.date].push({ name: task.name, time: task.time, _id: task._id });
    });
    // Convert to array for frontend
    const result = Object.keys(grouped).map(date => ({ date, tasks: grouped[date] }));
    res.json(result);
  } catch (err) {
    console.error('Error in /month-tasks:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
