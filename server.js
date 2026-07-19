require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all assets from the single root directory
app.use(express.static(__dirname));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/govPortalUltimate';
mongoose.connect(MONGO_URI)
    .then(() => console.log('🔥 Secure Data Engine Synced'))
    .catch(err => console.error(err));

// Data Models
const Post = mongoose.model('Post', new mongoose.Schema({ 
    type: String, 
    title_en: String, 
    title_hi: String, 
    desc_en: String, 
    desc_hi: String, 
    targetLink: String, 
    imageUrl: String, 
    pdfUrl: String, 
    keywords: String 
}, { timestamps: true }));

const Banner = mongoose.model('Banner', new mongoose.Schema({ 
    title_en: String, 
    title_hi: String, 
    desc_en: String, 
    desc_hi: String, 
    targetLink: String, 
    imageUrl: String 
}, { timestamps: true }));

const HotVacancy = mongoose.model('HotVacancy', new mongoose.Schema({ 
    text_en: String, 
    text_hi: String, 
    targetLink: String 
}, { timestamps: true }));

const Admin = mongoose.model('Admin', new mongoose.Schema({
    email: { type: String, required: true, default: 'admin@example.com' },
    passwordHash: { type: String, required: true },
    currentOtp: { type: String, default: null },
    otpExpiry: { type: Date, default: null }
}));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'YOUR_GMAIL@gmail.com', 
        pass: process.env.EMAIL_PASS || 'YOUR_GMAIL_APP_PASSWORD' 
    }
});

async function seedAdmin() {
    const count = await Admin.countDocuments();
    if (count === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash('9090', salt);
        await Admin.create({ email: 'admin@example.com', passwordHash: hashed });
        console.log("🔐 Default Admin Profile Initialized (Pass: 9090)");
    }
}
seedAdmin();

// --- AUTHENTICATION ENDPOINTS ---
app.post('/api/auth/step1', async (req, res) => {
    try {
        const { password } = req.body;
        const admin = await Admin.findOne();
        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid Admin Key Password' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.currentOtp = otp;
        admin.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await admin.save();

        await transporter.sendMail({
            from: '"GovPortal Security" <security@govportal.com>',
            to: admin.email,
            subject: "🔐 Admin Terminal Verification OTP",
            text: `Your two-step authentication passcode is: ${otp}. Valid for 10 minutes.`
        });
        res.status(200).json({ success: true, message: 'OTP dispatched to registered Gmail address' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/auth/step2', async (req, res) => {
    try {
        const { otp } = req.body;
        const admin = await Admin.findOne();
        if (!admin.currentOtp || admin.currentOtp !== otp || new Date() > admin.otpExpiry) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP token' });
        }
        admin.currentOtp = null;
        admin.otpExpiry = null;
        await admin.save();
        res.status(200).json({ success: true, token: "AUTHENTICATED_ACCESS_GRANTED" });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const admin = await Admin.findOne();
        const tempPass = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(tempPass, salt);
        await admin.save();

        await transporter.sendMail({
            from: '"GovPortal Recovery Engine"',
            to: admin.email,
            subject: "⚠️ Access Recovery: Temporary Master Key",
            text: `Your temporary master access key is: ${tempPass}\n\nPlease update it immediately inside the terminal configuration dashboard.`
        });
        res.status(200).json({ success: true, message: "Temporary master token routed to target inbox." });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        const admin = await Admin.findOne();
        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(newPassword, salt);
        await admin.save();
        res.status(200).json({ success: true, message: "Master password token updated successfully." });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- API DYNAMIC DATA ROUTES (NO MULTER - COMPLETELY API LINK BASED) ---
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ createdAt: -1 })));
app.post('/api/posts', async (req, res) => {
    try {
        const newPost = await new Post(req.body).save();
        res.json({ success: true, data: newPost });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
app.put('/api/posts/:id', async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
app.delete('/api/posts/:id', async (req, res) => { await Post.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get('/api/banners', async (req, res) => res.json(await Banner.find().sort({ createdAt: -1 })));
app.post('/api/banners', async (req, res) => {
    try {
        const newBanner = await new Banner(req.body).save();
        res.json({ success: true, data: newBanner });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
app.put('/api/banners/:id', async (req, res) => {
    try {
        await Banner.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
app.delete('/api/banners/:id', async (req, res) => { await Banner.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get('/api/hotvacancies', async (req, res) => res.json(await HotVacancy.find().sort({ createdAt: -1 })));
app.post('/api/hotvacancies', async (req, res) => { await new HotVacancy(req.body).save(); res.json({ success: true }); });
app.put('/api/hotvacancies/:id', async (req, res) => { await HotVacancy.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); });
app.delete('/api/hotvacancies/:id', async (req, res) => { await HotVacancy.findByIdAndDelete(req.params.id); res.json({ success: true }); });

// Catch-All Static View Mapping
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => console.log(`🚀 Flat Enterprise App Hub Operating On Port: ${PORT}`));
