import express from 'express';
import * as momController from '../controllers/momController.js';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Set up multer for MoM attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const momsDir = path.join(__dirname, '../uploads/moms/');
    fs.mkdirSync(momsDir, { recursive: true }); // Ensure directory exists
    cb(null, momsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all MoMs for the logged-in user
router.get('/', auth, momController.getMoMsByUser);

// Attach a new MoM (with file upload)
router.post('/attach', auth, upload.single('attachment'), momController.attachMoM);

// Download MoM attachment
router.get('/download/:filename', momController.downloadMoMAttachment);

// View MoM attachment inline
router.get('/view/:filename', momController.viewMoMAttachment);

// Get all MoMs for management roles
router.get('/all', auth, momController.getAllMoMs);

// Delete MoM by ID
router.delete('/:id', auth, momController.deleteMoM);

export default router;
