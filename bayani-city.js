// ═══════════════════════════════════════════════════════════════════════════
//  bayani-city.js — Bayani City: board page + admin controls · SMB Game Portal
//  v3 · 2026-11-06 · Admin Live Board + tap a player for their full avatar · load after avatar-studio.js. Backend: bingo-games action "city"
//  (bayanicity.sql + vouchers.sql). API: see API.md.
//
//  Player side: Games → 🏙️ Bayani City
//   • Off (and not a beta tester): "Coming soon" preview.
//   • On / beta: the live board. Roll (3 per shift), buy / pass, upgrade / sell, trades,
//     standings, feed. Polls every 20 s while the tab is open.
//  Admin side: 🏙️ Bayani City tab → Open/Beta + season controls, board design, rules,
//   Slack webhook, coin adjustments, vouchers.
//  Board designs (themes) only rename tiles and recolor the board. Rules, prices and tile
//   positions never change, so a theme can be switched mid-season safely.
//  Also: hides the retired "Avatar gender switch" fee from Admin → Shop & Cosmetics.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof GP_TITLES === 'undefined' || typeof gpGo !== 'function') return;

// ── Board: 24 tiles, same order/prices as cityEngine.ts / bingo_city_tiles() ──
const T = [
  ['start',null,0,1,1],['spot','brown',60,2,1],['spot','brown',80,3,1],['swerte',null,0,4,1],
  ['spot','sky',100,5,1],['spot','sky',120,6,1],['overtime',null,0,7,1],['spot','sky',140,7,2],
  ['transit',null,200,7,3],['spot','pink',160,7,4],['tax',null,75,7,5],['spot','pink',180,7,6],
  ['kape',null,0,7,7],['spot','orange',200,6,7],['spot','orange',220,5,7],['swerte',null,0,4,7],
  ['spot','red',240,3,7],['spot','red',260,2,7],['gotoOvertime',null,0,1,7],['spot','red',280,1,6],
  ['tax',null,100,1,5],['transit',null,200,1,4],['spot','blue',320,1,3],['spot','blue',400,1,2],
].map(([type, group, price, col, row], i) => ({ i, type, group, price, col, row }));
const GC = { brown:'#a0612b', sky:'#5bc0eb', pink:'#ff7eb6', orange:'#ff9f43', red:'#e74c3c', blue:'#2f5fd0' };
const TC = { start:'#3ddc97', transit:'#4b5563', tax:'#c9bfa5', swerte:'#c9bfa5', overtime:'#8a94a6', gotoOvertime:'#8a94a6', kape:'#f5b942' };
const ICON = { start:'🏁', transit:'🚌', tax:'🧾', swerte:'🍀', overtime:'⏰', gotoOvertime:'🚨', kape:'☕' };
const LEVELS = ['', 'Stall', 'Shop', 'Café', 'Office'];
const RENT_MULT = [1,3,5,8,12], TRANSIT_RENT = [0,25,60];
const baseRent = t => Math.round(t.price * 0.1), upCost = t => Math.round(t.price * 0.5);

// ── Board designs. Index → name for the 16 spots, 2 transit stops, 2 taxes. ──
const FIXED = { 0:'SIMULA', 3:'Swerte Card', 6:'OVERTIME', 12:'LIBRENG KAPE', 15:'Swerte Card', 18:'GO TO OVERTIME' };
const THEMES = {
  classic:    { label:'Bayani City', sub:'Classic Pinoy mix', flag:'🇵🇭', bg:'#173a2c', center:'#f2e6cf', title:'BAYANI CITY',
    n:['Sari-Sari Store','Karinderya','Tiangge','Boracay','Palawan','Jeepney Terminal','Intramuros','Kuryente Bill','Vigan','Night Market','Mall of Bayani','Palengke','Baguio','Banaue','Payday Tax','LRT Station','BGC Tower','SMB HQ'] },
  northluzon: { label:'North Luzon Road Trip', sub:'Ilocos, Cordillera, Batanes', flag:'⛰️', bg:'#1f3b2a', center:'#eef0e2', title:'NORTH LUZON',
    n:['Hundred Islands','Pagudpud','Calle Crisologo','La Union','Baler','Bus Terminal','Sagada','Toll Fee','Kalinga','Burnham Park','Session Road','Banaue Terraces','Mt. Pulag','Batad','Gas Up','Cubao Bus Hub','Basco Lighthouse','Batanes'] },
  visayas:    { label:'Visayas Island Hop', sub:'Cebu, Bohol, Panay, Negros', flag:'🏝️', bg:'#0e4d64', center:'#e8f6f6', title:'VISAYAS',
    n:['Bantayan','Malapascua','Moalboal','Kawasan Falls','Oslob','Fast Craft Port','Chocolate Hills','Terminal Fee','Panglao','Siquijor','Apo Island','Guimaras','Iloilo Esplanade','Kalanggaman','Environmental Fee','RoRo Pier','Puka Beach','Boracay White Beach'] },
  mindanao:   { label:'Mindanao Wonders', sub:'Siargao, Camiguin, Davao', flag:'🌋', bg:'#3a2c18', center:'#f6eedc', title:'MINDANAO',
    n:['Dahican','Lake Sebu','Tinuy-an Falls','Enchanted River','Britania Islands','Habal-habal Stand','White Island','Pier Fee','Mantigue Island','Samal Island','Eden Nature Park','Mt. Apo','Paseo del Mar','Sohoton Cove','Tourist Fee','Ferry Terminal','Cloud 9','Siargao'] },
  asia:       { label:'Asia Tour', sub:'Bangkok to Tokyo', flag:'🌏', bg:'#4a1d2f', center:'#f8ece9', title:'ASIA TOUR',
    n:['Hanoi','Siem Reap','Bangkok','Kuala Lumpur','Bali','MRT Line','Taipei','Visa Fee','Hong Kong','Seoul','Busan','Osaka','Kyoto','Tokyo','Travel Tax','Shinkansen','Marina Bay','Dubai'] },
  world:      { label:'World Tour', sub:'Famous places around the globe', flag:'🌍', bg:'#1d2b4a', center:'#eaf0fb', title:'WORLD TOUR',
    n:['Cairo','Marrakech','Istanbul','Santorini','Rome','Airport Express','Barcelona','Visa Fee','Paris','London','Amsterdam','Rio de Janeiro','Machu Picchu','Sydney','Travel Tax','Bullet Train','New York','Swiss Alps'] },
};
const NAMED = [1,2,4,5,7,8,9,10,11,13,14,16,17,19,20,21,22,23];   // tiles that take a theme name, in order
function themeOf(id){ return THEMES[id] || THEMES.classic; }
function tileName(i, th){ if(FIXED[i]) return FIXED[i]; const k = NAMED.indexOf(i); return themeOf(th).n[k] || ('Tile ' + i); }

const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? ''));
const me = () => (typeof currentPlayer !== 'undefined' && currentPlayer) ? currentPlayer : null;

// ── status ──
function cfg(){ return (typeof GAMES_CFG !== 'undefined' && GAMES_CFG && GAMES_CFG.bayanicity) || {}; }
function isBeta(){
  const p = me(); if(!p) return false;
  const n = String(p.name || '').trim().toLowerCase(), first = n.split(/\s+/)[0];
  return String(cfg().beta || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some(x => x === n || x === first);
}
function status(){ return cfg().on === true ? 'open' : isBeta() ? 'beta' : 'soon'; }

// ═════════════════════ PLAYER SIDE ═════════════════════
GP_TITLES.city = 'Bayani City';
const BC = { data:null, loading:false, busy:false, msg:'', msgOk:true, last:[], sel:null, poll:null, at:0,
             tf:{ open:false, to:'', give:[], ask:[], gc:0, ac:0 } };

async function cityCall(action, args){
  const p = me(); if(!p) return { ok:false, error:'Log in first.' };
  try {
    const r = await fetch(GAMES_URL, { method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'city', playerId:p.id, playerName:p.name, cityAction:action, args:args || {} }) });
    return await r.json();
  } catch(e){ return { ok:false, error:'Network error. Try ulit.' }; }
}
async function load(force){
  if(BC.loading || (BC.busy && !force)) return;
  BC.loading = true;
  const j = await cityCall('state');
  BC.loading = false; BC.at = Date.now();
  if(j.ok) BC.data = j; else { BC.data = { error:j.error }; }
  render();
}
async function act(action, args){
  if(BC.busy) return;
  BC.busy = true; BC.msg = ''; render();
  const j = await cityCall(action, args);
  BC.busy = false;
  if(j.ok){ BC.data = j; BC.last = j.events || []; BC.msg = ''; if(action === 'trade_offer'){ BC.tf = { open:false, to:'', give:[], ask:[], gc:0, ac:0 }; } }
  else { BC.msg = j.error || 'Hindi na-process. Try ulit.'; BC.msgOk = false; }
  render();
  if(j.ok && (j.events || []).some(e => e.type === 'voucher') && typeof window.renderVouchers === 'function'){ try { await loadDB(); window.renderVouchers(); } catch(e){} }
}
window.bcAct = (a, args) => act(a, args);
window.bcSel = i => { BC.sel = BC.sel === i ? null : i; render(); };
window.bcTF = (k, v) => {
  const tf = BC.tf;
  if(k === 'open'){ tf.open = !tf.open; }
  else if(k === 'to'){ tf.to = v; tf.ask = []; }
  else if(k === 'give' || k === 'ask'){ const a = tf[k]; const i = a.indexOf(v); i >= 0 ? a.splice(i, 1) : a.push(v); }
  else if(k === 'gc' || k === 'ac'){ tf[k] = Math.max(0, Math.floor(Number(v) || 0)); return; }
  render();
};
window.bcOffer = () => {
  const tf = BC.tf;
  if(!tf.to){ BC.msg = 'Pick a player first.'; BC.msgOk = false; return render(); }
  act('trade_offer', { to:tf.to, giveSpots:tf.give, giveCoins:tf.gc, askSpots:tf.ask, askCoins:tf.ac });
};

