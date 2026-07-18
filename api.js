const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// 1. Get all entries from database
router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Insert new entry (Mobile/Admin Panel Endpoint)
router.post('/posts', async (req, res) => {
    const post = new Post({
        type: req.body.type,
        title_en: req.body.title_en,
        title_hi: req.body.title_hi,
        desc_en: req.body.desc_en,
        desc_hi: req.body.desc_hi,
        targetLink: req.body.targetLink,
        keywords: req.body.keywords
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
