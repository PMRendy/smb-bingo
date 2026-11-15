// ═════ Pet Race R7 extras — betting board, Chaos Shop, leader bounty, rival bets, crowd hype,
// track weather and the house racer "Intern Uodie Jr.". Server rules live in bingo_prx_* (Postgres);
// player moves ride on the existing "buy" action with an item string "x:<verb>:<args>". ═════
const PRQ_WX = {clear:['☀️','Clear'], rain:['🌧️','Rain'], heat:['🔥','Heatwave'], wind:['🌬️','Windy'], fog:['🌫️','Fog']};
const PRQ_WX_NOTE = {rain:'Fish, turtles, frogs faster · cats, chickens slower', heat:'Geckos, snakes, spiders faster · dogs, cows slower',
  wind:'Parrots, chickens faster · hamsters, rabbits slower', fog:'Hazard dodge chance halved', clear:'No modifiers'};
const PRQ_MKT = {win:'🥇 Win', top3:'🏅 Top 3', last:'🐢 Last place'};
let _prqMkt = 'win', _prqAmt = 25, _prqHaz = 'banana', _prqHazT = '', _prqRivT = '', _prqRivAmt = 25, _prqHypeT = '';

function prqWormSvg(){
  return `<svg class="prq-worm" viewBox="0 0 60 60" width="100%" height="100%" role="img" aria-label="Intern worm"><g>
<circle cx="10" cy="46" r="7" fill="#d98aa0"/><circle cx="19" cy="44" r="8" fill="#e597ab"/><circle cx="28" cy="40" r="8.5" fill="#d98aa0"/>
<rect x="24" y="30" width="12" height="10" fill="#2b3550" rx="2"/><path d="M30 31 l-2 6 2 2 2-2z" fill="#E2685F"/>
<circle cx="34" cy="22" r="11" fill="#e597ab"/>
<circle cx="30" cy="21" r="3.6" fill="#fff" stroke="#222" stroke-width="1.2"/><circle cx="38.5" cy="21" r="3.6" fill="#fff" stroke="#222" stroke-width="1.2"/>
<line x1="33.6" y1="21" x2="34.9" y2="21" stroke="#222" stroke-width="1.2"/><circle cx="30.6" cy="21.5" r="1.4" fill="#222"/><circle cx="39.1" cy="21.5" r="1.4" fill="#222"/>
<path d="M30 15 l5 2 M43 15 l-5 2" stroke="#222" stroke-width="1.4" stroke-linecap="round"/>
<path d="M31 28 q3.5-2 7 0" stroke="#222" stroke-width="1.3" fill="none" stroke-linecap="round"/>
<rect x="44" y="28" width="12" height="16" rx="1.5" fill="#c8a06a" transform="rotate(12 50 36)"/><rect x="46" y="31" width="8" height="11" fill="#fff" transform="rotate(12 50 36)"/>
<rect x="48" y="27" width="5" height="3" fill="#888" transform="rotate(12 50 36)"/>
<path d="M47 34h5M47 36.5h5M47 39h3" stroke="#9aa" stroke-width=".9" transform="rotate(12 50 36)"/>
<path d="M40 31 q4 2 6 3" stroke="#e597ab" stroke-width="3.5" stroke-linecap="round" fill="none"/></g></svg>`;
}

// put the Intern into the entries list the rest of the race tab already draws
function prqMerge(j){
  if(!j || !j.x || !j.x.intern || !Array.isArray(j.entries)) return;
  if(j.entries.some(e => e.playerId === '_intern')) return;
  j.entries.push(Object.assign({level: 1}, j.x.intern));
  j.entries.sort((a, b) => (a.dnf ? 1 : 0) - (b.dnf ? 1 : 0) || Number(b.laps) - Number(a.laps));
}
function prqX(){ return _pr && _pr.x; }
function prqLive(){ const r = _pr && _pr.race; return !!r && (r.status === 'locked' || r.status === 'racing') && r.lastLeg < 24; }
function prqName(e){ return e ? (e.house ? '🪱 ' : '') + e.petName : '—'; }
function prqOpts(list, sel){ return list.map(e => `<option value="${e.id}" ${String(e.id) === String(sel) ? 'selected' : ''}>${prEsc(prqName(e))} • ${prEsc(e.playerName)}</option>`).join(''); }
async function prqDo(cmd, ask){
  if(ask && !confirm(ask)) return;
  await prAct('buy', {item: 'x:' + cmd});
}

