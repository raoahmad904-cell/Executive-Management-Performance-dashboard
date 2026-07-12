import express from 'express';
import { getTwoYearPlan, getMemberTwoYearPlan, submitTwoYearPlan } from '../controllers/twoYearPlanController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(auth);

router.get('/', getTwoYearPlan);
router.get('/:userId', getMemberTwoYearPlan);
router.post('/submit', submitTwoYearPlan);

export default router;
