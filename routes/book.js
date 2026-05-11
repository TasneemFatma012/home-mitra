const express = require("express");
const router = express.Router();
const cloudant = require("../config/cloudant");
const { STATUS } = require("../utils/constants");
const { isLoggedIn } = require("../middleware/auth");

const SERVICE_DB = process.env.SERVICE_DB;
const BOOKING_DB = process.env.BOOKING_DB;


router.get("/success/:id", isLoggedIn, async (req, res) => {

    try {

        const result = await cloudant.getDocument({
            db: BOOKING_DB,
            docId: req.params.id
        });

        const booking = result.result;

        if (!booking || booking.userId !== req.session.user.id) {
            return res.status(403).send("Access denied");
        }

        res.render("booking/success", { booking });

    } catch (err) {

        console.log(err);

        res.send("Booking not found");

    }
});


router.get("/:id", isLoggedIn, async (req, res) => {

    try {

        const result = await cloudant.getDocument({
            db: SERVICE_DB,
            docId: req.params.id
        });

        const service = result.result;

        if (!service) {
            return res.send("Service not found");
        }

        res.render("book", { service });

    } catch (err) {

        console.log(err);

        res.send("Service not found");

    }
});

router.post("/:id", isLoggedIn, async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            date,
            time,
            priority,
            serviceMode,
            slot,
            address,
            paymentMethod,
            addons,
            emergency,
            notes,
            latitude,
            longitude,
            coupon
        } = req.body;

        // REQUIRED VALIDATION
        if (!name || !phone || !date || !address) {

            return res
                .status(400)
                .send("All required fields missing");

        }

        // PHONE VALIDATION
        if (!/^[0-9]{10}$/.test(phone)) {

            return res.send("Invalid phone number");

        }

        // GET SERVICE
        const service = await cloudant.getDocument({

            db: SERVICE_DB,
            docId: req.params.id

        });

        if (!service.result) {

            return res.send("Invalid service");

        }

        // PRICE
        let totalAmount =
            Number(service.result.price) + 49;

        // PRIORITY CHARGE
        if (priority === "VIP") {

            totalAmount += 299;

        }

        if (priority === "Urgent") {

            totalAmount += 149;

        }

        // EMERGENCY CHARGE
        if (emergency === "Yes") {

            totalAmount += 199;

        }

        // ADDONS ARRAY
        let selectedAddons = [];

        if (addons) {

            selectedAddons = Array.isArray(addons)
                ? addons
                : [addons];

        }

        // BOOKING OBJECT
        const booking = {

            userId: req.session.user.id,

            serviceId: service.result._id || req.params.id,

            serviceName: service.result.title,

            category: service.result.category,

            serviceImage: service.result.image,

            price: service.result.price,

            totalAmount,

            // USER DETAILS
            name,
            email,
            phone,

            // BOOKING DETAILS
            date,
            time,
            priority,
            serviceMode,
            slot,
            address,

            // PAYMENT
            paymentMethod,
            paymentStatus: "unpaid",

            // EXTRA
            addons: selectedAddons,

            emergency: emergency || "No",

            notes,

            coupon,

            // LOCATION
            latitude,
            longitude,

            // STATUS
            status: STATUS.PENDING || "pending",

            providerAssigned: false,

            adminApproved: false,

            // TIMESTAMP
            createdAt: new Date().toISOString(),

            updatedAt: new Date().toISOString()

        };

        // SAVE
        const result = await cloudant.postDocument({

            db: BOOKING_DB,
            document: booking

        });

        // SUCCESS PAGE
        res.redirect(
            `/book/success/${result.result.id}`
        );

    }

    catch (err) {

        console.log(err);

        res.send("Booking failed ❌");

    }

});

module.exports = router;