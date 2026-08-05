const mongoose = require('mongoose');

const CalendarTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  name: { type: String, required: true }, // Task title
  description: { type: String }, // Task description
  startDate: { type: String }, // YYYY-MM-DD
  expectedEndDate: { type: String }, // YYYY-MM-DD
  category: { type: String, enum: ['Minister directive', 'Meeting Directives', 'Routine'] },
  priority: { type: String, enum: ['low', 'medium', 'high'] },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completed: { type: Boolean, default: false },
  actualCompletionDate: { type: String }, // YYYY-MM-DD
  completedAt: { type: Date }, // Date and time when task was completed
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CalendarTask', CalendarTaskSchema);
