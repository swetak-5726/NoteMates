const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const router = express.Router();
const { ensureGuest } = require("../middleware/auth");

router.get('/signup', ensureGuest, (req, res) => {
  res.render('signup', { duplicateError: null });
});

router.post('/signup', ensureGuest, async (req, res,) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
        req.flash("error_msg", "Email or username already registered.");
        return res.redirect("/signup");
    }
    const user = new User({ username, email });
    await User.register(user, password);

    req.flash("success_msg", "Signup successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong. Please try again");
    res.redirect("/signup");
  }
});

router.get("/login", ensureGuest, (req, res) => {
  res.render("login");
});

router.post("/login", ensureGuest, (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/login",
    failureFlash: true
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

module.exports =router;
