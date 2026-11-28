/**
 * Host half of the dsh-credential-vault bundle.
 *
 * The browser (client.js) owns the vault data in localStorage. This half
 * exposes it to the Harness through two things:
 *   1. a loopback-only HTTP surface the browser POSTs its entries to, and
 *   2. an agent tool (`dsh_credential_vault_read`) the model calls to read them.
 *
 * SECURITY MODEL (hardened):
 *   - The browser sends a METADATA-ONLY envelope. Secret fields (password /
 *     apiKey / content) never reach this Host process; plaintext stays in the
 *     browser's localStorage. Even a malicious full payload is sanitized here.
 *   - Nothing is persisted to disk. The snapshot lives only in memory and is
 *     re-synced by the browser on mount / change, so a restart simply starts
 *     empty until the browser reconnects.
 *   - Every tool access is recorded in a bounded, in-memory audit log that
 *     contains no plaintext (GET /audit, same-origin + loopback only).
 *
 * @module dsh-credential-vault
 */

/** Cordis plugin name. */
export const name = 'dsh-credential-vault'

/** The web server is the only hard dependency. */
export const inject = ['webServer']

/** Route prefix owned by this plugin. */
const PREFIX = '/dsh-credential-vault'

/** Cap the synced payload so a stray client cannot blow up the Host. Raised for large vaults. */
const MAX_BODY_BYTES = 16 * 1024 * 1024

/** Max entries mirrored from the browser; beyond this the tool output would be unwieldy. */
const MAX_ENTRIES = 20000

/** Fields that hold secrets; masked by default in tool output. */
const SECRET_FIELDS = ['password', 'apiKey', 'content', 'appSecret', 'token', 'encodingAesKey', 'uploadKey', 'keyValue']
const MASK = '••••••••'

/** Pagination defaults / limits for the read tool. */
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 200

/** Fields kept in the compact "summary" projection. */
const SUMMARY_FIELDS = ['id', 'title', 'category', 'username', 'provider', 'expiry', 'updatedAt']

/** Current plugin version. Keep in sync with package.json when releasing. */
const CURRENT_VERSION = '1.5.3'

/** Where update checks read the latest published version from (GitHub Releases latest). */
const RELEASES_API = 'https://api.github.com/repos/mysterycode-liwen/dsh-credential-vault/releases/latest'
const RELEASES_URL = 'https://github.com/mysterycode-liwen/dsh-credential-vault/releases/latest'
const UPDATE_CHECK_TIMEOUT_MS = 8000
const UPDATE_CACHE_MS = 10 * 60 * 1000
let updateCache = { at: 0, result: null }

/** Last metadata-only snapshot received from the browser (never contains secrets). */
let snapshot = { entries: [], updatedAt: 0 }

/**
 * Fields mirrored from the browser. Everything else (especially SECRET_FIELDS)
 * is dropped, so the Host can never hold a plaintext password / key / body.
 */
const META_FIELDS = ['id', 'title', 'category', 'username', 'provider', 'keyName', 'url', 'endpoint', 'expiry',
  'appId', 'serverUrl', 'domains', 'notes', 'links', 'createdAt', 'updatedAt']

/**
 * Force every incoming entry into a metadata-only shape. Applied defensively on
 * POST /entries, so even a buggy or hostile client cannot smuggle a secret into
 * the Host, the tool output, or the audit log.
 */
function sanitizeEnvelope(entry) {
  const out = {}
  for (const key of META_FIELDS) {
    const value = entry[key]
    if (typeof value === 'string' || typeof value === 'number') out[key] = value
  }
  // Keep the masked placeholders so the UI shape stays stable for the model.
  for (const key of SECRET_FIELDS) {
    if (typeof entry[key] === 'string' && entry[key] !== '') out[key] = MASK
  }
  return out
}

// --- in-memory access audit (no plaintext, bounded) ------------------------

