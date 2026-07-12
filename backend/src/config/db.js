import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const seedDefaultUsers = async () => {
  try {
    const defaultUsers = [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "User",
        designation: "Admin"
      },
      {
        name: "Management",
        email: "management@example.com",
        password: "management123",
        role: "Management",
        designation: "Member"
      },
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ email: u.email });
      const hashedPassword = await bcrypt.hash(u.password, 10);
      if (!exists) {
        await User.create({
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          designation: u.designation
        });
        console.log(`Seeded default user: ${u.email}`);
      } else {
        // Ensure credentials/roles stay synced with config
        exists.name = u.name;
        exists.password = hashedPassword;
        exists.role = u.role;
        exists.designation = u.designation;
        await exists.save();
        console.log(`Synced default user: ${u.email}`);
      }
    }
  } catch (error) {
    console.error("Error seeding default users:", error);
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("Database connected...");
    await seedDefaultUsers();
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

export default connectDB;