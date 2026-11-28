const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const output = path.join(root, 'dist');
const files = ['index.html', 'style.css', 'game.js'];
const hash = crypto.createHash('sha256');
for (const file of files) hash.update(file).update(fs.readFileSync(path.join(root, file)));
const fingerprint = hash.digest('hex');
const stamp = path.join(output, '.build-hash');
if (fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === fingerprint && files.every(file => fs.existsSync(path.join(output, file)))) {
  console.log('Static output is current.');
  process.exit(0);
}
fs.mkdirSync(output, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
fs.writeFileSync(stamp, fingerprint + '\n');
console.log(`Built ${files.length} static assets in ${output}`);
