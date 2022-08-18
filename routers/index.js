const express = require("express");
const router = express.Router();
const userRoutes = require("./user");
const hostRoutes = require("./host");
router.use(userRoutes);
router.use(hostRoutes);
module.exports = router;
