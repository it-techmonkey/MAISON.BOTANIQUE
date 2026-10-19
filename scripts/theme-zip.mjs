// Packs shopify-theme/ into shopify-theme.zip for Online Store → Themes →
// Add theme → Upload zip file. Usage: npm run theme:zip
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'shopify-theme');
const output = resolve(root, 'shopify-theme.zip');
if (existsSync(output)) rmSync(output);

// Zip the folder's contents (not the folder), as Shopify expects layout/, templates/… at the root.
if (process.platform === 'win32') {
  execFileSync('powershell.exe', ['-NoProfile', '-Command',
    `Get-ChildItem -Path '${source}' -Exclude README.md | Compress-Archive -DestinationPath '${output}'`], { stdio: 'inherit' });
} else {
  execFileSync('zip', ['-qr', output, '.', '-x', 'README.md'], { cwd: source, stdio: 'inherit' });
}
console.log(`Wrote ${output}`);
