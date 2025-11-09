const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const router = express.Router();
const { ensureGuest } = require("../middleware/auth");

// Signup route (GET)
router.get('/signup', ensureGuest, (req, res) => {
  res.render('signup', { duplicateError: null });
});

// Signup route (POST)
router.post('/signup', ensureGuest, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check for existing username or email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      let msg;
      if (existingUser.username === username) {
        msg = "Username already exists!";
      } else {
        msg = "Email already registered!";
      }

      // Render signup page again with error message
      return res.render('signup', { duplicateError: msg });
    }

    // Create new user
    const user = new User({ username, email });
    await User.register(user, password); // handled by passport-local-mongoose

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('signup', { duplicateError: 'Error during signup. Please try again.' });
  }
});

// Login route (only for guests)
router.get("/login", ensureGuest, (req, res) => {
  res.render("login");
});

router.post(
  "/login",
  ensureGuest,
  passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/login",
  })
);

// Logout route (accessible to all)
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/"); //Redirects to home after logout
  });
});

module.exports =router;