function rentOf(d, i){
  const t = T[i], sp = d.spots[String(i)]; if(!sp || !sp.owner) return 0;
  if(t.type === 'transit') return TRANSIT_RENT[T.filter(x => x.type === 'transit' && d.spots[String(x.i)] && d.spots[String(x.i)].owner === sp.owner).length];
  if(sp.level > 0) return baseRent(t) * RENT_MULT[sp.level];
  const full = T.filter(x => x.group === t.group).every(x => d.spots[String(x.i)] && d.spots[String(x.i)].owner === sp.owner);
  return baseRent(t) * (full ? 2 : 1);
}
function ownsSet(d, pid, g){ return !!g && T.filter(x => x.group === g).every(x => d.spots[String(x.i)] && d.spots[String(x.i)].owner === pid); }
function pname(d, id){ const p = (d.players || []).find(x => x.id === id); return p ? p.name : 'Someone'; }
function head(id, size){ return typeof avatarHtml === 'function' ? avatarHtml(id, size || 20, false) : '🙂'; }
// tap / hover a player's head → floating card with their full avatar
function peekAttr(id, src){ return `onclick="bcPeek(event,'${esc(id)}','${src || 'p'}')" onmouseenter="bcPeek(event,'${esc(id)}','${src || 'p'}',1)" onmouseleave="bcPeekOff(1)"`; }
function peekData(src){ return src === 'a' ? (BA.data && BA.data.current && BA.data.current.live) : BC.data; }
let peekHoverOnly = false;
window.bcPeekOff = hover => { if(hover && !peekHoverOnly) return; const el = document.getElementById('bcPeek'); if(el) el.remove(); };
window.bcPeek = (ev, id, src, hover) => {
  ev.stopPropagation();
  if(hover && window.matchMedia && !window.matchMedia('(hover:hover)').matches) return;   // phones: tap only
  let el = document.getElementById('bcPeek');
  if(!hover && el && el.dataset.id === id && !peekHoverOnly){ el.remove(); return; }
  const d = peekData(src) || {}, p = (d.players || []).find(x => x.id === id);
  const th = (d.season && d.season.settings && d.season.settings.theme) || cfg().theme || 'classic';
  if(!el){ el = document.createElement('div'); el.id = 'bcPeek'; el.className = 'bc-peek'; document.body.appendChild(el); }
  el.dataset.id = id; peekHoverOnly = !!hover;
  el.innerHTML = `${typeof avatarHtml === 'function' ? avatarHtml(id, 120, false) : ''}
    <div class="bc-peek-n">${esc(p ? p.name : pname(d, id))}</div>
    ${p ? `<div class="bc-peek-s">📍 ${esc(tileName(p.pos, th))}<br>🪙 ${p.coins} coins · 🏙️ worth ${p.worth} · 🏠 ${p.spots}</div>` : ''}
    ${hover ? '' : '<small>tap anywhere to close</small>'}`;
  const r = ev.currentTarget.getBoundingClientRect(), w = 170, h = el.offsetHeight || 230;
  let x = r.left + r.width / 2 - w / 2, y = r.top - h - 8;
  if(y < 6) y = r.bottom + 8;
  x = Math.max(6, Math.min(x, window.innerWidth - w - 6));
  el.style.left = x + 'px'; el.style.top = Math.max(6, Math.min(y, window.innerHeight - h - 6)) + 'px';
};
document.addEventListener('click', () => { const el = document.getElementById('bcPeek'); if(el && !peekHoverOnly) el.remove(); });
window.addEventListener('scroll', () => { const el = document.getElementById('bcPeek'); if(el) el.remove(); }, { passive:true });

function evText(e, d, th){
  const x = e.data || {}, who = e.player ? esc(pname(d, e.player)) : '', tn = i => esc(tileName(i, th));
  switch(e.type){
    case 'rolled': return `🎲 ${who} rolled ${x.dice ? x.dice.join(' + ') : ''} → ${tn(x.to)}`;
    case 'simula': return `🏁 ${who} passed SIMULA: +${x.amount}`;
    case 'pet_find': return `🐾 ${who}'s pet found ${x.amount} coins!`;
    case 'can_buy': return `🏠 ${tn(x.tile)} is for sale: ${x.price}`;
    case 'bought': return `🏠 ${who} bought ${tn(x.tile)} for ${x.price}`;
    case 'full_set': return `🌟 ${who} owns the whole set. Double rent!`;
    case 'passed': return `↪️ ${who} passed on ${tn(x.tile)}`;
    case 'auto_pass': return `↪️ ${who} didn't decide on ${tn(x.tile)} (auto-pass)`;
    case 'rent': return `💸 ${who} paid ${x.amount} rent to ${esc(pname(d, x.to))} (${tn(x.tile)})`;
    case 'tax': return `🧾 ${who} paid ${x.amount} (${tn(x.tile)})`;
    case 'kape': return `☕ ${who} got libreng kape: +${x.amount}`;
    case 'swerte': return `🍀 ${who}: ${esc(x.text)}`;
    case 'voucher': return `🎟️ ${who} got a free BINGO card voucher!`;
    case 'sent_to_overtime': return `🚨 ${who} was sent to OVERTIME`;
    case 'overtime_served': return `⏰ ${who} clocked out of OVERTIME (used a roll)`;
    case 'overtime_paid': return `⏰ ${who} paid ${x.fee} to clock out early`;
    case 'auto_sold': return `🏚️ ${who} had to sell ${tn(x.tile)} (+${x.refund})`;
    case 'broke': return `😵 ${who} couldn't pay it all (${x.paid} of ${x.owed}). The rest is forgiven.`;
    case 'allowance': return `🤝 ${who} got a ${x.amount}-coin allowance`;
    case 'upgraded': return `🏗️ ${who} built a ${esc(x.levelName)} on ${tn(x.tile)}`;
    case 'sold': return `🏷️ ${who} sold ${tn(x.tile)} (+${x.refund})`;
    case 'trade_offer': return `🤝 ${who} sent a trade offer to ${esc(pname(d, x.to))}`;
    case 'trade_done': return `🤝 ${who} and ${esc(pname(d, x.with))} closed a trade`;
    case 'trade_declined': return `🙅 ${who} declined/cancelled a trade`;
    case 'admin_adjust': return `🛠️ Admin adjusted ${who}'s coins (${x.delta > 0 ? '+' : ''}${x.delta})`;
    case 'week1_top': return `📈 Week 1 top earner: ${who} (+${x.gain})`;
    case 'placement_voucher': return `🏆 ${who} placed #${x.place} and got vouchers`;
    case 'season_created': return `🏙️ Season created with ${x.players} players`;
    case 'season_ended': return `🏁 Season over!`;
    default: return `${who} ${esc(e.type)}`;
  }
}

