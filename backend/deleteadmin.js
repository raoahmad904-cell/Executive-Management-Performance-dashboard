const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function deleteAdmin() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const result = await User.deleteOne({ email: 'admin@admin.com' });
  console.log('Deleted admin:', result);
  mongoose.disconnect();
}

deleteAdmin();