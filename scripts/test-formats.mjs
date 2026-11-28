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
           buildMarkdown, parseMarkdown, parseImport, EXPORT_COLS, FIELD_LABELS,
           encryptBackup, decryptBackup, detectEncrypted, ENC_FORMAT };
`);
const api = factory({
  localStorage: { getItem() { return null; }, setItem() {} },
  crypto: globalThis.crypto,
});

const sample = [
  { id: 'id-1', title: 'GitHub', category: 'account', username: 'user@example.com',
    password: 'p@ss,word"with\nnewline', url: 'https://github.com', notes: 'line1\nline2',
    links: ['id-2', 'id-6'], accessPlugins: ['dsh-mail'],
    createdAt: 1700000000000, updatedAt: 1700000001000 },
  { id: 'id-2', title: 'OpenAI | API', category: 'apikey', provider: 'OpenAI',
    apiKey: 'sk-abc,def\\ghi', endpoint: 'https://api.openai.com/v1', expiry: '2026-12-31',
    notes: 'pipe | backslash \\ quote "', accessPlugins: ['other-plugin'],
    createdAt: 1700000002000, updatedAt: 1700000003000 },
  { id: 'id-3', title: '恢复码', category: 'other', content: '中文,包含"引号"和|竖线\n第二行',
    notes: '多行\n文本', createdAt: 1700000004000, updatedAt: 1700000005000 },
  { id: 'id-4', title: '我的公众号', category: 'wechatMp', appId: 'wx1234567890abcdef',
    appSecret: 'mp-secret-abc', token: 'mp-token-xyz', encodingAesKey: 'abcdefghijklmnopqrstuvwxyz0123456789ABCDE',
    serverUrl: 'https://example.com/wechat/callback', notes: '公众号开发凭证',
    createdAt: 1700000006000, updatedAt: 1700000007000 },
  { id: 'id-5', title: '我的小程序', category: 'wechatMini', appId: 'wx0987654321fedcba',
    appSecret: 'mini-secret-def', uploadKey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----',
    domains: 'request: https://api.example.com\nsocket: wss://ws.example.com', notes: '小程序开发凭证',
    createdAt: 1700000008000, updatedAt: 1700000009000 },
  { id: 'id-6', title: 'Webhook 密钥', category: 'secretKey', keyName: 'webhook-secret',
    keyValue: 'whsec-abc123-XYZ', notes: '第三方回调签名密钥',
    createdAt: 1700000010000, updatedAt: 1700000011000 },
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
assert(api.parseImport(csv).entries.length === sample.length, 'csv detect entries');

console.log('\n== Markdown card round-trip ==');
const md = api.buildMarkdown(normalized);
assert(md.indexOf('| 字段 | 内容 |') !== -1, 'markdown has 字段/内容 header');
assert(md.indexOf('<!-- cv:') !== -1, 'markdown embeds lossless comment');
eqEntries(api.parseMarkdown(md), normalized, 'markdown');
assert(api.parseImport(md).fmt === 'md', 'markdown auto-detect');
assert(api.parseImport(md).entries.length === sample.length, 'markdown detect entries');

console.log('\n== hand-edited markdown (comment removed) ==');
const stripped = md.split('\n').filter((l) => l.indexOf('<!-- cv:') === -1).join('\n');
const fromCards = api.parseMarkdown(stripped);
assert(fromCards.length === sample.length, 'cards without comment still parse all entries');
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

console.log('\n== type-filtered readable output (dirty apikey) ==');
// An API Key record that still carries stale account-type fields.
const dirty = api.normalize({ id: 'id-dirty', title: 'DeepSeek', category: 'apikey',
  username: '1', password: '1', url: '1', provider: 'DeepSeek',
  apiKey: 'sk-test', endpoint: 'https://api.deepseek.com',
  createdAt: 1700000006000, updatedAt: 1700000007000 });
const dirtyMd = api.buildMarkdown([dirty]);
assert(dirtyMd.indexOf('| 类型 | API Key |') !== -1, 'apikey card shows 类型 = API Key');
assert(dirtyMd.indexOf('| 用户名 |') === -1, 'apikey card hides stale 用户名');
assert(dirtyMd.indexOf('| 密码 |') === -1, 'apikey card hides stale 密码');
assert(dirtyMd.indexOf('| 网址 |') === -1, 'apikey card hides stale 网址');
assert(dirtyMd.indexOf('| 服务商 | DeepSeek |') !== -1, 'apikey card shows 服务商');
// Comment still holds the full data -> lossless import.
eqEntries(api.parseMarkdown(dirtyMd), [dirty], 'apikey dirty md (comment lossless)');
const dirtyCsv = api.buildCsv([dirty]);
const csvHeader = dirtyCsv.replace(/^\uFEFF/, '').split('\r\n')[0].split(',');
const csvRow = dirtyCsv.replace(/^\uFEFF/, '').split('\r\n')[1].split(',');
const col = (name) => csvRow[csvHeader.indexOf(name)];
assert(col('用户名') === '' && col('密码') === '' && col('网址') === '', 'apikey CSV blanks stale account columns');
assert(col('服务商') === 'DeepSeek' && col('API Key') === 'sk-test', 'apikey CSV keeps real fields');

console.log('\n== import sanitizes dirty apikey (core fix) ==');
// A full JSON backup with a stale-field apikey: importing must strip them.
const dirtyBackup = JSON.stringify({ format: 'dsh-credential-vault-backup', version: 1,
  app: 'dsh-credential-vault', entries: [dirty] });
const imported = api.parseBackup(dirtyBackup);
assert(imported[0].username === undefined && imported[0].password === undefined && imported[0].url === undefined,
  'import strips stale username/password/url from apikey');
assert(imported[0].provider === 'DeepSeek' && imported[0].apiKey === 'sk-test',
  'import keeps real apikey fields');
// Importing a dirty CSV / Markdown must also come back clean.
const importedCsv = api.parseCsv(dirtyCsv);
assert(importedCsv[0].username === undefined && importedCsv[0].password === undefined && importedCsv[0].url === undefined,
  'CSV import strips stale account fields');
const importedMd = api.parseMarkdown(dirtyMd);
assert(importedMd[0].username === undefined && importedMd[0].password === undefined && importedMd[0].url === undefined,
  'Markdown import strips stale account fields');
// And normalize() itself (used when loading from localStorage) cleans stale fields.
assert(api.normalize(dirty).username === undefined, 'normalize() strips stale fields on load');

console.log('\n== Secret key category (密钥) ==');
const sk = api.normalize(sample[5]);
assert(sk.keyName === 'webhook-secret' && sk.keyValue === 'whsec-abc123-XYZ', 'secretKey keeps its own fields');
assert(sk.username === undefined && sk.password === undefined && sk.apiKey === undefined, 'secretKey strips unrelated fields');
const skMd = api.buildMarkdown([sk]);
assert(skMd.indexOf('| 类型 | 密钥 |') !== -1, 'secretKey card shows 类型 = 密钥');
assert(skMd.indexOf('| 密钥名称 | webhook-secret |') !== -1, 'secretKey card shows 密钥名称');
assert(skMd.indexOf('| 密钥值 | whsec-abc123-XYZ |') !== -1, 'secretKey card shows 密钥值');
eqEntries(api.parseMarkdown(skMd), [sk], 'secretKey markdown round-trip');
const skCsv = api.buildCsv([sk]);
assert(skCsv.indexOf('密钥名称') !== -1 && skCsv.indexOf('密钥值') !== -1, 'secretKey CSV has Chinese headers');
assert(skCsv.indexOf('密钥名称') < skCsv.indexOf('ID'), 'secretKey CSV keeps technical columns last');
eqEntries(api.parseCsv(skCsv), [sk], 'secretKey CSV round-trip');
eqEntries(api.parseBackup(JSON.stringify(api.buildBackup([sk]))), [sk], 'secretKey JSON round-trip');
assert(api.FIELD_LABELS.keyName === '密钥名称' && api.FIELD_LABELS.keyValue === '密钥值', 'FIELD_LABELS has secretKey fields');

console.log('\n== Linked credentials (关联凭据) ==');
const acct = api.normalize(sample[0]);
assert(Array.isArray(acct.links) && acct.links.length === 2, 'account keeps links array');
assert(acct.links[0] === 'id-2' && acct.links[1] === 'id-6', 'links keep exact IDs');
const allCsv = api.buildCsv(normalized);
assert(allCsv.indexOf('OpenAI | API(id-2)') !== -1, 'CSV shows linked credential titles');
eqEntries(api.parseCsv(allCsv), normalized, 'csv round-trip with links');
const allMd = api.buildMarkdown(normalized);
eqEntries(api.parseMarkdown(allMd), normalized, 'markdown round-trip with links');
const allStripped = allMd.split('\n').filter((l) => l.indexOf('<!-- cv:') === -1).join('\n');
const fromCardsLinks = api.parseMarkdown(allStripped);
assert(Array.isArray(fromCardsLinks[0].links) && fromCardsLinks[0].links.indexOf('id-6') >= 0, 'hand-edited card recovers link IDs');
const legacyLabel = api.parseCsv('\uFEFF标题,类型\n密钥测试,通用密钥');
assert(legacyLabel[0].category === 'secretKey', 'legacy 通用密钥 label still maps to secretKey');

console.log('\n== Accessible plugins (可访问插件) ==');
const granted = api.normalize(sample[0]);
assert(Array.isArray(granted.accessPlugins) && granted.accessPlugins.length === 1, 'account keeps accessPlugins array');
assert(granted.accessPlugins[0] === 'dsh-mail', 'accessPlugins keeps the exact plugin id');
const noGrant = api.normalize({ id: 'id-nogrant', title: '私有账号', category: 'account',
  username: 'x@example.com', password: 'pw', createdAt: 1700000012000, updatedAt: 1700000013000 });
assert(noGrant.accessPlugins === undefined, 'entry without a grant carries no accessPlugins');
const grantedCsv = api.buildCsv([granted]);
assert(grantedCsv.indexOf('可访问插件') !== -1, 'CSV has the 可访问插件 header');
assert(grantedCsv.indexOf('邮箱 (dsh-mail)') !== -1, 'CSV shows a friendly plugin name');
eqEntries(api.parseCsv(grantedCsv), [granted], 'csv round-trip with accessPlugins');
const grantedMd = api.buildMarkdown([granted]);
assert(grantedMd.indexOf('| 可访问插件 | 邮箱 (dsh-mail) |') !== -1, 'markdown card shows 可访问插件');
eqEntries(api.parseMarkdown(grantedMd), [granted], 'markdown round-trip with accessPlugins');
const grantedStripped = grantedMd.split('\n').filter((l) => l.indexOf('<!-- cv:') === -1).join('\n');
const fromCardsAccess = api.parseMarkdown(grantedStripped);
assert(Array.isArray(fromCardsAccess[0].accessPlugins) && fromCardsAccess[0].accessPlugins[0] === 'dsh-mail',
  'hand-edited card recovers the plugin id');
eqEntries(api.parseBackup(JSON.stringify(api.buildBackup([granted]))), [granted], 'json round-trip with accessPlugins');

console.log('\n== WeChat categories round-trip ==');
const wxMp = api.normalize(sample[3]);
const wxMini = api.normalize(sample[4]);
assert(wxMp.appSecret === 'mp-secret-abc' && wxMp.token === 'mp-token-xyz', 'wechatMp keeps its secret fields');
assert(wxMini.uploadKey && wxMini.uploadKey.indexOf('PRIVATE KEY') !== -1, 'wechatMini keeps upload key');
assert(wxMp.username === undefined && wxMini.apiKey === undefined, 'wechat types strip unrelated stale fields');
const wxCsv = api.buildCsv([wxMp, wxMini]);
const wxCsvHeader = wxCsv.replace(/^\uFEFF/, '').split('\r\n')[0].split(',');
const wxCsvRowMp = wxCsv.replace(/^\uFEFF/, '').split('\r\n')[1].split(',');
const wxCol = (row, name) => row[wxCsvHeader.indexOf(name)];
assert(wxCol(wxCsvRowMp, 'AppID') === 'wx1234567890abcdef', 'wechatMp CSV shows AppID');
assert(wxCol(wxCsvRowMp, 'AppSecret') === 'mp-secret-abc', 'wechatMp CSV shows AppSecret');
assert(wxCol(wxCsvRowMp, '用户名') === '' && wxCol(wxCsvRowMp, '密码') === '', 'wechatMp CSV blanks account columns');
eqEntries(api.parseCsv(wxCsv), [wxMp, wxMini], 'wechat CSV round-trip');
const wxMd = api.buildMarkdown([wxMp, wxMini]);
assert(wxMd.indexOf('| 类型 | 微信公众号 |') !== -1, 'wechatMp card label correct');
assert(wxMd.indexOf('| 类型 | 微信小程序 |') !== -1, 'wechatMini card label correct');
eqEntries(api.parseMarkdown(wxMd), [wxMp, wxMini], 'wechat Markdown round-trip');
eqEntries(api.parseBackup(JSON.stringify(api.buildBackup([wxMp, wxMini]))), [wxMp, wxMini], 'wechat JSON round-trip');

console.log('\n== empty / invalid ==');
let threwParse = false;
try { api.parseImport('garbage nonsense'); } catch (e) { threwParse = e.message === 'parse'; }
assert(threwParse, 'garbage throws parse error');

console.log('\n== encrypted backup round-trip ==');
// The encryption helpers are async (Web Crypto derived key).
const password = 'correct horse battery staple';
const envelope = await api.encryptBackup(normalized, password);
assert(envelope && envelope.format === api.ENC_FORMAT, 'encrypted envelope has expected format');
assert(typeof envelope.cipherText === 'string' && envelope.cipherText.length > 0, 'cipherText present');
assert(JSON.stringify(envelope).indexOf('p@ss') === -1, 'plaintext secret NOT present in encrypted file');
assert(api.detectEncrypted(JSON.stringify(envelope)) !== null, 'encrypted file auto-detected');
let parseEncryptedSignalled = false;
try { api.parseBackup(JSON.stringify(envelope)); } catch (e) { parseEncryptedSignalled = e.message === 'ENCRYPTED'; }
assert(parseEncryptedSignalled, 'parseBackup signals ENCRYPTED for encrypted files');
const decrypted = await api.decryptBackup(envelope, password);
eqEntries(decrypted, normalized, 'encrypted round-trip');
let wrongPw = false;
try { await api.decryptBackup(envelope, 'wrong password'); } catch (e) { wrongPw = e.message === 'WRONG_PASSWORD'; }
assert(wrongPw, 'wrong password rejected with WRONG_PASSWORD');

console.log('\n' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
process.exit(failures === 0 ? 0 : 1);
