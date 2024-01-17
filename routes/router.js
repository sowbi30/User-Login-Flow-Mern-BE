// router.js

const express = require("express");
const router = new express.Router();
const authenticate = require("../middleware/authenticate");
const authController = require('../controller/authController');  // Import the entire authController

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/validuser", authenticate, authController.validUser);
router.get("/logout", authenticate, authController.logoutUser);
router.post("/sendpasswordlink", authController.sendPasswordLink);
router.get("/forgotpassword/:id/:token", authController.forgotPassword);
router.post("/:id/:token", authController.changePassword);

module.exports = router;
