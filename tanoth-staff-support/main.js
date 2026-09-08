'use strict'

const TanothSupportCore = (() => {
  const allowedRoles = new Set(['player', 'gs', 'gm', 'admin'])
  const sensitiveActions = new Set(['economy.restore', 'crown-blood.adjust', 'character.delete', 'account.permanent-ban'])
  const permissionByAction = Object.freeze({
    'realm.observe': 'realm.read', 'realm.join-invisible': 'realm.observe.hidden', 'player.teleport': 'player.teleport',
    'player.unstuck': 'player.unstuck', 'player.mute': 'moderation.mute', 'session.kick': 'moderation.kick',
    'session.suspend': 'moderation.suspend', 'security.investigate': 'security.investigate',
    'realm.maintenance': 'realm.maintenance', 'audit.read': 'audit.read', 'incident.read': 'incident.read',
    'economy.restore': 'economy.restore', 'crown-blood.adjust': 'economy.crown-blood',
    'character.delete': 'character.delete', 'account.permanent-ban': 'account.permanent-ban'
  })
  const MAX_TICKETS = 20
  const MAX_TICKET_BYTES = 56000

  const finite = value => Number.isFinite(Number(value)) ? Number(value) : null
  const sanitize = (value, maximum = 800) => String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\b(password|mot de passe|token|authorization|secret|webhook|api[_ -]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[retiré]')
    .replace(/\s+/g, ' ').trim().slice(0, maximum)
  const sizeOf = value => { try { return new TextEncoder().encode(JSON.stringify(value)).length } catch { return Number.POSITIVE_INFINITY } }
  const hash = value => {
    let result = 2166136261
    for (const character of String(value)) { result ^= character.charCodeAt(0); result = Math.imul(result, 16777619) }
    return (result >>> 0).toString(16).padStart(8, '0')
  }
  const tokenize = value => [...new Set(sanitize(value, 1200).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(token => token.length > 2))]
  const looksLikePromptInjection = value => /ignore (?:all|previous)|system prompt|developer message|reveal (?:secret|token)|change your rules|oublie (?:les|toutes)|instructions? cachées?|contourne|bypass/i.test(String(value || ''))

  function resolveRole (claim, now = Date.now()) {
    if (!claim || claim.verifiedByGame !== true || claim.issuer !== 'tanoth-support-api' || !allowedRoles.has(claim.role) || finite(claim.expiresAt) === null || claim.expiresAt <= now) return 'player'
    return claim.role
  }

  function hasPermission (claim, permission, now = Date.now()) {
    if (resolveRole(claim, now) === 'player') return false
    return Array.isArray(claim.permissions) && claim.permissions.includes(permission)
  }

  function validateStaffCommand (command, claim, tracker = {}, now = Date.now()) {
    const fail = (code, reason) => ({ ok: false, code, reason })
    const role = resolveRole(claim, now)
    if (!['gs', 'gm', 'admin'].includes(role)) return fail('ROLE_REQUIRED', 'Rôle staff serveur requis.')
    if (!command || typeof command !== 'object' || sizeOf(command) > 4096) return fail('COMMAND_INVALID', 'Commande absente ou trop volumineuse.')
    const action = sanitize(command.action, 64), permission = permissionByAction[action]
    if (!permission) return fail('ACTION_UNKNOWN', 'Action non reconnue.')
    if (!hasPermission(claim, permission, now)) return fail('PERMISSION_DENIED', 'Permission serveur insuffisante.')
    if (!/^[A-Za-z0-9._-]{8,96}$/.test(String(command.commandId || '')) || !/^[A-Za-z0-9._-]{8,96}$/.test(String(command.nonce || ''))) return fail('IDENTIFIER_INVALID', 'Identifiant de commande invalide.')
    const occurredAt = finite(command.occurredAt)
    if (occurredAt === null || Math.abs(now - occurredAt) > 30000) return fail('TIMESTAMP_INVALID', 'Commande trop ancienne ou future.')
    tracker.nonces ||= new Set()
    if (tracker.nonces.has(command.nonce)) return fail('REPLAY', 'Commande déjà utilisée.')
    if (sanitize(command.reason, 240).length < 8) return fail('REASON_REQUIRED', 'Une raison précise est obligatoire.')
    if (command.confirmed !== true) return fail('CONFIRMATION_REQUIRED', 'Confirmation humaine requise.')
    if (sensitiveActions.has(action) && (claim.stepUpVerified !== true || command.doubleConfirmed !== true || !command.secondApproverId || command.secondApproverId === claim.staffId)) return fail('DUAL_CONTROL_REQUIRED', 'MFA et double confirmation humaine requis.')
    tracker.nonces.add(command.nonce)
    return { ok: true, action, permission, role, audit: { commandId: command.commandId, action, reason: sanitize(command.reason, 240), durationSeconds: Math.max(0, Math.floor(finite(command.durationSeconds) || 0)), targetId: sanitize(command.targetId, 96), authorId: sanitize(claim.staffId, 96), occurredAt, decision: 'accepted-for-server-execution' } }
  }

  function createTicket (input, context = {}, now = Date.now()) {
    const category = sanitize(input?.category, 32), language = sanitize(input?.language, 12), description = sanitize(input?.description, 1400)
    if (!/^[a-z0-9-]{3,32}$/i.test(category)) return { ok: false, code: 'CATEGORY_INVALID' }
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(language)) return { ok: false, code: 'LANGUAGE_INVALID' }
    if (description.length < 12) return { ok: false, code: 'DESCRIPTION_TOO_SHORT' }
    const urgent = ['character-blocked', 'payment-missing', 'harassment', 'critical-security'].includes(category)
    const fingerprint = `ticket-${hash(`${context.actorId || 'anon'}|${category}|${description.toLowerCase()}`)}`
    return { ok: true, ticket: {
      schema: 'tanoth.support.ticket', schemaVersion: 1, ticketId: `dev-${now.toString(36)}-${hash(fingerprint + now)}`,
      environment: 'DEV', status: 'local-draft', category, priority: urgent ? 'urgent-review' : 'normal',
      accountId: 'server-required', characterId: context.actorId || 'anonymous', realmId: context.realmId || 'server-required', sessionId: context.sessionId || 'server-required',
      language, description, diagnostic: input.attachDiagnostic === true ? context.diagnostic || null : null,
      createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), fingerprint, messages: []
    } }
  }

  function allowTicketCreation (tracker = {}, actorId = 'anonymous', now = Date.now()) {
    tracker.ticketTimes ||= {}
    const key = sanitize(actorId, 96) || 'anonymous'
    const recent = (tracker.ticketTimes[key] || []).filter(at => now - at < 10 * 60 * 1000)
    if (recent.length >= 3) return { ok: false, code: 'RATE_LIMITED', retryAfterMs: 10 * 60 * 1000 - (now - recent[0]) }
    recent.push(now); tracker.ticketTimes[key] = recent
    return { ok: true }
  }

  function enqueueTicket (queue, ticket) {
    const next = Array.isArray(queue) ? queue.map(value => ({ ...value })) : []
    const duplicate = next.find(value => value.fingerprint === ticket.fingerprint && !['resolved', 'closed'].includes(value.status))
    if (duplicate) { duplicate.duplicateCount = Math.max(1, Number(duplicate.duplicateCount) || 1) + 1; duplicate.updatedAt = ticket.updatedAt; return next }
    next.unshift({ ...ticket, duplicateCount: 1, transportAttempts: 0, nextAttemptAt: 0 })
    while (next.length > MAX_TICKETS || sizeOf(next) > MAX_TICKET_BYTES) next.pop()
    return next
  }

  function addMessage (ticket, message, now = Date.now()) {
    const body = sanitize(message?.body, 1200)
    if (!ticket || body.length < 2) return { ok: false, code: 'MESSAGE_INVALID' }
    const role = ['player', 'gs', 'gm', 'ai'].includes(message.role) ? message.role : 'player'
    const messages = [...(Array.isArray(ticket.messages) ? ticket.messages : []), { messageId: `msg-${now.toString(36)}-${hash(body + now)}`, ticketId: ticket.ticketId, authorRole: role, body, createdAt: new Date(now).toISOString(), delivery: 'local-only' }].slice(-40)
    return { ok: true, ticket: { ...ticket, messages, status: role === 'player' ? 'player-replied-local' : ticket.status, updatedAt: new Date(now).toISOString() } }
  }

  function safeDiagnostic (state, apiVersion = 1) {
    return {
      apiVersion,
      schemaVersion: finite(state?.schemaVersion),
      player: { level: finite(state?.player?.level), prestige: finite(state?.player?.prestige), dead: state?.player?.dead === true, downed: state?.player?.downed === true },
      world: { zone: sanitize(state?.world?.zone?.name || state?.world?.zone || '', 80), map: sanitize(state?.world?.map?.name || state?.world?.map || '', 80), weather: sanitize(state?.world?.weather, 32) },
      performance: { fps: finite(state?.performance?.fps), quality: sanitize(state?.performance?.quality, 24), renderScale: finite(state?.performance?.renderScale) }
    }
  }

  function answerFromKnowledge (question, articles, environment = 'DEV') {
    const safeQuestion = sanitize(question, 600)
    if (looksLikePromptInjection(safeQuestion)) return { kind: 'handoff', confidence: 0, answer: 'Cette demande contient des instructions qui ne font pas partie de la question de support. Je ne les exécute pas. Un humain peut reprendre le ticket.', citations: [] }
    const tokens = tokenize(safeQuestion)
    const candidates = (Array.isArray(articles) ? articles : []).filter(article => article.status === 'approved' && (article.environment === environment || article.environment === 'BOTH')).map(article => {
      const haystack = tokenize(`${article.title} ${article.keywords?.join(' ') || ''} ${article.body}`)
      const score = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0)
      return { article, score }
    }).sort((a, b) => b.score - a.score)
    const best = candidates[0]
    if (!best || best.score < Math.max(1, Math.ceil(tokens.length * 0.25))) return { kind: 'handoff', confidence: 0, answer: 'Je ne trouve pas de source approuvée assez fiable. Créez ou escaladez un ticket humain au lieu de supposer.', citations: [] }
    return { kind: 'knowledge', confidence: Math.min(1, best.score / Math.max(1, tokens.length)), answer: sanitize(best.article.body, 900), citations: [{ articleId: best.article.articleId, title: best.article.title, version: best.article.version, validatedAt: best.article.validatedAt }] }
  }

  function acceptSecurityIncident (incident) {
    if (!incident || incident.serverValidated !== true || !/^[A-Za-z0-9._-]{8,96}$/.test(String(incident.incidentId || ''))) return { ok: false, code: 'SERVER_VALIDATION_REQUIRED' }
    return { ok: true, incident: { incidentId: String(incident.incidentId), securityEventId: sanitize(incident.securityEventId, 96), auditId: sanitize(incident.auditId, 96), severity: ['HIGH', 'CRITICAL'].includes(incident.severity) ? incident.severity : 'HIGH', status: 'server-validated' } }
  }

  const backoffDelay = attempt => Math.min(15 * 60 * 1000, 5000 * (2 ** Math.max(0, Math.min(8, Number(attempt) || 0))))
  function markOffline (queue, ticketId, now = Date.now()) {
    return (Array.isArray(queue) ? queue : []).map(ticket => ticket.ticketId === ticketId ? { ...ticket, transportAttempts: Math.min(9, Number(ticket.transportAttempts || 0) + 1), nextAttemptAt: now + backoffDelay(ticket.transportAttempts || 0), transportState: 'backend-unavailable' } : { ...ticket })
  }
  function appendAudit (audit, entry) { return [...(Array.isArray(audit) ? audit : []), Object.freeze({ ...entry })] }

  return Object.freeze({ MAX_TICKETS, MAX_TICKET_BYTES, permissionByAction, sensitiveActions, sanitize, sizeOf, hash, tokenize, looksLikePromptInjection, resolveRole, hasPermission, validateStaffCommand, createTicket, allowTicketCreation, enqueueTicket, addMessage, safeDiagnostic, answerFromKnowledge, acceptSecurityIncident, backoffDelay, markOffline, appendAudit })
})()

