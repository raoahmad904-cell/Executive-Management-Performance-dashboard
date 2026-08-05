const MoM = require('../models/MoM');
const path = require('path');

// Get all MoMs for a user
exports.getMoMsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const moms = await MoM.find({ userId }).sort({ date: -1 });
    res.json(moms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching MoMs', error: err.message });
  }
};

// Attach a new MoM
exports.attachMoM = async (req, res) => {
  try {
    const { subject, date, meetingNumber, concernedSection } = req.body;
    const attachment = req.file ? req.file.filename : null;
    const submittedBy = req.user.name;
    const userId = req.user._id;
    const mom = new MoM({
      subject,
      date,
      meetingNumber,
      concernedSection,
      attachment,
      submittedBy,
      userId
    });
    await mom.save();
    res.status(201).json(mom);
  } catch (err) {
    res.status(400).json({ message: 'Error attaching MoM', error: err.message });
  }
};

// Download MoM attachment
exports.downloadMoMAttachment = (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/moms/', fileName);
  res.download(filePath, fileName, (err) => {
    if (err) {
      res.status(404).json({ message: 'File not found' });
    }
  });
};

// View MoM attachment inline
exports.viewMoMAttachment = (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, '../uploads/moms/', fileName);
  // Set Content-Type based on file extension
  let contentType = 'application/octet-stream';
  if (fileName.endsWith('.pdf')) contentType = 'application/pdf';
  else if (fileName.endsWith('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (fileName.endsWith('.doc')) contentType = 'application/msword';
  else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) contentType = 'image/jpeg';
  else if (fileName.endsWith('.png')) contentType = 'image/png';
  res.sendFile(filePath, {
    headers: {
      'Content-Disposition': 'inline; filename="' + fileName + '"',
      'Content-Type': contentType
    }
  }, (err) => {
    if (err) {
      res.status(404).json({ message: 'File not found' });
    }
  });
};

// Get all MoMs (for management roles)
exports.getAllMoMs = async (req, res) => {
  try {
    const moms = await MoM.find({}).sort({ date: -1 });
    res.json(moms);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all MoMs', error: err.message });
  }
};

// Delete MoM by ID
exports.deleteMoM = async (req, res) => {
  try {
    const momId = req.params.id;
    const mom = await MoM.findById(momId);
    if (!mom) {
      return res.status(404).json({ message: 'MoM not found' });
    }
    // Remove attachment file if exists
    if (mom.attachment) {
      const filePath = path.join(__dirname, '../uploads/moms/', mom.attachment);
      try {
        require('fs').unlinkSync(filePath);
      } catch (e) {
        // File may not exist, ignore error
      }
    }
    await MoM.deleteOne({ _id: momId });
    res.json({ message: 'MoM deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting MoM', error: err.message });
  }
};
