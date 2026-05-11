const cloudant = require("../config/cloudant");
const DB = process.env.BOOKING_DB;

// CREATE BOOKING
exports.createBooking = async (req, res) => {
    try {
        const { serviceId, date } = req.body;

        if (!serviceId || !date) {
            return res.send("All fields required");
        }

        await cloudant.postDocument({
            db: DB,
            document: {
                serviceId,
                userId: req.session.user.id,
                userName: req.session.user.name,
                date,
                status: "pending",
                createdAt: new Date()
            }
        });

        res.redirect("/bookings");

    } catch (err) {
        console.log(err);
        res.send("Booking failed");
    }
};

// GET BOOKINGS (USER ONLY)
exports.getBookings = async (req, res) => {
    try {
        const result = await cloudant.postFind({
            db: DB,
            selector: {
                userId: req.session.user.id
            }
        });

        const bookings = result.result.docs;

        res.render("bookings", { bookings });

    } catch (err) {
        console.log(err);
        res.send("Error loading bookings");
    }
};

// DELETE BOOKING (SECURE)
exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.body;

        const doc = await cloudant.getDocument({
            db: DB,
            docId: id
        });

        if (doc.result.userId !== req.session.user.id) {
            return res.send("Not allowed ❌");
        }

        await cloudant.deleteDocument({
            db: DB,
            docId: id,
            rev: doc.result._rev
        });

        res.redirect("/bookings");

    } catch (err) {
        console.log(err);
        res.send("Delete failed");
    }
};