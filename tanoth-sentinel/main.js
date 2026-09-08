'use strict'

const SentinelCore = (() => {
  const MAX_EVENT_BYTES = 4096
  const MAX_QUEUE_ITEMS = 32
  const MAX_QUEUE_BYTES = 60000
  const RATE_LIMIT_COUNT = 20
  const RATE_LIMIT_WINDOW_MS = 60000
  const allowedSeverities = new Set(['INFO', 'WARN', 'HIGH', 'CRITICAL'])

  const finite = value => Number.isFinite(Number(value)) ? Number(value) : null
  const clampText = (value, maximum = 240) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum)
  const cleanStack = value => String(value ?? '')
    .replace(/[A-Z]:\\Users\\[^\\\s]+/gi, '<profil>')
    .replace(/\b(password|token|authorization|secret|webhook)\s*[:=]\s*[^\s,;]+/gi, '$1=[retiré]')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .split('\n').slice(0, 12).join('\n').slice(0, 1200)
  const safeSize = value => {
    try { return new TextEncoder().encode(JSON.stringify(value)).length } catch { return Number.POSITIVE_INFINITY }
  }
  const hash = value => {
    let result = 2166136261
    for (const character of String(value)) {
      result ^= character.charCodeAt(0)
      result = Math.imul(result, 16777619)
    }
    return (result >>> 0).toString(16).padStart(8, '0')
  }
  const fingerprint = signal => `ts1-${hash(`${signal.ruleCode}|${signal.source || 'state'}|${signal.scope || ''}`)}`
  const signal = (ruleCode, severity, summary, context = {}, source = 'state', scope = '') => ({
    ruleCode: clampText(ruleCode, 80),
    severity: allowedSeverities.has(severity) ? severity : 'WARN',
    summary: clampText(summary, 240),
    context,
    source: clampText(source, 40),
    scope: clampText(scope, 80)
  })

  function resourceSignals (player) {
    const output = []
    for (const [label, valueKey, maxKey] of [['PV', 'hp', 'maxHp'], ['PM', 'mana', 'maxMana'], ['XP', 'xp', 'maxXp'], ['XP Prestige', 'prestigeXp', 'maxPrestigeXp']]) {
      const value = finite(player?.[valueKey]), maximum = finite(player?.[maxKey])
      if (value === null || maximum === null || maximum < 0) output.push(signal('STATE.RESOURCE_MALFORMED', 'HIGH', `${label} contient une valeur invalide.`, { field: valueKey }, 'state', valueKey))
      else if (value < 0 || value > maximum + Math.max(1, maximum * 0.01)) output.push(signal('STATE.RESOURCE_OUT_OF_BOUNDS', 'HIGH', `${label} est hors limites.`, { field: valueKey, value: Math.round(value), maximum: Math.round(maximum) }, 'state', valueKey))
    }
    if ((finite(player?.level) ?? 0) < 1 || (finite(player?.prestige) ?? 0) < 0) output.push(signal('STATE.PROGRESSION_INVALID', 'HIGH', 'Niveau ou prestige invalide.', { level: finite(player?.level), prestige: finite(player?.prestige) }, 'state', 'progression'))
    return output
  }

  function inventorySignals (inventory) {
    const output = [], seen = new Set()
    for (const item of Array.isArray(inventory) ? inventory : []) {
      const id = clampText(item?.id, 80), quantity = finite(item?.quantity)
      if (!id) output.push(signal('INVENTORY.ITEM_WITHOUT_ID', 'WARN', 'Objet sans identifiant détecté.', {}, 'state', 'inventory'))
      else if (seen.has(id)) output.push(signal('INVENTORY.DUPLICATE_ENTRY', 'HIGH', 'Deux lignes d’inventaire partagent le même identifiant.', { itemId: id }, 'state', id))
      else seen.add(id)
      if (quantity === null || quantity < 0 || quantity > 1000000) output.push(signal('INVENTORY.QUANTITY_INVALID', 'HIGH', 'Quantité d’objet incohérente.', { itemId: id || 'inconnu', quantity }, 'state', id || 'unknown'))
    }
    return output
  }

  function currencySignals (currencies) {
    const output = []
    const inspect = (name, value) => {
      const amount = finite(value)
      if (amount !== null && amount < 0) output.push(signal('ECONOMY.NEGATIVE_BALANCE', 'HIGH', 'Solde monétaire négatif.', { currency: name, amount: Math.round(amount) }, 'state', name))
    }
    for (const [name, value] of Object.entries(currencies || {})) {
      if (name === 'wallet' && value && typeof value === 'object') for (const [walletName, walletValue] of Object.entries(value)) inspect(`wallet.${walletName}`, walletValue)
      else inspect(name, value)
    }
    return output
  }

  function rosterSignals (social) {
    const output = []
    for (const [name, roster] of [['group', social?.group], ['raid', social?.raid]]) {
      const seen = new Set()
      for (const member of Array.isArray(roster) ? roster : []) {
        const tag = clampText(member?.tag || member?.id, 80)
        if (!tag) continue
        if (seen.has(tag)) output.push(signal('SOCIAL.DUPLICATE_MEMBER', 'WARN', `Membre dupliqué dans ${name}.`, { roster: name }, 'state', `${name}:${hash(tag)}`))
        seen.add(tag)
        const hp = finite(member?.hp), maxHp = finite(member?.maxHp)
        if (hp !== null && maxHp !== null && (hp < 0 || hp > maxHp + 1)) output.push(signal('SOCIAL.RESOURCE_OUT_OF_BOUNDS', 'WARN', `PV incohérents dans ${name}.`, { roster: name }, 'state', `${name}:${hash(tag)}`))
      }
    }
    return output
  }

  function movementSignals (previous, current, now) {
    if (!previous?.state?.player?.position || !current?.player?.position) return []
    const elapsedMs = now - Number(previous.at || 0)
    if (elapsedMs < 250 || elapsedMs > 10000) return []
    const before = previous.state.player.position, after = current.player.position
    const values = [before.x, before.z, after.x, after.z].map(finite)
    if (values.some(value => value === null)) return [signal('MOVEMENT.POSITION_MALFORMED', 'HIGH', 'Coordonnées du joueur invalides.', {}, 'state', 'player')]
    const previousWorld = previous.state.world || {}, nextWorld = current.world || {}
    const worldKey = world => JSON.stringify([world.zone?.id || world.zone || '', world.map?.id || world.map?.name || world.map || '', world.dungeon?.id || world.dungeon || ''])
    if (worldKey(previousWorld) !== worldKey(nextWorld)) return []
    const distance = Math.hypot(values[2] - values[0], values[3] - values[1]), speed = distance / (elapsedMs / 1000)
    if (distance > 1200 && elapsedMs <= 5000) return [signal('MOVEMENT.IMPOSSIBLE_TELEPORT', 'HIGH', 'Déplacement instantané très important sans changement de carte.', { distance: Math.round(distance), elapsedMs, speed: Math.round(speed) }, 'state', 'player')]
    if (distance > 50 && speed > 90) return [signal('MOVEMENT.IMPOSSIBLE_SPEED', 'WARN', 'Vitesse anormalement élevée sans changement de carte.', { distance: Math.round(distance), elapsedMs, speed: Math.round(speed) }, 'state', 'player')]
    return []
  }

  function inspectState (previous, current, now = Date.now()) {
    if (!current || typeof current !== 'object') return [signal('STATE.MISSING', 'HIGH', 'État public du jeu indisponible.', {}, 'state', 'root')]
    const output = [...resourceSignals(current.player), ...inventorySignals(current.player?.inventory), ...currencySignals(current.player?.currencies), ...rosterSignals(current.social), ...movementSignals(previous, current, now)]
    const companion = current.companion
    if (companion) {
      const hp = finite(companion.hp), maxHp = finite(companion.maxHp), focus = finite(companion.focus), maxFocus = finite(companion.maxFocus)
      if ([hp, maxHp, focus, maxFocus].some(value => value === null) || hp < 0 || hp > maxHp + 1 || focus < 0 || focus > maxFocus + 1) output.push(signal('COMPANION.RESOURCE_OUT_OF_BOUNDS', 'WARN', 'Ressources du familier incohérentes.', {}, 'state', 'companion'))
    }
    return output
  }

  function inspectTelemetry (packet, tracker = {}, now = Date.now()) {
    const output = []
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)) return [signal('TELEMETRY.MALFORMED', 'HIGH', 'Événement de sécurité malformé.', {}, 'telemetry', 'packet')]
    if (safeSize(packet) > MAX_EVENT_BYTES) return [signal('TELEMETRY.OVERSIZED', 'HIGH', 'Événement de sécurité trop volumineux.', { maximumBytes: MAX_EVENT_BYTES }, 'telemetry', 'packet')]
    const source = clampText(packet.source, 48), sequence = finite(packet.sequence), occurredAt = finite(packet.occurredAt)
    if (!source || !/^[a-z0-9._-]{3,48}$/i.test(source) || sequence === null || !Number.isInteger(sequence) || occurredAt === null) return [signal('TELEMETRY.MALFORMED', 'HIGH', 'En-tête de télémétrie invalide.', {}, 'telemetry', 'header')]
    if (Math.abs(now - occurredAt) > 30000) output.push(signal('TELEMETRY.TIMESTAMP_INVALID', 'WARN', 'Horodatage de télémétrie hors fenêtre.', { deltaMs: Math.round(now - occurredAt) }, 'telemetry', source))
    tracker.sequences ||= {}
    if (sequence <= Number(tracker.sequences[source] || 0)) output.push(signal('TELEMETRY.REPLAY', 'HIGH', 'Événement de télémétrie rejoué ou désordonné.', { sequence }, 'telemetry', source))
    else tracker.sequences[source] = sequence
    tracker.rates ||= {}
    const recent = (tracker.rates[source] || []).filter(at => now - at < RATE_LIMIT_WINDOW_MS)
    recent.push(now); tracker.rates[source] = recent
    if (recent.length > RATE_LIMIT_COUNT) output.push(signal('TELEMETRY.RATE_EXCEEDED', 'WARN', 'Fréquence de télémétrie excessive.', { count: recent.length, windowMs: RATE_LIMIT_WINDOW_MS }, 'telemetry', source))
    const data = packet.data || {}
    if (packet.type === 'combat-action' && data.accepted === true && ((finite(data.cooldownRemainingMs) || 0) > 50 || ((finite(data.minimumIntervalMs) || 0) > 0 && (finite(data.elapsedSincePreviousMs) || 0) + 30 < finite(data.minimumIntervalMs)))) output.push(signal('COMBAT.COOLDOWN_BYPASS', 'HIGH', 'Action acceptée pendant un cooldown ou avant sa cadence minimale.', { skillId: clampText(data.skillId, 64) }, 'telemetry', clampText(data.skillId, 64)))
    if (packet.type === 'economy-mutation' && data.serverReceiptValid !== true) output.push(signal('ECONOMY.UNVERIFIED_MUTATION', 'HIGH', 'Modification économique sans reçu serveur valide.', { currency: clampText(data.currency, 32), reason: clampText(data.reason, 80) }, 'telemetry', clampText(data.currency, 32)))
    if (packet.type === 'network-message' && (data.schemaValid === false || data.replayed === true || (finite(data.bytes) || 0) > 16384)) output.push(signal('NETWORK.MESSAGE_REJECTED', 'HIGH', 'Message réseau malformé, rejoué ou surdimensionné.', { schemaValid: data.schemaValid === true, replayed: data.replayed === true, bytes: finite(data.bytes) }, 'telemetry', source))
    if (packet.type === 'integrity' && data.valid === false) output.push(signal('INTEGRITY.MISMATCH', 'HIGH', 'Écart d’intégrité signalé par une API autorisée.', { component: clampText(data.component, 80) }, 'telemetry', clampText(data.component, 80)))
    if (packet.type === 'client-error') output.push(signal('CLIENT.REPEATED_EXCEPTION', data.repeatedCount >= 5 ? 'HIGH' : 'WARN', 'Erreur client importante signalée.', { name: clampText(data.name, 80), repeatedCount: finite(data.repeatedCount), stack: cleanStack(data.stack) }, 'telemetry', clampText(data.name, 80)))
    return output
  }

  const backoffDelay = attempt => Math.min(15 * 60 * 1000, 5000 * (2 ** Math.max(0, Math.min(8, Number(attempt) || 0))))

  function enqueue (queue, event, now = Date.now()) {
    const next = Array.isArray(queue) ? queue.map(item => ({ ...item })) : []
    const eventFingerprint = event.fingerprint || fingerprint(event)
    const existing = next.find(item => item.fingerprint === eventFingerprint && item.status !== 'resolved')
    if (existing) {
      existing.count = Math.max(1, Number(existing.count) || 1) + 1
      existing.lastSeenAt = now
      existing.status = 'repeated'
      existing.context = event.context
    } else {
      next.unshift({ ...event, fingerprint: eventFingerprint, count: 1, firstSeenAt: now, lastSeenAt: now, status: event.status || 'new', attempts: 0, nextAttemptAt: 0 })
    }
    while (next.length > MAX_QUEUE_ITEMS || safeSize(next) > MAX_QUEUE_BYTES) next.pop()
    return next
  }

  function markTransportFailure (queue, eventId, now = Date.now(), reason = 'BACKEND_UNAVAILABLE') {
    return (Array.isArray(queue) ? queue : []).map(item => {
      if (item.eventId !== eventId) return { ...item }
      const attempts = Math.min(9, Math.max(0, Number(item.attempts) || 0) + 1)
      return { ...item, attempts, nextAttemptAt: now + backoffDelay(attempts - 1), lastTransportError: clampText(reason, 80) }
    })
  }

  function acknowledge (queue, eventIds) {
    const accepted = new Set((Array.isArray(eventIds) ? eventIds : []).map(String))
    return (Array.isArray(queue) ? queue : []).filter(item => !accepted.has(String(item.eventId)))
  }

  function resolveAbsent (queue, activeFingerprints, now = Date.now(), quietMs = 60000) {
    const active = new Set(activeFingerprints || [])
    return (Array.isArray(queue) ? queue : []).map(item => item.source === 'state' && item.status !== 'resolved' && !active.has(item.fingerprint) && now - Number(item.lastSeenAt || 0) >= quietMs ? { ...item, status: 'resolved', resolvedAt: now } : { ...item })
  }

  return Object.freeze({ MAX_EVENT_BYTES, MAX_QUEUE_ITEMS, MAX_QUEUE_BYTES, RATE_LIMIT_COUNT, clampText, cleanStack, safeSize, hash, fingerprint, signal, inspectState, inspectTelemetry, backoffDelay, enqueue, markTransportFailure, acknowledge, resolveAbsent })
})()

