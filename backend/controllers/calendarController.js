const CalendarTask = require('../models/CalendarTask');
const User = require('../models/User');

// Get all tasks for a user and date
async function getTasks(req, res) {
  try {
    const userId = req.user._id;
    const date = req.query.date;
    const month = req.query.month;

    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    let tasks;
    if (month) {
      const startOfMonth = new Date(`${month}-01`);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      tasks = await CalendarTask.find({
        user: userId,
        date: { $gte: startOfMonth.toISOString(), $lt: endOfMonth.toISOString() },
      });
    } else if (date) {
      tasks = await CalendarTask.find({ user: userId, date });
    } else {
      return res.status(400).json({ error: 'Date or month required' });
    }

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Add a new task for a user and date
async function addTask(req, res) {
  try {
    const userId = req.user._id;
    let { date, name, description, startDate, expectedEndDate, priority, category, assignedBy, completed, actualCompletionDate, remarks } = req.body;
    if (!date || !name) return res.status(400).json({ error: 'Missing fields' });
    // Sanitize optional fields: if empty string, set to undefined
    if (!startDate) startDate = undefined;
    if (!expectedEndDate) expectedEndDate = undefined;
    if (!priority) priority = undefined;
    if (!category) category = undefined;
    if (!assignedBy) assignedBy = undefined;
    if (!actualCompletionDate) actualCompletionDate = undefined;
    if (!remarks) remarks = undefined;
    const task = await CalendarTask.create({
      user: userId,
      date,
      name,
      description,
      startDate,
      expectedEndDate,
      priority,
      category,
      assignedBy,
      completed,
      actualCompletionDate,
      remarks
    });
    res.json(task);
  } catch (err) {
    console.error('Error in addTask:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Delete a task by id (only if owned by user)
async function deleteTask(req, res) {
  try {
    const userId = req.user._id;
    const taskId = req.params.id;
    const task = await CalendarTask.findOne({ _id: taskId, user: userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await CalendarTask.deleteOne({ _id: taskId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Update a task by id (only if owned by user)
async function updateTask(req, res) {
  try {
    const userId = req.user._id;
    const taskId = req.params.id;
    const update = req.body;
    // If completed is being set, update completedAt accordingly
    if (typeof update.completed !== 'undefined') {
      if (update.completed) {
        update.completedAt = new Date();
      } else {
        update.completedAt = null;
      }
    }
    const task = await CalendarTask.findOneAndUpdate(
      { _id: taskId, user: userId },
      update,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

// Get all tasks for all users except Admin, Minister
async function getAllNonManagementTasks(req, res) {
  try {
    // Fetch all tasks and populate user field
    const tasks = await CalendarTask.find({}).populate('user');
    // Filter out tasks where user.designation is Admin, Minister
    const filteredTasks = tasks.filter(t => {
      const designation = t.user?.designation?.toLowerCase();
      return designation !== 'admin' && designation !== 'minister';
    });
    res.json(filteredTasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getTasks,
  addTask,
  deleteTask,
  updateTask,
  getAllNonManagementTasks
};
