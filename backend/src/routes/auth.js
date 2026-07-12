import express from 'express';
import { loginUser, registerUser, getUsers } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', auth, getUsers); // protected route to fetch users list

export default router;
