let storePosts = [], storeBanners = [], storeHv = [];

async function submitStep1() {
    const pass = document.getElementById('masterPassField').value;
    const res = await fetch('/api/auth/step1', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById('step1Box').style.display = 'none';
        document.getElementById('step2Box').style.display = 'block';
    } else { alert(data.message || "Invalid Key Credentials"); }
}

async function submitStep2() {
    const code = document.getElementById('otpField').value;
    const res = await fetch('/api/auth/step2', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ otp: code })
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById('authGate').style.display = 'none';
        document.getElementById('controlDashboard').style.display = 'block';
        syncAllCollections();
    } else { alert(data.message || "OTP Authentication Interrupted"); }
}

async function triggerForgotPassword() {
    if(!confirm("Route a temporary recovery access token to the master configuration email?")) return;
    const res = await fetch('/api/auth/forgot-password', { method: 'POST' });
    const data = await res.json();
    if(data.success) alert("System recovery key dispatched successfully to Gmail.");
}

async function executePasswordReset() {
    const newPass = document.getElementById('newMasterPasswordField').value;
    if(!newPass) return alert("Fields cannot remain unassigned.");
    const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ newPassword: newPass })
    });
    const data = await res.json();
    if(data.success) { alert("Master security credential overwritten!"); document.getElementById('newMasterPasswordField').value=""; }
}

function switchView(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

async function syncAllCollections() {
    try {
        const [p, b, h] = await Promise.all([fetch('/api/posts'), fetch('/api/banners'), fetch('/api/hotvacancies')]);
        storePosts = await p.json(); storeBanners = await b.json(); storeHv = await h.json();
        renderAllTables();
    } catch(e) { console.error(e); }
}

function renderAllTables() {
    document.getElementById('postsTableRows').innerHTML = storePosts.map(item => `<tr><td>${item.type}</td><td><strong>${item.title_en}</strong></td><td><button class="action-btn-edit" onclick="initiateEditPost('${item._id}')">Edit</button><button class="action-btn-del" onclick="deleteTargetItem('/api/posts/', '${item._id}')">Delete</button></td></tr>`).join("");
    document.getElementById('bannersTableRows').innerHTML = storeBanners.map(item => `<tr><td><strong>${item.title_en}</strong></td><td><a href="${item.targetLink}" target="_blank" style="color:var(--primary);">Open URL</a></td><td><button class="action-btn-edit" onclick="initiateEditBanner('${item._id}')">Edit</button><button class="action-btn-del" onclick="deleteTargetItem('/api/banners/', '${item._id}')">Delete</button></td></tr>`).join("");
    document.getElementById('hvTableRows').innerHTML = storeHv.map(item => `<tr><td><strong>${item.text_en}</strong></td><td><button class="action-btn-edit" onclick="initiateEditHv('${item._id}')">Edit</button><button class="action-btn-del" onclick="deleteTargetItem('/api/hotvacancies/', '${item._id}')">Delete</button></td></tr>`).join("");
}

// Submitting JSON payloads instead of multi-part form data objects
document.getElementById('postForm').addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const id = document.getElementById('postEditId').value;
    const payload = {
        type: document.getElementById('postType').value,
        title_en: document.getElementById('postTitleEn').value,
        title_hi: document.getElementById('postTitleHi').value,
        desc_en: document.getElementById('postDescEn').value,
        desc_hi: document.getElementById('postDescHi').value,
        targetLink: document.getElementById('postTargetLink').value,
        imageUrl: document.getElementById('postImageUrl').value,
        pdfUrl: document.getElementById('postPdfUrl').value,
        keywords: document.getElementById('postKeywords').value
    };
    
    const res = await fetch(id ? `/api/posts/${id}` : '/api/posts', { 
        method: id ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
    }); 
    if(res.ok) { alert("Done!"); resetPostForm(); syncAllCollections(); } 
});

document.getElementById('bannerForm').addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const id = document.getElementById('bannerEditId').value;
    const payload = {
        title_en: document.getElementById('bTitleEn').value,
        title_hi: document.getElementById('bTitleHi').value,
        desc_en: document.getElementById('bDescEn').value,
        desc_hi: document.getElementById('bDescHi').value,
        targetLink: document.getElementById('bTargetLink').value,
        imageUrl: document.getElementById('bImageUrl').value
    };
    const res = await fetch(id ? `/api/banners/${id}` : '/api/banners', { 
        method: id ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
    }); 
    if(res.ok) { alert("Done!"); resetBannerForm(); syncAllCollections(); } 
});

