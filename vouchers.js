// ═══════════════════════════════════════════════════════════════════════════
//  vouchers.js — "My Vouchers" on the Player page · SMB Game Portal · 2026-11-04
//  Load after bayani-city.js. Backend: bingo-games action "voucher" (vouchers.sql).
//  Vouchers come from Bayani City (Swerte Card, season top 3) and admin gifts.
//   🎟️ Free BINGO card  : while a game runs, adds the 5-token card price and opens the card picker
//   🎡 Free spin        : one Spin the Wheel spin at the minimum bet, paid by the house
//   🐾 Pet Care Pack    : 3 free feed / play / bath actions
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? ''));
const ICON = { bingo_card:'🎟️', spin:'🎡', pet_care_pack:'🐾' };
const HOW = {
  bingo_card: 'Use it while a BINGO game is running. Pick your free card right after.',
  spin: 'One Spin the Wheel spin at the minimum bet. The house pays the bet, you keep the winnings.',
  pet_care_pack: 'Free feed, play or bath for any of your pets.',
};
const V = { busy:false, msg:'', ok:true, pet:{} };

function mine(){ return (typeof currentPlayer !== 'undefined' && currentPlayer && DB.vouchers && Array.isArray(DB.vouchers[currentPlayer.id])) ? DB.vouchers[currentPlayer.id] : []; }
function inject(){
  if(document.getElementById('vchCard')) return;
  const hero = document.querySelector('#gpv-player .gp-hero'); if(!hero) return;
  const d = document.createElement('div'); d.className = 'gp-card'; d.id = 'vchCard'; d.style.display = 'none';
  hero.after(d);
}
function render(){
  inject();
  const el = document.getElementById('vchCard'); if(!el || typeof currentPlayer === 'undefined' || !currentPlayer) return;
  const list = mine();
  if(!list.length && !V.msg){ el.style.display = 'none'; return; }
  el.style.display = '';
  const g = DB.game, gameOn = !!(g && g.active && !g.ended);
  const pets = ((DB.pets || {})[currentPlayer.id] || []).filter(p => p && p.status === 'alive');
  const rows = list.map(v => {
    let act = '';
    if(v.kind === 'bingo_card') act = `<button class="btn btn-gold btn-sm" ${V.busy || !gameOn ? 'disabled' : ''} onclick="vchUse('${esc(v.id)}')">${gameOn ? 'Use now' : 'Wait for a game'}</button>`;
    else if(v.kind === 'spin') act = `<button class="btn btn-gold btn-sm" ${V.busy ? 'disabled' : ''} onclick="vchUse('${esc(v.id)}')">Spin free</button>`;
    else if(v.kind === 'pet_care_pack'){
      if(!pets.length) act = `<small>Hatch a pet first.</small>`;
      else {
        const sel = V.pet[v.id] || pets[0].id;
        act = `<select onchange="vchPet('${esc(v.id)}',this.value)" style="margin:0 0 4px;width:auto">${pets.map(p => `<option value="${esc(p.id)}" ${p.id === sel ? 'selected' : ''}>${esc(p.name || 'Pet')}</option>`).join('')}</select>
          <span class="vch-btns">${[['feed','🍖'],['play','🎾'],['bath','🫧']].map(([c, i]) => `<button class="btn btn-gold btn-sm" ${V.busy ? 'disabled' : ''} onclick="vchUse('${esc(v.id)}','${c}')">${i}</button>`).join('')}</span>`;
      }
    }
    return `<div class="vch-row"><div class="vch-ic">${ICON[v.kind] || '🎟️'}</div>
      <div class="vch-main"><b>${esc(v.name || v.kind)}</b>${v.uses > 1 ? ` <span class="vch-uses">×${v.uses}</span>` : ''}<small>${esc(v.from || '')}</small><small class="vch-how">${HOW[v.kind] || ''}</small></div>
      <div class="vch-act">${act}</div></div>`;
  }).join('');
  el.innerHTML = `<div class="gp-hdr"><h3>🎟️ My Vouchers</h3><span class="gp-badge">${list.length}</span></div>
    ${rows || '<div class="empty-state">No vouchers left.</div>'}${V.msg ? `<div class="vch-msg${V.ok ? '' : ' err'}">${V.msg}</div>` : ''}`;
}
window.renderVouchers = render;
window.vchPet = (vid, pid) => { V.pet[vid] = pid; };