function boardHtml(d, th, noTokens){
  const theme = themeOf(th), spots = (d && d.spots) || {}, players = (d && d.players) || [];
  const myId = me() && me().id, myPos = d && d.me ? d.me.pos : 0;
  const byPos = {}; players.forEach(p => { (byPos[p.pos] = byPos[p.pos] || []).push(p.id); });
  if(!d && !noTokens){ byPos[0] = me() ? [me().id] : []; }
  const lastRoll = (BC.last || []).find(e => e.type === 'rolled') || ((d && d.feed) || []).find(e => e.type === 'rolled' && e.player === myId);
  const dice = lastRoll && lastRoll.data && lastRoll.data.dice ? lastRoll.data.dice : [4, 3];
  const tiles = T.map(t => {
    const bar = t.group ? GC[t.group] : TC[t.type], sp = spots[String(t.i)];
    const sub = t.type === 'spot' || t.type === 'transit' ? (sp && sp.owner ? `rent ${rentOf(d, t.i)}` : `${t.price}`) : t.type === 'tax' ? `pay ${t.price}` : t.type === 'start' ? '+200' : '';
    const own = sp && sp.owner ? `<span class="bc-own" title="${esc(pname(d, sp.owner))}" ${d ? peekAttr(sp.owner) : ''}>${head(sp.owner, 16)}${sp.level ? `<em>${'●'.repeat(sp.level)}</em>` : ''}</span>` : '';
    const here = (byPos[t.i] || []);
    const toks = here.slice(0, 4).map(id => `<span class="bc-tk${id === myId ? ' me' : ''}" ${d ? peekAttr(id) : ''}>${head(id, 22)}</span>`).join('') + (here.length > 4 ? `<span class="bc-more">+${here.length - 4}</span>` : '');
    return `<div class="bc-tile${t.type === 'start' ? ' start' : ''}${BC.sel === t.i ? ' sel' : ''}${d && d.me && t.i === myPos ? ' here' : ''}" style="grid-column:${t.col};grid-row:${t.row}" onclick="bcSel(${t.i})">
      <i style="background:${bar}"></i><b>${t.type !== 'spot' && ICON[t.type] ? ICON[t.type] + ' ' : ''}${esc(tileName(t.i, th))}</b>${sub ? `<span>${sub}</span>` : ''}${own}
      ${toks ? `<div class="bc-toks">${toks}</div>` : ''}</div>`;
  }).join('');
  return `<div class="bc-board" style="background:${theme.bg}">${tiles}
    <div class="bc-center" style="background:${theme.center}">
      <div class="bc-logo">${esc(theme.title)}</div><div class="bc-tag">${theme.flag} ${esc(theme.label)}</div>
      <div class="bc-dice${BC.busy ? ' roll' : ''}"><span>${dice[0]}</span><span>${dice[1]}</span></div>
      ${d && d.me ? centerControls(d, th) : ''}
    </div></div>`;
}
function centerControls(d, th){
  const m = d.me;
  if(typeof m.pending === 'number'){
    const t = T[m.pending];
    return `<div class="bc-ctl"><div>${esc(tileName(m.pending, th))} · <b>${t.price}</b></div>
      <div class="bc-row"><button class="btn btn-gold btn-sm" ${BC.busy || m.coins < t.price ? 'disabled' : ''} onclick="bcAct('buy')">Buy</button>
      <button class="btn btn-outline btn-sm" ${BC.busy ? 'disabled' : ''} onclick="bcAct('pass')">Pass</button></div>
      ${m.coins < t.price ? '<small>Kulang ang coins.</small>' : ''}</div>`;
  }
  if(m.rollsLeft <= 0) return `<div class="bc-ctl"><small>No rolls left this shift.<br>Balik ka bukas ng 9 PM!</small></div>`;
  if(m.inOvertime){
    const fee = (d.season.settings || {}).overtimeFee || 50;
    return `<div class="bc-ctl"><div>⏰ You're in OVERTIME</div><div class="bc-row">
      <button class="btn btn-outline btn-sm" ${BC.busy ? 'disabled' : ''} onclick="bcAct('roll')">Clock out (uses a roll)</button>
      <button class="btn btn-gold btn-sm" ${BC.busy || m.coins < fee ? 'disabled' : ''} onclick="bcAct('roll',{payOvertime:true})">Pay ${fee} & roll</button></div></div>`;
  }
  return `<div class="bc-ctl"><button class="btn btn-gold bc-roll" ${BC.busy ? 'disabled' : ''} onclick="bcAct('roll')">🎲 Roll</button><small>${m.rollsLeft} roll${m.rollsLeft === 1 ? '' : 's'} left this shift</small></div>`;
}
function tileInfo(d, th){
  if(BC.sel === null || BC.sel === undefined) return '';
  const t = T[BC.sel], sp = d.spots[String(t.i)], myId = me().id;
  let h = `<div class="bc-card"><div class="bc-h">${t.type !== 'spot' && ICON[t.type] ? ICON[t.type] + ' ' : ''}${esc(tileName(t.i, th))} <button class="bc-x" onclick="bcSel(${t.i})">✕</button></div>`;
  if(t.type === 'spot' || t.type === 'transit'){
    h += `<div class="bc-kv"><span>Price</span><b>${t.price}</b></div>`;
    if(t.type === 'spot') h += `<div class="bc-kv"><span>Rent</span><b>${baseRent(t)} · set ${baseRent(t) * 2} · ${RENT_MULT.slice(1).map(m => baseRent(t) * m).join(' / ')}</b></div><div class="bc-kv"><span>Upgrade</span><b>${upCost(t)} per level</b></div>`;
    else h += `<div class="bc-kv"><span>Rent</span><b>25 (1 stop) · 60 (both)</b></div>`;
    h += `<div class="bc-kv"><span>Owner</span><b>${sp && sp.owner ? esc(pname(d, sp.owner)) + (sp.level ? ` · ${LEVELS[sp.level]}` : '') : 'For sale'}</b></div>`;
    if(sp && sp.owner === myId){
      const canUp = t.type === 'spot' && ownsSet(d, myId, t.group) && sp.level < 4;
      const refund = Math.floor((t.price + sp.level * upCost(t)) / 2);
      h += `<div class="bc-row">${canUp ? `<button class="btn btn-gold btn-sm" ${BC.busy || d.me.coins < upCost(t) ? 'disabled' : ''} onclick="bcAct('upgrade',{tile:${t.i}})">Build ${LEVELS[sp.level + 1]} · ${upCost(t)}</button>` : ''}
        <button class="btn btn-outline btn-sm" ${BC.busy ? 'disabled' : ''} onclick="if(confirm('Sell ${esc(tileName(t.i, th)).replace(/'/g, '')} to the bank for ${refund}?')) bcAct('sell',{tile:${t.i}})">Sell · +${refund}</button></div>`;
      if(t.type === 'spot' && !ownsSet(d, myId, t.group)) h += `<small>Own the whole color set to build.</small>`;
    }
  } else {
    const info = { start:'Pass or land: +200 coins.', swerte:'Draw a Swerte Card. Good or bad, depende sa swerte!', overtime:'Just visiting. If you were sent here, your next roll clocks you out (or pay to roll right away).',
      gotoOvertime:'Go straight to OVERTIME.', kape:'Free coffee: 10 to 50 coins.', tax:`Pay ${t.price}.` }[t.type] || '';
    h += `<small>${info}</small>`;
  }
  return h + '</div>';
}
function tradesHtml(d, th){
  const myId = me().id, tr = d.trades || { incoming:[], outgoing:[] }, fee = (d.season.settings || {}).tradeFee ?? 10;
  const sum = o => {
    const nm = a => (a || []).map(i => esc(tileName(i, th))).join(', ');
    const g = [nm(o.giveSpots), o.giveCoins ? `${o.giveCoins} coins` : ''].filter(Boolean).join(' + ') || 'nothing';
    const a = [nm(o.askSpots), o.askCoins ? `${o.askCoins} coins` : ''].filter(Boolean).join(' + ') || 'nothing';
    return { g, a };
  };
  let h = `<div class="bc-card"><div class="bc-h">🤝 Trades <small>${d.me.tradesThisWeek}/${(d.season.settings || {}).tradesPerWeek ?? 2} this week · fee ${fee} each</small></div>`;
  tr.incoming.forEach(t => { const s = sum(t.offer); h += `<div class="bc-trade"><b>${esc(pname(d, t.from))}</b> gives ${s.g}<br>for your ${s.a}
    <div class="bc-row"><button class="btn btn-gold btn-sm" ${BC.busy ? 'disabled' : ''} onclick="bcAct('trade_accept',{tradeId:${t.id}})">Accept</button>
    <button class="btn btn-outline btn-sm" ${BC.busy ? 'disabled' : ''} onclick="bcAct('trade_decline',{tradeId:${t.id}})">Decline</button></div></div>`; });
  tr.outgoing.forEach(t => { const s = sum(t.offer); h += `<div class="bc-trade out">To <b>${esc(pname(d, t.to))}</b>: your ${s.g} for ${s.a}
    <div class="bc-row"><button class="btn btn-outline btn-sm" ${BC.busy ? 'disabled' : ''} onclick="bcAct('trade_decline',{tradeId:${t.id}})">Cancel</button></div></div>`; });
  if(!tr.incoming.length && !tr.outgoing.length) h += `<small>No open offers.</small>`;
  const tf = BC.tf;
  h += `<div class="bc-row" style="margin-top:6px"><button class="btn btn-outline btn-sm" onclick="bcTF('open')">${tf.open ? 'Close' : '＋ New offer'}</button></div>`;
  if(tf.open){
    const mine = T.filter(t => d.spots[String(t.i)] && d.spots[String(t.i)].owner === myId && !d.spots[String(t.i)].level);
    const theirs = tf.to ? T.filter(t => d.spots[String(t.i)] && d.spots[String(t.i)].owner === tf.to && !d.spots[String(t.i)].level) : [];
    const chk = (k, t) => `<label class="bc-chk"><input type="checkbox" ${tf[k].includes(t.i) ? 'checked' : ''} onchange="bcTF('${k}',${t.i})">${esc(tileName(t.i, th))} <small>${t.price}</small></label>`;
    h += `<div class="bc-form">
      <label>Trade with<select onchange="bcTF('to',this.value)"><option value="">Pick a player…</option>${(d.players || []).filter(p => p.id !== myId).map(p => `<option value="${esc(p.id)}" ${tf.to === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>
      <div class="bc-sub">You give</div>${mine.map(t => chk('give', t)).join('') || '<small>No spots without upgrades.</small>'}
      <label>+ coins<input type="number" min="0" value="${tf.gc}" oninput="bcTF('gc',this.value)"></label>
      <div class="bc-sub">You ask for</div>${tf.to ? (theirs.map(t => chk('ask', t)).join('') || '<small>They have no spots without upgrades.</small>') : '<small>Pick a player first.</small>'}
      <label>+ coins<input type="number" min="0" value="${tf.ac}" oninput="bcTF('ac',this.value)"></label>
      <small>At least one spot must move. Each side must give at least half the price of the spots it gets. Offers last ${(d.season.settings || {}).tradeExpiryHours ?? 24} h.</small>
      <button class="btn btn-gold btn-sm" ${BC.busy ? 'disabled' : ''} onclick="bcOffer()">Send offer</button></div>`;
  }
  return h + '</div>';
}
function previewHtml(st, th){
  const p = me();
  const head_ = st === 'open' ? `<div class="bc-pill open">● Open</div><h2>Bayani City</h2>`
    : st === 'beta' ? `<div class="bc-pill beta">● Beta</div><h2>You're a Bayani City beta tester</h2>`
    : `<div class="bc-pill">● Coming soon</div><h2>Bayani City</h2><p>Our own city board game: roll, walk the streets of Bayani City, buy spots and collect rent. Your avatar and pet walk the board with you.</p>`;
  return { head_, you: `<div class="bc-you">${typeof avatarHtml === 'function' ? avatarHtml(p.id, 96, false) : ''}${petLine()}</div>` };
}
function petLine(){
  const pets = ((DB.pets || {})[me().id] || []).filter(p => p && p.status === 'alive');
  if(!pets.length) return '';
  pets.sort((a, b) => (b.evolved ? 1 : 0) - (a.evolved ? 1 : 0) || (b.level || 0) - (a.level || 0));
  const p = pets[0], src = p.evolved ? petAdultSrc(p.species) : petBabySrc(p.species);
  return `<img class="bc-pet" src="${src}" alt="" onerror="this.remove()">`;
}
const FEATURES = [
  ['🎲','3 rolls per shift','Roll after 9 PM PHT, walk the board, land on famous spots.'],
  ['🏠','Buy & upgrade spots','Stall → Shop → Café → Office. Own a full color set for double rent.'],
  ['🍀','Swerte Cards & Overtime','Client bonuses, brownouts, libreng kape… and the dreaded OVERTIME.'],
  ['🏆','2-week seasons','Separate city coins. Season-end SMB Token payout + vouchers for BINGO, spins and pet care.'],
];
const featsHtml = () => `<div class="bc-feats">${FEATURES.map(([i, t, d]) => `<div class="bc-feat"><span>${i}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div>`;

function render(){
  const root = document.getElementById('bcRoot'); if(!root || !me()) return;
  updateBadges();
  const st = status();
  if(st === 'soon'){
    const th = cfg().theme || 'classic', pv = previewHtml(st, th);
    root.innerHTML = `<div class="bc"><div class="bc-hero"><div class="bc-intro">${pv.head_}${pv.you}
      <button class="btn btn-gold" onclick="gpGo('avatar')">🧑 Get your avatar ready</button></div>${boardHtml(null, th)}</div>${featsHtml()}</div>`;
    return;
  }
  const d = BC.data;
  if(!d){ root.innerHTML = `<div class="empty-state">Loading Bayani City…</div>`; load(); return; }
  if(d.error){ root.innerHTML = `<div class="empty-state">⚠ ${esc(d.error)} <button class="btn btn-outline btn-sm" onclick="bcReload()">Try again</button></div>`; return; }
  if(!d.season){
    const th = cfg().theme || 'classic', pv = previewHtml(st, th);
    const next = d.next ? `<p>Next season starts <b>${new Date(d.next.startsAt).toLocaleString('en-PH', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}</b>.</p>` : `<p>No season is running right now. Abangan sa Slack!</p>`;
    const last = d.last && Array.isArray(d.last.results) && d.last.results.length ? `<div class="bc-card"><div class="bc-h">🏆 Last season</div>${d.last.results.slice(0, 5).map(r => `<div class="bc-kv"><span>#${r.place} ${esc(r.name)}</span><b>${r.worth} · +${r.tokens} 🪙</b></div>`).join('')}</div>` : '';
    root.innerHTML = `<div class="bc"><div class="bc-hero"><div class="bc-intro">${pv.head_}${next}${pv.you}
      <button class="btn btn-gold" onclick="gpGo('avatar')">🧑 Get your avatar ready</button>${last}</div>${boardHtml(null, th)}</div>${featsHtml()}</div>`;
    return;
  }
  const th = (d.season.settings || {}).theme || cfg().theme || 'classic', theme = themeOf(th);
  const ends = new Date(d.season.endsAt), left = Math.max(0, Math.ceil((ends - Date.now()) / 864e5));
  const m = d.me;
  const meCard = m ? `<div class="bc-card bc-mecard">${head(m.id, 44)}<div><div class="bc-h" style="margin:0">${esc(m.name)}${st === 'beta' ? ' <span class="bc-pill beta">Beta</span>' : ''}</div>
      <div class="bc-stats"><span>🪙 <b>${m.coins}</b> coins</span><span>🏙️ worth <b>${m.worth}</b></span><span>🎲 <b>${m.rollsLeft}</b> left</span>${m.inOvertime ? '<span>⏰ OVERTIME</span>' : ''}</div></div></div>`
    : `<div class="bc-card"><b>You're watching this season.</b><br><small>No late joiners. You'll be in the next one!</small></div>`;
  const lastEv = (BC.last || []).length ? `<div class="bc-card bc-last">${BC.last.map(e => `<div>${evText(e, d, th)}</div>`).join('')}</div>` : '';
  const myId = m ? m.id : null;
  const mySpots = m ? T.filter(t => d.spots[String(t.i)] && d.spots[String(t.i)].owner === myId) : [];
  const spotsCard = m ? `<div class="bc-card"><div class="bc-h">🏠 My spots <small>tap one on the board</small></div>${mySpots.length ? mySpots.map(t => { const sp = d.spots[String(t.i)];
      return `<div class="bc-kv bc-click" onclick="bcSel(${t.i})"><span><i class="bc-dot" style="background:${t.group ? GC[t.group] : TC[t.type]}"></i>${esc(tileName(t.i, th))}${sp.level ? ` · ${LEVELS[sp.level]}` : ''}</span><b>rent ${rentOf(d, t.i)}</b></div>`; }).join('') : '<small>None yet. Land on a spot to buy it.</small>'}</div>` : '';
  const stand = `<div class="bc-card"><div class="bc-h">🏆 Standings</div>${(d.players || []).map((p, i) => `<div class="bc-kv${p.id === myId ? ' mine' : ''}"><span>${i + 1}. <span class="bc-ph" ${peekAttr(p.id)}>${head(p.id, 18)}</span> ${esc(p.name)}${p.inOvertime ? ' ⏰' : ''}</span><b>${p.worth}</b></div>`).join('')}
    <small>Season payout: worth ÷ ${(d.season.settings || {}).payoutRate ?? 150} = SMB Tokens (max ${(d.season.settings || {}).payoutCap ?? 50}). Top 3 also get vouchers.</small></div>`;
  const feed = `<div class="bc-card"><div class="bc-h">📰 City feed</div><div class="bc-feed">${(d.feed || []).map(e => `<div>${evText(e, d, th)}</div>`).join('') || '<small>Quiet pa.</small>'}</div></div>`;
  root.innerHTML = `<div class="bc">
    <div class="bc-top"><div><b>${theme.flag} ${esc(theme.label)}</b> · Season ${d.season.id} · ${left} day${left === 1 ? '' : 's'} left</div>
      <button class="btn btn-outline btn-sm" onclick="bcReload()">↻ Refresh</button></div>
    <div class="bc-game"><div class="bc-left">${boardHtml(d, th)}${BC.msg ? `<div class="bc-msg${BC.msgOk ? '' : ' err'}">${esc(BC.msg)}</div>` : ''}${lastEv}</div>
      <div class="bc-side">${meCard}${tileInfo(d, th)}${m ? spotsCard + tradesHtml(d, th) : ''}${stand}</div></div>
    ${feed}</div>`;
}
window.renderBayaniCity = render;
window.bcReload = () => { BC.data = null; render(); };

// ── nav / tile / view injection ──
function injectPlayer(){
  const nav = document.getElementById('gpNav');
  if(nav && !nav.querySelector('[data-v="city"]')){
    const b = document.createElement('button'); b.className = 'sub'; b.dataset.v = 'city'; b.setAttribute('onclick', "gpGo('city')");
    b.innerHTML = '🏙️ Bayani City <span class="gp-cnt" id="gpCntCity"></span>';
    const after = nav.querySelector('[data-v="l9"]') || nav.querySelector('[data-v="race"]');
    after ? after.after(b) : nav.appendChild(b);
  }
  const games = document.querySelector('#gpv-player .gp-games');
  if(games && !document.getElementById('gpTileCity')){
    const d = document.createElement('div'); d.className = 'gp-game'; d.setAttribute('onclick', "gpGo('city')");
    d.innerHTML = '<span class="ic">🏙️</span><b>Bayani City</b><span class="gp-left" id="gpTileCity">Coming soon</span>';
    const shop = Array.from(games.children).find(x => (x.getAttribute('onclick') || '').includes("'shop'"));
    shop ? games.insertBefore(d, shop) : games.appendChild(d);
  }
  const anyView = document.querySelector('.gp-view');
  if(anyView && !document.getElementById('gpv-city')){
    const s = document.createElement('section'); s.className = 'gp-view'; s.id = 'gpv-city';
    s.innerHTML = '<div class="gp-card" id="bcRoot"></div>';
    anyView.parentNode.appendChild(s);
  }
}
function updateBadges(){
  const st = status();
  const d = BC.data, m = d && d.me;
  const lab = st === 'soon' ? 'Soon' : m ? (typeof m.pending === 'number' ? 'Buy?' : `${m.rollsLeft}/3`) : st === 'beta' ? 'Beta' : 'Open';
  const c = document.getElementById('gpCntCity'); if(c) c.textContent = lab;
  const t = document.getElementById('gpTileCity');
  if(t) t.textContent = st === 'soon' ? 'Coming soon' : m ? `${m.rollsLeft} roll${m.rollsLeft === 1 ? '' : 's'} left` : st === 'beta' ? 'Beta access' : 'Season board';
}

const _gpGo = gpGo;
window.gpGo = function(v){
  const r = _gpGo.apply(this, arguments);
  try { updateBadges(); } catch(e){}
  if(v === 'city'){ try { if(BC.data && BC.data.error) BC.data = null; render(); if(BC.data && Date.now() - BC.at > 5000) load(); } catch(e){} }
  return r;
};
setInterval(() => { try { if(typeof _gpView !== 'undefined' && _gpView === 'city' && status() !== 'soon' && !BC.busy && !document.hidden && !BC.tf.open) load(); } catch(e){} }, 20000);
const _apply = window.applyGamesConfig;
if(typeof _apply === 'function') window.applyGamesConfig = function(c){
  const before = status(); const r = _apply.apply(this, arguments);
  try { updateBadges(); if(typeof _gpView !== 'undefined' && _gpView === 'city' && status() !== before){ BC.data = null; render(); } } catch(e){}
  return r;
};

// ═════════════════════ ADMIN SIDE ═════════════════════
if(typeof GA_TITLES !== 'undefined'){
  GA_TITLES.bayanicity = '🏙️ Bayani City';
  GA_FIELDS.bayanicity = [];
  Object.assign(GA_LABELS, { avatarHairStyle:'💇 Hair Style', avatarMood:'😊 Personality', avatarPin:'📍 Pin' });
  // Gender switch fee is retired (Avatar Studio revamp): hide it from Admin → Shop & Cosmetics.
  if(Array.isArray(GA_FIELDS.shop)) GA_FIELDS.shop = GA_FIELDS.shop.filter(f => f[0] !== 'genderFee');
}
if(typeof TOKEN_EVENT_LABELS !== 'undefined') Object.assign(TOKEN_EVENT_LABELS, { city_payout:'🏙️ Bayani City Payout', voucher_redeem:'🎟️ Voucher Used' });

function injectAdmin(){
  const ps = document.querySelector('.tab-btn[data-tab="petstore"]');
  if(ps && !document.querySelector('.tab-btn[data-tab="bayanicity"]')){
    const b = document.createElement('button'); b.className = 'tab-btn'; b.dataset.tab = 'bayanicity';
    b.setAttribute('onclick', "switchAdminTab('bayanicity')"); b.textContent = '🏙️ Bayani City'; ps.after(b);
  }
  const pt = document.getElementById('tab-petstore');
  if(pt && !document.getElementById('tab-bayanicity')){
    const d = document.createElement('div'); d.className = 'tab-content'; d.id = 'tab-bayanicity';
    d.innerHTML = `<div class="panel"><div class="panel-title">🏙️ Bayani City</div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Open the game for everyone, or let a few beta testers in early. While Off, players see the "Coming soon" preview and only beta testers can play.</div>
      <div id="gaRoot-bayanicity"><div class="empty-state">Loading...</div></div></div>
      <div id="bcAdminRoot"></div>`;
    pt.after(d);
  }
}
if(typeof switchAdminTab === 'function'){
  const _sw = switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'bayanicity'){ gaAdminLoad('bayanicity'); bcAdminLoad(); } return r; };
}
if(typeof gaAdminRender === 'function'){
  const _r = gaAdminRender;
  window.gaAdminRender = function(game){
    if(game !== 'bayanicity') return _r.apply(this, arguments);
    const el = document.getElementById('gaRoot-bayanicity'); if(!el || !_gaAdmin) return;
    if(!_gaAdmin.bayanicity) _gaAdmin.bayanicity = { on:false, beta:'', _missing:true };
    const c = _gaAdmin.bayanicity, on = c.on === true;
    el.innerHTML = `<div class="pra-form">
      <div class="pra-f"><label>Open<small>Off = players see "Coming soon"</small></label><select data-k="on" data-t="bool"><option value="true" ${on ? 'selected' : ''}>On</option><option value="false" ${!on ? 'selected' : ''}>Off</option></select></div>
      <div class="pra-f" style="grid-column:1/-1"><label>Beta testers<small>comma-separated player names, e.g. Gilda, Ochi · they can play while Off</small></label><input type="text" data-k="beta" data-t="text" maxlength="500" value="${esc(c.beta || '')}"></div>
    </div>
    <div class="pra-save"><span class="pra-msg" id="gaMsg-bayanicity"></span><span><button class="btn btn-outline btn-sm" onclick="gaAdminLoad('bayanicity')">Reload</button> <button class="btn btn-gold" onclick="gaSave('bayanicity')">💾 Save Open / Beta</button></span></div>`;
  };
}

const BA = { data:null, msg:{}, theme:null };
const RULES = [
  ['seasonDays','Season length','days'],['rollsPerShift','Rolls per shift','resets 9 PM PHT'],['startCoins','Starting coins',''],['passSimula','Pass SIMULA','coins'],
  ['overtimeFee','Clock-out fee','coins'],['kapeMin','Libreng Kape min',''],['kapeMax','Libreng Kape max',''],['allowance','Allowance','for broke players with no spots'],
  ['allowanceBelow','Allowance if coins below',''],['petFindMin','Pet find min',''],['petFindMax','Pet find max',''],['tradeFee','Trade fee','coins, each side'],
  ['tradesPerWeek','Trades per player per week',''],['tradeExpiryHours','Offers expire after','hours'],['payoutRate','Payout rate','worth ÷ this = SMB Tokens'],
  ['payoutCap','Payout cap','max SMB Tokens per player'],['weeklyPrize','Week-1 top earner prize','SMB Tokens'],
];
const SLACK = [['season','Season open / over'],['fullSet','Full color set'],['office','Office built'],['trade','Trade closed'],['weekly','Week-1 top earner'],['roll','Every roll (live feed)'],['recap','5:55 AM shift recap']];
const VKINDS = [['bingo_card','🎟️ Free BINGO card'],['spin','🎡 Free spin'],['pet_care_pack','🐾 Pet Care Pack (3 uses)']];

async function adminCall(action, payload){ const j = await gaCall(action, null, payload || {}); return j || { ok:false, error:'No response' }; }
async function bcAdminLoad(){
  const el = document.getElementById('bcAdminRoot'); if(!el) return;
  if(!BA.data) el.innerHTML = '<div class="panel"><div class="empty-state">Loading season controls…</div></div>';
  const j = await adminCall('city_get');
  if(!j.ok){ el.innerHTML = `<div class="panel"><div class="empty-state">⚠ ${esc(j.error || 'Could not load Bayani City admin.')}</div></div>`; return; }
  BA.data = j; BA.liveAt = Date.now(); bcAdminRender();
}
window.bcAdminLoad = bcAdminLoad;
function amsg(k){ const m = BA.msg[k]; return m ? `<span class="pra-msg" style="color:${m.ok ? 'var(--success)' : 'var(--danger)'}">${esc(m.t)}</span>` : '<span class="pra-msg"></span>'; }
function setMsg(k, j, okText){ BA.msg[k] = { ok:!!j.ok, t: j.ok ? okText : ('⚠ ' + (j.error || 'Failed')) }; }
function rosterOpts(sel){ return (DB.players || []).filter(p => p.active !== false).map(p => `<option value="${esc(p.id)}" ${sel === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join(''); }

// ── Admin Live Board: who is on which tile, read-only, refreshes every 60 s ──
const PAL = ['#e76f51','#2a9d8f','#c99a2e','#8338ec','#3a86ff','#ff006e','#fb5607','#06a77d','#118ab2','#ef476f','#7b2cbf','#43aa8b','#f3722c','#577590','#f94144','#6a994e','#c77dff','#0096c7','#bc6c25','#4d7c0f','#d62828','#4361ee','#b5179e','#2d6a4f','#9d4edd','#e85d04'];
function liveColors(L){ const c = {}; [...(L.players || [])].sort((a, b) => a.name.localeCompare(b.name)).forEach((p, i) => c[p.id] = PAL[i % PAL.length]); return c; }
function liveText(L, th){
  const ps = L.players || [], by = {};
  ps.forEach(p => (by[p.pos] = by[p.pos] || []).push(p.name));
  const top = ps.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} · ${p.worth}`).join('\n');
  const pos = T.filter(t => by[t.i]).map(t => `${tileName(t.i, th)}: ${by[t.i].sort().join(', ')}`).join('\n');
  const idle = ps.filter(p => !(L.rolls || {})[p.id]).map(p => p.name).sort();
  return `🏙️ Bayani City · Season ${L.season.id}\n\n🏆 Top 5 (worth)\n${top}\n\n📍 Where everyone is\n${pos}` + (idle.length ? `\n\n😴 Hasn't rolled this shift: ${idle.join(', ')}` : '');
}
function liveHtml(cur){
  const L = cur.live; if(!L || !L.season) return '';
  const th = (L.season.settings || {}).theme || cfg().theme || 'classic', theme = themeOf(th), col = liveColors(L);
  const ps = L.players || [], byPos = {}, rolls = L.rolls || {}, per = (L.season.settings || {}).rollsPerShift || 3;
  [...ps].sort((a, b) => a.name.localeCompare(b.name)).forEach(p => (byPos[p.pos] = byPos[p.pos] || []).push(p));
  const chip = (p, s) => `<span class="bcl-chip${s ? ' s' : ''}" style="background:${col[p.id]}" ${peekAttr(p.id, 'a')}>${esc(p.name)}</span>`;
  const tiles = T.map(t => {
    const sp = L.spots[String(t.i)], here = byPos[t.i] || [];
    const own = sp && sp.owner ? `<div class="bcl-own">🏠 ${esc(pname(L, sp.owner))}${sp.level ? ' ' + '●'.repeat(sp.level) : ''}</div>` : '';
    const toks = here.slice(0, here.length > 4 ? 3 : 4).map(p => chip(p, 1)).join('') + (here.length > 4 ? `<span class="bcl-chip s more" title="${esc(here.slice(3).map(p => p.name).join(', '))}" onclick="event.stopPropagation();alert(this.title)">+${here.length - 3} more</span>` : '');
    return `<div class="bcl-tile" style="grid-column:${t.col};grid-row:${t.row}"><i style="background:${t.group ? GC[t.group] : TC[t.type]}"></i>
      <b>${t.type !== 'spot' && ICON[t.type] ? ICON[t.type] + ' ' : ''}${esc(tileName(t.i, th))}</b>${own}<div class="bcl-toks">${toks}</div>${here.length ? `<em class="bcl-cnt">${here.length}</em>` : ''}</div>`;
  }).join('');
  const days = Math.max(1, Math.round((new Date(L.season.endsAt) - new Date(L.season.startsAt)) / 864e5));
  const day = Math.min(days, Math.max(1, Math.ceil((Date.now() - new Date(L.season.startsAt)) / 864e5)));
  const rolled = ps.filter(p => rolls[p.id]).length, lead = ps[0];
  const owned = T.filter(t => L.spots[String(t.i)] && L.spots[String(t.i)].owner).length, ownable = T.filter(t => L.spots[String(t.i)]).length;
  const ends = new Date(L.season.endsAt).toLocaleString('en-PH', { timeZone:'Asia/Manila', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) + ' PHT';
  const pill = (k, v) => `<div class="bcl-pill">${k}<b>${v}</b></div>`;
  const rows = ps.map((p, i) => { const r = Math.min(per, rolls[p.id] || 0);
    return `<tr><td>${i + 1}</td><td>${chip(p)}</td><td class="r">${p.worth.toLocaleString()}</td><td class="r">${p.coins.toLocaleString()}</td><td class="r">${p.spots}</td><td>${esc(tileName(p.pos, th))}${p.inOvertime ? ' ⏰' : ''}</td><td class="c">${'🎲'.repeat(r)}${'·'.repeat(per - r)}</td></tr>`; }).join('');
  const feed = (L.feed || []).filter(e => ['bought','rent','swerte','upgraded','sold','trade_accepted'].includes(e.type)).slice(0, 8).map(e => `<li>${evText(e, L, th)}</li>`).join('') || '<li>Quiet pa.</li>';
  const at = new Date(BA.liveAt || Date.now()).toLocaleTimeString('en-PH', { timeZone:'Asia/Manila', hour:'numeric', minute:'2-digit' });
  return `<div class="panel bcl" id="bcaLive"><div class="panel-title" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><span>🔴 Live Board</span>
      <span class="bcl-btns"><button class="btn btn-outline btn-sm" onclick="bcLiveCopy()">📋 Copy board as text</button> <button class="btn btn-gold btn-sm" onclick="bcLiveFs()">${document.body.classList.contains('bcl-fs') ? '✕ Exit full screen' : '⛶ Full screen'}</button></span></div>
    <div class="bcl-strip">${pill('Season', `Day ${day} of ${days}`)}${pill('Ends', ends)}${pill('This shift', `${rolled} / ${ps.length} rolled`)}${lead ? pill('Leader', `${esc(lead.name)} · ${lead.worth.toLocaleString()}`) : ''}${pill('Places owned', `${owned} / ${ownable}`)}${pill('Updated', `${at} · every 60 s`)}</div>
    ${BA.liveMsg ? `<div class="pra-msg" style="color:var(--success);margin-bottom:6px">${esc(BA.liveMsg)}</div>` : ''}
    <div class="bcl-main"><div class="bcl-board" style="background:${theme.bg}">${tiles}
        <div class="bcl-center" style="background:${theme.center}"><div class="bc-logo">${esc(theme.title)}</div><div class="bc-tag">${theme.flag} Bayani City · Season ${L.season.id}</div>
        <small>Name tags = where each player is standing · 🏠 owner · ● upgrades<br>Tap a name to see their avatar</small></div></div>
      <div class="bcl-side"><div class="bc-card"><div class="bc-h">🏆 Standings</div><div class="pr-tbl"><table class="bcl-tbl"><thead><tr><th>#</th><th>Player</th><th class="r">Worth</th><th class="r">Coins</th><th class="r">Spots</th><th>On tile</th><th class="c">Rolls</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        <div class="bc-card"><div class="bc-h">📰 Latest</div><ul class="bcl-feed">${feed}</ul></div></div></div></div>`;
}
window.bcLiveFs = () => { document.body.classList.toggle('bcl-fs'); bcLivePaint(); };
window.bcLiveCopy = async () => {
  const cur = BA.data && BA.data.current; if(!cur || !cur.live) return;
  const th = (cur.live.season.settings || {}).theme || cfg().theme || 'classic', txt = liveText(cur.live, th);
  try { await navigator.clipboard.writeText(txt); BA.liveMsg = '✅ Copied. Paste it in Slack.'; }
  catch(e){ window.prompt('Copy this:', txt); BA.liveMsg = ''; }
  bcLivePaint(); setTimeout(() => { BA.liveMsg = ''; bcLivePaint(); }, 4000);
};
function bcLivePaint(){   // repaint only the Live Board, so forms below keep what you typed
  const el = document.getElementById('bcaLive'), cur = BA.data && BA.data.current; if(!el || !cur) return;
  const w = document.createElement('div'); w.innerHTML = liveHtml(cur); if(w.firstElementChild) el.replaceWith(w.firstElementChild);
}
setInterval(async () => {
  const el = document.getElementById('bcaLive');
  if(!el || el.offsetParent === null && !document.body.classList.contains('bcl-fs') || document.hidden) return;
  const j = await adminCall('city_get'); if(!j.ok || !BA.data) return;
  BA.data.current = j.current; BA.liveAt = Date.now(); bcLivePaint();
}, 60000);
document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.body.classList.contains('bcl-fs')) bcLiveFs(); });

