import Task from '../models/Task.js';
import User from '../models/User.js';
import { updateOverdueStatuses } from './dashboardController.js';

// 1. Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, category, startDate, endDate, priority, assignedBy, description, remarks, dateKey } = req.body;
    
    const newTask = new Task({
      title,
      category,
      startDate,
      endDate,
      priority,
      assignedBy,
      description,
      remarks,
      dateKey,
      status: 'In Process',
      user: req.user.id // retrieved from auth middleware
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get tasks for the logged-in user (with management checks)
export const getTasks = async (req, res) => {
  try {
    await updateOverdueStatuses();
    
    const roleLower = req.user.role ? req.user.role.toLowerCase() : '';
    const isManagementOrAdmin = roleLower === 'admin' || roleLower === 'management' || roleLower === 'jmanagement';

    let filter = {};
    if (!isManagementOrAdmin) {
      filter.user = req.user.id;
    }

    const tasks = await Task.find(filter).populate('user', 'name designation role');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Update task status (Completed / Pending)
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completedAt } = req.body;

    const roleLower = req.user.role ? req.user.role.toLowerCase() : '';
    const isManagementOrAdmin = roleLower === 'admin' || roleLower === 'management' || roleLower === 'jmanagement';

    let query = { _id: id };
    if (!isManagementOrAdmin) {
      query.user = req.user.id;
    }

    const task = await Task.findOneAndUpdate(
      query,
      { status, completedAt },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Delete a task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const roleLower = req.user.role ? req.user.role.toLowerCase() : '';
    const isManagementOrAdmin = roleLower === 'admin' || roleLower === 'management' || roleLower === 'jmanagement';

    let query = { _id: id };
    if (!isManagementOrAdmin) {
      query.user = req.user.id;
    }

    const task = await Task.findOneAndDelete(query);

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
