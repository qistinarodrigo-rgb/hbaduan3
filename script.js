// ========== FIREBASE CONFIG ==========
// db dah initialize dalam HTML

// Global variable
let aduanList = [];
let isLoading = false;

// ========== STAFF DIREKTORI ==========
const staffDirektori = [
    { 
        id: 1,
        nama: 'Encik Wan Mohd Faris bin Wan Razali', 
        jawatan: 'Pembantu Keselamatan', 
        telefon: '013-950 5396', 
        gambar: "images/faris3.png"
    }
];

// ========== NOTIFICATION FUNCTION ==========
function showNotification(message, isSuccess = true) {
    const existingNotif = document.querySelector('.notification-popup-top');
    if (existingNotif) existingNotif.remove();
    
    const notif = document.createElement('div');
    notif.className = `notification-popup-top ${isSuccess ? '' : 'error'}`;
    notif.innerHTML = isSuccess ? '✅ ' + message : '❌ ' + message;
    notif.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        background-color: ${isSuccess ? '#10b981' : '#ef4444'} !important;
        color: white !important;
        padding: 15px 25px !important;
        border-radius: 50px !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important;
        z-index: 999999 !important;
        font-weight: 500 !important;
        font-size: 16px !important;
        text-align: center !important;
        max-width: 90% !important;
        animation: slideDown 0.3s ease !important;
        pointer-events: none !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
    `;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s';
        setTimeout(() => notif.remove(), 500);
    }, 3000);
}

// ========== LOAD SEMUA ADUAN (UNTUK ADMIN) ==========
async function loadAduan() {
    if (isLoading) return [];
    isLoading = true;
    
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout - Sila semak sambungan internet')), 15000)
        );
        
        const queryPromise = db.collection('aduan')
            .orderBy('tarikh', 'desc')
            .get();
        
        const snapshot = await Promise.race([queryPromise, timeoutPromise]);
        const aduan = [];
        snapshot.forEach(doc => {
            aduan.push({ id: doc.id, ...doc.data() });
        });
        return aduan;
    } catch (error) {
        console.error('Error loading aduan:', error);
        showNotification(error.message || 'Gagal memuatkan aduan', false);
        return [];
    } finally {
        isLoading = false;
    }
}

// ========== LOAD 20 ADUAN TERBARU (UNTUK USER) ==========
async function loadAduanByUser(email) {
    if (isLoading) return [];
    isLoading = true;
    
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout - Sila semak sambungan internet')), 10000)
        );
        
        const queryPromise = db.collection('aduan')
            .where('userEmail', '==', email)
            .orderBy('tarikh', 'desc')
            .limit(20)
            .get();
        
        const snapshot = await Promise.race([queryPromise, timeoutPromise]);
        const aduan = [];
        snapshot.forEach(doc => {
            aduan.push({ id: doc.id, ...doc.data() });
        });
        return aduan;
    } catch (error) {
        console.error('Error loading aduan by user:', error);
        showNotification(error.message || 'Gagal memuatkan aduan anda', false);
        return [];
    } finally {
        isLoading = false;
    }
}

// ========== SAVE TO FIREBASE ==========
async function saveAduanToFirebase(aduan) {
    try {
        const docRef = await db.collection('aduan').add(aduan);
        return docRef.id;
    } catch (error) {
        console.error('Error saving aduan:', error);
        throw error;
    }
}

// ========== DELETE FROM FIREBASE ==========
async function deleteAduanFromFirebase(id) {
    try {
        await db.collection('aduan').doc(id).delete();
    } catch (error) {
        console.error('Error deleting aduan:', error);
        throw error;
    }
}

// ========== UPDATE STATUS ==========
async function updateAduanStatus(id, selesai) {
    try {
        await db.collection('aduan').doc(id).update({ selesai: selesai });
    } catch (error) {
        console.error('Error updating aduan:', error);
        throw error;
    }
}

// Load initial data
loadAduan().then(data => {
    aduanList = data;
    const currentPage = document.querySelector('.sidebar-item.active')?.dataset.page;
    if (currentPage) renderPage(currentPage);
});

// ========== LOGIN SYSTEM ==========
function checkLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');
    const userEmail = localStorage.getItem('userEmail');
    const lastPage = localStorage.getItem('lastPage') || 'home';
    
    if (isLoggedIn === 'true') {
        showApp(userType, userEmail);
        setTimeout(() => {
            setActivePage(lastPage);
        }, 100);
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp(userType, userEmail) {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    
    const userDisplay = document.getElementById('userDisplay');
    const userBadge = document.getElementById('userBadge');
    
    if (userType === 'admin') {
        userDisplay.innerHTML = `<strong>Admin</strong> (${userEmail})`;
        userBadge.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
        updateSidebarForAdmin();
        updateBottomNavForAdmin();
    } else {
        userDisplay.innerHTML = `<strong>User</strong> (${userEmail})`;
        userBadge.innerHTML = '<i class="fas fa-user"></i> User';
        updateSidebarForUser();
        updateBottomNavForUser();
    }
}

function updateSidebarForAdmin() {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    sidebarMenu.innerHTML = `
        <div class="sidebar-item" data-page="home">
            <i class="fas fa-home"></i>
            <span>Home</span>
        </div>
        <div class="sidebar-item" data-page="aduan">
            <i class="fas fa-pen-alt"></i>
            <span>Aduan</span>
        </div>
        <div class="sidebar-item" data-page="status">
            <i class="fas fa-check-circle"></i>
            <span>Status</span>
        </div>
        <div class="sidebar-item" data-page="direktori">
            <i class="fas fa-address-book"></i>
            <span>Direktori</span>
        </div>
    `;
    refreshSidebarListeners();
}

function updateSidebarForUser() {
    const sidebarMenu = document.querySelector('.sidebar-menu');
    sidebarMenu.innerHTML = `
        <div class="sidebar-item" data-page="home">
            <i class="fas fa-home"></i>
            <span>Home</span>
        </div>
        <div class="sidebar-item" data-page="aduan">
            <i class="fas fa-pen-alt"></i>
            <span>Aduan</span>
        </div>
        <div class="sidebar-item" data-page="direktori">
            <i class="fas fa-address-book"></i>
            <span>Direktori</span>
        </div>
    `;
    refreshSidebarListeners();
}

function updateBottomNavForAdmin() {
    const bottomNav = document.querySelector('.bottom-nav');
    bottomNav.innerHTML = `
        <button class="nav-item" data-page="aduan">
            <i class="fas fa-pen-alt"></i>
            <span>Aduan</span>
        </button>
        <button class="nav-item" data-page="status">
            <i class="fas fa-check-circle"></i>
            <span>Status</span>
        </button>
    `;
    refreshNavListeners();
}

function updateBottomNavForUser() {
    const bottomNav = document.querySelector('.bottom-nav');
    bottomNav.innerHTML = `
        <button class="nav-item" data-page="home">
            <i class="fas fa-home"></i>
            <span>Home</span>
        </button>
        <button class="nav-item" data-page="aduan">
            <i class="fas fa-pen-alt"></i>
            <span>Aduan</span>
        </button>
    `;
    refreshNavListeners();
}

function refreshSidebarListeners() {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.onclick = () => setActivePage(item.dataset.page);
    });
}

function refreshNavListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.onclick = () => setActivePage(item.dataset.page);
    });
}

// MOH login
document.getElementById('mohLoginBtn').onclick = function() {
    const email = document.getElementById('mohEmail').value.trim();
    const password = document.getElementById('mohPassword').value;
    
    if (!email || !password) {
        alert('Sila masukkan email dan password');
        return;
    }
    
    if (!email.includes('@moh.gov.my')) {
        alert('Email MOH mesti berakhir dengan @moh.gov.my');
        return;
    }
    
    let userType = '';
    if (password === 'admin123') userType = 'admin';
    else if (password === 'user123') userType = 'user';
    else {
        alert('Kata Laluan tidak tepat!');
        return;
    }
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userType', userType);
    localStorage.setItem('userEmail', email);
    
    showApp(userType, email);
    setActivePage('home');
};

// Logout
document.getElementById('logoutBtn').onclick = function() {
    localStorage.clear();
    showLogin();
    document.getElementById('mohEmail').value = '';
    document.getElementById('mohPassword').value = '';
};

// DOM elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const content = document.getElementById('content');
const pageTitle = document.getElementById('pageTitle');

menuBtn.onclick = () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
};

closeBtn.onclick = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
};

overlay.onclick = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
};

function setActivePage(page) {
    localStorage.setItem('lastPage', page);
    
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    pageTitle.textContent = page === 'home' ? 'Home' : 
                           page === 'aduan' ? 'Aduan' : 
                           page === 'status' ? 'Status' : 'Direktori';

    renderPage(page);

    if (window.innerWidth <= 768) closeSidebar();
}

function renderPage(page) {
    const userType = localStorage.getItem('userType');
    
    if (page === 'home') renderHome(userType);
    else if (page === 'aduan') renderAduan(userType);
    else if (page === 'status') renderStatus();
    else if (page === 'direktori') renderDirektori();
}

// ========== HOME PAGE ==========
function renderHome(userType) {
    let html = `
        <div class="home-container">
            <div class="home-header-card">
                <div class="header-background">
                    <img src="images/logohosp2.png" alt="Hospital Banting">
                    <div class="header-overlay"></div>
                </div>
                <div class="header-content">
                    <div class="profile-section">
                        <div class="profile-image">
                            <img src="images/profile uk4.png" alt="Hospital Icon">
                        </div>
                    </div>
                </div>
            </div>
    `;
    
    if (userType === 'admin') {
        html += `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fas fa-pen-alt"></i>
                    </div>
                    <div class="stat-details">
                        <span class="stat-value">${aduanList.length}</span>
                        <span class="stat-label">Jumlah Aduan</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-details">
                        <span class="stat-value">${aduanList.filter(a => a.selesai).length}</span>
                        <span class="stat-label">Selesai</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-details">
                        <span class="stat-value">${aduanList.filter(a => !a.selesai).length}</span>
                        <span class="stat-label">Dalam Proses</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-details">
                        <span class="stat-value">${staffDirektori.length}</span>
                        <span class="stat-label">Staf Keselamatan</span>
                    </div>
                </div>
            </div>
            <div class="recent-section">
                <div class="section-header">
                    <h3>Aduan Terkini</h3>
                    <button class="view-all" onclick="setActivePage('aduan')">Lihat Semua <i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="recent-list">
                    ${aduanList.slice(0, 3).map(a => `
                        <div class="recent-item">
                            <div class="recent-icon ${a.selesai ? 'completed' : 'pending'}">
                                <i class="fas ${a.selesai ? 'fa-check' : 'fa-clock'}"></i>
                            </div>
                            <div class="recent-details">
                                <h4>${a.jenis}</h4>
                                <p><i class="fas fa-user"></i> ${a.nama} • <i class="fas fa-map-marker-alt"></i> ${a.lokasi}</p>
                                <small><i class="fas fa-calendar"></i> ${a.tarikh} ${a.masa}</small>
                            </div>
                            <span class="recent-status ${a.selesai ? 'completed' : 'pending'}">
                                ${a.selesai ? 'Selesai' : 'Proses'}
                            </span>
                        </div>
                    `).join('')}
                    ${aduanList.length === 0 ? '<p style="text-align: center; color: #999; padding: 20px;">Tiada aduan buat masa ini</p>' : ''}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="quick-actions">
                <h3>Tindakan Pantas</h3>
                <div class="action-buttons">
                    <button class="action-btn" onclick="setActivePage('aduan')">
                        <i class="fas fa-plus-circle"></i>
                        <span>Buat Aduan</span>
                    </button>
                    <button class="action-btn" onclick="setActivePage('direktori')">
                        <i class="fas fa-address-book"></i>
                        <span>Hubungi Staf</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    html += `</div>`;
    content.innerHTML = html;
}

