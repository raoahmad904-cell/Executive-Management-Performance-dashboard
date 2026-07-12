import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  designation: {
    type: String,
    enum: [
      'Member',
      'Consultant',
      'Minister',
      'Secretary',
      'Additional Secretary',
      'JS Admin',
      'Chief Economist',
      'Admin',
      'Chiefs',
      'JCE',
      'Deputy Chiefs',
      'Sector Specialist',
      'Project Director',
    ],
  },
  role: { type: String, enum: ['User', 'Management', 'jManagement', 'Admin'] },
  sector: {
    type: String,
    enum: [
      'Science & IT',
      'Infrastructure',
      'Private Sector Dev & Competitiveness',
      'Implementation & Monitoring',
      'Development Communication',
      'Food Security & Climate Change',
      'Social Sector & Devolution',
      'Gov. Innovation Reforms',
      'Energy',
      'Special Areas',
      'Economic',
      'Finance & Trade',
      'Public Sector',
      'Human Resources',
      'Management',
    ],
  },
  section: { type: String, enum: ['Technical Section', 'Economic Section'] },
  email: { type: String, unique: true },
  password: String,
  disabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  comments: [
    {
      progressType: { type: String },
      remarks: { type: String },
      submittedBy: { type: String },
      submittedAt: { type: Date, default: Date.now },
    },
  ],
  hasNewRemarks: { type: Boolean, default: false },
});

export default mongoose.model('User', UserSchema);
