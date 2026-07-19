let globalDatabase = [];
let globalBanners = [];
let globalLanguage = 'en';
let currentActiveCategory = 'all';
let currentSlideIndex = 0;

async function bootstrapPortalData() {
    try {
        const [postsRes, bannersRes, tickerRes] = await Promise.all([
            fetch('/api/posts'), fetch('/api/banners'), fetch('/api/hotvacancies')
        ]);
        
        globalDatabase = await postsRes.json();
        globalBanners = await bannersRes.json();
        const tickers = await tickerRes.json();
        
        renderTicker(tickers);
        renderBanners(globalBanners);
        displayPortalData(globalDatabase);
    } catch(e) { console.error("Data mapping initialization error:", e); }
}

function renderTicker(data) {
    const el = document.getElementById('scrollingTicker');
    if(!el) return;
    if(data.length === 0) {
        el.innerHTML = `<span class="ticker-item">No dynamic vacancy alerts configured.</span>`;
        return;
    }
    el.innerHTML = data.map(item => {
        const text = globalLanguage === 'en' ? item.text_en : item.text_hi;
        const btn = globalLanguage === 'en' ? 'Apply Now »' : 'आवेदन करें »';
        return `<span class="ticker-item">⚡ ${text} <a href="${item.targetLink}" target="_blank">${btn}</a></span>`;
    }).join("");
}

function renderBanners(data) {
    const container = document.getElementById('bannerSliderContainer');
    if(!container) return;
    if(data.length === 0) {
        container.innerHTML = `
            <div class="slide-item active" style="background-image: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200')">
                <div class="slide-content">
                    <h2>GovUpdates Operational System Hub</h2>
                    <p>Configure dynamic slider sets from the master terminal console panel.</p>
                </div>
            </div>`;
        return;
    }
    container.innerHTML = data.map((banner, index) => {
        const title = globalLanguage === 'en' ? banner.title_en : banner.title_hi;
        const desc = globalLanguage === 'en' ? banner.desc_en : banner.desc_hi;
        const btnText = globalLanguage === 'en' ? 'View Details / Apply Now' : 'पूर्ण विवरण देखें';
        return `
            <div class="slide-item ${index === 0 ? 'active' : ''}" style="background-image: url('${banner.imageUrl}')">
                <div class="slide-content">
                    <h2>${title}</h2>
                    <p>${desc}</p>
                    <a href="${banner.targetLink}" target="_blank" class="slide-btn">${btnText}</a>
                </div>
            </div>`;
    }).join("");
    currentSlideIndex = 0;
    updateSliderUI();
}

function moveSlide(direction) {
    const slides = document.querySelectorAll('.slide-item');
    if(slides.length <= 1) return;
    currentSlideIndex = (currentSlideIndex + direction + slides.length) % slides.length;
    updateSliderUI();
}

function updateSliderUI() {
    const container = document.getElementById('bannerSliderContainer');
    if(container) container.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
}

setInterval(() => moveSlide(1), 6000);

function displayPortalData(dataArray) {
    const grid = document.getElementById('mainDisplayGrid');
    if(!grid) return;
    grid.innerHTML = "";
    
    let filtered = currentActiveCategory === 'all' ? dataArray : dataArray.filter(i => i.type === currentActiveCategory);
    
    if(filtered.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; color:#9ca3af;">No elements loaded in this category block.</p>`;
        return;
    }

    filtered.forEach(item => {
        const title = globalLanguage === 'en' ? item.title_en : item.title_hi;
        const desc = globalLanguage === 'en' ? item.desc_en : item.desc_hi;
        const badge = item.type.toLowerCase();
        
        const actionText = item.type === 'Jobs' 
            ? (globalLanguage === 'en' ? 'Apply Online' : 'आवेदन करें')
            : (globalLanguage === 'en' ? 'Download PDF' : 'डाउनलोड करें');
            
        const btnClass = item.type === 'Jobs' ? 'apply-btn' : 'download-btn';
        
        const finalThumb = item.imageUrl || (item.type === 'Jobs' ? 'https://images.unsplash.com/photo-1521791136368-1a9b7d89136d?w=150' : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150');
        const finalLink = item.pdfUrl || item.targetLink || '#';

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div>
                <div class="card-header-area">
                    <img src="${finalThumb}" class="card-thumbnail" alt="Thumb">
                    <div class="card-main-info">
                        <span class="badge ${badge}">${item.type}</span>
                        <h3>${title}</h3>
                    </div>
                </div>
                <p>${desc}</p>
            </div>
            <div class="action-area">
                <span class="time-stamp">⏱️ Live Update</span>
                <a href="${finalLink}" target="_blank" class="${btnClass}">${actionText}</a>
            </div>`;
        grid.appendChild(card);
    });
}

function filterCategory(cat) {
    currentActiveCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    const targetedBtn = document.getElementById(`btn-${cat==='E-Notes'?'notes':cat==='Books'?'books':cat==='Jobs'?'jobs':'all'}`);
    if(targetedBtn) targetedBtn.classList.add('active');
    displayPortalData(globalDatabase);
}

const menuBtn = document.getElementById('menuBtn');
if(menuBtn) {
    menuBtn.addEventListener('click', (e) => {
        document.getElementById('langDropdown').classList.toggle('show');
        e.stopPropagation();
    });
}
window.addEventListener('click', () => {
    const drop = document.getElementById('langDropdown');
    if(drop) drop.classList.remove('show');
});

function changeLanguage(lang) {
    globalLanguage = lang;
    bootstrapPortalData();
}

document.addEventListener('DOMContentLoaded', bootstrapPortalData);
