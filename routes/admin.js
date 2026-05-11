const express = require("express");
const router = express.Router();
const cloudant = require("../config/cloudant");
const { isLoggedIn } = require("../middleware/auth");

const BOOKING_DB = process.env.BOOKING_DB;

// -------------------------------
// MIDDLEWARE: ADMIN CHECK
// -------------------------------
function isAdmin(req, res, next) {

    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access denied ❌");
    }

    next();
}

// -------------------------------
// DASHBOARD PAGE (optional already)
// -------------------------------
router.get("/dashboard", isLoggedIn, isAdmin, async (req, res) => {

    try {

        const result = await cloudant.postFind({
            db: BOOKING_DB,
            selector: {}
        });

        const bookings = result.result.docs;

        const stats = {
            total: bookings.length,
            pending: bookings.filter(b => b.status === "pending").length,
            confirmed: bookings.filter(b => b.status === "confirmed").length,
            completed: bookings.filter(b => b.status === "completed").length
        };

        res.render("admin/dashboard", { bookings, stats });

    } catch (err) {

        console.log(err);
        res.send("Error loading dashboard");

    }
});

// -------------------------------
// VIEW SINGLE BOOKING
// -------------------------------
router.get("/bookings/:id", isLoggedIn, isAdmin, async (req, res) => {

    try {

        const result = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });

        const booking = result.result;

        if (!booking) {
            return res.send("Booking not found");
        }

        res.render("admin/booking-details", { booking });

    } catch (err) {

        console.log(err);
        res.send("Error loading booking");

    }
});

// -------------------------------
// UPDATE STATUS (CONFIRM / REJECT / COMPLETE)
// -------------------------------
router.post("/bookings/:id/status", isLoggedIn, isAdmin, async (req, res) => {

    try {

        const { status } = req.body;

        const allowed = ["pending", "confirmed", "rejected", "completed"];

        if (!allowed.includes(status)) {
            return res.send("Invalid status");
        }

        const result = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });

        const booking = result.result;

        if (!booking) {
            return res.send("Booking not found");
        }

        const updated = {
            ...booking,
            status,
            updatedAt: new Date()
        };

        await cloudant.postDocument({
            db: BOOKING_DB,
            document: updated
        });

        res.redirect("/admin/dashboard");

    } catch (err) {

        console.log(err);
        res.send("Status update failed");

    }
});

router.post(
    "/bookings/:id/confirm",
    isAdmin,isLoggedIn,
    async (req, res) => {

    try {

        // GET BOOKING
        const doc =
        await cloudant.getDocument({

            db: BOOKING_DB,

            docId: req.params.id
        });

        const booking =
        doc.result;

        if (!booking) {

            return res.send(
                "Booking not found"
            );
        }

        console.log(
            "CREATING NOTIFICATION FOR:",
            booking.userId
        );

        // UPDATE BOOKING
        const updatedBooking = {

            ...booking,

            status: "confirmed",

            paymentStatus: "unpaid",

            updatedAt:
            new Date().toISOString()
        };

        // SAVE UPDATED BOOKING
        await cloudant.putDocument({

            db: BOOKING_DB,

            docId: booking._id,

            document: updatedBooking
        });

        // CREATE NOTIFICATION
        const notif =
        await cloudant.postDocument({

            db: "notifications",

            document: {

                userId: booking.userId,

                message:
                `${booking.serviceName} confirmed`,

                read: false,

                createdAt:
                new Date().toISOString()
            }
        });

        console.log(
            "NOTIFICATION SAVED:",
            notif.result.id
        );

        res.redirect(
            "/admin/dashboard"
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Confirm failed"
        );
    }
});
module.exports = router;