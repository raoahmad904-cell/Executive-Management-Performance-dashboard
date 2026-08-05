const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage config: save to uploads/directives, keep original name, add timestamp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/directives');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + '-' + unique + ext);
  }
});

const upload = multer({ storage });

module.exports = upload;