// ── player cards
function prqCards(me, ph){
  const x = prqX(); if(!x || !_pr.race) return '';
  const st = _pr.race.status;
  if(st === 'registration') return prqEntranceCard(me);
  if(!['locked','racing','finished'].includes(st)) return '';
  return `<div class="prq-grid">${prqWeatherCard()}${prqBetCard()}${prqChaosCard(me)}${prqBountyCard()}${prqRivalCard(me)}${prqHypeCard(me)}</div>`;
}
function prqEntranceCard(me){
  const x = prqX(), c = x.cfg.hype || {};
  if(!me || c.on === false) return '';
  return `<div class="gp-card"><div class="gp-hdr"><h3>🎺 Hype Entrance</h3><span class="gp-badge">${Number(c.entrancePrice || 20)} 🪙</span></div>
    <div class="pr-hl"><span>Announce <b>${prEsc(me.petName)}</b> to the whole team in Slack with a fanfare. Once per race.</span>
    <button class="pr-btn" ${prDis(x.myEntrance ? 'Done na!' : !prCanPlay() && 'Locked')} onclick="prqDo('entrance','Hype Entrance for ${Number(c.entrancePrice || 20)} SMB Tokens?')">${x.myEntrance ? '🎺 Done' : '🎺 Make an entrance'}</button></div>
    <div class="pr-muted" style="font-size:12px;margin-top:8px">🪱 Heads-up: <b>${prEsc((x.cfg.intern || {}).name || 'The Intern')}</b> races too, as a house racer. His strength is set by the house each race, and nobody knows how strong he is. He never takes a prize spot.</div></div>`;
}
function prqWeatherCard(){
  const x = prqX(), w = x.weather || [], r = _pr.race;
  if(!w.length || (x.cfg.weather || {}).on === false) return '';
  const nx = Math.min(24, r.lastLeg + 1), now = w.find(v => v.leg === nx) || w[w.length - 1];
  const show = w.filter(v => v.leg >= Math.max(1, r.lastLeg - 1));
  return `<div class="gp-card"><div class="gp-hdr"><h3>🌦️ Track weather</h3><span class="gp-badge">${PRQ_WX[now.type][0]} Leg ${now.leg}: ${PRQ_WX[now.type][1]}</span></div>
    <div class="prq-wx">${show.map(v => `<div class="${v.leg === nx ? 'now' : v.leg <= r.lastLeg ? 'past' : ''}"><b>${PRQ_WX[v.type][0]}</b>${v.leg === nx ? 'Next' : 'Leg ' + v.leg}</div>`).join('')}</div>
    <div class="pr-muted" style="font-size:12px;margin-top:8px">${PRQ_WX[now.type][0]} ${prEsc(PRQ_WX_NOTE[now.type])}. Forecast shows 3 legs ahead. Weather changes speed by ±${Number((x.cfg.weather || {}).pct || 10)}%.</div></div>`;
}
function prqBetCard(){
  const x = prqX(), c = x.cfg.bets || {}; if(c.on === false) return '';
  const pools = (x.pools || {})[_prqMkt] || {}, list = (_pr.entries || []).filter(e => !e.dnf && !(e.house && _prqMkt === 'win'));
  const tot = Object.values(pools).reduce((a, b) => a + Number(b), 0), keep = (100 - Number(c.cut || 15)) / 100;
  const open = x.betsOpen && prCanPlay(), amts = [5,10,25,50,100].filter(v => v >= Number(c.min || 5) && v <= Number(c.max || 100));
  if(!amts.includes(_prqAmt)) _prqAmt = amts[Math.min(2, amts.length - 1)];
  const rows = list.map(e => { const p = Number(pools[e.id] || 0), pays = p ? (_prqMkt === 'top3' ? '' : (tot * keep / p).toFixed(2) + '×') : 'new';
    return `<tr><td>${prEsc(prqName(e))}<div class="pr-muted" style="font-size:11px">${prEsc(e.playerName)}</div></td><td class="n">${p}</td><td class="n prq-odds">${_prqMkt === 'top3' ? (tot ? Math.round(p / tot * 100) + '%' : '—') : pays}</td>
      <td><button class="pr-btn ghost" style="padding:4px 10px;font-size:12px" ${prDis(!open ? 'Betting closed' : (_prqMkt === 'last' && currentPlayer && e.playerId === currentPlayer.id) && 'Not on your own pet')} onclick="prqDo('bet:${_prqMkt}:${e.id}:${_prqAmt}', ${_prqAmt >= 50 ? `'Bet ${_prqAmt} SMB Tokens on ${prEsc(String(e.petName).replace(/[\'"\\]/g, ''))}?'` : 'null'})">Bet</button></td></tr>`; }).join('');
  const mine = (x.myBets || []).map(b => `<div>${PRQ_MKT[b.market] || b.market} · ${prEsc(b.petName || '')} · ${b.amount} 🪙${b.status === 'won' ? ` → <b style="color:var(--success)">+${b.payout}</b>` : b.status === 'lost' ? ' · ❌' : b.status === 'refunded' ? ' · ↩️ refunded' : ''}</div>`).join('');
  return `<div class="gp-card"><div class="gp-hdr"><h3>🎰 Betting Board</h3><span class="gp-badge">${open ? `open until Leg ${Number(c.closeLeg || 16)}` : 'closed'}</span></div>
    <div class="prq-tabs">${Object.keys(PRQ_MKT).map(m => `<button class="${m === _prqMkt ? 'on' : ''}" onclick="_prqMkt='${m}';prRender()">${PRQ_MKT[m]}</button>`).join('')}</div>
    <div class="pr-tbl"><table><thead><tr><th>Racer</th><th class="n">Pool</th><th class="n">${_prqMkt === 'top3' ? 'Share' : 'Pays'}</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="4" class="pr-muted">No racers.</td></tr>'}</tbody></table></div>
    <div class="row prq-row"><span class="pr-muted" style="font-size:12px">Bet</span>${amts.map(v => `<button class="prq-amt ${v === _prqAmt ? 'on' : ''}" onclick="_prqAmt=${v};prRender()">${v}</button>`).join('')}<span class="pr-muted" style="font-size:12px">🪙 · ${Number(c.cut || 15)}% house cut</span></div>
    <div class="pr-muted" style="font-size:12px;margin-top:6px">${_prqMkt === 'win' ? 'Win = the ₱300 staff champion. 🪱 The Intern is not in this market.' : _prqMkt === 'top3' ? 'Top 3 on the track (the Intern counts). Winning tickets split the pool.' : 'Last on the track (the Intern counts). Not on your own pet.'} No winning ticket = everyone refunded.</div>
    ${mine ? `<div class="prq-mine"><b>My bets</b>${mine}</div>` : ''}</div>`;
}
function prqChaosCard(me){
  const x = prqX(), c = x.cfg.chaos || {}; if(c.on === false) return '';
  const items = c.items || {}, nx = Math.min(24, _pr.race.lastLeg + 1), live = prqLive() && prCanPlay();
  const targets = (_pr.entries || []).filter(e => !e.dnf && !(currentPlayer && e.playerId === currentPlayer.id));
  if(!targets.find(e => String(e.id) === String(_prqHazT))) _prqHazT = targets[0] ? targets[0].id : '';
  if(!items[_prqHaz]) _prqHaz = Object.keys(items)[0];
  const pend = (x.hazards || []).filter(h => h.leg === nx), nm = id => prqName((_pr.entries || []).find(e => e.id === id));
  const taken = pend.some(h => String(h.entryId) === String(_prqHazT)), used = Number(x.myHazards || 0), maxH = Number(c.perPlayerRace || 5);
  const hasUmb = me && (x.umbrellas || []).includes(me.id), wc = Number((_pr.settings || {}).walletCap || 60);
  return `<div class="gp-card"><div class="gp-hdr"><h3>😈 Chaos Shop</h3><span class="gp-badge">${used}/${maxH} used</span></div>
    <div class="prq-shop">${Object.keys(items).map(k => `<button class="${k === _prqHaz ? 'on' : ''}" onclick="_prqHaz='${k}';prRender()"><b>${items[k].emoji}</b>${prEsc(items[k].name)}<span>−${items[k].pct}% speed</span><i>${items[k].cost} 🪙</i></button>`).join('')}</div>
    <div class="row prq-row"><select onchange="_prqHazT=this.value;prRender()">${prqOpts(targets, _prqHazT)}</select>
      <button class="pr-btn red" ${prDis(!live ? 'Race not running' : !targets.length ? 'No targets' : taken ? 'Already has a hazard next leg' : used >= maxH && 'Max hazards this race')} onclick="prqDo('haz:${_prqHaz}:${_prqHazT}','Throw ${prEsc(String((items[_prqHaz] || {}).name || '').replace(/[\'"\\]/g, ''))} for ${(items[_prqHaz] || {}).cost} SMB Tokens?')">Throw for Leg ${nx}!</button></div>
    <div class="pr-muted" style="font-size:12px;margin-top:6px">One hazard per racer per leg. Healthy pets dodge (health 90+: ${c.dodgeHi}%, 70+: ${c.dodgeMid}%, else ${c.dodgeLo}%). If the pet doesn't run that leg, you get your tokens back.</div>
    ${pend.length ? `<div class="prq-mine"><b>Incoming on Leg ${nx}</b>${pend.map(h => `<div>${(items[h.key] || {}).emoji || '❓'} → ${prEsc(nm(h.entryId))} <span class="pr-muted">by ${prEsc(h.by)}</span></div>`).join('')}</div>` : ''}
    ${me && !me.dnf ? `<div class="pr-hl"><span>☂️ Umbrella blocks the next hazard on ${prEsc(me.petName)}. Paid from your race wallet (${me.walletUsed}/${wc}).</span>
      <button class="pr-btn ghost" ${prDis(!live ? 'Race not running' : hasUmb ? 'Already holding one' : me.walletUsed + Number(c.umbrellaCost || 8) > wc && 'Race wallet full')} onclick="prqDo('umb')">${hasUmb ? '☂️ Ready' : `☂️ ${Number(c.umbrellaCost || 8)} 🪙`}</button></div>` : ''}</div>`;
}
function prqBountyCard(){
  const x = prqX(), c = x.cfg.bounty || {}; if(c.on === false) return '';
  const lead = (_pr.entries || []).find(e => !e.dnf), b = x.bounty || {}, live = prqLive() && prCanPlay() && _pr.race.lastLeg < 23;
  const adds = [5,10,25,50,100].filter(v => v >= Number(c.min || 5) && v <= Number(c.max || 100)).slice(-3);
  return `<div class="gp-card"><div class="gp-hdr"><h3>👑 Bounty on the leader</h3><span class="gp-badge">${Number(c.cut || 20)}% cut</span></div>
    <div class="prq-bounty"><div><div class="pr-muted" style="font-size:12px">Target</div><b>${prEsc(prqName(lead))}</b><div class="pr-muted" style="font-size:12px">${lead ? prEsc(lead.playerName) : ''}</div></div>
      <div style="text-align:right"><div class="pr-muted" style="font-size:12px">Pot</div><div class="prq-pot">🪙 ${Number(b.pot || 0)}</div></div></div>
    <div class="pr-muted" style="font-size:12px;margin:8px 0">The pot goes to whoever takes 1st place from the leader. If the Intern takes the lead, he keeps the pot "for review." If nobody passes the leader, it carries over to the next leg.</div>
    <div class="row prq-row">${adds.map(v => `<button class="pr-btn" ${prDis(!live && 'Bounty opens while the race runs')} onclick="prqDo('bounty:${v}', ${v >= 50 ? `'Add ${v} SMB Tokens to the bounty?'` : 'null'})">+${v} 🪙</button>`).join('')}</div>
    ${(b.recent || []).length ? `<div class="pr-muted" style="font-size:12px;margin-top:8px">${b.recent.map(z => `🪙 ${prEsc(z.name)} +${z.amount}`).join(' · ')}</div>` : ''}</div>`;
}
function prqRivalCard(me){
  const x = prqX(), c = x.cfg.rival || {}; if(c.on === false) return '';
  const live = prqLive() && prCanPlay() && _pr.race.lastLeg < Number((x.cfg.bets || {}).closeLeg || 16);
  const opp = (_pr.entries || []).filter(e => !e.dnf && me && e.id !== me.id);
  if(!opp.find(e => String(e.id) === String(_prqRivT))) _prqRivT = opp[0] ? opp[0].id : '';
  const amts = [10,25,50].filter(v => v >= Number(c.min || 10) && v <= Number(c.max || 50));
  if(!amts.includes(_prqRivAmt)) _prqRivAmt = amts[0];
  const pid = currentPlayer && currentPlayer.id, list = x.rivals || [];
  const row = v => { const toMe = v.status === 'pending' && v.opp === pid;
    const st = v.status === 'pending' ? `⏳ waiting${v.expiresAt ? ' · ' + prFmtDur(v.expiresAt - prNow()) : ''}` : v.status === 'active' ? '🔥 on' : v.status === 'won' || v.status === 'lost' ? `🏁 ${v.winner === v.byPlayer ? prEsc(v.myPet) : prEsc(v.oppPet)} won` : prEsc(v.status);
    return `<div>⚔️ <b>${prEsc(v.myPet)}</b> vs <b>${v.opp === '_intern' ? '🪱 ' : ''}${prEsc(v.oppPet)}</b> · ${v.amount} 🪙 · <span class="pr-muted">${st}</span>
      ${toMe ? ` <button class="pr-btn" style="padding:3px 8px;font-size:11px" onclick="prqDo('raccept:${v.id}','Accept for ${v.amount} SMB Tokens?')">Accept</button> <button class="pr-btn ghost" style="padding:3px 8px;font-size:11px" onclick="prqDo('rdecline:${v.id}')">Decline</button>` : ''}</div>`; };
  return `<div class="gp-card"><div class="gp-hdr"><h3>⚔️ Rival bets</h3><span class="gp-badge">${Number(c.cut || 10)}% cut</span></div>
    ${me && !me.dnf ? `<div class="row prq-row"><span style="font-size:13px"><b>${prEsc(me.petName)}</b> vs</span><select onchange="_prqRivT=this.value;prRender()">${prqOpts(opp, _prqRivT)}</select>
      ${amts.map(v => `<button class="prq-amt ${v === _prqRivAmt ? 'on' : ''}" onclick="_prqRivAmt=${v};prRender()">${v}</button>`).join('')}
      <button class="pr-btn" ${prDis(!live && 'Rival bets are closed')} onclick="prqDo('rival:${_prqRivT}:${_prqRivAmt}','Call out for ${_prqRivAmt} SMB Tokens each?')">Call out 📣</button></div>
      <div class="pr-muted" style="font-size:12px;margin-top:6px">They have ${Number(c.acceptHours || 2)}h to accept, or you get your stake back. Whoever finishes ahead takes the pot. If you call out the 🪱 Intern, the house matches your stake right away.</div>`
    : '<div class="pr-muted" style="font-size:12.5px">Racers can call each other out here. Spectators: watch the drama. 🍿</div>'}
    ${list.length ? `<div class="prq-mine">${list.map(row).join('')}</div>` : ''}</div>`;
}
function prqHypeCard(me){
  const x = prqX(), c = x.cfg.hype || {}; if(c.on === false) return '';
  const hy = x.hype || {}, list = (_pr.entries || []).filter(e => !e.dnf || hy[e.id]), mx = Math.max(1, ...list.map(e => Number(hy[e.id] || 0)));
  const opts = list.filter(e => !(currentPlayer && e.playerId === currentPlayer.id));
  if(!opts.find(e => String(e.id) === String(_prqHypeT))) _prqHypeT = opts[0] ? opts[0].id : '';
  const live = prqLive() && prCanPlay(), used = Number(x.myHype || 0), maxH = Number(c.perRace || 50);
  const crowd = x.crowd;
  return `<div class="gp-card"><div class="gp-hdr"><h3>📣 Crowd Favorite</h3><span class="gp-badge">${used}/${maxH} hype</span></div>
    ${crowd ? `<div class="pr-hl"><span>🏆 Crowd Favorite: <b>${prEsc(crowd.petName)}</b> (${prEsc(crowd.playerName)}) · ${crowd.hype} hype</span></div>` : ''}
    <div class="prq-bars">${list.slice().sort((a, b) => Number(hy[b.id] || 0) - Number(hy[a.id] || 0)).map(e => `<div><span>${prEsc(prqName(e))} <span class="pr-muted">· ${Number(hy[e.id] || 0)}</span></span><i style="width:${Number(hy[e.id] || 0) / mx * 100}%"></i></div>`).join('')}</div>
    <div class="row prq-row"><select onchange="_prqHypeT=this.value;prRender()">${prqOpts(opts, _prqHypeT)}</select>
      <button class="pr-btn" ${prDis(!live ? 'Race not running' : used >= maxH && 'Max hype this race')} onclick="prqDo('hype:${_prqHypeT}')">📣 HYPE · ${Number(c.price || 1)} 🪙</button></div>
    <div class="pr-muted" style="font-size:12px;margin-top:6px">Hype is for bragging rights only and doesn't add speed. The most-hyped pet becomes the Crowd Favorite 🏆 when the race ends. (The 📣 cheer button in Standings is different: it gives a small speed boost.)</div></div>`;
}
// hazard + umbrella markers on the live track lanes
function prqTrackDecor(){
  const x = prqX(), host = document.getElementById('prTrack'); if(!x || !host || !_pr.race) return;
  const nx = _pr.race.lastLeg + 1, items = ((x.cfg.chaos || {}).items) || {};
  host.querySelectorAll('.prq-hz').forEach(n => n.remove());
  host.querySelectorAll('.pr-lane[data-id]').forEach(l => {
    const id = Number(l.dataset.id), hz = (x.hazards || []).filter(h => h.entryId === id && h.leg === nx).map(h => (items[h.key] || {}).emoji || '❓').join('');
    const um = (x.umbrellas || []).includes(id) ? '☂️' : '';
    if(hz || um){ const s = document.createElement('span'); s.className = 'prq-hz'; s.title = 'Next leg'; s.textContent = um + hz; l.appendChild(s); }
  });
}
function prqRules(){
  const x = prqX(); if(!x) return '';
  const i = x.cfg.intern || {};
  return `• 🪱 <b>${prEsc(i.name || 'The Intern')}</b> is a house racer in every race. His strength is set by the house each race, and nobody knows how strong he is. He never takes a prize spot: ₱ prizes always go to the top 3 staff racers. Every racer who finishes ahead of him gets +${Number(i.bonus || 30)} 🪙 (more if he was on Boss Mode, which is revealed after the race).<br>
    • 🎰 Bets, 😈 hazards, 👑 bounty, ⚔️ rivals and 📣 hype are paid by spectators and racers outside the race wallet. Only the hazards and weather change speed. Tokens still can't buy speed for your own pet.<br>`;
}

