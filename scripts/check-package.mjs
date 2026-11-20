// Publish gate: the pieces that must agree with the package name.
//
// 1. client.js registers its lazy factory under the package name (DSH looks the
//    module up by package name; a mismatch silently drops the whole browser half).
// 2. cordis.patch.yml inserts the row under the package name (the Host half is
//    resolved by that name).
// 3. The bundle manifest still points at files that exist and are packed.
//
// Runs from `prepublishOnly`, so `npm publish` aborts on a mismatch.

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const pkg = JSON.parse(read('package.json'))
const errors = []

const clientRel = isString(pkg.exports?.['./client']) ? pkg.exports['./client'] : './client.js'
const patchRel = isString(pkg.dsh?.bundle?.patch) ? pkg.dsh.bundle.patch : './cordis.patch.yml'

// 1. client module id
const clientSource = read(clientRel)
const registered = clientSource.match(/__ModuleLoader__\.load\(\s*\{\s*id:\s*['"]([^'"]+)['"]/)
if (!registered) {
  errors.push(`${clientRel}: no \`window.__ModuleLoader__.load({ id: '…' })\` registration found`)
} else if (registered[1] !== pkg.name) {
  errors.push(
    `${clientRel}: registers id '${registered[1]}' but the package is '${pkg.name}' — ` +
      `the Web client would never mount (the sidebar entry and settings page disappear)`,
  )
}

// 2. patch row name
const patchSource = read(patchRel)
const patched = patchSource.match(/^\s*-?\s*name:\s*['"]?([^'"\s#]+)['"]?\s*$/m)
if (!patched) {
  errors.push(`${patchRel}: no \`name:\` field found`)
} else if (patched[1] !== pkg.name) {
  errors.push(`${patchRel}: inserts row name '${patched[1]}' but the package is '${pkg.name}'`)
}

// 3. manifest sanity
for (const rel of [clientRel, patchRel, isString(pkg.exports?.['.']) ? pkg.exports['.'] : './index.js']) {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`missing file: ${rel}`)
}
if (!Array.isArray(pkg.files) || !pkg.files.includes('client.js')) errors.push(`package.json "files" must include ${clientRel}`)
if (pkg.dsh?.client?.platform !== 'web') errors.push('package.json dsh.client.platform must be "web"')
if (pkg.name?.startsWith('@') && pkg.publishConfig?.access !== 'public') {
  errors.push('scoped package: package.json publishConfig.access must be "public"')
}

function isString(value) {
  return typeof value === 'string'
}

if (errors.length) {
  console.error(`\n✗ ${pkg.name}@${pkg.version} is not publishable:\n`)
  for (const error of errors) console.error(`  - ${error}`)
  console.error('')
  process.exit(1)
}

console.log(`✓ ${pkg.name}@${pkg.version}: client id, patch name, and manifest agree`)