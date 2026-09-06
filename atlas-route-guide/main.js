'use strict'

TanothAddon.register({
  async activate (api) {
    const $ = id => document.getElementById(id)
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
    const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0
    const cardinalNames = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest']
    let state = await api.game.getState()
    let route = state?.navigation?.atlas || null
    let arrivalNotified = false

    document.body.innerHTML = `<main>
      <header><div><span>ATLAS</span><strong>GUIDE DE TERRAIN</strong></div><button id="guide-open" title="Ouvrir Atlas Navigator">CARTE</button></header>
      <section id="guide-content"></section>
      <footer><i></i><span id="guide-link">Connexion à Atlas Navigator…</span><button id="guide-clear" title="Arrêter le guidage">ARRÊTER</button></footer>
    </main>`

    const playerPosition = () => state?.player?.position || { x: 0, z: 0, rotation: 0 }
    const target = () => route?.enabled === false ? null : route?.destination || null
    const formatDistance = value => value < 1000 ? `${Math.round(value)} m` : `${(value / 1000).toFixed(value < 10000 ? 1 : 0)} km`
    const formatTime = seconds => seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.ceil(seconds / 60)} min` : `${(seconds / 3600).toFixed(1)} h`

    function direction (destination) {
      const position = playerPosition(), dx = finite(destination.x) - finite(position.x), dz = finite(destination.z) - finite(position.z), distance = Math.hypot(dx, dz), absolute = Math.atan2(dx, dz), relative = Math.atan2(Math.sin(absolute - finite(position.rotation)), Math.cos(absolute - finite(position.rotation))), degrees = (absolute * 180 / Math.PI + 360) % 360, cardinalIndex = Math.round(degrees / 45) % 8
      return { distance, relative: relative * 180 / Math.PI, degrees, cardinal: cardinalNames[cardinalIndex], eta: Math.ceil(distance / 5.5) }
    }

    function assessment (destination) {
      if (!destination || ['region', 'quest', 'custom'].includes(destination.kind)) return { className: 'neutral', label: destination?.kind === 'quest' ? 'OBJECTIF DE QUÊTE' : 'DESTINATION LIBRE' }
      const values = String(destination.level || '').match(/\d+/g)?.map(Number) || [], minimum = values[0] || 1, maximum = values[1] || values[0] || 100, level = Math.max(1, finite(state?.player?.level) || 1)
      if (level + 5 < minimum) return { className: 'danger', label: `DANGER · NIVEAU ${minimum}+` }
      if (level > maximum + 15) return { className: 'easy', label: 'ZONE FACILE' }
      return { className: 'adapted', label: 'NIVEAU ADAPTÉ' }
    }

    function render () {
      const destination = target(), content = $('guide-content'), link = $('guide-link')
      if (!destination || !Number.isFinite(Number(destination.x)) || !Number.isFinite(Number(destination.z))) {
        document.body.className = 'waiting'
        content.innerHTML = `<div class="empty"><div class="seal">⌖</div><strong>Aucun itinéraire actif</strong><p>Choisissez une région, une zone, une quête ou des coordonnées dans <b>Atlas Navigator</b>.</p></div>`
        link.textContent = route ? 'Itinéraire Atlas terminé' : 'En attente d’Atlas Navigator'
        $('guide-clear').disabled = true
        arrivalNotified = false
        return
      }
      const guide = direction(destination), arrived = guide.distance <= 25, risk = assessment(destination), hostile = destination.faction && destination.faction !== 'neutral' && destination.faction !== state?.identity?.faction
      document.body.className = `${arrived ? 'arrived' : ''} ${hostile ? 'hostile' : ''} ${risk.className}`
      content.innerHTML = `<div class="compass"><div class="ticks"></div><i style="--turn:${guide.relative}deg"></i><b>${String(Math.round(guide.degrees)).padStart(3, '0')}°</b><small>${esc(guide.cardinal)}</small></div><div class="destination"><span>${arrived ? 'DESTINATION ATTEINTE' : destination.kind === 'quest' ? 'QUÊTE SUIVIE' : 'DESTINATION'}</span><h2>${esc(destination.name)}</h2><p>${esc(destination.regionName || 'Monde de Tanoth')} · ${esc(destination.factionName || 'Toutes factions')}</p><div class="metrics"><strong>${formatDistance(guide.distance)}</strong><em>≈ ${formatTime(guide.eta)}</em><code>X ${Math.round(finite(destination.x))} · Z ${Math.round(finite(destination.z))}</code></div><div class="risk ${risk.className}">${risk.label}${hostile ? ' · TERRITOIRE ADVERSE' : ''}</div></div>`
      link.textContent = `Synchronisé avec Atlas · ${new Date(finite(route?.updatedAt) || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      $('guide-clear').disabled = false
      if (arrived && !arrivalNotified) { arrivalNotified = true; api.ui.notify(`Destination atteinte : ${destination.name}`) }
      if (!arrived) arrivalNotified = false
    }

    $('guide-open').onclick = async () => {
      try { await api.game.action('openAddon', { id: 'atlas-navigator' }) } catch { api.ui.notify('Ouvrez Atlas Navigator depuis le gestionnaire d’add-ons.') }
    }
    $('guide-clear').onclick = async () => {
      try { await api.game.action('publishAtlasRoute', { enabled: false }) } catch {}
      route = null; render()
    }
    api.on('atlas:route', value => { route = value || null; render() })
    api.on('state', value => { state = value; if (value?.navigation && Object.prototype.hasOwnProperty.call(value.navigation, 'atlas')) route = value.navigation.atlas; render() })

    render()
    await api.ui.setTitle('Atlas Route Guide — Navigation')
    await api.ui.show()
  }
})
