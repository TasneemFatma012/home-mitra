const cloudant = require("../config/cloudant");
const bcrypt = require("bcryptjs");

const DB = process.env.USER_DB;

// ================= REGISTER =================
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.send("All fields required");
        }

        // check existing user
        const existing = await cloudant.postFind({
            db: DB,
            selector: { email }
        });

        if (existing.result.docs.length > 0) {
            return res.send("Email already registered");
        }

        // 🔐 hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await cloudant.postDocument({
            db: DB,
            document: {
                name,
                email,
                password: hashedPassword,
                role: "user"
            }
        });

        res.redirect("/auth/login");

    } catch (err) {
        console.log(err);
        res.send("Registration failed");
    }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const result = await cloudant.postFind({
            db: DB,
            selector: { email }
        });

        const user = result.result.docs[0];

        if (!user) {
            return res.render("auth/login", {
                error: "Invalid email or password"
            });
        }

        // 🔐 compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.render("auth/login", {
                error: "Invalid email or password"
            });
        }

        // store session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.redirect("/");

    } catch (err) {
        console.log(err);
        res.send("Login failed");
    }
};

const redirectUrl = req.session.returnTo || "/";
delete req.session.returnTo;

res.redirect(redirectUrl);