// Test the cross-plugin bridge identity scoping:
//   - a credential without an "accessible plugins" grant is invisible
//   - a credential granted to the calling plugin id is returned
//   - a credential granted to another plugin is invisible
//   - an anonymous caller (no callerId) gets nothing
import fs from 'fs';
import { webcrypto } from 'node:crypto';

const src = fs.readFileSync('client.js', 'utf8');
// The bridge sits between normalize() and the security-store section; take the
// whole slice so normalize/loadEntries/sanitize are in scope for real.
const a = src.indexOf('    function normalize(e) {');
const b = src.indexOf('    // ---- Access-password security store', a);
if (a < 0 || b < 0) throw new Error('markers not found');
const code = src.slice(a, b);

// Mock localStorage with three entries: one granted to dsh-mail, one to another
// plugin, one with no grant at all.
const entries = [
  { id: 'id-mail', title: 'QQ 邮箱', category: 'account', username: 'me@qq.com',
    password: 'mail-secret', accessPlugins: ['dsh-mail'], createdAt: 1, updatedAt: 2 },
  { id: 'id-other', title: '公司系统', category: 'account', username: 'me@corp.com',
    password: 'corp-secret', accessPlugins: ['other-plugin'], createdAt: 3, updatedAt: 4 },
  { id: 'id-private', title: '私人账号', category: 'account', username: 'me@private.com',
    password: 'private-secret', createdAt: 5, updatedAt: 6 },
];
const localStorage = {
  getItem() { return JSON.stringify(entries); },
  setItem() {},
};

const factory = new Function('window', 'STORAGE_KEY', 'STORAGE_KEY_LEGACY', `
  ${code}
  return { newBridge, registerBridge, BRIDGE_KEY };
`);
const win = { crypto: webcrypto, localStorage, TextEncoder, TextDecoder, btoa, atob };
// STORAGE_KEY lives in the file header, outside the slice we evaluate.
const api = factory(win, '@local/dsh-credential-vault:entries:v1', '@local/credential-vault:entries:v1');

// The bridge is registered on window, exactly like the real plugin does.
api.registerBridge();
const bridge = win[api.BRIDGE_KEY];
if (!bridge) throw new Error('bridge not registered');

const template = fs.readFileSync('bridge/vault-bridge-client.js', 'utf8');
const createClient = new Function('module', `
  ${template}
  return createVaultV1Client;
`)({ exports: {} });

let failures = 0;
function assert(cond, msg) {
  if (cond) console.log('  ✓ ' + msg);
  else { console.log('  ✗ ' + msg); failures++; }
}

async function main() {
  console.log('== bridge identity scoping ==');

  // 1. The mail plugin (callerId dsh-mail) sees only the credential granted to it.
  const mail = createClient({ callerId: 'dsh-mail', window: win });
  assert(mail.isAvailable(), 'bridge is available to a consumer');
  const mailRows = await mail.query({ category: 'account', limit: 100 });
  assert(mailRows.length === 1, 'mail plugin receives exactly one credential');
  assert(mailRows[0] && mailRows[0].id === 'id-mail', 'mail plugin receives the granted credential');
  assert(mailRows[0] && mailRows[0].password === 'mail-secret', 'granted credential carries the real secret');

  // 2. A different plugin identity sees only its own credential.
  const other = createClient({ callerId: 'other-plugin', window: win });
  const otherRows = await other.query({ category: 'account', limit: 100 });
  assert(otherRows.length === 1 && otherRows[0].id === 'id-other', 'other plugin sees only its own credential');

  // 3. An unrelated plugin sees nothing at all.
  const stranger = createClient({ callerId: 'stranger-plugin', window: win });
  const strangerRows = await stranger.query({ category: 'account', limit: 100 });
  assert(strangerRows.length === 0, 'unrelated plugin receives nothing');

  // 4. An anonymous caller (no callerId) receives nothing.
  const anon = createClient({ window: win });
  const anonRows = await anon.query({ category: 'account', limit: 100 });
  assert(anonRows.length === 0, 'anonymous caller receives nothing');

  // 5. The unscoped category filter no longer leaks: "all" still respects grants.
  const allRows = await createClient({ callerId: 'dsh-mail', window: win }).query({ limit: 100 });
  assert(allRows.length === 1 && allRows[0].id === 'id-mail', 'unfiltered query still respects per-credential grants');

  // 6. The package-style alias resolves to the same plugin identity.
  const alias = createClient({ callerId: '@mysterycode-liwen/dsh-mail', window: win });
  const aliasRows = await alias.query({ category: 'account', limit: 100 });
  assert(aliasRows.length === 1 && aliasRows[0].id === 'id-mail', 'package-name alias matches the short plugin id');

  // 7. When the vault plugin is absent the consumer degrades gracefully.
  const emptyWin = { crypto: webcrypto, localStorage: { getItem() { return null; }, setItem() {} },
    TextEncoder, TextDecoder, btoa, atob };
  const noVault = createClient({ callerId: 'dsh-mail', window: emptyWin });
  assert(!noVault.isAvailable(), 'without the vault the bridge is unavailable');
  let rejected = false;
  try { await noVault.query({ category: 'account' }); } catch (e) { rejected = e.message === 'NOT_INSTALLED'; }
  assert(rejected, 'without the vault the query rejects NOT_INSTALLED');

  console.log('\n' + (failures === 0 ? 'ALL PASS' : failures + ' FAILURES'));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
