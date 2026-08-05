const mongoose = require('mongoose');

const TwoYearPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  plan: [
    {
      activityArea: String,
      quarters: [String] // e.g. ["", "", "done", ...] for each quarter
    }
  ],
  status: { type: String, enum: ['Saved', 'Submitted'], default: 'Saved' },
  submittedAt: { type: Date } // <-- Add this field
});

module.exports = mongoose.model('TwoYearPlan', TwoYearPlanSchema);
