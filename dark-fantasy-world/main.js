'use strict'

TanothAddon.register({
  async activate (api) {
    document.body.innerHTML = `
      <main>
        <header><span>♜</span><div><h1>Dark Fantasy — Haute illusion</h1><p>Plus de relief sans alourdir tous les modèles</p></div><b>2.1</b></header>
        <div id="scene" class="scene style-realistic" aria-label="Aperçu du rendu"><i class="moon"></i><i class="mist"></i><b class="keep">♜</b><span class="hero"><u></u><em></em></span></div>
        <fieldset><legend>Profil graphique</legend>
          <label class="profile"><input type="radio" name="quality" value="comfort"><span><b>Confort</b><small>Éclairage doux recommandé</small></span></label>
          <label class="profile"><input type="radio" name="quality" value="immersive"><span><b>Immersif</b><small>Ombres plus profondes</small></span></label>
          <label class="profile"><input type="radio" name="quality" value="performance"><span><b>Performance</b><small>Effets allégés</small></span></label>
        </fieldset>
        <fieldset class="character-styles"><legend>Style des personnages</legend>
          <label class="profile"><input type="radio" name="characterStyle" value="realistic"><span><b>Réaliste sombre</b><small>Matières et lumière naturelle</small></span></label>
          <label class="profile"><input type="radio" name="characterStyle" value="gothic"><span><b>Gothique sculpté</b><small>Silhouettes et métal marqués</small></span></label>
          <label class="profile"><input type="radio" name="characterStyle" value="illustrated"><span><b>Illustré sombre</b><small>Ombres dessinées et contours</small></span></label>
        </fieldset>
        <section class="options">
          <label><input id="eyeComfort" type="checkbox"> Lumière anti-fatigue</label>
          <label><input id="characterDepth" type="checkbox"> Relief 3D des personnages</label>
          <label><input id="highDetail" type="checkbox"> Détails renforcés à proximité</label>
          <label>Portée<select id="detailDistance"><option value="100">100 m</option><option value="140">140 m</option><option value="170">170 m</option></select></label>
          <label>Brouillard<select id="fog"><option value="light">Léger</option><option value="atmospheric">Atmosphérique</option><option value="dense">Dense</option></select></label>
        </section>
        <button id="apply">Appliquer au monde 3D</button>
        <p id="status">Contraste adouci, détails préservés et lumière équilibrée.</p>
      </main>`

    const oldQuality = await api.storage.get('quality')
    const saved = await api.storage.get('settings') || {}
    const migratedQuality = oldQuality === 'cinematic' ? 'immersive' : oldQuality === 'balanced' ? 'comfort' : oldQuality
    let current = { quality: 'comfort', eyeComfort: true, characterDepth: true, highDetail: true, characterStyle: 'realistic', detailDistance: 140, fog: 'light', ...saved, ...(migratedQuality ? { quality: migratedQuality } : {}) }

    const refreshPreview = settings => {
      const style = ['realistic', 'gothic', 'illustrated'].includes(settings.characterStyle) ? settings.characterStyle : 'realistic'
      document.getElementById('scene').className = `scene style-${style}`
    }

    const write = settings => {
      const choice = document.querySelector(`input[name="quality"][value="${settings.quality}"]`) || document.querySelector('input[value="comfort"]')
      choice.checked = true
      const style = document.querySelector(`input[name="characterStyle"][value="${settings.characterStyle}"]`) || document.querySelector('input[name="characterStyle"][value="realistic"]')
      style.checked = true
      document.getElementById('eyeComfort').checked = settings.eyeComfort !== false
      document.getElementById('characterDepth').checked = settings.characterDepth !== false
      document.getElementById('highDetail').checked = settings.highDetail !== false
      document.getElementById('detailDistance').value = ['100', '140', '170'].includes(String(settings.detailDistance)) ? String(settings.detailDistance) : '140'
      document.getElementById('fog').value = ['light', 'atmospheric', 'dense'].includes(settings.fog) ? settings.fog : 'light'
      refreshPreview(settings)
    }
    const read = () => ({
      quality: document.querySelector('input[name="quality"]:checked')?.value || 'comfort',
      characterStyle: document.querySelector('input[name="characterStyle"]:checked')?.value || 'realistic',
      eyeComfort: document.getElementById('eyeComfort').checked,
      characterDepth: document.getElementById('characterDepth').checked,
      highDetail: document.getElementById('highDetail').checked,
      detailDistance: Number(document.getElementById('detailDistance').value) || 140,
      fog: document.getElementById('fog').value
    })

    const apply = async () => {
      current = read()
      await api.storage.set('settings', current)
      await api.storage.remove('quality')
      await api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: true, ...current })
      const labels = { comfort: 'Confort', immersive: 'Immersif', performance: 'Performance' }
      const styles = { realistic: 'réaliste sombre', gothic: 'gothique sculpté', illustrated: 'illustré sombre' }
      refreshPreview(current)
      document.getElementById('status').textContent = `${labels[current.quality]} · ${styles[current.characterStyle]} · détails ${current.highDetail ? `renforcés jusqu’à ${current.detailDistance} m` : 'standards'}.`
    }

    write(current)
    document.querySelectorAll('input, select').forEach(input => { input.onchange = () => apply().catch(error => { document.getElementById('status').textContent = error.message }) })
    document.getElementById('apply').onclick = () => apply().catch(error => { document.getElementById('status').textContent = error.message })
    await apply()
    await api.ui.setTitle('Dark Fantasy 2.1 · Haute illusion')
    await api.ui.show()
  },
  deactivate (api) {
    return api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: false }).catch(() => {})
  }
})
