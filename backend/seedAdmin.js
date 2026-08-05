// This script seeds the admin user if not present
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const adminEmail = 'admin@admin.com';
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    await User.create({
      name: 'Admin',
      designation: 'Admin',
      role: 'Admin', // <-- set role to Admin
      sector: 'Science & IT',
      email: adminEmail,
      password: hashedPassword
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }
  mongoose.disconnect();
}

seedAdmin();
