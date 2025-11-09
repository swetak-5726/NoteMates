const express = require("express");
const router = express.Router();
const multer = require("multer");
const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
const PublicNote = require("../models/PublicNote");
const { ensureAuth } = require("../middleware/auth");
const axios = require("axios");

// Store uploaded files temporarily in memory
const upload = multer({ storage: multer.memoryStorage() });


// ROUTE 1: Home Page — Show All Public Notes (No Auth Needed)
router.get("/", async (req, res) => {
  try {
    const notes = await PublicNote.find().sort({ uploadedAt: -1 });
    res.render("home", { notes }); // pass notes to home.ejs
  } catch (err) {
    console.error("Error loading public notes:", err);
    res.status(500).send("Error loading public notes.");
  }
});

// ROUTE 2: User Dashboard (After Login)
router.get("/user", ensureAuth, async (req, res) => {
  try {
    const notes = await PublicNote.find().sort({ uploadedAt: -1 });
    res.render("user", { user: req.user, notes });
  } catch (err) {
    console.error(err);
    res.send("Error loading user dashboard.");
  }
});

router.get("/upload",ensureAuth, (req, res) => {
  res.render("upload"); 
});

// ROUTE 3: Upload a New Note (Cloudinary)
router.post("/upload", ensureAuth, upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.send("No file uploaded.");

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "public_notes",
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    // Save to MongoDB
    const newNote = new PublicNote({
      title: req.body.title,
      subject: req.body.subject,
      description: req.body.description,
      pdfUrl: result.secure_url,
      pdfPublicId: result.public_id, //store Cloudinary public_id
      uploadedBy: req.user.username,
    });

    await newNote.save();
    console.log("Uploaded successfully to Cloudinary and MongoDB.");
    res.redirect("/myuploads");
  } catch (err) {
    console.error("Upload failed:", err);
    res.send("Upload failed.");
  }
});

//View PDF route — shows Cloudinary PDF inline
router.get("/viewpdf/:id", async (req, res) => {
  try {
    const note = await PublicNote.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    // Fetch file from Cloudinary
    const response = await axios.get(note.pdfUrl, { responseType: "arraybuffer" });

    // Force browser to open PDF inline
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    res.send(response.data);
  } catch (err) {
    console.error("Error displaying PDF:", err.message);
    res.status(500).send("Failed to load PDF document.");
  }
});
// ROUTE 4: View My Uploads (Private)
router.get("/myuploads", ensureAuth, async (req, res) => {
  try {
    const notes = await PublicNote.find({ uploadedBy: req.user.username });
    res.render("myupload", { notes });
  } catch (err) {
    console.error("Error loading user uploads:", err);
    res.status(500).send("Error loading your uploads.");
  }
});

//  ROUTE 5: Delete a Note
router.get("/delete/:id", async (req, res) => {
  try {
    const note = await PublicNote.findById(req.params.id);
    if (!note) return res.status(404).send("Note not found");

    // Delete from Cloudinary first
    if (note.pdfPublicId) {
      await cloudinary.uploader.destroy(note.pdfPublicId, { resource_type: "raw" });
      console.log("Deleted from Cloudinary:", note.pdfPublicId);
    }

    //Delete from MongoDB
    await PublicNote.findByIdAndDelete(req.params.id);
    console.log("Deleted note from MongoDB:", req.params.id);

    res.redirect("/myuploads"); // back to uploads page
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).send("Error deleting note.");
  }
});



// ROUTE 6: Edit a Note
router.get("/edit/:id", ensureAuth, async (req, res) => {
  try {
    const note = await PublicNote.findById(req.params.id);
    if (!note || note.uploadedBy !== req.user.username) {
      return res.send("Unauthorized access.");
    }
    res.render("edit", { note, user: req.user });
  } catch (err) {
    console.error(err);
    res.send("Error loading edit page.");
  }
});

router.put("/edit/:id", ensureAuth, async (req, res) => {
  try {
    const { title, subject, description } = req.body;
    const note = await PublicNote.findById(req.params.id);

    if (!note || note.uploadedBy !== req.user.username) {
      return res.send("Unauthorized access.");
    }

    note.title = title;
    note.subject = subject;
    note.description = description;
    await note.save();

    console.log("Note updated successfully!");
    res.redirect("/myuploads");
  } catch (err) {
    console.error(err);
    res.send("Edit failed.");
  }
});


module.exports = router;
