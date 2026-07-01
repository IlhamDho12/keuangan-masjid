const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// DB Path setup
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Helper to get local IPv4 address
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            // Check for IPv4, non-loopback, and non-internal addresses
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// Inital seed data for db.json if database doesn't exist
const initialDbState = {
    transactions: [
        { id: 'tx-1', date: getRelativeDateString(0), amount: 4850000, type: 'income', description: 'Infak Jumat Terkumpul Utama', storage: 'cash', receipt_url: null },
        { id: 'tx-2', date: getRelativeDateString(1), amount: 1500000, type: 'expense', description: 'Santunan Anak Yatim Bulanan', storage: 'bank', receipt_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2364748b">KUITANSI SANTUNAN YATIM</text></svg>' },
        { id: 'tx-3', date: getRelativeDateString(3), amount: 820000, type: 'expense', description: 'Tagihan Listrik PLN Juni (Operasional)', storage: 'bank', receipt_url: null },
        { id: 'tx-4', date: getRelativeDateString(4), amount: 3500000, type: 'income', description: 'Transfer Donatur H. Rahman via BSI (Donasi Pembangunan)', storage: 'bank', receipt_url: null },
        { id: 'tx-5', date: getRelativeDateString(5), amount: 650000, type: 'income', description: 'Rekap Celengan Harian Masjid (Infak)', storage: 'cash', receipt_url: null },
        { id: 'tx-6', date: getRelativeDateString(7), amount: 1200000, type: 'expense', description: 'Servis AC Ruang Utama 3 unit (Pemeliharaan)', storage: 'cash', receipt_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2364748b">NOTA SERVIS AC MASJID</text></svg>' },
        { id: 'tx-7', date: getRelativeDateString(10), amount: 2000000, type: 'expense', description: 'Insentif Bulanan Guru Mengaji & Marbot', storage: 'cash', receipt_url: null },
        { id: 'tx-m1-1', date: '2026-05-15', amount: 18500000, type: 'income', description: 'Pemasukan Donasi Pembangunan Menara', storage: 'bank', receipt_url: null },
        { id: 'tx-m1-2', date: '2026-05-20', amount: 9500000, type: 'expense', description: 'Pembelian Semen & Pasir Pembangunan', storage: 'bank', receipt_url: null },
        { id: 'tx-m2-1', date: '2026-04-10', amount: 12400000, type: 'income', description: 'Total Infak Jumat Bulan April', storage: 'cash', receipt_url: null },
        { id: 'tx-m2-2', date: '2026-04-18', amount: 4200000, type: 'expense', description: 'Konsumsi Peringatan Nuzulul Quran', storage: 'cash', receipt_url: null },
        { id: 'tx-m3-1', date: '2026-03-05', amount: 15600000, type: 'income', description: 'Penerimaan Zakat & Infak Ramadan Awal', storage: 'bank', receipt_url: null },
        { id: 'tx-m3-2', date: '2026-03-25', amount: 8000000, type: 'expense', description: 'Penyaluran Paket Sembako Duafa (Santunan)', storage: 'bank', receipt_url: null },
        { id: 'tx-m4-1', date: '2026-02-12', amount: 9800000, type: 'income', description: 'Total Rekap Pemasukan Kas Februari (Infak)', storage: 'cash', receipt_url: null },
        { id: 'tx-m4-2', date: '2026-02-28', amount: 3500000, type: 'expense', description: 'Pengecatan Ulang Dinding Luar Masjid (Pemeliharaan)', storage: 'cash', receipt_url: null },
        { id: 'tx-m5-1', date: '2026-01-05', amount: 11000000, type: 'income', description: 'Saldo Awal Awal Tahun & Infak', storage: 'bank', receipt_url: null },
        { id: 'tx-m5-2', date: '2026-01-20', amount: 5000000, type: 'expense', description: 'Perbaikan Kanopi & Parkiran Motor (Pemeliharaan)', storage: 'bank', receipt_url: null }
    ],
    projects: [
        { id: 'proj-1', title: 'Renovasi Tempat Wudhu Wanita', target_amount: 12000000, collected_amount: 9500000, status: 'active', description: 'Perluasan area wudhu jamaah wanita serta penggantian keramik lantai agar tidak licin.' },
        { id: 'proj-2', title: 'Pembelian Mobil Ambulans Umat', target_amount: 180000000, collected_amount: 180000000, status: 'completed', description: 'Pengadaan mobil jenazah/ambulans gratis untuk melayani warga kelurahan Pagar Tengah.' },
        { id: 'proj-3', title: 'Pemasangan Kanopi Halaman Depan', target_amount: 25000000, collected_amount: 3000000, status: 'active', description: 'Pemasangan kanopi tambahan agar jamaah shalat Jumat tidak kepanasan di area pelataran luar.' }
    ],
    feedbacks: [
        { id: 'fb-1', sender_name: 'Pak Rahmat', phone_number: '08129876543', message: 'Alhamdulillah, laporan keuangannya sangat rapi dan transparan. Kuitansi pengeluaran juga bisa dilihat. Sangat amanah!', status: 'unread', created_at: getRelativeDateString(2) },
        { id: 'fb-2', sender_name: 'Hamba Allah', phone_number: '', message: 'Mohon info proyek kanopi kapan mulai dikerjakan fisiknya ya pak?', status: 'read', created_at: getRelativeDateString(5) }
    ],
    adminPassword: 'raudhatul',
    treasurerName: 'H. Sudirman, S.E.',
    treasurerRole: 'Bendahara Utama',
    treasurerAvatar: '',
    bankName: 'BSI',
    bankBranch: 'KC Pendopo',
    bankAccountNumber: '7123456789',
    bankAccountHolder: 'Masjid Raudhatul Khoiriyah',
    whatsappNumber: '6281234567890'
};

function getRelativeDateString(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
}

// Ensure database file and directory exist
function initDatabase() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR);
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(initialDbState, null, 2), 'utf8');
        console.log('Database initialized with seed data.');
    }
}

