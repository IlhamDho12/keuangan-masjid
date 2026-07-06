// ================= FIREBASE CONFIG =================
const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyBgO3NzTYlwCtTERQQ5tXN41CkSMRM_gmc',
    authDomain: 'keuangan-masjid-rk.firebaseapp.com',
    projectId: 'keuangan-masjid-rk',
    storageBucket: 'keuangan-masjid-rk.firebasestorage.app',
    messagingSenderId: '777548315983',
    appId: '1:777548315983:web:d61cc7602e211088c8d93a'
};

const ADMIN_LOGIN_EMAIL = '2010802002@radenfatah.ac.id';
const ADMIN_EMAILS = [ADMIN_LOGIN_EMAIL];
const APP_SETTINGS_DOC = 'main';
const PUBLIC_ACCESS_URL = 'https://keuangan-masjid-rk.web.app';
const PUBLIC_ACCESS_QR_SRC = 'assets/access-qr.png?v=20260701';

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let firebaseReady = false;
let cropperInstance = null;
let activeCropCallback = null;

if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firestoreDb = firebase.firestore();
    firebaseAuth = firebase.auth();
    firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch((error) => {
        console.warn('Gagal mengatur session login:', error);
    });
    firebaseReady = true;
}

// ================= INITIAL SEED DATA =================
// Helper to generate dates relative to today
const getRelativeDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

const createDemoGalleryImage = (title, primary, secondary) => (
    `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${primary}"/><stop offset="1" stop-color="${secondary}"/></linearGradient></defs><rect width="900" height="560" fill="url(#g)"/><circle cx="740" cy="120" r="90" fill="rgba(255,255,255,.16)"/><circle cx="130" cy="450" r="130" fill="rgba(255,255,255,.12)"/><rect x="95" y="95" width="710" height="370" rx="34" fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.35)" stroke-width="3"/><text x="450" y="265" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="800" fill="white">${title}</text><text x="450" y="320" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="rgba(255,255,255,.82)">Masjid Raudhatul Khoiriyah</text></svg>`)}`
);

function compressImageFile(file, maxSize = 1280, quality = 0.78) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error('File gambar tidak bisa diproses.'));
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

const INITIAL_COMMITTEE_MEMBERS = [
    { id: 'committee-mosque-chair', group: 'mosque', name: 'Supriyadi', role: 'Ketua', photo_url: null },
    { id: 'committee-mosque-secretary', group: 'mosque', name: 'Dr. Rahmad', role: 'Sekretaris', photo_url: null },
    { id: 'committee-mosque-treasurer', group: 'mosque', name: 'Ardy Toher', role: 'Bendahara', photo_url: null },
    { id: 'committee-mosque-worship', group: 'mosque', name: 'Kiai Damrulah', role: 'Peribadatan', photo_url: null },
    { id: 'committee-mosque-phbi', group: 'mosque', name: 'Alkodri', role: 'Ketua Peringatan Hari Besar Islam', photo_url: null },
    { id: 'committee-mosque-public-relations', group: 'mosque', name: 'Mang Kader', role: 'Humas', photo_url: null },
    { id: 'committee-mosque-development', group: 'mosque', name: 'Belum Diisi', role: 'Ketua Pembangunan', photo_url: null },
    { id: 'committee-youth-chair', group: 'youth', name: 'Ucok', role: 'Ketua', photo_url: null },
    { id: 'committee-youth-vice-chair', group: 'youth', name: 'Redo', role: 'Wakil Ketua', photo_url: null },
    { id: 'committee-youth-secretary', group: 'youth', name: 'Kak Deki', role: 'Sekretaris', photo_url: null },
    { id: 'committee-youth-treasurer', group: 'youth', name: 'Yuk Desi', role: 'Bendahara', photo_url: null },
    { id: 'committee-youth-study', group: 'youth', name: 'Kak Edi', role: 'Pengajian', photo_url: null },
    { id: 'committee-youth-public-relations', group: 'youth', name: 'Ronal', role: 'Humas', photo_url: null }
];

const INITIAL_GALLERY_ITEMS = [
    { id: 'gallery-demo-1', date: getRelativeDateString(2), title: 'Pengajian Bulanan Jamaah', description: 'Kegiatan pengajian rutin bersama jamaah sekitar masjid setelah salat Magrib.', image_url: createDemoGalleryImage('Pengajian Bulanan', '#065f46', '#0f766e') },
    { id: 'gallery-demo-2', date: getRelativeDateString(9), title: 'Kerja Bakti Masjid', description: 'Gotong royong membersihkan area masjid, halaman, dan tempat wudu bersama pengurus serta remaja masjid.', image_url: createDemoGalleryImage('Kerja Bakti', '#0f766e', '#f59e0b') },
    { id: 'gallery-demo-3', date: getRelativeDateString(18), title: 'Santunan Jumat Berkah', description: 'Penyaluran paket bantuan untuk warga sekitar sebagai bagian dari program sosial masjid.', image_url: createDemoGalleryImage('Jumat Berkah', '#064e3b', '#15803d') }
];

const INITIAL_SCHEDULES = [
    { id: 'schedule-demo-1', date: getRelativeDateString(-2), time: '19:30', title: 'Yasinan Malam Jumat', description: 'Pembacaan Yasin dan doa bersama jamaah.', pic: 'Pengurus Masjid', show_ticker: true, status: 'active', completed_at: null, auto_delete_at: null },
    { id: 'schedule-demo-2', date: getRelativeDateString(-5), time: '16:00', title: 'Pengajian Remaja Masjid', description: 'Kajian rutin dan pembinaan remaja masjid.', pic: 'Remaja Masjid', show_ticker: true, status: 'active', completed_at: null, auto_delete_at: null }
];

const INITIAL_TRANSACTIONS = [
    { id: 'tx-demo-1', date: getRelativeDateString(0), amount: 2750000, type: 'income', description: 'Infak Jumat pekan pertama Juli', storage: 'cash', receipt_url: null },
    { id: 'tx-demo-2', date: getRelativeDateString(1), amount: 1500000, type: 'income', description: 'Transfer donatur untuk program santunan', storage: 'bank', receipt_url: null },
    { id: 'tx-demo-3', date: getRelativeDateString(2), amount: 420000, type: 'expense', description: 'Pembelian perlengkapan kebersihan masjid', storage: 'cash', receipt_url: null },
    { id: 'tx-demo-4', date: getRelativeDateString(6), amount: 875000, type: 'expense', description: 'Pembayaran tagihan listrik dan air', storage: 'bank', receipt_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2364748b">BUKTI PEMBAYARAN UTILITAS</text></svg>' },
    { id: 'tx-demo-5', date: '2026-05-18', amount: 3200000, type: 'income', description: 'Donasi pembangunan kanopi halaman', storage: 'bank', receipt_url: null }
];

const INITIAL_PROJECTS = [
    { id: 'proj-demo-1', title: 'Perbaikan Sound System Masjid', target_amount: 8500000, collected_amount: 4250000, status: 'active', description: 'Penggantian mixer audio dan beberapa mikrofon agar suara imam serta penceramah lebih jelas.' },
    { id: 'proj-demo-2', title: 'Program Paket Sembako Jumat Berkah', target_amount: 6000000, collected_amount: 6000000, status: 'completed', description: 'Pengadaan paket sembako untuk warga sekitar masjid yang membutuhkan.' },
    { id: 'proj-demo-3', title: 'Pengecatan Pagar Depan', target_amount: 4500000, collected_amount: 900000, status: 'active', description: 'Pengecatan ulang pagar depan dan gerbang kecil agar area masjid terlihat lebih rapi.' }
];

const INITIAL_FEEDBACKS = [
    { id: 'fb-demo-1', sender_name: 'Ibu Sari', phone_number: '081234567890', message: 'Mohon jadwal kerja bakti kebersihan masjid diumumkan lebih awal agar jamaah bisa ikut membantu.', status: 'unread', created_at: getRelativeDateString(0) },
    { id: 'fb-demo-2', sender_name: 'Hamba Allah', phone_number: '', message: 'Laporan kas sudah mudah dibaca. Semoga fitur bukti transaksi bisa terus dilengkapi.', status: 'read', created_at: getRelativeDateString(3) },
    { id: 'fb-demo-3', sender_name: 'Pak Dani', phone_number: '085612345678', message: 'Usul agar program perbaikan sound system diprioritaskan sebelum kegiatan pengajian bulanan.', status: 'unread', created_at: getRelativeDateString(5) }
];

// ================= APP STATE MANAGEMENT =================
let state = {
    transactions: [],
    projects: [],
    feedbacks: [],
    treasurerName: 'Ardi Toher',
    treasurerRole: 'Bendahara',
    treasurerAvatar: '',
    bankName: 'Bri',
    bankAccountNumber: '71234567890',
    bankAccountHolder: 'Masjid Raudhatul Khoiriyah',
    whatsappNumber: '6285369463373',
    isAdminAuthenticated: false,
    currentRole: sessionStorage.getItem('current_role') || 'public', // 'public' | 'admin'
    activeAdminTab: 'adm-screen-tx',
    editingTxId: null,
    tempReceiptBase64: null,
    committeeMembers: [],
    galleryItems: [],
    schedules: [],
    lastAdminUpdatedAt: null,
    tempCommitteePhotoBase64: null,
    tempGalleryImageBase64: null,
    editingScheduleId: null
};

function isAdminUser(user) {
    return !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase());
}

function getSettingsState() {
    return {
        treasurerName: state.treasurerName,
        treasurerRole: state.treasurerRole,
        treasurerAvatar: state.treasurerAvatar,
        bankName: state.bankName,
        bankAccountNumber: state.bankAccountNumber,
        bankAccountHolder: state.bankAccountHolder,
        whatsappNumber: state.whatsappNumber,
        committeeMembers: state.committeeMembers,
        schedules: state.schedules,
        lastAdminUpdatedAt: state.lastAdminUpdatedAt
    };
}

function getFullStateSnapshot() {
    return {
        transactions: state.transactions,
        projects: state.projects,
        feedbacks: state.feedbacks,
        galleryItems: state.galleryItems,
        ...getSettingsState()
    };
}

function applyLoadedState(parsed, includeFeedbacks = true) {
    state.transactions = parsed.transactions || INITIAL_TRANSACTIONS;
    state.projects = parsed.projects || INITIAL_PROJECTS;
    if (includeFeedbacks) state.feedbacks = parsed.feedbacks || [];
    state.treasurerName = parsed.treasurerName || 'Ardi Toher';
    state.treasurerRole = parsed.treasurerRole || 'Bendahara';
    state.treasurerAvatar = parsed.treasurerAvatar || '';
    state.bankName = parsed.bankName || 'Bri';
    state.bankAccountNumber = parsed.bankAccountNumber || '71234567890';
    state.bankAccountHolder = parsed.bankAccountHolder || 'Masjid Raudhatul Khoiriyah';
    state.whatsappNumber = parsed.whatsappNumber || '6285369463373';
    
    const loadedCommitteeMembers = Array.isArray(parsed.committeeMembers) ? parsed.committeeMembers : [...INITIAL_COMMITTEE_MEMBERS];
    state.committeeMembers = loadedCommitteeMembers;
    
    state.galleryItems = Array.isArray(parsed.galleryItems) ? parsed.galleryItems : [...INITIAL_GALLERY_ITEMS];
    state.schedules = cleanupExpiredSchedules(Array.isArray(parsed.schedules) ? parsed.schedules : [...INITIAL_SCHEDULES]);
    state.lastAdminUpdatedAt = parsed.lastAdminUpdatedAt || null;
}

function getLocalFallbackState() {
    const localData = localStorage.getItem('masjid_finance_state_v4') || localStorage.getItem('masjid_finance_state_v3');
    if (!localData) return null;
    try {
        return JSON.parse(localData);
    } catch (err) {
        console.error('Error parsing local fallback state', err);
        return null;
    }
}

function mergeLocalGalleryFallback() {
    const localState = getLocalFallbackState();
    if (!localState || !Array.isArray(localState.galleryItems)) return;

    const localLastUpdated = localState.lastAdminUpdatedAt || '';
    const remoteLastUpdated = state.lastAdminUpdatedAt || '';
    if (!localLastUpdated || localLastUpdated <= remoteLastUpdated) return;

    const mergedById = new Map((state.galleryItems || []).map(item => [item.id, item]));
    localState.galleryItems.forEach(localItem => {
        if (!localItem || !localItem.id) return;
        const remoteItem = mergedById.get(localItem.id);
        const localUpdated = localItem.updated_at || '';
        const remoteUpdated = remoteItem?.updated_at || '';
        if (!remoteItem || (localUpdated && localUpdated > remoteUpdated)) {
            mergedById.set(localItem.id, localItem);
        }
    });

    state.galleryItems = Array.from(mergedById.values());
}

async function getCollectionData(collectionName) {
    const snapshot = await firestoreDb.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function replaceCollection(batch, collectionName, items) {
    const collectionRef = firestoreDb.collection(collectionName);
    const existing = await collectionRef.get();
    const nextIds = new Set(items.map(item => item.id));

    existing.docs.forEach(doc => {
        if (!nextIds.has(doc.id)) batch.delete(doc.ref);
    });

    items.forEach(item => {
        const { id, ...payload } = item;
        batch.set(collectionRef.doc(id), payload);
    });
}

async function loadStateFromFirestore(includeFeedbacks) {
    const [transactions, projects, galleryItems, settingsDoc] = await Promise.all([
        getCollectionData('transactions'),
        getCollectionData('projects'),
        getCollectionData('galleryItems'),
        firestoreDb.collection('settings').doc(APP_SETTINGS_DOC).get()
    ]);

    let feedbacks = [];
    if (includeFeedbacks) {
        feedbacks = await getCollectionData('feedbacks');
    }

    applyLoadedState({
        transactions: transactions.length ? transactions : INITIAL_TRANSACTIONS,
        projects: projects.length ? projects : INITIAL_PROJECTS,
        feedbacks,
        ...(settingsDoc.exists ? settingsDoc.data() : {}),
        galleryItems: galleryItems.length ? galleryItems : (settingsDoc.exists ? settingsDoc.data().galleryItems : undefined)
    }, includeFeedbacks);
    mergeLocalGalleryFallback();
}

// Save state to Firestore, with localStorage fallback for offline preview.
async function saveState() {
    try {
        if (!firebaseReady || !state.isAdminAuthenticated) throw new Error('Firestore admin write unavailable');

        const batch = firestoreDb.batch();
        await replaceCollection(batch, 'transactions', state.transactions);
        await replaceCollection(batch, 'projects', state.projects);
        await replaceCollection(batch, 'feedbacks', state.feedbacks);
        await replaceCollection(batch, 'galleryItems', state.galleryItems);
        batch.set(firestoreDb.collection('settings').doc(APP_SETTINGS_DOC), getSettingsState());
        await batch.commit();
        localStorage.setItem('masjid_finance_state_v4', JSON.stringify(getFullStateSnapshot()));
        console.log('State saved to Firestore successfully.');
    } catch (e) {
        console.warn('Firestore unavailable, saving state to localStorage fallback.', e);
        localStorage.setItem('masjid_finance_state_v4', JSON.stringify(getFullStateSnapshot()));
    }
}

// Load state from Firestore, with localStorage/seed fallback for local preview.
async function loadState() {
    const canReadPrivateData = state.isAdminAuthenticated;
    try {
        if (!firebaseReady) throw new Error('Firebase SDK unavailable');
        await loadStateFromFirestore(canReadPrivateData);
        console.log('State loaded from Firestore successfully.');
    } catch (e) {
        console.warn('Firestore unavailable, loading fallback state.', e);
        const localData = localStorage.getItem('masjid_finance_state_v4') || localStorage.getItem('masjid_finance_state_v3');
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                applyLoadedState(parsed, true);
            } catch (err) {
                console.error("Error parsing localStorage data, resetting to seed data", err);
                resetToInitialData();
            }
        } else {
            resetToInitialData();
        }
    }
    
    // Once state is loaded, update views
    updateProfileDisplay();
    updateAccessQrCode();
    
    if (state.currentRole === 'admin' && state.isAdminAuthenticated) {
        switchMode('admin');
    } else {
        switchMode('public');
    }
}

// Reset state to initial seed data
function resetToInitialData() {
    state.transactions = [...INITIAL_TRANSACTIONS];
    state.projects = [...INITIAL_PROJECTS];
    state.feedbacks = [...INITIAL_FEEDBACKS];
    state.treasurerName = 'Ardi Toher';
    state.treasurerRole = 'Bendahara';
    state.treasurerAvatar = '';
    state.bankName = 'Bri';
    state.bankAccountNumber = '71234567890';
    state.bankAccountHolder = 'Masjid Raudhatul Khoiriyah';
    state.whatsappNumber = '6285369463373';
    state.committeeMembers = [...INITIAL_COMMITTEE_MEMBERS];
    state.galleryItems = [...INITIAL_GALLERY_ITEMS];
    state.schedules = [...INITIAL_SCHEDULES];
    state.lastAdminUpdatedAt = null;
    state.editingCommitteeId = null;
    state.editingGalleryId = null;
    state.activeGalleryIndex = 0;
    state.tempCommitteePhotoBase64 = null;
    state.tempGalleryImageBase64 = null;
    saveState();
}

function addDaysToDateString(dateString, days) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

function cleanupExpiredSchedules(schedules) {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(schedule => !(schedule.status === 'completed' && schedule.auto_delete_at && schedule.auto_delete_at < today));
}

function touchAdminUpdate() {
    state.lastAdminUpdatedAt = new Date().toISOString();
}

function formatAdminUpdatedAt() {
    if (!state.lastAdminUpdatedAt) return 'Belum ada pembaruan dari admin.';
    const date = new Date(state.lastAdminUpdatedAt);
    const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `Data terakhir diperbarui admin: ${dateStr}, pukul ${timeStr} WIB`;
}

function materializeCommitteeMembers() {
    if (!Array.isArray(state.committeeMembers) || state.committeeMembers.length === 0) {
        state.committeeMembers = INITIAL_COMMITTEE_MEMBERS.map(item => ({ ...item }));
    }
}

function materializeGalleryItems() {
    if (!Array.isArray(state.galleryItems) || state.galleryItems.length === 0) {
        state.galleryItems = INITIAL_GALLERY_ITEMS.map(item => ({ ...item }));
    }
}

function materializeSchedules() {
    if (!Array.isArray(state.schedules) || state.schedules.length === 0) {
        state.schedules = INITIAL_SCHEDULES.map(item => ({ ...item }));
    }
    state.schedules = cleanupExpiredSchedules(state.schedules);
}

function getSchedulesForDisplay() {
    return cleanupExpiredSchedules(Array.isArray(state.schedules) && state.schedules.length ? state.schedules : INITIAL_SCHEDULES);
}

function getActiveSchedules() {
    return getSchedulesForDisplay()
        .filter(schedule => schedule.status !== 'completed')
        .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

function formatScheduleTime(schedule) {
    return `${formatDateString(schedule.date)} · ${schedule.time || '--:--'} WIB`;
}

function getFilteredGalleryItems() {
    const monthFilter = document.getElementById('gallery-filter-month')?.value || 'all';
    const yearFilter = document.getElementById('gallery-filter-year')?.value || 'all';

    return [...getGalleryItemsForDisplay()]
        .filter(item => {
            const itemMonth = item.date?.substr(5, 2);
            const itemYear = item.date?.substr(0, 4);
            const matchesMonth = monthFilter === 'all' || itemMonth === monthFilter;
            const matchesYear = yearFilter === 'all' || itemYear === yearFilter;
            return matchesMonth && matchesYear;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getGalleryItemsForDisplay() {
    return Array.isArray(state.galleryItems) && state.galleryItems.length ? state.galleryItems : INITIAL_GALLERY_ITEMS;
}


// Update Treasurer Profile Header and Settings Inputs
function updateProfileDisplay() {
    const profileNameEl = document.getElementById('admin-profile-name');
    const profileRoleEl = document.getElementById('admin-profile-role');
    const avatarEl = document.getElementById('admin-profile-avatar');
    const settingsAvatarEl = document.getElementById('settings-profile-avatar');
    
    const inputNameEl = document.getElementById('change-admin-name');
    const inputRoleEl = document.getElementById('change-admin-role');
    const inputBankNameEl = document.getElementById('change-bank-name');
    const inputBankAccEl = document.getElementById('change-bank-acc');
    const inputBankOwnerEl = document.getElementById('change-bank-owner');
    const inputWaNumberEl = document.getElementById('change-wa-number');

    if (profileNameEl) profileNameEl.textContent = state.treasurerName;
    if (profileRoleEl) profileRoleEl.textContent = state.treasurerRole;

    if (inputNameEl) inputNameEl.value = state.treasurerName;
    if (inputRoleEl) inputRoleEl.value = state.treasurerRole;
    if (inputBankNameEl) inputBankNameEl.value = state.bankName;
    if (inputBankAccEl) inputBankAccEl.value = state.bankAccountNumber;
    if (inputBankOwnerEl) inputBankOwnerEl.value = state.bankAccountHolder;
    if (inputWaNumberEl) inputWaNumberEl.value = state.whatsappNumber;
    
    // Determine avatar image source
    let avatarSrc = '';
    if (state.treasurerAvatar) {
        avatarSrc = state.treasurerAvatar;
    } else {
        // Fallback to initials dynamic SVG
        const initials = state.treasurerName
            .split(' ')
            .filter(w => !w.includes('.') && w.length > 0) // Skip title abbreviations like H. or S.E.
            .map(w => w[0])
            .join('')
            .toUpperCase()
            .substr(0, 2);
        
        const finalInitials = initials || 'BD';
        avatarSrc = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%23064e3b'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='38' fill='%23fbbf24'>${finalInitials}</text></svg>`;
    }

    if (avatarEl) avatarEl.src = avatarSrc;
    if (settingsAvatarEl) settingsAvatarEl.src = avatarSrc;

    const miniAvatarEl = document.getElementById('admin-avatar-mini');
    const miniNameEl = document.getElementById('admin-name-mini');
    if (miniAvatarEl) miniAvatarEl.src = avatarSrc;
    if (miniNameEl) miniNameEl.textContent = state.treasurerName.split(',')[0];
}