if (typeof module !== 'undefined' && module.exports) module.exports = SentinelCore

if (typeof TanothAddon !== 'undefined') TanothAddon.register({
  async activate (api) {
    if (api.version !== 1 || typeof api.game?.getState !== 'function' || typeof api.storage?.get !== 'function' || typeof api.on !== 'function') throw new Error('Compatibilité Sentinel : API Add-ons 1 incomplète. Add-on arrêté sans bloquer le jeu.')

    const $ = id => document.getElementById(id)
    const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
    const randomId = prefix => {
      const bytes = new Uint32Array(2)
      globalThis.crypto?.getRandomValues?.(bytes)
      return `${prefix}-${Date.now().toString(36)}-${[...bytes].map(value => value.toString(36)).join('')}`
    }
    const pseudonym = async value => {
      try {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${pseudonymSalt}|${String(value || 'anonymous')}`))
        return `anon-${[...new Uint8Array(digest)].slice(0, 8).map(value => value.toString(16).padStart(2, '0')).join('')}`
      } catch { return `anon-${SentinelCore.hash(`${pseudonymSalt}|${String(value || 'anonymous')}`)}` }
    }

    document.body.innerHTML = `<main>
      <header><span class="shield">◈</span><div><h1>Tanoth Sentinel</h1><p>Anti-Triche, sécurité et rapports de bugs</p></div><b id="mode-badge">LOCAL</b></header>
      <section class="truth"><strong>MODE DEV · CAPTEUR CLIENT</strong><span>Les alertes restent locales. Aucun serveur autoritaire ni webhook Discord n’est connecté.</span></section>
      <nav><button data-tab="overview" class="active">Protection</button><button data-tab="events">Événements</button><button data-tab="report">Signaler un bug</button><button data-tab="privacy">Données</button></nav>
      <section id="tab-overview" class="tab active">
        <div class="hero-state"><i id="state-light"></i><div><small>ÉTAT DE LA SURVEILLANCE</small><strong id="state-label">Consentement requis</strong></div><b id="event-count">0</b></div>
        <label class="consent"><input id="consent" type="checkbox"><span><strong>Activer l’analyse locale</strong><small>Enregistre uniquement des signaux techniques minimaux et pseudonymisés dans ce profil de jeu.</small></span></label>
        <div class="capabilities"><article class="available"><b>Disponible en v54</b><span>État public · ressources · position · inventaire · groupe/raid · stockage local</span></article><article class="missing"><b>En attente du jeu/serveur</b><span>Intégrité · cooldowns · transactions · P2P brut · exceptions · transport authentifié</span></article></div>
        <p id="last-check">Aucune analyse effectuée.</p>
      </section>
      <section id="tab-events" class="tab"><div class="toolbar"><span><b id="queued-count">0</b> rapport(s) local(aux)</span><button id="prepare-export">Préparer l’export</button><button id="clear-events" class="danger">Effacer</button></div><div id="events" class="events"></div><div id="export-box" class="export-box"><textarea id="export-output" readonly aria-label="Rapport anonymisé"></textarea><button id="copy-export">Copier le rapport anonymisé</button></div></section>
      <section id="tab-report" class="tab"><form id="bug-form"><label>Catégorie<select id="bug-category"><option value="gameplay">Gameplay</option><option value="interface">Interface</option><option value="quest">Quête</option><option value="world">Monde 3D</option><option value="security">Sécurité</option><option value="crash">Erreur ou crash</option></select></label><label>Sévérité<select id="bug-severity"><option value="INFO">Information</option><option value="WARN">Gênant</option><option value="HIGH">Important</option><option value="CRITICAL">Critique</option></select></label><label class="wide">Résumé<input id="bug-summary" maxlength="180" required placeholder="Décrivez le problème sans donnée personnelle"></label><label class="wide">Étapes récentes<textarea id="bug-steps" maxlength="800" placeholder="Maximum 4 étapes. Aucun mot de passe, chat ou jeton."></textarea></label><button type="submit">Ajouter au rapport local</button><p id="bug-status">Aucune capture d’écran n’est prise automatiquement.</p></form></section>
      <section id="tab-privacy" class="tab"><h2>Données autorisées</h2><ul><li>Version API et schéma public du jeu</li><li>Valeurs techniques nécessaires à la règle déclenchée</li><li>Identifiant de personnage transformé en pseudonyme</li><li>Résumé et étapes saisis volontairement</li></ul><h2>Jamais collecté</h2><ul class="never"><li>Mots de passe, jetons, clés ou webhook</li><li>Chat complet, frappes clavier ou fichiers personnels</li><li>Adresse personnelle ou capture automatique</li></ul><p>Un signal client ne prouve pas une triche. Toute sanction doit être décidée côté serveur après recoupement autoritaire.</p></section>
      <footer><span id="api-state">API 1</span><span id="transport-state">TRANSMISSION : INDISPONIBLE</span></footer>
    </main>`

    const sessionId = randomId('dev-session')
    const storedSalt = await api.storage.get('pseudonymSalt')
    const pseudonymSalt = typeof storedSalt === 'string' && storedSalt.length >= 16 ? storedSalt : randomId('local-salt')
    if (storedSalt !== pseudonymSalt) await api.storage.set('pseudonymSalt', pseudonymSalt)
    const settings = { consent: false, ...(await api.storage.get('settings') || {}) }
    const storedQueue = await api.storage.get('queue')
    let queue = Array.isArray(storedQueue) ? storedQueue : []
    let previous = null
    let currentState = null
    let actorId = 'anon-pending'
    let resolveTimer = 0
    const removers = []
    const telemetryTracker = {}
    const recentSteps = []

    const step = value => { recentSteps.unshift({ at: Date.now(), name: SentinelCore.clampText(value, 80) }); recentSteps.splice(6) }
    const persistQueue = async () => api.storage.set('queue', queue)
    const environment = 'DEV'
    const createEvent = entry => {
      const now = Date.now(), event = {
        schema: 'tanoth.security.event', schemaVersion: 1, eventId: randomId('evt'), environment,
        severity: entry.severity, ruleCode: entry.ruleCode, realm: 'indisponible-api-v54',
        actorId, sessionId, build: 'v54-officiel-api-jeu-41.0', apiVersion: api.version,
        occurredAt: new Date(now).toISOString(), summary: SentinelCore.clampText(entry.summary, 240),
        source: entry.source || 'state', context: entry.context || {}, recentSteps: recentSteps.slice(0, 6)
      }
      event.fingerprint = SentinelCore.fingerprint({ ...entry, scope: `${actorId}:${entry.scope || ''}` })
      return event
    }
    const render = () => {
      $('consent').checked = settings.consent === true
      $('state-light').className = settings.consent ? 'local' : 'off'
      $('state-label').textContent = settings.consent ? 'Surveillance locale limitée' : 'Consentement requis'
      $('mode-badge').textContent = settings.consent ? 'DEV LOCAL' : 'ARRÊTÉ'
      $('event-count').textContent = String(queue.reduce((sum, item) => sum + Math.max(1, Number(item.count) || 1), 0))
      $('queued-count').textContent = String(queue.length)
      $('events').innerHTML = queue.slice(0, 16).map(item => `<article class="severity-${esc(item.severity)}"><header><b>${esc(item.severity)}</b><code>${esc(item.ruleCode)}</code><span>${new Date(item.lastSeenAt || item.occurredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></header><strong>${esc(item.summary)}</strong><small>${esc(item.status)} · ${esc(item.fingerprint)}${item.count > 1 ? ` · répété ${item.count} fois` : ''}</small></article>`).join('') || '<p class="empty">Aucun événement local.</p>'
    }
    const addSignals = async entries => {
      if (!settings.consent || !entries.length) return
      step('signal-technique')
      for (const entry of entries) queue = SentinelCore.enqueue(queue, createEvent(entry))
      await persistQueue(); render()
    }
    const inspect = async state => {
      currentState = state
      actorId = await pseudonym(state?.identity?.id || state?.identity?.tag || 'anonymous')
      if (!settings.consent) { previous = { state, at: Date.now() }; return }
      const now = Date.now(), signals = SentinelCore.inspectState(previous, state, now)
      previous = { state, at: now }
      await addSignals(signals)
      $('last-check').textContent = signals.length ? `${signals.length} signal(aux) local(aux) observé(s).` : `Dernier contrôle normal : ${new Date(now).toLocaleTimeString('fr-FR')}`
    }
    const handleTelemetry = packet => addSignals(SentinelCore.inspectTelemetry(packet, telemetryTracker))
    const handleAck = async value => { queue = SentinelCore.acknowledge(queue, value?.eventIds); await persistQueue(); render() }
    const handleTransportError = async value => { if (!value?.eventId) return; queue = SentinelCore.markTransportFailure(queue, value.eventId, Date.now(), value.reason); await persistQueue(); render() }

    document.querySelectorAll('[data-tab]').forEach(button => { button.onclick = () => { document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button)); document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab.id === `tab-${button.dataset.tab}`)) } })
    $('consent').onchange = async () => {
      settings.consent = $('consent').checked
      await api.storage.set('settings', settings)
      step(settings.consent ? 'consentement-local-active' : 'consentement-retire')
      if (!settings.consent) { queue = []; previous = currentState ? { state: currentState, at: Date.now() } : null; await persistQueue() } else if (currentState) await inspect(currentState)
      render()
    }
    $('clear-events').onclick = async () => { queue = []; await persistQueue(); $('export-box').classList.remove('visible'); render() }
    $('prepare-export').onclick = () => {
      const report = { schema: 'tanoth.security.export', schemaVersion: 1, generatedAt: new Date().toISOString(), environment, transport: 'local-only', serverValidated: false, events: queue }
      $('export-output').value = JSON.stringify(report, null, 2)
      $('export-box').classList.add('visible')
    }
    $('copy-export').onclick = async () => {
      const output = $('export-output'); if (!output.value) $('prepare-export').click()
      try { await navigator.clipboard.writeText(output.value); $('copy-export').textContent = 'Copié' } catch { output.focus(); output.select(); const copied = document.execCommand('copy'); $('copy-export').textContent = copied ? 'Copié' : 'Sélectionné — copiez avec Ctrl+C' }
    }
    $('bug-form').onsubmit = async event => {
      event.preventDefault()
      if (!settings.consent) { $('bug-status').textContent = 'Activez d’abord l’analyse locale et son consentement.'; return }
      const summary = SentinelCore.clampText($('bug-summary').value, 180)
      if (summary.length < 4) { $('bug-status').textContent = 'Ajoutez un résumé plus précis.'; return }
      const steps = $('bug-steps').value.split('\n').map(value => SentinelCore.clampText(value, 160)).filter(Boolean).slice(0, 4)
      const category = $('bug-category').value, severity = $('bug-severity').value
      step('rapport-manuel')
      await addSignals([SentinelCore.signal(`BUG.${category.toUpperCase()}`, severity, summary, { category, steps }, 'manual', category)])
      $('bug-summary').value = ''; $('bug-steps').value = ''; $('bug-status').textContent = 'Rapport anonymisé ajouté à la file locale. Rien n’a été transmis.'
    }

    removers.push(api.on('state', state => inspect(state).catch(error => api.log(`Sentinel state: ${error.message}`))))
    removers.push(api.on('security:telemetry', handleTelemetry))
    removers.push(api.on('security:transport-ack', value => handleAck(value).catch(() => {})))
    removers.push(api.on('security:transport-error', value => handleTransportError(value).catch(() => {})))
    currentState = await api.game.getState()
    if (!currentState?.player) throw new Error('Compatibilité Sentinel : champ player absent. Add-on arrêté sans bloquer le jeu.')
    await inspect(currentState)
    resolveTimer = setInterval(async () => {
      if (!settings.consent) return
      const signals = SentinelCore.inspectState(previous, currentState, Date.now()), active = signals.map(entry => SentinelCore.fingerprint({ ...entry, scope: `${actorId}:${entry.scope || ''}` }))
      const next = SentinelCore.resolveAbsent(queue, active)
      if (JSON.stringify(next) !== JSON.stringify(queue)) { queue = next; await persistQueue(); render() }
    }, 15000)
    document.body.dataset.resolveTimer = String(resolveTimer)
    step('sentinel-active')
    render()
    await api.ui.setTitle('Tanoth Sentinel — Sécurité locale DEV')
    await api.ui.show()

    globalThis.__tanothSentinelCleanup = () => { clearInterval(resolveTimer); removers.forEach(remove => { try { remove() } catch {} }) }
  },
  deactivate () {
    globalThis.__tanothSentinelCleanup?.()
    delete globalThis.__tanothSentinelCleanup
  }
})
