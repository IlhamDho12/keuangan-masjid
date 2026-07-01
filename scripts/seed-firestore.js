const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'keuangan-masjid-rk';
const DATABASE_ID = '(default)';
const ROOT_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

const dbPath = path.join(__dirname, '..', 'data', 'db.json');
const seed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function getAccessToken() {
    return execSync('gcloud auth print-access-token --account redhoi73@gmail.com', {
        encoding: 'utf8'
    }).trim();
}

function firestoreValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    }
    if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
    if (typeof value === 'object') {
        return {
            mapValue: {
                fields: Object.fromEntries(Object.entries(value).map(([key, val]) => [key, firestoreValue(val)]))
            }
        };
    }
    return { stringValue: String(value) };
}

function firestoreDocument(data) {
    return {
        fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, firestoreValue(value)]))
    };
}

async function request(method, url, token, body) {
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-goog-user-project': PROJECT_ID
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok && response.status !== 404) {
        const text = await response.text();
        throw new Error(`${method} ${url} failed: ${response.status} ${text}`);
    }

    if (response.status === 404) return null;
    return response.json();
}

async function clearCollection(collectionName, token) {
    const list = await request('GET', `${ROOT_URL}/${collectionName}`, token);
    for (const doc of list?.documents || []) {
        await request('DELETE', doc.name, token);
    }
}

async function seedCollection(collectionName, items, token) {
    await clearCollection(collectionName, token);
    for (const item of items) {
        const { id, ...payload } = item;
        await request('PATCH', `${ROOT_URL}/${collectionName}/${encodeURIComponent(id)}`, token, firestoreDocument(payload));
    }
}

async function main() {
    const token = getAccessToken();

    await seedCollection('transactions', seed.transactions, token);
    await seedCollection('projects', seed.projects, token);
    await seedCollection('feedbacks', seed.feedbacks, token);

    const settings = {
        treasurerName: seed.treasurerName,
        treasurerRole: seed.treasurerRole,
        treasurerAvatar: seed.treasurerAvatar || '',
        bankName: seed.bankName,
        bankAccountNumber: seed.bankAccountNumber,
        bankAccountHolder: seed.bankAccountHolder,
        whatsappNumber: seed.whatsappNumber
    };

    await request('PATCH', `${ROOT_URL}/settings/main`, token, firestoreDocument(settings));
    console.log(`Seeded Firestore project ${PROJECT_ID}.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
