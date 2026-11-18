/**
 * Host half of the credential-vault bundle.
 *
 * The browser (client.js) owns the vault data in localStorage. This half
 * exposes it to the Harness through two things:
 *   1. a loopback-only HTTP surface the browser POSTs its entries to, and
 *   2. an agent tool (`credential_vault_read`) the model calls to read them.
 *
 * The in-memory snapshot is intentionally tiny: the browser re-syncs on every
 * change and on mount, so it is always the source of truth; the Host just
 * mirrors the last payload.
 *
 * @module credential-vault
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** Cordis plugin name. */
export const name = 'credential-vault'

/** The web server is the only hard dependency. */
export const inject = ['webServer']

/** Route prefix owned by this plugin. */
const PREFIX = '/credential-vault'

/** Cap the synced payload so a stray client cannot blow up the Host. Raised for large vaults. */
const MAX_BODY_BYTES = 16 * 1024 * 1024

/** Max entries mirrored from the browser; beyond this the tool output would be unwieldy. */
const MAX_ENTRIES = 20000

/** Fields that hold secrets; masked by default in tool output. */
const SECRET_FIELDS = ['password', 'apiKey', 'content']
const MASK = '••••••••'

/** Pagination defaults / limits for the read tool. */
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 200

/** Fields kept in the compact "summary" projection. */
const SUMMARY_FIELDS = ['id', 'title', 'category', 'username', 'provider', 'expiry', 'updatedAt']

/** Current plugin version. Keep in sync with package.json when releasing. */
const CURRENT_VERSION = '1.1.1'

/** Where update checks read the latest published version from (GitHub Releases latest). */
const RELEASES_API = 'https://api.github.com/repos/mysterycode-liwen/dsh-credential-vault/releases/latest'
const RELEASES_URL = 'https://github.com/mysterycode-liwen/dsh-credential-vault/releases/latest'
const UPDATE_CHECK_TIMEOUT_MS = 8000
const UPDATE_CACHE_MS = 10 * 60 * 1000
let updateCache = { at: 0, result: null }

/** Last snapshot received from the browser. */
let snapshot = { entries: [], updatedAt: 0 }

/** Resolve DSH home the same way the Harness does: config > $DSH_HOME > ~/.dsh. */
function resolveHome(configured, env) {
  const fromEnv = typeof env.DSH_HOME === 'string' && env.DSH_HOME.trim() !== '' ? env.DSH_HOME : undefined
  const raw = configured !== undefined && configured !== null && configured !== '' ? configured : (fromEnv || join(homedir(), '.dsh'))
  const expanded = typeof raw === 'string' && raw === '~' ? homedir()
    : typeof raw === 'string' && (raw.startsWith('~/') || raw.startsWith('~\\')) ? join(homedir(), raw.slice(2))
      : raw
  return resolve(expanded)
}

/** Durable store for the mirrored vault, so the tool still works after restart. */
function createStore(home) {
  const dir = join(home, 'credential-vault')
  const file = join(dir, 'vault.json')
  return {
    async restore() {
      try {
        const parsed = JSON.parse(await readFile(file, 'utf8'))
        if (parsed && Array.isArray(parsed.entries)) {
          snapshot = { entries: parsed.entries, updatedAt: Number(parsed.updatedAt) || 0 }
        }
      } catch {
        // No file yet, or unreadable: start with an empty snapshot.
      }
    },
    async persist(next) {
      try {
        await mkdir(dir, { recursive: true })
        const tmp = file + '.tmp'
        await writeFile(tmp, JSON.stringify(next), 'utf8')
        await rename(tmp, file)
      } catch {
        // Persistence is best-effort; the in-memory snapshot still works.
      }
    },
  }
}

// --- tiny HTTP helpers (self-contained so the bundle stays 7 files) --------

function isLoopback(req) {
  const address = req && req.socket ? req.socket.remoteAddress : undefined
  if (address === undefined) return true
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1' || address.startsWith('127.')
}

function isSameOrigin(req) {
  const origin = req && req.headers ? req.headers.origin : undefined
  if (typeof origin !== 'string' || origin === '') return true
  const host = req && req.headers ? req.headers.host : undefined
  if (typeof host !== 'string' || host === '') return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function sendJson(res, status, payload) {
  if (!res || res.writableEnded || res.destroyed) return
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

function fail(res, status, code, message) {
  sendJson(res, status, { ok: false, error: { code, ...(message === undefined ? {} : { message }) } })
}

function readJson(req, cap = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > cap) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid json'))
      }
    })
    req.on('error', reject)
  })
}

// --- update check helpers --------------------------------------------------

/** Parse a semver-ish tag into comparable parts. Returns null when unparseable. */
function parseSemver(value) {
  if (typeof value !== 'string') return null
  const m = value.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/)
  if (!m) return null
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), prerelease: m[4] || '' }
}

