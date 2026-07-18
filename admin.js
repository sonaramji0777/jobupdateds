document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        type: document.getElementById('type').value,
        title_en: document.getElementById('title_en').value,
        title_hi: document.getElementById('title_hi').value,
        desc_en: document.getElementById('desc_en').value,
        desc_hi: document.getElementById('desc_hi').value,
        targetLink: document.getElementById('targetLink').value,
        keywords: document.getElementById('keywords').value
    };

    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('🎉 Status: Success! Post is live on dynamic nodes.');
            document.getElementById('uploadForm').reset();
        } else {
            alert('Server insertion failure error occurred.');
        }
    } catch (err) {
        console.error("Transmission breakdown:", err);
    }
});
