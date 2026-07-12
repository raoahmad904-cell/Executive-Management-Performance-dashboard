import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  try {
    const { name, designation, role, sector, section, email, password } = req.body;
    // Accept sector only when it's a non-empty string; avoid saving empty string which would fail enum validation
    const sectorValue = (typeof sector === 'string' && sector.trim() !== '') ? sector : undefined;

    // Map lowercase roles from frontend to capitalized roles for MongoDB enum compatibility
    let dbRole = role;
    if (role) {
      const lower = role.toLowerCase();
      if (lower === 'user') dbRole = 'User';
      else if (lower === 'management') dbRole = 'Management';
      else if (lower === 'jmanagement') dbRole = 'jManagement';
      else if (lower === 'admin') dbRole = 'Admin';
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { name, designation, role: dbRole, email, password: hashedPassword };
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

export const loginUser = async (req, res) => {
  console.log('Login api called....');
  
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Disabled account check
    if (user.disabled) {
      return res.status(403).json({
        error: 'Your account has been disabled',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        designation: user.designation,
      },
      process.env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: '365d',
      }
    );


    // Response
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role ? user.role.toLowerCase() : '',
        designation: user.designation,
        sector: user.sector,
        section: user.section,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Get Users list (optionally filtered by designation)
export const getUsers = async (req, res) => {
  try {
    const { designation } = req.query;
    const filter = {};
    filter.role = 'User'; // only query normal officers
    if (designation && designation !== 'All') {
      filter.designation = designation;
    }
    const users = await User.find(filter).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};