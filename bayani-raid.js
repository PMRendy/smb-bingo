// ═══════════════════════════════════════════════════════════════════════════
//  bayani-raid.js — 🪱 Bayani Park Boss Raid (Boss Uodie) · SMB Game Portal
//  v1 · 2026-11-13 · load after bayani-park.js. Backend: bingo-park action "raid"
//  (backend/raid.sql + backend/raidEngine.ts, see RAID_HANDOFF.md).
//
//  Player side (inside 🐾 Bayani Park):
//   • 2–3 raids a week, Friday always, 11:45 AM ET (team break), 15 minutes.
//   • Boss Uodie, Senior Micro-Manager, drags park pets into his Meeting Room one by one.
//   • 🦶 Kick / 🦷 Bite / 🐾 Scratch = 1 🪙 = 1 damage. 🤝 Friendship Attack & 💘 Sweetheart Strike
//     with your pet's Besties/Sweethearts: 2x cost, 2x power. ⚡ Reply All team combo.
//   • After the KO, hitters vote the MVP pet → its owner gets a 🎁 Mystery Chest.
//   • 🔥 Hard Mode (admin only): custom token goal + prize message ("MAGPAPAKAIN SI BOSS!").
//   • A live raid or a combo call shows a pop-up anywhere in the portal.
//  Admin side (🐾 Bayani Park tab, top): On/Off, summon/cancel, Hard Mode, weekly schedule,
//   rules, Mystery Chest table, Slack posts, burn counter.
//  The server decides every hit, roll and payout. This page only draws what it gets back.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof GP_TITLES === 'undefined' || typeof gpGo !== 'function') return;

const PARK_URL = 'https://ebeggngsggwnxufovkco.supabase.co/functions/v1/bingo-park';
const UODIE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520" class="rd-svg" aria-hidden="true" focusable="false"><defs><radialGradient id="rdHeadG" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#f3a6c8"/><stop offset="1" stop-color="#c25c8f"/></radialGradient><linearGradient id="rdMugG" x1="0" x2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#d9dde6"/></linearGradient></defs><ellipse cx="200" cy="492" rx="110" ry="14" fill="#000" opacity=".28"/><path d="M245 488 C 140 488, 120 430, 190 405 S 285 340, 215 300 S 150 240, 200 190" fill="none" stroke="#b9558a" stroke-width="46" stroke-linecap="round"/><path d="M245 488 C 140 488, 120 430, 190 405 S 285 340, 215 300 S 150 240, 200 190" fill="none" stroke="#8e3a68" stroke-width="46" stroke-linecap="butt" stroke-dasharray="3 24" opacity=".55"/><path d="M240 480 C 150 480, 135 432, 185 412 S 272 345, 207 304 S 160 245, 192 198" fill="none" stroke="#f2a9c9" stroke-width="8" stroke-linecap="round" opacity=".55"/><circle cx="262" cy="486" r="6" fill="#8e3a68"/><path d="M182 300 Q 158 300 140 288" fill="none" stroke="#8e3a68" stroke-width="6" stroke-linecap="round"/><g transform="rotate(-12 95 270)"><rect x="55" y="225" width="82" height="104" rx="6" fill="#8a5a2b"/><rect x="62" y="236" width="68" height="86" rx="3" fill="#fbfaf5"/><rect x="80" y="219" width="32" height="12" rx="3" fill="#c8ccd6"/><text x="96" y="252" font-family="Arial, sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="#222">KPIs</text><rect x="68" y="260" width="34" height="6" fill="#4b8bf5"/><rect x="78" y="272" width="44" height="6" fill="#f5a524"/><rect x="70" y="284" width="22" height="6" fill="#e5484d"/><rect x="88" y="296" width="36" height="6" fill="#30a46c"/><path d="M70 312 l6 6 l14 -14" stroke="#e5484d" stroke-width="3" fill="none"/><text x="108" y="318" font-family="Arial" font-size="8" fill="#e5484d" font-weight="700">ASAP</text></g><circle cx="140" cy="288" r="7" fill="#c25c8f"/><path d="M222 262 Q 252 262 262 240" fill="none" stroke="#8e3a68" stroke-width="6" stroke-linecap="round"/><g><path d="M300 214 q 18 2 16 18 q -2 14 -18 12" fill="none" stroke="#c8ccd6" stroke-width="6"/><rect x="262" y="204" width="40" height="46" rx="5" fill="url(#rdMugG)" stroke="#9aa1b0" stroke-width="2"/><text x="282" y="226" font-family="Arial" font-size="9" font-weight="800" text-anchor="middle" fill="#e5484d">#1</text><text x="282" y="238" font-family="Arial" font-size="8" font-weight="800" text-anchor="middle" fill="#222">BOSS</text><path d="M272 196 q 4 -8 0 -16 M284 196 q 4 -8 0 -16" stroke="#cfd4dd" stroke-width="2.5" fill="none" opacity=".8"/></g><circle cx="262" cy="240" r="7" fill="#c25c8f"/><path d="M184 178 L 196 236 L 208 178" fill="none" stroke="#e5484d" stroke-width="3"/><rect x="172" y="232" width="50" height="26" rx="3" fill="#fff" stroke="#9aa1b0"/><rect x="176" y="236" width="10" height="12" fill="#c25c8f"/><rect x="190" y="238" width="26" height="3" fill="#555"/><rect x="190" y="244" width="18" height="3" fill="#999"/><text x="197" y="255" font-family="Arial" font-size="5.5" font-weight="800" text-anchor="middle" fill="#e5484d">SR. MICRO-MGR</text><path d="M192 176 L208 176 L204 186 L200 186 Z" fill="#7b1f2e"/><path d="M200 186 L 193 214 L 200 224 L 207 214 L 203 186 Z" fill="#c62f45"/><path d="M196 200 l 9 -5 M195 210 l 11 -6" stroke="#f5c542" stroke-width="2"/><g class="uHeadG"><ellipse cx="200" cy="128" rx="56" ry="50" fill="url(#rdHeadG)"/><path d="M200 80 q -6 -22 14 -28 q -10 12 -4 24" fill="#8e3a68"/><path d="M146 128 Q 148 64 200 62 Q 252 64 254 128" fill="none" stroke="#2a2f3a" stroke-width="7"/><rect x="137" y="114" width="16" height="30" rx="7" fill="#2a2f3a"/><rect x="247" y="114" width="16" height="30" rx="7" fill="#2a2f3a"/><path d="M150 140 Q 160 168 190 162" fill="none" stroke="#2a2f3a" stroke-width="4"/><circle cx="192" cy="162" r="5" fill="#2a2f3a"/><ellipse cx="180" cy="122" rx="15" ry="13" fill="#fff"/><ellipse cx="222" cy="122" rx="15" ry="13" fill="#fff"/><circle class="uPupil" cx="186" cy="126" r="6" fill="#1d1020"/><circle class="uPupil" cx="228" cy="126" r="6" fill="#1d1020"/><circle cx="188" cy="124" r="1.8" fill="#fff"/><circle cx="230" cy="124" r="1.8" fill="#fff"/><path d="M164 122 Q 180 104 196 122 L196 108 L164 108 Z" fill="#d677a6"/><path d="M206 122 Q 222 104 238 122 L238 108 L206 108 Z" fill="#d677a6"/><path d="M164 121 Q 180 112 196 121" fill="none" stroke="#6e2a50" stroke-width="2.5"/><path d="M206 121 Q 222 112 238 121" fill="none" stroke="#6e2a50" stroke-width="2.5"/><path d="M160 98 L 196 110" stroke="#2b1020" stroke-width="8" stroke-linecap="round"/><path d="M242 98 L 206 110" stroke="#2b1020" stroke-width="8" stroke-linecap="round"/><path d="M200 148 q -12 -6 -24 0 q -6 3 -10 -3 M200 148 q 12 -6 24 0 q 6 3 10 -3" fill="none" stroke="#2b1020" stroke-width="3.5" stroke-linecap="round"/><path d="M186 158 Q 204 166 220 154" fill="none" stroke="#5a1d3e" stroke-width="3.5" stroke-linecap="round"/><ellipse cx="164" cy="146" rx="8" ry="4" fill="#e5484d" opacity=".25"/><ellipse cx="238" cy="146" rx="8" ry="4" fill="#e5484d" opacity=".25"/></g></svg>';

