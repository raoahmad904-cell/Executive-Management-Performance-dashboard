const Form = require('../models/Form');

// Helper: get Monday of the week for a given date string (YYYY-MM-DD)
function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday.toISOString().slice(0,10);
}

exports.submitForm = async (req, res) => {
  try {
    const { user, type = 'weekly', status } = req.body;
    if (type === 'quarterly') {
      // Quarterly form logic
      const { year, quarter, majorProjects } = req.body;
      if (!user || !year || !quarter) {
        return res.status(400).json({ error: 'User, year, and quarter are required for quarterly form.' });
      }
      let form = await Form.findOne({ user, type: 'quarterly', year, quarter });
      if (form) {
        if (form.status === 'Submitted') {
          return res.status(400).json({ error: 'Quarterly projects already submitted for this quarter.' });
        }
        form.majorProjects = majorProjects;
        form.status = status || 'Saved';
        await form.save();
        return res.json({ message: status === 'Submitted' ? 'Projects submitted!' : 'Projects saved!', form });
      } else {
        form = new Form({ user, type: 'quarterly', year, quarter, majorProjects, status: status || 'Saved' });
        await form.save();
        return res.json({ message: status === 'Submitted' ? 'Projects submitted!' : 'Projects saved!', form });
      }
    } else {
      // Weekly form logic (existing)
      const { previousTasks, nextTasks } = req.body;
      let { weekStart } = req.body;
      if (!weekStart) {
        // If not provided, use current week's Monday
        weekStart = getMonday(new Date().toISOString().slice(0,10));
      }
      // Only one weekly form per user per week
      let form = await Form.findOne({ user, type: 'weekly', weekStart });
      if (form) {
        if (form.status === 'Submitted') {
          return res.status(400).json({ error: 'Weekly progress already submitted for this week.' });
        }
        // Update if not submitted
        form.previousTasks = previousTasks;
        form.nextTasks = nextTasks;
        form.status = status || 'Saved';
        await form.save();
        return res.json({ message: status === 'Submitted' ? 'Form submitted!' : 'Form saved!', form });
      } else {
        form = new Form({ user, previousTasks, nextTasks, weekStart, type: 'weekly', status: status || 'Saved' });
        await form.save();
        return res.json({ message: status === 'Submitted' ? 'Form submitted!' : 'Form saved!', form });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getForm = async (req, res) => {
  try {
    const { user, type, weekStart, year, quarter } = req.query;
    let query = { user };
    if (type) query.type = type;
    if (type === 'weekly') {
      if (weekStart) query.weekStart = weekStart;
    } else if (type === 'quarterly') {
      if (year) query.year = year;
      if (quarter) query.quarter = quarter;
    }
    const forms = await Form.find(query);
    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWeeklyProgressWeeks = async (req, res) => {
  try {
    const { user } = req.query;
    if (!user) return res.status(400).json({ error: 'User ID required' });
    const forms = await Form.find({ user, type: 'weekly' }, 'weekStart').sort({ weekStart: 1 });
    const weeks = forms.map(f => f.weekStart);
    res.json(weeks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
