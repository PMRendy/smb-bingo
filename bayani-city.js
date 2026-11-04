// ═══════════════════════════════════════════════════════════════════════════
//  bayani-city.js — Bayani City tab (Coming soon / Beta / Open) · SMB Game Portal
//  2026-11-04 · load after avatar-studio.js
//
//  Player side: Games → 🏙️ Bayani City. Off = "Coming soon" preview (live board
//  drawn from the same 24 tiles as cityEngine.ts, with the player's avatar + pet on
//  SIMULA), four feature cards and "Get your avatar ready". Beta testers see "Beta".
//  On = "Open" placeholder (the game itself comes with the backend build).
//
//  Admin side: new "🏙️ Bayani City" tab with Open on/off + Beta testers.
//  Backend (Viktor): settings group 'bayanicity' = { on:bool, beta:string ≤500 }
//  in public config, admin get and admin save — same as the other game groups.
//  Until it exists the page treats Bayani City as Off (players see the preview).
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof GP_TITLES === 'undefined' || typeof gpGo !== 'function') return;

// 24 tiles, clockwise from SIMULA (top-left) — same order/prices as cityEngine.ts
const T = [
  ['SIMULA','start',null,0,1,1],['Sari-Sari Store','spot','brown',60,2,1],['Karinderya','spot','brown',80,3,1],['Swerte Card','swerte',null,0,4,1],
  ['Tiangge','spot','sky',100,5,1],['Boracay','spot','sky',120,6,1],['OVERTIME','overtime',null,0,7,1],['Palawan','spot','sky',140,7,2],
  ['Jeepney Terminal','transit',null,200,7,3],['Intramuros','spot','pink',160,7,4],['Kuryente Bill','tax',null,75,7,5],['Vigan','spot','pink',180,7,6],
  ['LIBRENG KAPE','kape',null,0,7,7],['Night Market','spot','orange',200,6,7],['Mall of Bayani','spot','orange',220,5,7],['Swerte Card','swerte',null,0,4,7],
  ['Palengke','spot','red',240,3,7],['Baguio','spot','red',260,2,7],['GO TO OVERTIME','gotoOvertime',null,0,1,7],['Banaue','spot','red',280,1,6],
  ['Payday Tax','tax',null,100,1,5],['LRT Station','transit',null,200,1,4],['BGC Tower','spot','blue',320,1,3],['SMB HQ','spot','blue',400,1,2],
];
const GC = { brown:'#a0612b', sky:'#5bc0eb', pink:'#ff7eb6', orange:'#ff9f43', red:'#e74c3c', blue:'#2f5fd0' };
const TC = { start:'#3ddc97', transit:'#4b5563', tax:'#c9bfa5', swerte:'#c9bfa5', overtime:'#8a94a6', gotoOvertime:'#8a94a6', kape:'#f5b942' };
const ICON = { start:'🏁', transit:'🚌', tax:'🧾', swerte:'🍀', overtime:'⏰', gotoOvertime:'🚨', kape:'☕' };
const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s));

// ── status from config
function cfg(){ return (typeof GAMES_CFG !== 'undefined' && GAMES_CFG && GAMES_CFG.bayanicity) || {}; }
function isBeta(){
  if(!currentPlayer) return false;
  const me = String(currentPlayer.name || '').trim().toLowerCase(), first = me.split(/\s+/)[0];
  return String(cfg().beta || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).some(n => n === me || n === first);
}
function status(){ return cfg().on === true ? 'open' : isBeta() ? 'beta' : 'soon'; }

// ── player nav + view
GP_TITLES.city = 'Bayani City';
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
  const st = status(), lab = st === 'open' ? 'Open' : st === 'beta' ? 'Beta' : 'Soon';
  const c = document.getElementById('gpCntCity'); if(c) c.textContent = lab;
  const t = document.getElementById('gpTileCity'); if(t) t.textContent = st === 'open' ? 'Season is open!' : st === 'beta' ? 'Beta access' : 'Coming soon';
}

