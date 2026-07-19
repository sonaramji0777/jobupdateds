require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files: Sab kuch root se serve hoga
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 🗄️ Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/govPortalUltimate';
mongoose.connect(MONGO_URI)
    .then(() => console.log('🔥 Secure Data Engine Synced'))
    .catch(err => console.error(err));

// Multer Storage (Sirf PDF ke liye)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage }).fields([{ name: 'postPdf', maxCount: 1 }]);

// Models
const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, default: 'admin@example.com' },
    passwordHash: { type: String, required: true },
    currentOtp: { type: String, default: null },
    otpExpiry: { type: Date, default: null }
});
const Admin = mongoose.model('Admin', AdminSchema);

const Post = mongoose.model('Post', new mongoose.Schema({ type: String, title_en: String, title_hi: String, desc_en: String, desc_hi: String, targetLink: String, imageUrl: String, pdfUrl: String, keywords: String }, { timestamps: true }));
const Banner = mongoose.model('Banner', new mongoose.Schema({ title_en: String, title_hi: String, desc_en: String, desc_hi: String, targetLink: String, imageUrl: String }, { timestamps: true }));
const HotVacancy = mongoose.model('HotVacancy', new mongoose.Schema({ text_en: String, text_hi: String, targetLink: String }, { timestamps: true }));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function seedAdmin() {
    const count = await Admin.countDocuments();
    if (count === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash('9090', salt);
        await Admin.create({ email: 'admin@example.com', passwordHash: hashed });
    }
}
seedAdmin();

// --- AUTH ROUTES ---
app.post('/api/auth/step1', async (req, res) => {
    try {
        const { password } = req.body;
        const admin = await Admin.findOne();
        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid Password' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.currentOtp = otp;
        admin.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await admin.save();
        await transporter.sendMail({ from: '"Security" <no-reply@gov.com>', to: admin.email, subject: "OTP", text: `OTP: ${otp}` });
        res.status(200).json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/step2', async (req, res) => {
    const { otp } = req.body;
    const admin = await Admin.findOne();
    if (!admin || admin.currentOtp !== otp || new Date() > admin.otpExpiry) return res.status(400).json({ success: false });
    admin.currentOtp = null; await admin.save();
    res.status(200).json({ success: true, token: "AUTH_GRANTED" });
});

// --- CONTENT ROUTES ---
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ createdAt: -1 })));
app.post('/api/posts', upload, async (req, res) => {
    const data = req.body;
    if (req.files && req.files['postPdf']) data.pdfUrl = '/uploads/' + req.files['postPdf'][0].filename;
    await new Post(data).save(); res.json({ success: true });
});
app.put('/api/posts/:id', upload, async (req, res) => {
    const data = req.body;
    if (req.files && req.files['postPdf']) data.pdfUrl = '/uploads/' + req.files['postPdf'][0].filename;
    await Post.findByIdAndUpdate(req.params.id, data); res.json({ success: true });
});
app.delete('/api/posts/:id', async (req, res) => { await Post.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get('/api/banners', async (req, res) => res.json(await Banner.find().sort({ createdAt: -1 })));
app.post('/api/banners', async (req, res) => { await new Banner(req.body).save(); res.json({ success: true }); });
app.put('/api/banners/:id', async (req, res) => { await Banner.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); });
app.delete('/api/banners/:id', async (req, res) => { await Banner.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get('/api/hotvacancies', async (req, res) => res.json(await HotVacancy.find().sort({ createdAt: -1 })));
app.post('/api/hotvacancies', async (req, res) => { await new HotVacancy(req.body).save(); res.json({ success: true }); });
app.put('/api/hotvacancies/:id', async (req, res) => { await HotVacancy.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); });
app.delete('/api/hotvacancies/:id', async (req, res) => { await HotVacancy.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// --- SPA ROUTING ---
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return;
    res.sendFile(path.join(__dirname, req.path === '/admin' ? 'admin.html' : 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server Running on Port: ${PORT}`));