window.vchUse = async (vid, careType) => {
  if(V.busy || typeof currentPlayer === 'undefined' || !currentPlayer) return;
  const v = mine().find(x => x.id === vid); if(!v) return;
  const args = {};
  if(v.kind === 'pet_care_pack'){
    const pets = ((DB.pets || {})[currentPlayer.id] || []).filter(p => p && p.status === 'alive');
    args.petId = V.pet[vid] || (pets[0] && pets[0].id); args.careType = careType;
  }
  V.busy = true; V.msg = ''; render();
  let j;
  try {
    const r = await fetch(GAMES_URL, { method:'POST', headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'voucher', playerId:currentPlayer.id, playerName:currentPlayer.name, voucherId:vid, args }) });
    j = await r.json();
  } catch(e){ j = { ok:false, error:'Network error. Try ulit.' }; }
  V.busy = false;
  if(!j.ok){ V.msg = esc(j.error || 'Hindi nagamit ang voucher.'); V.ok = false; render(); return; }
  DB.vouchers = DB.vouchers || {}; if(Array.isArray(j.vouchers)) DB.vouchers[currentPlayer.id] = j.vouchers;
  if(j.tokens !== undefined && j.tokens !== null) _myTokenBalance = j.tokens;
  V.ok = true;
  if(v.kind === 'bingo_card'){
    V.msg = '🎟️ 5 tokens added. Pick your free card!';
    try { await refreshTokenBalance(); } catch(e){}
    render();
    try { gpGo('bingo'); gpSub('buy'); if(typeof startBuyCard === 'function') startBuyCard(); } catch(e){}
    return;
  }
  if(v.kind === 'spin'){
    const m = j.multiplier;
    V.msg = m === 0 ? '🎡 Free spin: 0x. No loss, the house paid the bet!' : m === 1 ? '🎡 Free spin: 1x. You keep the bet as a bonus!'
      : `🎡 Free spin: ${m}x! 🎉 You won ${j.payout ?? j.netChange ?? ''} tokens.`;
    if(!DB.spinWheelSpins) DB.spinWheelSpins = {};
    if(j.spinsUsed !== undefined) DB.spinWheelSpins[currentPlayer.id] = { shift: typeof shiftStartMsClient === 'function' ? shiftStartMsClient() : 0, count: j.spinsUsed };
  }
  if(v.kind === 'pet_care_pack'){
    if(Array.isArray(j.pets)){ DB.pets = DB.pets || {}; DB.pets[currentPlayer.id] = j.pets; }
    V.msg = `🐾 Free ${careType} done!${j.event === 'level_up' && j.pet ? ` ${esc(j.pet.name || 'Your pet')} reached Level ${j.pet.level}!` : ''}`;
    try { renderBingoPetsPanel(); } catch(e){}
  }
  try { await refreshTokenBalance(); } catch(e){}
  try { renderSpinWheelPanel(); } catch(e){}
  render();
};

// keep it fresh with the normal player-screen refresh
if(typeof refreshPlayerScreen === 'function'){
  const _r = refreshPlayerScreen;
  window.refreshPlayerScreen = async function(){ const out = await _r.apply(this, arguments); try { render(); } catch(e){} return out; };
}
setInterval(() => { try { if(typeof _gpView !== 'undefined' && _gpView === 'player' && !V.busy) render(); } catch(e){} }, 15000);

const st = document.createElement('style');
st.textContent = `
#vchCard .vch-row{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,.08)}
#vchCard .vch-row:last-of-type{border-bottom:0}
#vchCard .vch-ic{font-size:26px;width:36px;text-align:center}
#vchCard .vch-main{flex:1;display:flex;flex-direction:column;gap:1px;font-size:13px;color:var(--white);min-width:0}
#vchCard .vch-main small{font-size:11px;color:var(--muted)}#vchCard .vch-how{font-style:italic}
#vchCard .vch-uses{font-size:11px;color:var(--gold);font-weight:700}
#vchCard .vch-act{display:flex;flex-direction:column;align-items:flex-end;gap:4px}#vchCard .vch-act .btn{width:auto}
#vchCard .vch-btns{display:flex;gap:4px}
#vchCard .vch-msg{font-size:12.5px;color:var(--success);margin-top:6px}#vchCard .vch-msg.err{color:var(--danger)}
@media(max-width:520px){#vchCard .vch-row{flex-wrap:wrap}#vchCard .vch-act{width:100%;align-items:flex-start}}`;
document.head.appendChild(st);
render();
})();
