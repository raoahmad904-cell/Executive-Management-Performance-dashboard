import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Directive from '../models/Directive.js';

dotenv.config();

const parseCustomDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : new Date(dateVal);

  const str = String(dateVal).trim();
  if (!str) return null;

  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  const delimiter = str.includes('/') ? '/' : (str.includes('-') ? '-' : null);
  if (delimiter) {
    const parts = str.split(delimiter);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        if (!isNaN(d.getTime())) return d;
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2].split('T')[0], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

async function run() {
  try {
    const MONGO_URI = process.env.DB_URI || process.env.MONGO_URI;
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const directives = await Directive.find({}).sort({ createdAt: -1 });
    console.log(`Found ${directives.length} directives:`);

    directives.forEach(d => {
      const dateObj = parseCustomDate(d.startDate) || parseCustomDate(d.directiveDate) || parseCustomDate(d.createdAt);
      const m = dateObj ? dateObj.getMonth() + 1 : null;
      const y = dateObj ? dateObj.getFullYear() : null;
      console.log(`- ID: ${d._id}, Subject: "${d.subject}", startDate: "${d.startDate}", directiveDate: "${d.directiveDate}", createdAt: "${d.createdAt}" => Parsed Date: ${dateObj?.toISOString()}, Month: ${m}, Year: ${y}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
