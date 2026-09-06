'use strict'

TanothAddon.register({
  async activate (api) {
    let state = null, selected = '', mode = await api.storage.get('mode') || 'profitable', lastRouteSignature = ''
    document.body.innerHTML = `<main><header><span>➤</span><div><h1>Quest Helper</h1><small>Suivez la flèche, récoltez les meilleures récompenses</small></div></header><nav><button data-mode="profitable">Plus rentable</button><button data-mode="nearest">Plus proche</button><button data-mode="tracked">Déjà suivie</button></nav><section id="recommendation"></section><div id="quests" class="quests"></div><p id="status">Analyse des quêtes actives…</p></main>`
    const n = value => Number(value) || 0
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
    const score = quest => { const p = state?.player?.position || {}, l = quest.location || {}, r = quest.reward || {}, total = Math.max(1, n(quest.target?.count)), done = Math.max(0, n(quest.progress)), remaining = Math.max(1, total - done), distance = Number.isFinite(Number(l.x)) ? Math.hypot(n(l.x) - n(p.x), n(l.z) - n(p.z)) : 9999, value = n(r.xp) + n(r.gold) * 2 + n(r.gems) * 80 + n(r.reputation) * 2 + n(r.alliancePoints) * 3 + n(r.darkMarks) * 5 + (r.item ? 500 : 0), eta = Math.ceil(distance / 5.5); return { distance, value, remaining, progress: Math.min(100, done / total * 100), eta, rating: mode === 'nearest' ? -distance : value / (remaining * 1.7 + distance / 180 + 1) } }
    const recommendation = active => { const ordered = active.slice().sort((a, b) => score(b).rating - score(a).rating); return { ordered, recommended: selected ? active.find(quest => quest.id === selected) || ordered[0] : mode === 'tracked' ? active.find(quest => quest.id === state?.quests?.waypointId) || active.find(quest => quest.tracked) || ordered[0] : ordered[0] } }
    const publishRoute = async quest => {
      const location = quest?.location || {}, hasCoordinates = Number.isFinite(Number(location.x)) && Number.isFinite(Number(location.z))
      const signature = hasCoordinates ? `${quest.id}:${location.x}:${location.z}:${n(quest.progress)}:${n(quest.target?.count)}` : ''
      if (signature === lastRouteSignature) return
      const hadRoute = Boolean(lastRouteSignature); lastRouteSignature = signature
      try {
        if (!hasCoordinates) { if (hadRoute) await api.game.action('publishAtlasRoute', { enabled: false }); return }
        await api.game.action('publishAtlasRoute', { enabled: true, destination: { id: `quest-${String(quest.id || 'objective').replace(/[^a-zA-Z0-9._-]/g, '-')}`, name: quest.name || 'Objectif de quête', kind: 'quest', x: Number(location.x), z: Number(location.z), regionName: location.zone || location.region || 'Objectif de quête', faction: location.faction || 'neutral', factionName: location.factionName || 'Itinéraire de quête', level: `${Math.floor(n(quest.progress))}/${Math.max(1, Math.floor(n(quest.target?.count)))}`, color: '#62e8f2' } })
      } catch { /* Le panneau de quête reste utilisable sur une ancienne version du jeu. */ }
    }
    const apply = async questId => { selected = questId || ''; await api.storage.set('mode', mode); await api.game.action('applyQuestHelper', { enabled: true, mode, questId: selected }); render() }
    const render = () => {
      document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode))
      const active = state?.quests?.active || [], { ordered, recommended } = recommendation(active)
      const rec = document.getElementById('recommendation'); if (recommended) { const s = score(recommended), eta = s.eta < 60 ? `${s.eta} s` : `${Math.ceil(s.eta / 60)} min`; rec.innerHTML = `<strong>${esc(recommended.name)}</strong><span>${Math.round(s.distance)} m · ${eta} · ${esc(recommended.target?.label || 'Objectif')}</span><i class="rec-progress"><i style="width:${s.progress}%"></i></i><b>${mode === 'profitable' ? `RENDEMENT ${Math.max(0, Math.round(s.rating))}` : mode === 'nearest' ? 'PLUS PROCHE' : 'SUIVIE'}</b>` } else rec.innerHTML = '<strong>Aucune quête active</strong><span>Acceptez une quête dans le Journal.</span>'
      document.getElementById('quests').innerHTML = ordered.slice(0, 8).map((quest, index) => { const s = score(quest), reward = quest.reward || {}, eta = s.eta < 60 ? `${s.eta} s` : `${Math.ceil(s.eta / 60)} min`; return `<button data-quest="${esc(quest.id)}" class="${recommended?.id === quest.id ? 'selected' : ''}"><em>${index + 1}</em><span><strong>${esc(quest.name)}</strong><small>${Math.floor(n(quest.progress))}/${Math.max(1, Math.floor(n(quest.target?.count)))} · ${Math.round(s.distance)} m (${eta}) · ${n(reward.xp)} XP · ${n(reward.gold)} or · R${Math.max(0, Math.round(s.rating))}</small></span><b>➤</b></button>` }).join('')
      document.querySelectorAll('[data-quest]').forEach(button => { button.onclick = () => apply(button.dataset.quest) })
      document.getElementById('status').textContent = active.length ? `${active.length} quête(s) analysée(s) · trajet synchronisé avec Atlas.` : 'Aucune quête disponible à guider.'
      publishRoute(recommended)
    }
    document.querySelectorAll('[data-mode]').forEach(button => { button.onclick = () => { mode = button.dataset.mode; selected = ''; apply('') } })
    api.on('state', value => { state = value; render() })
    state = await api.game.getState(); await apply(''); await api.ui.setTitle('Quest Helper — Direction'); await api.ui.show()
  },
  async deactivate (api) {
    await api.game.action('applyQuestHelper', { enabled: false }).catch(() => {})
    await api.game.action('publishAtlasRoute', { enabled: false }).catch(() => {})
  }
})
