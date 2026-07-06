const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname)));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules', 'jspdf', 'dist')));

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
        { id: 'tx-demo-1', date: getRelativeDateString(0), amount: 2750000, type: 'income', description: 'Infak Jumat pekan pertama Juli', storage: 'cash', receipt_url: null },
        { id: 'tx-demo-2', date: getRelativeDateString(1), amount: 1500000, type: 'income', description: 'Transfer donatur untuk program santunan', storage: 'bank', receipt_url: null },
        { id: 'tx-demo-3', date: getRelativeDateString(2), amount: 420000, type: 'expense', description: 'Pembelian perlengkapan kebersihan masjid', storage: 'cash', receipt_url: null },
        { id: 'tx-demo-4', date: getRelativeDateString(6), amount: 875000, type: 'expense', description: 'Pembayaran tagihan listrik dan air', storage: 'bank', receipt_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f1f5f9"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%2364748b">BUKTI PEMBAYARAN UTILITAS</text></svg>' },
        { id: 'tx-demo-5', date: '2026-05-18', amount: 3200000, type: 'income', description: 'Donasi pembangunan kanopi halaman', storage: 'bank', receipt_url: null }
    ],
    projects: [
        { id: 'proj-demo-1', title: 'Perbaikan Sound System Masjid', target_amount: 8500000, collected_amount: 4250000, status: 'active', description: 'Penggantian mixer audio dan beberapa mikrofon agar suara imam serta penceramah lebih jelas.' },
        { id: 'proj-demo-2', title: 'Program Paket Sembako Jumat Berkah', target_amount: 6000000, collected_amount: 6000000, status: 'completed', description: 'Pengadaan paket sembako untuk warga sekitar masjid yang membutuhkan.' },
        { id: 'proj-demo-3', title: 'Pengecatan Pagar Depan', target_amount: 4500000, collected_amount: 900000, status: 'active', description: 'Pengecatan ulang pagar depan dan gerbang kecil agar area masjid terlihat lebih rapi.' }
    ],
    feedbacks: [
        { id: 'fb-demo-1', sender_name: 'Ibu Sari', phone_number: '081234567890', message: 'Mohon jadwal kerja bakti kebersihan masjid diumumkan lebih awal agar jamaah bisa ikut membantu.', status: 'unread', created_at: getRelativeDateString(0) },
        { id: 'fb-demo-2', sender_name: 'Hamba Allah', phone_number: '', message: 'Laporan kas sudah mudah dibaca. Semoga fitur bukti transaksi bisa terus dilengkapi.', status: 'read', created_at: getRelativeDateString(3) },
        { id: 'fb-demo-3', sender_name: 'Pak Dani', phone_number: '085612345678', message: 'Usul agar program perbaikan sound system diprioritaskan sebelum kegiatan pengajian bulanan.', status: 'unread', created_at: getRelativeDateString(5) }
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
