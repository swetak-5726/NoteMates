const mongoose = require("mongoose");

const publicNoteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: String,
    pdfUrl: {
        type: String,
        required: true
    },
    pdfPublicId: {
    type: String, 
    required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: String, 
        required:true
    }
});

module.exports = mongoose.model("PublicNote", publicNoteSchema);
