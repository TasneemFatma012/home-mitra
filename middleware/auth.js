// ================= AUTH MIDDLEWARE =================

// CHECK LOGIN
function isLoggedIn(req, res, next) {
    if (!req.session.user) {
        req.session.returnTo = req.originalUrl;
        return res.redirect("/auth/login");
    }
    next();
}

// CHECK ADMIN
function isAdmin(req, res, next) {
    if (req.session.user?.role === "admin") {
        return next();
    }
    return res.send("Access denied ❌");
}



// PREVENT LOGGED-IN USER FROM LOGIN AGAIN
function redirectIfLoggedIn(req, res, next) {
    if (req.session.user) {
        return res.redirect("/");
    }
    next();
}

module.exports = {
    isLoggedIn,
    isAdmin,
    redirectIfLoggedIn
};