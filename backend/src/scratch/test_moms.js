import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MoM from '../models/MoM.js';
import User from '../models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB successfully!");
    
    // Check if we can query MoM
    const count = await MoM.countDocuments({});
    console.log(`Current MoMs count in DB: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error connecting to MongoDB or querying MoM model:", error);
    process.exit(1);
  }
};

run();
