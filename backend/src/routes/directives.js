import express from 'express';
import { createDirective, getPendingDirectives, endorseDirective, getClosedDirectives, replyToDirective } from '../controllers/directiveController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware
router.use(auth);

router.post('/create', createDirective);
router.get('/pending', getPendingDirectives);
router.get('/closed', getClosedDirectives);
router.patch('/:id/endorse', endorseDirective);
router.post('/:id/reply', replyToDirective);

export default router;
