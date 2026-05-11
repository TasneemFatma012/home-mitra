const express = require("express");
const router = express.Router();
const cloudant = require("../config/cloudant");
const controller = require("../controllers/serviceController");

router.get("/", controller.getServices);

router.get("/:id", async (req, res) => {
    try {

        let service = null;

        try {
            const serviceRes = await cloudant.getDocument({
                db: process.env.SERVICE_DB,
                docId: req.params.id
            });

            service = serviceRes.result;

        } catch (err) {
            return res.send("Service not found");
        }

        // REVIEWS
        const reviewRes = await cloudant.postFind({
            db: process.env.REVIEW_DB,
            selector: {
                serviceId: req.params.id
            }
        });

        const reviews = reviewRes.result.docs.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

        // SAFE COORDINATES
        if (!service.coordinates || service.coordinates.length !== 2) {
            service.coordinates = null;
        }

        res.render("services/show", {
            service,
            reviews,
            mapToken: process.env.MAP_TOKEN
        });

    } catch (err) {
        console.log(err);
        res.send("Error loading service");
    }
});

module.exports = router;