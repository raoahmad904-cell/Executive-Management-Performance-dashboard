const express = require('express');
const router = express.Router();
const { getDashboard, getWeeklyStats, getQuarterlyStats, getTwoYearStats, getMonthlyProgressStats } = require('../controllers/dashboardController');

router.get('/', getDashboard);
router.get('/weekly-stats', getWeeklyStats);
router.get('/quarterly-stats', getQuarterlyStats);
router.get('/two-year-stats', getTwoYearStats);
router.get('/monthly-progress-stats', getMonthlyProgressStats);

module.exports = router;