document.getElementById('hvForm').addEventListener('submit', async (e) => { 
    e.preventDefault(); 
    const id = document.getElementById('hvEditId').value; 
    const payload = { 
        text_en: document.getElementById('hvTextEn').value, 
        text_hi: document.getElementById('hvTextHi').value, 
        targetLink: document.getElementById('hvTargetLink').value 
    }; 
    const res = await fetch(id ? `/api/hotvacancies/${id}` : '/api/hotvacancies', { 
        method: id ? 'PUT' : 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(payload) 
    }); 
    if(res.ok) { alert("Done!"); resetHvForm(); syncAllCollections(); } 
});

function initiateEditPost(id) { 
    const item = storePosts.find(x => x._id === id); 
    document.getElementById('postEditId').value = item._id; 
    document.getElementById('postType').value = item.type; 
    document.getElementById('postTitleEn').value = item.title_en; 
    document.getElementById('postTitleHi').value = item.title_hi; 
    document.getElementById('postDescEn').value = item.desc_en; 
    document.getElementById('postDescHi').value = item.desc_hi; 
    document.getElementById('postTargetLink').value = item.targetLink || ""; 
    document.getElementById('postImageUrl').value = item.imageUrl || ""; 
    document.getElementById('postPdfUrl').value = item.pdfUrl || ""; 
    document.getElementById('postKeywords').value = item.keywords || ""; 
    document.getElementById('postFormTitle').innerText = "Modify Record"; 
    document.getElementById('postSubmitBtn').innerText = "Apply Updates"; 
    document.getElementById('postCancelBtn').style.display = "block"; 
}

function initiateEditBanner(id) { 
    const item = storeBanners.find(x => x._id === id); 
    document.getElementById('bannerEditId').value = item._id; 
    document.getElementById('bTitleEn').value = item.title_en; 
    document.getElementById('bTitleHi').value = item.title_hi; 
    document.getElementById('bDescEn').value = item.desc_en; 
    document.getElementById('bDescHi').value = item.desc_hi; 
    document.getElementById('bTargetLink').value = item.targetLink; 
    document.getElementById('bImageUrl').value = item.imageUrl || ""; 
    document.getElementById('bannerFormTitle').innerText = "Modify Slide"; 
    document.getElementById('bannerSubmitBtn').innerText = "Apply Updates"; 
    document.getElementById('bannerCancelBtn').style.display = "block"; 
}

function initiateEditHv(id) { 
    const item = storeHv.find(x => x._id === id); 
    document.getElementById('hvEditId').value = item._id; 
    document.getElementById('hvTextEn').value = item.text_en; 
    document.getElementById('hvTextHi').value = item.text_hi; 
    document.getElementById('hvTargetLink').value = item.targetLink; 
    document.getElementById('hvFormTitle').innerText = "Modify Alert"; 
    document.getElementById('hvSubmitBtn').innerText = "Apply Updates"; 
    document.getElementById('hvCancelBtn').style.display = "block"; 
}

function resetPostForm() { document.getElementById('postForm').reset(); document.getElementById('postEditId').value=""; document.getElementById('postFormTitle').innerText="Create Dynamic Post"; document.getElementById('postCancelBtn').style.display="none"; }
function resetBannerForm() { document.getElementById('bannerForm').reset(); document.getElementById('bannerEditId').value=""; document.getElementById('bannerFormTitle').innerText="Create Showcase Banner Slide"; document.getElementById('bannerCancelBtn').style.display="none"; }
function resetHvForm() { document.getElementById('hvForm').reset(); document.getElementById('hvEditId').value=""; document.getElementById('hvFormTitle').innerText="Add Hot Alert Item"; document.getElementById('hvCancelBtn').style.display="none"; }
async function deleteTargetItem(apiEndpoint, id) { if(!confirm("Delete profile permanently?")) return; const res = await fetch(`${apiEndpoint}${id}`, { method: 'DELETE' }); if(res.ok) { alert("Cleared."); syncAllCollections(); } }
