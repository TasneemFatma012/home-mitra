require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");

const ejsMate = require("ejs-mate");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");


// Routes

const authRoutes = require("./routes/auth");
const serviceRoutes = require("./routes/service");
const cloudant = require("./config/cloudant");
const paymentRoutes = require("./routes/payment");
const chatbotRoutes = require("./routes/chatbot");


app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


app.use(
  helmet.contentSecurityPolicy({
    directives: {

      defaultSrc: ["'self'"],

      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://api.mapbox.com",
        "https://checkout.razorpay.com",
        "https://cdn.razorpay.com",
        "https://web-chat.global.assistant.watson.appdomain.cloud",
        
      ],

      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://api.mapbox.com",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com"  
      ],

      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://api.mapbox.com",
        "https://images.unsplash.com",
        "https://res.cloudinary.com"
      ],

      connectSrc: [
        "'self'",
        "https://api.mapbox.com",
        "https://events.mapbox.com",
        "https://checkout.razorpay.com",
        "https://api.razorpay.com",
        "https://cdn.razorpay.com",
        "https://lumberjack.razorpay.com",
        

        
        "https://web-chat.global.assistant.watson.appdomain.cloud",
        "https://integrations.au-syd.assistant.watson.appdomain.cloud",
        "https://*.assistant.watson.appdomain.cloud",
        "https://cdnjs.cloudflare.com"
      ],

      frameSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com"
      ],

      workerSrc: [
        "'self'",
        "blob:"
      ],

      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"   
      ]
    }
  })
);

// =====================
// VIEW ENGINE SETUP
// =====================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =====================
// MIDDLEWARES
// =====================


// SESSION


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// 🔥 IMPORTANT: CURRENT USER MIDDLEWARE (PUT BEFORE ROUTES)
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.lastBookingId = req.session.lastBookingId || null;
    res.locals.mapToken = process.env.MAP_TOKEN;
    res.locals.title = "Service Marketplace";
    res.locals.message = null;
    next();
});

// =====================
// ROUTES
// =====================

app.use("/auth", authRoutes);
app.use("/services", serviceRoutes);
app.use("/reviews", require("./routes/review"));
app.use("/map", require("./routes/map"));
app.use("/book", require("./routes/book"));
app.use("/user", require("./routes/user"));
app.use("/", require("./routes/about"));

app.use("/payment", paymentRoutes);
app.use("/api/chatbot", chatbotRoutes);
// Admin Routes

app.use("/admin", require("./routes/admin"));


// HOME
app.get("/", async (req, res) => {
    try {
        const searchQuery = req.query.q || "";


        const result = await cloudant.postAllDocs({
            db: "services",
            includeDocs: true
        });

        let services = result.result.rows.map(r => r.doc);

        res.render("home", {
            services: services || [],
            searchQuery
         // ⭐ IMPORTANT FIX
        });

    } catch (err) {
        console.log(err);
        res.render("home", {
            services: [],
            searchQuery:""
           
        });
    }
});

app.use((err, req, res, next) => {
    console.log("🔥 GLOBAL ERROR:");
    console.log("URL:", req.originalUrl);
    console.log("METHOD:", req.method);
    console.log("ERROR:", err);

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        path: req.originalUrl
    });
});
// =====================
// SERVER
// =====================
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});