/** Compare two parsed semvers: -1 (left older), 0 (equal), 1 (left newer). */
function compareSemver(l, r) {
  const parts = ['major', 'minor', 'patch']
  for (const key of parts) {
    if (l[key] !== r[key]) return l[key] < r[key] ? -1 : 1
  }
  if (!l.prerelease && !r.prerelease) return 0
  if (!l.prerelease) return 1
  if (!r.prerelease) return -1
  return l.prerelease < r.prerelease ? -1 : l.prerelease > r.prerelease ? 1 : 0
}

/** Fetch the latest Release tag from GitHub, with a timeout and short cache. */
async function checkForUpdate() {
  if (updateCache.result && Date.now() - updateCache.at < UPDATE_CACHE_MS) {
    return Object.assign({}, updateCache.result, { cached: true })
  }
  const fetchImpl = typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined
  if (!fetchImpl) throw new Error('fetch is not available on this Node runtime')
  let signal
  try { signal = AbortSignal.timeout(UPDATE_CHECK_TIMEOUT_MS) } catch { /* no timeout support */ }
  const response = await fetchImpl(RELEASES_API, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-credential-vault-update-check' },
    ...(signal ? { signal } : {}),
  })
  if (!response.ok) throw new Error('GitHub API returned ' + response.status)
  const body = await response.json()
  const tag = body && typeof body.tag_name === 'string' ? body.tag_name : ''
  const latest = parseSemver(tag)
  if (!latest) throw new Error('Latest release tag is not a valid version: ' + tag)
  const current = parseSemver(CURRENT_VERSION) || { major: 0, minor: 0, patch: 0, prerelease: '' }
  const result = {
    ok: true,
    currentVersion: CURRENT_VERSION,
    latestVersion: tag.replace(/^v/i, ''),
    updateAvailable: compareSemver(current, latest) < 0,
    releaseUrl: RELEASES_URL,
    checkedAt: new Date().toISOString(),
    cached: false,
  }
  updateCache = { at: Date.now(), result }
  return result
}

// --- HTTP surface ----------------------------------------------------------

async function handle(req, res, store) {
  try {
    if (!isLoopback(req)) return fail(res, 403, 'NOT_LOOPBACK')
    if (!isSameOrigin(req)) return fail(res, 403, 'BAD_ORIGIN')

    let pathname = (req.url || '/').split('?')[0]
    if (pathname.startsWith(PREFIX)) pathname = pathname.slice(PREFIX.length) || '/'
    const method = (req.method || 'GET').toUpperCase()

    // Browser -> Host: replace the snapshot with the browser's current vault.
    if (pathname === '/entries' && method === 'POST') {
      let body
      try {
        body = await readJson(req)
      } catch (error) {
        return fail(res, 400, 'BAD_JSON', String(error && error.message ? error.message : error))
      }
      const list = body && Array.isArray(body.entries) ? body.entries : null
      if (!list) return fail(res, 400, 'BAD_ENTRIES', 'expected { entries: [] }')
      // Keep only plain objects, and cap the count defensively.
      const entries = list.filter((e) => e !== null && typeof e === 'object' && !Array.isArray(e)).slice(0, MAX_ENTRIES)
      snapshot = { entries, updatedAt: Date.now() }
      await store.persist(snapshot)
      return sendJson(res, 200, { ok: true, count: entries.length, truncated: list.length > entries.length })
    }

    // Debug / inspection: return a bounded page of the current snapshot.
    if (pathname === '/entries' && method === 'GET') {
      const url = new URL(req.url || '/', 'http://localhost')
      const limit = Math.max(1, Math.min(MAX_LIMIT, Number(url.searchParams.get('limit')) || DEFAULT_LIMIT))
      const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)
      const page = snapshot.entries.slice(offset, offset + limit)
      return sendJson(res, 200, {
        ok: true,
        total: snapshot.entries.length,
        returned: page.length,
        offset,
        limit,
        entries: page,
        updatedAt: snapshot.updatedAt,
      })
    }

    // Check GitHub Releases latest for a newer plugin version.
    if (pathname === '/update-check' && method === 'GET') {
      try {
        return sendJson(res, 200, await checkForUpdate())
      } catch (error) {
        return sendJson(res, 200, {
          ok: false,
          currentVersion: CURRENT_VERSION,
          error: String(error && error.message ? error.message : error),
          checkedAt: new Date().toISOString(),
        })
      }
    }

    return fail(res, 404, 'NOT_FOUND')
  } catch (error) {
    return fail(res, 500, 'INTERNAL', String(error && error.message ? error.message : error))
  }
}

// --- tool projection helpers ----------------------------------------------

function projectEntry(entry, revealSecrets, mode) {
  const keys = mode === 'summary' ? SUMMARY_FIELDS : Object.keys(entry)
  const out = {}
  for (const key of keys) {
    const value = entry[key]
    if (value === null || value === undefined || value === '') continue
    if (SECRET_FIELDS.includes(key)) {
      // Secrets never appear in summary mode, whatever revealSecrets says.
      out[key] = (revealSecrets && mode !== 'summary') ? value : MASK
    } else {
      out[key] = value
    }
  }
  return out
}

