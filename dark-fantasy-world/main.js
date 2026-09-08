'use strict'

TanothAddon.register({
  async activate (api) {
    document.body.innerHTML = `
      <main>
        <header><span>♜</span><div><h1>Dark Fantasy — Confort visuel</h1><p>Atmosphère sombre, lisible et reposante</p></div><b>2.0</b></header>
        <div class="scene" aria-label="Aperçu du rendu"><i class="moon"></i><i class="mist"></i><b class="keep">♜</b><span class="hero"><u></u></span></div>
        <fieldset><legend>Profil graphique</legend>
          <label class="profile"><input type="radio" name="quality" value="comfort"><span><b>Confort</b><small>Éclairage doux recommandé</small></span></label>
          <label class="profile"><input type="radio" name="quality" value="immersive"><span><b>Immersif</b><small>Ombres plus profondes</small></span></label>
          <label class="profile"><input type="radio" name="quality" value="performance"><span><b>Performance</b><small>Effets allégés</small></span></label>
        </fieldset>
        <section class="options">
          <label><input id="eyeComfort" type="checkbox"> Lumière anti-fatigue</label>
          <label><input id="characterDepth" type="checkbox"> Relief 3D des personnages</label>
          <label>Brouillard<select id="fog"><option value="light">Léger</option><option value="atmospheric">Atmosphérique</option><option value="dense">Dense</option></select></label>
        </section>
        <button id="apply">Appliquer au monde 3D</button>
        <p id="status">Contraste adouci, détails préservés et lumière équilibrée.</p>
      </main>`

    const oldQuality = await api.storage.get('quality')
    const saved = await api.storage.get('settings') || {}
    const migratedQuality = oldQuality === 'cinematic' ? 'immersive' : oldQuality === 'balanced' ? 'comfort' : oldQuality
    let current = { quality: 'comfort', eyeComfort: true, characterDepth: true, fog: 'light', ...saved, ...(migratedQuality ? { quality: migratedQuality } : {}) }

    const write = settings => {
      const choice = document.querySelector(`input[name="quality"][value="${settings.quality}"]`) || document.querySelector('input[value="comfort"]')
      choice.checked = true
      document.getElementById('eyeComfort').checked = settings.eyeComfort !== false
      document.getElementById('characterDepth').checked = settings.characterDepth !== false
      document.getElementById('fog').value = ['light', 'atmospheric', 'dense'].includes(settings.fog) ? settings.fog : 'light'
    }
    const read = () => ({
      quality: document.querySelector('input[name="quality"]:checked')?.value || 'comfort',
      eyeComfort: document.getElementById('eyeComfort').checked,
      characterDepth: document.getElementById('characterDepth').checked,
      fog: document.getElementById('fog').value
    })

    const apply = async () => {
      current = read()
      await api.storage.set('settings', current)
      await api.storage.remove('quality')
      await api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: true, ...current })
      const labels = { comfort: 'Confort', immersive: 'Immersif', performance: 'Performance' }
      document.getElementById('status').textContent = `${labels[current.quality]} actif · lumière ${current.eyeComfort ? 'douce' : 'standard'} · relief des personnages ${current.characterDepth ? 'actif' : 'désactivé'}.`
    }

    write(current)
    document.querySelectorAll('input, select').forEach(input => { input.onchange = () => apply().catch(error => { document.getElementById('status').textContent = error.message }) })
    document.getElementById('apply').onclick = () => apply().catch(error => { document.getElementById('status').textContent = error.message })
    await apply()
    await api.ui.setTitle('Dark Fantasy 2.0 · Confort visuel')
    await api.ui.show()
  },
  deactivate (api) {
    return api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: false }).catch(() => {})
  }
})
