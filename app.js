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

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let firebaseReady = false;

if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    firestoreDb = firebase.firestore();
    firebaseAuth = firebase.auth();
    firebaseReady = true;
}

// ================= INITIAL SEED DATA =================
// Helper to generate dates relative to today
const getRelativeDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

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
    tempReceiptBase64: null
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
        whatsappNumber: state.whatsappNumber
    };
}

function getFullStateSnapshot() {
    return {
        transactions: state.transactions,
        projects: state.projects,
        feedbacks: state.feedbacks,
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
    const [transactions, projects, settingsDoc] = await Promise.all([
        getCollectionData('transactions'),
        getCollectionData('projects'),
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
        ...(settingsDoc.exists ? settingsDoc.data() : {})
    }, includeFeedbacks);
}

// Save state to Firestore, with localStorage fallback for offline preview.
async function saveState() {
    try {
        if (!firebaseReady || !state.isAdminAuthenticated) throw new Error('Firestore admin write unavailable');

        const batch = firestoreDb.batch();
        await replaceCollection(batch, 'transactions', state.transactions);
        await replaceCollection(batch, 'projects', state.projects);
        await replaceCollection(batch, 'feedbacks', state.feedbacks);
        batch.set(firestoreDb.collection('settings').doc(APP_SETTINGS_DOC), getSettingsState());
        await batch.commit();
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
    // fetchServerInfo(); // Removed as it seems unnecessary unless defined elsewhere. Wait, I will keep it.
    if (typeof fetchServerInfo === 'function') fetchServerInfo();
    
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
    saveState();
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

// Fetch networking details from server to populate QR Code link
async function fetchServerInfo() {
    try {
        const response = await fetch('/api/info');
        if (!response.ok) throw new Error('API not available');
        const info = await response.json();
        
        // Update URL texts
        const accessUrlEl = document.getElementById('qr-access-url');
        if (accessUrlEl) accessUrlEl.textContent = info.url;

        // Update QR Image source pointing to local server URL
        const qrImageEl = document.getElementById('qr-image-src');
        if (qrImageEl) qrImageEl.src = `/api/qr?url=${encodeURIComponent(info.url)}`;
        
    } catch (e) {
        console.warn('Server API unavailable, using current hosting URL for access QR.', e);
        const currentUrl = window.location.origin || 'https://keuangan-masjid-rk.web.app';
        const accessUrlEl = document.getElementById('qr-access-url');
        if (accessUrlEl) accessUrlEl.textContent = currentUrl;

        const qrImageEl = document.getElementById('qr-image-src');
        if (qrImageEl) {
            qrImageEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`;
        }
    }
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
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        lastUpdatedEl.textContent = `🕐 Data terakhir dimuat: ${dateStr}, pukul ${timeStr} WIB`;
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
    if (proj) {
        proj.status = 'completed';
        proj.collected_amount = proj.target_amount; // Set full collected
        saveState();
        renderAdminDashboard();
        showToast('Proyek dinyatakan selesai & sukses!');
    }
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

async function handleAdminLogin(e) {
    e.preventDefault();
    const pwInput = document.getElementById('admin-password');
    const pwVal = pwInput.value;

    clearLoginError();

    if (!firebaseReady) {
        showLoginError('Firebase belum siap. Periksa koneksi internet lalu coba lagi.');
        return;
    }

    try {
        const credential = await firebaseAuth.signInWithEmailAndPassword(ADMIN_LOGIN_EMAIL, pwVal);
        if (!isAdminUser(credential.user)) {
            await firebaseAuth.signOut();
            throw new Error('Akun ini belum terdaftar sebagai admin sistem.');
        }

        state.isAdminAuthenticated = true;
        sessionStorage.setItem('current_role', 'admin');
        pwInput.value = '';
        await loadState();
        switchMode('admin');
        showToast('Login berhasil! Selamat datang Pengurus Masjid.');
    } catch (err) {
        console.error('Admin login failed', err);
        const authMessage = err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password'
            ? 'PIN atau kata sandi salah.'
            : 'Login gagal. Coba ulang atau refresh halaman.';
        showLoginError(authMessage);
        showToast(authMessage, 'error');
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

    // Click outside modal content close trigger
    window.addEventListener('click', (e) => {
        const modalQris = document.getElementById('modal-qris');
        const modalReceipt = document.getElementById('modal-receipt');

        if (e.target === modalQris) modalQris.classList.remove('active');
        if (e.target === modalReceipt) modalReceipt.classList.remove('active');
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
            // Determine group based on the targetBtn parent
            const isPublic = targetBtn.closest('#bottom-nav-public') !== null;
            if (isPublic) {
                switchAppScreen(screenId, 'public');
            } else {
                switchAppScreen(screenId, 'admin');
            }
        });
    });

    // 10. Admin Form Submissions
    document.getElementById('admin-tx-form').addEventListener('submit', handleAdminTxSubmit);
    document.getElementById('admin-project-form').addEventListener('submit', handleAdminProjectSubmit);

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
                const reader = new FileReader();
                reader.onload = function(evt) {
                    state.treasurerAvatar = evt.target.result;
                    saveState();
                    updateProfileDisplay();
                    showToast('Foto profil bendahara berhasil diperbarui.');
                };
                reader.readAsDataURL(file);
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
    document.getElementById('btn-print-qr').addEventListener('click', () => {
        runNativePrint('printing-qr');
    });
    
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
