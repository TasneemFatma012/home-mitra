const cloudant = require("../config/cloudant");

const DB = process.env.SERVICE_DB;

exports.getServices = async (req, res) => {

    try {

        const searchQuery = (req.query.q || "").trim();

        const category = req.query.category || "";

        const rating = Number(req.query.rating) || 0;

        // CONDITIONS ARRAY
        const conditions = [];

        // 🔍 SEARCH CONDITION
        if (searchQuery) {

            conditions.push({
                $or: [

                    {
                        title: {
                            $regex: `(?i).*${searchQuery}.*`
                        }
                    },

                    {
                        category: {
                            $regex: `(?i).*${searchQuery}.*`
                        }
                    },

                    {
                        description: {
                            $regex: `(?i).*${searchQuery}.*`
                        }
                    }

                ]
            });
        }

        // 📂 CATEGORY FILTER
        if (category) {

            conditions.push({
                category: {
                    $regex: `(?i)^${category}$`
                }
            });
        }

        // ⭐ RATING FILTER
        if (rating > 0) {

            conditions.push({
                rating: {
                    "$gte": rating
                }
            });
        }

        // TEMP SELECTOR (WITHOUT PRICE)
        let selector = {};

        if (conditions.length > 0) {

            selector = {
                $and: conditions
            };
        }

        // CLOUDANT QUERY
        const result = await cloudant.postFind({
            db: DB,
            selector
        });

        const services = result.result.docs;

        // 🔥 DYNAMIC MAX PRICE
        const highestPrice = Math.max(
            ...services.map(s => Number(s.price) || 0),
            500
        );

        // FRONTEND SELECTED PRICE
        const maxPrice =
            Number(req.query.maxPrice) || highestPrice;

        // 💰 PRICE FILTER
        const filteredServices = services.filter(service =>
            Number(service.price) <= maxPrice
        );

        // 📍 DISTANCE + ETA
     const finalServices = filteredServices.map((service, index) => {

      const distance = (
           Math.random() * 8 + 1
          ).toFixed(1);

     const eta = Math.floor(distance * 6);

    return {

        ...service,

        id: service._id || index,

        distance: `${distance} km away`,

        eta: `${eta} mins`

    };

});

        finalServices.sort(
           (a, b) => b.rating - a.rating
        );
        // RENDER
        res.render("services/index", {
            services: finalServices,
            searchQuery,
            category,
            rating,
            maxPrice,
            highestPrice

        });

    } catch (err) {

        console.log("❌ SERVICES ERROR:", err);

        res.status(500).send("Error loading services");
    }
};