const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])));
const me = () => (typeof currentPlayer !== 'undefined' && currentPlayer) ? currentPlayer : null;
const pick = a => a[Math.floor(Math.random() * a.length)];
const spEmoji = sp => (typeof petSpecies === 'function' ? petSpecies(sp)[2] : '🐾');
const fmtET = iso => new Date(iso).toLocaleString('en-US', { timeZone:'America/New_York', weekday:'short', hour:'numeric', minute:'2-digit' }) + ' ET';
const fmtPH = iso => new Date(iso).toLocaleString('en-US', { timeZone:'Asia/Manila', weekday:'short', hour:'numeric', minute:'2-digit' }) + ' PHT';
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const store = { get(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } }, set(k, v){ try { sessionStorage.setItem(k, v); } catch(e){} } };
const QUOTES = {
  kick:['Ouch! That is not in the SOW!', "Let's take this offline!!", "I'm escalating this!", 'Per my last email... OW!'],
  bite:['Did you just BITE a stakeholder?', 'This will hit your KPIs!', 'HR will hear about this!'],
  scratch:['Scratching is not a deliverable!', "Let's put a pin in that!", 'I need this in writing!'],
  bestie:['Two of you?! Conflict of interest!', 'Team bonding is NOT approved!'],
  lover:['Workplace romance?! Filing a report!', 'Ew, feelings! Not in my org chart!'],
  reply:['REPLY ALL?! MY INBOX!!'],
  idle:['Quick sync? Your pets are mine now.', 'Mandatory lunch-break meeting.', "Let's circle back... never.", 'This pet needs a 1-on-1. Indefinitely.'],
};
const KIND_ICON = { kick:'🦶', bite:'🦷', scratch:'🐾', bestie:'🤝', lover:'💘', reply:'⚡' };
const KIND_VERB = { kick:'kicked', bite:'bit', scratch:'scratched' };

// ═════════════════════ STYLES ═════════════════════
const css = document.createElement('style');
css.textContent = `
.rd-card{position:relative;overflow:hidden}
.rd-card.live{border-color:rgba(194,92,143,.55);box-shadow:0 0 0 1px rgba(194,92,143,.25),0 10px 30px rgba(194,92,143,.12)}
.rd-card.hard{border-color:rgba(245,197,66,.6);box-shadow:0 0 0 1px rgba(245,197,66,.25),0 10px 30px rgba(229,72,77,.18)}
.rd-head{display:flex;gap:14px;align-items:center}
.rd-head .rd-svg{width:74px;height:96px;flex:0 0 74px}
.rd-head h2{margin:0;font-size:19px;color:var(--white)}.rd-head p{margin:2px 0 0;color:var(--muted);font-size:13px}
.rd-tag{display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:99px;background:rgba(194,92,143,.18);color:#f3a6c8;margin-bottom:4px}
.rd-tag.gold{background:rgba(245,197,66,.18);color:var(--gold)}.rd-tag.red{background:rgba(229,72,77,.2);color:#ff8f8f}
.rd-week{display:flex;gap:6px;margin-top:12px}
.rd-day{flex:1;min-width:0;text-align:center;border-radius:10px;padding:6px 2px;font-size:11px;color:var(--muted);box-shadow:inset 0 0 0 1px var(--line)}
.rd-day b{display:block;font-size:12.5px;color:var(--white)}
.rd-day.on{background:rgba(194,92,143,.16);box-shadow:inset 0 0 0 1px rgba(194,92,143,.6);color:#f3a6c8}
.rd-day.fri{background:rgba(245,197,66,.12);box-shadow:inset 0 0 0 1px rgba(245,197,66,.6);color:var(--gold)}
.rd-day.past{opacity:.45}.rd-day.skip{text-decoration:line-through;opacity:.5}
.rd-prize{margin:12px 0 0;border-radius:12px;padding:10px 12px;background:linear-gradient(90deg,rgba(227,166,62,.22),rgba(229,72,77,.12));box-shadow:inset 0 0 0 1px rgba(245,197,66,.45);font-size:13px}
.rd-prize b{color:var(--gold)}
.rd-hp{height:22px;border-radius:99px;background:var(--card-bg);overflow:hidden;position:relative;margin:12px 0 6px;box-shadow:inset 0 0 0 1px var(--line)}
.rd-hp i{display:block;height:100%;background:linear-gradient(90deg,#e5484d,#f5a524);transition:width .4s}
.rd-hp span{position:absolute;inset:0;text-align:center;font:800 12px/22px Inter,system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px #0008}
.rd-row{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12.5px;color:var(--muted)}.rd-row b{color:var(--white)}
.rd-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;margin-top:12px}
@media(max-width:860px){.rd-grid{grid-template-columns:minmax(0,1fr)}}
.rd-acts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.rd-act{all:unset;box-sizing:border-box;cursor:pointer;text-align:center;border-radius:12px;padding:12px 4px;background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--line);font-weight:800;font-size:15px;color:var(--white);transition:transform .08s}
.rd-act small{display:block;font-size:11px;font-weight:700;color:var(--gold);margin-top:2px}
.rd-act:hover:not([disabled]){box-shadow:inset 0 0 0 2px #c25c8f}.rd-act:active:not([disabled]){transform:scale(.97)}
.rd-act[disabled]{opacity:.38;cursor:not-allowed}
.rd-act.wide{display:block;width:100%}
.rd-act.bestie{background:linear-gradient(90deg,rgba(75,139,245,.22),var(--card-bg));box-shadow:inset 0 0 0 1px rgba(75,139,245,.5)}
.rd-act.lover{background:linear-gradient(90deg,rgba(255,92,154,.22),var(--card-bg));box-shadow:inset 0 0 0 1px rgba(255,92,154,.5)}
.rd-act.reply{background:linear-gradient(90deg,rgba(245,197,66,.2),var(--card-bg));box-shadow:inset 0 0 0 1px rgba(245,197,66,.5)}
.rd-act.glow{animation:rdGlow .7s infinite alternate}@keyframes rdGlow{to{box-shadow:inset 0 0 0 2px #fff,0 0 18px rgba(255,255,255,.35)}}
.rd-sub{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:14px 0 6px}
.rd-partners{display:grid;gap:6px}
.rd-partner{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:var(--card-bg);font-size:13px}
.rd-partner .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rd-partner small{color:var(--muted)}
.rd-call{margin-top:10px;border-radius:12px;padding:10px 12px;font-size:13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rd-call.bestie{background:rgba(75,139,245,.16);box-shadow:inset 0 0 0 1px rgba(75,139,245,.55)}
.rd-call.lover{background:rgba(255,92,154,.16);box-shadow:inset 0 0 0 1px rgba(255,92,154,.55)}
.rd-call .t{flex:1;min-width:180px}.rd-call.in{animation:rdPulse 1s infinite}
@keyframes rdPulse{50%{box-shadow:inset 0 0 0 2px #fff}}
.rd-me{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
.rd-me div{background:var(--card-bg);border-radius:10px;padding:7px;text-align:center;font-size:11px;color:var(--muted)}.rd-me b{display:block;font-size:17px;color:var(--white)}
.rd-msg{margin-top:10px;font-size:13px;font-weight:700}
.rd-board{margin:0;padding-left:20px;font-size:13px}.rd-board li{padding:2px 0}.rd-board li span{float:right;color:var(--muted)}
.rd-log{list-style:none;margin:0;padding:0;max-height:220px;overflow:auto;font-size:12.5px}
.rd-log li{padding:4px 0;border-bottom:1px dashed var(--line)}.rd-log .bestie{color:#8fb8ff}.rd-log .lover{color:#ff9cc2}.rd-log .reply{color:var(--gold)}
.rd-held{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.rd-held span{font-size:12px;padding:3px 8px;border-radius:99px;background:rgba(229,72,77,.14);box-shadow:inset 0 0 0 1px rgba(229,72,77,.4)}
.rd-vote{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-top:10px}
.rd-vote button{all:unset;box-sizing:border-box;cursor:pointer;text-align:center;border-radius:12px;padding:10px 6px;background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--line);color:var(--white)}
.rd-vote button .e{font-size:28px;display:block}.rd-vote button small{display:block;color:var(--muted);font-size:11px}
.rd-vote button .v{display:block;color:var(--gold);font-weight:800;font-size:12px;margin-top:3px}
.rd-vote button.sel{box-shadow:inset 0 0 0 2px var(--gold);background:rgba(245,197,66,.12)}.rd-vote button[disabled]{cursor:default}
.rd-feast{font:900 28px/1.1 'Space Grotesk',Inter,system-ui,sans-serif;color:var(--gold);margin:6px 0}
.rd-res{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px}
.rd-res div{background:var(--card-bg);border-radius:12px;padding:10px;font-size:12px;color:var(--muted)}.rd-res b{display:block;color:var(--white);font-size:14px;margin-top:2px}
.rd-how{margin-top:10px;font-size:12.5px;color:var(--muted)}.rd-how summary{cursor:pointer;color:var(--white);font-weight:700}
.rd-how ul{margin:6px 0 0;padding-left:18px;line-height:1.55}
/* boss on the park stage */
.rd-boss{position:absolute;left:50%;top:8px;transform:translateX(-50%);z-index:6;pointer-events:none;display:flex;align-items:flex-start;gap:6px}
.rd-boss .rd-svg{width:clamp(110px,16vw,170px);height:auto;filter:drop-shadow(0 8px 10px rgba(0,0,0,.4))}
.rd-boss.hard .rd-svg{filter:drop-shadow(0 0 16px #e5484d) saturate(1.3)}
.rd-boss.hit .rd-svg{animation:rdShake .28s}
@keyframes rdShake{25%{transform:translateX(-7px) rotate(-4deg)}75%{transform:translateX(7px) rotate(4deg)}}
.rd-boss.ko .rd-svg{animation:rdKO 1.2s forwards}@keyframes rdKO{to{transform:translateY(60px) rotate(90deg) scale(.5);opacity:0}}
.rd-bub{margin-top:16px;max-width:170px;background:#fff;color:#2c2420;font:800 12px Inter,system-ui,sans-serif;padding:7px 10px;border-radius:12px;box-shadow:0 3px 10px rgba(0,0,0,.2)}
.rd-mini{position:absolute;left:10px;top:10px;z-index:6;pointer-events:none;background:rgba(20,16,24,.82);color:#fff;border-radius:12px;padding:7px 10px;font:700 11px Inter,system-ui,sans-serif;min-width:150px}
.rd-mini .bar{height:8px;border-radius:9px;background:rgba(255,255,255,.15);overflow:hidden;margin:4px 0}.rd-mini .bar i{display:block;height:100%;background:linear-gradient(90deg,#e5484d,#f5a524)}
.rd-room{position:absolute;right:10px;top:10px;z-index:6;pointer-events:none;background:rgba(20,16,24,.82);color:#fff;border:2px dashed #e5484d;border-radius:12px;padding:6px 10px;font:700 11px Inter,system-ui,sans-serif;text-align:center;min-width:110px}
.rd-room .p{font-size:20px;letter-spacing:2px;min-height:24px}
.rd-float{position:absolute;z-index:7;pointer-events:none;font:900 20px Inter,system-ui,sans-serif;color:#ff6b6b;text-shadow:0 2px 0 #000;white-space:nowrap;animation:rdUp 1.2s ease-out forwards}
@keyframes rdUp{from{transform:translate(-50%,0);opacity:1}to{transform:translate(-50%,-70px);opacity:0}}
.bp-pet.rd-held-pet{opacity:.18;filter:grayscale(1)}
/* pop-up anywhere in the portal */
.rd-pop{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;width:min(440px,calc(100% - 32px));background:#1b1420;color:#fff;border:1px solid rgba(194,92,143,.6);border-radius:14px;padding:10px 12px;display:flex;gap:10px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.45);font:600 13px Inter,system-ui,sans-serif}
.rd-pop .rd-svg{width:38px;height:50px;flex:0 0 38px}.rd-pop .t{flex:1;min-width:0}.rd-pop b{color:#f3a6c8}
.rd-pop .x{all:unset;cursor:pointer;color:#aaa;font-size:18px;padding:0 4px}
.rd-pop.call{border-color:#fff;animation:rdPulse 1s infinite}
/* admin */
.rda-week{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.rda-week button{all:unset;cursor:pointer;min-width:62px;text-align:center;padding:7px 8px;border-radius:10px;font-size:12px;font-weight:700;color:var(--white);box-shadow:inset 0 0 0 1px var(--line)}
.rda-week button.on{background:rgba(194,92,143,.25);box-shadow:inset 0 0 0 1px #c25c8f}
.rda-week button.fri{background:rgba(245,197,66,.18);box-shadow:inset 0 0 0 1px var(--gold);cursor:not-allowed}
.rda-week button small{display:block;font-weight:500;color:var(--muted);font-size:10.5px}
.rda-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin:10px 0}
.rda-stats div{background:var(--card-bg);border-radius:10px;padding:8px 10px}.rda-stats b{display:block;font-size:18px}.rda-stats small{color:var(--muted);font-size:11px}
.rda-tbl{width:100%;border-collapse:collapse;font-size:12.5px}.rda-tbl th{text-align:left;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:4px}
.rda-tbl td{padding:3px 4px}.rda-tbl input,.rda-tbl select{width:100%;margin:0;padding:5px 6px;font-size:12.5px}.rda-tbl .em{width:46px}.rda-tbl .num{width:70px}
`;
document.head.appendChild(css);

