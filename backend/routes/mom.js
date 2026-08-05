const express = require('express');
const router = express.Router();
const momController = require('../controllers/momController');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
router.get('/download/:filename', auth, momController.downloadMoMAttachment);

// View MoM attachment inline
router.get('/view/:filename', auth, momController.viewMoMAttachment);

// Get all MoMs for management roles
router.get('/all', auth, momController.getAllMoMs);

// Delete MoM by ID
router.delete('/:id', auth, momController.deleteMoM);

module.exports = router;
