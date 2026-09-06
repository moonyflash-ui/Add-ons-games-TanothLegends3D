'use strict'

TanothAddon.register({
  async activate (api) {
    const rawLands = [
      {
        id: 'supercontinent-violet', name: 'Supercontinent Boréal', faction: 'violet', factionName: 'Arcanes Violettes', color: '#a66cf0',
        path: 'M58 95 C105 42 215 42 282 92 C326 126 310 186 335 226 C362 271 321 317 294 350 C256 399 225 474 142 455 C74 439 79 369 47 328 C12 282 32 231 48 191 C65 151 28 130 58 95 Z',
        regions: [
          ['couronne-boreale', 'Couronne Boréale', 158, 126, [['marche-gelee', 'Marche Gelée', '1–35', 40, -560, 'zone'], ['cretes-geants', 'Crêtes des Géants', '45–75', -1500, -1180, 'zone'], ['haut-givre', 'Forteresse de Haut-Givre', '35–70', -1540, -520, 'capitale'], ['croisee-loup', 'Croisée du Loup', '1–25', 30, -430, 'village']]],
          ['sylves-arcanes', 'Sylves Arcanes', 116, 284, [['mireveil', 'Mireveil', '15–40', -430, 420, 'village'], ['marais-lune', 'Marais-de-Lune', '35–65', -1280, 1180, 'village'], ['marais-ombre', 'Marais d’Ombre', '35–60', -520, 530, 'zone'], ['bois-croc-vert', 'Bois de Croc-Vert', '1–20', -210, 80, 'zone']]],
          ['domaine-astral', 'Domaine Astral', 245, 365, [['fleche-violette', 'Flèche Violette', '1–100', 80, 690, 'capitale'], ['port-astral-lyr', 'Port Astral de Lyr', '30–80', 1320, 1480, 'capitale'], ['rivieres-arcaniques', 'Rivières Arcaniques', '20–55', 480, 1120, 'zone'], ['confins-neant', 'Confins du Néant', '85–100+', -1160, 1570, 'zone']]],
          ['hautes-cimes-obscuria', 'Hautes Cimes d’Obscuria', 235, 186, [['noctegivre', 'Noctegivre', '35–80', -2220, -1450, 'ville'], ['pics-obscuria', 'Pics d’Obscuria', '40–85', -2050, -1740, 'zone'], ['vallee-revenants', 'Vallée des Revenants', '55–95', -1800, -1450, 'zone'], ['mines-givre', 'Mines du Givre', '30–75', -2220, -1180, 'zone']]],
          ['marches-nox', 'Marches de Nox', 206, 430, [['sombrepin', 'Sombrepin', '20–60', -2140, -380, 'village'], ['landes-voile', 'Landes du Voile', '35–75', -2050, -680, 'zone'], ['sanctuaire-corbeaux', 'Sanctuaire des Corbeaux', '50–90', -1850, -880, 'zone'], ['lisiere-nocturne', 'Lisière Nocturne', '25–65', -1700, -480, 'zone']]]
        ]
      },
      {
        id: 'island-yellow', name: 'Grande Île de Soléor', faction: 'jaune', factionName: 'Ordre Solaire', color: '#f0ca55',
        path: 'M416 120 C460 77 543 76 597 111 C633 135 642 184 628 224 C613 268 640 308 608 346 C575 384 508 400 459 371 C418 347 426 302 396 270 C365 236 370 169 416 120 Z',
        regions: [
          ['grandes-plaines-solaires', 'Grandes Plaines Solaires', 500, 153, [['champs-soleor', 'Champs de Soléor', '1–35', 1146, -734, 'zone'], ['fermes-aurees', 'Fermes Aurées', '5–30', 980, -520, 'zone'], ['lisiere-solaire', 'Lisière Solaire', '18–45', 1320, -560, 'zone'], ['lac-soleor', 'Lac de Soléor', '8–35', 1260, -920, 'zone']]],
          ['marches-aurore', 'Marches de l’Aurore', 443, 265, [['village-aurore', 'Village de l’Aurore', '10–40', 470, -520, 'village'], ['rive-argent', 'Rive-d’Argent', '35–70', 1560, -720, 'village'], ['bastion-solaire', 'Bastion Solaire', '1–100', 610, -260, 'capitale'], ['moulin-soleor', 'Moulin de Soléor', '12–45', 820, -440, 'village']]],
          ['etoiles-mortes', 'Terres des Étoiles', 551, 321, [['chute-etoile', 'Chute-d’Étoile', '40–75', 320, -1880, 'village'], ['champs-etoiles-mortes', 'Champs des Étoiles Mortes', '60–90', 520, -1830, 'zone'], ['rives-astrales', 'Rives Astrales', '45–80', 720, -1680, 'zone'], ['observatoire-levant', 'Observatoire du Levant', '70–100', 610, -2050, 'ville']]],
          ['desert-aube', 'Désert de l’Aube', 570, 235, [['qasr-soleil', 'Qasr-Soleil', '25–75', 1670, -950, 'ville'], ['oasis-verre', 'Oasis de Verre', '20–60', 1180, -1450, 'village'], ['dunes-verre', 'Dunes de Verre', '25–65', 1460, -1430, 'zone'], ['necropole-solaire', 'Nécropole Solaire', '55–95', 1730, -1550, 'zone']]],
          ['cote-caravanes', 'Côte des Caravanes', 500, 370, [['port-levant', 'Port du Levant', '30–70', 1880, -450, 'ville'], ['route-epices', 'Route des Épices', '25–65', 1700, -700, 'zone'], ['falaises-sel', 'Falaises de Sel', '45–85', 2070, -720, 'zone'], ['havre-caravanes', 'Havre des Caravanes', '35–75', 1960, -950, 'village']]]
        ]
      },
      {
        id: 'supercontinent-red', name: 'Supercontinent Écarlate', faction: 'rouge', factionName: 'Orbe Écarlate', color: '#dd5963',
        path: 'M704 80 C760 38 859 48 924 89 C982 126 964 190 947 235 C928 285 988 323 957 384 C929 438 855 424 808 464 C764 502 692 462 687 407 C683 356 642 328 659 278 C674 232 636 185 668 139 C681 119 687 94 704 80 Z',
        regions: [
          ['terres-legion', 'Terres de la Légion', 778, 126, [['frontiere-ecarlate', 'Frontière Écarlate', '1–35', -734, 886, 'zone'], ['collines-rouges', 'Collines Rouges', '10–25', 240, 250, 'zone'], ['gue-cendres', 'Gué des Cendres', '15–45', 310, 130, 'village'], ['camp-hache-brisee', 'Camp de la Hache Brisée', '12–35', 0, 420, 'camp']]],
          ['cote-braises', 'Côte des Braises', 891, 267, [['cote-incendiee', 'Côte Incendiée', '70–100', 1770, 260, 'zone'], ['baie-braises', 'Baie des Braises', '45–80', 1840, 420, 'village'], ['citadelle-tanoth', 'Citadelle de Tanoth', '1–100', -520, -340, 'capitale'], ['riviere-braises', 'Rivière des Braises', '35–75', 1450, 120, 'zone']]],
          ['terres-draconiques', 'Terres Draconiques', 760, 380, [['desolation-dragon', 'Désolation du Dragon', '55–100', 610, 520, 'zone'], ['pins-noirs', 'Pins-Noirs', '30–65', -1180, -940, 'village'], ['nids-scories', 'Nids des Scories', '70–100', 880, 760, 'zone'], ['hauts-draconiques', 'Hauts Draconiques', '65–100+', 580, 950, 'zone']]],
          ['desert-rouge', 'Désert Rouge', 865, 190, [['bastion-dunes-sanglantes', 'Bastion des Dunes Sanglantes', '45–90', -1700, 900, 'ville'], ['mer-cendres', 'Mer de Cendres', '45–90', -1710, 940, 'zone'], ['dunes-sanglantes', 'Dunes Sanglantes', '40–85', -1510, 780, 'zone'], ['forges-sirocco', 'Forges du Sirocco', '60–100', -1880, 1120, 'ville']]],
          ['marches-sauvages', 'Marches Sauvages', 720, 315, [['fer-sec', 'Fer-Sec', '30–70', -1140, 760, 'village'], ['vallee-betes', 'Vallée des Bêtes', '35–80', -1260, 590, 'zone'], ['col-griffon', 'Col du Griffon', '40–85', 780, 1810, 'village'], ['vieux-chene', 'Vieux-Chêne', '20–60', -1850, 280, 'village']]]
        ]
      }
    ]

    const offsets = [[-13, -10], [13, -9], [-12, 13], [14, 14]]
    const lands = rawLands.map(land => ({
      ...land,
      regions: land.regions.map(region => ({
        id: region[0], name: region[1], mapX: region[2], mapY: region[3], faction: land.faction, factionName: land.factionName, color: land.color, landId: land.id,
        zones: region[4].map((zone, index) => ({ id: zone[0], name: zone[1], level: zone[2], x: zone[3], z: zone[4], kind: zone[5], mapX: region[2] + offsets[index][0], mapY: region[3] + offsets[index][1], regionId: region[0], regionName: region[1], faction: land.faction, factionName: land.factionName, color: land.color, landId: land.id }))
      }))
    }))
    const regions = lands.flatMap(land => land.regions).map(region => {
      const x = region.zones.reduce((sum, zone) => sum + zone.x, 0) / region.zones.length
      const z = region.zones.reduce((sum, zone) => sum + zone.z, 0) / region.zones.length
      return { ...region, x, z, kind: 'region', level: region.zones.map(zone => zone.level).join(' · ') }
    })
    const zones = lands.flatMap(land => land.regions.flatMap(region => region.zones))
    const destinations = [...regions, ...zones]
    const $ = id => document.getElementById(id)
    const clean = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
    const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0))
    const factionLabel = { violet: 'Arcanes Violettes', jaune: 'Ordre Solaire', rouge: 'Orbe Écarlate' }
    let state = await api.game.getState()
    let selectedId = String(await api.storage.get('destination') || '')
    let filter = String(await api.storage.get('faction') || 'all')
    let zoom = clamp(await api.storage.get('zoom') || 1, 0.7, 4.5)
    let panX = 0; let panY = 0; let dragging = false; let moved = false; let dragX = 0; let dragY = 0; let arrivalNotified = false

    document.body.innerHTML = `<main>
      <header><button id="atlas-list" title="Rechercher un lieu">☰</button><label><span>⌕</span><input id="atlas-search" placeholder="Région, zone, capitale…" autocomplete="off"></label><button id="atlas-minus" title="Dézoomer">−</button><output id="atlas-zoom">100%</output><button id="atlas-plus" title="Zoomer">+</button><button id="atlas-reset" title="Recentrer">⌂</button></header>
      <nav id="atlas-factions"><button data-faction="all">Tout</button><button data-faction="violet">Violet</button><button data-faction="jaune">Jaune</button><button data-faction="rouge">Rouge</button></nav>
      <section id="atlas-viewport" aria-label="Carte détaillée de Tanoth"><div id="atlas-plane"><svg id="atlas-map" viewBox="0 0 1000 540" role="img" aria-label="15 régions et 60 zones"></svg></div><div id="atlas-compass"><b>N</b><i></i></div><div id="atlas-scale">Glissez pour déplacer · Molette pour zoomer</div></section>
      <aside id="atlas-results"></aside>
      <section id="atlas-route"><div class="empty"><strong>Choisissez une destination</strong><span>La navigation fonctionne vers les trois factions.</span></div></section>
      <footer><span><b>15</b> régions</span><span><b>60</b> zones</span><span id="atlas-current">Position en attente…</span></footer>
    </main>`

    const destination = () => destinations.find(entry => entry.id === selectedId) || null
    const playerPosition = () => state?.player?.position || { x: 0, z: 0, rotation: 0 }
    const nearestZone = () => { const position = playerPosition(); return zones.slice().sort((a, b) => Math.hypot(a.x - Number(position.x || 0), a.z - Number(position.z || 0)) - Math.hypot(b.x - Number(position.x || 0), b.z - Number(position.z || 0)))[0] }
    const currentName = () => {
      const world = state?.world || {}, value = world.zone?.name || world.zone || world.map?.zone || world.map?.name
      return typeof value === 'string' && value ? value : nearestZone()?.name || 'Monde de Tanoth'
    }
    const formatDistance = value => value < 1000 ? `${Math.round(value)} m` : `${(value / 1000).toFixed(value < 10000 ? 1 : 0)} km`
    const direction = target => {
      const position = playerPosition(), dx = Number(target.x) - Number(position.x || 0), dz = Number(target.z) - Number(position.z || 0), distance = Math.hypot(dx, dz), absolute = Math.atan2(dx, dz), relative = Math.atan2(Math.sin(absolute - Number(position.rotation || 0)), Math.cos(absolute - Number(position.rotation || 0))), degrees = (absolute * 180 / Math.PI + 360) % 360, cardinal = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(degrees / 45) % 8]
      return { distance, relative: relative * 180 / Math.PI, degrees, cardinal, eta: Math.ceil(distance / 5.5) }
    }

    function mapMarkup () {
      const current = nearestZone(), selected = destination()
      return `<defs>${lands.map(land => `<linearGradient id="land-${land.id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${land.color}" stop-opacity=".9"/><stop offset="1" stop-color="#15202a"/></linearGradient>`).join('')}</defs><rect width="1000" height="540" class="sea"/>${lands.map(land => {
        const hidden = filter !== 'all' && filter !== land.faction
        return `<g class="territory faction-${land.faction}${hidden ? ' filtered' : ''}"><path class="land" d="${land.path}" fill="url(#land-${land.id})"/><text class="land-name" x="${land.faction === 'violet' ? 178 : land.faction === 'jaune' ? 510 : 816}" y="${land.faction === 'jaune' ? 215 : 225}">${esc(land.name)}</text>${land.regions.map(region => `<g class="region-marker${selected?.id === region.id ? ' selected' : ''}" data-destination="${region.id}"><circle cx="${region.mapX}" cy="${region.mapY}" r="8" style="--color:${land.color}"/><text x="${region.mapX}" y="${region.mapY + 20}">${esc(region.name)}</text></g>${region.zones.map(zone => `<g class="zone-marker${selected?.id === zone.id ? ' selected' : ''}${current?.id === zone.id ? ' current' : ''}" data-destination="${zone.id}"><circle cx="${zone.mapX}" cy="${zone.mapY}" r="4" style="--color:${land.color}"/><text x="${zone.mapX}" y="${zone.mapY + 11}">${esc(zone.name)}</text></g>`).join('')}`).join('')}</g>`
      }).join('')}<g class="landmark" data-destination="domaine-astral"><path d="M510 459 l13 13 -13 13 -13-13z"/><text x="510" y="502">Cité perdue de l’Empyrius</text></g>${current ? `<g class="player-marker"><circle cx="${current.mapX}" cy="${current.mapY}" r="10"/><path d="M${current.mapX} ${current.mapY - 14} l6 15 -6 -4 -6 4z"/></g>` : ''}`
    }

    function applyTransform () {
      $('atlas-plane').style.transform = `translate(${panX}px,${panY}px) scale(${zoom})`
      $('atlas-zoom').textContent = `${Math.round(zoom * 100)}%`
      document.body.classList.toggle('atlas-detail', zoom >= 1.35)
    }

    function bindMap () {
      $('atlas-map').querySelectorAll('[data-destination]').forEach(node => { node.onclick = event => { event.stopPropagation(); if (!moved) selectDestination(node.dataset.destination, true) } })
    }

    function renderMap () { $('atlas-map').innerHTML = mapMarkup(); bindMap(); applyTransform() }

    function renderResults () {
      const query = clean($('atlas-search').value), panel = $('atlas-results')
      const list = destinations.filter(entry => (filter === 'all' || entry.faction === filter) && (!query || clean(`${entry.name} ${entry.regionName || ''} ${entry.factionName}`).includes(query))).sort((a, b) => (a.kind === 'region' ? -1 : 0) - (b.kind === 'region' ? -1 : 0) || a.name.localeCompare(b.name, 'fr')).slice(0, 30)
      panel.innerHTML = `<div class="result-head"><strong>${query ? 'Résultats' : 'Destinations'}</strong><span>${list.length}${list.length === 30 ? '+' : ''}</span></div>${list.map(entry => `<button data-result="${entry.id}" style="--color:${entry.color}"><i></i><span><strong>${esc(entry.name)}</strong><small>${entry.kind === 'region' ? 'Région' : esc(entry.regionName)} · ${esc(factionLabel[entry.faction])}</small></span><b>${entry.kind === 'region' ? 'RÉGION' : `N. ${esc(entry.level)}`}</b></button>`).join('') || '<p>Aucun lieu trouvé.</p>'}`
      panel.querySelectorAll('[data-result]').forEach(button => { button.onclick = () => selectDestination(button.dataset.result, true) })
    }

    async function selectDestination (id, center = false) {
      selectedId = String(id || '')
      arrivalNotified = false
      await api.storage.set('destination', selectedId)
      $('atlas-results').classList.remove('open')
      if (center) centerDestination()
      renderMap(); renderRoute()
    }

    function centerDestination () {
      const target = destination(); if (!target) return
      const viewport = $('atlas-viewport').getBoundingClientRect(), mapWidth = viewport.width, mapHeight = viewport.height
      zoom = Math.max(zoom, target.kind === 'region' ? 1.7 : 2.5)
      panX = mapWidth / 2 - target.mapX / 1000 * mapWidth * zoom
      panY = mapHeight / 2 - target.mapY / 540 * mapHeight * zoom
      api.storage.set('zoom', zoom)
    }

    function renderRoute () {
      const target = destination(), route = $('atlas-route'), position = playerPosition()
      $('atlas-current').textContent = `⌖ ${currentName()} · X ${Math.round(Number(position.x || 0))} · Z ${Math.round(Number(position.z || 0))}`
      if (!target) { route.innerHTML = '<div class="empty"><strong>Choisissez une destination</strong><span>La navigation fonctionne vers les trois factions.</span></div>'; return }
      const guide = direction(target), arrived = guide.distance <= 25, eta = guide.eta < 60 ? `${guide.eta} s` : guide.eta < 3600 ? `${Math.ceil(guide.eta / 60)} min` : `${(guide.eta / 3600).toFixed(1)} h`
      route.classList.toggle('arrived', arrived)
      route.innerHTML = `<div class="route-arrow" style="--turn:${guide.relative}deg"><i></i><b>${guide.cardinal}</b><small>${String(Math.round(guide.degrees)).padStart(3, '0')}°</small></div><div class="route-copy"><strong>${arrived ? 'Destination atteinte — ' : ''}${esc(target.name)}</strong><span>${target.kind === 'region' ? 'Région' : esc(target.regionName)} · ${esc(target.factionName)} · ${target.kind === 'region' ? 'tous niveaux' : `niveau ${esc(target.level)}`}</span><em>${formatDistance(guide.distance)} · environ ${eta} · X ${Math.round(target.x)} / Z ${Math.round(target.z)}</em></div><div class="route-actions"><button id="route-center" title="Centrer sur la destination">◎</button><button id="route-clear" title="Effacer la destination">×</button></div>`
      $('route-center').onclick = () => { centerDestination(); applyTransform() }
      $('route-clear').onclick = () => selectDestination('')
      if (arrived && !arrivalNotified) { arrivalNotified = true; api.ui.notify(`Destination atteinte : ${target.name}`) }
      if (!arrived) arrivalNotified = false
    }

    function setZoom (value) { zoom = clamp(value, 0.7, 4.5); api.storage.set('zoom', zoom); applyTransform() }
    function resetView () { zoom = 1; panX = 0; panY = 0; api.storage.set('zoom', zoom); applyTransform() }
    function setFilter (value) { filter = ['all', 'violet', 'jaune', 'rouge'].includes(value) ? value : 'all'; api.storage.set('faction', filter); document.querySelectorAll('[data-faction]').forEach(button => button.classList.toggle('active', button.dataset.faction === filter)); renderMap(); renderResults() }

    $('atlas-list').onclick = () => { $('atlas-results').classList.toggle('open'); if ($('atlas-results').classList.contains('open')) $('atlas-search').focus(); renderResults() }
    $('atlas-search').oninput = () => { $('atlas-results').classList.add('open'); renderResults() }
    $('atlas-search').onfocus = () => { $('atlas-results').classList.add('open'); renderResults() }
    $('atlas-minus').onclick = () => setZoom(zoom / 1.25)
    $('atlas-plus').onclick = () => setZoom(zoom * 1.25)
    $('atlas-reset').onclick = resetView
    $('atlas-factions').querySelectorAll('[data-faction]').forEach(button => { button.onclick = () => setFilter(button.dataset.faction) })
    $('atlas-viewport').addEventListener('wheel', event => { event.preventDefault(); setZoom(zoom * (event.deltaY < 0 ? 1.12 : 0.89)) }, { passive: false })
    $('atlas-viewport').onpointerdown = event => { if (event.target.closest('[data-destination]')) return; dragging = true; moved = false; dragX = event.clientX - panX; dragY = event.clientY - panY; $('atlas-viewport').setPointerCapture(event.pointerId) }
    $('atlas-viewport').onpointermove = event => { if (!dragging) return; const nextX = event.clientX - dragX, nextY = event.clientY - dragY; if (Math.hypot(nextX - panX, nextY - panY) > 2) moved = true; panX = nextX; panY = nextY; applyTransform() }
    $('atlas-viewport').onpointerup = () => { dragging = false; setTimeout(() => { moved = false }, 0) }
    document.onkeydown = event => { if (event.key === '+' || event.key === '=') setZoom(zoom * 1.25); if (event.key === '-') setZoom(zoom / 1.25); if (event.key === 'Escape') $('atlas-results').classList.remove('open') }
    api.on('state', value => { state = value; renderMap(); renderRoute() })

    setFilter(filter); renderMap(); renderRoute()
    if (selectedId && destination()) centerDestination()
    applyTransform()
    await api.ui.setTitle('Atlas Navigator — Toutes factions')
    await api.ui.show()
  }
})
