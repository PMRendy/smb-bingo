// ═══════════════════════════════════════════════════════════════════════════
//  bingo-auto.js — 🎱 BINGO Auto Start + Auto Validate Winner · SMB Game Portal
//  v1 · 2026-11-26 · load after holidays.js. No new backend: uses the same shared
//  /state game (saveDB / loadDB) and Slack relay the BINGO page already uses.
//
//  ⏰ AUTO START (Admin → BINGO → ⚙️ Settings)
//   • The lobby opens N min before the start time (RSVP, card buying, Ask/Give),
//     the first ball drops at the start time, then a ball every X min (or paced to
//     finish by a target time). Shift days + holiday skip follow holidays.js.
//   • No admin tab needed: every open portal tab runs a tiny scheduler. One tab is
//     the "host" (the tab that started the game or drew last). If the host tab
//     closes, another open tab takes over after ~1 min. Before acting, a tab reloads
//     the game and re-checks, so only one draw lands per slot.
//
//  ✅ AUTO VALIDATE WINNER
//   • A BINGO claim counts only if the player MARKED the pattern AND every marked
//     number was really drawn (same rule as before).
//   • The first valid claim opens a 5- or 10-min claim window. Draws pause. Every
//     valid claim inside the window splits the prize. When the window ends, the
//     system re-checks every claim and announces the winner(s) (Slack + portal),
//     credits the token pot split, and logs the game.
//   • A false BINGO is rejected privately (only that player sees it). Optional
//     penalty: BINGO button locked for the next 5 draws.
//   • Admin can still Approve now / Reject a claim from the Game Control tab.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof DB === 'undefined' || typeof saveDB !== 'function' || typeof loadDB !== 'function') return;

const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIN = 60000;
const TAB = 'tab_' + Math.random().toString(36).slice(2, 10);
const TAKEOVER_MS = 45000 + Math.floor(Math.random() * 40000); // non-host tabs wait this long past due
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const DEFAULTS = {
  on:false, startTime:'23:00', days:[1,2,3,4,5], lobbyMin:15,
  pace:'fixed', every:4, endTime:'05:00',
  pattern:'random', prize:'PHP 300', tokenPrize:0,
  skipHolidays:true, slack:true, skipKey:null,
  v:{ on:false, windowMin:5, penalty:'lock5' },
};
function cfg(){
  const c = Object.assign({}, DEFAULTS, DB.autoBingo || {});
  c.v = Object.assign({}, DEFAULTS.v, (DB.autoBingo && DB.autoBingo.v) || {});
  if(!Array.isArray(c.days)) c.days = DEFAULTS.days.slice();
  return c;
}
const isAdminTab = () => typeof _adminPinSession !== 'undefined' && !!_adminPinSession;

