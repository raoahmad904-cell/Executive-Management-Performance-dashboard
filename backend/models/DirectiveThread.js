const mongoose = require('mongoose');

const DirectiveMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: {  type: String, required: false, default: ""  },
  createdAt: { type: Date, default: Date.now },
  attachments: [{
    filename: String,
    url: String,
    mimetype: String,
    size: Number
  }]
});

const DirectiveThreadSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  duration: {
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  },
  ministerReference: { type: String, required: false },
  directiveDate: { type: Date, required: false },
  meetingReference: { type: String, required: false },
  meetingDate: { type: Date, required: false },
  status: { type: String, enum: ['new', 'pending', 'closed'], default: 'new' },
  minister: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // Changed from member to members (array)
  messages: [DirectiveMessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  memberViewed: { type: Boolean, default: false }, // Track if member has viewed the directive
  newMessageCount: { type: Map, of: Number, default: {} }, // Track new user messages per user (userId: count)
  closedAt: { type: Date, default: null }, // Date/time when directive was closed
  type: { type: String, enum: ['Minister Directive', 'Meeting Directive'], default: 'Minister Directive' } // Added type field for directive type
});

DirectiveThreadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('DirectiveThread', DirectiveThreadSchema);
