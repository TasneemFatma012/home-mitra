const express = require("express");
const router = express.Router();

const cloudant = require("../config/cloudant");
const razorpay = require("../config/razorpay");
const { isLoggedIn } = require("../middleware/auth");

const BOOKING_DB = process.env.BOOKING_DB;

//
// =========================
// PAYMENT PAGE
// =========================
//
router.get("/:id", isLoggedIn, async (req, res) => {
    try {

        const doc = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });

         if (!doc || !doc.result) {
            return res.status(404).send("Booking not found");
        }

        const booking = doc.result;

        

        if (booking.userId !== req.session.user.id) {
            return res.status(403).send("Access denied");
        }

        if (booking.status !== "confirmed") {
            return res.send("Booking not confirmed yet");
        }

        res.render("payment/page", { booking });

    } catch (err) {
        console.log(err);
        res.send("Payment page error");
    }
});

//
// =========================
// CREATE RAZORPAY ORDER
// =========================
//
router.post("/create-order", isLoggedIn, async (req, res) => {
    try {

        const { amount } = req.body;

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "rcpt_" + Date.now()
        };

        const order = await razorpay.orders.create(options);

        res.json(order);

    } catch (err) {
        console.log(err);
        res.status(500).send("Order creation failed");
    }
});

//
// =========================
// PAYMENT SUCCESS (SECURE UPDATE)
// =========================
//
router.post("/success/:id", isLoggedIn, async (req, res) => {
   
    try {
        console.log("🔥 PAYMENT SUCCESS HIT");
        console.log("Booking ID:", req.params.id);
        console.log("User:", req.session.user.id);

        const doc = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });
        

        if (!doc?.result) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = doc.result;
        console.log("📦 OLD BOOKING:", booking);

        console.log("🔄 UPDATING CLOUDANT...");

        const updatedBooking = {
            ...booking,
            paymentStatus: "paid",
            status: "confirmed",
            receiptId: booking._id,
            updatedAt: new Date().toISOString()
        };

        // 🔥 FIX: use docId + document correctly
        await cloudant.putDocument({
            db: BOOKING_DB,
            docId: booking._id,
            document: {
                ...updatedBooking,
                _id: booking._id,
                _rev: booking._rev
            }
        });

        req.session.lastBookingId = booking._id;


        return res.json({
            success: true,
            redirect: `/payment/receipt/${booking._id}`
        });

    } catch (err) {

        console.log("🔥 PAYMENT ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Payment update failed"
        });
    }
});
//
// =========================
// RECEIPT PAGE (IMPORTANT FIX)
// =========================
//
router.get("/receipt/:id", isLoggedIn, async (req, res) => {
    try {

        const doc = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });

        if (!doc.result) {
            return res.status(404).send("Receipt not found");
        }

        res.render("payment/receipt", {
            booking: doc.result
        });

    } catch (err) {
        console.log(err);
        res.status(404).send("Receipt not found");
    }
});

module.exports = router;