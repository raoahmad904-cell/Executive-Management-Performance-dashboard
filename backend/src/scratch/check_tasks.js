import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from '../models/Task.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    const tasks = await Task.find();
    console.log(`Found ${tasks.length} tasks:`);
    for (const t of tasks) {
      const u = await User.findById(t.user);
      console.log(`Task: ${t.title}`);
      console.log(`  User ID in Task: ${t.user}`);
      console.log(`  User Name in DB: ${u ? u.name : 'Unknown'}`);
      console.log(`  User Email in DB: ${u ? u.email : 'Unknown'}`);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
