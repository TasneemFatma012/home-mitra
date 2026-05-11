const cloudant = require("../config/cloudant");
const DB = process.env.REVIEW_DB;

exports.addReview = async (req, res) => {

    try {

        // ✅ FROM FORM BODY
        const {
            serviceId,
            rating,
            comment
        } = req.body;

        if (!rating || !comment) {

            return res.send(
                "All fields required"
            );
        }

        if (rating < 1 || rating > 5) {

            return res.send(
                "Invalid rating"
            );
        }

        const review = {

            serviceId,

            userId:
                req.session.user.id,

            userName:
                req.session.user.name,

            rating:
                Number(rating),

            comment,

            date:
                new Date()

        };

        await cloudant.postDocument({

            db: DB,

            document: review

        });

        // ✅ REDIRECT BACK
        res.redirect(
            "/services/" + serviceId
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Failed to add review"
        );
    }
};

// DELETE REVIEW

exports.deleteReview = async (req, res) => {

    try {

        // ✅ FROM FORM
        const {
            id,
            rev,
            serviceId
        } = req.body;

        // GET REVIEW
        const doc =
            await cloudant.getDocument({

                db: DB,

                docId: id
            });

        const review = doc.result;

        // 🔐 OWNER CHECK
        if (

            review.userId !==
            req.session.user.id &&

            req.session.user.role !==
            "admin"

        ) {

            return res.send(
                "Not allowed ❌"
            );
        }

        // DELETE
        await cloudant.deleteDocument({

            db: DB,

            docId: id,

            rev: rev
        });

        // REDIRECT
        res.redirect(
            "/services/" + serviceId
        );

    } catch (err) {

        console.log(err);

        res.send(
            "Delete failed"
        );
    }
};