function getPublicAccessUrl() {
    return PUBLIC_ACCESS_URL;
}

async function updateAccessQrCode() {
    const accessUrl = getPublicAccessUrl();
    const accessUrlEl = document.getElementById('qr-access-url');
    const qrImageEl = document.getElementById('qr-image-src');

    if (accessUrlEl) accessUrlEl.textContent = accessUrl;
    if (!qrImageEl) return;

    try {
        qrImageEl.alt = `QR Code akses ${accessUrl}`;
        qrImageEl.src = PUBLIC_ACCESS_QR_SRC;
    } catch (err) {
        console.warn('Failed to load QR code.', err);
        qrImageEl.removeAttribute('src');
        qrImageEl.alt = `QR belum tersedia. Buka: ${accessUrl}`;
    }
}

async function getImageDataUrl(imageEl) {
    if (!imageEl?.src) return '';
    if (imageEl.src.startsWith('data:image')) return imageEl.src;

    if (!imageEl.complete || imageEl.naturalWidth === 0) {
        await new Promise((resolve) => {
            imageEl.onload = resolve;
            imageEl.onerror = resolve;
            setTimeout(resolve, 2500);
        });
    }

    if (!imageEl.naturalWidth || !imageEl.naturalHeight) return '';

    const canvas = document.createElement('canvas');
    canvas.width = imageEl.naturalWidth;
    canvas.height = imageEl.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageEl, 0, 0);
    return canvas.toDataURL('image/png');
}

// ================= CORE UI CONTROLLERS =================