initDatabase();

// --- REST API ROUTES ---

// Get complete database state
app.get('/api/state', (req, res) => {
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read database state' });
        }
        res.json(JSON.parse(data));
    });
});

// Save complete database state
app.post('/api/state', (req, res) => {
    const newState = req.body;
    if (!newState.transactions || !newState.projects || !newState.feedbacks || !newState.adminPassword) {
        return res.status(400).json({ error: 'Invalid state structure provided' });
    }
    
    fs.writeFile(DB_PATH, JSON.stringify(newState, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save database state' });
        }
        res.json({ success: true });
    });
});

// Get system & networking info
app.get('/api/info', (req, res) => {
    const localIp = getLocalIpAddress();
    const port = PORT;
    const url = `http://${localIp}:${port}`;
    res.json({
        port,
        localIp,
        url
    });
});

// Generate dynamic QR Code pointing to the server
app.get('/api/qr', async (req, res) => {
    try {
        const urlToEncode = req.query.url || `http://${getLocalIpAddress()}:${PORT}`;
        const svgString = await QRCode.toString(urlToEncode, {
            type: 'svg',
            margin: 2,
            width: 300,
            color: {
                dark: '#0f172a',  // slate-900
                light: '#ffffff' // white
            }
        });
        res.type('image/svg+xml').send(svgString);
    } catch (err) {
        res.status(500).send('Failed to generate QR Code');
    }
});

// Fallback route for SPA router (serves index.html for unrecognized URLs)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server listener
app.listen(PORT, () => {
    const localIp = getLocalIpAddress();
    console.log(`\n======================================================`);
    console.log(`Sistem Informasi Keuangan Masjid Raudhatul Khoiriyah`);
    console.log(`======================================================`);
    console.log(`Server offline-first AKTIF dan siap digunakan!`);
    console.log(`Akses Lokal (PC ini): http://localhost:${PORT}`);
    console.log(`Akses Jaringan (Wi-Fi): http://${localIp}:${PORT}`);
    console.log(`======================================================\n`);
});
