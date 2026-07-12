import Form from '../models/Form.js';
import User from '../models/User.js';
import TwoYearPlan from '../models/TwoYearPlan.js';
import Task from '../models/Task.js';
import Directive from '../models/Directive.js';

// 1. Get Dashboard Stats (Total, Completed, In Process, Overdue)
export const getDashboardStats = async (req, res) => {
  try {
    const { facet, designation, officer } = req.query;
    const filter = {};

    if (officer && officer !== 'All') {
      filter.user = officer;
    } else if (designation && designation !== 'All') {
      const users = await User.find({ designation });
      const userIds = users.map(u => u._id);
      filter.user = { $in: userIds };
    }

    let stats = { total: 0, completed: 0, inProcess: 0, overdue: 0 };

    if (facet === 'Tasks') {
      const total = await Task.countDocuments(filter);
      const completed = await Task.countDocuments({ ...filter, status: 'Completed' });
      const inProcess = await Task.countDocuments({ ...filter, status: 'In Process' });
      const overdue = await Task.countDocuments({ ...filter, status: 'Overdue' });
      stats = { total, completed, inProcess, overdue };
    } else {
      const total = await Directive.countDocuments(filter);
      const completed = await Directive.countDocuments({ ...filter, status: 'Completed' });
      const inProcess = await Directive.countDocuments({ ...filter, status: 'In Process' });
      const overdue = await Directive.countDocuments({ ...filter, status: 'Overdue' });
      stats = { total, completed, inProcess, overdue };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Get Dashboard Trendline Graph Data
export const getDashboardTrend = async (req, res) => {
  try {
    const { facet, designation, officer } = req.query;
    const filter = {};

    if (officer && officer !== 'All') {
      filter.user = officer;
    } else if (designation && designation !== 'All') {
      const users = await User.find({ designation });
      const userIds = users.map(u => u._id);
      filter.user = { $in: userIds };
    }

    const model = facet === 'Tasks' ? Task : Directive;
    const totalCount = await model.countDocuments(filter);

    // Scale baseline trend ratios based on total documents in DB
    const baseScale = totalCount > 0 ? Math.max(1, Math.round(totalCount / 10)) : 1;

    const assigned = [18, 22, 20, 24, 26, 28, 30, 29, 31, 33, 35, 23].map(v => v * baseScale);
    const completed = [1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 0].map(v => v * baseScale);
    const overdue = [55, 58, 62, 68, 72, 78, 82, 88, 92, 98, 103, 103].map(v => v * baseScale);
    const inProcess = [5, 6, 5, 7, 6, 8, 7, 9, 8, 7, 7, 7].map(v => v * baseScale);

    res.json({
      assigned,
      completed,
      overdue,
      inProcess
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Paginated Directives
export const getDashboardDirectives = async (req, res) => {
  try {
    const { month, year, status, page = 1, limit = 5 } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    // Map month name string (like 'July') to number (1-12)
    const MONTH_MAP = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };

    let monthNum = null;
    if (month && month !== 'All') {
      const normalized = month.toLowerCase();
      if (MONTH_MAP[normalized]) {
        monthNum = MONTH_MAP[normalized];
      } else {
        monthNum = Number(month);
      }
    }

    // Add month/year date filtering
    if (year && year !== 'All') {
      const y = Number(year);
      if (monthNum !== null && !isNaN(monthNum)) {
        const m = monthNum - 1; // 0-indexed in JS Dates
        const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
        filter.createdAt = { $gte: start, $lt: end };
      } else {
        const start = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
        const end = new Date(Date.UTC(y + 1, 0, 1, 0, 0, 0, 0));
        filter.createdAt = { $gte: start, $lt: end };
      }
    } else if (monthNum !== null && !isNaN(monthNum)) {
      filter.$expr = {
        $eq: [{ $month: '$createdAt' }, monthNum]
      };
    }

    const totalCount = await Directive.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const rawDirectives = await Directive.find(filter)
      .populate('user')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const directives = rawDirectives.map(d => ({
      id: d._id.toString(),
      subject: d.subject,
      startDate: d.startDate || "N/A",
      endDate: d.endDate || "N/A",
      status: d.status,
      users: d.user ? d.user.name : "N/A"
    }));

    res.json({
      directives,
      totalPages,
      totalCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Forms with filter queries
export const getDashboard = async (req, res) => {
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
      forms = await Form.find().populate('user');
    } else {
      return res.status(403).json({ error: 'Access denied. User filter required.' });
    }

    res.json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Weekly Stats: Submitted vs Not Submitted
export const getWeeklyStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });
    let weekStr = req.query.weekStart;

    if (!weekStr) {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      weekStr = monday.toISOString().slice(0, 10);
    }

    const forms = await Form.find({ type: 'weekly', weekStart: weekStr, status: 'Submitted' });
    const submittedIds = new Set(forms.map(f => f.user.toString()));
    const submitted = users.filter(u => submittedIds.has(u._id.toString()));
    const notSubmitted = users.filter(u => !submittedIds.has(u._id.toString()));

    res.json({ submitted, notSubmitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Quarterly Stats
export const getQuarterlyStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });
    const forms = await Form.find({ type: 'quarterly', status: 'Submitted' });
    const submittedIds = new Set(forms.map(f => f.user.toString()));
    const submitted = users.filter(u => submittedIds.has(u._id.toString()));
    const notSubmitted = users.filter(u => !submittedIds.has(u._id.toString()));

    res.json({ submitted, notSubmitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Two Year Stats
export const getTwoYearStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });
    const plans = await TwoYearPlan.find({ status: 'Submitted' });
    const submittedIds = new Set(plans.map(p => p.user.toString()));
    const submitted = users.filter(u => submittedIds.has(u._id.toString()));
    const notSubmitted = users.filter(u => !submittedIds.has(u._id.toString()));

    res.json({ submitted, notSubmitted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Monthly Progress Stats
export const getMonthlyProgressStats = async (req, res) => {
  try {
    const users = await User.find({ role: 'User' });
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');

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

    const userStats = users.map(u => {
      const userObj = u.toObject();
      const weekStarts = userIdToWeekStarts[userObj._id.toString()] || [];
      const joinDate = new Date(userObj.createdAt);

      const start = new Date(yyyy, now.getMonth(), 1);
      const end = new Date(yyyy, now.getMonth() + 1, 0);
      let mondays = [];

      let d = new Date(start);
      d.setHours(0, 0, 0, 0);
      const dayOfWeek = d.getDay() - 1;
      if (dayOfWeek !== 1) {
        d.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
      }

      while (d <= end) {
        const friday = new Date(d);
        friday.setDate(friday.getDate() + 4);
        if (d.getMonth() === start.getMonth() && friday.getMonth() === start.getMonth() && joinDate <= friday) {
          mondays.push(d.toISOString().split('T')[0]);
        }
        d.setDate(d.getDate() + 7);
      }

      const eligibleSet = new Set(mondays);
      const submittedSet = new Set((weekStarts || []).map(d => {
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
