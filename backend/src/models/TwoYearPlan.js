import mongoose from 'mongoose';

const TwoYearPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  plan: [
    {
      activityArea: String,
      quarters: [String] // Array of 8 HTML strings (4 for 2025, 4 for 2026)
    }
  ],
  status: { type: String, enum: ['Saved', 'Submitted'], default: 'Saved' },
  submittedAt: { type: Date }
});

export default mongoose.model('TwoYearPlan', TwoYearPlanSchema);
