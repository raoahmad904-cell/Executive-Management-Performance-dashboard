import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import taskRoutes from './routes/tasks.js';
import directiveRoutes from './routes/directives.js';
import twoYearPlanRoutes from './routes/twoYearPlan.js';
import momRoutes from './routes/moms.js';

const app = express();
connectDB();




// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/directives', directiveRoutes);
app.use('/api/two-year-plan', twoYearPlanRoutes);
app.use('/api/moms', momRoutes);


app.listen(process.env.PORT, '0.0.0.0', function () {
  console.log(`Server is running on port ${process.env.PORT}...`);
});