// ── admin: Extras & Intern
let _praq = null;
async function praqLoad(){ const j = await praCall('x_get'); if(j && j.ok){ _praq = j; prAdminRender(); } else { const el = document.getElementById('praqBox'); if(el) el.innerHTML = `<div class="empty-state">${prEsc((j && j.error) || 'Could not load extras')}</div>`; } }
async function praqSave(payload){
  const j = await praCall('x_save', payload);
  if(!j || !j.ok){ alert((j && j.error) || 'Save failed'); return; }
  _praq = j; prAdminRender();
  const m = document.getElementById('praqMsg'); if(m) m.textContent = '✅ Saved';
}
const PRAQ_FIELDS = [
  ['🎰 Betting', [['bets.on','On','bool'],['bets.cut','House cut %','num'],['bets.min','Min bet','num'],['bets.max','Max bet','num'],['bets.perRace','Max per player per race','num'],['bets.closeLeg','Closes after leg','num']]],
  ['😈 Chaos Shop', [['chaos.on','On','bool'],['chaos.perPlayerRace','Hazards per player per race','num'],['chaos.umbrellaCost','Umbrella cost (race wallet)','num'],['chaos.dodgeHi','Dodge % at health 90+','num'],['chaos.dodgeMid','Dodge % at health 70+','num'],['chaos.dodgeLo','Dodge % below 70','num'],
    ['chaos.items.banana.cost','🍌 cost','num'],['chaos.items.banana.pct','🍌 −% speed','num'],['chaos.items.call.cost','📞 cost','num'],['chaos.items.call.pct','📞 −% speed','num'],
    ['chaos.items.meeting.cost','🗓️ cost','num'],['chaos.items.meeting.pct','🗓️ −% speed','num'],['chaos.items.ping.cost','🔔 cost','num'],['chaos.items.ping.pct','🔔 −% speed','num']]],
  ['👑 Bounty · ⚔️ Rivals · 📣 Hype', [['bounty.on','Bounty on','bool'],['bounty.cut','Bounty cut %','num'],['rival.on','Rivals on','bool'],['rival.cut','Rival cut %','num'],['rival.min','Rival min','num'],['rival.max','Rival max','num'],['rival.perRace','Rivals per player','num'],
    ['hype.on','Hype on','bool'],['hype.price','Hype price','num'],['hype.perRace','Hype per player per race','num'],['hype.entrancePrice','Hype Entrance price','num']]],
  ['🌦️ Weather · 🪱 Intern', [['weather.on','Weather on','bool'],['weather.pct','Weather boost %','num'],['weather.minus','Weather penalty %','num'],['intern.on','Intern joins new races','bool'],['intern.name','Intern name','text'],['intern.bonus','Bonus for beating him','num'],['intern.bossBonus','Bonus on Boss Mode','num']]]
];
function praqHtml(){
  if(!_praq){ setTimeout(praqLoad, 0); return '<div id="praqBox" class="empty-state">Loading extras…</div>'; }
  const a = _praq, cfg = a.cfg || {}, d = Number(a.internDiff ?? 1), wx = a.weather || [], next = (a.lastLeg || 0) + 1;
  const burns = (a.burn || []).map(b => `<div class="pra-f"><label>Race #${b.raceId} · ${prEsc(b.status)}<small>${Object.entries(b.byKind || {}).map(([k, v]) => `${k} ${v}`).join(' · ')}</small></label><div class="prq-burn">🔥 ${Number(b.total || 0)} 🪙</div></div>`).join('') || '<div class="pr-muted">No extras spending yet.</div>';
  let h = `<div id="praqBox"><div class="pra-sec">🪱 ${prEsc((cfg.intern || {}).name || 'Intern')}: strength this race (hidden from players)</div>
    <div class="prq-diff">${[['😴 Easy','×0.85 of the field'],['😐 Normal','×1.00 of the field'],['🔥 Boss','×1.10 of the field']].map((v, i) => `<button class="${i === d ? 'on d' + i : ''}" ${a.internLocked ? 'disabled' : ''} onclick="praqSave({internDiff:${i}})"><b>${v[0]}</b><small>${v[1]}</small></button>`).join('')}</div>
    <div class="pr-muted" style="font-size:12px;margin-top:6px">${a.internLocked ? '🔒 Locked: his strength is fixed once registration closes. Set it for next race when registration opens.' : 'You can change this until registration closes.'} He paces off the median staff pet each leg, so well-cared pets can still beat him. He never takes a prize spot. Boss Mode is revealed in the feed after the race. Admin accounts (the race's excluded list) can't bet or use any extras.</div>`;
  if(wx.length && ['locked','racing'].includes(a.status)) h += `<div class="pra-sec">🌦️ Weather plan</div><div class="prq-wx">${wx.map((t, i) => `<div class="${i + 1 === next ? 'now' : i + 1 < next ? 'past' : ''}"><b>${PRQ_WX[t][0]}</b>Leg ${i + 1}</div>`).join('')}</div>
    <div class="row prq-row"><select id="praqWxLeg">${wx.map((t, i) => i + 1 >= next ? `<option value="${i + 1}">Leg ${i + 1}</option>` : '').join('')}</select>
    <select id="praqWxType">${Object.keys(PRQ_WX).map(k => `<option value="${k}">${PRQ_WX[k][0]} ${PRQ_WX[k][1]}</option>`).join('')}</select>
    <button class="btn btn-outline btn-sm" onclick="praqSave({weather:{leg:Number(document.getElementById('praqWxLeg').value),type:document.getElementById('praqWxType').value}})">Set weather</button></div>`;
  h += `<div class="pra-sec">🔥 Token burn from extras</div><div class="pra-form">${burns}</div>
    <div class="pr-muted" style="font-size:12px">Burn = tokens paid into bets, hazards, umbrellas, bounty, rivals, hype and entrances, minus everything paid back out (winnings, refunds, Intern bonuses).</div>`;
  h += PRAQ_FIELDS.map(([sec, fs]) => `<div class="pra-sec">${sec}</div><div class="pra-form">${fs.map(([k, lab, t]) => { const v = praGet(cfg, k);
    const inp = t === 'bool' ? `<select data-qk="${k}" data-t="bool"><option value="true" ${v !== false ? 'selected' : ''}>On</option><option value="false" ${v === false ? 'selected' : ''}>Off</option></select>`
      : `<input data-qk="${k}" data-t="${t}" type="${t === 'text' ? 'text' : 'number'}" value="${prEsc(v ?? '')}">`;
    return `<div class="pra-f"><label>${lab}</label>${inp}</div>`; }).join('')}</div>`).join('');
  h += `<div class="pra-save"><span class="pra-msg" id="praqMsg"></span><span><button class="btn btn-outline btn-sm" onclick="_praq=null;prAdminRender()">Reload</button> <button class="btn btn-gold" onclick="praqSaveCfg()">💾 Save extras</button></span></div></div>`;
  return h;
}
function praqSaveCfg(){
  const x = {};
  document.querySelectorAll('#praqBox [data-qk]').forEach(el => {
    const path = el.dataset.qk.split('.'), t = el.dataset.t;
    const v = t === 'bool' ? el.value === 'true' : t === 'num' ? Number(el.value) : el.value;
    let o = x; path.slice(0, -1).forEach(p => { o[p] = o[p] || {}; o = o[p]; }); o[path[path.length - 1]] = v;
  });
  // keep sibling keys the form doesn't show (item names/emoji, weights, multipliers)
  const cur = (_praq && _praq.cfg) || {};
  Object.keys(x).forEach(k => { x[k] = prqDeep(cur[k] || {}, x[k]); });
  praqSave({x});
}
function prqDeep(a, b){ const o = Object.assign({}, a); Object.keys(b).forEach(k => { o[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) ? prqDeep(a[k] || {}, b[k]) : b[k]; }); return o; }
