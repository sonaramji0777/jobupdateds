
// Post Form Handler
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // FormData se data uthayein (isme text fields aur file dono aa jayenge)
    const formData = new FormData(e.target);
    const id = document.getElementById('postEditId').value;

    try {
        const response = await fetch(id ? `/api/posts/${id}` : '/api/posts', {
            method: id ? 'PUT' : 'POST',
            body: formData // FormData khud hi header set kar leta hai, alag se 'Content-Type' dene ki zaroorat nahi
        });

        if (response.ok) {
            alert('🎉 Status: Success! Asset has been injected.');
            resetPostForm();
            syncAllCollections(); // Ye function aapki admin.html mein already hai
        } else {
            alert('Server insertion failure.');
        }
    } catch (err) {
        console.error("Transmission breakdown:", err);
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
