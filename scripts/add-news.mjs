#!/usr/bin/env node
// Add an item to data/news.json:
//   node scripts/add-news.mjs "Started as a Software Engineer at Bloomberg." --letters B
//   node scripts/add-news.mjs "New paper out!" --date 2026-11 --link https://example.com --thumb assets/thumbs/paper.jpg
//   node scripts/add-news.mjs "Joined Roblox." --icon roblox --date 2025-05-20
// Options: --date YYYY | YYYY-MM | YYYY-MM-DD (default: today)   --link URL
//          one tile: --thumb path/to/image | --icon name-of-svg-in-assets/icons (or "microsoft") | --letters ABC
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const args = process.argv.slice(2);
const text = args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
if (!text) { console.error('Usage: node scripts/add-news.mjs "News text" [--date 2026-10] [--link URL] [--thumb PATH | --icon NAME | --letters ABC]'); process.exit(1); }
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const item = { date: opt('date') || new Date().toISOString().slice(0, 10), text };
for (const k of ['link', 'thumb', 'icon', 'letters']) if (opt(k)) item[k] = opt(k);
if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(item.date)) { console.error('--date must look like 2026, 2026-10, or 2026-10-06'); process.exit(1); }

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'news.json');
const items = JSON.parse(readFileSync(file, 'utf8'));
items.push(item);
items.sort((a, b) => (a.date < b.date ? 1 : -1));
writeFileSync(file, '[\n' + items.map(i => '  ' + JSON.stringify(i)).join(',\n') + '\n]\n');
console.log(`Added: ${item.date} · ${item.text}\nNow commit and push data/news.json.`);
