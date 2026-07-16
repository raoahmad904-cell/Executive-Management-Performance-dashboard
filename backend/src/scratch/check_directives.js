import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Directive from '../models/Directive.js'; // Let's guess the name or import it

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    // Find schema/models by looking at backend/src/models/
    console.log("Connected to MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

run();