// ═════════════════════ DATA ═════════════════════
const RD = { data:null, err:'', at:0, busy:false, msg:'', ok:true, fetching:false, logSeen:null, raidId:null, status:null, vote:null };
async function api(body){
  try {
    const r = await fetch(PARK_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(Object.assign({ action:'raid' }, body)) });
    const j = await r.json(); return j && typeof j === 'object' ? j : { ok:false, error:'bad' };
  } catch(e){ return { ok:false, error:'offline' }; }
}
function live(){ const r = RD.data && RD.data.raid; return r && r.status === 'live' ? r : null; }
function onPark(){ return typeof _gpView !== 'undefined' && _gpView === 'park' && !document.hidden; }
async function load(){
  const p = me(); if(RD.fetching) return; RD.fetching = true;
  const j = await api({ raidAction:'state', playerId:p ? p.id : null, playerName:p ? p.name : '' });
  RD.fetching = false; RD.at = Date.now();
  if(j && j.ok && 'raid' in j){ absorb(j); RD.err = ''; }
  else if(!RD.data || RD.err){ RD.err = 'offline'; }
  paint();
}
function absorb(j){
  const prev = RD.data && RD.data.raid;
  RD.data = j;
  const r = j.raid;
  if(r && (!prev || prev.id !== r.id)){ RD.logSeen = null; }
  // animate other people's hits that arrived since the last poll
  if(r && r.status !== 'pending'){
    const keys = (j.log || []).map(l => l.at + '|' + l.name + '|' + l.kind);
    if(RD.logSeen){ (j.log || []).forEach((l, i) => { if(!RD.logSeen.has(keys[i])) bossHit(l.kind, l.dmg, l.name, true); }); }
    RD.logSeen = new Set(keys);
  }
  if(r && prev && prev.id === r.id && prev.status === 'live' && r.status === 'won') bossKO();
}

