const express = require("express");
const router = express.Router();
const directiveController = require("../controllers/directiveController");
const { auth } = require("../middleware/auth");
const upload = require("../middleware/directiveUpload");

// New: allow attachments for create and reply
router.post(
  "/create",
  auth,
  upload.array("attachments", 5),
  directiveController.createDirective
);
router.get("/threads", auth, directiveController.getThreads);
router.get("/user/threads", auth, directiveController.getLoggedInUserThreads);
router.get("/user-threads", auth, directiveController.getUserThreads);
router.post(
  "/reply",
  auth,
  upload.array("attachments", 5),
  directiveController.replyToThread
);
router.post("/endorse", auth, directiveController.endorseThread);
router.get("/history", auth, directiveController.getThreadHistory);
router.post("/mark-viewed", auth, directiveController.markThreadViewed);
router.post("/close", auth, directiveController.closeDirective);

module.exports = router;
