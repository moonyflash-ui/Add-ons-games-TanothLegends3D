'use strict'

TanothAddon.register({
  async activate (api) {
    const blank = () => ({ damageDone: 0, damageTaken: 0, healingDone: 0, healingReceived: 0, overheal: 0, resurrectionDone: 0, resurrectionReceived: 0, events: 0, startedAt: 0, lastAt: 0, sources: {} })
    let meter = blank(), history = await api.storage.get('history') || [], paused = false
    document.body.innerHTML = `<main><header><div><h1>KikiMeter</h1><small>Analyse de combat en direct</small></div><b id="combat-state">PRÊT</b></header><section class="hero"><div><span>DPS</span><strong id="dps">0</strong></div><div><span>Dégâts</span><strong id="damageDone">0</strong></div><div><span>Durée</span><strong id="duration">0:00</strong></div></section><section class="metrics"><div><span>Dégâts subis</span><b id="damageTaken">0</b></div><div><span>Soins donnés</span><b id="healingDone">0</b></div><div><span>Soins reçus</span><b id="healingReceived">0</b></div><div><span>Sursoins</span><b id="overheal">0</b></div><div><span>Résurrections</span><b id="resurrectionDone">0</b></div><div><span>Résurrections reçues</span><b id="resurrectionReceived">0</b></div></section><section><h2>Sources principales</h2><div id="sources" class="sources"></div></section><footer><button id="pause">Pause</button><button id="reset">Nouveau combat</button></footer></main>`
    const number = value => Math.max(0, Number(value) || 0)
    const fmt = value => Math.floor(number(value)).toLocaleString('fr-FR')
    const elapsed = () => meter.startedAt ? Math.max(1, (Math.max(meter.lastAt, Date.now()) - meter.startedAt) / 1000) : 0
    const archive = async () => { if (!meter.events) return; history.unshift({ ...meter, endedAt: Date.now() }); history = history.slice(0, 10); await api.storage.set('history', history) }
    const reset = async () => { await archive(); meter = blank(); render() }
    const ingest = event => {
      if (paused || !event?.kind) return
      const at = number(event.at) || Date.now()
      if (meter.lastAt && at - meter.lastAt > 12000) { archive(); meter = blank() }
      if (!meter.startedAt) meter.startedAt = at
      meter.lastAt = at; meter.events++
      const amount = number(event.amount), effective = event.effective === undefined ? amount : number(event.effective)
      if (event.kind in meter && typeof meter[event.kind] === 'number') meter[event.kind] += ['healingDone', 'healingReceived'].includes(event.kind) ? effective : amount
      if (event.kind === 'healingDone') meter.overheal += number(event.overheal)
      if (event.kind === 'damageDone' || event.kind === 'healingDone') { const key = String(event.source || (event.kind === 'damageDone' ? 'Dégâts directs' : 'Soins')).slice(0, 60); const row = meter.sources[key] || { damage: 0, healing: 0 }; row[event.kind === 'damageDone' ? 'damage' : 'healing'] += event.kind === 'damageDone' ? amount : effective; meter.sources[key] = row }
      render()
    }
    const render = () => {
      const seconds = elapsed(), dps = seconds ? meter.damageDone / seconds : 0
      ;['damageDone', 'damageTaken', 'healingDone', 'healingReceived', 'overheal', 'resurrectionDone', 'resurrectionReceived'].forEach(id => { document.getElementById(id).textContent = fmt(meter[id]) })
      document.getElementById('dps').textContent = fmt(dps)
      document.getElementById('duration').textContent = `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
      const state = document.getElementById('combat-state'); state.textContent = paused ? 'PAUSE' : meter.events ? 'COMBAT' : 'PRÊT'; state.className = paused ? 'paused' : meter.events ? 'active' : ''
      const rows = Object.entries(meter.sources).sort((a, b) => b[1].damage + b[1].healing - a[1].damage - a[1].healing).slice(0, 6), maximum = Math.max(1, ...rows.map(([, row]) => row.damage + row.healing))
      document.getElementById('sources').innerHTML = rows.map(([name, row]) => `<div><span>${name.replace(/[&<>"']/g, '')}</span><i><b style="width:${(row.damage + row.healing) / maximum * 100}%"></b></i><em>${row.damage ? fmt(row.damage) + ' dégâts' : fmt(row.healing) + ' soins'}</em></div>`).join('') || '<p>Aucune donnée de combat.</p>'
    }
    api.on('meter', ingest)
    document.getElementById('pause').onclick = () => { paused = !paused; document.getElementById('pause').textContent = paused ? 'Reprendre' : 'Pause'; render() }
    document.getElementById('reset').onclick = reset
    setInterval(render, 500)
    render(); await api.ui.setTitle('KikiMeter — Combat'); await api.ui.show()
  }
})
