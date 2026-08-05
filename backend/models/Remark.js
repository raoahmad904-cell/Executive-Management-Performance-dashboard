const mongoose = require('mongoose');

const RemarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, required: true },
  submittedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Remark', RemarkSchema);
