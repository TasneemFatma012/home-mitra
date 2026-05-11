const express = require("express");
const router = express.Router();

const cloudant = require("../config/cloudant");

const SERVICE_DB = process.env.SERVICE_DB;

// GET SERVICES FOR CHATBOT

router.get("/services", async (req, res) => {

    try {

        const result = await cloudant.postAllDocs({
            db: SERVICE_DB,
            includeDocs: true
        });

        const services = result.result.rows.map(row => row.doc);

        res.json({
            success: true,
            services
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch services"
        });
    }
});

router.get("/search", async (req, res) => {

    try {

        const query = req.query.q?.toLowerCase();

        const result = await cloudant.postAllDocs({
            db: SERVICE_DB,
            includeDocs: true
        });

        const services = result.result.rows
            .map(row => row.doc)
            .filter(service =>
                service.title?.toLowerCase().includes(query) ||
                service.category?.toLowerCase().includes(query) ||
                service.location?.toLowerCase().includes(query)
            );

        res.json({
            success: true,
            services
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });
    }
});

module.exports = router;