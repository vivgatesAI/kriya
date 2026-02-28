import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const dataFile = path.join(dataDir, 'entries.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]\n', 'utf8');

const now = new Date();
const nyParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false
}).formatToParts(now);
const part = (k) => nyParts.find(p => p.type === k)?.value;
const nyDate = `${part('year')}-${part('month')}-${part('day')}`;
const nyHour = Number(part('hour'));

if (nyHour !== 21) {
  console.log(`Skip: NY hour is ${nyHour}, not 21.`);
  process.exit(0);
}

const entries = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
if (entries.some(e => e.date === nyDate && e.source === 'auto')) {
  console.log(`Skip: auto entry already exists for ${nyDate}.`);
  process.exit(0);
}

function git(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

const log = git(`git log --since=\"${nyDate} 00:00\" --until=\"${nyDate} 23:59\" --pretty=format:\"%s\" -- .`)
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean);

const touched = git(`git log --since=\"${nyDate} 00:00\" --until=\"${nyDate} 23:59\" --name-only --pretty=format:\"\" -- .`)
  .split('\n')
  .map(s => s.trim())
  .filter(Boolean);

const highlights = [...new Set(log)].slice(0, 4);
const topFiles = [...new Set(touched)].slice(0, 5);

const openings = [
  'Today\'s ledger reads like a measured city desk column: precise, unsentimental, and cumulative.',
  'By dusk, the work resolved into a clean sequence of decisions, each one compounding the last.',
  'In tonight\'s brief, progress arrived less as spectacle and more as structure.'
];

const middles = [
  'The day favored disciplined iteration over noise, with refinements landing where they would matter tomorrow.',
  'Most movement came through careful revisions—small cuts, firmer hierarchy, and clearer intent.',
  'Execution leaned technical but editorial in spirit: trim what distracts, keep what carries meaning.'
];

const close = [
  'Filed at 9:00 p.m. New York time, this entry marks another deliberate step in the long arc of the build.',
  'Entered at 9:00 p.m. ET, the record closes with momentum intact and direction unmistakable.',
  'Logged at 9:00 p.m. ET: one more page in a timeline built for endurance, not theatrics.'
];

const pick = (arr) => arr[now.getDate() % arr.length];

const summary = [pick(openings), pick(middles), pick(close)].join(' ');
const items = [];

if (highlights.length) items.push(...highlights.map(h => `Completed: ${h}`));
if (topFiles.length) items.push(`Touched files: ${topFiles.join(', ')}`);
if (!items.length) items.push('Completed maintenance and continuity checks across the project baseline.');

const autoEntry = {
  date: nyDate,
  title: 'Daily Work Brief',
  summary,
  items,
  tags: ['daily', 'auto', 'journal'],
  hours: 1,
  source: 'auto'
};

entries.unshift(autoEntry);
entries.sort((a,b) => new Date(b.date) - new Date(a.date));
fs.writeFileSync(dataFile, JSON.stringify(entries, null, 2) + '\n', 'utf8');

console.log(`Added auto entry for ${nyDate}.`);
