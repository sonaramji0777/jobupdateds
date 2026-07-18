// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 🗄️ Database Operational Hub
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/govPortalUltimate';
mongoose.connect(MONGO_URI)
    .then(() => console.log('🔥 Secure Data Engine Synced'))
    .catch(err => console.error(err));

// Multer Storage Configuration (Only keeping PDF if uploaded local, images are completely API based now)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage }).fields([
    { name: 'postPdf', maxCount: 1 }
]);

// 📝 SECURITY MODEL: Admin Profile Config
const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, default: 'admin@example.com' },
    passwordHash: { type: String, required: true },
    currentOtp: { type: String, default: null },
    otpExpiry: { type: Date, default: null }
});
const Admin = mongoose.model('Admin', AdminSchema);

// Other Content Models
const Post = mongoose.model('Post', new mongoose.Schema({ type: String, title_en: String, title_hi: String, desc_en: String, desc_hi: String, targetLink: String, imageUrl: String, pdfUrl: String, keywords: String }, { timestamps: true }));
const Banner = mongoose.model('Banner', new mongoose.Schema({ title_en: String, title_hi: String, desc_en: String, desc_hi: String, targetLink: String, imageUrl: String }, { timestamps: true }));
const HotVacancy = mongoose.model('HotVacancy', new mongoose.Schema({ text_en: String, text_hi: String, targetLink: String }, { timestamps: true }));

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

// STEP 1: Password Check & Send OTP
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

// STEP 2: Verify OTP
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

// --- CORE FUNCTIONAL APP ROUTING (Updated Routes for API URLs) ---
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ createdAt: -1 })));
app.post('/api/posts', upload, async (req, res) => {
    const data = req.body;
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl; // 🌟 Directly uses API link from body
    if (req.files && req.files['postPdf']) data.pdfUrl = '/uploads/' + req.files['postPdf'][0].filename;
    await new Post(data).save(); res.json({ success: true });
});
app.put('/api/posts/:id', upload, async (req, res) => {
    const data = req.body;
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl; // 🌟 Directly updates API link from body
    if (req.files && req.files['postPdf']) data.pdfUrl = '/uploads/' + req.files['postPdf'][0].filename;
    await Post.findByIdAndUpdate(req.params.id, data); res.json({ success: true });
});
app.delete('/api/posts/:id', async (req, res) => { await Post.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get('/api/banners', async (req, res) => res.json(await Banner.find().sort({ createdAt: -1 })));
app.post('/api/banners', upload, async (req, res) => {
    const data = req.body;
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl; // 🌟 Directly uses API link from body
    await new Banner(data).save(); res.json({ success: true });
});
app.put('/api/banners/:id', upload, async (req, res) => {
    const data = req.body;
    if (req.body.imageUrl) data.imageUrl = req.body.imageUrl; // 🌟 Directly updates API link from body
    await Banner.findByIdAndUpdate(req.params.id, data); res.json({ success: true });
});
app.delete('/api/banners/:id', async (req, res) => { await Banner.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.get('/api/hotvacancies', async (req, res) => res.json(await HotVacancy.find().sort({ createdAt: -1 })));
app.post('/api/hotvacancies', async (req, res) => { await new HotVacancy(req.body).save(); res.json({ success: true }); });
app.put('/api/hotvacancies/:id', async (req, res) => { await HotVacancy.findByIdAndUpdate(req.params.id, req.body); res.json({ success: true }); });
app.delete('/api/hotvacancies/:id', async (req, res) => { await HotVacancy.findByIdAndDelete(req.params.id); res.json({ success: true }); });

app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    next();
});
app.listen(PORT, () => console.log(`🚀 Secure Executive Engine Active on Port: ${PORT}`));