if (typeof module !== 'undefined' && module.exports) module.exports = TanothSupportCore

if (typeof TanothAddon !== 'undefined') TanothAddon.register({
  async activate (api) {
    if (api.version !== 1 || typeof api.game?.getState !== 'function' || typeof api.storage?.get !== 'function' || typeof api.on !== 'function') throw new Error('Compatibilité Support : API Add-ons 1 incomplète. Prototype arrêté sans bloquer le jeu.')
    const $ = id => document.getElementById(id)
    const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
    const randomId = prefix => { const values = new Uint32Array(2); crypto.getRandomValues(values); return `${prefix}-${Date.now().toString(36)}-${[...values].map(value => value.toString(36)).join('')}` }
    const articles = Object.freeze([
      { articleId: 'kb-addons-001', title: 'Activer et désactiver un add-on', version: '1.0', owner: 'Équipe Support', validatedAt: '2026-09-08', environment: 'BOTH', status: 'approved', compatibleGameVersions: ['54'], keywords: ['addon', 'activer', 'désactiver', 'extension'], body: 'Ouvrez le menu Add-ons, activez l’extension voulue et vérifiez ses dépendances. Pour revenir au jeu normal, désactivez-la : ses panneaux et surcouches doivent disparaître.' },
      { articleId: 'kb-quest-001', title: 'Retrouver une quête et son itinéraire', version: '1.0', owner: 'Équipe Support', validatedAt: '2026-09-08', environment: 'BOTH', status: 'approved', compatibleGameVersions: ['54'], keywords: ['quête', 'direction', 'atlas', 'itinéraire', 'fleche'], body: 'Ouvrez le Journal, suivez une quête possédant des coordonnées puis activez Quest Helper avec Atlas Navigator et Atlas Route Guide. La flèche indique le cap et la distance.' },
      { articleId: 'kb-character-001', title: 'Personnage bloqué', version: '1.0', owner: 'Équipe Support', validatedAt: '2026-09-08', environment: 'BOTH', status: 'approved', compatibleGameVersions: ['54'], keywords: ['bloqué', 'personnage', 'coincé', 'déblocage', 'teleportation'], body: 'Ne supprimez pas le personnage. Revenez au menu principal et relancez la zone. Si le blocage persiste, créez un ticket « personnage bloqué » afin qu’un humain demande une resynchronisation.' },
      { articleId: 'kb-payment-001', title: 'Paiement non livré', version: '1.0', owner: 'Équipe Support Paiement', validatedAt: '2026-09-08', environment: 'LIVE', status: 'approved', compatibleGameVersions: ['54'], keywords: ['paiement', 'crownblood', 'achat', 'livré', 'transaction'], body: 'N’effectuez pas un second achat immédiatement. Conservez l’identifiant de transaction affiché par le fournisseur puis créez un ticket Paiement. Seul le serveur peut confirmer ou compenser une livraison.' }
    ])

    document.body.innerHTML = `<main>
      <header><span class="crest">⚖</span><div><h1>Tanoth Staff & Support</h1><p>Joueur · GS · GM · GS-IA</p></div><div class="clocks"><small id="local-time">LOCAL --:--</small><small>SERVEUR --:--</small></div><b>DEV · HORS LIGNE</b></header>
      <section class="warning"><strong>PROTOTYPE NON AUTORITAIRE</strong><span>Le rôle effectif est Joueur. Les vues GS/GM sont des aperçus et aucune action sensible n’est connectée.</span></section>
      <nav><button data-view="player" class="active">Aide joueur</button><button data-view="tickets">Mes tickets</button><button data-view="gs">Aperçu GS</button><button data-view="gm">Aperçu GM</button><button data-view="settings">Réglages</button></nav>
      <section id="view-player" class="view active">
        <div class="connection"><i></i><span><small>CONNEXION SUPPORT</small><strong>Backend indisponible — file locale uniquement</strong></span><b id="effective-role">JOUEUR</b></div>
        <div class="player-grid"><article><h2>Base de connaissances approuvée</h2><label class="search"><input id="kb-search" placeholder="Quête, add-on, personnage bloqué…"><button id="kb-run">Rechercher</button></label><div id="kb-results"></div></article><article><h2><span class="ai-badge">IA</span> GS-IA locale</h2><div id="ai-chat" class="chat"><p>Posez une question. Je réponds uniquement depuis les articles approuvés.</p></div><form id="ai-form"><input id="ai-question" maxlength="600" placeholder="Votre question"><button>Envoyer</button></form></article></div>
        <button id="open-ticket" class="primary">Créer un ticket humain</button><button id="open-urgent" class="urgent">Urgence</button>
        <form id="ticket-form" class="ticket-form"><label>Catégorie<select id="ticket-category"><option value="gameplay">Gameplay</option><option value="character-blocked">Personnage bloqué</option><option value="payment-missing">Paiement non livré</option><option value="harassment">Harcèlement</option><option value="critical-security">Faille critique</option><option value="launcher">Launcher</option><option value="addons">Add-ons</option></select></label><label>Langue<select id="ticket-language"><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="es">Español</option></select></label><label>Royaume<input value="Indisponible dans l’API v54" readonly></label><label>Personnage<input id="ticket-character" readonly></label><label class="wide">Description<textarea id="ticket-description" maxlength="1400" placeholder="Décrivez le problème sans mot de passe ni donnée privée"></textarea></label><label class="diagnostic wide"><input id="attach-diagnostic" type="checkbox"><span>Joindre volontairement un diagnostic technique anonymisé</span></label><div class="wide actions"><button type="submit">Enregistrer le brouillon local</button><button type="button" id="cancel-ticket">Annuler</button></div><p id="ticket-status" class="wide">Rien ne sera envoyé tant que le backend n’existe pas.</p></form>
      </section>
      <section id="view-tickets" class="view"><div class="ticket-layout"><aside id="ticket-list"></aside><article id="ticket-detail"><p>Sélectionnez un brouillon local.</p></article></div></section>
      <section id="view-gs" class="view staff-preview"><div class="preview-title"><span class="human-badge">HUMAIN</span><div><h2>Console GS — aperçu DEV</h2><p>Données locales de démonstration uniquement</p></div><b>RÔLE NON ACCORDÉ</b></div><div class="queues"><span>Nouveau <b id="gs-new">0</b></span><span>En attente <b>0</b></span><span>Joueur répondu <b id="gs-replied">0</b></span><span>Résolu <b>0</b></span><span>Escaladé <b>0</b></span></div><div id="gs-tickets" class="staff-list"></div><div class="staff-actions"><button disabled>Répondre</button><button disabled>Traduire</button><button disabled>Demander des informations</button><button disabled>Fusionner</button><button disabled>Affecter</button><button disabled>Proposer un déblocage</button></div><p class="locked">Une permission GS signée et vérifiée à chaque action est requise.</p></section>
      <section id="view-gm" class="view staff-preview"><div class="preview-title"><span class="gm-badge">GM</span><div><h2>Console GM — aperçu DEV</h2><p>Incidents, royaumes et audit</p></div><b>NON AUTHENTIFIÉ</b></div><div class="realm-grid"><article><small>ROYAUME</small><strong>Indisponible</strong><span>Aucune donnée serveur</span></article><article><small>INCIDENTS VALIDÉS</small><strong id="gm-incidents">0</strong><span>Sentinel serveur requis</span></article><article><small>AUDIT</small><strong>—</strong><span>Journal append-only requis</span></article></div><div class="staff-actions gm"><button disabled>Observer</button><button disabled>Rejoindre invisible</button><button disabled>Téléporter / débloquer</button><button disabled>Mute temporaire</button><button disabled>Expulser / suspendre</button><button disabled>Ouvrir une enquête</button><button disabled>Maintenance royaume</button><button disabled>Consulter l’audit</button></div><p class="locked">MFA, RBAC serveur, raison, durée, confirmation et audit sont obligatoires. CrownBlood, objets et bannissement définitif exigent un double contrôle humain.</p></section>
      <section id="view-settings" class="view"><h2>Affichage</h2><div class="settings-grid"><label>Touche d’aide<select id="hotkey"><option value="F1">F1</option><option value="F2">F2</option><option value="F3">F3</option></select></label><label>Position souhaitée<select id="position"><option value="right">Droite</option><option value="left">Gauche</option></select></label><label>Échelle<select id="scale"><option value="0.9">90 %</option><option value="1">100 %</option><option value="1.1">110 %</option></select></label><label>Opacité<select id="opacity"><option value="0.82">82 %</option><option value="0.94">94 %</option><option value="1">100 %</option></select></label></div><p>La touche fonctionne lorsque le panneau a le focus. Une touche globale et le déplacement de la fenêtre nécessitent des hooks officiels du jeu.</p><h2>Diagnostic</h2><label class="diagnostic"><input id="diagnostic-consent" type="checkbox"><span>Autoriser la proposition d’un diagnostic anonymisé lors de la création d’un ticket</span></label><button id="save-settings">Enregistrer</button><p id="settings-status"></p></section>
      <footer><span id="session-state">SESSION SUPPORT : ABSENTE</span><span id="queue-state">0 BROUILLON LOCAL</span></footer>
    </main>`

    const sessionId = randomId('local-session')
    const settings = { hotkey: 'F1', position: 'right', scale: 1, opacity: 0.94, diagnosticConsent: false, ...(await api.storage.get('settings') || {}) }
    const storedTickets = await api.storage.get('tickets')
    let tickets = Array.isArray(storedTickets) ? storedTickets : []
    let state = await api.game.getState()
    if (!state?.player) throw new Error('Compatibilité Support : champ player absent. Prototype arrêté sans bloquer le jeu.')
    const saltStored = await api.storage.get('pseudonymSalt'), salt = typeof saltStored === 'string' && saltStored.length >= 16 ? saltStored : randomId('support-salt')
    if (salt !== saltStored) await api.storage.set('pseudonymSalt', salt)
    const actorId = `anon-${TanothSupportCore.hash(`${salt}|${state.identity?.id || state.identity?.tag || 'anonymous'}`)}`
    let authoritativeClaim = null
    let selectedTicketId = ''
    const securityIncidents = []
    const rateTracker = {}
    const removers = []

    const persist = async () => api.storage.set('tickets', tickets)
    const applyVisualSettings = () => { document.documentElement.style.setProperty('--support-scale', settings.scale); document.documentElement.style.setProperty('--support-opacity', settings.opacity) }
    const switchView = view => { document.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === view)); document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`)) }
    const renderTickets = () => {
      $('queue-state').textContent = `${tickets.length} BROUILLON${tickets.length === 1 ? '' : 'S'} LOCAL${tickets.length === 1 ? '' : 'AUX'}`
      $('ticket-list').innerHTML = tickets.map(ticket => `<button data-ticket="${esc(ticket.ticketId)}" class="${ticket.ticketId === selectedTicketId ? 'active' : ''}"><strong>${esc(ticket.category)}</strong><span>${esc(ticket.status)}</span><small>${new Date(ticket.updatedAt).toLocaleString('fr-FR')}</small></button>`).join('') || '<p>Aucun ticket local.</p>'
      document.querySelectorAll('[data-ticket]').forEach(button => { button.onclick = () => { selectedTicketId = button.dataset.ticket; renderTickets() } })
      const selected = tickets.find(ticket => ticket.ticketId === selectedTicketId)
      if (selected) $('ticket-detail').innerHTML = `<header><b>${esc(selected.priority)}</b><code>${esc(selected.ticketId)}</code></header><h2>${esc(selected.category)}</h2><p>${esc(selected.description)}</p><small>${esc(selected.language)} · ${esc(selected.status)} · jamais envoyé</small><div class="messages">${selected.messages.map(message => `<p><b>${esc(message.authorRole)}</b>${esc(message.body)}</p>`).join('')}</div><form id="reply-form"><input id="reply-body" maxlength="1200" placeholder="Répondre dans le brouillon local"><button>Ajouter</button></form><label class="rating">Évaluation locale <select id="rating"><option value="">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>`
      if (selected) {
        $('reply-form').onsubmit = async event => { event.preventDefault(); const result = TanothSupportCore.addMessage(selected, { role: 'player', body: $('reply-body').value }); if (!result.ok) return; tickets = tickets.map(ticket => ticket.ticketId === selected.ticketId ? result.ticket : ticket); await persist(); renderTickets() }
        $('rating').value = String(selected.rating || ''); $('rating').onchange = async () => { selected.rating = Number($('rating').value) || null; await persist() }
      } else $('ticket-detail').innerHTML = '<p>Sélectionnez un brouillon local.</p>'
      $('gs-new').textContent = String(tickets.filter(ticket => ticket.status === 'local-draft').length)
      $('gs-replied').textContent = String(tickets.filter(ticket => ticket.status === 'player-replied-local').length)
      $('gs-tickets').innerHTML = tickets.slice(0, 6).map(ticket => `<article><b>${esc(ticket.category)}</b><span>${esc(ticket.language)} · ${esc(ticket.priority)}</span><small>${esc(ticket.ticketId)} · LOCAL DEV</small></article>`).join('') || '<p>Aucun brouillon local à prévisualiser.</p>'
      $('gm-incidents').textContent = String(securityIncidents.length)
    }
    const searchKnowledge = query => {
      const result = TanothSupportCore.answerFromKnowledge(query, articles, 'DEV')
      $('kb-results').innerHTML = result.kind === 'knowledge' ? `<article><strong>${esc(result.citations[0].title)}</strong><small>v${esc(result.citations[0].version)} · validé ${esc(result.citations[0].validatedAt)}</small><p>${esc(result.answer)}</p></article>` : `<p>${esc(result.answer)}</p>`
      return result
    }
    const updateRole = () => { const role = TanothSupportCore.resolveRole(authoritativeClaim); $('effective-role').textContent = role.toUpperCase(); $('session-state').textContent = role === 'player' ? 'SESSION SUPPORT : ABSENTE' : `SESSION SUPPORT : ${role.toUpperCase()} VÉRIFIÉE` }

    document.querySelectorAll('[data-view]').forEach(button => { button.onclick = () => switchView(button.dataset.view) })
    $('kb-run').onclick = () => searchKnowledge($('kb-search').value)
    $('kb-search').onkeydown = event => { if (event.key === 'Enter') { event.preventDefault(); searchKnowledge($('kb-search').value) } }
    $('ai-form').onsubmit = event => { event.preventDefault(); const question = $('ai-question').value, result = searchKnowledge(question); $('ai-chat').innerHTML += `<p class="user"><b>JOUEUR</b>${esc(TanothSupportCore.sanitize(question, 600))}</p><p class="assistant"><b>GS-IA LOCALE</b>${esc(result.answer)}${result.citations.length ? `<small>Source : ${esc(result.citations[0].title)} · v${esc(result.citations[0].version)}</small>` : '<small>Transfert humain recommandé</small>'}</p>`; $('ai-question').value = ''; $('ai-chat').scrollTop = $('ai-chat').scrollHeight }
    const openTicket = urgent => { $('ticket-form').classList.add('visible'); if (urgent) $('ticket-category').value = 'character-blocked'; $('ticket-description').focus() }
    $('open-ticket').onclick = () => openTicket(false); $('open-urgent').onclick = () => openTicket(true); $('cancel-ticket').onclick = () => $('ticket-form').classList.remove('visible')
    $('ticket-form').onsubmit = async event => {
      event.preventDefault()
      const attachDiagnostic = $('attach-diagnostic').checked
      if (attachDiagnostic && !settings.diagnosticConsent) { $('ticket-status').textContent = 'Autorisez d’abord le diagnostic dans Réglages.'; return }
      const result = TanothSupportCore.createTicket({ category: $('ticket-category').value, language: $('ticket-language').value, description: $('ticket-description').value, attachDiagnostic }, { actorId, realmId: 'server-required', sessionId, diagnostic: TanothSupportCore.safeDiagnostic(state, api.version) })
      if (!result.ok) { $('ticket-status').textContent = `Brouillon refusé : ${result.code}`; return }
      const allowance = TanothSupportCore.allowTicketCreation(rateTracker, actorId)
      if (!allowance.ok) { $('ticket-status').textContent = 'Limite locale atteinte : réessayez plus tard.'; return }
      tickets = TanothSupportCore.enqueueTicket(tickets, result.ticket); selectedTicketId = result.ticket.ticketId; await persist(); renderTickets(); $('ticket-description').value = ''; $('ticket-form').classList.remove('visible'); switchView('tickets')
    }
    const settingIds = ['hotkey', 'position', 'scale', 'opacity']
    settingIds.forEach(id => { $(id).value = String(settings[id]) }); $('diagnostic-consent').checked = settings.diagnosticConsent === true
    $('save-settings').onclick = async () => { for (const id of settingIds) settings[id] = ['scale', 'opacity'].includes(id) ? Number($(id).value) : $(id).value; settings.diagnosticConsent = $('diagnostic-consent').checked; await api.storage.set('settings', settings); applyVisualSettings(); $('settings-status').textContent = 'Réglages locaux enregistrés.' }
    document.addEventListener('keydown', event => { if (event.key === settings.hotkey) { event.preventDefault(); switchView('player'); $('kb-search').focus() } })
    removers.push(api.on('state', value => { state = value }))
    removers.push(api.on('support:session', claim => { authoritativeClaim = claim?.verifiedByGame === true ? claim : null; updateRole() }))
    removers.push(api.on('support:security-incident', incident => { const accepted = TanothSupportCore.acceptSecurityIncident(incident); if (!accepted.ok) return; securityIncidents.unshift(accepted.incident); securityIncidents.splice(20); renderTickets() }))
    $('ticket-character').value = state.identity?.tag || state.identity?.name || 'Personnage actif'
    const clockTimer = setInterval(() => { $('local-time').textContent = `LOCAL ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` }, 1000)
    document.body.dataset.clockTimer = String(clockTimer)
    applyVisualSettings(); updateRole(); renderTickets(); searchKnowledge('activer addon')
    await api.ui.setTitle('Tanoth Staff & Support — Prototype DEV')
    await api.ui.show()
    globalThis.__tanothSupportCleanup = () => { clearInterval(clockTimer); removers.forEach(remove => { try { remove() } catch {} }) }
  },
  deactivate () { globalThis.__tanothSupportCleanup?.(); delete globalThis.__tanothSupportCleanup }
})
