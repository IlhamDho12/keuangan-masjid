const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const filesToCopy = ['index.html', 'index.css', 'app.js'];
const dirsToCopy = ['assets'];

fs.rmSync(publicDir, { recursive: true, force: true });
fs.mkdirSync(publicDir, { recursive: true });

for (const file of filesToCopy) {
    fs.copyFileSync(path.join(rootDir, file), path.join(publicDir, file));
}

for (const dir of dirsToCopy) {
    fs.cpSync(path.join(rootDir, dir), path.join(publicDir, dir), { recursive: true });
}

console.log('Firebase Hosting assets built in public/.');
