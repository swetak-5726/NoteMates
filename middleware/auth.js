

function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); //User is logged in — allow access
  }
  res.redirect("/login"); // Not logged in — redirect to login page
}

function ensureGuest(req, res, next) {
  if (!req.isAuthenticated()) {
    return next(); //User not logged in — allow access
  }
  res.redirect("/user"); //Already logged in — redirect to dashboard
}

module.exports = { ensureAuth, ensureGuest };