function bcAdminRender(){
  const el = document.getElementById('bcAdminRoot'); if(!el || !BA.data) return;
  if(!BA.liveAt) BA.liveAt = Date.now();
  const j = BA.data, cur = j.current, rules = j.rules || {}, rs = Object.assign({}, j.defaults || {}, rules.settings || {}), sl = rules.slack || {};
  const curTheme = BA.theme || (cur && cur.settings && cur.settings.theme) || rs.theme || 'classic';
  const fmt = s => s ? new Date(s).toLocaleString('en-PH', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) : '';
  // 0. live board, 1. season
  let h = cur && cur.live && cur.status === 'active' ? liveHtml(cur) : '';
  h += `<div class="panel"><div class="panel-title">🗓️ Season</div>`;
  if(cur){
    h += `<div style="font-size:13px;margin-bottom:8px">Season <b>${cur.id}</b> · <b>${cur.status === 'setup' ? 'Scheduled' : 'Running'}</b> · ${fmt(cur.startsAt)} → ${fmt(cur.endsAt)}</div>
      <div class="pr-tbl"><table class="roster-table"><thead><tr><th>#</th><th>Player</th><th>Worth</th><th>Spots</th></tr></thead><tbody>${(cur.standings || []).map((s, i) =>
        `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${s.worth}</td><td>${s.spots}</td></tr>`).join('')}</tbody></table></div>
      <div class="pra-save">${amsg('season')}<span><button class="btn btn-outline btn-sm" onclick="bcAdminLoad()">Reload</button>
        <button class="btn btn-gold" onclick="bcAdminEnd()">🏁 End season now & pay out</button></span></div>`;
  } else {
    h += `<div style="font-size:12px;color:var(--muted);margin-bottom:8px">No season is running. A new season includes every active player on the roster (no late joiners) and lasts ${rs.seasonDays} days.</div>
      <div class="pra-form"><div class="pra-f"><label>Start<small>leave empty = start now</small></label><input type="datetime-local" id="bcaStart"></div></div>
      <div class="pra-save">${amsg('season')}<span><button class="btn btn-gold" onclick="bcAdminCreate()">🏙️ Create season</button></span></div>`;
  }
  const past = (j.seasons || []).filter(s => s.status === 'ended').slice(0, 5);
  if(past.length) h += `<div class="pra-sec">Past seasons</div>${past.map(s => `<div style="font-size:12px">Season ${s.id} · ended ${fmt(s.endsAt)} · ${(s.top3 || []).map(r => `#${r.place} ${esc(r.name)} (+${r.tokens} 🪙)`).join(', ') || 'no results'}</div>`).join('')}`;
  h += `</div>`;
  // 2. board design
  h += `<div class="panel"><div class="panel-title">🎨 Board design</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Changes tile names and colors only. Prices and rules stay the same, so you can switch any time, even mid-season.</div>
    <div class="bca-themes">${Object.entries(THEMES).map(([id, t]) => `<button type="button" class="bca-theme${curTheme === id ? ' sel' : ''}" onclick="bcAdminPickTheme('${id}')">
      <div class="bca-sw" style="background:${t.bg}"><span style="background:${t.center}">${t.flag}</span></div><b>${esc(t.label)}</b><small>${esc(t.sub)}</small><small class="bca-ex">${t.n.filter((_, i) => ![5,7,14,15].includes(i)).slice(-3).map(esc).join(' · ')}</small></button>`).join('')}</div>
    <div class="bca-mini">${boardHtml(null, curTheme, true)}</div>
    <div class="pra-save">${amsg('theme')}<span><button class="btn btn-gold" onclick="bcAdminSaveTheme()">💾 Use this design</button></span></div></div>`;
  // 3. rules
  h += `<div class="panel"><div class="panel-title">⚙️ Rules for the next season</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">A running season keeps the rules it started with.</div>
    <div class="pra-form" id="bcaRules">${RULES.map(([k, l, help]) => `<div class="pra-f"><label>${l}<small>${help}</small></label><input type="number" min="0" step="1" data-r="${k}" value="${esc(rs[k] ?? '')}"></div>`).join('')}
      <div class="pra-f"><label>Pet find chance<small>0–1 (0.1 = 10% for a happy pet)</small></label><input type="number" min="0" max="1" step="0.01" data-r="petFindChance" value="${esc(rs.petFindChance ?? 0.1)}"></div></div>
    <div class="pra-sec">Slack posts</div><div class="pra-form">${SLACK.map(([k, l]) => `<div class="pra-f"><label>${l}</label><select data-s="${k}"><option value="true" ${sl[k] !== false ? 'selected' : ''}>On</option><option value="false" ${sl[k] === false ? 'selected' : ''}>Off</option></select></div>`).join('')}</div>
    <div class="pra-save">${amsg('rules')}<span><button class="btn btn-gold" onclick="bcAdminSaveRules()">💾 Save rules</button></span></div></div>`;
  // 4. webhook
  h += `<div class="panel"><div class="panel-title">🔔 Bayani City Slack webhook</div>
    <div style="font-size:12px;margin-bottom:8px">${j.hook ? '✅ A webhook is saved (hidden for safety).' : 'No webhook yet: nothing posts to Slack.'}</div>
    <div class="pra-form"><div class="pra-f" style="grid-column:1/-1"><label>Webhook URL<small>https://hooks.slack.com/services/…</small></label><input type="text" id="bcaHook" placeholder="${j.hook ? 'Paste a new one to replace it' : 'https://hooks.slack.com/services/…'}"></div></div>
    <div class="pra-save">${amsg('hook')}<span><button class="btn btn-gold btn-sm" onclick="bcAdminHook()">💾 Save webhook</button> <button class="btn btn-outline btn-sm" ${j.hook ? '' : 'disabled'} onclick="bcAdminTestHook()">Send test post</button> ${j.hook ? '<button class="btn btn-outline btn-sm" onclick="bcAdminHook(true)">Remove</button>' : ''}</span></div></div>`;
  // 5. adjust
  if(cur && cur.status === 'active') h += `<div class="panel"><div class="panel-title">🛠️ Adjust city coins</div>
    <div class="pra-form"><div class="pra-f"><label>Player</label><select id="bcaAdjP">${rosterOpts()}</select></div>
      <div class="pra-f"><label>Change<small>e.g. 100 or -50</small></label><input type="number" step="1" id="bcaAdjD"></div>
      <div class="pra-f" style="grid-column:1/-1"><label>Reason<small>required, shows in the feed</small></label><input type="text" maxlength="200" id="bcaAdjR"></div></div>
    <div class="pra-save">${amsg('adjust')}<span><button class="btn btn-gold btn-sm" onclick="bcAdminAdjust()">Apply</button></span></div></div>`;
  // 6. vouchers
  const vs = DB.vouchers || {};
  const rows = (DB.players || []).filter(p => Array.isArray(vs[p.id]) && vs[p.id].length);
  h += `<div class="panel"><div class="panel-title">🎟️ Vouchers</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Players use them from their Player page. Free BINGO card: during a running game. Free spin: a Spin the Wheel spin at the minimum bet, paid by the house. Pet Care Pack: 3 free feed / play / bath actions.</div>
    <div class="pra-form"><div class="pra-f"><label>Player</label><select id="bcaVP">${rosterOpts()}</select></div>
      <div class="pra-f"><label>Voucher</label><select id="bcaVK">${VKINDS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="pra-f"><label>How many</label><input type="number" min="1" max="10" value="1" id="bcaVQ"></div>
      <div class="pra-f"><label>Note<small>shown to the player</small></label><input type="text" maxlength="60" id="bcaVN" placeholder="Gift from admin"></div></div>
    <div class="pra-save">${amsg('voucher')}<span><button class="btn btn-gold btn-sm" onclick="bcAdminGrant()">🎁 Give voucher</button></span></div>
    ${rows.length ? `<div class="pr-tbl"><table class="roster-table"><thead><tr><th>Player</th><th>Voucher</th><th>Uses</th><th>From</th><th></th></tr></thead><tbody>${rows.flatMap(p => vs[p.id].map(v =>
      `<tr><td>${esc(p.name)}</td><td>${esc(v.name || v.kind)}</td><td>${v.uses}</td><td style="font-size:11px">${esc(v.from || '')}</td><td><button class="btn btn-outline btn-sm" onclick="bcAdminRevoke('${esc(p.id)}','${esc(v.id)}')">Remove</button></td></tr>`)).join('')}</tbody></table></div>` : '<div class="empty-state">Nobody has a voucher right now.</div>'}
  </div>`;
  el.innerHTML = h;
}
window.bcAdminPickTheme = id => { BA.theme = id; bcAdminRender(); };
window.bcAdminSaveTheme = async () => { const t = BA.theme || 'classic'; const j = await adminCall('city_theme', { theme:t }); setMsg('theme', j, '✅ Board design saved. Players see it within a minute.'); BA.theme = null; await bcAdminLoad(); try { loadGamesConfig(); } catch(e){} };
window.bcAdminCreate = async () => {
  const v = (document.getElementById('bcaStart') || {}).value;
  const startsAt = v ? new Date(v).toISOString() : undefined;
  if(!confirm(startsAt ? `Schedule a new season starting ${new Date(v).toLocaleString('en-PH')}?` : 'Start a new Bayani City season now with every active player?')) return;
  const j = await adminCall('city_create', startsAt ? { startsAt } : {}); setMsg('season', j, `✅ Season ${j.seasonId} created with ${j.players} players.`); await bcAdminLoad();
};
window.bcAdminEnd = async () => {
  if(!confirm('End the season now? Players get their SMB Token payout and the top 3 get vouchers. This cannot be undone.')) return;
  const j = await adminCall('city_end'); setMsg('season', j, j.cancelled ? '✅ Scheduled season cancelled.' : '✅ Season ended and paid out.'); await bcAdminLoad();
};
window.bcAdminSaveRules = async () => {
  const settings = {}, slack = {};
  document.querySelectorAll('#bcAdminRoot [data-r]').forEach(i => { if(i.value !== '') settings[i.dataset.r] = Number(i.value); });
  document.querySelectorAll('#bcAdminRoot [data-s]').forEach(i => { slack[i.dataset.s] = i.value === 'true'; });
  const j = await adminCall('city_settings', { settings, slack }); setMsg('rules', j, '✅ Saved. Used from the next season.'); await bcAdminLoad();
};
window.bcAdminHook = async (remove) => {
  const url = remove ? '' : ((document.getElementById('bcaHook') || {}).value || '').trim();
  if(remove && !confirm('Remove the Bayani City webhook? Nothing will post to Slack.')) return;
  if(!remove && !url) return;
  const j = await adminCall('city_hook', { url }); setMsg('hook', j, remove ? '✅ Webhook removed.' : '✅ Webhook saved. Tap "Send test post" to check it.'); await bcAdminLoad();
};
window.bcAdminTestHook = async () => { const j = await adminCall('city_test_hook'); setMsg('hook', j, '✅ Test post sent. Check the channel.'); bcAdminRender(); };
window.bcAdminAdjust = async () => {
  const playerId = document.getElementById('bcaAdjP').value, delta = Number(document.getElementById('bcaAdjD').value), reason = document.getElementById('bcaAdjR').value.trim();
  if(!delta) return; const j = await adminCall('city_adjust', { playerId, delta, reason }); setMsg('adjust', j, `✅ Done. New balance: ${j.coins} coins.`); await bcAdminLoad();
};
window.bcAdminGrant = async () => {
  const playerId = document.getElementById('bcaVP').value, kind = document.getElementById('bcaVK').value, qty = Number(document.getElementById('bcaVQ').value) || 1, note = document.getElementById('bcaVN').value.trim();
  const j = await adminCall('voucher_grant', { playerId, kind, qty, note });
  if(j.ok){ DB.vouchers = DB.vouchers || {}; DB.vouchers[playerId] = j.vouchers; }
  setMsg('voucher', j, '✅ Voucher given.'); bcAdminRender();
};
window.bcAdminRevoke = async (playerId, voucherId) => {
  if(!confirm('Remove this voucher?')) return;
  const j = await adminCall('voucher_revoke', { playerId, voucherId });
  if(j.ok){ DB.vouchers = DB.vouchers || {}; DB.vouchers[playerId] = j.vouchers; }
  setMsg('voucher', j, '✅ Removed.'); bcAdminRender();
};

