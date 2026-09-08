'use strict'

TanothAddon.register({
  async activate (api) {
    document.body.innerHTML = `
      <main>
        <header><span>♞</span><div><h1>Personnages Dark Fantasy 3D</h1><p>Modèles, matières et articulations — sans modifier le monde</p></div><b>2.3</b></header>
        <div id="scene" class="scene style-realistic" aria-label="Aperçu du personnage"><i class="moon"></i><i class="mist"></i><b class="keep">♜</b><span class="hero"><u></u><em></em></span></div>
        <div class="world-safe"><b>MONDE INTACT</b><span>Aucun filtre, brouillard, contraste ou profil graphique n’est appliqué aux décors.</span></div>
        <fieldset class="character-styles"><legend>Style des personnages</legend>
          <label class="profile"><input type="radio" name="characterStyle" value="realistic"><span><b>Réaliste sombre</b><small>Matières naturelles et volume discret</small></span></label>
          <label class="profile"><input type="radio" name="characterStyle" value="gothic"><span><b>Gothique sculpté</b><small>Silhouettes et métal marqués</small></span></label>
          <label class="profile"><input type="radio" name="characterStyle" value="illustrated"><span><b>Illustré sombre</b><small>Ombres dessinées et contours</small></span></label>
        </fieldset>
        <section class="options">
          <label><input id="characterDepth" type="checkbox"> Relief 3D des personnages</label>
          <label><input id="highDetail" type="checkbox"> Détails renforcés à proximité</label>
          <label><input id="characterArticulation" type="checkbox"> Articulations fluides</label>
          <label>Portée des détails<select id="detailDistance"><option value="100">100 m</option><option value="140">140 m</option><option value="170">170 m</option></select></label>
        </section>
        <button id="apply">Appliquer aux personnages</button>
        <p id="status">Le rendu du monde reste celui du jeu.</p>
      </main>`

    const saved = await api.storage.get('settings') || {}
    let current = { characterDepth: true, highDetail: true, characterArticulation: true, characterStyle: 'realistic', detailDistance: 140, ...saved }

    const refreshPreview = settings => {
      const style = ['realistic', 'gothic', 'illustrated'].includes(settings.characterStyle) ? settings.characterStyle : 'realistic'
      document.getElementById('scene').className = `scene style-${style}`
    }

    const write = settings => {
      const style = document.querySelector(`input[name="characterStyle"][value="${settings.characterStyle}"]`) || document.querySelector('input[name="characterStyle"][value="realistic"]')
      style.checked = true
      document.getElementById('characterDepth').checked = settings.characterDepth !== false
      document.getElementById('highDetail').checked = settings.highDetail !== false
      document.getElementById('characterArticulation').checked = settings.characterArticulation !== false
      document.getElementById('detailDistance').value = ['100', '140', '170'].includes(String(settings.detailDistance)) ? String(settings.detailDistance) : '140'
      refreshPreview(settings)
    }
    const read = () => ({
      characterStyle: document.querySelector('input[name="characterStyle"]:checked')?.value || 'realistic',
      characterDepth: document.getElementById('characterDepth').checked,
      highDetail: document.getElementById('highDetail').checked,
      characterArticulation: document.getElementById('characterArticulation').checked,
      detailDistance: Number(document.getElementById('detailDistance').value) || 140
    })

    const apply = async () => {
      current = read()
      await api.storage.set('settings', current)
      await api.storage.remove('quality')
      await api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: true, characterOnly: true, ...current })
      const styles = { realistic: 'réaliste sombre', gothic: 'gothique sculpté', illustrated: 'illustré sombre' }
      refreshPreview(current)
      document.getElementById('status').textContent = `${styles[current.characterStyle]} · détails ${current.highDetail ? `jusqu’à ${current.detailDistance} m` : 'standards'} · articulations ${current.characterArticulation ? 'fluides' : 'simples'} · monde inchangé.`
    }

    write(current)
    document.querySelectorAll('input, select').forEach(input => { input.onchange = () => apply().catch(error => { document.getElementById('status').textContent = error.message }) })
    document.getElementById('apply').onclick = () => apply().catch(error => { document.getElementById('status').textContent = error.message })
    await apply()
    await api.ui.setTitle('Personnages Dark Fantasy 2.3 · Monde intact')
    await api.ui.show()
  },
  deactivate (api) {
    return api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: false }).catch(() => {})
  }
})
