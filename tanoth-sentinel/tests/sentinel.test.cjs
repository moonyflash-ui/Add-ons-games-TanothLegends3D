'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const core = require('../main.js')

const now = 1788850000000
const normalState = overrides => ({
  schemaVersion: 12,
  identity: { id: 'test-character', tag: 'Test#0001' },
  player: {
    level: 10, prestige: 0, hp: 500, maxHp: 500, mana: 220, maxMana: 250,
    xp: 400, maxXp: 1000, prestigeXp: 0, maxPrestigeXp: 5000,
    position: { x: 10, y: 0, z: 10, rotation: 0 },
    currencies: { gold: 100, gems: 5, wallet: { totalCopper: 1000000 } },
    inventory: [{ id: 'potion', name: 'Potion', quantity: 4 }]
  },
  companion: { hp: 100, maxHp: 100, focus: 40, maxFocus: 100 },
  social: { group: [], raid: [] },
  world: { zone: 'test-zone', map: 'test-map', dungeon: null },
  ...overrides
})

test('un état normal ne produit aucun faux positif', () => {
  const previousState = normalState()
  const current = normalState()
  current.player.position = { x: 18, y: 0, z: 14, rotation: 0 }
  assert.deepEqual(core.inspectState({ state: previousState, at: now - 1000 }, current, now), [])
})

test('détecte vitesse et téléportation impossibles dans le bac de test', () => {
  const previousState = normalState()
  const fast = normalState(); fast.player.position = { x: 250, y: 0, z: 10, rotation: 0 }
  const teleport = normalState(); teleport.player.position = { x: 1800, y: 0, z: 10, rotation: 0 }
  assert.ok(core.inspectState({ state: previousState, at: now - 1000 }, fast, now).some(item => item.ruleCode === 'MOVEMENT.IMPOSSIBLE_SPEED'))
  assert.ok(core.inspectState({ state: previousState, at: now - 1000 }, teleport, now).some(item => item.ruleCode === 'MOVEMENT.IMPOSSIBLE_TELEPORT'))
})

test('ignore un grand déplacement pendant un changement de carte', () => {
  const previousState = normalState()
  const current = normalState(); current.player.position = { x: 4000, y: 0, z: 4000, rotation: 0 }; current.world = { zone: 'other-zone', map: 'other-map' }
  assert.equal(core.inspectState({ state: previousState, at: now - 1000 }, current, now).filter(item => item.ruleCode.startsWith('MOVEMENT.')).length, 0)
})

test('détecte ressources et duplication structurelle', () => {
  const current = normalState()
  current.player.hp = 900
  current.player.inventory.push({ id: 'potion', quantity: 4 })
  const rules = core.inspectState(null, current, now).map(item => item.ruleCode)
  assert.ok(rules.includes('STATE.RESOURCE_OUT_OF_BOUNDS'))
  assert.ok(rules.includes('INVENTORY.DUPLICATE_ENTRY'))
})

test('détecte un cooldown contourné', () => {
  const tracker = {}
  const signals = core.inspectTelemetry({ source: 'combat-core', sequence: 1, occurredAt: now, type: 'combat-action', data: { accepted: true, skillId: 'skill-1', cooldownRemainingMs: 900 } }, tracker, now)
  assert.ok(signals.some(item => item.ruleCode === 'COMBAT.COOLDOWN_BYPASS'))
})

test('refuse télémétrie forgée, rejouée et surdimensionnée', () => {
  const tracker = {}
  assert.ok(core.inspectTelemetry({ hello: 'world' }, tracker, now).some(item => item.ruleCode === 'TELEMETRY.MALFORMED'))
  const packet = { source: 'network-core', sequence: 1, occurredAt: now, type: 'network-message', data: { schemaValid: true, bytes: 120 } }
  core.inspectTelemetry(packet, tracker, now)
  assert.ok(core.inspectTelemetry(packet, tracker, now).some(item => item.ruleCode === 'TELEMETRY.REPLAY'))
  const huge = { source: 'network-core', sequence: 2, occurredAt: now, type: 'network-message', data: { padding: 'x'.repeat(core.MAX_EVENT_BYTES + 100) } }
  assert.ok(core.inspectTelemetry(huge, tracker, now).some(item => item.ruleCode === 'TELEMETRY.OVERSIZED'))
})

test('limite la fréquence de télémétrie', () => {
  const tracker = {}
  let last = []
  for (let sequence = 1; sequence <= core.RATE_LIMIT_COUNT + 1; sequence++) last = core.inspectTelemetry({ source: 'test-source', sequence, occurredAt: now, type: 'noop', data: {} }, tracker, now)
  assert.ok(last.some(item => item.ruleCode === 'TELEMETRY.RATE_EXCEEDED'))
})

test('déduplique les alertes et borne la file', () => {
  const event = { eventId: 'evt-1', ...core.signal('TEST.DUPLICATE', 'WARN', 'Test', {}, 'test', 'same') }
  let queue = core.enqueue([], event, now)
  queue = core.enqueue(queue, { ...event, eventId: 'evt-2' }, now + 10)
  assert.equal(queue.length, 1)
  assert.equal(queue[0].count, 2)
  for (let index = 0; index < 80; index++) queue = core.enqueue(queue, { eventId: `evt-${index + 3}`, ...core.signal(`TEST.${index}`, 'INFO', 'x'.repeat(200), { index }, 'test', String(index)) }, now + index)
  assert.ok(queue.length <= core.MAX_QUEUE_ITEMS)
  assert.ok(core.safeSize(queue) <= core.MAX_QUEUE_BYTES)
})

test('applique le délai exponentiel quand le backend est indisponible', () => {
  const queue = [{ eventId: 'evt-offline', attempts: 0 }]
  const failed = core.markTransportFailure(queue, 'evt-offline', now, 'BACKEND_UNAVAILABLE')
  assert.equal(failed[0].attempts, 1)
  assert.equal(failed[0].nextAttemptAt, now + 5000)
  assert.equal(failed[0].lastTransportError, 'BACKEND_UNAVAILABLE')
  assert.equal(core.backoffDelay(20), 15 * 60 * 1000)
})

test('supprime uniquement après accusé de réception', () => {
  const queue = [{ eventId: 'keep' }, { eventId: 'acked' }]
  assert.deepEqual(core.acknowledge(queue, ['acked']).map(item => item.eventId), ['keep'])
})

test('nettoie les piles sensibles', () => {
  const cleaned = core.cleanStack('Error at C:\\Users\\Alice\\secret.js\ntoken=abc123')
  assert.ok(!cleaned.includes('Alice'))
  assert.ok(!cleaned.includes('abc123'))
})

test('aucun secret Discord ou jeton embarqué dans les fichiers exécutables', () => {
  const root = path.resolve(__dirname, '..')
  const files = []
  const visit = folder => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name)
      if (entry.isDirectory()) visit(full)
      else if (/\.(?:js|cjs|json|css)$/i.test(entry.name)) files.push(full)
    }
  }
  visit(root)
  const source = files.map(file => fs.readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(source, /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,}/i)
  assert.doesNotMatch(source, /(?:sk|ghp|xoxb|AIza)[-_A-Za-z0-9]{20,}/)
})

