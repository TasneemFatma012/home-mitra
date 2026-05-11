const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { isLoggedIn } = require("../middleware/auth");

// ADD REVIEW
router.post("/add", isLoggedIn, reviewController.addReview);

// DELETE REVIEW
router.post("/delete", isLoggedIn, reviewController.deleteReview);

module.exports = router;