const MAX_AUDIT = 200
/** @type {{at:string, tool:string, action:string, entryId?:string, query?:string, count?:number}[]} */
const auditLog = []
function recordAudit(event) {
  auditLog.push(Object.assign({ at: new Date().toISOString() }, event))
  if (auditLog.length > MAX_AUDIT) auditLog.splice(0, auditLog.length - MAX_AUDIT)
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

async function handle(req, res) {
  try {
    if (!isLoopback(req)) return fail(res, 403, 'NOT_LOOPBACK')
    if (!isSameOrigin(req)) return fail(res, 403, 'BAD_ORIGIN')

    let pathname = (req.url || '/').split('?')[0]
    if (pathname.startsWith(PREFIX)) pathname = pathname.slice(PREFIX.length) || '/'
    const method = (req.method || 'GET').toUpperCase()

    // Browser -> Host: replace the snapshot with the browser's current vault.
    // Every entry is forced through sanitizeEnvelope(), so secrets never enter
    // this process even if the browser sends a full (legacy) payload.
    if (pathname === '/entries' && method === 'POST') {
      let body
      try {
        body = await readJson(req)
      } catch (error) {
        return fail(res, 400, 'BAD_JSON', String(error && error.message ? error.message : error))
      }
      const list = body && Array.isArray(body.entries) ? body.entries : null
      if (!list) return fail(res, 400, 'BAD_ENTRIES', 'expected { entries: [] }')
      // Keep only plain objects, cap the count, then strip all secret fields.
      const entries = list
        .filter((e) => e !== null && typeof e === 'object' && !Array.isArray(e))
        .slice(0, MAX_ENTRIES)
        .map(sanitizeEnvelope)
      snapshot = { entries, updatedAt: Date.now() }
      return sendJson(res, 200, { ok: true, count: entries.length, truncated: list.length > entries.length })
    }

    // Debug / inspection endpoint removed: it used to return a page of the raw
    // snapshot. It is not needed by the browser and only widened the read
    // surface. The dsh_credential_vault_read tool is the sanctioned read path.
    if (pathname === '/entries' && method === 'GET') {
      return fail(res, 404, 'NOT_FOUND')
    }

    // In-memory access audit (same-origin + loopback already enforced above).
    // Contains no plaintext — only tool names, actions, ids and counts.
    if (pathname === '/audit' && method === 'GET') {
      return sendJson(res, 200, { ok: true, total: auditLog.length, events: auditLog.slice() })
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

function projectEntry(entry, mode) {
  const keys = mode === 'summary' ? SUMMARY_FIELDS : Object.keys(entry)
  const out = {}
  for (const key of keys) {
    const value = entry[key]
    if (value === null || value === undefined || value === '') continue
    // Secret fields in the snapshot are already MASK placeholders (the Host
    // never receives plaintext). Guard here too, defense-in-depth.
    out[key] = SECRET_FIELDS.includes(key) ? MASK : value
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
export function apply(ctx) {
  ctx.effect(() => {
    const dispose = ctx.webServer.register({
      kind: 'prefix',
      path: PREFIX,
      handler: (req, res) => handle(req, res),
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
          name: 'dsh_credential_vault_read',
          description:
            'Read metadata about credentials in the user\'s local vault (accounts, API keys, other entries stored in the sidebar vault panel). Results are paginated: use limit/offset to page through large vaults, or mode="summary" for a lightweight id/title/category list first. Secret values (passwords / API keys / text bodies) are ALWAYS masked — plaintext never leaves the browser and cannot be returned by this tool; the revealSecrets parameter is accepted for compatibility but has no effect. Use this to discover which credentials exist; to actually use a secret, ask the user to open the vault panel and copy it.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Optional text to filter by title, account, provider, URL or notes (case-insensitive substring).',
              },
              category: {
                type: 'string',
                enum: ['all', 'account', 'apikey', 'secretKey', 'other', 'wechatMp', 'wechatMini'],
                description: 'Only return entries of this category. Defaults to all.',
              },
              mode: {
                type: 'string',
                enum: ['summary', 'full'],
                description: 'summary = only id/title/category/account/provider/expiry (lightweight, recommended for browsing); full = all metadata fields (secrets always masked). Defaults to full.',
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
                description: 'Deprecated / no-op. Secret values are always masked and are never returned by this tool. Accepted only so older tool calls keep working.',
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
            render: () => [{ type: 'text', text: 'dsh_credential_vault_read' }],
          },
          async execute(args) {
            const a = args !== null && typeof args === 'object' ? args : {}
            const query = typeof a.query === 'string' ? a.query : ''
            const category = typeof a.category === 'string' ? a.category : 'all'
            const mode = a.mode === 'summary' ? 'summary' : 'full'
            // revealSecrets is intentionally ignored: plaintext never reaches
            // the Host, so there is nothing to reveal. Kept for compatibility.
            const limit = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(a.limit) ? Math.floor(a.limit) : DEFAULT_LIMIT))
            const offset = Math.max(0, Number.isFinite(a.offset) ? Math.floor(a.offset) : 0)
            const all = Array.isArray(snapshot.entries) ? snapshot.entries : []
            const filtered = all.filter((e) => matches(e, query, category))
            const page = filtered.slice(offset, offset + limit)
            recordAudit({ tool: 'dsh_credential_vault_read', action: 'read', category, query: query || undefined, count: page.length })
            return {
              total: filtered.length,
              returned: page.length,
              offset,
              limit,
              hasMore: offset + page.length < filtered.length,
              updatedAt: snapshot.updatedAt,
              entries: page.map((e) => projectEntry(e, mode)),
            }
          },
        },
        {},
      )
      return typeof dispose === 'function' ? dispose : () => {}
    }, 'dsh-credential-vault-read-tool')
  }

  const systemPrompt = typeof ctx.get === 'function' ? ctx.get('systemPrompt') : undefined
  if (systemPrompt !== undefined && systemPrompt !== null && typeof systemPrompt.section === 'function') {
    ctx.effect(() => {
      systemPrompt.section({
        name: 'tool:dsh-credential-vault',
        order: 118,
        text:
          '凭据保险箱：用户把账号密码、API Key、微信公众号 / 小程序开发信息、密钥、恢复码等保存在侧边栏「凭据保险箱」里。需要知道有哪些凭据时用 dsh_credential_vault_read 工具（按 query / category 过滤，category 可选 account / apikey / secretKey / other / wechatMp / wechatMini；数据多时先用 mode="summary" 看标题清单，再用 limit/offset 翻页）。出于安全，该工具只返回元数据——密码 / API Key / 密钥值 / AppSecret / Token / 上传密钥等一律显示为 ••••••••，明文只留在浏览器内、不会进入模型上下文，revealSecrets 参数已失效。不要向用户索要明文密钥；需要用到具体密钥时，请让用户自行在侧边栏面板中查看或复制。',
      })
      return () => {}
    }, 'dsh-credential-vault-prompt')
  }
}
