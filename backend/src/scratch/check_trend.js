import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Directive from '../models/Directive.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { getDashboardTrend } from '../controllers/dashboardController.js';

dotenv.config();

async function test() {
  await mongoose.connect(process.env.DB_URI);
  console.log("Connected to DB");

  const directives = await Directive.find({});
  console.log(`Total directives in DB: ${directives.length}`);
  const completedDirectives = await Directive.find({ status: 'Completed' });
  console.log(`Completed directives count: ${completedDirectives.length}`);

  completedDirectives.forEach(d => {
    console.log(`ID: ${d._id}, subject: ${d.subject}, status: ${d.status}, startDate: ${d.startDate}, closedAt: ${d.closedAt}, createdAt: ${d.createdAt}`);
  });

  const req = { query: { facet: 'Directives', designation: 'All', officer: 'All' } };
  const res = {
    json: (data) => console.log("API Trend Result:", JSON.stringify(data, null, 2)),
    status: () => res
  };

  await getDashboardTrend(req, res);
  process.exit(0);
}

test().catch(err => { console.error(err); process.exit(1); });
