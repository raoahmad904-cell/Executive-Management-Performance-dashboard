import express from 'express';
import { createDirective, getPendingDirectives, endorseDirective, getClosedDirectives, replyToDirective, downloadDirectiveAttachment } from '../controllers/directiveController.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Set up multer for directive message attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/directives/');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'directive-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Routes requiring auth
router.post('/create', auth, createDirective);
router.get('/pending', auth, getPendingDirectives);
router.get('/closed', auth, getClosedDirectives);
router.patch('/:id/endorse', auth, endorseDirective);
router.post('/:id/reply', auth, upload.array('attachments', 10), replyToDirective);

// Download attachment route (public or auth)
router.get('/download/:filename', downloadDirectiveAttachment);

export default router;
