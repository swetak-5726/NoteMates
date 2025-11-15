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
const myNotesRoute= require("./routes/myNotesRoute");
const uploadRoute = require("./routes/upload");
const app = express();

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

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

app.use("/", authRoute);
app.use("/", uploadRoute);
app.use(myNotesRoute);

//Home route (shows public notes)
app.get("/", async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      return res.redirect("/user");
    }

    const notes = await PublicNote.find().sort({ uploadedAt: -1 });
    res.render("home", { notes, user: null });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading home page.");
  }
});

app.listen(3000,()=> {
    console.log("port is successfully connected");
})