// ── Time helpers (PHT is UTC+8, no DST) ─────────────────────────────────────
function phtParts(t){ const d = new Date(t + 8 * 3600e3); return { y:d.getUTCFullYear(), m:d.getUTCMonth(), d:d.getUTCDate() }; }
function phtAt(y, m, d, hhmm){ const [H, M] = String(hhmm || '00:00').split(':').map(Number); return Date.UTC(y, m, d, H - 8, M); }
function etISO(t){ return new Intl.DateTimeFormat('en-CA', { timeZone:'America/New_York', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(t)); }
function etDow(t){ return new Date(etISO(t) + 'T12:00:00Z').getUTCDay(); }
function fmtT(t){ return new Date(t).toLocaleTimeString('en-US', { timeZone:'Asia/Manila', hour:'numeric', minute:'2-digit' }); }
function fmtDT(t){ return new Date(t).toLocaleString('en-US', { timeZone:'Asia/Manila', weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }); }
function mmss(ms){ ms = Math.max(0, ms); const s = Math.ceil(ms / 1000); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
const keyFor = ts => 'auto-' + new Date(ts).toISOString().slice(0, 16);
function holidayAt(ts){ return typeof window.gpHolidayToday === 'function' ? window.gpHolidayToday(ts) : null; }

// Next scheduled start (or the one in progress, up to 30 min after start time)
function nextStart(c, now){
  now = now || Date.now();
  const p = phtParts(now);
  for(let k = -1; k <= 10; k++){
    const ts = phtAt(p.y, p.m, p.d + k, c.startTime);
    if(ts + 30 * MIN < now) continue;
    if(!c.days.includes(etDow(ts))) continue;                    // shift day = US date of that shift
    if(c.skipHolidays && holidayAt(ts)) continue;
    if(c.skipKey && c.skipKey === keyFor(ts)) continue;
    return ts;
  }
  return null;
}
function intervalFor(c, startTs){
  if(c.pace === 'end'){
    let end = phtAt(...Object.values(phtParts(startTs)), c.endTime);
    if(end <= startTs) end += 24 * 60 * MIN;
    return Math.max(MIN, Math.round((end - startTs) / 74));
  }
  return Math.max(1, Number(c.every) || 4) * MIN;
}
// Shift end after a start time (5 PM US Eastern, see shiftEndHourPHT)
function shiftEndAfter(ts){
  const h = typeof shiftEndHourPHT === 'function' ? shiftEndHourPHT(new Date(ts)) : 5;
  const p = phtParts(ts); let e = Date.UTC(p.y, p.m, p.d, h - 8, 0);
  while(e <= ts) e += 24 * 60 * MIN;
  return e;
}
function pickPattern(c){
  if(c.pattern !== 'random' && PATTERNS[Number(c.pattern)]) return PATTERNS[Number(c.pattern)];
  return PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
}

// ════════════════════════════════════════════════════════════
//  SCHEDULER (runs in every open tab)
// ════════════════════════════════════════════════════════════
let busy = false;
const live = g => !!(g && g.active && !g.ended);
function waitFor(host){ return host === TAB ? 0 : isAdminTab() ? 10000 : TAKEOVER_MS; }

async function tick(){
  if(busy || typeof _dbLoaded === 'undefined' || !_dbLoaded) return;
  const c = cfg(), g = DB.game, now = Date.now();
  try {
    // 1) Claim window over → announce
    if(live(g) && g.claimWin && now >= g.claimWin.end + waitFor(g.claimWin.host)) return await finalize(false);
    // 2) Auto start (lobby opens before the start time)
    if(c.on){
      const ts = nextStart(c, now);
      if(ts && now >= ts - c.lobbyMin * MIN && now < ts + 30 * MIN){
        const key = keyFor(ts);
        if(!(g && g.autoKey === key) && !live(g) && DB.autoBingoRan !== key) return await startAuto(ts, key, c);
      }
    }
    // 3) Auto draw
    if(live(g) && g.auto && !g.claimWin && !g.pendingBingoClaim && !g.auto.stopped){
      const n = (g.drawnNumbers || []).length;
      const due = n ? (g.lastDrawAt || 0) + g.auto.intervalMs : g.auto.startAt;
      if(now >= due + waitFor(g.auto.host)) return await autoDraw(n);
    }
  } catch(e){ console.warn('[bingo-auto]', e); busy = false; }
}

async function startAuto(ts, key, c){
  busy = true;
  try {
    await loadDB();
    if((DB.game && DB.game.autoKey === key) || live(DB.game) || DB.autoBingoRan === key) return;
    if(!(DB.players || []).some(p => p.active !== false)) return;
    try { _endingGame = false; _lastLoggedClaimAt = null; } catch(e){}
    const id = generateId();
    const pattern = pickPattern(c);
    const startAt = Math.max(ts, Date.now());
    DB.autoBingoRan = key;
    DB.game = {
      id, active:true, ended:false, lobbyOpen:true, rsvpPlayerIds:[], skipPlayerIds:[],
      drawnNumbers:[], calledSet:[], pattern,
      prize: c.prize || 'PHP 300', tokenPrize: Math.max(0, parseInt(c.tokenPrize, 10) || 0),
      playerCards:{}, playerMarks:{}, startedAt:Date.now(), lastDrawAt:null, claimedBy:null,
      autoKey:key, auto:{ startAt, intervalMs:intervalFor(c, startAt), host:TAB, pace:c.pace, stopAt:shiftEndAfter(startAt) },
      claims:[], claimWin:null,
    };
    await saveDBFull();
    await sleep(2000);
    await loadDB();
    if(!DB.game || DB.game.autoKey !== key || DB.game.id !== id) return; // another tab started it first
    if(c.slack){
      const every = Math.round(DB.game.auto.intervalMs / MIN * 10) / 10;
      let msg = buildStartMessage().replace(/⏰ Bawat .*? minuto, may bagong numero!/, `⏰ Auto-draw: bawat ${every} minuto, may bagong numero!`);
      msg += `\n\n🤖 *Auto Start:* unang bola at *${fmtT(startAt)} PHT*. Lobby open na — RSVP na!`;
      postToSlack(msg);
    }
  } finally { busy = false; }
}

async function autoDraw(n){
  busy = true;
  try {
    await loadDB();
    const g = DB.game;
    if(!live(g) || !g.auto || g.claimWin || g.pendingBingoClaim || (g.drawnNumbers || []).length !== n) return;
    if(Date.now() > g.auto.stopAt){
      g.auto.stopped = true; await saveDB();
      postToSlack(`⏰ *Shift end na!* Auto-draw stopped at ${n} balls. Admin can continue or end tonight's game. 🌙`);
      return;
    }
    g.auto.host = TAB;
    await adminDrawNumber(true);
    // Self-check: if two tabs drew at the same moment, keep one ball list everywhere
    await sleep(2500);
    await loadDB();
    const h = DB.game;
    if(h && h.drawnNumbers && h.calledSet){
      const want = h.drawnNumbers.map(x => x.full);
      if(want.join() !== h.calledSet.join()){ h.calledSet = want; await saveDB(); }
    }
  } finally { busy = false; }
}

// Lock the existing admin auto-draw timer out of auto games (the scheduler owns them)
if(typeof window.startAutoDrawTimer === 'function'){
  const _start = window.startAutoDrawTimer;
  window.startAutoDrawTimer = function(){ if(DB.game && DB.game.auto) return; return _start.apply(this, arguments); };
}

// ════════════════════════════════════════════════════════════
//  AUTO VALIDATE — player claim + claim window + announce
// ════════════════════════════════════════════════════════════
const lockKey = g => `bingoAutoLock:${g.id}:${currentPlayer && currentPlayer.id}`;
function lockedUntil(g){ try { return parseInt(localStorage.getItem(lockKey(g)) || '0', 10) || 0; } catch(e){ return 0; } }
function setLock(g, untilDraw){ try { localStorage.setItem(lockKey(g), String(untilDraw)); } catch(e){} }

function rejectPrivately(g, c, why){
  showFalseBingoTease();
  const el = document.getElementById('falseBingoTease');
  let extra = '';
  if(c.v.penalty === 'lock5'){
    setLock(g, (g.drawnNumbers || []).length + 5);
    extra = ' 🔒 BINGO button locked for the next 5 draws.';
  }
  if(el){ el.textContent = `✗ Hindi pa BINGO, Bayani! ${why}${extra}`; el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 8000); }
}

// All claimants: the claims list plus the claim stamp kept in playerMarks
// (playerMarks is union-merged by the server, so a claim can't get lost)
function claimants(g){
  const out = new Map(), rej = g.claimRejected || {};
  (g.claims || []).forEach(cl => { if(cl && cl.pid && !(rej[cl.pid] >= cl.at)) out.set(cl.pid, cl); });
  const win = g.claimWin;
  Object.entries(g.playerMarks || {}).forEach(([pid, m]) => {
    const st = m && m.claim; if(!st || out.has(pid)) return;
    const at = Number(st.at) || 0;
    if(win && at >= win.start - MIN && !(rej[pid] >= at)){
      const p = (DB.players || []).find(x => x.id === pid);
      out.set(pid, { pid, name:(p && p.name) || 'Bayani', card:Number(st.card) || 1, at });
    }
  });
  return [...out.values()].sort((a, b) => a.at - b.at);
}
function claimValid(g, cl){
  const card = ((g.playerCards || {})[cl.pid] || [])[cl.card - 1];
  return !!(card && card.grid && checkWin(card.grid, g.pattern, new Set(g.calledSet || [])));
}

if(typeof window.playerClaimBingo === 'function'){
  const _claim = window.playerClaimBingo;
  window.playerClaimBingo = async function(){
    const c = cfg();
    if(!c.v.on) return _claim.apply(this, arguments);
    if(!currentPlayer) return;
    if(_localGameSnapshot && DB.game && _localGameSnapshot.id === DB.game.id) DB.game = mergeGameLocal(DB.game, _localGameSnapshot);
    await loadDB();
    let g = DB.game;
    if(!live(g)) return;
    const lu = lockedUntil(g), drawn = (g.drawnNumbers || []).length;
    if(lu > drawn){ playerLog(`🔒 BINGO button locked pa for ${lu - drawn} more draw(s) — false BINGO kanina.`, 'err'); return; }
    if(claimants(g).some(cl => cl.pid === currentPlayer.id)){ playerLog('✅ Naka-claim ka na — hintayin ang announcement.', 'ok'); return; }

    const calledSet = new Set(g.calledSet), cards = (g.playerCards && g.playerCards[currentPlayer.id]) || [];
    const myMarks = (g.playerMarks && g.playerMarks[currentPlayer.id]) || {};
    let ci = -1, real = false;
    cards.forEach((card, i) => {
      if(ci === -1 && checkWinManual(card.grid, g.pattern, myMarks[i] || {})){ ci = i; real = checkWin(card.grid, g.pattern, calledSet); }
    });
    if(ci === -1) return rejectPrivately(g, c, 'Hindi pa kumpleto ang pattern sa marks mo.');
    if(!real){
      const card = cards[ci], bad = card.grid.findIndex((n, i) => g.pattern.cells[i] && n !== 'FREE' && !calledSet.has(`${LETTERS[i % 5]}${n}`));
      return rejectPrivately(g, c, bad >= 0 ? `${LETTERS[bad % 5]}-${card.grid[bad]} hasn't been drawn yet.` : 'May marked number na hindi pa natatawag.');
    }

    const me = { pid:currentPlayer.id, name:currentPlayer.name, card:ci + 1, at:Date.now(), ball:drawn };
    let opened = false;
    for(let i = 0; i < 4; i++){
      g = DB.game; if(!live(g)) return;
      if(!Array.isArray(g.claims)) g.claims = [];
      if(!g.claims.some(cl => cl.pid === me.pid)) g.claims.push(me);
      if(!g.playerMarks) g.playerMarks = {};
      if(!g.playerMarks[me.pid]) g.playerMarks[me.pid] = {};
      g.playerMarks[me.pid].claim = { at:String(me.at), card:String(me.card) };
      if(!g.claimWin){ g.claimWin = { start:me.at, end:me.at + c.v.windowMin * MIN, host:TAB, minutes:c.v.windowMin }; opened = true; }
      if(!g.pendingBingoClaim) g.pendingBingoClaim = { playerName:me.name, cardIndex:me.card, claimedAt:me.at };
      await saveDB();
      await sleep(1200);
      await loadDB();
      if(DB.game && (DB.game.claims || []).some(cl => cl.pid === me.pid)) break;
    }
    g = DB.game;
    const end = g && g.claimWin ? g.claimWin.end : me.at + c.v.windowMin * MIN;
    playerLog(`✅ Valid BINGO! Announcement at ${fmtT(end)} PHT.`, 'ok');
    const btn = document.getElementById('playerBingoBtn'); if(btn){ btn.disabled = true; btn.textContent = '✅ Claimed! Checking…'; }
    if(opened && g && g.claimWin && g.claimWin.host === TAB){
      postToSlack(`🚨 *BINGO CLAIMED!* 🚨\n\n*${me.name}* ay nag-BINGO sa Card ${me.card}! ✅ _System-verified._\n\n` +
        `🎯 Pattern: *${g.pattern.name}* · 🎱 Draw #${drawn}\n⏳ *${c.v.windowMin}-minute claim window* — naka-pause ang draws. ` +
        `Kung kumpleto rin ang card mo sa mga bolang 'to, i-claim mo na — *hati sa premyo* ang lahat ng valid!\n🏆 Winner announcement at *${fmtT(end)} PHT*.`);
    } else {
      postToSlack(`➕ *Another valid BINGO:* *${me.name}* (Card ${me.card}) ✅ — split na ang premyo! Announcement at ${fmtT(end)} PHT. 👀`);
    }
  };
}

async function finalize(force){
  busy = true;
  try {
    await loadDB();
    let g = DB.game;
    if(!live(g) || !g.claimWin) return;
    if(!force && Date.now() < g.claimWin.end) return;
    // Claim the announce job, then make sure no other tab took it
    g.claimWin.finalBy = { tab:TAB, at:Date.now() };
    await saveDB(); await sleep(2500); await loadDB();
    g = DB.game;
    if(!live(g) || !g.claimWin || !g.claimWin.finalBy || g.claimWin.finalBy.tab !== TAB) return;

    const list = claimants(g), valid = list.filter(cl => claimValid(g, cl));
    if(!valid.length){
      g.claimWin = null; g.pendingBingoClaim = null; await saveDB();
      postToSlack(`🔎 Claim window closed — walang valid na BINGO. Tuloy ang laro! 🎱`);
      if(isAdminTab() && !g.auto && typeof startAutoDrawTimer === 'function') startAutoDrawTimer();
      return;
    }
    const names = [...new Set(valid.map(cl => cl.name))];
    g.autoValidated = { at:Date.now(), winners:valid.map(cl => ({ name:cl.name, card:cl.card })) };
    g.claimWin = null;
    await adminEndGame(names);
    if(names.length > 1){
      postToSlack(`💰 *Split prize!* ${names.length} valid BINGO sa iisang claim window → *${(DB.game && DB.game.prize) || 'prize'}* hati-hati kina ${names.join(', ')}. ✅ _Auto-validated._`);
    }
  } finally { busy = false; }
}

// Admin actions on a claim
window.bauApprove = async () => { if(!isAdminTab() || busy) return; await finalize(true); };
window.bauReject = async pid => {
  if(!isAdminTab() || busy) return;
  busy = true;
  try {
    await loadDB(); const g = DB.game; if(!live(g)) return;
    g.claimRejected = Object.assign({}, g.claimRejected, { [pid]:Date.now() });
    g.claims = (g.claims || []).filter(cl => cl.pid !== pid);
    if(!claimants(g).length){ g.claimWin = null; g.pendingBingoClaim = null; }
    await saveDB();
    if(typeof adminLog === 'function') adminLog('Claim rejected by admin.', 'info');
    if(!g.claimWin && !g.auto && typeof startAutoDrawTimer === 'function') startAutoDrawTimer();
  } finally { busy = false; }
};

// ════════════════════════════════════════════════════════════
//  UI
// ════════════════════════════════════════════════════════════
const css = document.createElement('style');
css.textContent = `
.bau-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px dashed var(--line,rgba(255,255,255,.08))}
.bau-row:first-of-type{border-top:0}
.bau-row label{margin:0;font-weight:600;font-size:13px;color:var(--white);text-transform:none;letter-spacing:0}
.bau-row small{display:block;color:var(--muted);font-weight:400;font-size:11.5px}
.bau-row input,.bau-row select{margin:0;width:auto;min-width:0}
.bau-row input[type=number]{width:72px}
.bau-sw{position:relative;width:44px;height:24px;flex:none;display:inline-block}
.bau-sw input{opacity:0;width:0;height:0;position:absolute}
.bau-sw span{position:absolute;inset:0;background:#3a4062;border-radius:99px;transition:.2s;cursor:pointer}
.bau-sw span:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:#fff;border-radius:50%;transition:.2s}
.bau-sw input:checked+span{background:var(--success)}
.bau-sw input:checked+span:before{transform:translateX(20px)}
.bau-days{display:flex;gap:4px;flex-wrap:wrap}
.bau-days button,.bau-seg button{background:var(--card-bg);color:var(--muted);border:1px solid var(--line,rgba(255,255,255,.1));border-radius:8px;padding:4px 9px;cursor:pointer;font-size:12px}
.bau-days button.on{background:var(--teal);color:#06201d;border-color:var(--teal);font-weight:700}
.bau-seg{display:flex;gap:0}
.bau-seg button{border-radius:0}.bau-seg button:first-child{border-radius:8px 0 0 8px}.bau-seg button:last-child{border-radius:0 8px 8px 0}
.bau-seg button.on{background:var(--gold);color:#1a1400;border-color:var(--gold);font-weight:700}
.bau-status{border-radius:10px;padding:10px 12px;margin:12px 0 6px;font-size:13px;background:rgba(63,191,174,.1);border:1px solid rgba(63,191,174,.35)}
.bau-status.off{background:var(--card-bg);border-color:var(--line,rgba(255,255,255,.08));color:var(--muted)}
.bau-tl{margin:8px 0 0 4px;border-left:2px solid var(--line,rgba(255,255,255,.12));padding-left:12px}
.bau-tl div{position:relative;padding:2px 0;font-size:12.5px}
.bau-tl div:before{content:"";position:absolute;left:-18px;top:8px;width:10px;height:10px;border-radius:50%;background:var(--teal)}
.bau-tl b{display:inline-block;min-width:76px;color:var(--gold)}
.bau-claim{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;background:var(--card-bg);border-radius:12px;padding:12px;margin-top:10px}
.bau-mini{display:grid;grid-template-columns:repeat(5,22px);gap:3px;margin-top:6px}
.bau-mini span{height:22px;border-radius:4px;background:rgba(255,255,255,.06);font-size:10px;display:grid;place-items:center;color:var(--muted)}
.bau-mini span.h{background:var(--success);color:#06281b;font-weight:700}
.bau-mini span.x{background:var(--danger);color:#2b0606;font-weight:700}
.bau-pill{font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;margin-left:6px}
.bau-pill.ok{background:rgba(78,203,132,.18);color:var(--success)}.bau-pill.bad{background:rgba(224,92,92,.18);color:var(--danger)}
.bau-timer{font-variant-numeric:tabular-nums;font-size:22px;font-weight:800;color:var(--gold);text-align:right}
.bau-timer small{display:block;font-size:11px;color:var(--muted);font-weight:500}
.bau-banner{border-radius:14px;padding:14px 16px;text-align:center;margin:12px 0;background:linear-gradient(135deg,rgba(124,92,255,.22),rgba(63,191,174,.12));border:1px solid rgba(124,92,255,.55)}
.bau-banner .big{font-size:26px;font-weight:800;color:var(--gold);font-variant-numeric:tabular-nums;margin:2px 0}
.bau-banner small{color:var(--muted);font-size:12px;display:block}`;
document.head.appendChild(css);

// ── Admin settings panel (BINGO → ⚙️ Settings) ─────────────────────────────
let draft = null, saveMsg = '', saveOk = true, saving = false;
function injectSettings(){
  const tab = document.getElementById('tab-settings');
  if(!tab || document.getElementById('bauSettings')) return;
  const box = document.createElement('div'); box.id = 'bauSettings';
  const sub = tab.querySelector('.sub-row'); if(sub) sub.after(box); else tab.prepend(box);
}
const sw = (id, on) => `<label class="bau-sw"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} onchange="bauSet()"><span></span></label>`;
function renderSettings(){
  const el = document.getElementById('bauSettings'); if(!el) return;
  if(!draft) draft = JSON.parse(JSON.stringify(cfg()));
  const c = draft, now = Date.now(), ts = nextStart(c, now);
  const pats = `<option value="random" ${c.pattern === 'random' ? 'selected' : ''}>🎲 Random each game</option>` +
    PATTERNS.map((p, i) => `<option value="${i}" ${String(c.pattern) === String(i) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  let status = '', tl = '';
  if(c.on && ts){
    const iv = intervalFor(c, ts), lastBall = ts + iv * 74, stop = shiftEndAfter(ts);
    status = `📅 <b>Scheduled</b> · next game ${fmtDT(ts)} PHT · ~${Math.round(iv / MIN * 10) / 10} min per ball`;
    tl = `<div class="bau-tl"><div><b>${fmtT(ts - c.lobbyMin * MIN)}</b> Lobby opens · RSVP, cards, Ask/Give</div><div><b>${fmtT(ts)}</b> 🎱 First ball (auto)</div>
      <div><b>${fmtT(ts + iv * 30)}</b> ~Ball 30 · early winners possible</div>
      <div><b>${fmtT(Math.min(lastBall, stop))}</b> ${lastBall > stop ? `Shift ends · auto-draw stops (ball ~${Math.floor((stop - ts) / iv) + 1})` : 'Ball 75 · latest possible finish'}</div></div>`;
  }
  el.innerHTML = `
  <div class="panel">
    <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center">⏰ Auto Start ${sw('bauOn', c.on)}</div>
    <div style="font-size:12px;color:var(--muted);margin:-4px 0 8px">Schedule the game: the lobby opens, the first ball drops, and draws run by themselves — no admin tab needed.</div>
    <div style="${c.on ? '' : 'opacity:.45'}">
      <div class="bau-row"><label>Start time (PHT)<small>First ball is drawn at this time</small></label><input type="time" id="bauStart" value="${esc(c.startTime)}" onchange="bauSet()"></div>
      <div class="bau-row"><label>Shift days<small>US date of the shift · weekends are off</small></label>
        <div class="bau-days">${DAYS.map((d, i) => `<button type="button" class="${c.days.includes(i) ? 'on' : ''}" onclick="bauDay(${i})">${d}</button>`).join('')}</div></div>
      <div class="bau-row"><label>Open lobby before start<small>RSVP, card buying + Ask/Give window</small></label><span><input type="number" id="bauLobby" min="0" max="120" value="${c.lobbyMin}" onchange="bauSet()"> min</span></div>
      <div class="bau-row"><label>Draw pacing</label><div class="bau-seg"><button type="button" class="${c.pace === 'fixed' ? 'on' : ''}" onclick="bauPace('fixed')">Fixed interval</button><button type="button" class="${c.pace === 'end' ? 'on' : ''}" onclick="bauPace('end')">Finish by…</button></div></div>
      ${c.pace === 'fixed'
        ? `<div class="bau-row"><label>Draw every<small>Auto-draw interval</small></label><span><input type="number" id="bauEvery" min="1" max="60" value="${c.every}" onchange="bauSet()"> min</span></div>`
        : `<div class="bau-row"><label>Target finish (PHT)<small>Spreads the 75 balls to land by this time</small></label><input type="time" id="bauEnd" value="${esc(c.endTime)}" onchange="bauSet()"></div>`}
      <div class="bau-row"><label>Winning pattern<small>Used by auto-started games</small></label><select id="bauPat" onchange="bauSet()">${pats}</select></div>
      <div class="bau-row"><label>Prize<small>Shown to players and on Slack</small></label><input type="text" id="bauPrize" value="${esc(c.prize)}" style="width:140px" onchange="bauSet()"></div>
      <div class="bau-row"><label>Token prize pot<small>Optional · split evenly among winners</small></label><span><input type="number" id="bauTok" min="0" value="${c.tokenPrize}" onchange="bauSet()"> 🪙</span></div>
      <div class="bau-row"><label>Skip holidays<small>Uses the 🎌 Holidays list</small></label>${sw('bauHol', c.skipHolidays)}</div>
      <div class="bau-row"><label>Post to Slack on start<small>Start message + lobby reminder</small></label>${sw('bauSlack', c.slack)}</div>
    </div>
    ${c.on ? (ts ? `<div class="bau-status">${status}</div>${tl}` : `<div class="bau-status off">No upcoming shift day in the next 10 days — check Shift days.</div>`)
           : `<div class="bau-status off">Auto start is off — host starts and draws manually.</div>`}
    ${c.skipKey && (!ts || c.skipKey !== keyFor(ts)) ? `<div style="font-size:12px;color:var(--muted);margin-top:6px">⏭️ Skipping ${esc(c.skipKey.replace('auto-', '').replace('T', ' '))} UTC · <a href="#" onclick="bauUnskip();return false">undo</a></div>` : ''}
  </div>

  <div class="panel">
    <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center">✅ Auto Validate Winner ${sw('bauVOn', c.v.on)}</div>
    <div style="font-size:12px;color:var(--muted);margin:-4px 0 8px">When someone taps “I GOT BINGO”, the system checks the card against the drawn balls + tonight's pattern, then announces by itself.</div>
    <div style="${c.v.on ? '' : 'opacity:.45'}">
      <div class="bau-row"><label>Claim window<small>Other valid claims in this window split the prize</small></label>
        <div class="bau-seg"><button type="button" class="${c.v.windowMin === 5 ? 'on' : ''}" onclick="bauWin(5)">5 min</button><button type="button" class="${c.v.windowMin === 10 ? 'on' : ''}" onclick="bauWin(10)">10 min</button></div></div>
      <div class="bau-row"><label>What counts<small>Matches the “ikaw ang bahala sa pagmarka” rule</small></label><span class="bau-pill ok">Marked AND drawn only</span></div>
      <div class="bau-row"><label>Draws during the window<small>No new balls until the announcement</small></label><span class="bau-pill ok">Paused</span></div>
      <div class="bau-row"><label>Multiple valid winners<small>Everyone valid inside the window</small></label><span class="bau-pill ok">Split prize equally</span></div>
      <div class="bau-row"><label>False BINGO penalty<small>Rejected privately · stops spam claims</small></label>
        <select id="bauPen" onchange="bauSet()"><option value="lock5" ${c.v.penalty === 'lock5' ? 'selected' : ''}>Lock BINGO button for 5 draws</option><option value="warn" ${c.v.penalty === 'warn' ? 'selected' : ''}>Warning only</option></select></div>
      <div class="bau-row"><label>After the announcement</label><span class="bau-pill ok">Game ends · winners posted to Slack</span></div>
    </div>
    <div class="info-box" style="margin-top:10px">🛡️ Admin can still <b>Approve now</b> or <b>Reject</b> a claim from 🎱 Game Control before the timer ends.</div>
  </div>

  <div class="flex-row" style="gap:8px;flex-wrap:wrap;margin:-4px 0 16px">
    <button class="btn btn-gold btn-sm" ${saving ? 'disabled' : ''} onclick="bauSave()">${saving ? 'Saving…' : '💾 Save auto settings'}</button>
    ${c.on && ts ? `<button class="btn btn-outline btn-sm" onclick="bauSkip()">⏭️ Skip ${fmtDT(ts).split(',')[0]}'s game</button>` : ''}
    <button class="btn btn-teal btn-sm" onclick="bauStartNow()">▶ Open lobby now (first ball in ${c.lobbyMin} min)</button>
    ${saveMsg ? `<span style="font-size:12px;color:${saveOk ? 'var(--success)' : 'var(--danger)'}">${saveMsg}</span>` : ''}
  </div>`;
}
const val = id => (document.getElementById(id) || {}).value;
const chk = id => !!(document.getElementById(id) || {}).checked;
window.bauSet = () => {
  if(!draft) return;
  draft.on = chk('bauOn'); draft.v.on = chk('bauVOn');
  if(document.getElementById('bauStart')){
    draft.startTime = val('bauStart') || draft.startTime;
    draft.lobbyMin = Math.max(0, Math.min(120, parseInt(val('bauLobby'), 10) || 0));
    if(document.getElementById('bauEvery')) draft.every = Math.max(1, Math.min(60, parseInt(val('bauEvery'), 10) || 4));
    if(document.getElementById('bauEnd')) draft.endTime = val('bauEnd') || draft.endTime;
    draft.pattern = val('bauPat'); draft.prize = (val('bauPrize') || '').trim().slice(0, 40) || 'PHP 300';
    draft.tokenPrize = Math.max(0, parseInt(val('bauTok'), 10) || 0);
    draft.skipHolidays = chk('bauHol'); draft.slack = chk('bauSlack');
  }
  if(document.getElementById('bauPen')) draft.v.penalty = val('bauPen');
  saveMsg = 'Unsaved changes'; saveOk = false; renderSettings();
};
window.bauDay = i => { bauSet(); draft.days = draft.days.includes(i) ? draft.days.filter(d => d !== i) : draft.days.concat(i).sort(); renderSettings(); };
window.bauPace = p => { bauSet(); draft.pace = p; renderSettings(); };
window.bauWin = m => { bauSet(); draft.v.windowMin = m; renderSettings(); };
async function persist(next, okMsg){
  saving = true; renderSettings();
  next.updatedAt = Date.now();
  let ok = false;
  for(let i = 0; i < 3 && !ok; i++){
    DB.autoBingo = JSON.parse(JSON.stringify(next));
    await saveDB(); await sleep(1500); await loadDB();
    ok = !!(DB.autoBingo && DB.autoBingo.updatedAt === next.updatedAt);
  }
  saving = false; draft = null; saveOk = ok;
  saveMsg = ok ? okMsg : '⚠ Not saved — another tab overwrote it. Try again.';
  if(ok && typeof adminLog === 'function') adminLog('⏰ BINGO auto settings saved.', 'ok');
  renderSettings();
}
window.bauSave = () => { bauSet(); return persist(draft, '✅ Saved. Every open portal tab picks this up within a minute.'); };
window.bauSkip = () => { bauSet(); const ts = nextStart(draft); if(!ts) return; draft.skipKey = keyFor(ts); return persist(draft, `⏭️ ${fmtDT(ts)} game skipped.`); };
window.bauUnskip = () => { bauSet(); draft.skipKey = null; return persist(draft, 'Skip removed.'); };
window.bauStartNow = async () => {
  if(live(DB.game)){ alert('May game pa na tumatakbo — tapusin muna.'); return; }
  bauSet(); const c = JSON.parse(JSON.stringify(draft));
  const ts = Date.now() + c.lobbyMin * MIN;
  if(!confirm(`Open the lobby now? First ball at ${fmtT(ts)} PHT, then auto-draw.`)) return;
  await startAuto(ts, 'now-' + Date.now(), c);
  saveMsg = '▶ Lobby open!'; saveOk = true; renderSettings();
  if(typeof refreshAdminGame === 'function') refreshAdminGame();
};

// ── Admin claim queue (BINGO → 🎱 Game Control) ────────────────────────────
function miniCard(g, cl){
  const card = ((g.playerCards || {})[cl.pid] || [])[cl.card - 1]; if(!card) return '';
  const called = new Set(g.calledSet || []);
  return `<div class="bau-mini">${card.grid.map((n, i) => {
    const need = g.pattern.cells[i], hit = n === 'FREE' || called.has(`${LETTERS[i % 5]}${n}`);
    return `<span class="${need ? (hit ? 'h' : 'x') : ''}">${n === 'FREE' ? '★' : n}</span>`;
  }).join('')}</div>`;
}
function renderQueue(){
  const tab = document.getElementById('tab-game'); if(!tab) return;
  let el = document.getElementById('bauQueue');
  if(!el){ el = document.createElement('div'); el.id = 'bauQueue'; const sub = tab.querySelector('.sub-row'); if(sub) sub.after(el); else tab.prepend(el); }
  const g = DB.game, c = cfg();
  const autoChip = live(g) && g.auto ? `<div class="bau-status" style="margin:0 0 12px">🤖 <b>Auto game</b> · ${g.drawnNumbers.length ? `next ball ~${fmtT(g.lastDrawAt + g.auto.intervalMs)}` : `first ball at ${fmtT(g.auto.startAt)}`} PHT · every ${Math.round(g.auto.intervalMs / MIN * 10) / 10} min${g.auto.stopped ? ' · <b>stopped at shift end</b>' : ''}</div>` : '';
  if(!live(g) || !g.claimWin){ el.innerHTML = autoChip; return; }
  const list = claimants(g), left = g.claimWin.end - Date.now();
  el.innerHTML = autoChip + `<div class="panel" style="border-color:rgba(245,200,66,.45)">
    <div class="panel-title" style="display:flex;justify-content:space-between;align-items:center;gap:8px">🔎 BINGO claim window <span style="font-size:12px;color:var(--muted);font-weight:400">${esc(g.pattern.name)} · ball ${g.drawnNumbers.length} of 75</span></div>
    ${list.map(cl => { const ok = claimValid(g, cl); return `<div class="bau-claim"><div><b>${esc(cl.name)}</b> · Card ${cl.card} · ${fmtT(cl.at)} <span class="bau-pill ${ok ? 'ok' : 'bad'}">${ok ? '✓ VALID' : '✗ INVALID'}</span>${miniCard(g, cl)}</div>
      <div style="text-align:right"><button class="btn btn-outline btn-sm" onclick="bauReject('${esc(cl.pid)}')">Reject</button></div></div>`; }).join('') || '<div class="empty-state">No claims.</div>'}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:10px;flex-wrap:wrap">
      <div class="bau-timer" style="text-align:left">${left > 0 ? mmss(left) : 'Announcing…'}<small>${c.v.on ? 'auto-announce in' : 'auto validate is off'} · ${list.length > 1 ? `${list.length} claims → split prize` : 'more valid claims will split the prize'}</small></div>
      <button class="btn btn-gold btn-sm" onclick="bauApprove()">✅ Approve & announce now</button>
    </div></div>`;
}

// ── Player screens ──────────────────────────────────────────────────────────
function renderPlayer(){
  const btn = document.getElementById('playerBingoBtn'); if(!btn) return;
  let el = document.getElementById('bauBanner');
  if(!el){ el = document.createElement('div'); el.id = 'bauBanner'; btn.before(el); }
  const g = DB.game;
  if(live(g) && g.claimWin){
    const list = claimants(g), mine = currentPlayer && list.some(cl => cl.pid === currentPlayer.id);
    el.className = 'bau-banner'; el.style.display = '';
    el.innerHTML = `<div>🔎 Checking BINGO claims…</div><div class="big">${mmss(g.claimWin.end - Date.now())}</div>
      <small>${mine ? '✅ Valid ang claim mo! Hintayin ang announcement.' : `Draws paused. May nag-BINGO na! Kung kumpleto rin ang card mo sa mga bolang 'to, i-claim mo na — hati sa premyo. 👀`}</small>`;
    if(mine){ btn.disabled = true; btn.textContent = '✅ Claimed! Checking…'; }
  } else if(live(g) && currentPlayer && lockedUntil(g) > (g.drawnNumbers || []).length){
    const n = lockedUntil(g) - g.drawnNumbers.length;
    el.className = 'bau-banner'; el.style.display = '';
    el.innerHTML = `<div>🔒 BINGO button locked for ${n} more draw${n === 1 ? '' : 's'}</div><small>False BINGO kanina — markahan nang maigi! 😉</small>`;
    btn.disabled = true;
  } else { el.style.display = 'none'; el.innerHTML = ''; }
  // Next auto game on the portal BINGO tiles
  const c = cfg();
  if(!live(g) && c.on){
    const ts = nextStart(c);
    if(ts){
      const txt = `🤖 Next game auto-starts ${fmtDT(ts)} PHT · lobby ${fmtT(ts - c.lobbyMin * MIN)}`;
      const bi = document.getElementById('gpBingoInfo'); if(bi) bi.textContent = txt;
      const sb = document.getElementById('gpStatBingoSub'); if(sb) sb.textContent = `Auto-start ${fmtT(ts)} PHT`;
      const tb = document.getElementById('gpTileBingo'); if(tb) tb.textContent = `Our main game • auto ${fmtT(ts)} PHT`;
    }
  }
}
if(typeof window.gpRefresh === 'function'){
  const _gr = window.gpRefresh;
  window.gpRefresh = function(){ const r = _gr.apply(this, arguments); try { renderPlayer(); } catch(e){} return r; };
}

// ── Wire up ───────────────────────────────────────────────────────────────
injectSettings();
if(typeof switchAdminTab === 'function'){
  const _sw = window.switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'settings'){ draft = null; saveMsg = ''; renderSettings(); } if(name === 'game') renderQueue(); return r; };
}
renderSettings();
setInterval(() => { try { renderPlayer(); if(document.getElementById('tab-game')) renderQueue(); } catch(e){} }, 1000);
setInterval(() => { const a = document.activeElement; if(!(a && a.closest && a.closest('#bauSettings')) && !saving && saveOk !== false) { draft = null; renderSettings(); } }, 60000);
setInterval(tick, 10000);
setTimeout(tick, 5000);
// Tabs that are just sitting (login screen etc.) still keep the game state fresh enough to act
setInterval(() => { if(!busy && (DB.autoBingo && (DB.autoBingo.on || (DB.game && DB.game.claimWin)))) loadDB().catch(() => {}); }, 30000);
})();
