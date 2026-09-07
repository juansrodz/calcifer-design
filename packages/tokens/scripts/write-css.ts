import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tokens, tokensToCss } from '../src/index';

const distRoot = resolve(import.meta.dir, '../dist');
const outputFile = resolve(distRoot, 'tokens.css');

await mkdir(distRoot, { recursive: true });
await writeFile(outputFile, tokensToCss(tokens), 'utf8');
console.log(`tokens written: ${outputFile}`);
