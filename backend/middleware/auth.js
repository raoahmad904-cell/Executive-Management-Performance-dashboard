const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const user = await User.findOne({ _id: decoded.id });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.disabled) {
      return res.status(403).json({ error: "Your account has been disabled" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.log("Auth middleware error:", error.message);
    res.status(401).json({ error: "Please authenticate" });
  }
};

// Role-based middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    let userRole = req.user.role ? req.user.role.toLowerCase() : "";
    // Normalize known variants (e.g., jManagement -> Management)
    if (userRole === 'jmanagement' || userRole === 'j.management') {
      userRole = 'management';
    }
    const allowedRoles = roles.map((r) => r.toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this resource" });
    }
    next();
  };
};

module.exports = { auth, authorizeRoles };
