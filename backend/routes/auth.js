const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  disableUser,
  enableUser,
  addRemarks,
  clearUserNewRemarks,
  getUserRemarks,
  getUserHasNewRemarks,
  changePassword,
} = require("../controllers/authController");
const { auth, authorizeRoles } = require("../middleware/auth");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/users", auth, authorizeRoles("Admin", "Management", "User"), getAllUsers);
router.delete("/users/:id", auth, authorizeRoles("Admin"), deleteUser);
router.put("/users/:id/disable", auth, authorizeRoles("Admin"), disableUser);
router.put("/users/:id/enable", auth, authorizeRoles("Admin"), enableUser);
router.post(
  "/users/:id/remarks",
  auth,
  authorizeRoles("Admin", "Management"),
  addRemarks
);
router.post(
  "/users/:id/clear-remarks",
  auth,
  authorizeRoles("User"),
  clearUserNewRemarks
);
router.get(
  "/users/:id/remarks",
  auth,
  authorizeRoles("Admin", "Management"),
  getUserRemarks
);
router.get(
  "/users/:id/has-new-remarks",
  auth,
  authorizeRoles("Admin", "Management", "User"),
  getUserHasNewRemarks
);

// Change password for authenticated user
router.post('/change-password', auth, changePassword);

module.exports = router;