function matches(entry, query, category) {
  if (category && category !== 'all' && entry.category !== category) return false
  if (!query) return true
  const q = query.toLowerCase()
  const haystack = [entry.title, entry.username, entry.provider, entry.url, entry.endpoint, entry.notes]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

/**
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx, rawConfig) {
  const config = rawConfig !== null && typeof rawConfig === 'object' ? rawConfig : {}
  const store = createStore(resolveHome(config.dshHome, process.env))
  void store.restore()

  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: PREFIX,
      handler: (req, res) => handle(req, res, store),
    })
    return () => {
      if (typeof dispose === 'function') dispose()
    }
  })

  // Tools / systemPrompt are optional services: read them defensively so the
  // plugin still loads where they are unavailable.
  const tools = typeof ctx.get === 'function' ? ctx.get('tools') : undefined
  if (tools !== undefined && tools !== null && typeof tools.register === 'function') {
    ctx.effect(() => {
      const dispose = tools.register(
        {
          name: 'credential_vault_read',
          description:
            'Read the contents of the user\'s local credential vault (accounts, passwords, API keys, other secrets stored in the sidebar vault panel). Results are paginated: use limit/offset to page through large vaults, or mode="summary" for a lightweight id/title/category list first. By default secret values are masked; set revealSecrets to true (with mode="full") to include the actual passwords / API keys. Use this when the user asks you to look up, list, or use a credential saved in the vault.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Optional text to filter by title, account, provider, URL or notes (case-insensitive substring).',
              },
              category: {
                type: 'string',
                enum: ['all', 'account', 'apikey', 'other'],
                description: 'Only return entries of this category. Defaults to all.',
              },
              mode: {
                type: 'string',
                enum: ['summary', 'full'],
                description: 'summary = only id/title/category/account/provider/expiry (lightweight, recommended for browsing); full = all fields with secrets masked unless revealSecrets. Defaults to full.',
              },
              limit: {
                type: 'number',
                description: 'Page size, 1-200. Defaults to 20. Use with offset to page through large vaults.',
              },
              offset: {
                type: 'number',
                description: 'How many matching entries to skip. Defaults to 0. Increase by limit to get the next page.',
              },
              revealSecrets: {
                type: 'boolean',
                description: 'If true (and mode="full"), include the real password / API key / secret values instead of a masked placeholder. Defaults to false. Ignored in summary mode.',
              },
            },
            additionalProperties: false,
          },
          output: {
            schema: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                returned: { type: 'number' },
                hasMore: { type: 'boolean' },
                entries: { type: 'array', items: { type: 'object' } },
              },
              additionalProperties: true,
            },
            render: () => [{ type: 'text', text: 'credential_vault_read' }],
          },
          async execute(args) {
            const a = args !== null && typeof args === 'object' ? args : {}
            const query = typeof a.query === 'string' ? a.query : ''
            const category = typeof a.category === 'string' ? a.category : 'all'
            const mode = a.mode === 'summary' ? 'summary' : 'full'
            const revealSecrets = a.revealSecrets === true
            const limit = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(a.limit) ? Math.floor(a.limit) : DEFAULT_LIMIT))
            const offset = Math.max(0, Number.isFinite(a.offset) ? Math.floor(a.offset) : 0)
            const all = Array.isArray(snapshot.entries) ? snapshot.entries : []
            const filtered = all.filter((e) => matches(e, query, category))
            const page = filtered.slice(offset, offset + limit)
            return {
              total: filtered.length,
              returned: page.length,
              offset,
              limit,
              hasMore: offset + page.length < filtered.length,
              updatedAt: snapshot.updatedAt,
              entries: page.map((e) => projectEntry(e, revealSecrets, mode)),
            }
          },
        },
        {},
      )
      return typeof dispose === 'function' ? dispose : () => {}
    }, 'credential-vault-read-tool')
  }

  const systemPrompt = typeof ctx.get === 'function' ? ctx.get('systemPrompt') : undefined
  if (systemPrompt !== undefined && systemPrompt !== null && typeof systemPrompt.section === 'function') {
    ctx.effect(() => {
      systemPrompt.section({
        name: 'tool:credential-vault',
        order: 118,
        text:
          '凭据保险箱：用户把账号密码、API Key、恢复码等保存在侧边栏「凭据保险箱」里。需要查询这些凭据时用 credential_vault_read 工具（按 query / category 过滤；数据多时先用 mode="summary" 看标题清单，再用 limit/offset 翻页；默认隐藏密钥，mode="full" 且 revealSecrets:true 才返回明文）。',
      })
      return () => {}
    }, 'credential-vault-prompt')
  }
}
