const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const filesToCopy = ['index.html', 'index.css', 'app.js'];
const dirsToCopy = ['assets'];
const vendorFiles = [
    {
        source: path.join(rootDir, 'node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js'),
        target: path.join(publicDir, 'vendor', 'jspdf.umd.min.js')
    }
];

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });

for (const file of filesToCopy) {
    fs.copyFileSync(path.join(rootDir, file), path.join(publicDir, file));
}

for (const dir of dirsToCopy) {
    fs.cpSync(path.join(rootDir, dir), path.join(publicDir, dir), { recursive: true });
}

for (const file of vendorFiles) {
    fs.mkdirSync(path.dirname(file.target), { recursive: true });
    fs.copyFileSync(file.source, file.target);
}

console.log('Firebase Hosting assets built in public/.');
