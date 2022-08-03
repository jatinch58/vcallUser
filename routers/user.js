const express = require("express");
const router = express.Router();
const user = require("../controllers/user");
const { verifyToken } = require("../middlewares/auth");
router.post("/user/sendOTP", user.sendOTP);
router.post("/user/verifyOTP", user.verifyOTP);
router.get("/user/refreshToken/:refreshToken", verifyToken, user.refreshToken);
router.put("/user/profile", verifyToken, user.updateProfile);
router.get("/user/profile", verifyToken, user.getProfile);

module.exports = router;
