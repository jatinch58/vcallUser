const express = require("express");
const router = express.Router();
const user = require("../controllers/user");
const { verifyToken } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
router.post("/user/sendOTP", user.sendOTP);
router.post("/user/verifyOTP", user.verifyOTP);
router.get("/user/refreshToken/:refreshToken", verifyToken, user.refreshToken);
router.put("/user/profile", verifyToken, user.updateProfile);
router.get("/user/profile", verifyToken, user.getProfile);
router.post(
  "/user/profilePicture",
  verifyToken,
  upload,
  user.uploadProfilePicture
);
router.put(
  "/user/profilePicture",
  verifyToken,
  upload,
  user.updateProfilePicture
);

module.exports = router;
