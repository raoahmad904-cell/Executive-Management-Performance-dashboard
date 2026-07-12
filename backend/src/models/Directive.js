import mongoose from 'mongoose';

const DirectiveMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: false, default: "" },
  createdAt: { type: Date, default: Date.now },
  attachments: [{
    filename: String,
    url: String,
    mimetype: String,
    size: Number
  }]
});

const DirectiveSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    startDate: { type: String },
    endDate: { type: String },
    status: { type: String, enum: ['Completed', 'Overdue', 'In Process'], default: 'In Process' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    closedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    
    // Message/Thread and specific fields
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    directiveType: { type: String, enum: ['minister', 'meeting'], default: 'minister' },
    ministerRef: { type: String, required: false },
    directiveDate: { type: Date, required: false },
    durationDays: { type: String },
    details: { type: String },
    messages: [DirectiveMessageSchema]
});

export default mongoose.model('Directive', DirectiveSchema);