// ═════════════════════ STYLES ═════════════════════
const css = `
.bc{display:flex;flex-direction:column;gap:14px}
.bc-hero{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:16px;align-items:start}
.bc-intro h2{margin:6px 0 6px;font-size:22px;color:var(--white)}.bc-intro p{font-size:13px;color:var(--muted);line-height:1.5;margin:0 0 10px}
.bc-pill{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--gold);background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.35);border-radius:20px;padding:3px 10px}
.bc-pill.beta{color:var(--teal);background:rgba(46,202,213,.12);border-color:rgba(46,202,213,.4)}.bc-pill.open{color:var(--success);background:rgba(78,203,132,.12);border-color:rgba(78,203,132,.4)}
.bc-you{display:flex;align-items:flex-end;gap:4px;margin:4px 0 12px}.bc-pet{width:70px;height:70px;object-fit:contain}
.bc-board{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:4px;aspect-ratio:1/1;max-width:620px;width:100%;border-radius:14px;padding:6px;box-sizing:border-box}
.bc-tile{position:relative;background:#fbf4e4;border-radius:6px;overflow:hidden;padding:7px 4px 3px;display:flex;flex-direction:column;gap:1px;min-width:0;cursor:pointer;transition:transform .12s}
.bc-tile:hover{transform:translateY(-1px)}.bc-tile.sel{outline:3px solid var(--gold)}.bc-tile.here{box-shadow:0 0 0 2px #fff,0 0 12px rgba(245,200,66,.9)}
.bc-tile i{position:absolute;left:0;right:0;top:0;height:5px}
.bc-tile b{font-size:clamp(7px,1.15vw,10.5px);color:#2b1a12;line-height:1.1;overflow-wrap:anywhere}
.bc-tile span{font-size:clamp(7px,1vw,10px);color:#6b5a4a;font-weight:700}
.bc-own{position:absolute;right:2px;top:7px;display:flex;flex-direction:column;align-items:center;line-height:0}.bc-own em{font-style:normal;font-size:7px;color:#b8860b;line-height:1;letter-spacing:-1px}
.bc-toks{position:absolute;left:2px;bottom:2px;display:flex;gap:0;line-height:0}.bc-tk{margin-right:-6px}.bc-tk.me .avx-head{box-shadow:0 0 0 2px var(--gold)}.bc-more{font-size:9px;color:#2b1a12;align-self:center;margin-left:8px}
.bc-center{grid-column:2/7;grid-row:2/7;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:6px}
.bc-logo{font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(16px,3.6vw,38px);color:#2b1a12;letter-spacing:1px;line-height:1}
.bc-tag{font-size:clamp(9px,1.3vw,13px);color:#6b4e2e;font-weight:700}
.bc-dice{display:flex;gap:8px}.bc-dice span{width:clamp(24px,4vw,40px);height:clamp(24px,4vw,40px);border:2px solid #2b1a12;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;color:#2b1a12;font-size:clamp(12px,2vw,20px)}
.bc-dice.roll span{animation:bcShake .3s infinite}@keyframes bcShake{25%{transform:rotate(-12deg)}75%{transform:rotate(12deg)}}
@media (prefers-reduced-motion:reduce){.bc-dice.roll span{animation:none}}
.bc-ctl{display:flex;flex-direction:column;align-items:center;gap:4px;color:#2b1a12;font-size:clamp(10px,1.4vw,13px)}.bc-ctl small{color:#6b4e2e}
.bc-roll{font-size:15px;padding:8px 22px}
.bc-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.bc-row .btn{width:auto}
.bc-feats{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.bc-feat{background:var(--card-bg);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:4px}
.bc-feat span{font-size:22px}.bc-feat b{font-size:13px;color:var(--white)}.bc-feat small{font-size:11.5px;color:var(--muted);line-height:1.45}
.bc-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;color:var(--white)}.bc-top .btn{width:auto}
.bc-game{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;align-items:start}
.bc-left{display:flex;flex-direction:column;gap:10px}.bc-side{display:flex;flex-direction:column;gap:10px}
.bc-card{background:var(--card-bg);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;font-size:12.5px;color:var(--white)}
.bc-card small{color:var(--muted);font-size:11px}
.bc-h{font-weight:700;color:var(--gold);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;gap:6px}.bc-h small{font-weight:400}
.bc-x{background:none;border:0;color:var(--muted);cursor:pointer}
.bc-kv{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px dashed rgba(255,255,255,.06)}.bc-kv span{display:flex;align-items:center;gap:5px}.bc-kv.mine{color:var(--gold)}
.bc-click{cursor:pointer}.bc-dot{display:inline-block;width:9px;height:9px;border-radius:50%}
.bc-mecard{display:flex;gap:10px;align-items:center}.bc-stats{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12px;color:var(--muted)}.bc-stats b{color:var(--white)}
.bc-last{border-color:rgba(245,200,66,.35)}.bc-last div{padding:2px 0}
.bc-msg{font-size:12.5px;color:var(--success)}.bc-msg.err{color:var(--danger)}
.bc-feed{max-height:220px;overflow:auto;display:flex;flex-direction:column;gap:3px;font-size:12px}
.bc-trade{padding:6px 0;border-bottom:1px dashed rgba(255,255,255,.08);line-height:1.4}.bc-trade.out{color:var(--muted)}
.bc-form{display:flex;flex-direction:column;gap:5px;margin-top:8px}.bc-form label{font-size:11.5px;color:var(--muted);display:flex;flex-direction:column;gap:3px}
.bc-form input,.bc-form select{margin:0}.bc-sub{font-size:11px;font-weight:700;color:var(--gold);margin-top:4px}
.bc-chk{flex-direction:row!important;align-items:center;gap:6px!important;color:var(--white)!important}.bc-chk input{width:auto}
.bca-themes{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-bottom:12px}
.bca-theme{display:flex;flex-direction:column;gap:3px;text-align:left;background:var(--card-bg);border:2px solid rgba(255,255,255,.08);border-radius:12px;padding:8px;color:var(--white);cursor:pointer;font:inherit}
.bca-theme.sel{border-color:var(--gold)}.bca-theme small{color:var(--muted);font-size:11px}.bca-ex{font-style:italic}
.bca-sw{height:46px;border-radius:8px;display:flex;align-items:center;justify-content:center}.bca-sw span{border-radius:6px;padding:3px 10px;font-size:18px}
.bc-tk,.bc-own,.bc-ph{cursor:pointer}
.bc-peek{position:fixed;z-index:9999;width:170px;box-sizing:border-box;background:var(--card-bg,#111c33);border:1px solid rgba(245,200,66,.5);border-radius:14px;padding:10px;text-align:center;color:var(--white,#fff);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.bc-peek .avx-full{display:block;margin:0 auto}.bc-peek-n{font-weight:800;font-size:14px;margin-top:4px;color:var(--gold,#f5c842)}.bc-peek-s{font-size:11.5px;color:var(--muted,#aab);line-height:1.5;margin-top:2px}.bc-peek small{font-size:10px;color:var(--muted,#aab)}
.bcl-strip{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.bcl-pill{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:6px 10px;font-size:11px;color:var(--muted)}.bcl-pill b{display:block;font-size:14px;color:var(--white)}
.bcl-main>*{min-width:0}.bcl-main{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(300px,1fr);gap:14px;align-items:start}
.bcl-board{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:repeat(7,minmax(0,1fr));gap:4px;aspect-ratio:1/1;width:100%;border-radius:14px;padding:6px;box-sizing:border-box}
.bcl-tile{position:relative;background:#fbf4e4;border-radius:7px;padding:9px 4px 3px;color:#2b1a12;overflow:hidden;display:flex;flex-direction:column;gap:2px;min-width:0}
.bcl-tile i{position:absolute;left:0;right:0;top:0;height:6px}.bcl-tile b{font-size:clamp(8px,.95vw,12px);line-height:1.1;overflow-wrap:anywhere;padding-right:14px}
.bcl-own{font-size:clamp(7px,.8vw,10.5px);color:#6b5a4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bcl-toks{display:flex;flex-wrap:wrap;gap:2px;margin-top:auto}.bcl-chip{display:inline-block;color:#fff;border-radius:999px;padding:1px 7px;font-size:12px;font-weight:700;white-space:nowrap;text-shadow:0 1px 1px rgba(0,0,0,.35);cursor:pointer}
.bcl-chip.s{font-size:clamp(7px,.78vw,10.5px);padding:0 5px}.bcl-chip.more{background:#374151}.bcl-toks{max-width:100%;overflow:hidden}
.bcl-cnt{position:absolute;top:8px;right:3px;font-style:normal;background:#111827;color:#fff;border-radius:999px;font-size:9.5px;padding:0 5px;line-height:1.5}
.bcl-center{grid-column:2/7;grid-row:2/7;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:8px;color:#2b1a12}.bcl-center small{color:#6b4e2e;font-size:clamp(9px,1vw,12px)}
.bcl-tbl{width:100%;border-collapse:collapse;font-size:12px}.bcl-tbl td,.bcl-tbl th{padding:3px 4px;border-bottom:1px solid rgba(255,255,255,.06);white-space:nowrap}.bcl-tbl th{text-align:left;color:var(--muted);font-weight:500}.bcl-tbl .r{text-align:right}.bcl-tbl .c{text-align:center;letter-spacing:1px}
.bcl-feed{margin:0;padding-left:16px;font-size:12px;line-height:1.6}
.bcl-btns .btn{width:auto}
body.bcl-fs{overflow:hidden}body.bcl-fs #bcaLive{position:fixed;inset:0;z-index:9000;margin:0;border-radius:0;overflow:auto;background:var(--bg,#0b1426);padding:16px}
@media(max-width:900px){.bcl-main{grid-template-columns:1fr}.bcl-tile b{font-size:8px}}
.bca-mini{max-width:420px;margin:0 auto 6px}.bca-mini .bc-board{pointer-events:none}
@media(max-width:900px){.bc-game{grid-template-columns:1fr}}
@media(max-width:760px){.bc-hero{grid-template-columns:1fr}.bc-toks .avx-head{width:16px!important;height:16px!important}.bc-own .avx-head{width:12px!important;height:12px!important}}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

injectPlayer(); injectAdmin(); updateBadges();
})();