// ========== ADUAN PAGE ==========
function renderAduan(userType) {
    let html = '';
    
    if (userType === 'user') {
        html += `
            <div class="card">
                <h2>📝 Buat Aduan Baru</h2>
                <form id="formAduan">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Tarikh</label>
                            <input type="date" id="tarikh" required>
                        </div>
                        <div class="form-group">
                            <label>Masa</label>
                            <input type="time" id="masa" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Nama</label>
                        <input type="text" id="nama" placeholder="Nama penuh" required>
                    </div>
                    <div class="form-group">
                        <label>Jenis Aduan</label>
                        <input type="text" id="jenis" placeholder="Contoh: Kerosakan, Kebersihan, Keselamatan" required>
                    </div>
                    <div class="form-group">
                        <label>Lokasi</label>
                        <input type="text" id="lokasi" placeholder="Contoh: Blok B, Tingkat 2" required>
                    </div>
                    <div class="form-group">
                        <label>Gambar Bukti</label>
                        <div class="image-upload-area" id="uploadArea">
                            <i class="fas fa-cloud-upload-alt"></i>
                            <p>Klik untuk upload gambar</p>
                            <small>JPG, PNG, GIF (Max 5MB)</small>
                            <input type="file" id="gambar" accept="image/*" required>
                        </div>
                        <div class="preview-container">
                            <img id="preview" class="image-preview" alt="Preview">
                            <button type="button" class="remove-image" id="removeImage">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Catatan</label>
                        <textarea id="catatan" rows="4" placeholder="Terangkan secara ringkas..."></textarea>
                    </div>
                    <button type="submit" class="btn-primary" id="hantarAduanBtn">
                        <i class="fas fa-paper-plane"></i> Hantar Aduan
                    </button>
                </form>
            </div>
        `;
    }
    
    html += `
        <div class="card">
            <h2>📋 Senarai Aduan</h2>
            <div class="aduan-list" id="senaraiAduan"></div>
        </div>
    `;

    content.innerHTML = html;

    if (userType === 'user') {
        const gambarInput = document.getElementById('gambar');
        const preview = document.getElementById('preview');
        const removeBtn = document.getElementById('removeImage');

        if (gambarInput) {
            gambarInput.onchange = function(e) {
                const file = e.target.files[0];
                if(file?.size > 5 * 1024 * 1024) {
                    alert('Gambar terlalu besar! Maksimum 5MB');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = e => {
                    preview.src = e.target.result;
                    preview.classList.add('show');
                    removeBtn.classList.add('show');
                };
                reader.readAsDataURL(file);
            };
        }
        if (removeBtn) {
            removeBtn.onclick = () => {
                gambarInput.value = '';
                preview.src = '';
                preview.classList.remove('show');
                removeBtn.classList.remove('show');
            };
        }
        document.getElementById('hantarAduanBtn').onclick = handleHantarAduan;
    }
    
    refreshSenarai(userType);
}

async function refreshSenarai(userType) {
    const div = document.getElementById('senaraiAduan');
    if (!div) return;
    
    div.innerHTML = '<div style="text-align:center;color:#1e3a8a;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Memuatkan aduan...</div>';
    
    const currentUserEmail = localStorage.getItem('userEmail');
    const currentUserType = localStorage.getItem('userType');
    
    try {
        if (currentUserType === 'admin') {
            // ADMIN: Load SEMUA aduan
            aduanList = await loadAduan();
        } else {
            // USER: Load 20 aduan terbaru SAHAJA
            aduanList = await loadAduanByUser(currentUserEmail);
        }
        
        if (aduanList.length === 0) {
            div.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Tiada aduan buat masa ini</p>';
            return;
        }

        div.innerHTML = aduanList.map(aduan => `
            <div class="aduan-item">
                <div class="aduan-header">
                    <span class="aduan-nama">${aduan.nama}</span>
                    <span class="aduan-tarikh">${aduan.tarikh} ${aduan.masa}</span>
                    ${currentUserType === 'admin' ? `
                        <button class="delete-btn" onclick="deleteAduan('${aduan.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="aduan-detail">
                    <span>Jenis:</span><span>${aduan.jenis}</span>
                    <span>Lokasi:</span><span>${aduan.lokasi}</span>
                    <span>Catatan:</span><span>${aduan.catatan}</span>
                </div>
                ${aduan.gambar ? `<img src="${aduan.gambar}" loading="lazy" class="aduan-gambar">` : ''}
            </div>
        `).join('');
    } catch (error) {
        div.innerHTML = '<p style="text-align:center;color:#ef4444;padding:40px;">❌ Gagal memuatkan aduan. Sila refresh.</p>';
    }
}

// ========== HANDLE HANTAR ADUAN ==========
async function handleHantarAduan() {
    const btn = document.getElementById('hantarAduanBtn');
    const originalText = btn.innerHTML;
    
    const gambarFile = document.getElementById('gambar').files[0];
    if (!gambarFile) {
        showNotification('Sila upload gambar bukti', false);
        return;
    }
    
    if (gambarFile.size > 5 * 1024 * 1024) {
        showNotification('Gambar terlalu besar! Maksimum 5MB', false);
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Menghantar...';
    btn.disabled = true;
    
    try {
        const currentUserEmail = localStorage.getItem('userEmail');
        
        const reader = new FileReader();
        reader.onload = async function(event) {
            const newAduan = {
                tarikh: document.getElementById('tarikh').value,
                masa: document.getElementById('masa').value,
                nama: document.getElementById('nama').value,
                jenis: document.getElementById('jenis').value,
                lokasi: document.getElementById('lokasi').value,
                gambar: event.target.result,
                catatan: document.getElementById('catatan').value,
                userEmail: currentUserEmail,
                selesai: false
            };
            
            await saveAduanToFirebase(newAduan);
            showNotification('Aduan berjaya dihantar!', true);
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        };
        reader.readAsDataURL(gambarFile);
    } catch (error) {
        console.error(error);
        showNotification('Gagal hantar aduan', false);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ========== STATUS PAGE ==========
function renderStatus() {
    const userType = localStorage.getItem('userType');
    content.innerHTML = `<div class="card"><h2>✅ Status Penyelesaian Aduan</h2><div class="status-container" id="statusContainer"></div></div>`;
    refreshStatus(userType);
}

async function refreshStatus(userType) {
    const container = document.getElementById('statusContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;color:#1e3a8a;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Memuatkan status...</div>';
    
    const currentUserEmail = localStorage.getItem('userEmail');
    const currentUserType = localStorage.getItem('userType');
    
    try {
        if (currentUserType === 'admin') {
            // ADMIN: Load SEMUA aduan
            aduanList = await loadAduan();
        } else {
            // USER: Load 20 aduan terbaru SAHAJA
            aduanList = await loadAduanByUser(currentUserEmail);
        }
        
        if (aduanList.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Tiada aduan buat masa ini</p>';
            return;
        }

        container.innerHTML = aduanList.map(a => `
            <div class="status-item" data-id="${a.id}">
                <input type="checkbox" class="status-checkbox" ${a.selesai ? 'checked' : ''}>
                <div class="status-info">
                    <div style="display:flex;justify-content:space-between;align-items:start">
                        <div>
                            <h4>${a.jenis} - ${a.lokasi}</h4>
                            <p><i class="fas fa-user"></i> ${a.nama}</p>
                            <p><i class="fas fa-calendar"></i> ${a.tarikh} ${a.masa}</p>
                            <p><i class="fas fa-comment"></i> ${a.catatan}</p>
                            <span class="status-badge ${a.selesai ? 'selesai' : 'belum'}">${a.selesai ? '✓ Selesai' : '⏳ Belum Selesai'}</span>
                        </div>
                        ${currentUserType === 'admin' ? `<button class="delete-btn" onclick="deleteAduan('${a.id}')"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.status-checkbox').forEach(cb => {
            cb.onchange = async function() {
                const id = this.closest('.status-item').dataset.id;
                const aduan = aduanList.find(a => a.id === id);
                if (aduan) {
                    await updateAduanStatus(id, this.checked);
                    refreshStatus(userType);
                }
            };
        });
    } catch (error) {
        container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:40px;">❌ Gagal memuatkan status. Sila refresh.</p>';
    }
}

// ========== DIREKTORI PAGE ==========
function renderDirektori() {
    content.innerHTML = `
        <div class="card">
            <h2>📞 Direktori Staf Unit Keselamatan</h2>
            <div class="direktori-grid">
                ${staffDirektori.map(s => `
                    <div class="staf-card">
                        <img src="${s.gambar}"><h3>${s.nama}</h3><p>${s.jawatan}</p>
                        <p class="phone"><i class="fas fa-phone-alt"></i> ${s.telefon}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ========== DELETE ADUAN ==========
async function deleteAduan(id) {
    if (confirm('Padam aduan ini?')) {
        await deleteAduanFromFirebase(id);
        const currentPage = document.querySelector('.sidebar-item.active').dataset.page;
        renderPage(currentPage);
    }
}

checkLogin();