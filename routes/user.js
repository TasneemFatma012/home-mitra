const express = require("express");

const router = express.Router();

const cloudant =
require("../config/cloudant");

const { STATUS } =
require("../utils/constants");

const {
    isLoggedIn
} = require("../middleware/auth");

const BOOKING_DB =
process.env.BOOKING_DB;


/* =========================
   USER DASHBOARD
========================= */

router.get(
    "/dashboard",
    isLoggedIn,
    async (req, res) => {

    try {

        console.log(
            "USER:",
            req.session.user
        );

        const userId =
        String(
            req.session.user.id
        );

        // BOOKINGS
        const result =
        await cloudant.postFind({

            db: BOOKING_DB,

            selector: {

                userId: {
                    "$eq": userId
                }
            }
        });

        const bookings =
        result.result.docs;

        console.log(
            "BOOKINGS:",
            bookings
        );

        // NOTIFICATIONS
        const notifResult =
        await cloudant.postFind({

            db: "notifications",

            selector: {

                userId: {
                    "$eq": userId
                },

                read: false
            }
        });

        // SAFE JS SORT
        const notifications =
        notifResult.result.docs.sort(

            (a, b) =>

            new Date(b.createdAt)
            -
            new Date(a.createdAt)

        );

        console.log(
            "NOTIFICATIONS:",
            notifications
        );

        res.render(
            "user/dashboard",
            {

                bookings,

                notifications
            }
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Error loading dashboard"
        );
    }
});


/* =========================
   NOTIFICATIONS PAGE
========================= */

router.get(
    "/notifications",
    isLoggedIn,
    async (req, res) => {

    try {

        const userId =
        String(
            req.session.user.id
        );

        const result =
        await cloudant.postFind({

            db: "notifications",

            selector: {

                userId: {
                    "$eq": userId
                }
            }
        });

        // SAFE SORT
        const notifications =
        result.result.docs.sort(

            (a, b) =>

            new Date(b.createdAt)
            -
            new Date(a.createdAt)

        );

        console.log(
            "NOTIFICATIONS:",
            notifications
        );

        res.render(
            "user/notifications",
            {
                notifications
            }
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Notification error"
        );
    }
});

router.get(
    "/profile",
    isLoggedIn,
    async (req, res) => {

    try {

        const userId =
        req.session.user.id;

        const result =
        await cloudant.getDocument({

            db: process.env.USER_DB,

            docId: userId
        });

        const user = result.result;

        res.render(
            "user/profile",
            { user }
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Profile error"
        );
    }
});

// UPDATE PROFILE
   router.get( "/profile/update",
    isLoggedIn,
    async (req, res) => {

    try {

        const userId =
        req.session.user.id;

        const result =
        await cloudant.getDocument({

            db: process.env.USER_DB,

            docId: userId
        });

        const user = result.result;

        const updatedUser = {

            ...user,

            name: req.body.name,

            email: req.body.email,

            phone: req.body.phone,

            city: req.body.city,

            address: req.body.address,

            bio: req.body.bio,

            updatedAt:
            new Date().toISOString()
        };

        await cloudant.putDocument({

            db: process.env.USER_DB,

            docId: user._id,

            document: updatedUser
        });
         // UPDATE SESSION
        req.session.user.name =
        updatedUser.name;

        res.redirect(
            "/user/profile"
        );

    } catch (err) {

        console.log(err);
        res.send(
            "Profile update failed"
        );
    }
});
router.post("/profile/update", isLoggedIn, async (req, res) => {
    try {

        const userId = req.session.user.id;

        const result = await cloudant.getDocument({
            db: process.env.USER_DB,
            docId: userId
        });

        const user = result.result;

        const updatedUser = {
            ...user,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            city: req.body.city,
            address: req.body.address,
            bio: req.body.bio,
            updatedAt: new Date().toISOString()
        };

        await cloudant.putDocument({
            db: process.env.USER_DB,
            docId: userId,
            document: updatedUser
        });

        req.session.user.name = updatedUser.name;

        res.redirect("/user/profile");

    } catch (err) {
        console.log(err);
        res.send("Profile update failed");
    }
});
module.exports = router;