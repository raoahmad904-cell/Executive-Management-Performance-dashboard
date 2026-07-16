import mongoose from 'mongoose';

const MoMSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  meetingNumber: { type: String, required: true },
  concernedSection: { type: String, required: true },
  attachment: { type: String }, // file path or URL
  submittedBy: { type: String, required: true }, // user name
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('MoM', MoMSchema);
