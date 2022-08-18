const express = require("express");
const router = express.Router();
const host = require("../controllers/host");
const { verifyToken } = require("../middlewares/auth");
const {
  upload,
  uploadAadhaarForm,
  uploadPanForm,
} = require("../middlewares/upload");
router.post("/host/sendOTP", host.sendOTP);
router.post("/host/verifyOTP", host.verifyOTP);
router.get("/host/profile", verifyToken, host.showProfile);
router.put("/host/profile", verifyToken, host.updateProfile);
module.exports = router;