function board(){
  const pid = currentPlayer && currentPlayer.id;
  const me = pid && typeof avatarHtml === 'function' ? avatarHtml(pid, 34) : '';
  const tiles = T.map(([n, type, g, price, col, row], i) => {
    const bar = g ? GC[g] : TC[type];
    const sub = type === 'spot' || type === 'transit' ? `${price}` : type === 'tax' ? `pay ${price}` : type === 'start' ? '+200' : '';
    return `<div class="bc-tile${type === 'start' ? ' start' : ''}" style="grid-column:${col};grid-row:${row}">
      <i style="background:${bar}"></i><b>${type !== 'spot' && ICON[type] ? ICON[type] + ' ' : ''}${esc(n)}</b>${sub ? `<span>${sub}</span>` : ''}
      ${i === 0 && me ? `<div class="bc-tok">${me}</div>` : ''}</div>`;
  }).join('');
  return `<div class="bc-board">${tiles}<div class="bc-center"><div class="bc-logo">BAYANI CITY</div><div class="bc-tag">Roll · Walk · Buy · Collect rent</div><div class="bc-dice"><span>4</span><span>3</span></div></div></div>`;
}
function petLine(){
  const pets = ((DB.pets || {})[currentPlayer.id] || []).filter(p => p && p.status === 'alive');
  if(!pets.length) return '';
  pets.sort((a, b) => (b.evolved ? 1 : 0) - (a.evolved ? 1 : 0) || (b.level || 0) - (a.level || 0));
  const p = pets[0], src = p.evolved ? petAdultSrc(p.species) : petBabySrc(p.species);
  return `<img class="bc-pet" src="${src}" alt="" onerror="this.remove()">`;
}
const FEATURES = [
  ['🎲','3 rolls per shift','Roll after 9 PM PHT, walk the board, land on Manila spots.'],
  ['🏠','Buy & upgrade spots','Stall → Shop → Café → Office. Own a full color set for double rent.'],
  ['🍀','Swerte Cards & Overtime','Client bonuses, brownouts, libreng kape… and the dreaded OVERTIME.'],
  ['🏆','2-week seasons','Separate city coins. Season-end SMB Token payout + vouchers for BINGO and more.'],
];
function render(){
  const root = document.getElementById('bcRoot'); if(!root || !currentPlayer) return;
  const st = status();
  const head = st === 'open'
    ? `<div class="bc-pill open">● Open</div><h2>Bayani City is open!</h2><p>The season board is being set up. Your rolls start here very soon. Abangan sa Slack!</p>`
    : st === 'beta'
    ? `<div class="bc-pill beta">● Beta</div><h2>You're a Bayani City beta tester</h2><p>Thanks for helping test! The board opens here first for you. Make sure your avatar is ready.</p>`
    : `<div class="bc-pill">● Coming soon</div><h2>Bayani City</h2><p>Our own city board game: roll, walk the streets of Bayani City, buy spots and collect rent. Your avatar and pet walk the board with you.</p>`;
  root.innerHTML = `<div class="bc">
    <div class="bc-hero"><div class="bc-intro">${head}
      <div class="bc-you">${typeof avatarHtml === 'function' ? avatarHtml(currentPlayer.id, 96, false) : ''}${petLine()}</div>
      <button class="btn btn-gold" onclick="gpGo('avatar')">🧑 Get your avatar ready</button></div>
      ${board()}</div>
    <div class="bc-feats">${FEATURES.map(([i, t, d]) => `<div class="bc-feat"><span>${i}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div>
  </div>`;
}
window.renderBayaniCity = render;

const _gpGo = gpGo;
window.gpGo = function(v){ const r = _gpGo.apply(this, arguments); try { updateBadges(); } catch(e){} if(v === 'city'){ try { render(); } catch(e){} } return r; };
const _apply = window.applyGamesConfig;
if(typeof _apply === 'function') window.applyGamesConfig = function(c){ const r = _apply.apply(this, arguments); try { updateBadges(); if(typeof _gpView !== 'undefined' && _gpView === 'city') render(); } catch(e){} return r; };

// ── admin tab
if(typeof GA_TITLES !== 'undefined'){
  GA_TITLES.bayanicity = '🏙️ Bayani City';
  GA_FIELDS.bayanicity = [];
  Object.assign(GA_LABELS, { avatarHairStyle:'💇 Hair Style', avatarMood:'😊 Personality', avatarPin:'📍 Pin' });
}
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
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px;">Open the game for everyone, or let a few beta testers see it early. While Off, players see the "Coming soon" preview. Nothing is playable yet: On shows an "Open" placeholder until the game build is live.</div>
      <div id="gaRoot-bayanicity"><div class="empty-state">Loading...</div></div></div>`;
    pt.after(d);
  }
}
if(typeof switchAdminTab === 'function'){
  const _sw = switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'bayanicity') gaAdminLoad('bayanicity'); return r; };
}
if(typeof gaAdminRender === 'function'){
  const _r = gaAdminRender;
  window.gaAdminRender = function(game){
    if(game !== 'bayanicity') return _r.apply(this, arguments);
    const el = document.getElementById('gaRoot-bayanicity'); if(!el || !_gaAdmin) return;
    if(!_gaAdmin.bayanicity) _gaAdmin.bayanicity = { on:false, beta:'', _missing:true };
    const c = _gaAdmin.bayanicity, on = c.on === true;
    const missing = c._missing ? `<div class="pr-muted" style="font-size:12px;margin-bottom:10px;color:var(--gold)">⚠ The server doesn't have the Bayani City setting yet (Viktor's update). Saving will show the server's error until then.</div>` : '';
    el.innerHTML = `${missing}<div class="pra-form">
      <div class="pra-f"><label>Open<small>Off = players see "Coming soon"</small></label><select data-k="on" data-t="bool"><option value="true" ${on ? 'selected' : ''}>On</option><option value="false" ${!on ? 'selected' : ''}>Off</option></select></div>
      <div class="pra-f" style="grid-column:1/-1"><label>Beta testers<small>comma-separated player names, e.g. Gilda, Ochi · they see "Beta" while Off</small></label><input type="text" data-k="beta" data-t="text" maxlength="500" value="${esc(c.beta || '')}"></div>
    </div>
    <div class="pra-save"><span class="pra-msg" id="gaMsg-bayanicity"></span><span><button class="btn btn-outline btn-sm" onclick="gaAdminLoad('bayanicity')">Reload</button> <button class="btn btn-gold" onclick="gaSave('bayanicity')">💾 Save Bayani City settings</button></span></div>`;
  };
}

