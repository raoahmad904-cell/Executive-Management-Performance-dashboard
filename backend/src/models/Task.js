import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    priority: { type: String, enum: ['Low', 'Medium', 'High'] },
    assignedBy: { type: String },
    description: { type: String },
    remarks: { type: String },
    status: { type: String, enum: ['Completed', 'Overdue', 'In Process'], default: 'In Process' },
    completedAt: { type: Date },
    dateKey: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Task', TaskSchema, 'calendartasks');


