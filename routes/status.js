const express = require("express");
const router = express.Router();
const cloudant = require("../config/cloudant");

// UPDATE STATUS
router.post("/bookings/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        // 1. Get existing document
        const result = await cloudant.getDocument({
            db: process.env.BOOKING_DB,
            docId: req.params.id
        });

        const booking = result.result;

        // 2. Update field
        booking.status = status;

        // 3. PUT (update with same _id & _rev)
        await cloudant.putDocument({
            db: process.env.BOOKING_DB,
            docId: req.params.id,
            document: booking
        });

        res.redirect("/admin/bookings");

    } catch (err) {
        console.log(err);
        res.send("Status update failed ❌");
    }
});

module.exports = router;