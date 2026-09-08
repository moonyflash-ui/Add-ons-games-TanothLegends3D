'use strict'

TanothAddon.register({
  async activate (api) {
    const $ = id => document.getElementById(id)
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
    const percent = (value, maximum) => Math.max(0, Math.min(100, (Number(value) || 0) / Math.max(1, Number(maximum) || 1) * 100))
    const duration = milliseconds => { const total = Math.max(0, Math.ceil((Number(milliseconds) || 0) / 1000)), days = Math.floor(total / 86400), hours = Math.floor(total % 86400 / 3600), minutes = Math.floor(total % 3600 / 60), seconds = total % 60; return days ? `${days}j ${String(hours).padStart(2, '0')}h` : hours ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` }
    let state = await api.game.getState()
    let current = { position: 'right-center', compact: false, showRifts: true, showDeathPortals: true, showInactive: true, showTimers: true, scale: 100, opacity: 96, ...(await api.storage.get('settings') || {}) }

    document.body.innerHTML = `<main>
      <header><span class="brand">☠</span><div><h1>Veilleur du Néant</h1><p>Failles et Portes de la Mort</p></div><b>1.0</b></header>
      <section id="preview" aria-label="Aperçu du HUD"></section>
      <section class="settings">
        <label>Position<select id="position"><option value="right-center">Droite — centre</option><option value="left-center">Gauche — centre</option><option value="top-center">Haut — centre</option></select></label>
        <label>Échelle<input id="scale" type="range" min="75" max="120" step="5"><output id="scale-value"></output></label>
        <label>Opacité<input id="opacity" type="range" min="55" max="100" step="5"><output id="opacity-value"></output></label>
        <label><input id="compact" type="checkbox"> Mode compact</label>
        <label><input id="showRifts" type="checkbox"> Afficher les Failles</label>
        <label><input id="showDeathPortals" type="checkbox"> Afficher les Portes</label>
        <label><input id="showInactive" type="checkbox"> Veille hors événement</label>
        <label><input id="showTimers" type="checkbox"> Chronomètres</label>
      </section>
      <div class="actions"><button id="apply">Appliquer le HUD</button><button id="guide">Guider vers l’événement</button><button id="atlas">Ouvrir l’Atlas</button></div>
      <p id="status">Les anciens suivis sont remplacés pendant que cet Add-on est actif.</p>
    </main>`

    const write = value => {
      $('position').value = ['right-center', 'left-center', 'top-center'].includes(value.position) ? value.position : 'right-center'
      for (const id of ['compact', 'showRifts', 'showDeathPortals', 'showInactive', 'showTimers']) $(id).checked = value[id] !== false
      $('compact').checked = value.compact === true
      $('scale').value = String(Math.max(75, Math.min(120, Number(value.scale) || 100)))
      $('opacity').value = String(Math.max(55, Math.min(100, Number(value.opacity) || 96)))
    }
    const read = () => ({ position: $('position').value, compact: $('compact').checked, showRifts: $('showRifts').checked, showDeathPortals: $('showDeathPortals').checked, showInactive: $('showInactive').checked, showTimers: $('showTimers').checked, scale: Number($('scale').value), opacity: Number($('opacity').value) })
    const activeDestination = () => {
      const world = state?.world || {}, invasion = world.voidInvasions?.active, death = world.deathPortals?.active, rift = world.rift
      if (invasion?.target && Number.isFinite(Number(invasion.target.x)) && Number.isFinite(Number(invasion.target.z))) return { id: 'void-event-active', name: invasion.major ? 'Invasion majeure du Néant' : 'Faille du Néant', kind: 'void-event', x: Number(invasion.target.x), z: Number(invasion.target.z), regionName: invasion.target.name || invasion.target.zone || 'Implantation attaquée', faction: invasion.target.faction || 'neutral', factionName: 'Événement du Néant', level: `Vague ${invasion.wave || 1}/${invasion.totalWaves || 1}`, color: invasion.major ? '#ff5579' : '#9f66ed' }
      if (death) { const place = (world.deathPortals?.cemeteries || []).find(entry => entry.id === death.cemeteryId); if (place) return { id: `death-event-${place.id}`, name: place.name || death.cemeteryName || 'Porte de la Mort', kind: 'death-portal', x: Number(place.x), z: Number(place.z), regionName: place.zone || place.region || 'Cimetière', faction: place.faction || death.faction || 'neutral', factionName: 'Portes de la Mort', level: `Vague ${death.wave || 1}/11`, color: '#e35b6a' } }
      if (rift?.active) { const position = state?.player?.position || {}; return { id: 'rift-event-active', name: 'Faille espace-temps', kind: 'rift-event', x: Number(position.x) || 0, z: Number(position.z) || 0, regionName: rift.region || 'Monde de Tanoth', faction: state?.identity?.faction || 'neutral', factionName: 'Faille active', level: `Vague ${rift.wave || 1}/${rift.totalWaves || 4}`, color: '#a86bef' } }
      return null
    }
    const renderPreview = () => {
      const now = Date.now(), world = state?.world || {}, invasion = world.voidInvasions?.active, rift = world.rift?.active ? world.rift : null, death = world.deathPortals?.active, cards = []
      if (current.showRifts && (invasion || rift || current.showInactive)) {
        const active = invasion || rift
        cards.push(active ? `<article class="event-card rift active"><i>${active.major ? '☄' : '✦'}</i><div><strong>${esc(active.major ? 'Invasion majeure' : invasion ? 'Faille du Néant' : 'Faille espace-temps')}</strong><small>${esc(invasion ? active.target?.name || 'Implantation attaquée' : active.region || 'Tanoth')}</small><span>Vague ${Number(active.wave) || 1}/${Number(active.totalWaves) || (invasion ? 1 : 4)} · ${Number(active.kills) || 0}/${Number(active.required) || 1}</span><em><u style="width:${percent(active.kills, active.required)}%"></u></em></div></article>` : `<article class="event-card rift"><i>✦</i><div><strong>Failles en veille</strong><small>${current.showTimers && world.voidInvasions?.nextMinorAt ? `Prochaine : ${duration(world.voidInvasions.nextMinorAt - now)}` : 'Aucune Faille active'}</small></div></article>`)
      }
      if (current.showDeathPortals && (death || current.showInactive)) cards.push(death ? `<article class="event-card death active"><i>☠</i><div><strong>${esc(death.cemeteryName || 'Porte de la Mort')}</strong><small>Vague ${Number(death.wave) || 1}/11 · ${Number(death.kills) || 0}/${Number(death.required) || 1}</small><span>${current.showTimers ? `Rotation : ${duration((Number(death.expiresAt) || now) - now)}` : ''}</span><em><u style="width:${percent(death.kills, death.required)}%"></u></em></div></article>` : `<article class="event-card death"><i>☠</i><div><strong>Portes en veille</strong><small>${current.showTimers && world.deathPortals?.nextActivationAt ? `Prochaine : ${duration(world.deathPortals.nextActivationAt - now)}` : 'Aucune Porte active'}</small></div></article>`)
      $('preview').innerHTML = cards.join('') || '<p>Aucun suivi sélectionné.</p>'
      $('preview').classList.toggle('compact', current.compact)
      $('scale-value').textContent = `${current.scale}%`
      $('opacity-value').textContent = `${current.opacity}%`
      $('guide').disabled = !activeDestination()
    }
    const apply = async () => {
      current = read()
      await api.storage.set('settings', current)
      await api.game.action('applyEventSentinelHud', { enabled: true, ...current })
      renderPreview()
      $('status').textContent = `HUD ${current.compact ? 'compact' : 'détaillé'} · ${current.position.replace('-', ' ')} · anciens suivis remplacés.`
    }
    const guide = async () => {
      const destination = activeDestination()
      if (!destination) return api.ui.notify('Aucun événement actif à rejoindre.')
      await api.game.action('publishAtlasRoute', { enabled: true, destination })
      await api.game.action('openAddon', { id: 'atlas-navigator' })
    }

    write(current)
    document.querySelectorAll('input, select').forEach(input => { input.onchange = () => { current = read(); renderPreview() } })
    $('apply').onclick = () => apply().catch(error => { $('status').textContent = error.message })
    $('guide').onclick = () => guide().catch(error => { $('status').textContent = error.message })
    $('atlas').onclick = () => api.game.action('openAddon', { id: 'atlas-navigator' }).catch(error => { $('status').textContent = error.message })
    api.on('state', value => { state = value; renderPreview() })
    setInterval(renderPreview, 1000)
    await apply()
    await api.ui.setTitle('Veilleur du Néant — HUD des événements')
    await api.ui.show()
  },
  async deactivate (api) {
    await api.game.action('applyEventSentinelHud', { enabled: false }).catch(() => {})
    await api.game.action('publishAtlasRoute', { enabled: false }).catch(() => {})
  }
})