// Show Toast Alert
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    
    toastMsg.textContent = message;
    toast.className = `toast active ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Format currency as IDR
function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Calculate Balances
function calculateBalances() {
    let totalCash = 0;
    let totalBank = 0;
    
    state.transactions.forEach(tx => {
        const amt = parseFloat(tx.amount);
        if (tx.type === 'income') {
            if (tx.storage === 'cash') totalCash += amt;
            else totalBank += amt;
        } else {
            if (tx.storage === 'cash') totalCash -= amt;
            else totalBank -= amt;
        }
    });

    return {
        cash: totalCash,
        bank: totalBank,
        total: totalCash + totalBank
    };
}

// Calculate Monthly Income for Current Month
function calculateMonthlyIncome() {
    let income = 0;
    const today = new Date();
    const currentYM = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    state.transactions.forEach(tx => {
        if (tx.type === 'income' && tx.date.substr(0, 7) === currentYM) {
            income += parseFloat(tx.amount);
        }
    });
    return income;
}

// Calculate Monthly Expense for Current Month
function calculateMonthlyExpense() {
    let expense = 0;
    const today = new Date();
    const currentYM = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    state.transactions.forEach(tx => {
        if (tx.type === 'expense' && tx.date.substr(0, 7) === currentYM) {
            expense += parseFloat(tx.amount);
        }
    });
    return expense;
}

// Switch App Mode (public | auth | admin)
function switchMode(mode) {
    document.body.className = `mode-${mode}`;
    
    document.querySelectorAll('.screen-group').forEach(g => g.classList.remove('active'));
    
    if (mode === 'public') {
        state.currentRole = 'public';
        document.getElementById('screens-public').classList.add('active');
        document.getElementById('btn-go-admin').style.display = 'flex';
        document.getElementById('btn-admin-logout').style.display = 'none';
        document.getElementById('admin-header-profile').style.display = 'none';
        document.getElementById('header-subtitle').textContent = 'Pendopo, Empat Lawang, Sumatera Selatan';
        
        switchAppScreen('pub-screen-beranda', 'public');
        renderPublicView();
    } else if (mode === 'auth') {
        document.getElementById('screens-auth').classList.add('active');
        document.getElementById('btn-go-admin').style.display = 'none';
        document.getElementById('btn-admin-logout').style.display = 'none';
        document.getElementById('admin-header-profile').style.display = 'none';
        document.getElementById('header-subtitle').textContent = 'Login Admin';
    } else if (mode === 'admin') {
        state.currentRole = 'admin';
        document.getElementById('screens-admin').classList.add('active');
        document.getElementById('btn-go-admin').style.display = 'none';
        document.getElementById('btn-admin-logout').style.display = 'flex';
        document.getElementById('admin-header-profile').style.display = 'flex';
        document.getElementById('header-subtitle').textContent = 'Dashboard Pengurus';
        
        switchAppScreen('adm-screen-tx', 'admin');
        renderAdminDashboard();
    }
}

// More Menu Sheet Helpers
function openPublicMoreSheet() {
    const sheet = document.getElementById('public-more-sheet');
    if (sheet) {
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
    }
}

function closePublicMoreSheet() {
    const sheet = document.getElementById('public-more-sheet');
    if (sheet) {
        sheet.classList.remove('active');
        sheet.setAttribute('aria-hidden', 'true');
    }
}

function navigatePublicMoreScreen(screenId) {
    closePublicMoreSheet();
    switchAppScreen(screenId, 'public');
}

function openAdminMoreSheet() {
    const sheet = document.getElementById('admin-more-sheet');
    if (sheet) {
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
    }
}

function closeAdminMoreSheet() {
    const sheet = document.getElementById('admin-more-sheet');
    if (sheet) {
        sheet.classList.remove('active');
        sheet.setAttribute('aria-hidden', 'true');
    }
}

function navigateAdminMoreScreen(screenId) {
    closeAdminMoreSheet();
    switchAppScreen(screenId, 'admin');
}

// Switch Bottom Navigation Screen
function switchAppScreen(screenId, group) {
    // Hide all screens in the group
    document.querySelectorAll(`#screens-${group} .app-screen`).forEach(s => s.classList.remove('active'));
    // Show target screen
    document.getElementById(screenId).classList.add('active');
    
    // Update bottom nav buttons
    document.querySelectorAll(`#bottom-nav-${group} .bnav-btn`).forEach(btn => {
        if (btn.getAttribute('data-screen') === screenId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Scroll body to top naturally
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    if (group === 'admin') {
        state.activeAdminTab = screenId;
        renderAdminActiveTab();
    }
}

// Committee Member Detail Pop-up
window.viewCommitteeDetail = function(id) {
    const member = state.committeeMembers.find(m => m.id === id);
    if (!member) return;
    
    const modal = document.getElementById('modal-committee-detail');
    const photoEl = document.getElementById('committee-detail-photo');
    const nameEl = document.getElementById('committee-detail-name');
    const roleEl = document.getElementById('committee-detail-role');
    const groupEl = document.getElementById('committee-detail-group');
    if (!modal || !photoEl || !nameEl || !roleEl || !groupEl) return;
    
    const avatarSrc = (member.photo_url && member.photo_url !== 'null') ? member.photo_url : `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%230f766e'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='32' fill='white'>${member.name.substring(0, 2).toUpperCase()}</text></svg>`;
    
    photoEl.src = avatarSrc;
    nameEl.textContent = member.name;
    roleEl.textContent = member.role;
    groupEl.textContent = member.group === 'mosque' ? 'Pengurus Masjid Raudhatul Khoiriyah' : 'Remaja Masjid Raudhatul Khoiriyah';
    
    modal.classList.add('active');
};

// Gallery Detail Pop-up
window.viewGalleryDetail = function() {
    const items = getFilteredGalleryItems();
    if (items.length === 0) return;
    const activeItem = items[state.activeGalleryIndex];
    if (!activeItem) return;
    
    const modal = document.getElementById('modal-gallery-detail');
    const imgEl = document.getElementById('gallery-detail-image');
    const dateEl = document.getElementById('gallery-detail-date');
    const titleEl = document.getElementById('gallery-detail-title');
    const descEl = document.getElementById('gallery-detail-desc');
    if (!modal || !imgEl || !dateEl || !titleEl || !descEl) return;
    
    imgEl.src = activeItem.image_url;
    dateEl.textContent = formatDateString(activeItem.date);
    titleEl.textContent = activeItem.title;
    descEl.textContent = activeItem.description;
    
    modal.classList.add('active');
};

// ================= RENDER PUBLIC VIEW =================
function renderPublicView() {
    const balances = calculateBalances();
    
    // Set KPI Values
    document.getElementById('pub-total-cash').textContent = formatCurrency(balances.total);
    document.getElementById('pub-cash-balance').textContent = formatCurrency(balances.cash);
    document.getElementById('pub-bank-balance').textContent = formatCurrency(balances.bank);

    const bankDetailsEl = document.getElementById('pub-bank-details');
    if (bankDetailsEl) {
        bankDetailsEl.innerHTML = `${state.bankName}, No. Rek: <strong>${state.bankAccountNumber}</strong> a/n ${state.bankAccountHolder}`;
    }

    // Last Updated Timestamp
    const lastUpdatedEl = document.getElementById('pub-last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = formatAdminUpdatedAt();
    }

    // Populate year filter dropdowns dynamically from actual transaction data
    const yearsInData = [...new Set(state.transactions.map(tx => tx.date.substr(0, 4)))].sort((a, b) => b - a);
    const currentYear = new Date().getFullYear().toString();
    if (!yearsInData.includes(currentYear)) yearsInData.unshift(currentYear);
    
    ['filter-year', 'chart-filter-year'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = `<option value="all">Semua Tahun</option>`;
        yearsInData.forEach(y => {
            select.innerHTML += `<option value="${y}">${y}</option>`;
        });
        // Restore previous selection if still valid
        if (currentVal && [...select.options].find(o => o.value === currentVal)) {
            select.value = currentVal;
        }
    });

    // Set Hero Section Values
    document.getElementById('hero-total-cash').textContent = formatCurrency(balances.total);
    document.getElementById('hero-monthly-income').textContent = formatCurrency(calculateMonthlyIncome());
    document.getElementById('hero-monthly-expense').textContent = formatCurrency(calculateMonthlyExpense());

    // Render components
    renderSVGChart();
    renderPublicProjects();
    renderPublicTransactions();
    renderPublicCommittee();
    renderPublicGallery();
    renderPublicSchedules();
    renderScheduleTicker();
}

// Render Custom SVG Chart (Dynamic Filter based on Year and Month Selectors)
function renderSVGChart() {
    const wrapper = document.getElementById('svg-chart-wrapper');
    if (!wrapper) return;

    const yearFilterEl = document.getElementById('chart-filter-year');
    const monthFilterEl = document.getElementById('chart-filter-month');
    
    const yearFilter = yearFilterEl ? yearFilterEl.value : 'all';
    const monthFilter = monthFilterEl ? monthFilterEl.value : 'all';
    
    const chartData = [];
    const today = new Date();
    let isRolling6Months = false;

    if (yearFilter === 'all' && monthFilter === 'all') {
        // Case 1: Rolling last 6 months (default original behavior)
        isRolling6Months = true;
        const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            chartData.push({
                label: `${monthsName[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`,
                key: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`,
                income: 0,
                expense: 0
            });
        }

        // Aggregate transactions into monthly slots
        state.transactions.forEach(tx => {
            const txYM = tx.date.substr(0, 7); // 'YYYY-MM'
            const slot = chartData.find(s => s.key === txYM);
            if (slot) {
                if (tx.type === 'income') slot.income += parseFloat(tx.amount);
                else slot.expense += parseFloat(tx.amount);
            }
        });
    } else if (yearFilter !== 'all' && monthFilter === 'all') {
        // Case 2: Specific Year, All Months -> Show all 12 months of selected year
        const monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        for (let m = 0; m < 12; m++) {
            const monthStr = (m + 1).toString().padStart(2, '0');
            chartData.push({
                label: monthsName[m],
                key: `${yearFilter}-${monthStr}`,
                income: 0,
                expense: 0
            });
        }

        state.transactions.forEach(tx => {
            const txYM = tx.date.substr(0, 7);
            const slot = chartData.find(s => s.key === txYM);
            if (slot) {
                if (tx.type === 'income') slot.income += parseFloat(tx.amount);
                else slot.expense += parseFloat(tx.amount);
            }
        });
    } else if (yearFilter !== 'all' && monthFilter !== 'all') {
        // Case 3: Specific Year & Specific Month -> Show weekly breakdown (Mgg 1 to Mgg 4)
        chartData.push(
            { label: 'Mgg 1 (1-7)', key: 'w1', income: 0, expense: 0 },
            { label: 'Mgg 2 (8-14)', key: 'w2', income: 0, expense: 0 },
            { label: 'Mgg 3 (15-21)', key: 'w3', income: 0, expense: 0 },
            { label: 'Mgg 4 (22+)', key: 'w4', income: 0, expense: 0 }
        );

        state.transactions.forEach(tx => {
            const txY = tx.date.substr(0, 4);
            const txM = tx.date.substr(5, 2);
            if (txY === yearFilter && txM === monthFilter) {
                const day = parseInt(tx.date.substr(8, 2));
                let slotKey = 'w4';
                if (day <= 7) slotKey = 'w1';
                else if (day <= 14) slotKey = 'w2';
                else if (day <= 21) slotKey = 'w3';

                const slot = chartData.find(s => s.key === slotKey);
                if (slot) {
                    if (tx.type === 'income') slot.income += parseFloat(tx.amount);
                    else slot.expense += parseFloat(tx.amount);
                }
            }
        });
    } else {
        // Case 4: All Years, Specific Month -> Compare this month across years (2024, 2025, 2026)
        const years = ['2024', '2025', '2026'];
        const monthsFullName = {
            '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun',
            '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des'
        };
        const monthLabel = monthsFullName[monthFilter] || '';

        years.forEach(y => {
            chartData.push({
                label: `${monthLabel} ${y}`,
                key: `${y}-${monthFilter}`,
                income: 0,
                expense: 0
            });
        });

        state.transactions.forEach(tx => {
            const txYM = tx.date.substr(0, 7);
            const slot = chartData.find(s => s.key === txYM);
            if (slot) {
                if (tx.type === 'income') slot.income += parseFloat(tx.amount);
                else slot.expense += parseFloat(tx.amount);
            }
        });
    }

    // Determine max value for chart scaling
    let maxVal = 2000000; // minimum scale threshold
    chartData.forEach(s => {
        if (s.income > maxVal) maxVal = s.income;
        if (s.expense > maxVal) maxVal = s.expense;
    });
    maxVal = maxVal * 1.15; // add 15% breathing room at top

    // SVG Drawing Parameters
    const svgWidth = 800;
    const svgHeight = 250;
    const paddingLeft = 70; // Larger padding for currency numbers
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Generate grid lines
    let gridLinesHTML = '';
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
        const val = (maxVal / gridSteps) * i;
        const y = svgHeight - paddingBottom - (chartHeight / gridSteps) * i;
        
        // Horizontal grid line
        gridLinesHTML += `<line class="grid-line" x1="${paddingLeft}" y1="${y}" x2="${svgWidth - paddingRight}" y2="${y}" />`;
        // Y-axis label
        gridLinesHTML += `<text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" font-weight="600" font-size="10px">${formatChartYLabel(val)}</text>`;
    }

    // Generate bars and X-axis labels
    let barsHTML = '';
    const numSlots = chartData.length;
    const colWidth = chartWidth / numSlots;
    const barWidth = colWidth * (isRolling6Months ? 0.32 : (numSlots > 6 ? 0.22 : 0.28));

    chartData.forEach((s, idx) => {
        const xCenter = paddingLeft + colWidth * idx + colWidth / 2;
        const xIn = xCenter - barWidth - 3;
        const xOut = xCenter + 3;

        const hIn = (s.income / maxVal) * chartHeight;
        const hOut = (s.expense / maxVal) * chartHeight;

        const yIn = svgHeight - paddingBottom - hIn;
        const yOut = svgHeight - paddingBottom - hOut;

        // Income Bar (Green)
        barsHTML += `<rect class="bar-in" x="${xIn}" y="${yIn}" width="${barWidth}" height="${hIn}">
            <title>${s.label} - Pemasukan: ${formatCurrency(s.income)}</title>
        </rect>`;
        
        // Expense Bar (Red)
        barsHTML += `<rect class="bar-out" x="${xOut}" y="${yOut}" width="${barWidth}" height="${hOut}">
            <title>${s.label} - Pengeluaran: ${formatCurrency(s.expense)}</title>
        </rect>`;

        // X-axis label
        barsHTML += `<text x="${xCenter}" y="${svgHeight - paddingBottom + 20}" text-anchor="middle" font-weight="600" font-size="10px">${s.label}</text>`;
    });

    // Compile entire SVG
    wrapper.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="chart-svg">
            <!-- Grid and Y axis -->
            ${gridLinesHTML}
            <!-- Axis lines -->
            <line x1="${paddingLeft}" y1="${svgHeight - paddingBottom}" x2="${svgWidth - paddingRight}" y2="${svgHeight - paddingBottom}" stroke="#cbd5e1" stroke-width="1.5" />
            <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${svgHeight - paddingBottom}" stroke="#cbd5e1" stroke-width="1.5" />
            <!-- Bars and X Labels -->
            ${barsHTML}
        </svg>
    `;
}

// Format chart Y labels for cleaner display (e.g. 1.2M or 500rb)
function formatChartYLabel(val) {
    if (val >= 1000000) {
        return (val / 1000000).toFixed(1).replace('.0', '') + ' Jt';
    } else if (val >= 1000) {
        return (val / 1000).toFixed(0) + ' Rb';
    }
    return val;
}

// Render Public Projects List
function renderPublicProjects() {
    const container = document.getElementById('public-projects-container');
    if (!container) return;

    container.innerHTML = '';
    state.projects.forEach(p => {
        const pct = Math.min(100, Math.round((p.collected_amount / p.target_amount) * 100));
        const isCompleted = p.status === 'completed' || pct >= 100;
        
        // Helper template for active donations
        const donationGuideHTML = isCompleted ? '' : `
            <div class="project-donation-guide" style="margin-top: 1rem; padding: 0.75rem; background-color: var(--primary-50); border: 1px dashed var(--primary-300); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--primary-900);">
                <p style="margin: 0; font-weight: 600; line-height: 1.45; color: var(--primary-800);">
                    Cara Berdonasi Khusus Proyek Ini:
                </p>
                <p style="margin: 0.25rem 0 0; line-height: 1.4; color: var(--neutral-700);">
                    Transfer ke <strong>${state.bankName} ${state.bankAccountNumber}</strong> dengan berita transfer: <code>"${p.title.substr(0, 25)}"</code>
                </p>
                <a href="https://wa.me/${state.whatsappNumber}?text=${encodeURIComponent(`Assalamu'alaikum Pengurus Masjid Raudhatul Khoiriyah, saya ingin mengonfirmasi donasi transfer untuk proyek: ${p.title}`)}" 
                   target="_blank" 
                   style="display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.5rem; color: var(--accent-700); font-weight: 700; text-decoration: none; font-size: 0.75rem; transition: opacity 0.2s;"
                   onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="color: var(--accent-600);"><path d="M12.004 2c-5.523 0-10 4.477-10 10a9.96 9.96 0 0 0 1.554 5.297L2.004 22l4.896-1.517A9.957 9.957 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm-.004 18a7.96 7.96 0 0 1-4.296-1.247l-.307-.183-2.9 0.898 0.916-2.825-.2-.319a7.96 7.96 0 0 1-1.217-4.323c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
                    Konfirmasi Donasi via WhatsApp
                </a>
            </div>
        `;

        container.innerHTML += `
            <div class="project-card ${isCompleted ? 'completed' : ''}">
                <span class="project-badge ${isCompleted ? 'completed-bg' : 'active-bg'}">
                    ${isCompleted ? 'Selesai' : 'Aktif'}
                </span>
                <h3>${p.title}</h3>
                <p class="desc">${p.description}</p>
                <div class="project-progress-wrapper">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fg" style="width: ${pct}%"></div>
                    </div>
                    <div class="progress-labels">
                        <span>${pct}% Terkumpul</span>
                        <span class="progress-pct">${isCompleted ? 'Target Tercapai!' : 'Sedang Berjalan'}</span>
                    </div>
                </div>
                <div class="project-stats-grid">
                    <div class="p-stat">
                        <span>Target Pendanaan</span>
                        <span>${formatCurrency(p.target_amount)}</span>
                    </div>
                    <div class="p-stat">
                        <span>Terkumpul</span>
                        <span>${formatCurrency(p.collected_amount)}</span>
                    </div>
                </div>
                ${donationGuideHTML}
            </div>
        `;
    });
}

// Render Public Transactions List
function renderPublicTransactions() {
    const tbody = document.getElementById('public-tx-body');
    if (!tbody) return;

    // Get search and filter values
    const query = document.getElementById('search-tx').value.toLowerCase();
    const monthFilter = document.getElementById('filter-month').value;
    const yearFilter = document.getElementById('filter-year').value;
    const typeFilter = document.getElementById('filter-type').value;

    // Filter transaction list
    const filteredTx = state.transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(query);
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        
        // Date format: YYYY-MM-DD
        const txYear = tx.date.substr(0, 4);
        const txMonth = tx.date.substr(5, 2);
        
        const matchesMonth = monthFilter === 'all' || txMonth === monthFilter;
        const matchesYear = yearFilter === 'all' || txYear === yearFilter;
        
        return matchesSearch && matchesType && matchesMonth && matchesYear;
    });

    // Sort by date descending
    filteredTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';
    
    if (filteredTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Tidak ada transaksi yang cocok dengan kriteria filter.</td></tr>`;
        // Hide show-more row
        const showMoreRow = document.getElementById('tx-show-more-row');
        if (showMoreRow) showMoreRow.style.display = 'none';
        return;
    }

    // Limit display: 15 rows default, show all if requested
    const showAll = document.getElementById('tx-show-all-flag')?.dataset.showAll === 'true';
    const displayTx = showAll ? filteredTx : filteredTx.slice(0, 15);
    const hiddenCount = filteredTx.length - displayTx.length;

    displayTx.forEach(tx => {
        const typeBadge = tx.type === 'income' 
            ? '<span class="badge-in">Pemasukan</span>' 
            : '<span class="badge-out">Pengeluaran</span>';
        
        const receiptButton = tx.receipt_url 
            ? `<button class="btn-receipt" onclick="viewReceipt('${tx.id}')" title="Lihat Bukti Transaksi">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6 14H7v-2h6v2zm3-4H7v-2h9v2zm0-4H7V7h9v2z"/></svg>
               </button>`
            : `<button class="btn-receipt disabled" disabled title="Tidak ada bukti">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
               </button>`;

        tbody.innerHTML += `
            <tr>
                <td class="number-font">${formatDateString(tx.date)}</td>
                <td style="font-weight: 500;">${tx.description}</td>
                <td>${typeBadge}</td>
                <td class="text-right number-font" style="font-weight: 700; color: ${tx.type === 'income' ? 'var(--primary-700)' : 'var(--danger-600)'}">
                    ${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}
                </td>
                <td class="text-center">${receiptButton}</td>
            </tr>
        `;
    });

    // Show / hide "Lihat semua" row
    const showMoreRow = document.getElementById('tx-show-more-row');
    if (showMoreRow) {
        if (hiddenCount > 0) {
            showMoreRow.style.display = '';
            showMoreRow.innerHTML = `<td colspan="5" class="text-center" style="padding: 0.75rem;">
                <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 1rem;" onclick="toggleShowAllTx(true)">
                    Lihat ${hiddenCount} transaksi lainnya ↓
                </button>
            </td>`;
        } else if (showAll && filteredTx.length > 15) {
            showMoreRow.style.display = '';
            showMoreRow.innerHTML = `<td colspan="5" class="text-center" style="padding: 0.75rem;">
                <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 0.35rem 1rem;" onclick="toggleShowAllTx(false)">
                    Tampilkan lebih sedikit ↑
                </button>
            </td>`;
        } else {
            showMoreRow.style.display = 'none';
        }
    }
}

// Toggle show all transactions in public table
window.toggleShowAllTx = function(showAll) {
    const flag = document.getElementById('tx-show-all-flag');
    if (flag) flag.dataset.showAll = showAll ? 'true' : 'false';
    renderPublicTransactions();
};

// Convert date YYYY-MM-DD into DD MMM YYYY (e.g. 30 Jun 2026)
function formatDateString(str) {
    const parts = str.split('-');
    if (parts.length !== 3) return str;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

// View Receipt in Modal (Triggered by button click in tables)
window.viewReceipt = function(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx || !tx.receipt_url) return;

    const modal = document.getElementById('modal-receipt');
    const modalImg = document.getElementById('receipt-modal-img');
    const modalDesc = document.getElementById('receipt-modal-desc');

    modalImg.src = tx.receipt_url;
    modalDesc.innerHTML = `
        Transaksi: <strong>${tx.description}</strong><br>
        Tanggal: ${formatDateString(tx.date)} | Nominal: <strong>${formatCurrency(tx.amount)}</strong>
    `;

    modal.classList.add('active');
};

// Handle Public Feedback submission
async function handlePublicFeedbackSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('feedback-name');
    const phoneInput = document.getElementById('feedback-phone');
    const messageInput = document.getElementById('feedback-message');

    const nameVal = nameInput.value.trim() || 'Hamba Allah';
    const phoneVal = phoneInput.value.trim();
    const msgVal = messageInput.value.trim();

    if (!msgVal) return;

    const newFeedback = {
        id: 'fb-' + Date.now(),
        sender_name: nameVal,
        phone_number: phoneVal,
        message: msgVal,
        status: 'unread',
        created_at: new Date().toISOString().split('T')[0]
    };

    state.feedbacks.push(newFeedback);

    try {
        if (firebaseReady) {
            const { id, ...payload } = newFeedback;
            await firestoreDb.collection('feedbacks').doc(id).set(payload);
        } else {
            await saveState();
        }
    } catch (err) {
        console.error('Failed to submit feedback', err);
        showToast('Aspirasi belum berhasil terkirim. Silakan coba lagi.', 'error');
        return;
    }

    // Clear form
    nameInput.value = '';
    phoneInput.value = '';
    messageInput.value = '';

    // Show Success Modal (which automatically blurs keyboard)
    showSuccess('Aspirasi Terkirim!', 'Terima kasih, aspirasi atau saran Anda telah berhasil terkirim ke pengurus masjid secara amanah.');
}

// ================= RENDER ADMIN DASHBOARD =================
function renderAdminDashboard() {
    // Render active tab workspace
    renderAdminActiveTab();
    updateUnreadFeedbackBadge();
}

function updateUnreadFeedbackBadge() {
    const badge = document.getElementById('feedback-badge');
    const unreadCount = state.feedbacks.filter(f => f.status === 'unread').length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function renderAdminActiveTab() {
    // Note: visibility is already handled by switchAppScreen. We just need to trigger rendering logic.
    if (state.activeAdminTab === 'adm-screen-tx') {
        renderAdminTxTab();
    } else if (state.activeAdminTab === 'adm-screen-program') {
        renderAdminProjectsTab();
    } else if (state.activeAdminTab === 'adm-screen-aspirasi') {
        renderAdminFeedbackTab();
    } else if (state.activeAdminTab === 'adm-screen-bagan') {
        renderAdminCommitteeList();
    } else if (state.activeAdminTab === 'adm-screen-jadwal') {
        renderAdminScheduleList();
    } else if (state.activeAdminTab === 'adm-screen-galeri') {
        renderAdminGalleryList();
    }
}

// Render Admin TX Tab List
function renderAdminTxTab() {
    // Fill default date in form to today if empty
    const txDateInput = document.getElementById('tx-date');
    if (!txDateInput.value) {
        txDateInput.value = new Date().toISOString().split('T')[0];
    }

    const tbody = document.getElementById('admin-tx-table-body');
    if (!tbody) return;

    // Sort all transactions newest-first
    const sortedTx = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';
    
    if (sortedTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada data transaksi. Gunakan form di atas untuk menambahkan.</td></tr>`;
        return;
    }

    sortedTx.forEach(tx => {
        const storageLabel = tx.storage === 'cash' ? 'Tunai/Kas' : `Bank (${state.bankName})`;
        const isEditMode = state.editingTxId === tx.id;
        
        tbody.innerHTML += `
            <tr style="${isEditMode ? 'background: var(--primary-50); outline: 2px solid var(--primary-400);' : ''}">
                <td class="number-font">${formatDateString(tx.date)}</td>
                <td style="font-weight: 500; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${tx.description}">${tx.description}</td>
                <td class="number-font" style="font-weight: 700; color: ${tx.type === 'income' ? 'var(--primary-700)' : 'var(--danger-600)'}">
                    ${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}
                </td>
                <td><span class="${tx.type === 'income' ? 'badge-in' : 'badge-out'}">${tx.type === 'income' ? 'Masuk' : 'Keluar'}</span></td>
                <td>${storageLabel}</td>
                <td class="text-center" style="white-space: nowrap;">
                    <button class="btn-action btn-edit" onclick="editTransaction('${tx.id}')" title="Edit Transaksi" style="margin-right: 4px;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button class="btn-action btn-del" onclick="deleteTransaction('${tx.id}')" title="Hapus Transaksi">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </td>
            </tr>
        `;
    });
}

// Confirmation Modal State and Handler
let confirmCallback = null;
window.showConfirm = function(message, onConfirm, okButtonText = 'Ya, Hapus', isDanger = true) {
    const modal = document.getElementById('modal-confirm');
    const textEl = document.getElementById('confirm-modal-text');
    const okBtn = document.getElementById('btn-confirm-ok');
    const iconEl = modal ? modal.querySelector('.confirm-icon') : null;
    
    if (!modal || !textEl || !okBtn) return;
    
    textEl.textContent = message;
    okBtn.textContent = okButtonText;
    
    if (isDanger) {
        okBtn.className = 'btn btn-danger';
        if (iconEl) {
            iconEl.style.background = 'var(--danger-100)';
            iconEl.style.color = 'var(--danger-600)';
        }
    } else {
        okBtn.className = 'btn btn-primary';
        if (iconEl) {
            iconEl.style.background = 'var(--primary-100)';
            iconEl.style.color = 'var(--primary-700)';
        }
    }
    
    confirmCallback = onConfirm;
    modal.classList.add('active');
};

// Success Alert Modal Handler
window.showSuccess = function(title, message) {
    // Blur any active input to dismiss mobile keyboard
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
    
    const modal = document.getElementById('modal-success');
    const titleEl = document.getElementById('success-modal-title');
    const textEl = document.getElementById('success-modal-text');
    
    if (!modal || !titleEl || !textEl) return;
    
    titleEl.textContent = title;
    textEl.textContent = message;
    
    modal.classList.add('active');
};

// Handle transaction deletion
window.deleteTransaction = function(txId) {
    showConfirm('Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan ini akan mengupdate kas.', () => {
        // Clear edit mode if deleting the currently-edited tx
        if (state.editingTxId === txId) {
            state.editingTxId = null;
            resetTxForm();
        }
        state.transactions = state.transactions.filter(t => t.id !== txId);
        saveState();
        renderAdminDashboard();
        renderPublicView();
        showSuccess('Transaksi Dihapus!', 'Alhamdulillah, data transaksi berhasil dihapus dari kas masjid.');
    });
};

// Load transaction into form for editing
window.editTransaction = function(txId) {
    const tx = state.transactions.find(t => t.id === txId);
    if (!tx) return;
    
    // Mark edit mode
    state.editingTxId = txId;

    // Populate form fields with existing data
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-type').value = tx.type;
    document.getElementById('tx-storage').value = tx.storage;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-desc').value = tx.description;

    // Show receipt preview if exists
    const previewArea = document.getElementById('receipt-preview-area');
    if (tx.receipt_url) {
        state.tempReceiptBase64 = tx.receipt_url;
        previewArea.className = 'file-upload-preview has-image';
        previewArea.innerHTML = `<img src="${tx.receipt_url}" alt="Kuitansi">` ;
    }

    // Smooth scroll and pulse animation on form card
    const formCard = document.getElementById('admin-tx-form').closest('.card');
    if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formCard.classList.remove('edit-pulse');
        void formCard.offsetWidth; // Trigger reflow to restart animation
        formCard.classList.add('edit-pulse');
    }

    // Update form header & submit button
    const formHeader = document.getElementById('tx-form-title');
    if (formHeader) formHeader.textContent = `✏️ Edit Transaksi`;
    const submitBtn = document.getElementById('tx-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
    const cancelBtn = document.getElementById('tx-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';

    // Scroll to form
    document.getElementById('admin-tx-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    renderAdminTxTab(); // Re-render to highlight the editing row
};

// Cancel edit mode and reset form
function resetTxForm() {
    state.editingTxId = null;
    state.tempReceiptBase64 = null;
    document.getElementById('admin-tx-form')?.reset();
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
    const previewArea = document.getElementById('receipt-preview-area');
    if (previewArea) {
        previewArea.className = 'file-upload-preview';
        previewArea.innerHTML = `<span class="placeholder-text">Seret berkas di sini atau ketuk untuk mengambil foto kuitansi</span>`;
    }
    const formHeader = document.getElementById('tx-form-title');
    if (formHeader) formHeader.textContent = 'Catat Transaksi Baru';
    const submitBtn = document.getElementById('tx-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Simpan Transaksi Ke Kas';
    const cancelBtn = document.getElementById('tx-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    renderAdminTxTab();
}

// Handle New Transaction Submit (tambah atau edit)
function handleAdminTxSubmit(e) {
    e.preventDefault();
    const dateInput = document.getElementById('tx-date');
    const typeSelect = document.getElementById('tx-type');
    const storageSelect = document.getElementById('tx-storage');
    const amountInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');

    const dateVal = dateInput.value;
    const typeVal = typeSelect.value;
    const storageVal = storageSelect.value;
    const amountVal = parseFloat(amountInput.value);
    const descVal = descInput.value.trim();

    if (!dateVal || !amountVal || !descVal) {
        showToast('Harap isi semua kolom wajib (tanggal, nominal, dan keterangan).', 'error');
        return;
    }

    const actionText = state.editingTxId ? 'menyimpan perubahan transaksi ini' : 'menyimpan data transaksi baru ini ke kas masjid';
    
    showConfirm(`Apakah Anda yakin ingin ${actionText}?`, () => {
        if (state.editingTxId) {
            // === UPDATE MODE ===
            const idx = state.transactions.findIndex(t => t.id === state.editingTxId);
            if (idx !== -1) {
                state.transactions[idx] = {
                    ...state.transactions[idx],
                    date: dateVal,
                    type: typeVal,
                    storage: storageVal,
                    amount: amountVal,
                    description: descVal,
                    receipt_url: state.tempReceiptBase64 !== null ? state.tempReceiptBase64 : state.transactions[idx].receipt_url
                };
            }
            saveState();
            resetTxForm();
            renderAdminDashboard();
            renderPublicView();
            showSuccess('Perubahan Disimpan!', 'Alhamdulillah, perubahan data transaksi telah berhasil disimpan ke database kas masjid.');
        } else {
            // === ADD NEW MODE ===
            const newTx = {
                id: 'tx-' + Date.now(),
                date: dateVal,
                amount: amountVal,
                type: typeVal,
                storage: storageVal,
                description: descVal,
                receipt_url: state.tempReceiptBase64
            };
            state.transactions.push(newTx);
            saveState();
            resetTxForm();
            renderAdminDashboard();
            renderPublicView();
            showSuccess('Transaksi Dicatat!', 'Alhamdulillah, data transaksi baru telah berhasil disimpan ke kas masjid secara amanah.');
        }
    }, 'Ya, Simpan', false);
}

// Render Admin Projects Tab
function renderAdminProjectsTab() {
    const tbody = document.getElementById('admin-projects-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (state.projects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Belum ada program/proyek terdaftar.</td></tr>`;
        return;
    }

    state.projects.forEach(p => {
        const pct = Math.min(100, Math.round((p.collected_amount / p.target_amount) * 100));
        
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 600;">${p.title}</td>
                <td class="number-font">${formatCurrency(p.target_amount)}</td>
                <td class="number-font">${formatCurrency(p.collected_amount)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="number-font" style="font-size: 0.8rem; font-weight: 700;">${pct}%</span>
                        <div class="progress-bar-bg" style="width: 80px;">
                            <div class="progress-bar-fg" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="project-badge ${p.status === 'completed' ? 'completed-bg' : 'active-bg'}" style="position: static;">
                        ${p.status === 'completed' ? 'Selesai' : 'Aktif'}
                    </span>
                </td>
                <td class="text-center">
                    <div style="display: inline-flex; gap: 0.25rem;">
                        ${p.status === 'active' 
                            ? `<button class="btn-action btn-comp" onclick="completeProject('${p.id}')" title="Set Selesai">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                               </button>` 
                            : ''
                        }
                        <button class="btn-action btn-del" onclick="deleteProject('${p.id}')" title="Hapus Proyek">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Project Actions
window.completeProject = function(id) {
    const proj = state.projects.find(p => p.id === id);
    if (!proj) return;

    showConfirm(`Tandai proyek "${proj.title}" sebagai selesai? Nominal terkumpul akan disamakan dengan target anggaran.`, () => {
        proj.status = 'completed';
        proj.collected_amount = proj.target_amount; // Set full collected
        saveState();
        renderAdminDashboard();
        renderPublicView();
        showSuccess('Proyek Selesai!', 'Program pembangunan telah ditandai selesai dan progresnya diperbarui menjadi 100%.');
    }, 'Ya, Selesaikan', false);
};

window.deleteProject = function(id) {
    showConfirm('Apakah Anda yakin ingin menghapus proyek penggalangan dana ini?', () => {
        state.projects = state.projects.filter(p => p.id !== id);
        saveState();
        renderAdminDashboard();
        showSuccess('Program Dihapus!', 'Alhamdulillah, program pembangunan berhasil dihapus dari database.');
    });
};

// Handle New Project submission
function handleAdminProjectSubmit(e) {
    e.preventDefault();
    const titleInput = document.getElementById('proj-title');
    const targetInput = document.getElementById('proj-target');
    const collectedInput = document.getElementById('proj-collected');
    const descInput = document.getElementById('proj-desc');

    const titleVal = titleInput.value.trim();
    const targetVal = parseFloat(targetInput.value);
    const collectedVal = parseFloat(collectedInput.value) || 0;
    const descVal = descInput.value.trim();

    if (!titleVal || !targetVal) return;

    showConfirm('Apakah Anda yakin ingin mempublikasikan program/proyek pembangunan baru ini?', () => {
        const newProj = {
            id: 'proj-' + Date.now(),
            title: titleVal,
            target_amount: targetVal,
            collected_amount: collectedVal,
            status: collectedVal >= targetVal ? 'completed' : 'active',
            description: descVal
        };

        state.projects.push(newProj);
        saveState();

        // Reset Form
        titleInput.value = '';
        targetInput.value = '';
        collectedInput.value = '0';
        descInput.value = '';

        renderAdminDashboard();
        showSuccess('Program Dipublikasikan!', 'Alhamdulillah, program penggalangan dana baru berhasil dipublikasikan ke jamaah.');
    }, 'Ya, Publikasikan', false);
}

// Render Admin Feedback Tab List
function renderAdminFeedbackTab() {
    const container = document.getElementById('admin-feedback-container');
    if (!container) return;

    container.innerHTML = '';
    
    // Sort feedbacks: unread first, then by date descending
    const sortedFb = [...state.feedbacks].sort((a, b) => {
        if (a.status === 'unread' && b.status !== 'unread') return -1;
        if (a.status !== 'unread' && b.status === 'unread') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    if (sortedFb.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
                <p>Kotak masuk kosong. Belum ada saran yang dikirim warga.</p>
            </div>
        `;
        return;
    }

    sortedFb.forEach(fb => {
        let phoneLink = '';
        if (fb.phone_number) {
            let cleanPhone = fb.phone_number.replace(/\D/g, ''); // Remove non-digits
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '62' + cleanPhone.substr(1);
            } else if (cleanPhone.startsWith('8')) {
                cleanPhone = '62' + cleanPhone;
            }
            phoneLink = ` | WA: <strong><a href="https://wa.me/${cleanPhone}" target="_blank" style="color: var(--accent-700); text-decoration: underline; display: inline-flex; align-items: center; gap: 0.15rem;">${fb.phone_number}</a></strong>`;
        } else {
            phoneLink = ' (Anonim)';
        }
        
        container.innerHTML += `
            <div class="feedback-list-item ${fb.status === 'unread' ? 'unread' : ''}" id="fb-card-${fb.id}">
                <div class="fb-meta">
                    <span>${formatDateString(fb.created_at)}</span>
                </div>
                <div class="fb-sender">${fb.sender_name}${phoneLink}</div>
                <div class="fb-message">${fb.message}</div>
                <div class="fb-actions">
                    ${fb.status === 'unread' 
                        ? `<button class="btn-mark-read" onclick="markFeedbackRead('${fb.id}')">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                            Tandai Dibaca
                           </button>`
                        : '<span class="badge-read">✓ Dibaca</span>'
                    }
                    <button class="btn-action btn-del" onclick="deleteFeedback('${fb.id}')" title="Hapus Saran">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;
    });
}

// Feedback Actions
window.markFeedbackRead = function(id) {
    const fb = state.feedbacks.find(f => f.id === id);
    if (fb) {
        fb.status = 'read';
        saveState();
        renderAdminDashboard();
        showToast('Aspirasi ditandai telah dibaca.');
    }
};

window.deleteFeedback = function(id) {
    showConfirm('Hapus aspirasi jamaah ini dari inbox?', () => {
        const card = document.getElementById(`fb-card-${id}`);
        if (card) {
            card.classList.add('fade-out');
            setTimeout(() => {
                state.feedbacks = state.feedbacks.filter(f => f.id !== id);
                saveState();
                renderAdminDashboard();
                showToast('Aspirasi berhasil dihapus.');
            }, 400); // Wait for CSS scale/fade animation
        } else {
            state.feedbacks = state.feedbacks.filter(f => f.id !== id);
            saveState();
            renderAdminDashboard();
            showToast('Aspirasi berhasil dihapus.');
        }
    });
};

// ================= ADMIN LOGIN & AUTHENTICATION =================
function showLoginError(message) {
    const authBox = document.querySelector('.auth-box');
    const errorEl = document.getElementById('admin-login-error');
    const pwInput = document.getElementById('admin-password');

    if (errorEl) errorEl.textContent = message;
    if (authBox) {
        authBox.classList.remove('login-error');
        void authBox.offsetWidth;
        authBox.classList.add('login-error');
        setTimeout(() => authBox.classList.remove('login-error'), 520);
    }
    if (pwInput) {
        pwInput.focus();
        pwInput.select();
    }
}

function clearLoginError() {
    const authBox = document.querySelector('.auth-box');
    const errorEl = document.getElementById('admin-login-error');

    if (authBox) authBox.classList.remove('login-error');
    if (errorEl) errorEl.textContent = '';
}

function setLoginLoading(isLoading) {
    const submitBtn = document.querySelector('#admin-login-form button[type="submit"]');
    const pwInput = document.getElementById('admin-password');

    if (!submitBtn) return;
    if (isLoading) {
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Memeriksa...';
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        if (pwInput) pwInput.disabled = true;
    } else {
        submitBtn.textContent = submitBtn.dataset.originalText || 'Masuk Dashboard';
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        if (pwInput) pwInput.disabled = false;
    }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const pwInput = document.getElementById('admin-password');
    const pwVal = pwInput.value;

    clearLoginError();

    if (!firebaseReady) {
        showLoginError('Firebase belum siap. Periksa koneksi internet lalu coba lagi.');
        return;
    }

    setLoginLoading(true);
    try {
        const credential = await firebaseAuth.signInWithEmailAndPassword(ADMIN_LOGIN_EMAIL, pwVal);
        if (!isAdminUser(credential.user)) {
            await firebaseAuth.signOut();
            throw new Error('Akun ini belum terdaftar sebagai admin sistem.');
        }

        state.isAdminAuthenticated = true;
        sessionStorage.setItem('current_role', 'admin');
        pwInput.value = '';
        state.currentRole = 'admin';
        switchMode('admin');
        showToast('Login berhasil! Selamat datang Pengurus Masjid.');
    } catch (err) {
        console.error('Admin login failed', err);
        const authMessage = err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
            ? 'PIN atau kata sandi salah.'
            : 'Login gagal. Coba ulang atau refresh halaman.';
        showLoginError(authMessage);
        showToast(authMessage, 'error');
    } finally {
        setLoginLoading(false);
    }
}

// Save Treasurer Profile & Mosque Info settings
function handleSaveProfile() {
    const nameInput = document.getElementById('change-admin-name');
    const roleInput = document.getElementById('change-admin-role');
    const bankNameInput = document.getElementById('change-bank-name');
    const bankAccInput = document.getElementById('change-bank-acc');
    const bankOwnerInput = document.getElementById('change-bank-owner');
    const waNumberInput = document.getElementById('change-wa-number');

    const nameVal = nameInput.value.trim();
    const roleVal = roleInput.value.trim();
    const bankNameVal = bankNameInput.value.trim();
    const bankAccVal = bankAccInput.value.trim();
    const bankOwnerVal = bankOwnerInput.value.trim();
    const waNumberVal = waNumberInput.value.trim();

    if (!nameVal || !roleVal || !bankNameVal || !bankAccVal || !bankOwnerVal || !waNumberVal) {
        showToast('Semua kolom informasi profil dan bank harus diisi!', 'error');
        return;
    }

    showConfirm('Apakah Anda yakin ingin memperbarui profil bendahara dan informasi bank masjid?', () => {
        state.treasurerName = nameVal;
        state.treasurerRole = roleVal;
        state.bankName = bankNameVal;
        state.bankAccountNumber = bankAccVal;
        state.bankAccountHolder = bankOwnerVal;
        state.whatsappNumber = waNumberVal;
        
        saveState();
        updateProfileDisplay();
        renderPublicView(); // Re-render public views to update BSI bank card in real-time
        showSuccess('Profil Diperbarui!', 'Alhamdulillah, informasi profil bendahara dan rekening bank masjid berhasil diperbarui.');
    }, 'Ya, Perbarui', false);
}

function handleAdminLogout() {
    showConfirm('Apakah Anda yakin ingin keluar dari dashboard pengurus?', async () => {
        if (firebaseReady) await firebaseAuth.signOut();
        state.isAdminAuthenticated = false;
        state.currentRole = 'public';
        sessionStorage.removeItem('current_role');
        state.feedbacks = [];
        switchMode('public');
        showToast('Berhasil keluar dari dashboard pengurus.');
    }, 'Ya, Keluar', true);
}

// ================= SETTINGS & BACKUP ACTIONS =================

// Change Password
async function handleChangePassword() {
    const pwInput = document.getElementById('change-admin-pw');
    const newPw = pwInput.value.trim();

    if (!newPw) {
        showToast('Kata sandi baru tidak boleh kosong!', 'error');
        return;
    }

    showConfirm('Apakah Anda yakin ingin mengubah kata sandi keamanan admin?', async () => {
        try {
            if (!firebaseReady || !firebaseAuth.currentUser) throw new Error('Admin belum login.');
            await firebaseAuth.currentUser.updatePassword(newPw);
            pwInput.value = '';
            showSuccess('Sandi Keamanan Diubah!', 'Alhamdulillah, kata sandi keamanan pengurus masjid berhasil diperbarui.');
        } catch (err) {
            console.error('Failed to change password', err);
            showToast('Sandi belum berhasil diubah. Login ulang lalu coba lagi.', 'error');
        }
    }, 'Ya, Ubah', false);
}

// Export database as JSON file download
function exportDataBackup() {
    const backupObj = {
        transactions: state.transactions,
        projects: state.projects,
        feedbacks: state.feedbacks,
        settings: getSettingsState(),
        export_date: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_keuangan_masjid_${getRelativeDateString(0)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Berkas cadangan data kas berhasil diunduh!');
}

// Reset Database and format state
function formatDatabase() {
    showConfirm('Tindakan ini akan menghapus semua data transaksi saat ini dan mengatur ulang ke data contoh pabrik. Apakah Anda yakin?', () => {
        resetToInitialData();
        renderAdminDashboard();
        showSuccess('Database Direset!', 'Alhamdulillah, database kas masjid berhasil di-format ulang ke setelan awal pabrik.');
    }, 'Ya, Reset');
}

// Generate and Download official QRIS code sheet as a high-resolution PNG image
function downloadQRIS() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 820;
    const ctx = canvas.getContext('2d');

    // 1. Draw Background (White card)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Top Header Banner (Typical red/rose QRIS merchant color)
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(0, 0, canvas.width, 140);

    // 3. Draw QRIS Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QRIS', canvas.width / 2, 70);

    // 4. Draw Merchant Info (Mosque Name & NMID)
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('Masjid Raudhatul Khoiriyah', canvas.width / 2, 195);
    
    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '500 18px sans-serif';
    ctx.fillText('NMID: ID1020263304523', canvas.width / 2, 235);

    // 5. Draw QR Code Frame box
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(120, 280, 360, 360);

    // 6. Draw QR Code SVG elements
    const startX = 130;
    const startY = 290;
    const qrSize = 340;
    const scale = qrSize / 100; // 3.4

    // Redraw SVG rectangles onto Canvas
    const svg = document.querySelector('.qr-svg');
    if (svg) {
        const rects = svg.querySelectorAll('rect');
        rects.forEach(rect => {
            const x = parseFloat(rect.getAttribute('x') || 0);
            const y = parseFloat(rect.getAttribute('y') || 0);
            const w = parseFloat(rect.getAttribute('width') || 0);
            const h = parseFloat(rect.getAttribute('height') || 0);
            const fill = rect.getAttribute('fill') || '#000000';
            
            ctx.fillStyle = fill;
            if (x === 42 && y === 42) {
                ctx.fillStyle = '#064e3b'; // mosque center color
            }
            ctx.fillRect(startX + x * scale, startY + y * scale, w * scale, h * scale);
        });

        // Draw center logo triangle path
        const paths = svg.querySelectorAll('path');
        paths.forEach(path => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(startX + 50 * scale, startY + 45 * scale);
            ctx.lineTo(startX + 45 * scale, startY + 52 * scale);
            ctx.lineTo(startX + 55 * scale, startY + 52 * scale);
            ctx.closePath();
            ctx.fill();
        });
    }

    // 7. Draw Footer (GPN & standard QRIS instruction text)
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('GPN', canvas.width / 2, 695);

    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = 'italic 15px sans-serif';
    ctx.fillText('Mendukung semua E-Wallet & Mobile Banking', canvas.width / 2, 735);
    ctx.fillText('Kelurahan Pagar Tengah, Pendopo', canvas.width / 2, 765);

    // 8. Trigger download behavior
    try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'QRIS_Masjid_Raudhatul_Khoiriyah.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('QRIS Masjid berhasil diunduh!');
    } catch (err) {
        console.error('Gagal mengunduh gambar QRIS', err);
        showToast('Gagal mengunduh QRIS, silakan screenshot layar.', 'error');
    }
}

const PRINT_MODE_CLASSES = ['printing-report', 'printing-qr'];
const PRINT_CLEANUP_DELAY_MS = 45000;
let printModeCleanupTimer = null;

function clearPrintMode() {
    PRINT_MODE_CLASSES.forEach(className => {
        document.body.classList.remove(className);
        document.documentElement.classList.remove(className);
    });
    if (printModeCleanupTimer) {
        clearTimeout(printModeCleanupTimer);
        printModeCleanupTimer = null;
    }
}

function schedulePrintModeCleanup(delayMs = PRINT_CLEANUP_DELAY_MS) {
    if (printModeCleanupTimer) {
        clearTimeout(printModeCleanupTimer);
    }
    printModeCleanupTimer = setTimeout(clearPrintMode, delayMs);
}

function runNativePrint(printClassName) {
    PRINT_MODE_CLASSES.forEach(className => {
        document.body.classList.remove(className);
        document.documentElement.classList.remove(className);
    });

    document.body.classList.add(printClassName);
    document.documentElement.classList.add(printClassName);
    if (printModeCleanupTimer) {
        clearTimeout(printModeCleanupTimer);
        printModeCleanupTimer = null;
    }

    // Force layout before print. Android Chrome can build its print preview
    // after window.print() returns, so cleanup is delayed separately below.
    void document.body.offsetHeight;

    const openPrintDialog = () => {
        window.print();
        schedulePrintModeCleanup();
    };

    if (window.requestAnimationFrame) {
        requestAnimationFrame(() => requestAnimationFrame(openPrintDialog));
    } else {
        setTimeout(openPrintDialog, 150);
    }
}

async function printAccessQr() {
    await updateAccessQrCode();
    const qrImageEl = document.getElementById('qr-image-src');
    const sourcePoster = document.getElementById('qr-poster-area');
    const printPage = document.getElementById('qr-print-page');

    if (qrImageEl?.src && !qrImageEl.complete) {
        await new Promise((resolve) => {
            qrImageEl.onload = resolve;
            qrImageEl.onerror = resolve;
            setTimeout(resolve, 1500);
        });
    }

    if (sourcePoster && printPage) {
        printPage.innerHTML = '';
        const clonedPoster = sourcePoster.cloneNode(true);
        clonedPoster.removeAttribute('id');
        printPage.appendChild(clonedPoster);
    }

    runNativePrint('printing-qr');
}

async function downloadAccessQrPdf() {
    await updateAccessQrCode();

    const qrImageEl = document.getElementById('qr-image-src');
    const qrDataUrl = await getImageDataUrl(qrImageEl);
    const jsPdfCtor = window.jspdf?.jsPDF;

    if (!qrDataUrl || !jsPdfCtor) {
        showToast('PDF belum bisa dibuat. Coba refresh halaman lalu ulangi.', 'error');
        return;
    }

    const accessUrl = getPublicAccessUrl();
    const pdf = new jsPdfCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 210, 297, 'F');

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('PORTAL TRANSPARANSI KEUANGAN', centerX, 38, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text('Masjid Raudhatul Khoiriyah', centerX, 49, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Kelurahan Pagar Tengah, Kec. Pendopo', centerX, 57, { align: 'center' });

    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(55, 72, 100, 100, 4, 4);
    pdf.addImage(qrDataUrl, 'PNG', 62, 79, 86, 86);

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('PINDAI QR CODE DI ATAS UNTUK MELIHAT LAPORAN KAS REAL-TIME', centerX, 192, {
        align: 'center',
        maxWidth: 160
    });

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(5, 150, 105);
    pdf.setFontSize(10);
    pdf.text(accessUrl, centerX, 205, { align: 'center' });

    pdf.setDrawColor(5, 150, 105);
    pdf.setLineWidth(0.4);
    pdf.line(35, 216, 175, 216);

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.text('Laporan kas dapat diakses oleh jamaah secara online.', centerX, 226, { align: 'center' });
    pdf.save('Poster_QR_Keuangan_Masjid_Raudhatul_Khoiriyah.pdf');
    showToast('Poster QR PDF berhasil diunduh.');
}

// Generate and print transaction report based on active user filters
function printFilteredReport() {
    // Get filter input elements
    const searchInput = document.getElementById('search-tx');
    const monthSelect = document.getElementById('filter-month');
    const yearSelect = document.getElementById('filter-year');
    const typeSelect = document.getElementById('filter-type');
    
    if (!searchInput || !monthSelect || !yearSelect || !typeSelect) return;

    const query = searchInput.value.trim();
    const monthFilter = monthSelect.value;
    const yearFilter = yearSelect.value;
    const typeFilter = typeSelect.value;

    // Filter transaction list (identical to public rendering filters)
    const filteredTx = state.transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(query.toLowerCase());
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        
        const txYear = tx.date.substr(0, 4);
        const txMonth = tx.date.substr(5, 2);
        
        const matchesMonth = monthFilter === 'all' || txMonth === monthFilter;
        const matchesYear = yearFilter === 'all' || txYear === yearFilter;
        
        return matchesSearch && matchesType && matchesMonth && matchesYear;
    });

    // Sort by date descending
    filteredTx.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Populate metadata labels on the printable page
    const monthsName = {
        'all': 'Semua Bulan',
        '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
        '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
        '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
    };
    const monthName = monthsName[monthFilter];
    const yearName = yearFilter === 'all' ? 'Semua Tahun' : yearFilter;
    document.getElementById('print-period-label').textContent = `${monthName} ${yearName}`;

    const typeLabels = { 
        'all': 'Semua (Pemasukan & Pengeluaran)', 
        'income': 'Pemasukan', 
        'expense': 'Pengeluaran' 
    };
    document.getElementById('print-type-label').textContent = typeLabels[typeFilter];

    // Dates for metadata and signatures
    const now = new Date();
    const formattedNow = `${now.getDate()} ${monthsName[String(now.getMonth() + 1).padStart(2, '0')]} ${now.getFullYear()}`;
    document.getElementById('print-date-label').textContent = formattedNow;
    document.getElementById('print-signature-date').textContent = formattedNow;

    // Set signature treasurer details from state
    document.getElementById('print-sig-name').textContent = state.treasurerName;
    document.getElementById('print-sig-role').textContent = state.treasurerRole;

    // Populate printable table rows and sum amounts
    const tbody = document.getElementById('print-report-tbody');
    tbody.innerHTML = '';
    
    let totalIncome = 0;
    let totalExpense = 0;

    if (filteredTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Tidak ada transaksi yang cocok untuk dicetak.</td></tr>`;
    } else {
        filteredTx.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else {
                totalExpense += tx.amount;
            }

            tbody.innerHTML += `
                <tr>
                    <td class="number-font">${formatDateString(tx.date)}</td>
                    <td style="font-weight: 500;">${tx.description}</td>
                    <td>${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
                    <td class="text-right number-font" style="font-weight: 600;">
                        ${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}
                    </td>
                </tr>
            `;
        });
    }

    // Set summary totals in summary card
    document.getElementById('print-total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('print-total-expense').textContent = formatCurrency(totalExpense);
    const finalBalance = totalIncome - totalExpense;
    document.getElementById('print-final-balance').textContent = formatCurrency(finalBalance);

    runNativePrint('printing-report');
}

// Toggle password visibility (show/hide eye)
window.togglePasswordVisibility = function(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        // Eye-off icon
        btnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    } else {
        input.type = 'password';
        // Eye-on icon
        btnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
};


// ================= PUBLIC RENDERING FUNCTIONS =================

function renderPublicCommittee() {
    const mosqueContainer = document.getElementById('public-committee-mosque');
    const youthContainer = document.getElementById('public-committee-youth');
    if (!mosqueContainer || !youthContainer) return;

    materializeCommitteeMembers();

    const mosqueMembers = state.committeeMembers.filter(m => m.group === 'mosque');
    const youthMembers = state.committeeMembers.filter(m => m.group === 'youth');

    const renderCard = (member) => {
        const avatarSrc = (member.photo_url && member.photo_url !== 'null') ? member.photo_url : `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%230f766e'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='32' fill='white'>${member.name.substring(0, 2).toUpperCase()}</text></svg>`;
        return `
            <div class="committee-card" onclick="viewCommitteeDetail('${member.id}')" style="cursor: pointer;">
                <img class="committee-photo" src="${avatarSrc}" alt="Foto ${member.name}">
                <h3>${member.name}</h3>
                <p>${member.role}</p>
            </div>
        `;
    };

    mosqueContainer.innerHTML = mosqueMembers.map(renderCard).join('');
    youthContainer.innerHTML = youthMembers.map(renderCard).join('');
}

function renderPublicGallery() {
    const container = document.getElementById('public-gallery-container');
    const yearSelect = document.getElementById('gallery-filter-year');
    if (!container) return;

    materializeGalleryItems();

    // Populate year filter dropdown dynamically if it exists
    if (yearSelect) {
        const yearsInGallery = [...new Set(state.galleryItems.map(item => item.date.substr(0, 4)))].sort((a, b) => b - a);
        const currentYear = new Date().getFullYear().toString();
        if (!yearsInGallery.includes(currentYear)) yearsInGallery.unshift(currentYear);
        
        const currentVal = yearSelect.value;
        yearSelect.innerHTML = `<option value="all">Semua Tahun</option>`;
        yearsInGallery.forEach(y => {
            yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
        });
        if (currentVal && [...yearSelect.options].find(o => o.value === currentVal)) {
            yearSelect.value = currentVal;
        }
    }

    const items = getFilteredGalleryItems();
    if (items.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align: center;"><p>Belum ada dokumentasi kegiatan.</p></div>`;
        return;
    }

    if (state.activeGalleryIndex === undefined) state.activeGalleryIndex = 0;
    if (state.activeGalleryIndex >= items.length) state.activeGalleryIndex = 0;
    
    const activeItem = items[state.activeGalleryIndex];
    
    container.innerHTML = `
        <div class="gallery-carousel-card">
            <div class="gallery-carousel-media">
                <img src="${activeItem.image_url}" alt="${activeItem.title}" class="gallery-carousel-image" onclick="viewGalleryDetail()" style="cursor: zoom-in;">
                ${items.length > 1 ? `<button type="button" class="gallery-nav-btn prev" onclick="prevGalleryItem(event)">&lt;</button>` : ''}
                ${items.length > 1 ? `<button type="button" class="gallery-nav-btn next" onclick="nextGalleryItem(event)">&gt;</button>` : ''}
            </div>
            <div class="gallery-carousel-body">
                <span class="gallery-date">${formatDateString(activeItem.date)}</span>
                <h3>${activeItem.title}</h3>
                <p>${activeItem.description}</p>
                <div class="gallery-counter">${state.activeGalleryIndex + 1} dari ${items.length}</div>
            </div>
        </div>
    `;
}

window.prevGalleryItem = function(e) {
    if (e) e.stopPropagation();
    const items = getFilteredGalleryItems();
    if (items.length <= 1) return;
    state.activeGalleryIndex = (state.activeGalleryIndex - 1 + items.length) % items.length;
    renderPublicGallery();
};

window.nextGalleryItem = function(e) {
    if (e) e.stopPropagation();
    const items = getFilteredGalleryItems();
    if (items.length <= 1) return;
    state.activeGalleryIndex = (state.activeGalleryIndex + 1) % items.length;
    renderPublicGallery();
};

function renderPublicSchedules() {
    const container = document.getElementById('public-schedule-container');
    if (!container) return;

    const schedules = getActiveSchedules();
    if (schedules.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Belum ada jadwal aktif.</p></div>`;
        return;
    }

    container.innerHTML = schedules.map(schedule => `
        <article class="schedule-card">
            <div class="schedule-date-block">
                <span>${schedule.time}</span>
                <small>WIB</small>
            </div>
            <div class="schedule-card-body">
                <span class="schedule-date-label">${formatDateString(schedule.date)}</span>
                <h3>${schedule.title}</h3>
                <p>${schedule.description}</p>
                ${schedule.pic ? `<div class="schedule-pic">📍 ${schedule.pic}</div>` : ''}
            </div>
        </article>
    `).join('');
}

function renderScheduleTicker() {
    const tickerEl = document.getElementById('schedule-ticker');
    const tickerTextEl = document.getElementById('schedule-ticker-text');
    if (!tickerEl || !tickerTextEl) return;

    const tickerSchedules = getActiveSchedules().filter(s => s.show_ticker);
    if (tickerSchedules.length === 0) {
        tickerEl.style.display = 'none';
        return;
    }

    const text = tickerSchedules.map(s => {
        const timeStr = s.time ? ` pukul ${s.time} WIB` : '';
        return `📣 ${s.title} (${formatDateString(s.date)}${timeStr}): ${s.description}`;
    }).join('   •   ');

    tickerTextEl.textContent = text;
    tickerEl.style.display = 'flex';
}


// ================= ADMIN LIST RENDERING FUNCTIONS =================

function renderAdminCommitteeList() {
    const listContainer = document.getElementById('admin-committee-list');
    if (!listContainer) return;

    materializeCommitteeMembers();

    const mosqueMembers = state.committeeMembers.filter(m => m.group === 'mosque');
    const youthMembers = state.committeeMembers.filter(m => m.group === 'youth');

    const renderMemberItem = (member) => {
        const isEditMode = state.editingCommitteeId === member.id;
        const avatarSrc = (member.photo_url && member.photo_url !== 'null') ? member.photo_url : `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='48' fill='%230f766e'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='bold' font-size='32' fill='white'>${member.name.substring(0,2).toUpperCase()}</text></svg>`;

        return `
            <div class="admin-content-item" style="${isEditMode ? 'border-color: var(--primary-500); background: var(--primary-50);' : ''}">
                <div class="admin-content-item-main">
                    <img class="admin-content-thumb" src="${avatarSrc}" alt="Foto ${member.name}">
                    <div>
                        <strong>${member.name}</strong>
                        <span>${member.role}</span>
                    </div>
                </div>
                <div class="admin-content-item-actions">
                    <button type="button" class="btn-action btn-edit" onclick="editCommitteeMember('${member.id}')" title="Edit Pengurus">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button type="button" class="btn-action btn-del" onclick="deleteCommitteeMember('${member.id}')" title="Hapus Pengurus">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;
    };

    let html = '';
    
    html += `<h3 style="font-size:0.85rem; font-weight:700; color:var(--primary-900); margin:0 0 0.5rem 0; border-left: 3px solid var(--primary-600); padding-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Pengurus Masjid</h3>`;
    if (mosqueMembers.length === 0) {
        html += `<div class="empty-state" style="padding:0.75rem; text-align:center; margin-bottom:1rem;"><p style="font-size:0.75rem; margin:0; color:var(--neutral-400);">Belum ada data pengurus masjid.</p></div>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.5rem;">`;
        html += mosqueMembers.map(renderMemberItem).join('');
        html += `</div>`;
    }

    html += `<h3 style="font-size:0.85rem; font-weight:700; color:var(--primary-900); margin:0 0 0.5rem 0; border-left: 3px solid var(--primary-600); padding-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;">Remaja Masjid</h3>`;
    if (youthMembers.length === 0) {
        html += `<div class="empty-state" style="padding:0.75rem; text-align:center;"><p style="font-size:0.75rem; margin:0; color:var(--neutral-400);">Belum ada data remaja masjid.</p></div>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:0.5rem;">`;
        html += youthMembers.map(renderMemberItem).join('');
        html += `</div>`;
    }

    listContainer.innerHTML = html;
}

function renderAdminGalleryList() {
    const listContainer = document.getElementById('admin-gallery-list');
    if (!listContainer) return;

    materializeGalleryItems();

    listContainer.innerHTML = '';
    if (state.galleryItems.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" style="padding:1rem; text-align:center;"><p>Belum ada dokumentasi kegiatan.</p></div>`;
        return;
    }

    const sortedItems = [...state.galleryItems].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedItems.forEach(item => {
        const isEditMode = state.editingGalleryId === item.id;
        listContainer.innerHTML += `
            <div class="admin-content-item" style="${isEditMode ? 'border-color: var(--primary-500); background: var(--primary-50);' : ''}">
                <div class="admin-content-item-main">
                    <img class="admin-content-thumb" src="${item.image_url}" alt="${item.title}">
                    <div>
                        <strong>${item.title}</strong>
                        <span>${formatDateString(item.date)}</span>
                    </div>
                </div>
                <div class="admin-content-item-actions">
                    <button type="button" class="btn-action btn-edit" onclick="editGalleryItem('${item.id}')" title="Edit Galeri">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </button>
                    <button type="button" class="btn-action btn-del" onclick="deleteGalleryItem('${item.id}')" title="Hapus Galeri">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;
    });
}

function renderAdminScheduleList() {
    const listContainer = document.getElementById('admin-schedule-list');
    if (!listContainer) return;

    materializeSchedules();

    // Default dates in form to today if empty
    const scheduleDateInput = document.getElementById('schedule-date');
    if (scheduleDateInput && !scheduleDateInput.value) {
        scheduleDateInput.value = new Date().toISOString().split('T')[0];
    }

    listContainer.innerHTML = '';
    if (state.schedules.length === 0) {
        listContainer.innerHTML = `<div class="empty-state" style="padding:1rem; text-align:center;"><p>Belum ada jadwal kegiatan.</p></div>`;
        return;
    }

    const sortedSchedules = [...state.schedules].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedSchedules.forEach(schedule => {
        const isEditMode = state.editingScheduleId === schedule.id;
        const isCompleted = schedule.status === 'completed';
        
        let statusBadge = `<span class="badge-in">Aktif</span>`;
        let actionButtons = `
            <button type="button" class="btn-action btn-edit" onclick="editSchedule('${schedule.id}')" title="Edit Jadwal">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button type="button" class="btn-action btn-edit" onclick="completeSchedule('${schedule.id}')" title="Tandai Selesai" style="background:var(--success-100); color:var(--success-800);">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </button>
        `;

        if (isCompleted) {
            statusBadge = `<span class="badge-out">Selesai</span>`;
            actionButtons = `
                <span style="font-size:0.65rem; color:var(--neutral-400); margin-right:4px;">Auto-hapus: ${schedule.auto_delete_at || '-'}</span>
            `;
        }

        listContainer.innerHTML += `
            <div class="admin-content-item" style="${isEditMode ? 'border-color: var(--primary-500); background: var(--primary-50);' : ''} ${isCompleted ? 'opacity: 0.75;' : ''}">
                <div class="admin-content-item-main">
                    <div class="admin-content-thumb">${schedule.time || '--:--'}</div>
                    <div>
                        <strong>${schedule.title}</strong>
                        <span>${formatDateString(schedule.date)} | ${statusBadge} ${schedule.show_ticker ? ' | 📣 Ticker' : ''}</span>
                    </div>
                </div>
                <div class="admin-content-item-actions">
                    ${actionButtons}
                    <button type="button" class="btn-action btn-del" onclick="deleteSchedule('${schedule.id}')" title="Hapus Jadwal">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            </div>
        `;
    });
}


// ================= ADMIN SUBMISSIONS & CRUD ACTIONS =================

function handleAdminCommitteeSubmit(e) {
    e.preventDefault();
    const groupSelect = document.getElementById('committee-group');
    const roleInput = document.getElementById('committee-role');
    const nameInput = document.getElementById('committee-name');

    const group = groupSelect.value;
    const role = roleInput.value.trim();
    const name = nameInput.value.trim();

    if (!role || !name) return;

    showConfirm(state.editingCommitteeId ? 'Simpan perubahan data pengurus ini?' : 'Tambah data pengurus baru?', () => {
        materializeCommitteeMembers();
        
        const photoUrl = state.tempCommitteePhotoBase64 || (state.editingCommitteeId ? state.committeeMembers.find(m => m.id === state.editingCommitteeId)?.photo_url : null);

        if (state.editingCommitteeId) {
            const member = state.committeeMembers.find(m => m.id === state.editingCommitteeId);
            if (member) {
                member.group = group;
                member.role = role;
                member.name = name;
                member.photo_url = photoUrl;
            }
        } else {
            state.committeeMembers.push({
                id: 'committee-' + Date.now(),
                group,
                role,
                name,
                photo_url: photoUrl
            });
        }

        touchAdminUpdate();
        saveState();
        resetCommitteeForm();
        renderAdminCommitteeList();
        renderPublicView();
        showSuccess(state.editingCommitteeId ? 'Data Diperbarui!' : 'Data Ditambahkan!', 'Data pengurus berhasil disimpan.');
    }, 'Ya, Simpan', false);
}

function resetCommitteeForm() {
    state.editingCommitteeId = null;
    state.tempCommitteePhotoBase64 = null;
    document.getElementById('committee-role').value = '';
    document.getElementById('committee-name').value = '';
    document.getElementById('committee-photo').value = '';
    
    const preview = document.getElementById('committee-photo-preview');
    if (preview) {
        preview.className = 'file-upload-preview compact';
        preview.innerHTML = `<span class="placeholder-text">Belum ada foto dipilih.</span>`;
    }
    
    const submitBtn = document.getElementById('committee-submit-btn');
    const cancelBtn = document.getElementById('committee-cancel-edit');
    if (submitBtn) submitBtn.textContent = 'Simpan Data Pengurus';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function handleAdminGallerySubmit(e) {
    e.preventDefault();
    const dateInput = document.getElementById('gallery-date');
    const titleInput = document.getElementById('gallery-title');
    const descInput = document.getElementById('gallery-desc');

    const date = dateInput.value;
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!date || !title || !description) return;

    const isEditingGallery = Boolean(state.editingGalleryId);
    showConfirm(isEditingGallery ? 'Simpan perubahan dokumentasi galeri ini?' : 'Tambah dokumentasi galeri baru?', async () => {
        materializeGalleryItems();

        const imageUrl = state.tempGalleryImageBase64 || (isEditingGallery ? state.galleryItems.find(g => g.id === state.editingGalleryId)?.image_url : null) || createDemoGalleryImage(title, '#0f766e', '#15803d');

        if (isEditingGallery) {
            const item = state.galleryItems.find(g => g.id === state.editingGalleryId);
            if (item) {
                item.date = date;
                item.title = title;
                item.description = description;
                item.image_url = imageUrl;
                item.updated_at = new Date().toISOString();
            }
        } else {
            state.galleryItems.push({
                id: 'gallery-' + Date.now(),
                date,
                title,
                description,
                image_url: imageUrl,
                updated_at: new Date().toISOString()
            });
        }

        state.activeGalleryIndex = 0;
        touchAdminUpdate();
        await saveState();
        resetGalleryForm();
        renderAdminGalleryList();
        renderPublicView();
        showSuccess(isEditingGallery ? 'Galeri Diperbarui!' : 'Galeri Ditambahkan!', 'Dokumentasi kegiatan berhasil disimpan.');
    }, 'Ya, Simpan', false);
}

function resetGalleryForm() {
    state.editingGalleryId = null;
    state.tempGalleryImageBase64 = null;
    document.getElementById('gallery-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('gallery-title').value = '';
    document.getElementById('gallery-desc').value = '';
    document.getElementById('gallery-image').value = '';

    const preview = document.getElementById('gallery-image-preview');
    if (preview) {
        preview.className = 'file-upload-preview compact';
        preview.innerHTML = `<span class="placeholder-text">Belum ada foto dipilih.</span>`;
    }

    const submitBtn = document.getElementById('gallery-submit-btn');
    const cancelBtn = document.getElementById('gallery-cancel-edit');
    if (submitBtn) submitBtn.textContent = 'Simpan Galeri';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

function handleAdminScheduleSubmit(e) {
    e.preventDefault();
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');
    const titleInput = document.getElementById('schedule-title');
    const descInput = document.getElementById('schedule-desc');
    const picInput = document.getElementById('schedule-pic');
    const tickerCheck = document.getElementById('schedule-ticker-check');

    const date = dateInput.value;
    const time = timeInput.value;
    const title = titleInput.value.trim();
    const description = descInput.value.trim();
    const pic = picInput.value.trim();
    const showTicker = tickerCheck.checked;

    if (!date || !time || !title || !description) return;

    showConfirm(state.editingScheduleId ? 'Simpan perubahan jadwal kegiatan ini?' : 'Tambah jadwal kegiatan baru?', () => {
        materializeSchedules();

        if (state.editingScheduleId) {
            const schedule = state.schedules.find(item => item.id === state.editingScheduleId);
            if (schedule) {
                schedule.date = date;
                schedule.time = time;
                schedule.title = title;
                schedule.description = description;
                schedule.pic = pic;
                schedule.show_ticker = showTicker;
            }
        } else {
            state.schedules.push({
                id: 'schedule-' + Date.now(),
                date,
                time,
                title,
                description,
                pic,
                show_ticker: showTicker,
                status: 'active',
                completed_at: null,
                auto_delete_at: null
            });
        }
        touchAdminUpdate();
        saveState();
        resetScheduleForm();
        renderAdminScheduleList();
        renderPublicView();
        showSuccess(state.editingScheduleId ? 'Jadwal Diperbarui!' : 'Jadwal Ditambahkan!', 'Jadwal kegiatan berhasil disimpan.');
    }, 'Ya, Simpan', false);
}

function resetScheduleForm() {
    state.editingScheduleId = null;
    document.getElementById('schedule-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('schedule-time').value = '';
    document.getElementById('schedule-title').value = '';
    document.getElementById('schedule-desc').value = '';
    document.getElementById('schedule-pic').value = '';
    document.getElementById('schedule-ticker-check').checked = true;

    const submitBtn = document.getElementById('schedule-submit-btn');
    const cancelBtn = document.getElementById('schedule-cancel-edit');
    if (submitBtn) submitBtn.textContent = 'Simpan Jadwal';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

window.editCommitteeMember = function(id) {
    materializeCommitteeMembers();
    const member = state.committeeMembers.find(item => item.id === id);
    if (!member) return;

    state.editingCommitteeId = id;
    state.tempCommitteePhotoBase64 = null;
    document.getElementById('committee-group').value = member.group;
    document.getElementById('committee-name').value = member.name;
    document.getElementById('committee-role').value = member.role;

    const preview = document.getElementById('committee-photo-preview');
    if (preview) {
        if (member.photo_url) {
            preview.className = 'file-upload-preview compact has-image';
            preview.innerHTML = `<img src="${member.photo_url}" alt="Foto ${member.name}">`;
        } else {
            preview.className = 'file-upload-preview compact';
            preview.innerHTML = `<span class="placeholder-text">Foto lama kosong. Pilih file jika ingin menambahkan foto.</span>`;
        }
    }
    const submitBtn = document.getElementById('committee-submit-btn');
    const cancelBtn = document.getElementById('committee-cancel-edit');
    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    document.getElementById('admin-committee-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.editGalleryItem = function(id) {
    materializeGalleryItems();
    const item = state.galleryItems.find(gallery => gallery.id === id);
    if (!item) return;

    state.editingGalleryId = id;
    state.tempGalleryImageBase64 = null;
    document.getElementById('gallery-date').value = item.date;
    document.getElementById('gallery-title').value = item.title;
    document.getElementById('gallery-desc').value = item.description;

    const preview = document.getElementById('gallery-image-preview');
    if (preview) {
        if (item.image_url) {
            preview.className = 'file-upload-preview compact has-image';
            preview.innerHTML = `<img src="${item.image_url}" alt="${item.title}">`;
        } else {
            preview.className = 'file-upload-preview compact';
            preview.innerHTML = `<span class="placeholder-text">Foto lama kosong. Pilih file jika ingin menambahkan foto.</span>`;
        }
    }
    const submitBtn = document.getElementById('gallery-submit-btn');
    const cancelBtn = document.getElementById('gallery-cancel-edit');
    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    document.getElementById('admin-gallery-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.deleteCommitteeMember = function(id) {
    showConfirm('Hapus data pengurus ini dari halaman struktur?', () => {
        materializeCommitteeMembers();
        state.committeeMembers = state.committeeMembers.filter(member => member.id !== id);
        if (state.editingCommitteeId === id) resetCommitteeForm();
        touchAdminUpdate();
        saveState();
        renderAdminCommitteeList();
        renderPublicView();
        showToast('Data pengurus berhasil dihapus.');
    });
};

window.deleteGalleryItem = function(id) {
    showConfirm('Hapus dokumentasi kegiatan ini dari galeri?', () => {
        materializeGalleryItems();
        state.galleryItems = state.galleryItems.filter(item => item.id !== id);
        if (state.editingGalleryId === id) resetGalleryForm();
        state.activeGalleryIndex = 0;
        touchAdminUpdate();
        saveState();
        renderAdminGalleryList();
        renderPublicView();
        showToast('Galeri berhasil dihapus.');
    });
};

window.editSchedule = function(id) {
    materializeSchedules();
    const schedule = state.schedules.find(item => item.id === id);
    if (!schedule) return;

    state.editingScheduleId = id;
    document.getElementById('schedule-date').value = schedule.date;
    document.getElementById('schedule-time').value = schedule.time;
    document.getElementById('schedule-title').value = schedule.title;
    document.getElementById('schedule-desc').value = schedule.description;
    document.getElementById('schedule-pic').value = schedule.pic || '';
    document.getElementById('schedule-ticker-check').checked = !!schedule.show_ticker;
    const submitBtn = document.getElementById('schedule-submit-btn');
    const cancelBtn = document.getElementById('schedule-cancel-edit');
    if (submitBtn) submitBtn.textContent = 'Simpan Perubahan';
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    document.getElementById('admin-schedule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.completeSchedule = function(id) {
    showConfirm('Tandai jadwal ini sebagai selesai? Jadwal selesai akan otomatis dibersihkan setelah 7 hari.', () => {
        materializeSchedules();
        const schedule = state.schedules.find(item => item.id === id);
        if (!schedule) return;
        const today = new Date().toISOString().split('T')[0];
        schedule.status = 'completed';
        schedule.completed_at = today;
        schedule.auto_delete_at = addDaysToDateString(today, 7);
        schedule.show_ticker = false;
        touchAdminUpdate();
        saveState();
        renderAdminScheduleList();
        renderPublicView();
        showSuccess('Jadwal Selesai!', 'Jadwal tidak lagi tampil di halaman jamaah dan akan dibersihkan otomatis setelah 7 hari.');
    }, 'Ya, Selesai', false);
};

window.deleteSchedule = function(id) {
    showConfirm('Hapus jadwal kegiatan ini?', () => {
        materializeSchedules();
        state.schedules = state.schedules.filter(schedule => schedule.id !== id);
        if (state.editingScheduleId === id) resetScheduleForm();
        touchAdminUpdate();
        saveState();
        renderAdminScheduleList();
        renderPublicView();
        showToast('Jadwal berhasil dihapus.');
    });
};

// ================= EVENT LISTENER INITIALIZATIONS =================
document.addEventListener('DOMContentLoaded', () => {
    if (firebaseReady) {
        firebaseAuth.onAuthStateChanged(async (user) => {
            const authenticated = isAdminUser(user);
            state.isAdminAuthenticated = authenticated;

            if (!authenticated && state.currentRole === 'admin') {
                state.currentRole = 'public';
                sessionStorage.removeItem('current_role');
                state.feedbacks = [];
                switchMode('public');
                return;
            }

            if (authenticated && state.currentRole === 'admin') {
                await loadState();
                switchMode('admin');
            }
        });
    }

    // 1. Load data — loadState() is async and will call renderPublicView() internally after data loads
    loadState();

    // NOTE: Do NOT call renderPublicView() here — loadState() handles it after fetch completes

    // 3. User Role toggle buttons
    const btnGoAdmin = document.getElementById('btn-go-admin');
    if (btnGoAdmin) {
        btnGoAdmin.addEventListener('click', (e) => {
            e.preventDefault();
            if (state.isAdminAuthenticated) {
                switchMode('admin');
            } else {
                switchMode('auth');
            }
        });
    }

    // 4. Public Table & Chart Filters
    document.getElementById('search-tx').addEventListener('input', renderPublicTransactions);
    document.getElementById('filter-type').addEventListener('change', renderPublicTransactions);
    document.getElementById('filter-month').addEventListener('change', renderPublicTransactions);
    document.getElementById('filter-year').addEventListener('change', renderPublicTransactions);
    document.getElementById('chart-filter-year').addEventListener('change', renderSVGChart);
    document.getElementById('chart-filter-month').addEventListener('change', renderSVGChart);

    // 5. Public Feedback submission
    document.getElementById('public-feedback-form').addEventListener('submit', handlePublicFeedbackSubmit);

    // 6. QRIS Modal triggers
    document.getElementById('btn-show-qris').addEventListener('click', () => {
        document.getElementById('modal-qris').classList.add('active');
    });
    document.getElementById('close-qris-modal').addEventListener('click', () => {
        document.getElementById('modal-qris').classList.remove('active');
    });
    document.getElementById('btn-download-qris').addEventListener('click', downloadQRIS);

    // 7. Close other modals
    document.getElementById('close-receipt-modal').addEventListener('click', () => {
        document.getElementById('modal-receipt').classList.remove('active');
    });
    document.getElementById('close-committee-detail-modal')?.addEventListener('click', () => {
        document.getElementById('modal-committee-detail').classList.remove('active');
    });
    // Click outside modal content close trigger
    window.addEventListener('click', (e) => {
        const modalQris = document.getElementById('modal-qris');
        const modalReceipt = document.getElementById('modal-receipt');
        const modalCommitteeDetail = document.getElementById('modal-committee-detail');
        const modalGalleryDetail = document.getElementById('modal-gallery-detail');

        if (e.target === modalQris) modalQris.classList.remove('active');
        if (e.target === modalReceipt) modalReceipt.classList.remove('active');
        if (e.target === modalCommitteeDetail) modalCommitteeDetail.classList.remove('active');
        if (e.target === modalGalleryDetail) modalGalleryDetail.classList.remove('active');
    });

    // 8. Admin login and logout
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('admin-password').addEventListener('input', clearLoginError);
    document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);

    // 9. Bottom Navigation Tabs
    document.querySelectorAll('.bnav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            const screenId = targetBtn.getAttribute('data-screen');
            const isPublic = targetBtn.closest('#bottom-nav-public') !== null;
            
            // "Lainnya" button — no data-screen, opens the more sheet
            if (!screenId) {
                if (isPublic) {
                    openPublicMoreSheet();
                } else {
                    openAdminMoreSheet();
                }
                return;
            }
            
            if (isPublic) {
                switchAppScreen(screenId, 'public');
            } else {
                switchAppScreen(screenId, 'admin');
            }
        });
    });

    // Wire up More Menu Sheet listeners
    document.getElementById('public-more-backdrop')?.addEventListener('click', closePublicMoreSheet);
    document.getElementById('close-public-more')?.addEventListener('click', closePublicMoreSheet);
    document.querySelectorAll('#public-more-sheet .more-sheet-option').forEach(btn => {
        const screenId = btn.getAttribute('data-screen');
        if (screenId) {
            btn.addEventListener('click', () => navigatePublicMoreScreen(screenId));
        }
    });

    document.getElementById('admin-more-backdrop')?.addEventListener('click', closeAdminMoreSheet);
    document.getElementById('close-admin-more')?.addEventListener('click', closeAdminMoreSheet);
    document.querySelectorAll('#admin-more-sheet .more-sheet-option').forEach(btn => {
        const screenId = btn.getAttribute('data-admin-screen');
        if (screenId) {
            btn.addEventListener('click', () => navigateAdminMoreScreen(screenId));
        }
    });

    // Committee group tabs
    document.querySelectorAll('[data-committee-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-committee-tab');
            document.querySelectorAll('[data-committee-tab]').forEach(tab => tab.classList.toggle('active', tab === btn));
            document.querySelectorAll('.committee-panel').forEach(panel => {
                panel.classList.toggle('active', panel.id === `committee-panel-${target}`);
            });
        });
    });

    // 10. Admin Form Submissions
    document.getElementById('admin-tx-form').addEventListener('submit', handleAdminTxSubmit);
    document.getElementById('admin-project-form').addEventListener('submit', handleAdminProjectSubmit);
    document.getElementById('admin-committee-form')?.addEventListener('submit', handleAdminCommitteeSubmit);
    document.getElementById('admin-gallery-form')?.addEventListener('submit', handleAdminGallerySubmit);
    document.getElementById('admin-schedule-form')?.addEventListener('submit', handleAdminScheduleSubmit);
    document.getElementById('committee-cancel-edit')?.addEventListener('click', resetCommitteeForm);
    document.getElementById('gallery-cancel-edit')?.addEventListener('click', resetGalleryForm);
    document.getElementById('schedule-cancel-edit')?.addEventListener('click', resetScheduleForm);

    document.getElementById('gallery-filter-month')?.addEventListener('change', () => {
        state.activeGalleryIndex = 0;
        renderPublicGallery();
    });
    document.getElementById('gallery-filter-year')?.addEventListener('change', () => {
        state.activeGalleryIndex = 0;
        renderPublicGallery();
    });

    const committeePhotoInput = document.getElementById('committee-photo');
    const committeePhotoPreview = document.getElementById('committee-photo-preview');
    if (committeePhotoInput && committeePhotoPreview) {
        committeePhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            openCropModal(file, (croppedBase64) => {
                state.tempCommitteePhotoBase64 = croppedBase64;
                committeePhotoPreview.className = 'file-upload-preview compact has-image';
                committeePhotoPreview.innerHTML = `<img src="${croppedBase64}" alt="Pratinjau Foto Pengurus">`;
                showToast('Foto pengurus siap disimpan.');
            });
        });
    }

    const galleryImageInput = document.getElementById('gallery-image');
    const galleryImagePreview = document.getElementById('gallery-image-preview');
    if (galleryImageInput && galleryImagePreview) {
        galleryImageInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                state.tempGalleryImageBase64 = await compressImageFile(file);
                galleryImagePreview.className = 'file-upload-preview compact has-image';
                galleryImagePreview.innerHTML = `<img src="${state.tempGalleryImageBase64}" alt="Pratinjau Foto Kegiatan">`;
                showToast('Foto kegiatan siap disimpan.');
            } catch (err) {
                console.error(err);
                showToast('Foto kegiatan gagal diproses. Coba pilih gambar lain.');
                galleryImageInput.value = '';
            }
        });
    }

    // Crop Modal Listeners
    document.getElementById('btn-crop-cancel')?.addEventListener('click', closeCropModal);
    document.getElementById('btn-crop-save')?.addEventListener('click', () => {
        if (!cropperInstance || !activeCropCallback) return;
        const canvas = cropperInstance.getCroppedCanvas({
            width: 256,
            height: 256,
        });
        const croppedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        activeCropCallback(croppedBase64);
        closeCropModal();
    });

    // 12. File input reader for receipts (Base64 conversion)
    const receiptInput = document.getElementById('tx-receipt');
    const previewArea = document.getElementById('receipt-preview-area');
    
    receiptInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                state.tempReceiptBase64 = evt.target.result;
                previewArea.className = "file-upload-preview has-image";
                previewArea.innerHTML = `<img src="${state.tempReceiptBase64}" alt="Pratinjau Kuitansi">`;
                showToast('Gambar kuitansi berhasil diproses.');
            };
            reader.readAsDataURL(file);
        }
    });

    // 12b. File input reader for treasurer profile picture (Base64 conversion)
    const avatarInput = document.getElementById('change-admin-avatar');
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                openCropModal(file, (croppedBase64) => {
                    state.treasurerAvatar = croppedBase64;
                    saveState();
                    updateProfileDisplay();
                    showToast('Foto profil bendahara berhasil diperbarui.');
                });
            }
        });
    }

    // 11. Nominal Input filtering (remove leading zeros)
    const txAmountInput = document.getElementById('tx-amount');
    if (txAmountInput) {
        txAmountInput.addEventListener('input', (e) => {
            if (e.target.value.startsWith('0') && e.target.value.length > 1) {
                e.target.value = e.target.value.replace(/^0+/, '');
            }
        });
    }

    // 13. Settings Actions
    document.getElementById('btn-save-pw').addEventListener('click', handleChangePassword);
    document.getElementById('btn-export-data').addEventListener('click', exportDataBackup);
    document.getElementById('btn-reset-db').addEventListener('click', formatDatabase);
    document.getElementById('btn-save-profile').addEventListener('click', handleSaveProfile);
    document.getElementById('btn-print-qr').addEventListener('click', printAccessQr);
    document.getElementById('btn-download-qr-pdf').addEventListener('click', downloadAccessQrPdf);
    
    const printReportBtn = document.getElementById('btn-print-report');
    if (printReportBtn) {
        printReportBtn.addEventListener('click', printFilteredReport);
    }
    
    document.getElementById('btn-auth-back').addEventListener('click', (e) => {
        e.preventDefault();
        switchMode('public');
    });

    // 14. Custom Confirmation Modal Handlers
    const confirmModal = document.getElementById('modal-confirm');
    if (confirmModal) {
        document.getElementById('btn-confirm-cancel').addEventListener('click', () => {
            confirmModal.classList.remove('active');
            confirmCallback = null;
        });
        document.getElementById('btn-confirm-ok').addEventListener('click', () => {
            confirmModal.classList.remove('active');
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            confirmCallback = null;
        });
    }

    // 15. Custom Success Modal Handlers
    const successModal = document.getElementById('modal-success');
    if (successModal) {
        document.getElementById('btn-success-close').addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }

    // Click outside modal content close trigger update
    window.addEventListener('click', (e) => {
        const modalQris = document.getElementById('modal-qris');
        const modalReceipt = document.getElementById('modal-receipt');
        const modalSuccess = document.getElementById('modal-success');

        if (e.target === modalQris) modalQris.classList.remove('active');
        if (e.target === modalReceipt) modalReceipt.classList.remove('active');
        if (e.target === modalSuccess) modalSuccess.classList.remove('active');
    });
});

// Keep print classes long enough for Android Chrome's async print preview.
window.addEventListener('afterprint', () => {
    schedulePrintModeCleanup();
});

function openCropModal(file, callback) {
    const reader = new FileReader();
    reader.onload = function(evt) {
        const modal = document.getElementById('modal-crop');
        const cropImg = document.getElementById('crop-image-source');
        if (!modal || !cropImg) return;
        
        cropImg.src = evt.target.result;
        activeCropCallback = callback;
        
        modal.classList.add('active');
        
        if (cropperInstance) {
            cropperInstance.destroy();
        }
        
        setTimeout(() => {
            cropperInstance = new Cropper(cropImg, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.9,
                responsive: true,
                background: false
            });
        }, 150);
    };
    reader.readAsDataURL(file);
}

function closeCropModal() {
    const modal = document.getElementById('modal-crop');
    if (modal) modal.classList.remove('active');
    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    // Reset file input values
    const committeePhoto = document.getElementById('committee-photo');
    if (committeePhoto) committeePhoto.value = '';
    const avatarInput = document.getElementById('change-admin-avatar');
    if (avatarInput) avatarInput.value = '';
}
