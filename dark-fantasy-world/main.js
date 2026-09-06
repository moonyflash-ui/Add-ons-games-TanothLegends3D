'use strict'

TanothAddon.register({
  async activate (api) {
    document.body.innerHTML = `
      <main>
        <header><span>♜</span><div><h1>Monde Dark Fantasy</h1><p>Atmosphère médiévale réaliste</p></div></header>
        <div class="scene"><i class="moon"></i><b class="keep">♜</b><em></em></div>
        <fieldset><legend>Profil graphique</legend>
          <label><input type="radio" name="quality" value="cinematic"> Cinématique</label>
          <label><input type="radio" name="quality" value="balanced"> Équilibré</label>
          <label><input type="radio" name="quality" value="performance"> Performance</label>
        </fieldset>
        <button id="apply">Appliquer au monde 3D</button>
        <p id="status">Palette sombre, brume volumétrique simulée, ombres et matériaux retravaillés.</p>
      </main>`

    const quality = await api.storage.get('quality') || 'balanced'
    const choice = document.querySelector(`input[value="${quality}"]`) || document.querySelector('input[value="balanced"]')
    choice.checked = true

    const apply = async () => {
      const selected = document.querySelector('input[name="quality"]:checked')?.value || 'balanced'
      await api.storage.set('quality', selected)
      await api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: true, quality: selected })
      document.getElementById('status').textContent = `Profil ${selected} actif dans le monde, les donjons et les raids compatibles.`
    }

    document.querySelectorAll('input[name="quality"]').forEach(input => { input.onchange = apply })
    document.getElementById('apply').onclick = () => apply().catch(error => { document.getElementById('status').textContent = error.message })
    await apply()
    await api.ui.setTitle('Monde 3D Dark Fantasy')
    await api.ui.show()
  },
  deactivate (api) {
    return api.game.action('applyWorldPreset', { preset: 'dark-fantasy', enabled: false }).catch(() => {})
  }
})
