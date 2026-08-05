const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  weekStart: { type: String }, // Store as 'YYYY-MM-DD' string for Monday of the week
  previousTasks: [String],
  nextTasks: [String],
  majorProjects: [
    {
      project: String,
      timeline: String
    }
  ],
  comments: String,
  status: { type: String, enum: ['Saved', 'Submitted', 'Reviewed', 'Approved'], default: 'Saved' },
  type: { type: String, enum: ['weekly', 'quarterly'], default: 'weekly' },
  quarter: { type: String },
  year: { type: String },
});

module.exports = mongoose.model('Form', FormSchema);
