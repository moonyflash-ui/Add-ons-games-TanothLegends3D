'use strict'

TanothAddon.register({
  async activate (api) {
    document.body.innerHTML = `
      <main class="panel">
        <header><span class="sigil"><b>⚔</b></span><div><h1>HUD Dark Fantasy IV</h1><p>Interface tactique médiévale complète</p></div><span class="live">ACTIF</span></header>
        <section class="preview">
          <div class="identity"><strong id="hero-name">Héros</strong><small id="hero-level">Niveau 1</small></div>
          <div class="bar hp"><i id="hero-hp"></i></div>
          <div class="bar mana"><i id="hero-mana"></i></div>
          <div class="status"><span id="party-count">Groupe 0</span><span id="raid-count">Raid 0</span><span id="morale-value">Moral 0 %</span><span id="pet-name">Sans familier</span></div>
        </section>
        <section class="features"><span>◈ Chat horodaté</span><span>◈ Mini-carte interactive</span><span>◈ Menus médiévaux</span></section>
        <section class="settings">
          <label class="toggle"><input id="chatHud" type="checkbox"> <span>Nouveau HUD du chat</span></label>
          <label class="toggle"><input id="chatTimestamps" type="checkbox"> <span>Heure des messages</span></label>
          <label class="toggle"><input id="menuSkin" type="checkbox"> <span>Nouveau style des menus</span></label>
          <label class="toggle"><input id="minimap" type="checkbox"> <span>Afficher la mini-carte</span></label>
          <label class="toggle"><input id="mapTools" type="checkbox"> <span>Commandes sur la mini-carte</span></label>
          <label>Forme mini-carte<select id="mapShape"><option value="round">Ronde (défaut)</option><option value="square">Carrée</option></select></label>
          <label class="toggle"><input id="roster" type="checkbox"> <span>Groupe et raid</span></label>
          <label class="toggle"><input id="distances" type="checkbox"> <span>Distances des alliés</span></label>
          <label class="toggle"><input id="eventTrackers" type="checkbox"> <span>Suivis Failles et Mort</span></label>
          <label>Échelle<select id="scale"><option value="0.85">85 %</option><option value="1">100 %</option><option value="1.1">110 %</option></select></label>
          <label>Opacité<select id="opacity"><option value="0.82">82 %</option><option value="0.94">94 %</option><option value="1">100 %</option></select></label>
          <label>Mini-carte<select id="mapSize"><option value="180">Petite</option><option value="220">Moyenne</option><option value="270">Grande</option></select></label>
          <label>Portée<select id="mapRange"><option value="150">150 m</option><option value="300">300 m</option><option value="600">600 m</option></select></label>
          <label>Colonnes raid<select id="raidColumns"><option value="1">1 colonne</option><option value="2">2 colonnes</option></select></label>
        </section>
        <div class="actions"><button id="apply" type="button">Appliquer</button><button id="reset" class="secondary" type="button">Réinitialiser</button></div>
        <p class="note" id="message" role="status">Chargement du HUD complet…</p>
      </main>`

    const defaults = Object.freeze({ chatHud: true, chatTimestamps: true, menuSkin: true, minimap: true, mapTools: true, mapShape: 'round', roster: true, distances: true, eventTrackers: false, scale: 1, opacity: .94, mapSize: 220, mapRange: 300, raidColumns: 2 })
    const controls = ['chatHud', 'chatTimestamps', 'menuSkin', 'minimap', 'mapTools', 'mapShape', 'roster', 'distances', 'eventTrackers', 'scale', 'opacity', 'mapSize', 'mapRange', 'raidColumns']
    let current = { ...defaults, ...(await api.storage.get('settings') || {}) }

    const writeControls = settings => controls.forEach(id => {
      const node = document.getElementById(id)
      if (node.type === 'checkbox') node.checked = settings[id] !== false
      else node.value = String(settings[id])
    })
    const readControls = () => ({
      chatHud: document.getElementById('chatHud').checked,
      chatTimestamps: document.getElementById('chatTimestamps').checked,
      menuSkin: document.getElementById('menuSkin').checked,
      minimap: document.getElementById('minimap').checked,
      mapTools: document.getElementById('mapTools').checked,
      mapShape: document.getElementById('mapShape').value,
      roster: document.getElementById('roster').checked,
      distances: document.getElementById('distances').checked,
      eventTrackers: document.getElementById('eventTrackers').checked,
      scale: Number(document.getElementById('scale').value),
      opacity: Number(document.getElementById('opacity').value),
      mapSize: Number(document.getElementById('mapSize').value),
      mapRange: Number(document.getElementById('mapRange').value),
      raidColumns: Number(document.getElementById('raidColumns').value)
    })
    writeControls(current)

    const apply = async () => {
      current = readControls()
      await api.storage.set('settings', current)
      await api.game.action('applyHudPreset', { preset: 'dark-fantasy', enabled: true, ...current })
      document.getElementById('message').textContent = 'HUD complet actif · chat horodaté · mini-carte interactive · menus harmonisés.'
    }

    const pct = (value, maximum) => Math.max(0, Math.min(100, (Number(value) || 0) / Math.max(1, Number(maximum) || 1) * 100))
    const render = state => {
      if (!state?.player) return
      document.getElementById('hero-name').textContent = state.identity?.tag || state.identity?.name || 'Héros'
      document.getElementById('hero-level').textContent = `Niveau ${state.player.level || 1}`
      document.getElementById('hero-hp').style.width = `${pct(state.player.hp, state.player.maxHp)}%`
      document.getElementById('hero-mana').style.width = `${pct(state.player.mana, state.player.maxMana)}%`
      document.getElementById('party-count').textContent = `Groupe ${state.social?.group?.length || 0}`
      document.getElementById('raid-count').textContent = `Raid ${state.social?.raid?.length || 0}`
      const morale = Number(state.player.morale?.score ?? state.player.morale) || 0
      document.getElementById('morale-value').textContent = `${morale < 0 ? 'Démoralisation' : 'Moral'} ${morale > 0 ? '+' : ''}${morale} %`
      document.getElementById('pet-name').textContent = state.companion ? `${state.companion.name} · ${Math.floor(state.companion.hp || 0)} PV` : 'Sans familier'
    }

    document.getElementById('apply').onclick = () => apply().catch(error => { document.getElementById('message').textContent = error.message })
    controls.forEach(id => { document.getElementById(id).onchange = () => apply().catch(error => { document.getElementById('message').textContent = error.message }) })
    document.getElementById('reset').onclick = () => { current = { ...defaults }; writeControls(current); apply().catch(error => { document.getElementById('message').textContent = error.message }) }
    api.on('state', render)
    render(await api.game.getState())
    await apply()
    await api.ui.setTitle('HUD Dark Fantasy IV · Contrôle')
    await api.ui.show()
  },
  deactivate (api) {
    return api.game.action('applyHudPreset', { preset: 'dark-fantasy', enabled: false }).catch(() => {})
  }
})
