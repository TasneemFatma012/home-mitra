const express = require("express");
const router = express.Router();
const cloudant = require("../config/cloudant");

router.get("/", async (req, res) => {
    try {

        const result = await cloudant.postFind({
            db: process.env.SERVICE_DB,
            selector: {coordinates: { "$exists": true }},
            fields: ["_id", "title", "coordinates", "price"]
        });

        const services = result.result.docs.filter(
            s => s.coordinates && s.coordinates.length === 2
        );

        res.render("map/index", { 
            services, 
            mapToken: process.env.MAP_TOKEN 
        });

    } catch (err) {
        console.log(err);
        res.render("map/index", { 
            services: [], 
            mapToken: process.env.MAP_TOKEN
        });
    }
});

module.exports = router;