// ═════════════════════ PLAYER: card above the park ═════════════════════
function inject(){
  const view = document.getElementById('gpv-park'), bp = document.getElementById('bpRoot');
  if(view && bp && !document.getElementById('rdRoot')){
    const d = document.createElement('div'); d.id = 'rdRoot'; d.style.cssText = 'display:grid;gap:16px;min-width:0;margin-bottom:16px';
    bp.parentNode.insertBefore(d, bp);
  }
  const at = document.getElementById('tab-park'), bpa = document.getElementById('bpaRoot');
  if(at && bpa && !document.getElementById('rdaRoot')){
    const d = document.createElement('div'); d.id = 'rdaRoot'; bpa.parentNode.insertBefore(d, bpa);
  }
}
function weekStrip(sc){
  return `<div class="rd-week">${(sc.week || []).map(d => `<div class="rd-day ${d.locked ? 'fri' : d.on ? 'on' : ''} ${d.past ? 'past' : ''} ${d.skipped ? 'skip' : ''}"><b>${d.day}</b>${d.skipped ? 'skipped' : d.on ? (d.locked ? '🪱 always' : '🪱 raid') : '—'}</div>`).join('')}</div>`;
}
function howTo(c){
  return `<details class="rd-how"><summary>📘 How the Boss Raid works</summary><ul>
    <li>Boss Uodie shows up <b>2–3 times a week, always on Friday</b>, at <b>${esc(c.startET || '11:45')} AM ET</b> (break time). The raid lasts ${c.minutes || 15} minutes.</li>
    <li>Only pets <b>in Bayani Park</b> can fight. Every ${c.kidnapEvery || 2} min he drags a pet into his Meeting Room (idle players' pets first). Stuck pets can't fight until freed.</li>
    <li>🦶 Kick, 🦷 Bite, 🐾 Scratch: <b>1 🪙 = 1 damage</b>, ${c.slots || 8} hits per player, ${c.cooldown || 10}s cooldown.</li>
    <li>🤝 <b>Friendship Attack</b> with a Bestie or 💘 <b>Sweetheart Strike</b> with a Sweetheart: your partner has ${c.comboWindow || 10}s to answer. Both pets hit at <b>${c.comboMult || 2}× power for ${c.comboMult || 2}× tokens</b>, no cooldown. Sweetheart Strike also frees a pet.</li>
    ${c.replyAll ? `<li>⚡ <b>Reply All</b>: when ${c.replyAllNeed || 3}+ teammates hit within 10s, anyone can fire it for ${c.replyAllDmg || 3} 🪙 → ${c.replyAllDmg || 3} damage, and it frees a pet.</li>` : ''}
    <li>KO = every pet freed. Hitters vote the <b>MVP pet</b> (not your own) and its owner gets a <b>🎁 Mystery Chest</b>. The final blow earns 📋 Uodie's Clipboard.</li>
    <li>Not answered? Combo tokens come back. Overkill tokens come back too.</li></ul></details>`;
}
function head(tag, title, sub, cls){
  return `<div class="rd-head">${UODIE}<div style="min-width:0"><span class="rd-tag ${cls || ''}">${tag}</span><h2>${title}</h2><p>${sub}</p></div></div>`;
}
function render(){
  inject();
  const root = document.getElementById('rdRoot'); if(!root) return;
  const d = RD.data, c = (d && d.cfg) || {}, r = d && d.raid;
  if(!d || RD.err){
    root.innerHTML = `<div class="gp-card rd-card">${head('● Coming soon', '🪱 Boss Raid: Boss Uodie', 'A skinny, evil Senior Micro-Manager is coming to "reassign" your pets. Team up with your Besties and Sweethearts to kick him out of the park.')}
      <div class="rd-row" style="margin-top:10px"><span>🦶🦷🐾 1 🪙 per hit</span><span>🤝💘 2× combos</span><span>🏅 MVP pet → 🎁 Mystery Chest</span></div></div>`;
    return;
  }
  const sc = d.schedule || {};
  if(!r){
    root.innerHTML = c.on
      ? `<div class="gp-card rd-card">${head('Next Boss Raid', sc.next ? `🪱 ${esc(sc.next.day)} · ${fmtET(sc.next.at).replace(/^\w+ /, '')}` : '🪱 Boss Uodie', sc.next ? `${fmtPH(sc.next.at)} · bring your pet into the park before he arrives` : 'No raid scheduled right now.')}${weekStrip(sc)}${howTo(c)}</div>`
      : `<div class="gp-card rd-card">${head('● Coming soon', '🪱 Boss Raid: Boss Uodie', 'A skinny, evil Senior Micro-Manager is coming to "reassign" your pets. Raids start soon!')}${howTo(c)}</div>`;
    return;
  }
  const hard = r.kind === 'hard', prize = hard && r.prizeTitle ? `<div class="rd-prize">🔥 <b>HARD MODE</b> · Burn <b>${r.maxHp} 🪙</b> together to unlock: <b>${esc(r.prizeTitle)}</b>${r.prizeDetails ? ` ${esc(r.prizeDetails)}` : ''}</div>` : '';
  const left = (new Date(r.endsAt) - Date.now()) / 1000;
  let h = '';
  if(r.status === 'pending'){
    h = `${head('⏰ Incoming', `Boss Uodie arrives in <span data-rd-cd="${esc(r.startedAt)}">${mmss((new Date(r.startedAt) - Date.now()) / 1000)}</span>`, `${fmtET(r.startedAt)} · ${fmtPH(r.startedAt)}. ${d.mine ? `${esc(d.mine.name)} is in the park and ready.` : 'Bring a pet into the park now. Only pets in the park can fight!'}`, 'gold')}${prize}`;
  } else if(r.status === 'live'){
    h = `${head(hard ? '🔥 Hard Mode · Live' : '🚨 Boss Raid · Live', 'Boss Uodie is in the park!', `He's dragging pets into his Meeting Room. ${d.players || 0} Bayani fighting so far.`, hard ? 'red' : '')}${prize}
      <div class="rd-hp"><i style="width:${r.hp / r.maxHp * 100}%"></i><span>❤️ ${r.hp} / ${r.maxHp} HP</span></div>
      <div class="rd-row"><span>⏱ <b data-rd-cd="${esc(r.endsAt)}">${mmss(left)}</b> left</span><span>🔥 <b>${r.burned}</b> 🪙 burned</span><span>🚪 <b>${(r.held || []).length}</b> in the Meeting Room</span></div>
      ${(r.held || []).length ? `<div class="rd-held">${r.held.map(p => `<span>${spEmoji(p.species)} ${esc(p.name)} <small style="color:var(--muted)">(${esc(p.playerName || '')})</small></span>`).join('')}</div>` : ''}
      <div class="rd-grid"><div>${actions(d, r)}</div><div>${board(d)}${log(d)}</div></div>`;
  } else if(r.status === 'won'){
    const voteLeft = (new Date(r.voteEnds) - Date.now()) / 1000, cand = d.candidates || [], my = d.me || {}, m = me();
    const iHit = (d.board || []).some(b => m && b.playerId === m.id);
    h = `${head('💥 KO!', 'Boss Uodie is OUT!', `${r.maxHp} 🪙 burned by ${d.players} Bayani · every pet is free · final blow: ${esc(r.finalByName || '—')}`, 'gold')}
      ${hard && r.prizeTitle ? `<div class="rd-prize" style="text-align:center"><div class="rd-feast">${esc(r.prizeTitle)}</div>${r.prizeDetails ? esc(r.prizeDetails) : ''}</div>` : ''}
      <div class="rd-sub">🏅 Vote the MVP pet · <span data-rd-cd="${esc(r.voteEnds)}">${mmss(voteLeft)}</span> left</div>
      <div style="font-size:12.5px;color:var(--muted)">${iHit ? (my.voted ? '✅ Vote counted. Results when the timer ends.' : 'One vote each. You can\'t vote for your own pet.') : 'Only players who hit Boss Uodie can vote. Watch the results!'}</div>
      <div class="rd-vote">${cand.map(p => { const own = m && p.playerId === m.id, sel = my.voted === p.petId;
        return `<button class="${sel ? 'sel' : ''}" ${!iHit || my.voted || own || RD.busy ? 'disabled' : ''} onclick="rdVote('${esc(p.petId)}')"><span class="e">${spEmoji(p.species)}</span>${esc(p.petName)}<small>${own ? 'your pet' : esc(p.playerName)} · ${p.dmg} dmg</small><span class="v">${p.votes} vote${p.votes === 1 ? '' : 's'}</span></button>`; }).join('')}</div>
      ${msg()}`;
  } else if(r.status === 'done'){
    const mv = r.mvp, ch = r.chest, top = (d.board || [])[0];
    h = `${head('🏆 Raid over', mv ? `MVP Pet: ${spEmoji(mv.species)} ${esc(mv.petName)}!` : 'Boss Uodie defeated!', mv ? `Owner ${esc(mv.playerName)} wins a 🎁 Mystery Chest${mv.votes ? ` (${mv.votes} vote${mv.votes === 1 ? '' : 's'})` : ''}` : 'Thanks for defending the park!', 'gold')}
      ${hard && r.prizeTitle ? `<div class="rd-prize" style="text-align:center"><div class="rd-feast">${esc(r.prizeTitle)}</div>${r.prizeDetails ? esc(r.prizeDetails) : ''}</div>` : ''}
      <div class="rd-res"><div>🎁 Mystery Chest<b>${ch ? `${esc(ch.emoji)} ${esc(ch.label)}` : '—'}</b></div><div>📋 Final blow<b>${esc(r.finalByName || '—')}</b></div>
        <div>🗡️ Top damage<b>${top ? `${esc(top.playerName)} (${top.dmg})` : '—'}</b></div><div>🔥 Tokens burned<b>${r.burned} 🪙</b></div></div>
      <div style="margin-top:12px">${board(d)}</div>`;
  } else {
    const held = (r.held || []).length;
    h = `${head(r.status === 'cancelled' ? 'Cancelled' : '😵 He got away', r.status === 'cancelled' ? 'The raid was cancelled' : 'Boss Uodie escaped…', r.status === 'cancelled' ? 'The admin stopped this raid.' : `${r.maxHp - r.hp}/${r.maxHp} HP knocked off. ${held ? `${held} pet${held === 1 ? '' : 's'} came back with Burnout 😵.` : ''}${hard ? ' No treat this time.' : ''} He'll be back!`, 'red')}
      <div style="margin-top:12px">${board(d)}</div>`;
  }
  root.innerHTML = `<div class="gp-card rd-card ${r.status === 'live' ? (hard ? 'hard' : 'live') : ''}">${h}</div>`;
}
function msg(){ return RD.msg ? `<div class="rd-msg" style="color:${RD.ok ? 'var(--teal)' : 'var(--danger)'}">${esc(RD.msg)}</div>` : ''; }
function actions(d, r){
  const R = r.rules || {}, my = d.me || {}, mine = d.mine, bal = Number(typeof _myTokenBalance !== 'undefined' ? _myTokenBalance : 0);
  const held = mine && (r.held || []).some(h => h.petId === mine.petId), slotsLeft = (R.slots || 8) - (my.slotsUsed || 0);
  if(!me()) return '<div class="empty-state">Log in to fight.</div>';
  if(!mine) return `<div class="rd-call bestie"><div class="t">🎟️ <b>Bring a pet into the park</b> to fight. Only pets in the park can join the raid.</div><button class="btn btn-gold btn-sm" onclick="document.getElementById('bpMine')&&document.getElementById('bpMine').scrollIntoView({behavior:'smooth'})">Go to My pets ↓</button></div>`;
  const why = held ? `${mine.name} is stuck in the Meeting Room!` : slotsLeft <= 0 ? 'No hit slots left.' : '';
  const solo = k => `<button class="rd-act" ${why || RD.busy || my.cooldown > 0 || bal < 1 ? 'disabled' : ''} onclick="rdAct('${k}')">${KIND_ICON[k]} ${k[0].toUpperCase() + k.slice(1)}<small>1 🪙 · 1 dmg</small></button>`;
  const inc = (my.incoming || [])[0], out = my.outgoing, mult = R.comboMult || 2;
  let combo = '';
  if(inc) combo += `<div class="rd-call in ${inc.kind}"><div class="t">${inc.kind === 'lover' ? '💘 Your Sweetheart' : '🤝 Your Bestie'} <b>${esc(inc.fromName)}</b> (${esc(inc.fromPetName)}) is charging a ${inc.kind === 'lover' ? 'Sweetheart Strike' : 'Friendship Attack'} with ${esc(inc.toPetName)}! <b data-rd-left="${inc.left}">${inc.left}s</b></div>
      <button class="btn btn-gold btn-sm" ${RD.busy || held || bal < inc.cost ? 'disabled' : ''} onclick="rdAnswer(${inc.id})">${inc.kind === 'lover' ? '💘' : '🤝'} Answer · ${inc.cost} 🪙</button></div>`;
  if(out) combo += `<div class="rd-call ${out.kind}"><div class="t">${out.kind === 'lover' ? '💘' : '🤝'} Calling <b>${esc(out.toName)}</b> (${esc(out.toPetName)})… waiting for them to answer · <b data-rd-left="${out.left}">${out.left}s</b></div></div>`;
  const ps = d.partners || [];
  const plist = ps.length ? `<div class="rd-partners">${ps.map(p => `<div class="rd-partner">${p.kind === 'lover' ? '💘' : '🤝'} <span class="n">${spEmoji(p.species)} <b>${esc(p.petName)}</b> <small>${esc(p.playerName || '')} · ${p.kind === 'lover' ? 'Sweetheart' : 'Bestie'}</small></span>
      <button class="rd-act ${p.kind}" style="padding:6px 10px;font-size:12px" ${why || out || inc || RD.busy || bal < mult || (r.held || []).some(h => h.petId === p.petId) ? 'disabled' : ''} onclick="rdCall('${p.kind}','${esc(p.petId)}')">${p.kind === 'lover' ? 'Sweetheart Strike' : 'Friendship Attack'}<small>${mult} 🪙 · ${mult}× power</small></button></div>`).join('')}</div>`
    : `<div style="font-size:12.5px;color:var(--muted)">${esc(mine.name)} has no Besties or Sweethearts in the park right now. Pets bond by meeting each other in the park.</div>`;
  const reply = R.replyAll ? `<button class="rd-act reply wide ${d.replyReady && !why ? 'glow' : ''}" style="margin-top:8px" ${why || !d.replyReady || RD.busy || bal < (R.replyAllDmg || 3) ? 'disabled' : ''} onclick="rdAct('reply')">⚡ TEAM COMBO "Reply All"<small>${d.replyReady ? 'READY!' : `needs ${R.replyAllNeed || 3}+ teammates hitting within ${R.replyAllWindow || 10}s`} · ${R.replyAllDmg || 3} 🪙 → ${R.replyAllDmg || 3} dmg · frees a pet</small></button>` : '';
  return `<div style="font-size:12.5px;color:var(--muted);margin-bottom:8px">Fighting with <b style="color:var(--white)">${spEmoji(mine.species)} ${esc(mine.name)}</b>${why ? ` · <span style="color:var(--danger)">${esc(why)}</span>` : ''}</div>
    <div class="rd-acts">${solo('kick')}${solo('bite')}${solo('scratch')}</div>${combo}
    <div class="rd-sub">💞 Combo partners (in the park)</div>${plist}${reply}
    <div class="rd-me"><div>Your tokens<b>${bal}</b></div><div>Hit slots<b>${Math.max(0, slotsLeft)}/${R.slots || 8}</b></div><div>Cooldown<b data-rd-left="${my.cooldown || 0}">${my.cooldown > 0 ? my.cooldown + 's' : 'ready'}</b></div></div>${msg()}`;
}
function board(d){
  const b = d.board || [], m = me();
  return `<div class="rd-sub" style="margin-top:0">🗡️ Damage board</div>${b.length ? `<ol class="rd-board">${b.slice(0, 10).map(x => `<li>${m && x.playerId === m.id ? '<b>You</b>' : esc(x.playerName)} ${spEmoji(x.species)}<span>${x.dmg} dmg</span></li>`).join('')}</ol>` : '<div style="font-size:12.5px;color:var(--muted)">No hits yet. Be the first!</div>'}`;
}
function log(d){
  const l = d.log || [];
  return `<div class="rd-sub">📜 Battle log</div><ul class="rd-log">${l.length ? l.map(x => `<li class="${x.kind}">${KIND_ICON[x.kind] || '•'} <b>${esc(x.name)}</b> ${x.kind === 'bestie' ? `+ ${esc(x.partner)} FRIENDSHIP ATTACK` : x.kind === 'lover' ? `+ ${esc(x.partner)} SWEETHEART STRIKE` : x.kind === 'reply' ? 'hit REPLY ALL' : KIND_VERB[x.kind] || x.kind} (−${x.dmg})</li>`).join('') : '<li style="color:var(--muted)">Waiting for the first hit…</li>'}</ul>`;
}

// ═════════════════════ PARK STAGE OVERLAY ═════════════════════
function stage(){ const pk = window.bayaniPark && window.bayaniPark._pk; return pk && pk.park ? pk.park : null; }
function paintStage(){
  const park = stage(), r = RD.data && RD.data.raid;
  const show = park && r && ['pending', 'live', 'won'].includes(r.status) && park.state && !park.state.demo;
  const st = park && park.stage;
  if(!st) return;
  let boss = st.querySelector('.rd-boss'), mini = st.querySelector('.rd-mini'), room = st.querySelector('.rd-room');
  if(!show){ [boss, mini, room].forEach(e => e && e.remove()); park.pets.forEach(p => p.el.classList.remove('rd-held-pet')); return; }
  if(!boss){ boss = document.createElement('div'); boss.className = 'rd-boss'; boss.innerHTML = UODIE + '<div class="rd-bub"></div>'; st.appendChild(boss); say(pick(QUOTES.idle)); }
  if(!mini){ mini = document.createElement('div'); mini.className = 'rd-mini'; st.appendChild(mini); }
  if(!room){ room = document.createElement('div'); room.className = 'rd-room'; st.appendChild(room); }
  boss.classList.toggle('hard', r.kind === 'hard');
  if(r.status === 'won') boss.classList.add('ko'); else boss.classList.remove('ko');
  st.querySelectorAll('.bp-hint').forEach(e => e.style.display = 'none');
  mini.innerHTML = r.status === 'pending' ? `⏰ Boss Uodie in <b data-rd-cd="${esc(r.startedAt)}">${mmss((new Date(r.startedAt) - Date.now()) / 1000)}</b>`
    : r.status === 'won' ? '💥 KO! Vote the MVP below' : `🪱 Boss Uodie ${r.hp}/${r.maxHp}<div class="bar"><i style="width:${r.hp / r.maxHp * 100}%"></i></div>⏱ <span data-rd-cd="${esc(r.endsAt)}">${mmss((new Date(r.endsAt) - Date.now()) / 1000)}</span> left`;
  const held = r.held || [], ids = new Set(held.map(h => h.petId));
  room.innerHTML = `🚪 Meeting Room<div class="p">${held.map(h => spEmoji(h.species)).join('') || '·'}</div>${held.length} pet${held.length === 1 ? '' : 's'} held`;
  park.pets.forEach((p, id) => p.el.classList.toggle('rd-held-pet', ids.has(id)));
}
function say(t){ const b = document.querySelector('.rd-boss .rd-bub'); if(b) b.textContent = '"' + t + '"'; }
function bossHit(kind, dmg, who, remote){
  const st = stage() && stage().stage; if(!st || !onPark()) return;
  const boss = st.querySelector('.rd-boss'); if(!boss) return;
  boss.classList.remove('hit'); void boss.offsetWidth; boss.classList.add('hit');
  const f = document.createElement('div'); f.className = 'rd-float';
  f.textContent = (kind === 'bestie' ? '🤝 ' : kind === 'lover' ? '💘 ' : kind === 'reply' ? '⚡ ' : '') + '−' + dmg + (remote && who ? ' ' + who : '');
  f.style.color = kind === 'bestie' ? '#8fb8ff' : kind === 'lover' ? '#ff9cc2' : kind === 'reply' ? '#f5c542' : '#ff6b6b';
  f.style.left = (38 + Math.random() * 24) + '%'; f.style.top = (90 + Math.random() * 40) + 'px'; st.appendChild(f); setTimeout(() => f.remove(), 1250);
  if(QUOTES[kind]) say(pick(QUOTES[kind]));
}
function bossKO(){ say("I'll... schedule... a follow-up..."); const b = document.querySelector('.rd-boss'); if(b) b.classList.add('ko'); }

// ═════════════════════ POP-UPS ANYWHERE + BADGES ═════════════════════
function pop(){
  let el = document.getElementById('rdPop');
  const d = RD.data, r = d && d.raid, m = me(), inc = d && d.me && (d.me.incoming || [])[0];
  let html = '', cls = '';
  if(m && r && r.status === 'live' && inc && !onPark()){
    cls = 'call';
    html = `${UODIE}<div class="t">${inc.kind === 'lover' ? '💘 Your Sweetheart' : '🤝 Your Bestie'} <b>${esc(inc.fromName)}</b> wants a combo! <b data-rd-left="${inc.left}">${inc.left}s</b></div>
      <button class="btn btn-gold btn-sm" ${RD.busy ? 'disabled' : ''} onclick="rdAnswer(${inc.id})">Answer · ${inc.cost} 🪙</button>`;
  } else if(m && r && (r.status === 'live' || r.status === 'pending') && !onPark() && store.get('rdPopX') !== String(r.id)){
    html = `${UODIE}<div class="t">${r.status === 'pending' ? `⏰ <b>Boss Uodie</b> raids Bayani Park in <span data-rd-cd="${esc(r.startedAt)}">${mmss((new Date(r.startedAt) - Date.now()) / 1000)}</span>!` : `🪱 <b>${r.kind === 'hard' ? 'HARD MODE: ' : ''}Boss Uodie</b> is in Bayani Park! ⏱ <span data-rd-cd="${esc(r.endsAt)}">${mmss((new Date(r.endsAt) - Date.now()) / 1000)}</span> left`}</div>
      <button class="btn btn-gold btn-sm" onclick="gpGo('park')">Fight!</button><button class="x" onclick="rdPopX(${r.id})">×</button>`;
  }
  if(!html){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('div'); el.id = 'rdPop'; document.body.appendChild(el); }
  el.className = 'rd-pop ' + cls;
  if(el.dataset.h !== html){ el.innerHTML = html; el.dataset.h = html; }
}
function badges(){
  const r = RD.data && RD.data.raid; const lv = r && (r.status === 'live' || r.status === 'pending');
  const c = document.getElementById('gpCntPark'); if(c && lv) c.textContent = r.status === 'live' ? '🪱 LIVE' : '🪱 Soon';
  const t = document.getElementById('gpTilePark'); if(t && lv) t.textContent = r.status === 'live' ? '🪱 Boss Raid LIVE!' : '🪱 Boss Raid in a few min';
}
function paint(){ try { if(onPark() || (typeof _gpView !== 'undefined' && _gpView === 'park')) render(); paintStage(); pop(); badges(); } catch(e){ console.error('bayani-raid', e); } }
// countdowns tick locally between polls
setInterval(() => {
  document.querySelectorAll('[data-rd-cd]').forEach(e => { e.textContent = mmss((new Date(e.dataset.rdCd) - Date.now()) / 1000); });
  document.querySelectorAll('[data-rd-left]').forEach(e => { const v = Math.max(0, (+e.dataset.rdLeft) - 1); e.dataset.rdLeft = v; e.textContent = v > 0 ? v + 's' : (e.closest('.rd-me') ? 'ready' : '0s'); });
  try { paintStage(); badges(); } catch(e){}
}, 1000);

// ═════════════════════ ACTIONS ═════════════════════
async function act(body, okMsg){
  const m = me(); if(!m || RD.busy) return;
  RD.busy = true; RD.msg = ''; render();
  const j = await api(Object.assign({ playerId:m.id, playerName:m.name }, body));
  RD.busy = false;
  if(j && j.ok){
    RD.ok = true; RD.msg = j.msg || (typeof okMsg === 'function' ? okMsg(j) : okMsg) || '';
    if('raid' in j){ if(RD.logSeen) (j.log || []).forEach(l => RD.logSeen.add(l.at + '|' + l.name + '|' + l.kind)); absorb(j); }
    if(j.hit) bossHit(j.hit.kind, j.hit.dmg);
    try { refreshTokenBalance(); } catch(e){}
  } else { RD.ok = false; RD.msg = (j && j.error) === 'offline' ? 'Network error. Try ulit.' : ((j && j.error) || 'Something went wrong.'); }
  paint(); render();
  setTimeout(() => { if(RD.msg && Date.now() - RD.at > 3000){ RD.msg = ''; render(); } }, 5000);
  return j;
}
window.rdAct = k => act({ raidAction:k }, j => j.hit ? (k === 'reply' ? `⚡ REPLY ALL! −${j.hit.dmg}${j.hit.freed && j.hit.freed.length ? ` · freed ${j.hit.freed[0].name}` : ''}` : `${KIND_ICON[k]} −${j.hit.dmg}!`) + (j.hit.won ? ' 💥 KO!' : '') : '');
window.rdCall = (kind, pet) => act({ raidAction:'call', kind, toPet:pet });
window.rdAnswer = id => act({ raidAction:'answer', callId:id }, j => j.hit ? `${j.hit.kind === 'lover' ? '💘 SWEETHEART STRIKE' : '🤝 FRIENDSHIP ATTACK'} with ${j.hit.partner}! −${j.hit.dmg}${j.hit.freed && j.hit.freed.length ? ` · freed ${j.hit.freed[0].name}` : ''}${j.hit.won ? ' 💥 KO!' : ''}` : '');
window.rdVote = pet => act({ raidAction:'vote', petId:pet });
window.rdPopX = id => { store.set('rdPopX', String(id)); pop(); };

// ═════════════════════ POLLING ═════════════════════
let _next = 0;
setInterval(() => {
  const r = RD.data && RD.data.raid, lv = r && (r.status === 'live' || r.status === 'pending');
  const won = r && r.status === 'won';
  const gap = RD.err ? 60000 : lv ? (onPark() ? 2000 : 5000) : won ? 4000 : onPark() ? 20000 : 45000;
  if(Date.now() >= _next && !document.hidden){ _next = Date.now() + gap; load(); }
}, 1000);
const _gpGo = window.gpGo;
window.gpGo = function(v){ const res = _gpGo.apply(this, arguments); if(v === 'park'){ setTimeout(() => { render(); paintStage(); }, 50); _next = 0; } else pop(); return res; };

// ═════════════════════ ADMIN ═════════════════════
const RA = { data:null, err:'', msg:'', ok:true, chest:null };
async function adminCall(adminAction, payload){
  if(typeof _adminPinSession === 'undefined' || !_adminPinSession) return { ok:false, error:'Please log in to admin again.' };
  return api({ raidAction:'admin', pin:_adminPinSession, adminAction, payload:payload || {} });
}
async function raLoad(){ const j = await adminCall('get'); if(j.ok){ RA.data = j; RA.err = ''; } else { RA.err = j.error || 'offline'; } raRender(); }
function raMsg(){ return RA.msg ? `<div style="font-size:12.5px;font-weight:700;margin-top:8px;color:${RA.ok ? 'var(--success)' : 'var(--danger)'}">${esc(RA.msg)}</div>` : ''; }
function raRender(){
  inject();
  const root = document.getElementById('rdaRoot'); if(!root) return;
  if(RA.err && !RA.data){
    root.innerHTML = `<div class="panel" style="border-color:rgba(226,104,95,.5)"><div class="panel-title" style="color:var(--danger)">🪱 Boss Raid · backend not live yet</div>
      <div style="font-size:13px">${RA.err === 'offline' || /unknown|action/i.test(RA.err) ? 'The raid part of <b>bingo-park</b> isn\'t deployed yet. Players see a "Coming soon" card. It goes live once Viktor runs <b>raid.sql</b> and adds the raid route (see RAID_HANDOFF.md, about 15 minutes).' : esc(RA.err)}</div></div>`;
    return;
  }
  if(!RA.data){ root.innerHTML = '<div class="panel"><div class="empty-state">Loading Boss Raid…</div></div>'; return; }
  const j = RA.data, s = j.settings, sc = j.schedule, st = j.stats || {}, lv = (j.live && j.live.raid) || null, D = j.defaults || {};
  if(!RA.chest) RA.chest = JSON.parse(JSON.stringify(s.chest || []));
  const running = lv && ['pending', 'live', 'won'].includes(lv.status);
  const num = (k, l, h) => `<div class="pra-f"><label>${l}<small>${h}</small></label><input type="number" min="0" step="any" data-rda="${k}" value="${esc(s[k])}"></div>`;
  let h = `<div class="panel"><div class="panel-title">🪱 Boss Raid · Boss Uodie</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Scheduled raids run only while <b>On</b>. You can summon a raid anytime, even while Off (everyone will see it).</div>
    <div class="pra-form"><div class="pra-f"><label>Scheduled raids<small>Off = "Coming soon" card for players</small></label><select data-rda="on" data-t="bool"><option value="true" ${s.on ? 'selected' : ''}>On</option><option value="false" ${!s.on ? 'selected' : ''}>Off</option></select></div>
      <div class="pra-f"><label>Start time (US Eastern)<small>HH:MM, 24h · follows US daylight saving</small></label><input type="text" maxlength="5" data-rda="startET" data-t="text" value="${esc(s.startET)}"></div>
      <div class="pra-f"><label>Raid length<small>minutes</small></label><input type="number" min="3" data-rda="minutes" value="${esc(s.minutes)}"></div></div>
    <div class="pra-save"><span></span><span><button class="btn btn-gold btn-sm" onclick="rdaSave(['on','startET','minutes'])">💾 Save</button></span></div>
    <div class="rda-stats">${[['🔥', 'Burned all-time', st.allTime], ['📅', 'Burned this week', st.thisWeek], ['🪱', 'Raids', st.raids], ['🏆', 'Wins', st.wins]].map(([i, l, v]) => `<div><small>${i} ${l}</small><b>${v ?? 0} ${l.startsWith('Burned') ? '🪙' : ''}</b></div>`).join('')}</div>
    <div style="font-size:13px;margin:6px 0">${running ? `<b>${lv.kind === 'hard' ? '🔥 Hard Mode' : '🪱 Raid'} ${esc(lv.status)}</b> · ${lv.hp}/${lv.maxHp} HP · ${lv.burned} 🪙 burned · ${j.live.players || 0} players · ends ${fmtET(lv.endsAt)}` : `Next scheduled: <b>${sc.next && s.on ? `${fmtET(sc.next.at)} · ${fmtPH(sc.next.at)}` : s.on ? 'none' : 'Off'}</b>`}</div>
    <div class="bpa-ctl" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-gold btn-sm" ${running ? 'disabled' : ''} onclick="rdaSummon('regular')">🪱 Summon a raid now</button>
      <button class="btn btn-outline btn-sm" ${running ? '' : 'disabled'} onclick="rdaCancel(false)">🛑 Cancel raid</button>
      <button class="btn btn-outline btn-sm" ${running ? '' : 'disabled'} onclick="rdaCancel(true)">🛑 Cancel + refund</button></div>${raMsg()}</div>`;
  h += `<div class="panel" style="border-color:rgba(245,197,66,.45)"><div class="panel-title" style="color:var(--gold)">🔥 Hard Mode Bully Raid (manual only)</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:10px">High difficulty: you set the token goal and a real-life prize. <b>Only Hard Mode posts the prize announcement</b>; regular raids never do. If the team wins, deliver the treat the following week.</div>
    <div class="pra-form"><div class="pra-f"><label>Tokens to burn<small>= Boss HP · hit slots auto-scale to ~${s.hardPlayers} players</small></label><input type="number" min="10" id="rdaHp" value="300"></div>
      <div class="pra-f"><label>Time limit<small>minutes</small></label><input type="number" min="3" id="rdaMin" value="${esc(s.hardMinutes)}"></div>
      <div class="pra-f"><label>Prize headline<small>shown big on the KO screen + Slack</small></label><input type="text" maxlength="80" id="rdaTitle" value="🍕 MAGPAPAKAIN SI BOSS!"></div>
      <div class="pra-f" style="grid-column:1/-1"><label>Prize details<small>e.g. what and when</small></label><input type="text" maxlength="300" id="rdaDet" value="Pizza party for the whole team, delivered next week."></div></div>
    <div class="pra-save"><span></span><span><button class="btn btn-gold" ${running ? 'disabled' : ''} onclick="rdaSummon('hard')">🔥 Launch Hard Mode now</button></span></div></div>`;
  const wk = sc.week || [], custom = !!(s.week || {})[sc.weekKey];
  h += `<div class="panel"><div class="panel-title">📅 Raid schedule · week of ${esc(sc.weekKey)}</div>
    <div style="font-size:12px;color:var(--muted)">Friday is always on. ${custom ? 'You picked this week\'s days.' : `Auto picks ${s.extraMin}–${s.extraMax} extra day(s) each week.`} Tap Mon–Thu to change this week.</div>
    <div class="rda-week">${wk.map(d => `<button class="${d.locked ? 'fri' : d.on ? 'on' : ''}" ${d.locked ? 'disabled' : ''} onclick="rdaDay('${d.day}')">${d.day}<small>${d.skipped ? 'skipped' : d.on ? fmtPH(d.start).replace(/^\w+ /, '') : 'off'}</small></button>`).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${custom ? `<button class="btn btn-outline btn-sm" onclick="rdaAutoWeek()">↺ Back to auto for this week</button>` : ''}
      <button class="btn btn-outline btn-sm" ${sc.next ? '' : 'disabled'} onclick="rdaSkip()">⏭️ Skip next raid${sc.next ? ` (${esc(sc.next.day)} ${esc(sc.next.date)})` : ''}</button>
      ${(s.skip || []).slice(-6).map(dt => `<button class="btn btn-outline btn-sm" onclick="rdaUnskip('${esc(dt)}')">↩ Restore ${esc(dt)}</button>`).join('')}</div>
    <div class="pra-form" style="margin-top:10px"><div class="pra-f"><label>Auto extra days<small>min</small></label><input type="number" min="0" max="4" data-rda="extraMin" value="${esc(s.extraMin)}"></div>
      <div class="pra-f"><label>Auto extra days<small>max</small></label><input type="number" min="0" max="4" data-rda="extraMax" value="${esc(s.extraMax)}"></div>
      <div class="pra-f"><label>Slack warning<small>minutes before</small></label><input type="number" min="0" data-rda="warnMinutes" value="${esc(s.warnMinutes)}"></div></div>
    <div class="pra-save"><span></span><span><button class="btn btn-gold btn-sm" onclick="rdaSave(['extraMin','extraMax','warnMinutes'])">💾 Save</button></span></div></div>`;
  h += `<div class="panel"><div class="panel-title">⚙️ Raid rules</div><div class="pra-form">
    ${num('hp', 'Boss HP (regular)', `= tokens burned per win · default ${D.hp}`)}${num('slots', 'Hit slots', 'per player per raid')}${num('cooldown', 'Cooldown', 'seconds between solo hits')}
    ${num('kidnapEvery', 'Kidnap every', 'minutes')}${num('maxHeld', 'Max pets held', 'in the Meeting Room')}${num('comboWindow', 'Combo answer window', 'seconds')}
    ${num('comboMult', 'Combo power', 'x cost and x damage')}${num('replyAllNeed', 'Reply All needs', 'different players within the window')}${num('replyAllDmg', 'Reply All power', 'tokens = damage')}
    ${num('voteMinutes', 'MVP vote', 'minutes')}${num('mvpCandidates', 'MVP candidates', 'top pets by damage')}${num('hardPlayers', 'Hard Mode slot scaling', 'slots = HP ÷ this')}
    <div class="pra-f"><label>Reply All<small>team combo</small></label><select data-rda="replyAll" data-t="bool"><option value="true" ${s.replyAll ? 'selected' : ''}>On</option><option value="false" ${!s.replyAll ? 'selected' : ''}>Off</option></select></div></div>
    <div class="pra-save"><span></span><span><button class="btn btn-gold" onclick="rdaSave(['hp','slots','cooldown','kidnapEvery','maxHeld','comboWindow','comboMult','replyAllNeed','replyAllDmg','voteMinutes','mvpCandidates','hardPlayers','replyAll'])">💾 Save rules</button></span></div></div>`;
  const tot = RA.chest.reduce((a, r) => a + Math.max(0, +r.weight || 0), 0) || 1;
  h += `<div class="panel"><div class="panel-title">🎁 Mystery Chest (MVP pet's owner)</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">One random reward per win. Higher weight = more common. Vouchers land in 🎟️ My Vouchers, tokens in the wallet (keep token rewards small so the raid stays a net burn).</div>
    <div style="overflow-x:auto"><table class="rda-tbl"><tr><th></th><th>Name</th><th>Tier</th><th>Gives</th><th>Voucher</th><th>Amount</th><th>Weight</th><th>Chance</th><th></th></tr>
    ${RA.chest.map((r, i) => `<tr><td class="em"><input value="${esc(r.emoji || '')}" oninput="rdaChest(${i},'emoji',this.value)"></td><td><input value="${esc(r.label || '')}" oninput="rdaChest(${i},'label',this.value)"></td>
      <td><select onchange="rdaChest(${i},'tier',this.value)">${['common', 'rare', 'epic', 'legendary'].map(t => `<option ${r.tier === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><select onchange="rdaChest(${i},'kind',this.value,1)">${[['tokens', 'SMB Tokens'], ['voucher', 'Voucher'], ['collectible', 'Collectible']].map(([k, l]) => `<option value="${k}" ${r.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      <td>${r.kind === 'voucher' ? `<select onchange="rdaChest(${i},'voucher',this.value)">${[['spin', '🎡 Free spin'], ['bingo_card', '🎟️ BINGO card'], ['pet_care_pack', '🐾 Care Pack']].map(([k, l]) => `<option value="${k}" ${r.voucher === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}</td>
      <td class="num"><input type="number" min="1" value="${esc(r.amount ?? 1)}" oninput="rdaChest(${i},'amount',+this.value)"></td>
      <td class="num"><input type="number" min="0" step="any" value="${esc(r.weight ?? 1)}" oninput="rdaChest(${i},'weight',+this.value,1)"></td>
      <td style="color:var(--muted);white-space:nowrap">${(Math.max(0, +r.weight || 0) / tot * 100).toFixed(1)}%</td><td><button class="btn btn-outline btn-sm" onclick="rdaChestDel(${i})">✕</button></td></tr>`).join('')}</table></div>
    <div class="pra-save"><span></span><span><button class="btn btn-outline btn-sm" onclick="rdaChestAdd()">＋ Add reward</button> <button class="btn btn-outline btn-sm" onclick="rdaChestReset()">Reset</button> <button class="btn btn-gold" onclick="rdaSaveChest()">💾 Save chest</button></span></div>
    <div class="pra-sec">🔔 Slack posts (uses the Bayani Park webhook below)</div><div class="pra-form">${[['warn', '⏰ Warning before a raid'], ['spawn', '🪱 Raid starts'], ['kidnap', '🚪 Every kidnapping'], ['ko', '💥 KO (Hard Mode includes the prize)'], ['escape', '😵 Boss escaped'], ['mvp', '🏅 MVP + chest']].map(([k, l]) =>
      `<div class="pra-f"><label>${l}</label><select data-rds="${k}"><option value="true" ${s.slack[k] !== false ? 'selected' : ''}>On</option><option value="false" ${s.slack[k] === false ? 'selected' : ''}>Off</option></select></div>`).join('')}</div>
    <div class="pra-save"><span></span><span><button class="btn btn-gold btn-sm" onclick="rdaSaveSlack()">💾 Save Slack posts</button></span></div></div>`;
  const rec = st.recent || [];
  if(rec.length) h += `<div class="panel"><div class="panel-title">🧾 Recent raids</div><div class="pr-tbl"><table class="roster-table"><thead><tr><th>Started</th><th>Type</th><th>Result</th><th>Burned</th><th>Players</th><th>MVP</th><th>Chest</th></tr></thead><tbody>
    ${rec.map(x => `<tr><td>${fmtPH(x.startedAt)}</td><td>${x.kind === 'hard' ? '🔥 Hard' : '🪱 Regular'}${x.prize ? `<br><small>${esc(x.prize)}</small>` : ''}</td><td>${esc(x.status)}</td><td>${x.burned}/${x.maxHp}</td><td>${x.players}</td><td>${esc(x.mvpPet || '—')}${x.mvpPlayer ? ` <small>(${esc(x.mvpPlayer)})</small>` : ''}</td><td>${esc(x.chest || '—')}</td></tr>`).join('')}</tbody></table></div></div>`;
  root.innerHTML = h;
}
async function raDo(action, payload, after){ const j = await adminCall(action, payload); RA.ok = !!j.ok; RA.msg = j.ok ? (j.msg || '✅ Done.') : '⚠ ' + (j.error || 'Failed'); if(j.ok){ RA.data = j; if(after) after(); } raRender(); }
window.rdaSave = keys => { const p = {}; keys.forEach(k => { const el = document.querySelector(`#rdaRoot [data-rda="${k}"]`); if(!el) return; p[k] = el.dataset.t === 'bool' ? el.value === 'true' : el.dataset.t === 'text' ? el.value.trim() : Number(el.value); }); raDo('save', p); };
window.rdaSummon = kind => {
  if(kind === 'hard'){ const hp = +document.getElementById('rdaHp').value, t = document.getElementById('rdaTitle').value.trim();
    if(!t) { RA.ok = false; RA.msg = '⚠ Add a prize headline.'; return raRender(); }
    if(!confirm(`Launch HARD MODE now?\n\nGoal: ${hp} tokens\nPrize: ${t}\n\nEveryone in the portal will see it.`)) return;
    raDo('summon', { kind, hp, minutes:+document.getElementById('rdaMin').value, prizeTitle:t, prizeDetails:document.getElementById('rdaDet').value.trim() }, () => { _next = 0; }); }
  else { if(!confirm('Summon Boss Uodie now? Everyone in the portal will see the raid.')) return; raDo('summon', { kind }, () => { _next = 0; }); }
};
window.rdaCancel = refund => { if(!confirm(refund ? 'Cancel the raid and refund every token spent in it?' : 'Cancel the raid? Tokens already spent stay burned.')) return; raDo('cancel', { refund }, () => { _next = 0; }); };
window.rdaDay = day => { const j = RA.data, sc = j.schedule; const cur = sc.week.filter(d => d.on && !d.locked).map(d => d.day);
  const nx = cur.includes(day) ? cur.filter(d => d !== day) : [...cur, day]; raDo('save', { week:{ [sc.weekKey]:nx } }); };
window.rdaAutoWeek = () => raDo('save', { week:{ [RA.data.schedule.weekKey]:null } });
window.rdaSkip = () => raDo('skip_next');
window.rdaUnskip = date => raDo('unskip', { date });
window.rdaChest = (i, k, v, re) => { RA.chest[i][k] = v; if(k === 'kind' && v === 'voucher' && !RA.chest[i].voucher) RA.chest[i].voucher = 'spin'; if(re) raRender(); };
window.rdaChestDel = i => { RA.chest.splice(i, 1); raRender(); };
window.rdaChestAdd = () => { RA.chest.push({ id:'c' + Date.now().toString(36), emoji:'🎁', label:'New reward', tier:'rare', kind:'collectible', amount:1, weight:5 }); raRender(); };
window.rdaChestReset = () => { if(!confirm('Reset the Mystery Chest to the default rewards?')) return; RA.chest = JSON.parse(JSON.stringify(RA.data.defaults.chest)); raRender(); };
window.rdaSaveChest = () => { const bad = RA.chest.find(r => !r.label || !(+r.weight >= 0) || !(+r.amount >= 1)); if(bad){ RA.ok = false; RA.msg = '⚠ Every reward needs a name, amount 1+ and weight 0+.'; return raRender(); }
  raDo('save', { chest:RA.chest }, () => { RA.chest = null; }); };
window.rdaSaveSlack = () => { const slack = {}; document.querySelectorAll('#rdaRoot [data-rds]').forEach(el => slack[el.dataset.rds] = el.value === 'true'); raDo('save', { slack }); };
if(typeof switchAdminTab === 'function'){
  const _sw = window.switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'park'){ setTimeout(() => { inject(); raLoad(); }, 60); } return r; };
}
setInterval(() => { const t = document.getElementById('tab-park'); if(t && t.classList.contains('active') && !document.hidden && RA.data){
  const lv = RA.data.live && RA.data.live.raid; if(lv && ['pending', 'live', 'won'].includes(lv.status) && !document.activeElement.closest('#rdaRoot')) raLoad(); } }, 10000);

// ═════════════════════ BOOT ═════════════════════
if(typeof TOKEN_EVENT_LABELS !== 'undefined') Object.assign(TOKEN_EVENT_LABELS, { park_raid_hit:'🪱 Boss Raid Hit', park_raid_combo:'🪱 Boss Raid Combo',
  park_raid_refund:'🪱 Boss Raid Refund', park_raid_chest:'🎁 Boss Raid Mystery Chest', park_raid_final:'📋 Boss Raid Final Blow' });
function boot(){ try { inject(); if(typeof _gpView !== 'undefined' && _gpView === 'park') render(); } catch(e){ console.error('bayani-raid', e); } }
boot(); setTimeout(boot, 1600); setTimeout(() => { _next = 0; }, 3000);
window.bayaniRaid = { load, render, _rd:RD, _ra:RA, raLoad };
})();
