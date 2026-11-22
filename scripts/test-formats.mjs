import fs from 'fs';

// Load the REAL pure helpers out of client.js by evaluating the source slice
// that contains normalize() and the whole backup/format section.
const src = fs.readFileSync('client.js', 'utf8');
const startMark = '    function normalize(e) {';
const endMark = '    // ---- Access-password security store';
const a = src.indexOf(startMark);
const b = src.indexOf(endMark, a);
if (a < 0 || b < 0) throw new Error('markers not found');
const code = src.slice(a, b);
const factory = new Function('window', `
  ${code}
  return { normalize, buildBackup, buildCsv, parseCsv, parseBackup,
           buildMarkdown, parseMarkdown, parseImport, EXPORT_COLS, FIELD_LABELS };
`);
const api = factory({ localStorage: { getItem() { return null; }, setItem() {} } });

const sample = [
  { id: 'id-1', title: 'GitHub', category: 'account', username: 'user@example.com',
    password: 'p@ss,word"with\nnewline', url: 'https://github.com', notes: 'line1\nline2',
    createdAt: 1700000000000, updatedAt: 1700000001000 },
  { id: 'id-2', title: 'OpenAI | API', category: 'apikey', provider: 'OpenAI',
    apiKey: 'sk-abc,def\\ghi', endpoint: 'https://api.openai.com/v1', expiry: '2026-12-31',
    notes: 'pipe | backslash \\ quote "', createdAt: 1700000002000, updatedAt: 1700000003000 },
  { id: 'id-3', title: '恢复码', category: 'other', content: '中文,包含"引号"和|竖线\n第二行',
    notes: '多行\n文本', createdAt: 1700000004000, updatedAt: 1700000005000 },
];
const normalized = sample.map(api.normalize);
const COLS = api.EXPORT_COLS;

let failures = 0;
function assert(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); }
  else { console.log('  ✗ ' + msg); failures++; }
}
function eqEntries(got, want, label) {
  assert(Array.isArray(got) && got.length === want.length, label + ': entry count');
  want.forEach((w, i) => {
    COLS.forEach((c) => {
      const gv = got[i] && got[i][c];
      const wv = w[c] == null ? '' : w[c];
      const norm = (v) => (v == null ? '' : String(v));
      assert(norm(gv) === norm(wv), label + ': [' + i + '].' + c + ' = ' + JSON.stringify(wv) + ' (got ' + JSON.stringify(gv) + ')');
    });
  });
}

console.log('\n== JSON round-trip ==');
const json = JSON.stringify(api.buildBackup(normalized), null, 2);
eqEntries(api.parseBackup(json), normalized, 'json');
assert(api.parseImport(json).fmt === 'json', 'json auto-detect');

console.log('\n== CSV round-trip (Chinese headers) ==');
const csv = api.buildCsv(normalized);
assert(csv.charCodeAt(0) === 0xFEFF, 'CSV has UTF-8 BOM');
assert(csv.indexOf('\uFEFF标题') === 0, 'CSV first column is 标题');
eqEntries(api.parseCsv(csv), normalized, 'csv');
assert(api.parseImport(csv).fmt === 'csv', 'csv auto-detect');
assert(api.parseImport(csv).entries.length === 3, 'csv detect entries');

console.log('\n== Markdown card round-trip ==');
const md = api.buildMarkdown(normalized);
assert(md.indexOf('| 字段 | 内容 |') !== -1, 'markdown has 字段/内容 header');
assert(md.indexOf('<!-- cv:') !== -1, 'markdown embeds lossless comment');
eqEntries(api.parseMarkdown(md), normalized, 'markdown');
assert(api.parseImport(md).fmt === 'md', 'markdown auto-detect');
assert(api.parseImport(md).entries.length === 3, 'markdown detect entries');

console.log('\n== hand-edited markdown (comment removed) ==');
const stripped = md.split('\n').filter((l) => l.indexOf('<!-- cv:') === -1).join('\n');
const fromCards = api.parseMarkdown(stripped);
assert(fromCards.length === 3, 'cards without comment still parse 3 entries');
assert(fromCards[0].title === 'GitHub', 'card title recovered');
assert(fromCards[0].username === 'user@example.com', 'card username recovered');

console.log('\n== Legacy format compatibility ==');
// Legacy CSV: English headers, raw epoch timestamps.
const legacyCsv = '\uFEFF' + COLS.join(',') + '\n' + COLS.map((c) => {
  const v = normalized[0][c];
  return v == null ? '' : String(v);
}).join(',');
assert(api.parseCsv(legacyCsv)[0].title === 'GitHub', 'legacy English-header CSV imports');
// Legacy MD: one wide table, English header row + separator.
const legacyMd = [
  '# Credential Vault / 凭据保险箱', '',
  '| ' + COLS.join(' | ') + ' |',
  '| ' + COLS.map(() => '---').join(' | ') + ' |',
  '| ' + COLS.map((c) => { const v = normalized[0][c]; return v == null ? '' : String(v).replace(/\|/g, '\\|').replace(/\n/g, '\\n'); }).join(' | ') + ' |'
].join('\n');
const legacyOut = api.parseMarkdown(legacyMd);
assert(legacyOut.length === 1 && legacyOut[0].title === 'GitHub', 'legacy wide-table Markdown imports');

console.log('\n== empty / invalid ==');
let threwParse = false;
try { api.parseImport('garbage nonsense'); } catch (e) { threwParse = e.message === 'parse'; }
assert(threwParse, 'garbage throws parse error');

console.log('\n' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
process.exit(failures === 0 ? 0 : 1);
