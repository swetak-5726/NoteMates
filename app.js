require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const methodOverride = require("method-override");

// Models
const User = require("./models/user");
const PublicNote = require("./models/PublicNote");

// Routes
const authRoute = require("./routes/Auth");
const uploadRoute = require("./routes/upload");

const app = express();

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Express session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});
passport.use(
  new LocalStrategy(User.authenticate())
);
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/notesDB")
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));


// Auth routes (login, signup, logout)
app.use("/", authRoute);

// Upload & notes routes (upload, myuploads, view, edit, delete)
app.use("/", uploadRoute);

//Home route (shows public notes)
app.get("/", async (req, res) => {
  try {
    // If user already logged in, go directly to user page
    if (req.isAuthenticated()) {
      return res.redirect("/userpage");
    }

    const notes = await PublicNote.find().sort({ uploadedAt: -1 });
    res.render("home", { notes, user: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading home page.");
  }
});

app.listen(3000,(req,res)=> {
    console.log("port is successfully connected");
})