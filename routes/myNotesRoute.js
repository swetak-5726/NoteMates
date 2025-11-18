const express = require("express");
const router = express.Router();
const MyNotes = require("../models/myNotes");
const { ensureAuth } = require("../middleware/auth");

router.get("/mynotes", ensureAuth, async (req, res) => {
    const notes = await MyNotes.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.render("Notes/myNotes", { notes });
});
router.get("/mynotes/createpage", ensureAuth, (req, res) => {
    res.render("Notes/createMyNote");
});
router.post("/mynotes/create", ensureAuth, async (req, res) => {
    const { title, content } = req.body;

    await MyNotes.create({
        user: req.user._id,
        title,
        content
    });
    req.flash("success_msg", "Note added successfully!");
    res.redirect("/mynotes");
});


router.get("/mynotes/view/:id", ensureAuth, async (req, res) => {
    const note = await MyNotes.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    if (!note) return res.send("Not allowed");
    res.render("Notes/viewMyNote", { note });
});

router.get("/mynotes/edit/:id", ensureAuth, async (req, res) => {
    const note = await MyNotes.findOne({
        _id: req.params.id,
        user: req.user._id
    });

    res.render("Notes/editMyNote", { note });
});

router.put("/mynotes/edit/:id", ensureAuth, async (req, res) => {
    const { title, content } = req.body;

    await MyNotes.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { title, content }
    );

    res.redirect("/mynotes");
});

router.get("/mynotes/delete/:id", ensureAuth, async (req, res) => {
    await MyNotes.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
    });

    res.redirect("/mynotes");
});
module.exports = router;