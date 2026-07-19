
// Post Form Handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;
    
    try {
        const response = await fetch('/api/auth/step1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            alert('OTP dispatched to your email!');
            // Yahan Step 2 (OTP verification) ka box dikhayein
        } else {
            alert('Invalid Password');
        }
    } catch (err) {
        console.error("Auth error:", err);
    }
});

// Banner Form Handler
document.getElementById('bannerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Banner ke liye JSON payload (kyunki yahan file upload nahi hai)
    const payload = {
        title_en: document.getElementById('bTitleEn').value,
        title_hi: document.getElementById('bTitleHi').value,
        desc_en: document.getElementById('bDescEn').value,
        desc_hi: document.getElementById('bDescHi').value,
        targetLink: document.getElementById('bTargetLink').value,
        imageUrl: document.getElementById('bImageUrl').value // Ye field ab direct link le rahi hai
    };

    const id = document.getElementById('bannerEditId').value;
    try {
        const response = await fetch(id ? `/api/banners/${id}` : '/api/banners', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('🎉 Status: Banner slide updated.');
            resetBannerForm();
            syncAllCollections();
        }
    } catch (err) {
        console.error("Transmission breakdown:", err);
    }
});
