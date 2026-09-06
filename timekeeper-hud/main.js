'use strict'

TanothAddon.register({
  async activate (api) {
    const defaults = Object.freeze({ showLocal: true, showGame: true, showFPS: true, showSeconds: false, compact: true, position: 'bottom-right', opacity: 0.88 })
    const saved = await api.storage.get('settings') || {}
    let current = { ...defaults, ...saved }
    let state = await api.game.getState()

    document.body.innerHTML = `<main>
      <header><span>◷</span><div><h1>Chronomètre de Tanoth</h1><p>Heures locale et en jeu · FPS du monde 3D</p></div><b>ACTIF</b></header>
      <section class="preview"><div><small>HEURE LOCALE</small><strong id="preview-local">--:--</strong></div><div><small>HEURE DE TANOTH</small><strong id="preview-game">--:--</strong></div><div><small>PERFORMANCE</small><strong id="preview-fps">-- FPS</strong></div></section>
      <section class="settings">
        <label><input id="showLocal" type="checkbox"> Heure locale IRL</label>
        <label><input id="showGame" type="checkbox"> Heure du monde</label>
        <label><input id="showFPS" type="checkbox"> FPS du rendu 3D</label>
        <label><input id="showSeconds" type="checkbox"> Afficher les secondes</label>
        <label><input id="compact" type="checkbox"> Mode compact</label>
        <label>Position<select id="position"><option value="bottom-right">Bas droite</option><option value="bottom-center">Bas centre</option><option value="top-center">Haut centre</option></select></label>
        <label>Opacité<select id="opacity"><option value="0.72">72 %</option><option value="0.88">88 %</option><option value="1">100 %</option></select></label>
      </section>
      <footer><button id="apply">Appliquer</button><button id="reset">Réinitialiser</button><span id="message">Prêt.</span></footer>
    </main>`

    const ids = ['showLocal', 'showGame', 'showFPS', 'showSeconds', 'compact', 'position', 'opacity']
    const write = settings => ids.forEach(id => { const node = document.getElementById(id); if (node.type === 'checkbox') node.checked = settings[id] !== false; else node.value = String(settings[id]) })
    const read = () => ({ showLocal: document.getElementById('showLocal').checked, showGame: document.getElementById('showGame').checked, showFPS: document.getElementById('showFPS').checked, showSeconds: document.getElementById('showSeconds').checked, compact: document.getElementById('compact').checked, position: document.getElementById('position').value, opacity: Number(document.getElementById('opacity').value) })

    const renderPreview = () => {
      const date = new Date(), minute = Math.max(0, Number(state?.world?.minute) || 0), localOptions = { hour: '2-digit', minute: '2-digit', ...(current.showSeconds ? { second: '2-digit' } : {}) }
      document.getElementById('preview-local').textContent = date.toLocaleTimeString('fr-FR', localOptions)
      document.getElementById('preview-game').textContent = `${String(Math.floor(minute / 60) % 24).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`
      const fps = Math.max(0, Math.round(Number(state?.performance?.fps) || 0))
      document.getElementById('preview-fps').textContent = fps ? `${fps} FPS` : 'MESURE…'
    }
    const apply = async () => {
      current = read()
      await api.storage.set('settings', current)
      await api.game.action('applyTimekeeperOverlay', { enabled: true, ...current })
      document.getElementById('message').textContent = 'Affichage synchronisé.'
      renderPreview()
    }

    write(current)
    ids.forEach(id => { document.getElementById(id).onchange = () => apply().catch(error => { document.getElementById('message').textContent = error.message }) })
    document.getElementById('apply').onclick = () => apply().catch(error => { document.getElementById('message').textContent = error.message })
    document.getElementById('reset').onclick = () => { current = { ...defaults }; write(current); apply().catch(error => { document.getElementById('message').textContent = error.message }) }
    api.on('state', value => { state = value; renderPreview() })
    const timer = setInterval(renderPreview, 500)
    document.body.dataset.timer = String(timer)
    renderPreview()
    await apply()
    await api.ui.setTitle('Chronomètre de Tanoth — Heure & FPS')
    await api.ui.show()
  },
  deactivate (api) {
    return api.game.action('applyTimekeeperOverlay', { enabled: false }).catch(() => {})
  }
})
