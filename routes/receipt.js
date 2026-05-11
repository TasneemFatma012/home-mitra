const express = require("express");
const router = express.Router();
const cloudant = require("../config/cloudant");
const { isLoggedIn } = require("../middleware/auth");
const BOOKING_DB = process.env.BOOKING_DB;

router.get("/receipt/:id", isLoggedIn, async (req, res) => {

    try {

        // 🔥 VALIDATION FIX
        if (!req.params.id || req.params.id === "undefined") {
            return res.status(400).send("Invalid receipt ID");
        }

        const doc = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });

        // 🔥 NULL SAFETY FIX
        if (!doc?.result) {
            return res.status(404).send("Receipt not found");
        }

        const booking = doc.result;

        // 🔥 SECURITY FIX (VERY IMPORTANT)
        if (booking.userId !== req.session.user.id) {
            return res.status(403).send("Access denied");
        }

        res.render("payment/receipt", {
            booking
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Receipt not found");
    }

});

module.exports = router;