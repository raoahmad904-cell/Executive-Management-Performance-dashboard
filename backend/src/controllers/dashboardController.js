import Form from '../models/Form.js';
import User from '../models/User.js';
import TwoYearPlan from '../models/TwoYearPlan.js';
import Task from '../models/Task.js';
import Directive from '../models/Directive.js';
import mongoose from 'mongoose';

// Helper function to update overdue status dynamically
export const updateOverdueStatuses = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    // Update Tasks
    const tasks = await Task.find({ status: { $in: ['In Process', 'Overdue'] } });
    for (const task of tasks) {
      if (task.endDate) {
        const end = new Date(task.endDate);
        end.setHours(0, 0, 0, 0);

        if (isNaN(end.getTime())) continue;

        if (end < today && task.status === 'In Process') {
          task.status = 'Overdue';
          await task.save();
        } else if (end >= today && task.status === 'Overdue') {
          task.status = 'In Process';
          await task.save();
        }
      }
    }

    // Update Directives
    const directives = await Directive.find({ status: { $in: ['In Process', 'Overdue'] } });
    for (const dir of directives) {
      if (dir.endDate) {
        const end = new Date(dir.endDate);
        end.setHours(0, 0, 0, 0);

        if (isNaN(end.getTime())) continue;

        if (end < today && dir.status === 'In Process') {
          dir.status = 'Overdue';
          await dir.save();
        } else if (end >= today && dir.status === 'Overdue') {
          dir.status = 'In Process';
          await dir.save();
        }
      }
    }
  } catch (error) {
    console.error("Error updating overdue statuses:", error);
  }
};

// 1. Get Dashboard Stats (Total, Completed, In Process, Overdue)
export const getDashboardStats = async (req, res) => {
  try {
    await updateOverdueStatuses();
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

// Helper to parse dates in DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD, or ISO formats safely
const parseCustomDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : new Date(dateVal);

  const str = String(dateVal).trim();
  if (!str) return null;

  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  const delimiter = str.includes('/') ? '/' : (str.includes('-') ? '-' : null);
  if (delimiter) {
    const parts = str.split(delimiter);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d.getTime())) return d;
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2].split('T')[0], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

