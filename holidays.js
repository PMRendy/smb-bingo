// ═══════════════════════════════════════════════════════════════════════════
//  holidays.js — 🎌 Holiday Pause (portal-wide) · SMB Game Portal
//  v1 · 2026-11-25 · load after bayani-marathon.js. Backend: bingo-games config "holidays"
//  + admin action "holidays_set" (see HOLIDAY_HANDOFF.md).
//
//  Team holidays are non-working shifts. On a holiday shift the timed games freeze and
//  pick up again on the next working shift (Skip & extend), exactly like a weekend:
//   • 🏁 Pet Race       — no legs, dice, rests or clashes; remaining legs move to the next shifts
//   • 🏙️ Bayani City    — no rolls; the season adds a shift at the end
//   • 🐾 Bayani Park    — park closed, no Boss Raid (a Friday raid on a holiday is skipped)
//   • 🥚 Pet care       — no decay and no daily token drop
//  🏅 World Marathon keeps its own holiday list (Admin → World Marathon → Season & holidays).
//
//  A shift belongs to the US Eastern calendar date it runs on (shift = 8 AM–4 PM ET),
//  so "Thanksgiving 2026-11-26" = the shift that starts Thu Nov 26, 10 PM PHT.
//  The server enforces the pause. This file only shows the banner and the admin list.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof GP_TITLES === 'undefined' || typeof gpGo !== 'function') return;

const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])));

// Used until Viktor's backend returns a saved list (GAMES_CFG.holidays).
const DEFAULT_HOLIDAYS = [
  { d:'2026-11-26', label:'Thanksgiving',   icon:'🦃' },
  { d:'2026-11-27', label:'Black Friday',   icon:'🛍️' },
  { d:'2026-12-25', label:'Christmas Day',  icon:'🎄' },
  { d:'2027-01-01', label:"New Year's Day", icon:'🎆' },
  { d:'2027-11-25', label:'Thanksgiving',   icon:'🦃' },
  { d:'2027-11-26', label:'Black Friday',   icon:'🛍️' },
];
const PAUSED = [['🏁','Pet Race'],['🏙️','Bayani City'],['🐾','Bayani Park & Boss Raid'],['🥚','Pet care & daily drops']];

const H = { draft:null, busy:false, msg:'', ok:true };

