'use strict'

TanothAddon.register({
  activate (api) {
    document.body.innerHTML = `
      <main class="hero-addon">
        <div class="identity" id="addon-identity">Héros en chargement…</div>
        <div class="label"><span>Vie</span><span id="addon-hp-text">0 / 0</span></div>
        <div class="bar"><i id="addon-hp"></i></div>
        <div class="label"><span>Mana</span><span id="addon-mana-text">0 / 0</span></div>
        <div class="bar mana"><i id="addon-mana"></i></div>
        <div class="details" id="addon-details"></div>
      </main>`

    const render = state => {
      if (!state?.player) return
      const hp = Math.max(0, Number(state.player.hp) || 0)
      const maxHp = Math.max(1, Number(state.player.maxHp) || 1)
      const mana = Math.max(0, Number(state.player.mana) || 0)
      const maxMana = Math.max(1, Number(state.player.maxMana) || 1)
      document.getElementById('addon-identity').textContent = `${state.identity.tag} — niveau ${state.player.level}`
      document.getElementById('addon-hp-text').textContent = `${Math.floor(hp)} / ${Math.floor(maxHp)}`
      document.getElementById('addon-mana-text').textContent = `${Math.floor(mana)} / ${Math.floor(maxMana)}`
      document.getElementById('addon-hp').style.width = `${Math.min(100, hp / maxHp * 100)}%`
      document.getElementById('addon-mana').style.width = `${Math.min(100, mana / maxMana * 100)}%`
      const morale = Number(state.player.morale) || 0
      document.getElementById('addon-details').textContent = `${state.identity.faction} • Moral ${morale > 0 ? '+' : ''}${morale}%`
    }

    api.on('state', render)
    api.game.getState().then(render)
    api.ui.setTitle('HUD communautaire — Exemple')
    api.ui.show()
  }
})
