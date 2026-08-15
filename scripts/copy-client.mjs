import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'lib'), { recursive: true });
copyFileSync(join(root, 'client', 'client.js'), join(root, 'lib', 'client.js'));
console.log('copied client/client.js -> lib/client.js');
