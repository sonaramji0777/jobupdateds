const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    type: { type: String, required: true }, // Jobs, E-Notes, Books
    title_en: { type: String, required: true },
    title_hi: { type: String, required: true },
    desc_en: { type: String, required: true },
    desc_hi: { type: String, required: true },
    targetLink: { type: String, required: true },
    imageUrl: { type: String, default: "" }, // 🌟 Updated: Added imageUrl field to store API image links
    pdfUrl: { type: String, default: "" },
    keywords: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', PostSchema);
