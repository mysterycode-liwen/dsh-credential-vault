/*
 * vault-bridge-client.js — reusable client module for the DSH credential vault bridge
 * ------------------------------------------------------------------------------
 * Copy this whole file's contents into your plugin's client.js (inside
 * factory(require)), or load it through your plugin's build step. ZERO deps:
 * it only uses window.crypto.subtle, btoa/atob and TextEncoder/TextDecoder.
 *
 * WHY THIS EXISTS
 *   The vault keeps real secrets in its own browser localStorage. The Harness
 *   Host process only ever sees metadata (secrets are masked), so a plugin that
 *   needs a real value (e.g. a mail app password) must talk to the vault's
 *   browser-side bridge. This module does that.
 *
 *   All payloads are encrypted with an ECDH (P-256) + AES-GCM session:
 *     1. client.query(...)  -> bridge.hello() = vault ephemeral public key + id
 *     2. client generates its own ephemeral key pair, derives the shared AES key
 *     3. client seals the query, vault decrypts / reads secrets / seals result
 *     4. client opens the result with the same derived key.
 *   No plaintext and no long-lived key ever crosses the bridge. If the vault is
 *   not installed, isAvailable() is false and query() rejects NOT_INSTALLED —
 *   gate your UI on isAvailable() so the feature silently disappears.
 *
 * SECURITY NOTE
 *   The bridge is a same-document JS object. ECDH stops passive observers and
 *   other plugins from reading the payload, but a hostile script in the same
 *   document could still call the bridge as if it were your plugin. The vault
 *   never auto-authorises: each session is one-time use and expires in 60s.
 *
 * USAGE
 *   const vault = createVaultV1Client({ callerId: 'my-plugin-id' }); // REQUIRED for scoped reads
 *   if (vault.isAvailable()) {
 *     const entries = await vault.query({ category: 'account', title: 'qq' });
 *     const secret = vault.secretOf(entries[0]);  // real password / key value
 *   }
 *
 * Node (tests): also exported via module.exports when available.
 */

function createVaultV1Client(options) {
  options = options || {};
  // Identity declared by the calling plugin. The vault only returns credentials
  // whose "accessible plugins" list includes this id. Without it, nothing is returned.
  var callerId = typeof options.callerId === 'string' && options.callerId.trim() ? options.callerId.trim() : '';
  var win = options.window || (typeof window !== 'undefined' ? window : null);
  var BRIDGE_KEY = '@mysterycode-liwen/dsh-credential-vault/bridge/v1';

  function cryptoObj() {
    return (win && win.crypto) || (typeof globalThis !== 'undefined' && globalThis.crypto) || null;
  }
  function subtle() {
    var c = cryptoObj();
    return c && c.subtle ? c.subtle : null;
  }
  function randomFill(bytes) {
    var c = cryptoObj();
    if (!c || !c.getRandomValues) throw new Error('NO_CRYPTO');
    c.getRandomValues(bytes);
    return bytes;
  }
  function toB64u(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    var btoaFn = options.btoa || (typeof btoa === 'function' ? btoa : (win && win.btoa));
    return btoaFn(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64u(str) {
    var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var atobFn = options.atob || (typeof atob === 'function' ? atob : (win && win.atob));
    var bin = atobFn(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function enc(str) { return new TextEncoder().encode(str); }
  function dec(bytes) { return new TextDecoder().decode(bytes); }

  function bridge() {
    if (!win || !win[BRIDGE_KEY]) return null;
    var b = win[BRIDGE_KEY];
    return b && b.version === 1 && typeof b.hello === 'function' && typeof b.query === 'function' ? b : null;
  }

  function generatePair(s) {
    return s.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  }
  function deriveKey(s, priv, peerJwk) {
    return s.importKey('jwk', peerJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
      .then(function (pub) { return s.deriveBits({ name: 'ECDH', public: pub }, priv, 256); })
      .then(function (bits) { return s.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); });
  }
  function seal(s, key, obj) {
    var iv = randomFill(new Uint8Array(12));
    return s.encrypt({ name: 'AES-GCM', iv: iv }, key, enc(JSON.stringify(obj)))
      .then(function (ct) { return { iv: toB64u(iv), ciphertext: toB64u(new Uint8Array(ct)) }; });
  }
  function open(s, key, payload) {
    if (!payload || typeof payload.iv !== 'string' || typeof payload.ciphertext !== 'string') {
      return Promise.reject(new Error('BAD_CIPHERTEXT'));
    }
    return s.decrypt({ name: 'AES-GCM', iv: fromB64u(payload.iv) }, key, fromB64u(payload.ciphertext))
      .then(function (plain) { return JSON.parse(dec(new Uint8Array(plain))); });
  }

  function isAvailable() { return !!bridge(); }

  function query(criteria) {
    criteria = criteria || {};
    var b = bridge();
    if (!b) return Promise.reject(new Error('NOT_INSTALLED'));
    var s = subtle();
    if (!s) return Promise.reject(new Error('NO_CRYPTO'));
    var vaultPub, sessionId, priv, aes;
    return Promise.resolve(b.hello())
      .then(function (hello) {
        if (!hello || !hello.sessionId || !hello.publicKeyJwk) throw new Error('BAD_HELLO');
        sessionId = hello.sessionId;
        vaultPub = hello.publicKeyJwk;
        return generatePair(s);
      })
      .then(function (kp) {
        priv = kp.privateKey;
        return s.exportKey('jwk', kp.publicKey);
      })
      .then(function (pubJwk) {
        return deriveKey(s, priv, vaultPub).then(function (key) {
          aes = key;
          return seal(s, aes, {
            category: criteria.category || 'all',
            title: criteria.title || '',
            limit: criteria.limit || 100,
            callerId: callerId
          }).then(function (sealed) {
            return b.query({
              sessionId: sessionId,
              publicKeyJwk: pubJwk,
              iv: sealed.iv,
              ciphertext: sealed.ciphertext
            });
          });
        });
      })
      .then(function (result) {
        if (!result) throw new Error('NO_RESPONSE');
        if (result.error) throw new Error(result.error);
        return open(s, aes, result);
      })
      .then(function (plain) { return plain && Array.isArray(plain.entries) ? plain.entries : []; });
  }

  function secretOf(entry) {
    if (!entry) return '';
    var keys = ['password', 'keyValue', 'apiKey', 'content', 'appSecret', 'token', 'encodingAesKey', 'uploadKey'];
    for (var i = 0; i < keys.length; i++) {
      if (typeof entry[keys[i]] === 'string' && entry[keys[i]]) return entry[keys[i]];
    }
    return '';
  }

  return {
    version: 1,
    isAvailable: isAvailable,
    query: query,
    secretOf: secretOf,
    _debug: { toB64u: toB64u, fromB64u: fromB64u, deriveKey: deriveKey, seal: seal, open: open }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createVaultV1Client: createVaultV1Client };
}
