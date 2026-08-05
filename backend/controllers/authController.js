const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  try {
    const { name, designation, role, sector, section, email, password } = req.body;
    // Accept sector only when it's a non-empty string; avoid saving empty string which would fail enum validation
    const sectorValue = (typeof sector === 'string' && sector.trim() !== '') ? sector : undefined;

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { name, designation, role, email, password: hashedPassword };
    if (designation === 'Chiefs' || designation === 'Deputy Chiefs') {
      userData.section = section;
    }
    if (designation === 'JCE') {
      userData.section = 'Economic Section';
      userData.sector = 'Science & IT';
    } else if (role === 'User' && !(designation === 'Chiefs' || designation === 'Deputy Chiefs')) {
      if (sectorValue) userData.sector = sectorValue;
    }
    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.disabled) {
      return res.status(403).json({ error: 'Your account has been disabled' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with additional security claims
    const payload = {
      id: user._id,
      role: user.role,
      designation: user.designation,
      iat: Math.floor(Date.now() / 1000)
      // Do NOT set exp here, let expiresIn handle it
    };
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { 
        algorithm: 'HS256',
        expiresIn: '24h' // 24 hours
      }
    );

    // Update last login time
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    res.json({ 
      token,
      user: { 
        _id: user._id,
        role: user.role,
        designation: user.designation,
        name: user.name,
        email: user.email,
        sector: user.sector,
        section: user.section,
        createdAt: user.createdAt // <-- Add createdAt to user object
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { designation } = req.query;
    const filter = {};
    if (designation && designation !== 'All') filter.designation = designation;
    const users = await User.find(filter, '-password'); // Exclude password, include disabled
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

// Disable a user account (soft delete)
exports.disableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { disabled: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User disabled', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Enable a user account
exports.enableUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { disabled: false } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User enabled', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add remarks to a user
exports.addRemarks = async (req, res) => {
  try {
    const { userId, progressType, remarks, submittedBy } = req.body;
    if (!userId || !remarks || !submittedBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const comment = {
      progressType,
      remarks,
      submittedBy,
      submittedAt: new Date()
    };
    // Set hasNewRemarks to true when a new remark is added
    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { comments: comment }, $set: { hasNewRemarks: true } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Remarks added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clear hasNewRemarks for a user
exports.clearUserNewRemarks = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const result = await User.findByIdAndUpdate(userId, { $set: { hasNewRemarks: false } }, { new: true });
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'New remarks cleared', user: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get remarks for a user (from User.comments array)
exports.getUserRemarks = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json([]);
    // Map comments to match frontend expe
    // ctations
    const remarks = (user.comments || []).map(c => ({
      remarks: c.remarks,
      submittedBy: c.submittedBy,
      createdAt: c.submittedAt || c.createdAt || user.createdAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(remarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get hasNewRemarks for a user
exports.getUserHasNewRemarks = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.json({ hasNewRemarks: false });
    res.json({ hasNewRemarks: !!user.hasNewRemarks });
  } catch (err) {
    res.status(500).json({ hasNewRemarks: false });
  }
};

// Change password for authenticated user
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // Re-fetch user from DB to ensure we have the latest password hash
    const userId = req.user && req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      // Return 400 validation error so frontend interceptor does not treat this as authentication failure
      return res.status(400).json({ error: 'Sorry, old password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
