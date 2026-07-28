import express from 'express';
import {
    getDashboard,
    getWeeklyStats,
    getQuarterlyStats,
    getTwoYearStats,
    getMonthlyProgressStats,
    getDashboardStats,
    getDashboardTrend,
    getDashboardDirectives,
    getDashboardStatDetails
} from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getDashboard);
router.get('/stats', getDashboardStats);
router.get('/stat-details', getDashboardStatDetails);
router.get('/trend', getDashboardTrend);
router.get('/directives', getDashboardDirectives);
router.get('/weekly-stats', getWeeklyStats);
router.get('/quarterly-stats', getQuarterlyStats);
router.get('/two-year-stats', getTwoYearStats);
router.get('/monthly-progress-stats', getMonthlyProgressStats);

export default router;