function backendLive(){ return typeof GAMES_CFG !== 'undefined' && GAMES_CFG && Array.isArray(GAMES_CFG.holidays); }
function list(){
  const src = backendLive() ? GAMES_CFG.holidays : DEFAULT_HOLIDAYS;
  return src.filter(h => h && /^\d{4}-\d{2}-\d{2}$/.test(h.d)).slice().sort((a, b) => a.d.localeCompare(b.d));
}
// US Eastern calendar date (YYYY-MM-DD) for a moment in time
function etDate(t){ return new Intl.DateTimeFormat('en-CA', { timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit' }).format(t ? new Date(t) : new Date()); }
function addDays(iso, n){ const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function isWeekend(iso){ const w = new Date(iso + 'T12:00:00Z').getUTCDay(); return w === 0 || w === 6; }
function holidayOn(iso){ return list().find(h => h.d === iso) || null; }
function isOffShift(iso){ return isWeekend(iso) || !!holidayOn(iso); }
function nextWorkShift(iso){ let d = addDays(iso, 1); for(let i = 0; i < 30 && isOffShift(d); i++) d = addDays(d, 1); return d; }
function fmtD(iso, opt){ return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', Object.assign({ timeZone:'UTC', weekday:'short', month:'short', day:'numeric' }, opt || {})); }
function iconFor(h){ return h.icon || (/thanks/i.test(h.label) ? '🦃' : /friday/i.test(h.label) ? '🛍️' : /christ/i.test(h.label) ? '🎄' : /new year/i.test(h.label) ? '🎆' : '🎌'); }

// Public helpers so any game page can ask "is this a holiday shift?"
window.gpHolidayToday = (t) => holidayOn(etDate(t));
window.gpIsHolidayShift = (t) => !!holidayOn(etDate(t));
window.gpHolidayList = () => list();

// ── Player banner (top of every portal page) ──────────────────────────────
function banner(){
  const top = document.querySelector('.gp-main .gp-top'); if(!top) return;
  let el = document.getElementById('gpHolBanner');
  if(!el){ el = document.createElement('div'); el.id = 'gpHolBanner'; top.after(el); }
  const today = etDate(), h = holidayOn(today), tmr = addDays(today, 1), ht = holidayOn(tmr);
  if(h){
    const back = nextWorkShift(today);
    el.className = 'gp-hol on';
    el.innerHTML = `<div class="gp-hol-ic">${iconFor(h)}</div><div class="gp-hol-tx"><b>Happy ${esc(h.label)}! Holiday pause ngayong shift.</b>
      <span>${PAUSED.map(p => `${p[0]} ${p[1]}`).join(' · ')} are frozen. Nothing decays, nothing is missed, and running seasons add the shift back at the end.</span>
      <small>Balik laro on ${fmtD(back)} shift. Pahinga muna, Bayani! 💤</small></div>`;
    el.style.display = '';
  } else if(ht && !isWeekend(tmr)){
    el.className = 'gp-hol soon';
    el.innerHTML = `<div class="gp-hol-ic">${iconFor(ht)}</div><div class="gp-hol-tx"><b>Heads up: ${fmtD(tmr)} is ${esc(ht.label)}, a no-work holiday.</b>
      <span>Pet Race, Bayani City, Bayani Park and pet care pause for that shift and pick up where they left off on ${fmtD(nextWorkShift(tmr))}.</span></div>`;
    el.style.display = '';
  } else { el.style.display = 'none'; el.innerHTML = ''; }
}

// ── Admin tab: 🎌 Holidays ─────────────────────────────────────────────────
function injectAdmin(){
  const anchor = document.querySelector('.tab-btn[data-tab="bingo"]');
  if(anchor && !document.querySelector('.tab-btn[data-tab="holidays"]')){
    const b = document.createElement('button'); b.className = 'tab-btn'; b.dataset.tab = 'holidays';
    b.setAttribute('onclick', "switchAdminTab('holidays')"); b.innerHTML = '🎌 Holidays <span class="adm-chip">NEW</span>'; anchor.after(b);
  }
  const tab = document.getElementById('tab-bingo') || document.getElementById('tab-settings');
  if(tab && !document.getElementById('tab-holidays')){
    const d = document.createElement('div'); d.className = 'tab-content'; d.id = 'tab-holidays';
    d.innerHTML = '<div class="panel"><div class="panel-title">🎌 Holiday Pause</div><div id="holAdminRoot"></div></div>';
    tab.after(d);
  }
}
function adminRender(){
  const el = document.getElementById('holAdminRoot'); if(!el) return;
  if(!H.draft) H.draft = list().map(h => ({ d:h.d, label:h.label }));
  const today = etDate(), live = backendLive();
  const rows = H.draft.map((h, i) => {
    const past = h.d < today, wk = isWeekend(h.d);
    return `<tr style="${past ? 'opacity:.5' : ''}"><td class="hol-mono">${esc(h.d)}</td><td>${fmtD(h.d)}</td><td>${iconFor(h)} ${esc(h.label)}</td>
      <td>${h.d === today ? '<b style="color:var(--gold)">Paused now</b>' : past ? 'Done' : wk ? 'Weekend (already off)' : 'Will pause'}</td>
      <td><button class="btn btn-outline btn-sm" onclick="holDel(${i})">Remove</button></td></tr>`;
  }).join('');
  el.innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px;line-height:1.55">No-work US holidays for the team. On these shifts the timed games freeze and resume on the next working shift, the same way weekends work.
      Dates are the <b>US date of the shift</b> (e.g. 2026-11-26 = the shift starting Thu Nov 26, 10 PM PHT).</div>
    <div class="info-box"><b>Paused on a holiday:</b> ${PAUSED.map(p => `${p[0]} ${p[1]}`).join(' · ')}.<br>
      Still open: BINGO (admin-run), Spin, Higher/Lower, RPS, Beat Sir Rendy, Shop and Avatar Studio.<br>
      🏅 World Marathon uses its own list in its tab. Keep both in sync.</div>
    ${live ? '' : `<div class="info-box" style="color:var(--gold);border-color:rgba(227,166,62,.35);background:rgba(227,166,62,.08)">⏳ Waiting for Viktor's backend update (HOLIDAY_HANDOFF.md). Until then this is the built-in list, players see the banners, but the games are not frozen by the server yet and Save won't stick.</div>`}
    <div style="overflow-x:auto"><table class="roster-table"><thead><tr><th>Date</th><th>Day</th><th>Holiday</th><th>Status</th><th></th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5"><div class="empty-state">No holidays set.</div></td></tr>'}</tbody></table></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;margin-top:12px">
      <div><label style="font-size:11px;color:var(--muted)">Shift date (US)</label><input id="holD" type="date" style="margin:0"></div>
      <div style="flex:1;min-width:160px"><label style="font-size:11px;color:var(--muted)">Holiday</label><input id="holL" type="text" placeholder="e.g. Christmas Day" style="margin:0"></div>
      <button class="btn btn-outline btn-sm" onclick="holAdd()">Add</button>
      <button class="btn btn-gold btn-sm" ${H.busy ? 'disabled' : ''} onclick="holSave()">${H.busy ? 'Saving…' : 'Save holidays'}</button>
    </div>
    ${H.msg ? `<div style="margin-top:8px;font-size:12px;color:${H.ok ? 'var(--success)' : 'var(--danger)'}">${H.msg}</div>` : ''}`;
}
window.holDel = i => { H.draft.splice(i, 1); H.msg = ''; adminRender(); };
window.holAdd = () => {
  const d = (document.getElementById('holD') || {}).value || '', l = ((document.getElementById('holL') || {}).value || '').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d) || !l){ H.ok = false; H.msg = 'Pick a date and type the holiday name.'; adminRender(); return; }
  if(H.draft.some(h => h.d === d)){ H.ok = false; H.msg = 'That date is already on the list.'; adminRender(); return; }
  H.draft.push({ d, label:l.slice(0, 40) }); H.draft.sort((a, b) => a.d.localeCompare(b.d));
  H.ok = true; H.msg = isWeekend(d) ? 'Added. Heads up: that date is a weekend, so nothing changes.' : 'Added. Click Save holidays to apply.'; adminRender();
};
window.holSave = async () => {
  if(H.busy || typeof gaCall !== 'function') return;
  H.busy = true; H.msg = ''; adminRender();
  const j = await gaCall('holidays_set', null, { holidays:H.draft });
  H.busy = false;
  if(j && j.ok){
    H.ok = true; H.msg = '✅ Saved. Running games pick this up on their next tick.';
    if(typeof loadGamesConfig === 'function') await loadGamesConfig();
    H.draft = null; if(typeof adminLog === 'function') adminLog('🎌 Holiday list saved.', 'ok');
  } else { H.ok = false; H.msg = `⚠ ${esc((j && j.error) || 'Not saved')}${backendLive() ? '' : ' (backend not updated yet)'}`; }
  adminRender(); banner();
};

// ── Styles ────────────────────────────────────────────────────────────────
const css = document.createElement('style');
css.textContent = `
.gp-hol{display:flex;gap:14px;align-items:flex-start;border-radius:16px;padding:14px 16px;margin:0 0 16px;line-height:1.45}
.gp-hol.on{background:linear-gradient(135deg,rgba(227,166,62,.16),rgba(226,104,95,.12));border:1px solid rgba(227,166,62,.45)}
.gp-hol.soon{background:rgba(63,191,174,.08);border:1px solid rgba(63,191,174,.3)}
.gp-hol-ic{font-size:30px;line-height:1}
.gp-hol-tx{display:grid;gap:3px;min-width:0;font-size:13px}
.gp-hol-tx b{font-size:14px;color:var(--gold,#E3A63E)}
.gp-hol.soon .gp-hol-tx b{color:var(--teal,#3FBFAE)}
.gp-hol-tx span{color:var(--text,#e8ecf5);opacity:.9}
.gp-hol-tx small{color:var(--muted,#9aa3b8);font-size:12px}
.hol-mono{font-family:ui-monospace,Menlo,monospace;font-size:12px}`;
document.head.appendChild(css);

// ── Wire up ───────────────────────────────────────────────────────────────
injectAdmin();
if(typeof switchAdminTab === 'function'){
  const _sw = switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'holidays'){ H.draft = null; H.msg = ''; adminRender(); } return r; };
}
banner();
setInterval(banner, 60000);
setTimeout(banner, 4000); // after the first games-config load
})();
