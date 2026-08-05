const Form = require('../models/Form');
const User = require('../models/User');
const TwoYearPlan = require('../models/TwoYearPlan');
const DirectiveThread = require('../models/DirectiveThread');
const CalendarTask = require('../models/CalendarTask');

// Resolve the Designation/Officer dashboard filters down to a list of
// matching user ids, or null when no filter is applied (Officer wins if set).
async function resolveUserFilterIds(designation, officer) {
  if (officer && officer !== 'All') return [officer];
  if (designation && designation !== 'All') {
    const users = await User.find({ designation }, '_id');
    return users.map(u => u._id.toString());
  }
  return null;
}

function isPastDate(dateVal) {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

// Directives/Tasks facet stats for the Management Dashboard: Total / Completed / In Process / Overdue
exports.getDashboardStats = async (req, res) => {
  try {
    const { facet, designation, officer } = req.query;
    const userIds = await resolveUserFilterIds(designation, officer);

    let total = 0, completed = 0, inProcess = 0, overdue = 0;

    if (facet === 'Tasks') {
      const filter = {};
      if (userIds) filter.user = { $in: userIds };
      const tasks = await CalendarTask.find(filter);
      total = tasks.length;
      tasks.forEach(t => {
        if (t.completed) completed++;
        else if (isPastDate(t.expectedEndDate)) overdue++;
        else inProcess++;
      });
    } else {
      const filter = {};
      if (userIds) filter.members = { $in: userIds };
      const threads = await DirectiveThread.find(filter);
      total = threads.length;
      threads.forEach(d => {
        if (d.status === 'closed') completed++;
        else if (isPastDate(d.duration?.end)) overdue++;
        else inProcess++;
      });
    }

    res.json({ total, completed, inProcess, overdue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Item list backing the stat-card tap-through modal
exports.getDashboardStatDetails = async (req, res) => {
  try {
    const { facet, statType, designation, officer } = req.query;
    const userIds = await resolveUserFilterIds(designation, officer);

    let items = [];

    if (facet === 'Tasks') {
      const filter = {};
      if (userIds) filter.user = { $in: userIds };
      const tasks = await CalendarTask.find(filter).populate('user', 'name designation');
      items = tasks
        .map(t => {
          const isOverdue = !t.completed && isPastDate(t.expectedEndDate);
          const status = t.completed ? 'Completed' : (isOverdue ? 'Overdue' : 'In Process');
          return { t, status };
        })
        .filter(({ status }) => !statType || statType === 'Total' || status === statType)
        .map(({ t, status }) => ({
          _id: t._id,
          title: t.name,
          status,
          priority: t.priority,
          user: t.user,
          startDate: t.startDate,
          endDate: t.expectedEndDate,
        }));
    } else {
      const filter = {};
      if (userIds) filter.members = { $in: userIds };
      const threads = await DirectiveThread.find(filter).populate('members', 'name designation');
      items = threads
        .map(d => {
          const isOverdue = d.status !== 'closed' && isPastDate(d.duration?.end);
          const status = d.status === 'closed' ? 'Completed' : (isOverdue ? 'Overdue' : 'In Process');
          return { d, status };
        })
        .filter(({ status }) => !statType || statType === 'Total' || status === statType)
        .map(({ d, status }) => ({
          _id: d._id,
          subject: d.subject,
          status,
          priority: d.priority,
          user: d.members && d.members[0],
          startDate: d.duration?.start,
          endDate: d.duration?.end,
        }));
    }

    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const { type, id, role } = req.query;
    let forms;

    if (type === 'Member') {
      forms = await Form.find({ user: id }).populate('user');
    } else if (type === 'Sector Specialist') {
      const members = await User.find({ sector: id, designation: 'Member' });
      const memberIds = members.map(m => m._id);
      forms = await Form.find({ user: { $in: memberIds } }).populate('user');
    } else if (role === 'Admin') {
      // Only allow all forms for admin
      forms = await Form.find().populate('user');
    } else {
      // Prevent data leakage: do not return all forms
      return res.status(403).json({ error: 'Access denied. User filter required.' });
    }

    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWeeklyStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });
    // Accept weekStart as a query parameter (YYYY-MM-DD)
    let weekStr = req.query.weekStart;
    if (!weekStr) {
      // If not provided, use current week's Monday
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 2); /* for server calculation */
      const monday = new Date(today.setDate(diff));
      monday.setHours(0,0,0,0);
      weekStr = monday.toISOString().slice(0,10);
    }
    // Find all forms submitted for this week
    const forms = await Form.find({ type: 'weekly', weekStart: weekStr, status: 'Submitted' });
    const submittedIds = new Set(forms.map(f => f.user.toString()));
    const submitted = users.filter(u => submittedIds.has(u._id.toString()));
    const notSubmitted = users.filter(u => !submittedIds.has(u._id.toString()));
    res.json({ submitted, notSubmitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQuarterlyStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User', designation: 'Member' });
    const forms = await Form.find({ type: 'quarterly', status: 'Submitted' });
    const submittedIds = new Set(forms.map(f => f.user.toString()));
    const submitted = users.filter(u => submittedIds.has(u._id.toString()));
    const notSubmitted = users.filter(u => !submittedIds.has(u._id.toString()));
    res.json({ submitted, notSubmitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTwoYearStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User', designation: 'Member' });
    const plans = await TwoYearPlan.find({ status: 'Submitted' });
    const submittedIds = new Set(plans.map(p => p.user.toString()));
    const submitted = users.filter(u => submittedIds.has(u._id.toString()));
    const notSubmitted = users.filter(u => !submittedIds.has(u._id.toString()));
    res.json({ submitted, notSubmitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMonthlyProgressStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });

    // Get current year and month
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth()+1).padStart(2, '0');

    const firstDayOfMonth = `${yyyy}-${mm}-01`;
    const lastDayOfMonth = new Date(yyyy, now.getMonth() + 1, 0);
    const lastDayStr = `${yyyy}-${mm}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}`;

   const forms = await Form.find({
      type: 'weekly',
      status: 'Submitted',
      weekStart: { $gte: firstDayOfMonth, $lte: lastDayStr }
    });
    const userIdToWeekStarts = {};
    forms.forEach(f => {
      const uid = f.user.toString();
      if (!userIdToWeekStarts[uid]) userIdToWeekStarts[uid] = [];
      userIdToWeekStarts[uid].push(f.weekStart);
    });

    // For each user, return their info and weekStarts
    const userStats = users.map(u => {
      const userObj = u.toObject();
      const weekStarts = userIdToWeekStarts[userObj._id.toString()] || [];

      // Calculate eligible Mondays for this user in the current month
      const joinDate = new Date(userObj.createdAt);
      const start = new Date(yyyy, now.getMonth(), 1); // <-- add this missing line
      const end = new Date(yyyy, now.getMonth() + 1, 0); // <-- add this missing line
      let mondays = [];
      // Start from the last Monday on or before the 1st of the month
      let d = new Date(start);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay() - 1; /* for server calculation */
      if (dayOfWeek !== 1) {
        // If not Monday, go back to previous Monday
        d.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      }
      while (d <= end) {
        const friday = new Date(d);
        friday.setDate(friday.getDate() + 4);
        // Only include if both weekStart and Friday are in this month, and user joined on or before Friday
        if (d.getMonth() === start.getMonth() && friday.getMonth() === start.getMonth() && joinDate <= friday) {
          mondays.push(d.toISOString().split('T')[0]);
        }
        d.setDate(d.getDate() + 7); // Move to next Monday
      }
      // Compare eligible Mondays and submitted weekStarts
      const eligibleSet = new Set(mondays);
      // Only consider weekStarts that are in eligibleSet (i.e., in this month)
      const submittedSet = new Set((weekStarts || []).map(d => {
        // Always use only the date part (YYYY-MM-DD)
        return (typeof d === 'string' && d.length >= 10) ? d.slice(0, 10) : d;
      }).filter(d => eligibleSet.has(d)));
      const isSubmittedForMonth = mondays.length > 0 && Array.from(eligibleSet).every(monday => submittedSet.has(monday));
      return {
        _id: userObj._id,
        name: userObj.name,
        createdAt: userObj.createdAt,
        eligibleWeekStarts: mondays,
        submittedWeekStarts: weekStarts,
        isSubmittedForMonth
      };
    });

    res.json({ users: userStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};