// 2. Get Dashboard Trendline Graph Data
export const getDashboardTrend = async (req, res) => {
  try {
    await updateOverdueStatuses();
    const { facet, designation, officer } = req.query;
    const filter = {};

    if (officer && officer !== 'All') {
      filter.user = new mongoose.Types.ObjectId(officer);
    } else if (designation && designation !== 'All') {
      const users = await User.find({ designation });
      const userIds = users.map(u => new mongoose.Types.ObjectId(u._id));
      filter.user = { $in: userIds };
    }

    const model = facet === 'Tasks' ? Task : Directive;

    // Define 12 calendar month buckets for the current year
    const currentYear = new Date().getFullYear();
    const MONTHS = [];
    for (let m = 0; m < 12; m++) {
      MONTHS.push({
        start: new Date(Date.UTC(currentYear, m, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(currentYear, m + 1, 0, 23, 59, 59, 999)) // Last day of this month
      });
    }

    // Fetch all records
    const records = await model.find(filter);

    const assigned = Array(12).fill(0);
    const completed = Array(12).fill(0);
    const overdue = Array(12).fill(0);
    const inProcess = Array(12).fill(0);

    const currentMonthIdx = new Date().getMonth();

    // Evaluate stats for each calendar month
    for (let m = 0; m < 12; m++) {
      const monthPeriod = MONTHS[m];

      records.forEach(record => {
        // 1. Get dates
        let S = null; // Start
        let C = null; // Completion
        let D = null; // Expected End

        if (facet === 'Tasks') {
          S = parseCustomDate(record.startDate) || parseCustomDate(record.createdAt);
          C = record.completedAt
            ? parseCustomDate(record.completedAt)
            : (record.status === 'Completed' ? (parseCustomDate(record.updatedAt) || parseCustomDate(record.endDate) || parseCustomDate(record.createdAt)) : null);
          D = record.endDate ? parseCustomDate(record.endDate) : null;
        } else {
          S = parseCustomDate(record.startDate) || parseCustomDate(record.directiveDate) || parseCustomDate(record.createdAt);
          C = record.closedAt
            ? parseCustomDate(record.closedAt)
            : (record.status === 'Completed' ? (parseCustomDate(record.updatedAt) || parseCustomDate(record.endDate) || parseCustomDate(record.createdAt)) : null);
          D = record.endDate ? parseCustomDate(record.endDate) : null;
        }

        if (!S || isNaN(S.getTime())) return;

        // Reset times for date-only comparisons
        S.setHours(0, 0, 0, 0);
        if (C) C.setHours(0, 0, 0, 0);
        if (D) D.setHours(0, 0, 0, 0);

        // A. Assigned (New assigned/created in this month)
        if (S >= monthPeriod.start && S <= monthPeriod.end) {
          assigned[m] += 1;
        }

        // B. Completed in this month
        if (C && C >= monthPeriod.start && C <= monthPeriod.end) {
          completed[m] += 1;
        }

        // C. Overdue in this month:
        // Expected end date D is on or before this month's end, and was not completed before this month's end
        // Only show overdue up to the current calendar month
        if (m <= currentMonthIdx && D && D <= monthPeriod.end) {
          if (!C || C > monthPeriod.end) {
            overdue[m] += 1;
          }
        }

        // D. In Process in this month:
        // Started on or before monthPeriod.end, and not completed before monthPeriod.start, and not overdue before monthPeriod.start
        if (S <= monthPeriod.end) {
          const notCompletedYet = !C || C >= monthPeriod.start;
          const notOverdueYet = !D || D >= monthPeriod.start;
          if (notCompletedYet && notOverdueYet) {
            inProcess[m] += 1;
          }
        }
      });
    }

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
    await updateOverdueStatuses();
    const { month, year, status, page = 1, limit = 5 } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    // Map month name string (like 'July', 'November') to number (1-12)
    const MONTH_MAP = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };

    let monthNum = null;
    if (month && month !== 'All') {
      const normalized = String(month).toLowerCase();
      if (MONTH_MAP[normalized]) {
        monthNum = MONTH_MAP[normalized];
      } else {
        monthNum = Number(month);
      }
    }

    const targetYear = (year && year !== 'All') ? Number(year) : null;

    // Fetch raw directives filtered by status
    const rawDirectives = await Directive.find(filter)
      .populate('user')
      .sort({ createdAt: -1 });

    // Filter by effective date (startDate / directiveDate / createdAt)
    const filteredDirectives = rawDirectives.filter(d => {
      const dateObj = parseCustomDate(d.startDate) || parseCustomDate(d.directiveDate) || parseCustomDate(d.createdAt);
      if (!dateObj || isNaN(dateObj.getTime())) return true;

      if (targetYear !== null && !isNaN(targetYear)) {
        if (dateObj.getFullYear() !== targetYear) return false;
      }

      if (monthNum !== null && !isNaN(monthNum)) {
        if (dateObj.getMonth() + 1 !== monthNum) return false;
      }

      return true;
    });

    const totalCount = filteredDirectives.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const p = Number(page);
    const l = Number(limit);
    const paginatedSlice = filteredDirectives.slice((p - 1) * l, p * l);

    const directives = paginatedSlice.map(d => ({
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

// 4. Get Detailed Items for Selected Dashboard Stat (Total / Completed / In Process / Overdue)
export const getDashboardStatDetails = async (req, res) => {
  try {
    await updateOverdueStatuses();
    const { facet = 'Directives', statType = 'Total', designation, officer } = req.query;
    const filter = {};

    if (officer && officer !== 'All') {
      filter.user = officer;
    } else if (designation && designation !== 'All') {
      const users = await User.find({ designation });
      const userIds = users.map(u => u._id);
      filter.user = { $in: userIds };
    }

    if (statType && statType !== 'Total') {
      filter.status = statType;
    }

    let items = [];
    if (facet === 'Tasks') {
      items = await Task.find(filter)
        .populate('user', 'name designation sector')
        .sort({ createdAt: -1 });
    } else {
      items = await Directive.find(filter)
        .populate('user', 'name designation sector')
        .sort({ createdAt: -1 });
    }

    res.json({ facet, statType, totalCount: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
