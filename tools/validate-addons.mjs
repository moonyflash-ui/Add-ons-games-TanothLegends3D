import { spawnSync } from 'node:child_process'
import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(import.meta.dirname, '..')
const ignored = new Set(['.git', '.github', 'node_modules', 'tools'])
const allowedPermissions = new Set(['game.read', 'game.actions', 'ui', 'storage'])
const errors = []
const addons = []

const exists = async file => {
  try { await access(file); return true } catch { return false }
}

const safeFile = (folder, relative) => {
  if (typeof relative !== 'string' || !relative.trim() || path.isAbsolute(relative)) return null
  const resolved = path.resolve(folder, relative)
  return resolved.startsWith(`${folder}${path.sep}`) ? resolved : null
}

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || ignored.has(entry.name) || entry.name.startsWith('.')) continue
  const folder = path.join(root, entry.name)
  const manifestFile = path.join(folder, 'addon.json')
  if (!await exists(manifestFile)) {
    errors.push(`${entry.name}: addon.json manquant`)
    continue
  }

  let manifest
  try { manifest = JSON.parse(await readFile(manifestFile, 'utf8')) } catch (error) {
    errors.push(`${entry.name}: addon.json invalide (${error.message})`)
    continue
  }

  if (manifest.id !== entry.name) errors.push(`${entry.name}: id doit être identique au nom du dossier`)
  if (!manifest.name || typeof manifest.name !== 'string') errors.push(`${entry.name}: name manquant`)
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version || '')) errors.push(`${entry.name}: version sémantique invalide`)
  if (manifest.apiVersion !== 1) errors.push(`${entry.name}: apiVersion doit valoir 1`)
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(manifest.minGameVersion || '')) errors.push(`${entry.name}: minGameVersion invalide`)
  if (!Array.isArray(manifest.permissions)) errors.push(`${entry.name}: permissions doit être un tableau`)
  else for (const permission of manifest.permissions) if (!allowedPermissions.has(permission)) errors.push(`${entry.name}: permission inconnue ${permission}`)

  const declaredFiles = [manifest.entry, ...(manifest.styles || []), ...(manifest.assets || [])]
  for (const relative of declaredFiles) {
    const file = safeFile(folder, relative)
    if (!file) errors.push(`${entry.name}: chemin interdit ${String(relative)}`)
    else if (!await exists(file)) errors.push(`${entry.name}: fichier déclaré introuvable ${relative}`)
  }

  const entryFile = safeFile(folder, manifest.entry)
  if (entryFile && await exists(entryFile)) {
    const checked = spawnSync(process.execPath, ['--check', entryFile], { encoding: 'utf8' })
    if (checked.status !== 0) errors.push(`${entry.name}: JavaScript invalide (${checked.stderr.trim()})`)
  }
  addons.push(`${manifest.id || entry.name}@${manifest.version || '?'}`)
}

if (!addons.length) errors.push('Aucun add-on trouvé')
if (errors.length) {
  console.error(`Validation échouée (${errors.length} erreur(s)):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Validation réussie : ${addons.join(', ')}`)

