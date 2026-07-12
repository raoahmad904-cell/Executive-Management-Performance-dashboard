import mongoose from 'mongoose';

const FormSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['weekly', 'quarterly'],
        required: true
    },
    weekStart: {
        type: String, // format: "YYYY-MM-DD"
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Submitted'],
        default: 'Pending'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Form', FormSchema);
