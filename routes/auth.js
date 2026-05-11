const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const cloudant = require("../config/cloudant");
const { redirectIfLoggedIn } = require("../middleware/auth");


// ================= REGISTER =================
router.get("/register",redirectIfLoggedIn, (req, res) => {
    res.render("auth/register");
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // validation
        if (!name || !email || !password) {
            return res.send("All fields are required");
        }

        // check existing user
        const existingRes = await cloudant.postFind({
            db: process.env.USER_DB,
            selector: { email }
        });

        if (existingRes.result.docs.length > 0) {
            return res.send("Email already registered");
        }

        // hash password
        const hashed = await bcrypt.hash(password, 10);

        const user = {
            name,
            email,
            password: hashed
        };

        await cloudant.postDocument({
            db: process.env.USER_DB,
            document: user
        });

        res.redirect("/auth/login");

    } catch (err) {
        console.log(err);
        res.send("Registration error");
    }
});

// ================= LOGIN =================
router.get("/login",redirectIfLoggedIn, (req, res) => {
    res.render("auth/login");
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("EMAIL:", email);
        

        const result = await cloudant.postFind({
            db: process.env.USER_DB,
            selector: { email }
        });
            console.log("DB:", process.env.USER_DB);
        
        const user = result.result.docs[0];

        if (!user) return res.send("Invalid email or password");

        const isMatch = await bcrypt.compare(password, user.password);

        console.log("INPUT PASSWORD:", password);
        console.log("DB PASSWORD:", user.password);
        console.log("MATCH:", isMatch);

 

        if (!isMatch) return res.send("Invalid email or password");

        // ✅ SESSION STORE
        req.session.user = {
            id: user._id || user.id,
            name: user.name,
            email: user.email,
            role: user.role || "user" 
        };

        console.log(req.session.user);

        res.redirect("/");

    } catch (err) {
        console.log(err);
        res.send("Login error");
    }
});

// ================= LOGOUT =================
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    });
});

module.exports = router;