import Task from '../models/Task.js';

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

// 2. Get tasks for the logged-in user
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
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

    const task = await Task.findOneAndUpdate(
      { _id: id, user: req.user.id },
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
    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