const css = `
.bc{display:flex;flex-direction:column;gap:14px}
.bc-hero{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:16px;align-items:start}
.bc-intro h2{margin:6px 0 6px;font-size:22px;color:var(--white)}.bc-intro p{font-size:13px;color:var(--muted);line-height:1.5;margin:0 0 10px}
.bc-pill{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--gold);background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.35);border-radius:20px;padding:3px 10px}
.bc-pill.beta{color:var(--teal);background:rgba(46,202,213,.12);border-color:rgba(46,202,213,.4)}.bc-pill.open{color:var(--success);background:rgba(78,203,132,.12);border-color:rgba(78,203,132,.4)}
.bc-you{display:flex;align-items:flex-end;gap:4px;margin:4px 0 12px}.bc-pet{width:70px;height:70px;object-fit:contain}
.bc-board{display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(7,1fr);gap:4px;aspect-ratio:1/1;max-width:560px;width:100%;background:#173a2c;border-radius:14px;padding:6px;box-sizing:border-box}
.bc-tile{position:relative;background:#fbf4e4;border-radius:6px;overflow:hidden;padding:7px 4px 3px;display:flex;flex-direction:column;gap:1px;min-width:0}
.bc-tile i{position:absolute;left:0;right:0;top:0;height:5px}
.bc-tile b{font-size:clamp(7px,1.25vw,10.5px);color:#2b1a12;line-height:1.1;overflow-wrap:anywhere}
.bc-tile span{font-size:clamp(7px,1.1vw,10px);color:#6b5a4a;font-weight:700}
.bc-tok{position:absolute;right:2px;bottom:2px;line-height:0}
.bc-center{grid-column:2/7;grid-row:2/7;background:#f2e6cf;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center}
.bc-logo{font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(18px,4vw,40px);color:#2b1a12;letter-spacing:1px}
.bc-tag{font-size:clamp(9px,1.4vw,13px);color:#6b4e2e;font-weight:700}
.bc-dice{display:flex;gap:8px}.bc-dice span{width:clamp(24px,4vw,40px);height:clamp(24px,4vw,40px);border:2px solid #2b1a12;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;color:#2b1a12;font-size:clamp(12px,2vw,20px)}
.bc-feats{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.bc-feat{background:var(--card-bg);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:4px}
.bc-feat span{font-size:22px}.bc-feat b{font-size:13px;color:var(--white)}.bc-feat small{font-size:11.5px;color:var(--muted);line-height:1.45}
@media(max-width:760px){.bc-hero{grid-template-columns:1fr}.bc-tok .avx-head{width:22px!important;height:22px!important}}`;
const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

injectPlayer(); injectAdmin(); updateBadges();
})();
