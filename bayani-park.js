// ═══════════════════════════════════════════════════════════════════════════
//  bayani-park.js — 🐾 Bayani Park: shared pet yard + admin controls · SMB Game Portal
//  v1 · 2026-11-08 · load after bayani-city.js. Backend: edge fn bingo-park (backend/park.sql).
//
//  Player side: Games → 🐾 Bayani Park (right under 🏙️ Bayani City)
//   • Off (and not a beta tester), or backend not live yet: "Coming soon" preview with a demo park.
//   • Open / beta: one big yard with everyone's pets. Pay a ticket to bring a pet in for the shift.
//     Pets wander, dig up items (tokens, vouchers, collectibles), play / play-fight / flirt,
//     become Besties or Sweethearts, race for Treasure Chests, and find more during Golden Hour.
//     Polls every 12 s while the tab is open; every screen animates the same server events.
//  Admin side: 🐾 Bayani Park tab (right after 🏙️ Bayani City) → Open/Beta, live park view,
//   chest / Golden Hour / weather controls, prices & rates, loot table, Slack webhook + post toggles,
//   tonight's numbers, recent finds, remove a pet.
//  The server decides every roll and payout. This page only draws what it gets back.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof GP_TITLES === 'undefined' || typeof gpGo !== 'function') return;

const PARK_URL = 'https://ebeggngsggwnxufovkco.supabase.co/functions/v1/bingo-park';
const W = 2400, H = 1400;
const POND = { x:1650, y:930, rx:270, ry:150 };
const TREES = [{ x:720, y:360 }, { x:2120, y:1080 }, { x:330, y:1170 }];
const SAND = { x:1180, y:250, w:320, h:200 };
const STALL = { x:1980, y:300 };
const LAMPS = [{ x:420, y:640 }, { x:1120, y:700 }, { x:1400, y:1180 }, { x:1960, y:640 }, { x:880, y:1060 }];
const GATE = { x:110, y:730 };
const TIER = { common:'#9aa3ad', rare:'#4f8ff7', epic:'#b06cf5', legendary:'#F5C842' };
const TRAIT = { Brave:'Wins play fights more often', Curious:'Digs up things more often', Lucky:'Finds rarer items',
                Lazy:'Naps a lot, sometimes finds things in its sleep', Flirty:'Loves making Sweethearts' };
const SPECIES = ['dog','cat','parrot','arowana','goldfish','rabbit','chicken','goat','cow','hamster','turtle','snake','spider','frog','gecko'];

const esc = s => (typeof escapeHtml === 'function' ? escapeHtml(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])));
const me = () => (typeof currentPlayer !== 'undefined' && currentPlayer) ? currentPlayer : null;
const rand = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inPond = (x, y) => ((x - POND.x) / POND.rx) ** 2 + ((y - POND.y) / POND.ry) ** 2 < 0.82;
const spEmoji = sp => (typeof petSpecies === 'function' ? petSpecies(sp)[2] : '🐾');
const spName = sp => (typeof petSpecies === 'function' ? petSpecies(sp)[1] : sp);
const imgSrc = p => p.evolved ? (typeof petAdultSrc === 'function' ? petAdultSrc(p.species) : `adult_${p.species}.gif`)
                             : (typeof petBabySrc === 'function' ? petBabySrc(p.species) : `baby_${p.species}.gif`);
function hash(s){ let h = 2166136261; for(const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rrect(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
const phtTime = t => new Date(t).toLocaleTimeString('en-US', { timeZone:'Asia/Manila', hour:'numeric', minute:'2-digit' });

// ═════════════════════ STYLES ═════════════════════
const css = document.createElement('style');
css.textContent = `
.bp-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.bp-chip{font-size:12px;font-weight:700;padding:5px 10px;border-radius:99px;background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--line);color:var(--white)}
.bp-chip.gold{background:linear-gradient(90deg,#E3A63E,#ff8a5b);color:#1b1206;box-shadow:none}
.bp-chip.teal{color:var(--teal)}
.bp-stage{position:relative;height:clamp(420px,62vh,640px);border-radius:16px;overflow:hidden;background:#a3d98a;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
.bp-stage:active{cursor:grabbing}
.bp-world{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;will-change:transform}
.bp-world canvas{position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none}
.bp-layer{position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none}
.bp-pet{position:absolute;left:0;top:0;will-change:transform}
.bp-pet .sh{position:absolute;left:18%;right:18%;bottom:2%;height:12%;border-radius:50%;background:rgba(40,30,15,.22)}
.bp-pet.me .sh{box-shadow:0 0 0 3px rgba(245,200,66,.85)}
.bp-pet .fl{position:absolute;inset:0}
.bp-pet .bb{position:absolute;inset:0}
.bp-pet img{width:100%;height:100%;object-fit:contain;display:block;-webkit-user-drag:none}
.bp-pet.wet .bb{clip-path:inset(0 0 22% 0)}
.bp-pet .rip{display:none;position:absolute;left:8%;right:8%;bottom:16%;height:16%;border:3px solid rgba(255,255,255,.75);border-radius:50%;animation:bpRip 1.2s ease-in-out infinite}
.bp-pet.wet .rip{display:block}.bp-pet.wet .sh{display:none}
@keyframes bpRip{50%{transform:scale(1.08)}}
.bp-tag{position:absolute;left:0;top:0;display:flex;align-items:center;gap:4px;white-space:nowrap;background:rgba(255,255,255,.94);color:#2c2420;font:800 12px Inter,system-ui,sans-serif;padding:2px 9px 2px 3px;border-radius:99px;box-shadow:0 2px 6px rgba(0,0,0,.18);will-change:transform}
.bp-tag.me{box-shadow:0 0 0 2.5px #F5C842,0 2px 6px rgba(0,0,0,.18)}
.bp-tag .av{width:20px;height:20px;border-radius:50%;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;font-size:13px;flex:0 0 20px}
.bp-tag .av>*{transform:scale(.999)}
.bp-tag .ow{font-weight:600;color:#7a6c62;font-size:11px}
.bp-tag .bub{position:absolute;right:-30px;top:-20px;width:34px;height:34px;border-radius:50%;background:#fff;display:none;align-items:center;justify-content:center;font-size:19px;box-shadow:0 2px 6px rgba(0,0,0,.18)}
.bp-tag .bub.on{display:flex;animation:bpPop .25s ease-out}
@keyframes bpPop{from{transform:scale(.3)}to{transform:scale(1)}}
.bp-fx{position:absolute;left:0;top:0;pointer-events:none;will-change:transform,opacity}
.bp-up{animation:bpUp var(--d,1.6s) ease-out forwards;font-size:var(--s,22px)}
@keyframes bpUp{from{transform:translate(-50%,0);opacity:1}to{transform:translate(calc(-50% + var(--dx,0px)),-70px);opacity:0}}
.bp-dirt{width:var(--s,6px);height:var(--s,6px);border-radius:50%;background:#8b5e34;animation:bpDirt .7s cubic-bezier(.2,.6,.6,1) forwards}
@keyframes bpDirt{from{transform:translate(0,0)}60%{transform:translate(calc(var(--dx)*.7),var(--dy));opacity:1}to{transform:translate(var(--dx),20px);opacity:0}}
.bp-puff{width:var(--s,40px);height:var(--s,40px);border-radius:50%;background:rgba(245,238,226,.9);animation:bpPuff .8s ease-out forwards}
@keyframes bpPuff{from{transform:translate(-50%,-50%) scale(.5);opacity:.95}to{transform:translate(calc(-50% + var(--dx,0px)),calc(-50% + var(--dy,0px))) scale(1.5);opacity:0}}
.bp-spark{width:10px;height:10px;background:var(--c,#fff);clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);animation:bpDirt .9s ease-out forwards}
.bp-label{transform:translate(-50%,-50%);background:#fff;color:#2c2420;border:3px solid var(--c,#9aa3ad);border-radius:99px;padding:4px 12px;font:800 14px Inter,system-ui,sans-serif;white-space:nowrap;animation:bpLab var(--d,3s) ease-out forwards;box-shadow:0 4px 12px rgba(0,0,0,.2)}
@keyframes bpLab{0%{transform:translate(-50%,-30%) scale(.6);opacity:0}10%{transform:translate(-50%,-50%) scale(1.05);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-160%);opacity:0}}
.bp-ball{width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff9b9b,#e74c3c);box-shadow:0 2px 3px rgba(0,0,0,.25)}
.bp-chest{position:absolute;width:90px;height:80px;transform:translate(-50%,-80%);pointer-events:none}
.bp-chest .gl{position:absolute;inset:-60px;border-radius:50%;background:radial-gradient(circle,rgba(255,220,90,.6),rgba(255,220,90,0) 65%);animation:bpRip 1.4s infinite}
.bp-chest .bx{position:absolute;left:5px;right:5px;bottom:0;height:52px;background:#b8733a;border-radius:8px;animation:bpBounce .7s ease-in-out infinite}
.bp-chest .bx:before{content:'';position:absolute;left:-3px;right:-3px;top:-22px;height:26px;background:#9c5e2c;border-radius:14px 14px 4px 4px}
.bp-chest .bx:after{content:'';position:absolute;left:50%;top:-22px;width:12px;margin-left:-6px;bottom:0;background:#ffc93c;border-radius:3px}
.bp-chest .cd{position:absolute;left:50%;top:-34px;transform:translateX(-50%);background:#2c2420;color:#fff;font:800 12px Inter,system-ui,sans-serif;padding:2px 8px;border-radius:99px;white-space:nowrap}
@keyframes bpBounce{50%{transform:translateY(-8px)}}
.bp-glow{position:absolute;width:340px;height:340px;margin:-170px 0 0 -170px;border-radius:50%;background:radial-gradient(circle,rgba(255,214,120,.55),rgba(255,214,120,0) 65%);mix-blend-mode:screen;display:none}
.bp-stage.night .bp-glow{display:block}
.bp-ov{position:absolute;inset:0;pointer-events:none;display:none}
.bp-stage.night .bp-ov.n{display:block;background:rgba(14,22,66,.48)}
.bp-stage.rain .bp-ov.r{display:block;background:rgba(60,80,120,.16) repeating-linear-gradient(105deg,rgba(220,235,255,.0) 0 14px,rgba(220,235,255,.45) 14px 15px,rgba(220,235,255,0) 15px 34px);background-size:auto,60px 60px;animation:bpRain .5s linear infinite}
@keyframes bpRain{to{background-position:0 0,-14px 60px}}
.bp-stage.golden .bp-ov.g{display:block;background:rgba(255,185,60,.15);box-shadow:inset 0 0 90px rgba(255,190,60,.55)}
.bp-ff{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff27a;box-shadow:0 0 8px 3px rgba(255,240,120,.7);display:none;animation:bpFF 3s ease-in-out infinite alternate}
.bp-stage.night .bp-ff{display:block}
@keyframes bpFF{0%{opacity:.15;transform:translate(0,0)}100%{opacity:1;transform:translate(18px,-14px)}}
.bp-ui{position:absolute;z-index:5}
.bp-mm{right:10px;bottom:10px;border-radius:10px;box-shadow:0 0 0 3px rgba(255,255,255,.85),0 4px 12px rgba(0,0,0,.25);cursor:pointer;display:block}
.bp-hint{left:10px;bottom:10px;background:rgba(255,255,255,.9);color:#7a6c62;padding:4px 10px;border-radius:99px;font:700 11px Inter,system-ui,sans-serif;pointer-events:none}
.bp-toast{left:50%;top:12px;transform:translate(-50%,-14px);opacity:0;transition:.35s;background:#2c2420;color:#fff;padding:8px 14px;border-radius:12px;font:800 13px Inter,system-ui,sans-serif;pointer-events:none;text-align:center;max-width:86%}
.bp-toast.on{opacity:1;transform:translate(-50%,0)}.bp-toast.gold{background:linear-gradient(90deg,#E3A63E,#ff8a5b);color:#1b1206}
.bp-card{left:10px;top:10px;width:260px;max-width:calc(100% - 20px);background:var(--deep);color:var(--white);border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:none;cursor:default}
.bp-card .x{position:absolute;right:8px;top:4px;background:none;border:0;color:var(--muted);font-size:18px;cursor:pointer}
.bp-card .r{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px dashed var(--line)}
.bp-card .r span{color:var(--muted)}
.bp-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}
@media(max-width:900px){.bp-grid{grid-template-columns:minmax(0,1fr)}}
.bp-pets{display:grid;gap:8px}
.bp-mypet{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--line)}
.bp-mypet.sel{box-shadow:inset 0 0 0 2px var(--gold)}
.bp-mypet img{width:52px;height:52px;object-fit:contain}
.bp-mypet b{display:block;font-size:14px}.bp-mypet small{color:var(--muted);font-size:11.5px}
.bp-mypet .sp{flex:1;min-width:0}
.bp-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
.bp-acts .btn{justify-content:center}
.bp-hi{display:flex;gap:8px;margin-top:8px}.bp-hi select{flex:1;min-width:0}
.bp-meter{height:8px;border-radius:9px;background:var(--card-bg);overflow:hidden;margin-top:4px}.bp-meter i{display:block;height:100%;background:linear-gradient(90deg,var(--teal),var(--gold))}
.bp-status{margin-top:10px;padding:8px 10px;border-radius:10px;background:var(--card-bg);font-size:13px;font-weight:700}
.bp-tabs{display:flex;gap:6px;margin-bottom:10px}.bp-tabs button{all:unset;cursor:pointer;flex:1;text-align:center;padding:7px 4px;border-radius:10px;font-size:12.5px;font-weight:700;color:var(--muted);box-shadow:inset 0 0 0 1px var(--line)}
.bp-tabs button.on{background:var(--gold);color:#1b1206;box-shadow:none}
.bp-feed{list-style:none;margin:0;padding:0;max-height:340px;overflow:auto;font-size:13px}
.bp-feed li{padding:7px 2px;border-bottom:1px dashed var(--line);line-height:1.4}
.bp-feed li .t{color:var(--muted);font-size:11px;margin-right:6px}
.bp-feed li.hot{background:linear-gradient(90deg,rgba(227,166,62,.14),transparent);border-radius:8px;padding-left:6px}
.bp-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:12px;border:2px solid var(--line);margin-bottom:6px}
.bp-item .e{font-size:22px}.bp-item b{display:block;font-size:13px}.bp-item small{color:var(--muted);font-size:11px}
.bp-board h4{margin:10px 0 4px;font-size:13px}.bp-board ol{margin:0;padding-left:20px;font-size:13px}.bp-board li{padding:2px 0}
.bp-feats{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin-top:12px}
.bp-feat{background:var(--card-bg);border-radius:12px;padding:10px 12px;box-shadow:inset 0 0 0 1px var(--line)}
.bp-feat span{font-size:22px}.bp-feat b{display:block;margin:4px 0 2px}.bp-feat small{color:var(--muted);font-size:12px}
.bp-ribbon{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;border-radius:99px;background:rgba(63,191,174,.15);color:var(--teal);margin-bottom:6px}
.bpa-loot{width:100%;border-collapse:collapse;font-size:12.5px}
.bpa-loot th{text-align:left;font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;padding:4px}
.bpa-loot td{padding:3px 4px}.bpa-loot input,.bpa-loot select{width:100%;margin:0;padding:5px 6px;font-size:12.5px}
.bpa-loot .em{width:46px}.bpa-loot .num{width:70px}
.bpa-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin:10px 0}
.bpa-stats div{background:var(--card-bg);border-radius:10px;padding:8px 10px}.bpa-stats b{display:block;font-size:18px}.bpa-stats small{color:var(--muted);font-size:11px}
.bpa-ctl{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
`;
document.head.appendChild(css);

// ═════════════════════ SCENERY (painted once) ═════════════════════
const BG = document.createElement('canvas'), FG = document.createElement('canvas');
BG.width = FG.width = W; BG.height = FG.height = H;
(function paint(){
  const g = BG.getContext('2d'), R = mulberry(7);
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#b5e39a'); gr.addColorStop(1, '#93cf7c'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.07)'; for(let x = 0; x < W; x += 160) g.fillRect(x, 0, 80, H);
  const paths = () => { g.beginPath(); g.moveTo(0, 720); g.bezierCurveTo(500, 640, 800, 820, 1200, 740); g.bezierCurveTo(1600, 660, 1800, 560, 2400, 600); g.stroke();
    g.beginPath(); g.moveTo(1200, 740); g.bezierCurveTo(1180, 950, 1300, 1150, 1250, 1400); g.stroke(); g.beginPath(); g.moveTo(1340, 100); g.lineTo(1250, 720); g.stroke(); };
  g.lineCap = 'round'; g.strokeStyle = '#ecd6a8'; g.lineWidth = 86; paths(); g.strokeStyle = '#f5e4bf'; g.lineWidth = 60; paths();
  for(let i = 0; i < 260; i++){ g.fillStyle = 'rgba(200,170,120,.35)'; g.beginPath(); g.arc(R() * W, R() * H, 2, 0, 7); g.fill(); }
  for(let i = 0; i < 900; i++){ const x = R() * W, y = R() * H; g.strokeStyle = R() < .5 ? '#7fbf68' : '#8acb72'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y - 8); g.moveTo(x, y); g.lineTo(x + 3, y - 9); g.moveTo(x, y); g.lineTo(x, y - 10); g.stroke(); }
  const fc = ['#ff8fb1', '#fff', '#ffd84d', '#b49cff', '#ff9f6b'];
  for(let i = 0; i < 420; i++){ const x = R() * W, y = R() * H, c = fc[Math.floor(R() * fc.length)]; g.fillStyle = c; for(let k = 0; k < 5; k++){ g.beginPath(); g.arc(x + Math.cos(k * 1.26) * 4, y + Math.sin(k * 1.26) * 4, 3, 0, 7); g.fill(); } g.fillStyle = '#ffcf3a'; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); }
  g.fillStyle = '#d8c7a0'; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx + 14, POND.ry + 12, 0, 0, 7); g.fill();
  const pg = g.createRadialGradient(POND.x - 60, POND.y - 40, 20, POND.x, POND.y, POND.rx); pg.addColorStop(0, '#9fdcff'); pg.addColorStop(1, '#4fa7d8');
  g.fillStyle = pg; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 4; g.beginPath(); g.ellipse(POND.x - 80, POND.y - 60, 70, 14, -.1, 0, Math.PI); g.stroke();
  [[POND.x + 120, POND.y + 40], [POND.x - 150, POND.y + 50], [POND.x + 30, POND.y - 80]].forEach(([x, y]) => { g.fillStyle = '#5bb35a'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 22, .4, Math.PI * 2); g.fill(); g.fillStyle = '#ff9cc0'; g.beginPath(); g.arc(x + 6, y - 4, 6, 0, 7); g.fill(); });
  for(let i = 0; i < 18; i++){ const a = R() * 7; g.fillStyle = '#9a9a8f'; g.beginPath(); g.ellipse(POND.x + Math.cos(a) * (POND.rx + 12), POND.y + Math.sin(a) * (POND.ry + 10), 12, 8, 0, 0, 7); g.fill(); }
  g.fillStyle = '#b9824f'; rrect(g, SAND.x - 12, SAND.y - 12, SAND.w + 24, SAND.h + 24, 16); g.fill();
  g.fillStyle = '#f6dc9b'; rrect(g, SAND.x, SAND.y, SAND.w, SAND.h, 10); g.fill();
  for(let i = 0; i < 90; i++){ g.fillStyle = 'rgba(200,160,90,.35)'; g.beginPath(); g.arc(SAND.x + R() * SAND.w, SAND.y + R() * SAND.h, 2, 0, 7); g.fill(); }
  g.font = '38px serif'; g.fillText('🪣', SAND.x + 40, SAND.y + 70); g.fillText('🏰', SAND.x + 210, SAND.y + 150);
  TREES.forEach((t, i) => { g.fillStyle = 'rgba(40,70,30,.22)'; g.beginPath(); g.ellipse(t.x, t.y + 175, 150, 40, 0, 0, 7); g.fill();
    g.fillStyle = '#8a5a36'; rrect(g, t.x - 26, t.y, 52, 180, 14); g.fill();
    if(i === 0){ g.strokeStyle = '#6b4a2e'; g.lineWidth = 3; g.beginPath(); g.moveTo(t.x + 90, t.y + 40); g.lineTo(t.x + 90, t.y + 150); g.moveTo(t.x + 150, t.y + 40); g.lineTo(t.x + 150, t.y + 150); g.stroke(); g.fillStyle = '#c0392b'; rrect(g, t.x + 80, t.y + 148, 80, 12, 5); g.fill(); } });
  for(let i = 0; i < 26; i++){ const x = 150 + R() * (W - 300), y = 200 + R() * (H - 300); if(inPond(x, y)) continue; g.fillStyle = 'rgba(130,90,50,.35)'; g.beginPath(); g.ellipse(x, y, 22, 9, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(110,70,40,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 7, y - 4); g.lineTo(x + 7, y + 4); g.moveTo(x + 7, y - 4); g.lineTo(x - 7, y + 4); g.stroke(); }
  g.fillStyle = '#c98b5a'; rrect(g, STALL.x - 110, STALL.y, 220, 90, 10); g.fill(); g.fillStyle = '#ffe9c9'; rrect(g, STALL.x - 96, STALL.y + 12, 192, 30, 6); g.fill();
  g.font = '28px serif'; g.fillText('🍢', STALL.x - 80, STALL.y + 38); g.fillText('🍡', STALL.x - 20, STALL.y + 38); g.fillText('🥤', STALL.x + 40, STALL.y + 38);
  [[980, 600], [1500, 560], [560, 880], [1900, 1250]].forEach(([x, y]) => { g.fillStyle = '#a8703f'; rrect(g, x - 50, y, 100, 14, 5); g.fill(); rrect(g, x - 50, y - 18, 100, 10, 4); g.fill(); g.fillRect(x - 44, y + 14, 8, 16); g.fillRect(x + 36, y + 14, 8, 16); });
  LAMPS.forEach(l => { g.fillStyle = '#4a4a55'; g.fillRect(l.x - 4, l.y - 90, 8, 90); g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(l.x, l.y - 96, 13, 0, 7); g.fill(); g.fillStyle = '#4a4a55'; g.fillRect(l.x - 14, l.y - 112, 28, 6); });
  for(let i = 0; i < 30; i++){ const x = R() * W, y = R() * H; if(inPond(x, y) || (x > SAND.x - 60 && x < SAND.x + SAND.w + 60 && y > SAND.y - 60 && y < SAND.y + SAND.h + 60)) continue;
    for(let k = 0; k < 4; k++){ g.fillStyle = k % 2 ? '#5fae55' : '#6dbd60'; g.beginPath(); g.arc(x + (k - 1.5) * 20, y - (k % 2) * 10, 24, 0, 7); g.fill(); } if(R() < .5){ g.fillStyle = '#ff6b8a'; g.beginPath(); g.arc(x + 8, y - 14, 4, 0, 7); g.fill(); } }
  g.fillStyle = '#fff6e6'; g.strokeStyle = '#d9c3a3'; g.lineWidth = 2;
  for(let x = 0; x < W; x += 34){ rrect(g, x + 4, 80, 22, 62, 8); g.fill(); g.stroke(); } g.fillRect(0, 96, W, 10); g.fillRect(0, 124, W, 10);
  g.fillStyle = '#ff8a5b'; rrect(g, 10, 520, 26, 250, 8); g.fill(); rrect(g, 170, 520, 26, 250, 8); g.fill(); rrect(g, 0, 500, 206, 46, 14); g.fill();
  g.fillStyle = '#fff'; g.font = '900 24px Inter, system-ui'; g.textAlign = 'center'; g.fillText('BAYANI PARK', 103, 532); g.textAlign = 'left';
  const f = FG.getContext('2d');
  TREES.forEach(t => { [[0, -40, 130], [-90, 10, 95], [90, 10, 95], [-50, -110, 90], [60, -110, 90], [0, 40, 100]].forEach(([dx, dy, r], k) => { f.fillStyle = k % 2 ? '#4f9e4a' : '#5cae54'; f.beginPath(); f.arc(t.x + dx, t.y + dy, r, 0, 7); f.fill(); });
    f.fillStyle = 'rgba(255,255,255,.12)'; f.beginPath(); f.arc(t.x - 40, t.y - 90, 50, 0, 7); f.fill();
    for(let k = 0; k < 6; k++){ f.fillStyle = '#ff6b6b'; f.beginPath(); f.arc(t.x + Math.cos(k * 1.1) * 90, t.y - 30 + Math.sin(k * 1.7) * 70, 8, 0, 7); f.fill(); } });
  for(let i = 0; i < 8; i++){ f.fillStyle = i % 2 ? '#fff' : '#ff7a8a'; f.beginPath(); f.moveTo(STALL.x - 130 + i * 32.5, STALL.y - 50); f.lineTo(STALL.x - 130 + (i + 1) * 32.5, STALL.y - 50); f.lineTo(STALL.x - 130 + (i + 1) * 32.5, STALL.y - 10); f.arc(STALL.x - 130 + i * 32.5 + 16.25, STALL.y - 10, 16.25, 0, Math.PI); f.closePath(); f.fill(); }
  f.fillStyle = '#8a5a36'; f.fillRect(STALL.x - 118, STALL.y - 50, 8, 140); f.fillRect(STALL.x + 110, STALL.y - 50, 8, 140);
  f.fillStyle = '#2c2420'; rrect(f, STALL.x - 80, STALL.y - 90, 160, 36, 10); f.fill(); f.fillStyle = '#fff'; f.font = '900 20px Inter, system-ui'; f.textAlign = 'center'; f.fillText('Kain Tayo!', STALL.x, STALL.y - 65);
})();

// ═════════════════════ PARK RENDERER (used by player page + admin live view) ═════════════════════
const MOUNTS = [];
class Park {
  constructor(host, opts){
    this.opts = opts || {}; this.pets = new Map(); this.names = {}; this.queue = []; this.inters = []; this.base = null; this.chest = null;
    this.cam = { x:0, y:300 }; this.camT = null; this.follow = null; this.lastStart = 0; this.state = null;
    host.innerHTML = `<div class="bp-stage"><div class="bp-world"><canvas class="bg"></canvas><div class="bp-layer lamps"></div><div class="bp-layer pets"></div>
        <canvas class="fg"></canvas><div class="bp-layer ffs"></div><div class="bp-layer fx"></div><div class="bp-layer tags"></div></div>
      <div class="bp-ov n"></div><div class="bp-ov r"></div><div class="bp-ov g"></div>
      <canvas class="bp-ui bp-mm"></canvas><div class="bp-ui bp-hint">🖐️ Drag to explore · tap a pet</div><div class="bp-ui bp-toast"></div><div class="bp-ui bp-card"></div></div>`;
    this.stage = host.querySelector('.bp-stage'); this.world = host.querySelector('.bp-world');
    host.querySelector('canvas.bg').width = W; host.querySelector('canvas.bg').height = H; host.querySelector('canvas.bg').getContext('2d').drawImage(BG, 0, 0);
    host.querySelector('canvas.fg').width = W; host.querySelector('canvas.fg').height = H; host.querySelector('canvas.fg').getContext('2d').drawImage(FG, 0, 0);
    this.L = { pets:host.querySelector('.pets'), fx:host.querySelector('.fx'), tags:host.querySelector('.tags') };
    host.querySelector('.lamps').innerHTML = LAMPS.map(l => `<div class="bp-glow" style="left:${l.x}px;top:${l.y - 40}px"></div>`).join('');
    const R = mulberry(3); host.querySelector('.ffs').innerHTML = Array.from({ length:50 }, () => `<div class="bp-ff" style="left:${R() * W}px;top:${150 + R() * (H - 150)}px;animation-delay:${(R() * 3).toFixed(2)}s"></div>`).join('');
    this.mm = host.querySelector('.bp-mm'); this.card = host.querySelector('.bp-card'); this.toastEl = host.querySelector('.bp-toast');
    this.bindInput(); MOUNTS.push(this);
  }
  destroy(){ const i = MOUNTS.indexOf(this); if(i >= 0) MOUNTS.splice(i, 1); }
  visible(){ return this.stage.isConnected && this.stage.offsetParent !== null; }

  // ── input: drag to pan, tap a pet, tap the minimap ──
  bindInput(){
    let drag = null;
    this.stage.addEventListener('pointerdown', e => {
      if(e.target.closest('.bp-card')) return;
      if(e.target === this.mm){ const r = this.mm.getBoundingClientRect(); this.follow = null;
        this.camT = { x:(e.clientX - r.left) / r.width * W - this.vw / 2, y:(e.clientY - r.top) / r.height * H - this.vh / 2 }; return; }
      drag = { x:e.clientX, y:e.clientY, cx:this.cam.x, cy:this.cam.y, moved:false }; this.stage.setPointerCapture(e.pointerId);
    });
    this.stage.addEventListener('pointermove', e => { if(!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if(!drag.moved && Math.hypot(dx, dy) > 6){ drag.moved = true; this.follow = null; this.camT = null; if(this.opts.onFollow) this.opts.onFollow(null); }
      if(drag.moved){ this.cam.x = drag.cx - dx; this.cam.y = drag.cy - dy; this.clampCam(); } });
    this.stage.addEventListener('pointerup', e => {
      if(drag && !drag.moved){ const r = this.stage.getBoundingClientRect(), x = e.clientX - r.left + this.cam.x, y = e.clientY - r.top + this.cam.y;
        const hit = [...this.pets.values()].sort((a, b) => b.y - a.y).find(p => Math.abs(p.x - x) < p.s * .4 && y < p.y && y > p.y - p.s * .85);
        if(hit){ this.showCard(hit); this.say(hit, pick(['😊', '💖', '👋', '😆']), 1.4); } else this.card.style.display = 'none'; }
      drag = null; });
  }
  clampCam(){ if(!(this.vw > 0)){ const r = this.stage.getBoundingClientRect(); this.vw = r.width || 800; this.vh = r.height || 500; }
    if(!isFinite(this.cam.x)) this.cam.x = 0; if(!isFinite(this.cam.y)) this.cam.y = 0;
    this.cam.x = clamp(this.cam.x, 0, Math.max(0, W - this.vw)); this.cam.y = clamp(this.cam.y, 0, Math.max(0, H - this.vh)); }
  centerOn(x, y){ this.clampCam(); this.camT = { x:x - this.vw / 2, y:y - this.vh / 2 }; }
  toast(t, gold){ this.toastEl.textContent = t; this.toastEl.className = 'bp-ui bp-toast on' + (gold ? ' gold' : ''); clearTimeout(this._tt); this._tt = setTimeout(() => this.toastEl.className = 'bp-ui bp-toast', 3400); }
  showCard(p){
    const d = p.d, bonds = (d.bonds || []).map(b => `${esc(this.names[b.pet] || 'a pet')}${b.label ? ' · <b>' + (b.label === 'Sweethearts' ? '💞' : '🤝') + ' ' + esc(b.label) + '</b>' : ''}`);
    this.card.innerHTML = `<button class="x" onclick="this.parentNode.style.display='none'">×</button>
      <div style="font-size:16px;font-weight:800">${spEmoji(d.species)} ${esc(d.name)}${p.mine ? ' ⭐' : ''}</div>
      <div style="color:var(--muted);font-size:12px;margin-bottom:6px">${p.mine ? 'Your pet' : 'Owned by ' + esc(d.playerName || 'someone')} · ${d.evolved ? '👑 Adult' : '🐣 Baby'} ${esc(spName(d.species))} · Lv ${d.level || 1}</div>
      <div class="r"><span>Trait</span><b>${esc(d.trait || '')}</b></div><div style="font-size:11px;color:var(--muted);padding:2px 0 4px">${esc(TRAIT[d.trait] || '')}</div>
      <div class="r"><span>Finds tonight</span><b>${d.finds || 0}</b></div><div class="r"><span>Play fights won</span><b>${d.wins || 0}</b></div>
      <div style="margin-top:6px"><span style="color:var(--muted)">Friends:</span> ${bonds.length ? bonds.join(', ') : 'none yet'}</div>
      ${this.opts.cardExtra ? this.opts.cardExtra(d) : ''}`;
    this.card.style.display = 'block';
  }

  // ── data from the server ──
  setState(st, fresh){
    this.state = st;
    const roster = st.roster || [], ids = new Set(roster.map(r => r.petId));
    roster.forEach(r => this.names[r.petId] = r.name);
    for(const [id, p] of this.pets) if(!ids.has(id)){ this.poof(p); this.pets.delete(id); }
    roster.forEach(r => { const p = this.pets.get(r.petId); if(p){ p.d = r; p.mine = this.isMine(r); p.el.classList.toggle('me', p.mine); p.tag.classList.toggle('me', p.mine); } else this.addPet(r, fresh && this.base !== null); });
    this.stage.classList.toggle('night', st.weather === 'night'); this.stage.classList.toggle('rain', st.weather === 'rain');
    this.stage.classList.toggle('golden', !!(st.golden && new Date(st.golden) > Date.now()));
    this.syncChest(st.chest);
    const evs = st.events || [];
    if(this.base === null){ this.base = st.since || 0; }
    else evs.filter(e => e.id > this.base).forEach(e => { this.queue.push({ e, t:performance.now() }); this.base = Math.max(this.base, e.id); });
    if(this.queue.length > 16) this.queue = this.queue.slice(-16);
  }
  isMine(r){ const m = me(); return !this.opts.admin && !!m && r.playerId === m.id; }
  addPet(r, viaGate){
    const s = r.evolved ? 132 : 104, R = mulberry(hash(r.petId)); let x, y;
    do { x = 160 + R() * (W - 320); y = 260 + R() * (H - 380); } while(inPond(x, y));
    if(viaGate){ x = GATE.x; y = GATE.y; }
    const el = document.createElement('div'); el.className = 'bp-pet'; el.style.width = el.style.height = s + 'px';
    const f = typeof pgFilter === 'function' ? pgFilter(r.gear || {}) : { style:'', rainbow:false };
    el.innerHTML = `<div class="sh"></div><div class="rip"></div><div class="fl"><div class="bb${f.rainbow ? ' pg-rainbow' : ''}"><img src="${imgSrc(r)}" alt="" draggable="false" ${f.style ? `style="filter:${f.style}"` : ''} onerror="this.onerror=null;this.src='baby_${esc(r.species)}.gif'"></div></div>`;
    const tag = document.createElement('div'); tag.className = 'bp-tag';
    let av = spEmoji(r.species); try { if(typeof avatarHtml === 'function' && r.playerId && !String(r.playerId).startsWith('demo')) av = avatarHtml(r.playerId, 20, false); } catch(e){}
    tag.innerHTML = `<span class="av">${av}</span>${esc(r.name)}${this.opts.admin ? ` <span class="ow">· ${esc(r.playerName || '')}</span>` : ''}<span class="bub"></span>`;
    this.L.pets.appendChild(el); this.L.tags.appendChild(tag);
    const p = { id:r.petId, d:r, el, tag, bub:tag.querySelector('.bub'), fl:el.querySelector('.fl'), bb:el.querySelector('.bb'), s, x, y, tx:x, ty:y,
      state:'idle', timer:rand(0, 2), dir:R() < .5 ? 1 : -1, phase:R() * 10, speed:rand(55, 80), bubT:0, hop:0, mine:this.isMine(r), busy:false };
    el.classList.toggle('me', p.mine); tag.classList.toggle('me', p.mine);
    this.pets.set(r.petId, p);
    if(viaGate){ p.tx = 420; p.ty = 760; p.state = 'wander'; this.say(p, '🥳', 3); }
    return p;
  }
  poof(p){ for(let i = 0; i < 6; i++) this.fx('bp-puff', p.x + rand(-30, 30), p.y - rand(10, 60), { '--s':rand(30, 50) + 'px', '--dx':rand(-30, 30) + 'px', '--dy':rand(-30, 0) + 'px' }, '', 900);
    p.el.remove(); p.tag.remove(); }
  syncChest(c){
    if(!c){ if(this.chest){ this.chest.el.remove(); this.chest = null; this.pets.forEach(p => { if(p.state === 'race'){ p.state = 'idle'; p.timer = 1; } }); } return; }
    if(this.chest && this.chest.id === c.id){ this.chest.ends = new Date(c.ends).getTime(); return; }
    if(this.chest) this.chest.el.remove();
    const el = document.createElement('div'); el.className = 'bp-chest'; el.innerHTML = '<div class="gl"></div><div class="bx"></div><div class="cd"></div>';
    const x = c.fx * W, y = c.fy * H; el.style.left = x + 'px'; el.style.top = y + 'px'; this.L.pets.appendChild(el); el.style.zIndex = Math.round(y);
    this.chest = { id:c.id, x, y, el, cd:el.querySelector('.cd'), ends:new Date(c.ends).getTime() };
    this.pets.forEach(p => { if(!p.busy) this.toChest(p); });
  }
  toChest(p){ if(!this.chest) return; const a = rand(0, 7), r = rand(70, 150); p.state = 'race'; p.tx = this.chest.x + Math.cos(a) * r; p.ty = this.chest.y + Math.sin(a) * r * .5 + 30; }

  // ── particles ──
  fx(cls, x, y, vars, html, ms){ const d = document.createElement('div'); d.className = 'bp-fx ' + cls; d.style.left = x + 'px'; d.style.top = y + 'px';
    if(vars) for(const k in vars) d.style.setProperty(k, vars[k]); if(html) d.innerHTML = html; this.L.fx.appendChild(d); setTimeout(() => d.remove(), ms || 2000); return d; }
  emo(ch, x, y, size, dur){ this.fx('bp-up', x, y, { '--s':(size || 22) + 'px', '--d':(dur || 1.6) + 's', '--dx':rand(-20, 20) + 'px' }, ch, (dur || 1.6) * 1000 + 100); }
  label(text, x, y, col, dur){ this.fx('bp-label', x, y, { '--c':col || '#9aa3ad', '--d':(dur || 3) + 's' }, esc(text), (dur || 3) * 1000 + 100); }
  say(p, e, t){ p.bub.textContent = e; p.bub.classList.add('on'); p.bubT = t || 2.2; }

  // ── events → animations ──
  startEvent(e){
    const A = this.pets.get(e.a), B = this.pets.get(e.b), d = e.data || {};
    switch(e.kind){
      case 'find': if(!A) return true; if(A.busy) return false;
        A.busy = true; A.state = 'dig'; A.timer = 2.2; A.item = d.item; this.say(A, d.src === 'nap' ? '💤' : '👃', 1.6); return true;
      case 'play': case 'fight': case 'flirt': if(!A || !B) return true; if(A.busy || B.busy) return false; this.meet(A, B, e.kind, d.winner); return true;
      case 'couple': if(A && B){ const t = d.label === 'Sweethearts' ? 'Sweethearts 💞' : 'Besties 🤝'; this.label(t, (A.x + B.x) / 2, Math.min(A.y, B.y) - 150, '#ff5f8f', 3.4);
        for(let i = 0; i < 8; i++) this.emo(pick(['💕', '💖', '✨']), (A.x + B.x) / 2 + rand(-60, 60), Math.min(A.y, B.y) - rand(60, 120), 22, 1.8); } return true;
      case 'chest_win': if(!A) return true; A.busy = true; A.state = 'grab'; A.item = d.item;
        if(this.chest){ A.tx = this.chest.x; A.ty = this.chest.y + 10; } else { A.tx = A.x; A.ty = A.y; } return true;
      case 'boost': (d.pets || []).forEach(id => { const p = this.pets.get(id); if(p){ p.boost = true; this.say(p, '⚡', 2); this.emo('💨', p.x, p.y - 20, 26); } }); return true;
      case 'golden': this.toast('✨ Golden Hour! Finds are doubled.', true); return true;
      case 'chest_drop': this.toast('🎁 A Treasure Chest dropped! Pets are racing!'); if(this.chest) this.centerOn(this.chest.x, this.chest.y); return true;
      case 'join': if(A){ this.say(A, '🥳', 3); } return true;
    }
    return true;
  }
  meet(A, B, kind, winner){
    const cx = clamp((A.x + B.x) / 2, 200, W - 200), cy = clamp((A.y + B.y) / 2, 280, H - 120);
    const I = { A, B, kind, winner, cx, cy, t:0, started:false };
    A.busy = B.busy = true; A.state = B.state = 'meet'; A.inter = B.inter = I;
    A.mx = cx - 70; A.my = cy; B.mx = cx + 70; B.my = cy; A.ready = B.ready = false; this.say(A, '👀', 1.4); this.inters.push(I);
  }
  endInter(I){
    this.inters.splice(this.inters.indexOf(I), 1); const { A, B } = I;
    if(I.kind === 'fight'){ const w = this.pets.get(I.winner) || A, l = w === A ? B : A; this.say(w, '😎', 2.6); this.say(l, '😵‍💫', 2.6); this.label('🏅 Brave!', w.x, w.y - w.s - 20, '#ff8a5b', 2.4); }
    else if(I.kind === 'play'){ this.say(A, '🥰'); this.say(B, '😆'); if(I.ball){ I.ball.remove(); } }
    else { this.say(A, '💕', 2.6); this.say(B, '☺️', 2.6); }
    [A, B].forEach(p => { p.busy = false; p.inter = null; p.state = 'idle'; p.timer = rand(1, 2); if(this.chest) this.toChest(p); });
  }

  // ── per-frame update ──
  tick(dt, now){
    const r = this.stage.getBoundingClientRect(); this.vw = r.width; this.vh = r.height;
    // event queue
    if(this.queue.length && now - this.lastStart > 650){
      for(let i = 0; i < this.queue.length; i++){ const q = this.queue[i];
        if(this.startEvent(q.e) || now - q.t > 15000){ this.queue.splice(i, 1); this.lastStart = now; if(this.opts.onEvent) this.opts.onEvent(q.e, this); break; } }
    }
    const night = this.stage.classList.contains('night');
    for(const p of this.pets.values()) this.updatePet(p, dt, night);
    for(const I of [...this.inters]) this.updateInter(I, dt);
    if(this.chest){ const s = Math.max(0, Math.ceil((this.chest.ends - Date.now()) / 1000)); this.chest.cd.textContent = s > 0 ? `🎁 ${s}s` : '🎁 Opening…';
      if(Math.random() < .15) this.fx('bp-spark', this.chest.x + rand(-40, 40), this.chest.y - rand(30, 80), { '--c':'#ffd84d', '--dx':rand(-20, 20) + 'px', '--dy':'-30px' }, '', 900); }
    // camera
    if(this.follow){ const p = this.pets.get(this.follow); if(p) this.camT = { x:p.x - this.vw / 2, y:p.y - p.s / 2 - this.vh / 2 }; }
    if(this.camT){ this.cam.x += (this.camT.x - this.cam.x) * Math.min(1, dt * 4); this.cam.y += (this.camT.y - this.cam.y) * Math.min(1, dt * 4); this.clampCam();
      if(!this.follow && Math.abs(this.camT.x - this.cam.x) < 2 && Math.abs(this.camT.y - this.cam.y) < 2) this.camT = null; }
    this.clampCam();
    this.world.style.transform = `translate3d(${-Math.round(this.cam.x)}px,${-Math.round(this.cam.y)}px,0)`;
    // draw pets
    for(const p of this.pets.values()){
      let bob = p.moving ? -Math.abs(Math.sin(p.phase * 9)) * 8 : p.state === 'sleep' ? 0 : Math.sin(p.phase * 2.2) * 1.5, rot = 0, sy = 1;
      if(p.hop > 0) bob -= Math.sin(p.hop / .4 * Math.PI) * 18;
      if(p.state === 'dig'){ bob = Math.sin(p.phase * 22) * 3; rot = 10; }
      if(p.state === 'sleep') sy = .9;
      p.el.style.transform = `translate3d(${p.x - p.s / 2}px,${p.y - p.s}px,0)`; p.el.style.zIndex = Math.round(p.y);
      p.fl.style.transform = `scaleX(${p.dir})`;
      p.bb.style.transform = `translateY(${bob}px) rotate(${rot}deg) scaleY(${sy})`; p.bb.style.transformOrigin = '50% 100%';
      const wet = inPond(p.x, p.y); if(wet !== p.wet){ p.wet = wet; p.el.classList.toggle('wet', wet); }
      p.tag.style.transform = `translate3d(${p.x}px,${p.y - p.s * .92 + (wet ? p.s * .2 : 0)}px,0) translateX(-50%)`; p.tag.style.zIndex = Math.round(p.y);
      if(p.bubT > 0){ p.bubT -= dt; if(p.bubT <= 0) p.bub.classList.remove('on'); }
    }
    this.drawMinimap();
  }
  move(p, tx, ty, sp, dt){ const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy); if(d < 4) return true;
    const s = Math.min(d, sp * dt); p.x += dx / d * s; p.y += dy / d * s; if(Math.abs(dx) > 3) p.dir = dx > 0 ? 1 : -1; p.moving = true; return false; }
  wanderTarget(p){ let x, y, n = 0; do { x = clamp(p.x + rand(-650, 650), 110, W - 110); y = clamp(p.y + rand(-420, 420), 210, H - 80); n++; } while(inPond(x, y) && Math.random() < .75 && n < 6);
    p.tx = x; p.ty = y; p.state = 'wander'; }
  updatePet(p, dt, night){
    p.phase += dt; p.moving = false; if(p.hop > 0) p.hop -= dt;
    const sp = p.speed * (night ? .8 : 1) * (p.boost ? 1.6 : 1);
    switch(p.state){
      case 'wander': if(this.move(p, p.tx, p.ty, sp, dt)){ const lazy = p.d.trait === 'Lazy';
          const r = Math.random(); if(r < (lazy ? .2 : .07) * (night ? 2 : 1)){ const t = pick(TREES); p.tx = t.x + rand(-110, 110); p.ty = t.y + rand(200, 240); p.state = 'gosleep'; }
          else if(r < .45){ p.state = 'idle'; p.timer = rand(1, 3); if(Math.random() < .5) this.say(p, pick(['😊', '🌸', '🎵', '🤔', '😋']), 1.8); } else this.wanderTarget(p); }
        else if(Math.random() < dt * .05) this.say(p, inPond(p.x, p.y) ? '💦' : this.stage.classList.contains('rain') ? '☔' : night ? '🌙' : pick(['🎵', '🌸', '😊', '✨', '🦋']), 1.8);
        break;
      case 'idle': p.timer -= dt; if(p.timer <= 0) this.wanderTarget(p); break;
      case 'gosleep': if(this.move(p, p.tx, p.ty, sp * .8, dt)){ p.state = 'sleep'; p.timer = rand(6, 12); } break;
      case 'sleep': p.timer -= dt; if(Math.random() < dt * 1.2) this.emo('💤', p.x + p.s * .25, p.y - p.s * .7, 18, 1.8); if(p.timer <= 0){ this.say(p, '🥱'); this.wanderTarget(p); } break;
      case 'dig': p.timer -= dt;
        if(Math.random() < dt * 16) this.fx('bp-dirt', p.x + p.dir * p.s * .25, p.y - 10, { '--dx':(rand(-60, 60) - p.dir * 30) + 'px', '--dy':rand(-70, -30) + 'px', '--s':rand(4, 8) + 'px' }, '', 800);
        if(p.timer <= 0){ this.reveal(p, p.item); p.busy = false; p.state = 'idle'; p.timer = 1.4; if(this.chest) this.toChest(p); } break;
      case 'grab': if(this.move(p, p.tx, p.ty, sp * 4, dt)){ this.reveal(p, p.item, true); p.busy = false; p.state = 'idle'; p.timer = 2;
          for(let i = 0; i < 18; i++) this.fx('bp-spark', p.x, p.y - 40, { '--c':pick(['#ffd84d', '#ff7aa0', '#7cc4ff']), '--dx':rand(-120, 120) + 'px', '--dy':rand(-120, -30) + 'px' }, '', 1000);
          this.pets.forEach(q => { q.boost = false; if(q !== p && q.state === 'race'){ q.state = 'idle'; q.timer = rand(1, 2); this.say(q, pick(['😭', '😩', '🥲'])); } }); this.say(p, '🥳', 3); } break;
      case 'meet': if(this.move(p, p.mx, p.my, sp * 1.4, dt)) p.ready = true; break;
      case 'race': if(this.move(p, p.tx, p.ty, sp * 2, dt)){ p.state = 'cheer'; p.dir = this.chest && this.chest.x > p.x ? 1 : -1; } break;
      case 'cheer': if(!this.chest){ p.state = 'idle'; p.timer = 1; } else if(Math.random() < dt * .6){ p.hop = .4; if(Math.random() < .4) this.say(p, pick(['🤩', '😤', '🎁']), 1.2); } break;
    }
  }
  updateInter(I, dt){
    const { A, B } = I; I.t += dt;
    if(!I.started){ if(A.ready && B.ready){ I.started = true; I.t = 0; I.dur = I.kind === 'play' ? 4.6 : I.kind === 'fight' ? 3.4 : 3.8; A.state = B.state = 'inter';
        if(I.kind === 'play'){ this.say(A, '😆'); this.say(B, '🎾'); I.ball = this.fx('bp-ball', I.cx, I.cy, null, '', 6000); }
        else if(I.kind === 'fight'){ this.say(A, '😤'); this.say(B, '😠'); } else { this.say(A, '😳'); this.say(B, '☺️'); } }
      else { if(A.ready) A.dir = 1; if(B.ready) B.dir = -1; if(I.t > 14){ this.inters.splice(this.inters.indexOf(I), 1); [A, B].forEach(p => { p.busy = false; p.inter = null; p.state = 'idle'; p.timer = 1; }); } }
      return; }
    const { cx, cy } = I;
    if(I.kind === 'play'){ const a = I.t * 2.6; A.x = cx + Math.cos(a) * 95; A.y = cy + Math.sin(a) * 42; B.x = cx + Math.cos(a - 1) * 95; B.y = cy + Math.sin(a - 1) * 42;
      A.dir = B.dir = -Math.sin(a) > 0 ? 1 : -1; A.moving = B.moving = true; if(I.ball) I.ball.style.transform = `translate(-50%,${-Math.abs(Math.sin(I.t * 6)) * 50 - 30}px)`; }
    else if(I.kind === 'fight'){ A.x = cx - 34 + rand(-9, 9); B.x = cx + 34 + rand(-9, 9); A.y = cy + rand(-5, 5); B.y = cy + rand(-5, 5); A.dir = 1; B.dir = -1; A.moving = B.moving = true;
      if(Math.random() < dt * 20) this.fx('bp-puff', cx + rand(-80, 80), cy - rand(10, 90), { '--s':rand(30, 50) + 'px', '--dx':rand(-30, 30) + 'px', '--dy':rand(-30, 0) + 'px' }, '', 900);
      if(Math.random() < dt * 5) this.emo(pick(['💥', '⭐', '💫', '🌀']), cx + rand(-60, 60), cy - rand(60, 130), rand(20, 28), .9); }
    else { A.x += (cx - 58 - A.x) * .1; B.x += (cx + 58 - B.x) * .1; A.dir = 1; B.dir = -1;
      if(A.hop <= 0 && Math.random() < dt * 1.4) A.hop = .4; if(B.hop <= 0 && Math.random() < dt * 1.4) B.hop = .4;
      if(Math.random() < dt * 4) this.emo(pick(['💕', '💗', '💖', '❤️']), cx + rand(-30, 30), cy - A.s * .8, rand(18, 26), 1.6); }
    if(I.t > I.dur) this.endInter(I);
  }
  reveal(p, it, chest){
    if(!it) return; const col = TIER[it.tier] || TIER.common;
    this.say(p, '🤩', 2.4); this.label(`${it.emoji || '🎁'} ${it.label}${it.kind === 'tokens' ? ` +${it.amount || 1}🪙` : ''}`, p.x, p.y - p.s - 30, col, chest ? 3.6 : 3);
    for(let i = 0; i < (it.tier === 'common' ? 6 : 16); i++) this.fx('bp-spark', p.x + rand(-30, 30), p.y - rand(20, 80), { '--c':col, '--dx':rand(-70, 70) + 'px', '--dy':rand(-100, -20) + 'px' }, '', 1000);
    if(it.tier === 'legendary') this.toast(`🌟 LEGENDARY! ${p.d.name} found ${it.emoji} ${it.label}!`, true);
  }
  drawMinimap(){
    const mw = Math.round(Math.min(180, this.vw * .3)), mh = Math.round(mw * H / W);
    if(this.mm.width !== mw){ this.mm.width = mw; this.mm.height = mh; this.mm.style.width = mw + 'px'; this.mm.style.height = mh + 'px'; }
    const c = this.mm.getContext('2d'); c.drawImage(BG, 0, 0, W, H, 0, 0, mw, mh);
    for(const p of this.pets.values()){ c.fillStyle = p.mine ? '#F5C842' : '#ff5f8f'; c.beginPath(); c.arc(p.x / W * mw, p.y / H * mh, p.mine ? 4.5 : 3, 0, 7); c.fill(); }
    if(this.chest){ c.fillStyle = '#ffb300'; c.fillRect(this.chest.x / W * mw - 4, this.chest.y / H * mh - 4, 8, 8); }
    c.strokeStyle = '#2c2420'; c.lineWidth = 2; c.strokeRect(this.cam.x / W * mw, this.cam.y / H * mh, this.vw / W * mw, this.vh / H * mh);
  }
}
let _last = performance.now();
function frame(t){
  const dt = Math.min(.05, (t - _last) / 1000); _last = t;
  for(const m of MOUNTS){ if(m.visible()){ try { m.tick(dt, t); } catch(e){ console.error(e); } } }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ═════════════════════ FEED TEXT ═════════════════════
function itemText(it){ if(!it) return 'something'; const extra = it.kind === 'tokens' ? ` (+${it.amount || 1} 🪙)` : it.kind === 'voucher' ? ' (voucher)' : '';
  const tag = it.tier && it.tier !== 'common' ? ` <span style="color:${TIER[it.tier]};font-weight:800">${it.tier.toUpperCase()}</span>` : '';
  return `${it.emoji || '🎁'} <b>${esc(it.label)}</b>${extra}${tag}`; }
function evText(e, names, owners){
  const n = id => `<b>${esc(names[id] || 'A pet')}</b>`, d = e.data || {};
  switch(e.kind){
    case 'join': return `🎟️ ${n(e.a)} entered the park${owners[e.a] ? ` <span style="color:var(--muted)">(${esc(owners[e.a])})</span>` : ''}`;
    case 'leave': return `👋 ${n(e.a)} left the park`;
    case 'find': return `${d.src === 'nap' ? '😴' : d.src === 'dig' ? '⛏️' : '🐾'} ${n(e.a)} ${d.src === 'nap' ? 'found something while napping:' : 'dug up'} ${itemText(d.item)}`;
    case 'play': return `🎾 ${n(e.a)} and ${n(e.b)} played tag${d.by ? ' 👋' : ''}`;
    case 'fight': { const w = d.winner === e.b ? e.b : e.a, l = w === e.a ? e.b : e.a; return `💥 ${n(w)} won a play fight vs ${n(l)}. Brave badge! <span style="color:var(--muted)">(nobody gets hurt)</span>`; }
    case 'flirt': return `💕 ${n(e.a)} is flirting with ${n(e.b)}… ayiee!`;
    case 'couple': return `✨ ${n(e.a)} & ${n(e.b)} are now <b>${d.label === 'Sweethearts' ? 'Sweethearts 💞' : 'Besties 🤝'}</b>!`;
    case 'chest_drop': return '🎁 A <b>Treasure Chest</b> dropped! Every pet is racing to it.';
    case 'chest_win': return `🏆 ${n(e.a)} won the Treasure Chest: ${itemText(d.item)}${d.boosted ? ' ⚡' : ''}`;
    case 'chest_gone': return '🎁 The chest vanished. Nobody was around!';
    case 'boost': return `⚡ ${n(e.a)} got a speed boost for the chest`;
    case 'golden': return `✨ <b>Golden Hour!</b> Finds are x${d.mult || 2} for a while.`;
    case 'golden_end': return '✨ Golden Hour is over.';
  }
  return esc(e.kind);
}
const HOT = new Set(['couple', 'chest_win', 'chest_drop', 'golden']);

// ═════════════════════ DEMO (preview + admin before the backend is live) ═════════════════════
const DEMO_NAMES = ['Bantay', 'Mingming', 'Lumpia', 'Choco', 'Ube', 'Pandesal', 'Tisoy', 'Siopao', 'Kape', 'Puto', 'Turon', 'Mangga', 'Bibingka', 'Kalamansi'];
function demoState(){
  const traits = Object.keys(TRAIT);
  return { ok:true, status:'soon', demo:true, weather:'day', since:0, events:[], roster:DEMO_NAMES.map((n, i) => ({ petId:'demo' + i, playerId:'demo', playerName:'Sample', name:n,
    species:SPECIES[i % SPECIES.length], evolved:i % 3 !== 2, level:10 + i * 2, trait:traits[i % 5], gear:{}, finds:0, wins:0, bonds:[] })) };
}
const DEMO_LOOT = [['🪙', 'Lucky Coin', 'common', 'tokens', 1], ['🍖', 'Pet Snack', 'common', 'collectible'], ['🦴', 'Shiny Bone', 'common', 'collectible'], ['💰', 'Coin Pouch', 'rare', 'tokens', 3],
  ['🎡', 'Free Spin', 'rare', 'voucher'], ['🐾', 'Pet Care Pack', 'rare', 'voucher'], ['🎟️', 'Free BINGO Card', 'epic', 'voucher'], ['👑', 'Golden Bone', 'legendary', 'tokens', 25]];
function demoTick(park){
  if(!park || !park.state || !park.state.demo || !park.visible()) return;
  const ids = [...park.pets.keys()]; if(ids.length < 2) return;
  const id = ++park.base, r = Math.random(), a = pick(ids); let b = pick(ids); while(b === a) b = pick(ids);
  const L = Math.random() < .06 ? DEMO_LOOT[7] : pick(DEMO_LOOT.slice(0, 7));
  const e = r < .45 ? { id, kind:'find', a, data:{ src:'auto', item:{ emoji:L[0], label:L[1], tier:L[2], kind:L[3], amount:L[4] || 1 } } }
    : { id, kind:pick(['play', 'fight', 'flirt', 'flirt']), a, b, data:{ winner:Math.random() < .5 ? a : b } };
  park.queue.push({ e, t:performance.now() });
}
setInterval(() => { MOUNTS.forEach(demoTick); }, 2600);

// ═════════════════════ PLAYER SIDE ═════════════════════
GP_TITLES.park = 'Bayani Park';
const PK = { data:null, err:'', since:0, at:0, busy:false, msg:'', ok:true, tab:'feed', sel:null, park:null, mode:null, feed:[], fetching:false };

async function api(body){
  try {
    const r = await fetch(PARK_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    return await r.json();
  } catch(e){ return { ok:false, error:'Network error. Try ulit.' }; }
}
async function load(){
  const p = me(); if(!p || PK.fetching) return; PK.fetching = true;
  try {
    const since = PK.data && !PK.data.demo ? PK.since : 0;
    const r = await fetch(`${PARK_URL}?playerId=${encodeURIComponent(p.id)}&playerName=${encodeURIComponent(p.name || '')}&since=${since}`);
    const j = await r.json(); if(!j || !j.ok) throw new Error((j && j.error) || 'bad');
    absorb(j, since > 0); PK.err = '';
  } catch(e){ PK.err = 'offline'; if(!PK.data) PK.data = demoState(); }
  PK.fetching = false; PK.at = Date.now(); render(); updateBadges();
}
function absorb(j, incremental){
  const prevEvents = incremental && PK.data && !PK.data.demo ? (PK.data.events || []) : [];
  PK.data = j; PK.since = j.since || PK.since;
  const names = {}, owners = {}; (j.roster || []).forEach(r => { names[r.petId] = r.name; owners[r.petId] = r.playerName; });
  PK.names = Object.assign(PK.names || {}, names); PK.owners = Object.assign(PK.owners || {}, owners);
  const all = prevEvents.concat(j.events || []); const seen = new Set(); PK.data.events = all.filter(e => !seen.has(e.id) && seen.add(e.id)).slice(-80);
  const m = me();
  if(incremental && m) (j.events || []).forEach(e => { if(e.data && e.data.by && e.data.by !== m.id && e.bPlayer === m.id && PK.park) PK.park.toast(`👋 Someone's pet said hi to your ${PK.names[e.b] || 'pet'}!`); });
}
function status(){ const d = PK.data; if(!d) return 'loading'; if(d.demo || PK.err) return 'soon'; return d.status || 'soon'; }

function injectPlayer(){
  const nav = document.getElementById('gpNav');
  if(nav && !nav.querySelector('[data-v="park"]')){
    const b = document.createElement('button'); b.className = 'sub'; b.dataset.v = 'park'; b.setAttribute('onclick', "gpGo('park')");
    b.innerHTML = '🐾 Bayani Park <span class="gp-cnt" id="gpCntPark"></span>';
    const after = nav.querySelector('[data-v="city"]') || nav.querySelector('[data-v="l9"]') || nav.querySelector('[data-v="race"]');
    after ? after.after(b) : nav.appendChild(b);
  }
  const games = document.querySelector('#gpv-player .gp-games');
  if(games && !document.getElementById('gpTilePark')){
    const d = document.createElement('div'); d.className = 'gp-game'; d.setAttribute('onclick', "gpGo('park')");
    d.innerHTML = '<span class="ic">🐾</span><b>Bayani Park</b><span class="gp-left" id="gpTilePark">Coming soon</span>';
    const city = document.getElementById('gpTileCity'), shop = Array.from(games.children).find(x => (x.getAttribute('onclick') || '').includes("'shop'"));
    city ? city.closest('.gp-game').after(d) : shop ? games.insertBefore(d, shop) : games.appendChild(d);
  }
  const anyView = document.querySelector('.gp-view');
  if(anyView && !document.getElementById('gpv-park')){
    const s = document.createElement('section'); s.className = 'gp-view'; s.id = 'gpv-park'; s.innerHTML = '<div id="bpRoot" style="display:grid;gap:16px;min-width:0"></div>';
    anyView.parentNode.appendChild(s);
  }
}
function updateBadges(){
  const st = status(), d = PK.data, n = d && !d.demo ? (d.roster || []).length : 0;
  const c = document.getElementById('gpCntPark'); if(c) c.textContent = st === 'soon' || st === 'loading' ? 'Soon' : n ? `${n}🐾` : st === 'beta' ? 'Beta' : 'Open';
  const t = document.getElementById('gpTilePark'); if(t) t.textContent = st === 'soon' || st === 'loading' ? 'Coming soon' : st === 'beta' ? 'Beta access' : `${n} pet${n === 1 ? '' : 's'} in the park`;
}

const FEATS = [['🎟️', 'Bring your pet', 'Pay a small ticket and your pet roams the shared yard for the whole shift.'],
  ['⛏️', 'Dig up treasure', 'Pets find SMB Tokens, free spins, BINGO cards and Pet Care Packs.'],
  ['💕', 'Make friends', 'Pets play, play-fight and flirt. Meet often and they become Besties or Sweethearts.'],
  ['🎁', 'Chests & Golden Hour', 'Race for Treasure Chests and dig double during Golden Hour.']];

function myPets(){ const m = me(); return m ? ((DB.pets || {})[m.id] || []).filter(p => p && p.status === 'alive') : []; }
function render(){
  const root = document.getElementById('bpRoot'); if(!root) return;
  const st = status();
  if(st === 'loading'){ root.innerHTML = '<div class="gp-card"><div class="empty-state">Loading Bayani Park…</div></div>'; PK.mode = null; return; }
  const mode = st === 'soon' ? 'soon' : 'live';
  if(PK.mode !== mode){
    if(PK.park) PK.park.destroy();
    root.innerHTML = mode === 'soon'
      ? `<div class="gp-card"><div class="bp-ribbon">● Coming soon</div><h2 style="margin:0 0 4px">🐾 Bayani Park</h2>
          <p style="color:var(--muted);margin:0">One big yard where everyone's pets hang out during the shift. Here's a sneak peek with sample pets.</p>${''}
          <div class="bp-feats">${FEATS.map(([i, t, d]) => `<div class="bp-feat"><span>${i}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div></div>
         <div class="gp-card" style="padding:10px"><div id="bpStage"></div></div>`
      : `<div class="gp-card" style="padding:12px"><div class="gp-hdr" style="margin-bottom:10px"><div class="bp-top" id="bpChips"></div></div><div id="bpStage"></div></div>
         <div class="bp-grid"><div class="gp-card" id="bpMine"></div><div class="gp-card" id="bpSide"></div></div>`;
    PK.park = new Park(document.getElementById('bpStage'), { onEvent:onParkEvent, onFollow:() => renderMine(), cardExtra:cardExtra });
    PK.park.setState(PK.data, false); PK.mode = mode;
    PK.park.centerOn(W / 2 - 200, H / 2);
  } else PK.park.setState(PK.data, true);
  if(mode === 'live'){ renderChips(); renderMine(); renderSide(); }
}
function onParkEvent(){ /* feed already updated from data; hook kept for future sounds */ }
function cardExtra(d){
  const m = me(); if(!m || d.playerId === m.id || !PK.data || PK.data.demo) return '';
  const mine = (PK.data.roster || []).filter(r => r.playerId === m.id); if(!mine.length) return '';
  return `<button class="btn btn-gold btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="bpHi('${esc(d.petId)}')">👋 Say hi with ${esc(mine[0].name)} · ${PK.data.cfg.hiPrice} 🪙</button>`;
}
function renderChips(){
  const el = document.getElementById('bpChips'); if(!el) return; const d = PK.data;
  const w = { day:'☀️ Day', night:'🌙 Night', rain:'🌧️ Rain' }[d.weather] || '☀️ Day';
  const gold = d.golden && new Date(d.golden) > Date.now() ? `<span class="bp-chip gold">✨ Golden Hour until ${phtTime(d.golden)}</span>` : '';
  const chest = d.chest ? `<span class="bp-chip gold">🎁 Treasure Chest! ${d.chest.boosts} boosted</span>` : '';
  el.innerHTML = `${st2(d)}<span class="bp-chip">${w}</span><span class="bp-chip teal">🐾 ${(d.roster || []).length} pets in the park</span>${gold}${chest}`;
}
function st2(d){ return d.status === 'beta' ? '<span class="bp-chip" style="color:var(--gold)">● Beta</span>' : ''; }
function renderMine(){
  const el = document.getElementById('bpMine'); if(!el || !PK.data) return;
  const d = PK.data, c = d.cfg || {}, m = me(), inPark = (d.roster || []).filter(r => r.playerId === m.id), inIds = new Set(inPark.map(r => r.petId));
  const pets = myPets(), full = inPark.length >= (c.petsPerPlayer || 1), bal = Number(typeof _myTokenBalance !== 'undefined' ? _myTokenBalance : 0);
  if(!PK.sel || !inIds.has(PK.sel)) PK.sel = inPark[0] ? inPark[0].petId : null;
  const rows = pets.map(p => {
    const here = inIds.has(p.id), lvl = Number(p.level || 1);
    const why = here ? '' : c.adultsOnly && !p.evolved ? 'Adults only' : lvl < (c.minLevel || 1) ? `Needs Lv ${c.minLevel}` : full ? `Max ${c.petsPerPlayer} per shift` : '';
    const btn = here ? `<span class="bp-chip teal">In the park ✓</span>`
      : `<button class="btn btn-gold btn-sm" ${why || PK.busy || bal < c.ticketPrice ? 'disabled' : ''} onclick="bpJoin('${esc(p.id)}')">🎟️ Bring in · ${c.ticketPrice} 🪙</button>`;
    return `<div class="bp-mypet ${here && PK.sel === p.id ? 'sel' : ''}" ${here ? `onclick="bpSel('${esc(p.id)}')" style="cursor:pointer"` : ''}>
      <img src="${imgSrc(p)}" alt="" onerror="this.remove()"><div class="sp"><b>${esc(p.name || spName(p.species))}</b><small>${p.evolved ? '👑 Adult' : '🐣 Baby'} ${esc(spName(p.species))} · Lv ${lvl}${why ? ' · ' + why : ''}</small></div>${btn}</div>`;
  }).join('');
  const sel = inPark.find(r => r.petId === PK.sel), park = PK.park, sp = sel && park && park.pets.get(sel.petId);
  const used = (d.me || {}).finds || 0, cap = c.findsPerShift || 8;
  const others = (d.roster || []).filter(r => r.playerId !== m.id);
  const doing = sp ? ({ wander:'Wandering around 🌸', idle:'Chilling 😊', gosleep:'Going for a nap 🌳', sleep:'Napping 💤', dig:'Digging ⛏️', meet:'Going to meet a friend 👀',
    inter:'Hanging out with a friend 💕', race:'Racing to the chest! 🏃💨', cheer:'Waiting at the chest 🎁', grab:'Grabbing the chest! 🏆' }[sp.state] || 'In the park') : '';
  el.innerHTML = `<div class="gp-hdr"><h3>🐾 My pets</h3><span class="gp-badge">Ticket lasts the whole shift</span></div>
    ${pets.length ? `<div class="bp-pets">${rows}</div>` : `<div class="empty-state">You don't have a hatched pet yet. Get an egg in 🐾 My Bingo Pets on the Player page.</div>`}
    ${sel ? `<div class="bp-status">${esc(sel.name)}: ${doing} <span style="color:var(--muted);font-weight:500">· ${esc(sel.trait)}</span></div>
      <div style="font-size:12px;color:var(--muted);margin-top:10px">Finds this shift: <b style="color:var(--white)">${used}</b> / ${cap}</div><div class="bp-meter"><i style="width:${Math.min(100, used / cap * 100)}%"></i></div>
      <div class="bp-acts">
        <button class="btn btn-outline btn-sm" onclick="bpFollow()">📍 ${park && park.follow === sel.petId ? 'Following' : 'Follow ' + esc(sel.name)}</button>
        <button class="btn btn-gold btn-sm" ${PK.busy || used >= cap || bal < c.digPrice ? 'disabled' : ''} onclick="bpDig()">⛏️ Dig here · ${c.digPrice} 🪙</button>
      </div>
      <div class="bp-hi"><select id="bpHiSel">${others.map(r => `<option value="${esc(r.petId)}">${esc(r.name)} (${esc(r.playerName)})</option>`).join('') || '<option value="">Nobody else yet</option>'}</select>
        <button class="btn btn-outline btn-sm" ${PK.busy || !others.length || bal < c.hiPrice || ((d.me || {}).hiUsed || 0) >= c.hiPerShift ? 'disabled' : ''} onclick="bpHi()">👋 Say hi · ${c.hiPrice} 🪙</button></div>
      ${d.chest ? `<button class="btn btn-gold" style="width:100%;justify-content:center;margin-top:10px" ${PK.busy || d.chest.mine || bal < c.boostPrice ? 'disabled' : ''} onclick="bpBoost()">${d.chest.mine ? '⚡ Boosted! Good luck' : `⚡ Boost to the chest (x${c.boostMult} chance) · ${c.boostPrice} 🪙`}</button>` : ''}` : ''}
    ${PK.msg ? `<div style="margin-top:10px;font-size:13px;color:${PK.ok ? 'var(--teal)' : 'var(--danger)'}">${esc(PK.msg)}</div>` : ''}`;
}
function renderSide(){
  const el = document.getElementById('bpSide'); if(!el || !PK.data) return;
  const d = PK.data, tabs = [['feed', '📣 Park feed'], ['finds', '🎒 My finds'], ['boards', '🏆 Boards']];
  let body = '';
  if(PK.tab === 'feed'){
    const evs = (d.events || []).slice().reverse().slice(0, 40);
    body = evs.length ? `<ul class="bp-feed">${evs.map(e => `<li class="${HOT.has(e.kind) || (e.data && e.data.item && e.data.item.tier === 'legendary') ? 'hot' : ''}"><span class="t">${phtTime(e.at)}</span>${evText(e, PK.names || {}, PK.owners || {})}</li>`).join('')}</ul>`
      : '<div class="empty-state">Quiet pa. Bring a pet in to get things going!</div>';
  } else if(PK.tab === 'finds'){
    const items = (d.me || {}).items || [];
    body = items.length ? items.map(f => { const it = f.item || {}; return `<div class="bp-item" style="border-color:${TIER[it.tier] || 'var(--line)'}66"><span class="e">${it.emoji || '🎁'}</span>
        <div style="flex:1"><b>${esc(it.label)}${it.kind === 'tokens' ? ` +${it.amount || 1} 🪙` : ''}</b><small><span style="color:${TIER[it.tier]};font-weight:800">${esc((it.tier || '').toUpperCase())}</span> · ${esc(PK.names[f.petId] || '')} · ${f.source === 'chest' ? 'Treasure Chest' : f.source === 'dig' ? 'you dug' : f.source === 'nap' ? 'nap find' : 'found it'} · ${phtTime(f.at)}</small></div>
        <small>${it.kind === 'voucher' ? 'In My Vouchers' : it.kind === 'tokens' ? 'Added to wallet' : 'Collectible'}</small></div>`; }).join('')
      : '<div class="empty-state">No finds yet this shift. Your pet digs on its own, or tap ⛏️ Dig here.</div>';
  } else {
    const b = d.boards || {}, list = (arr, unit) => (arr || []).length ? `<ol>${arr.map(r => `<li>${spEmoji(r.species)} ${esc(r.name)} — <b>${r.v}</b> ${unit}</li>`).join('')}</ol>` : '<div style="color:var(--muted);font-size:12px">No one yet.</div>';
    body = `<div class="bp-board"><h4>⛏️ Most treasures found</h4>${list(b.finds, '')}<h4>🏅 Park champion (play fights won)</h4>${list(b.wins, '')}
      <h4>🤝 Most Besties & Sweethearts</h4>${list(b.friends, '')}<h4>💕 Most flirty</h4>${list(b.flirty, '')}</div>`;
  }
  el.innerHTML = `<div class="bp-tabs">${tabs.map(([k, l]) => `<button class="${PK.tab === k ? 'on' : ''}" onclick="bpTab('${k}')">${l}</button>`).join('')}</div>${body}`;
}

async function act(body, okMsg){
  const m = me(); if(!m || PK.busy) return;
  PK.busy = true; PK.msg = ''; renderMine();
  const j = await api(Object.assign({ playerId:m.id, playerName:m.name }, body));
  PK.busy = false;
  if(j && j.ok){ PK.ok = true; PK.msg = typeof okMsg === 'function' ? okMsg(j) : okMsg; absorb(j, false); PK.since = j.since || PK.since; render(); try { refreshTokenBalance(); } catch(e){} }
  else { PK.ok = false; PK.msg = (j && j.error) || 'Something went wrong.'; renderMine(); }
  return j;
}
window.bpJoin = async id => { const j = await act({ action:'join', petId:id }, '🎟️ Your pet is in the park!'); if(j && j.ok && PK.park){ PK.sel = id; PK.park.follow = id; renderMine(); } };
window.bpDig = () => act({ action:'dig', petId:PK.sel }, j => j.found ? `⛏️ Found ${j.found.emoji} ${j.found.label}!` : 'Nothing this time.');
window.bpHi = target => { const t = target || (document.getElementById('bpHiSel') || {}).value; if(!t || !PK.sel) return;
  if(PK.park) PK.park.card.style.display = 'none'; return act({ action:'hi', petId:PK.sel, targetPetId:t }, '👋 On the way to say hi!'); };
window.bpBoost = () => act({ action:'boost' }, '⚡ Boosted!');
window.bpSel = id => { PK.sel = id; if(PK.park){ PK.park.follow = id; } renderMine(); };
window.bpFollow = () => { if(!PK.park || !PK.sel) return; PK.park.follow = PK.park.follow === PK.sel ? null : PK.sel; renderMine(); };
window.bpTab = t => { PK.tab = t; renderSide(); };

const _gpGo = window.gpGo;
window.gpGo = function(v){
  const r = _gpGo.apply(this, arguments);
  if(v === 'park'){ try { render(); if(!PK.data || Date.now() - PK.at > 4000) load(); } catch(e){ console.error(e); } }
  return r;
};
setInterval(() => { try { if(typeof _gpView !== 'undefined' && _gpView === 'park' && !document.hidden){ load(); } else if(!PK.at || Date.now() - PK.at > 120000) load(); } catch(e){} }, 12000);
setInterval(() => { try { if(typeof _gpView !== 'undefined' && _gpView === 'park' && PK.mode === 'live') renderMine(); } catch(e){} }, 3000);
setTimeout(() => { try { load(); } catch(e){} }, 2500);

// ═════════════════════ ADMIN SIDE ═════════════════════
const BA = { data:null, err:'', msg:{}, park:null, loot:null, timer:null };
const NUM = [
  ['Entry', [['ticketPrice', 'Ticket price', 'SMB Tokens per pet per shift'], ['petsPerPlayer', 'Pets per player', 'in the park at once'], ['minLevel', 'Minimum pet level', '1 = any hatched pet']]],
  ['Actions', [['digPrice', 'Dig here', 'tokens'], ['hiPrice', 'Say hi', 'tokens'], ['hiPerShift', 'Say-hi limit', 'per player per shift'], ['boostPrice', 'Chest boost', 'tokens'], ['boostMult', 'Boost power', 'x chance to win the chest']]],
  ['Finds', [['findsPerShift', 'Finds limit', 'per player per shift (chests don\'t count)'], ['autoFindsPerHour', 'Natural finds', 'per pet per hour']]],
  ['Friends', [['meetsPerHour', 'Pet meetings', 'per hour, whole park'], ['bondAt', 'Besties/Sweethearts after', 'meetings between the same 2 pets']]],
  ['Events', [['goldenMult', 'Golden Hour boost', 'x finds & rare chance'], ['goldenMinutes', 'Golden Hour length', 'minutes'], ['autoGoldenPerShift', 'Random Golden Hours', 'per shift (0 = admin only)'],
    ['autoChestsPerShift', 'Random chests', 'per shift (0 = admin only)'], ['chestSeconds', 'Chest race', 'seconds to boost before it opens']]],
];
const SLACK_FLAGS = [['legendary', '🌟 Legendary finds'], ['chest', '🎁 Chest drops & winners'], ['couple', '💞 New Besties / Sweethearts'], ['golden', '✨ Golden Hour'], ['join', '🎟️ Every pet that enters']];

async function adminCall(adminAction, payload){
  if(typeof _adminPinSession === 'undefined' || !_adminPinSession){ return { ok:false, error:'Please log in to admin again.' }; }
  try {
    const r = await fetch(PARK_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'admin', pin:_adminPinSession, adminAction, payload:payload || {} }) });
    return await r.json();
  } catch(e){ return { ok:false, error:'offline' }; }
}
function injectAdmin(){
  const anchor = document.querySelector('.tab-btn[data-tab="bayanicity"]') || document.querySelector('.tab-btn[data-tab="petstore"]');
  if(anchor && !document.querySelector('.tab-btn[data-tab="park"]')){
    const b = document.createElement('button'); b.className = 'tab-btn'; b.dataset.tab = 'park'; b.setAttribute('onclick', "switchAdminTab('park')"); b.textContent = '🐾 Bayani Park'; anchor.after(b);
  }
  const at = document.getElementById('tab-bayanicity') || document.getElementById('tab-petstore');
  if(at && !document.getElementById('tab-park')){
    const d = document.createElement('div'); d.className = 'tab-content'; d.id = 'tab-park'; d.innerHTML = '<div id="bpaRoot"><div class="panel"><div class="empty-state">Loading…</div></div></div>'; at.after(d);
  }
}
if(typeof switchAdminTab === 'function'){
  const _sw = window.switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'park') bpaLoad(); return r; };
}
function adminVisible(){ const t = document.getElementById('tab-park'); return !!(t && t.classList.contains('active')); }
setInterval(() => { if(adminVisible() && !document.hidden) bpaLoad(true); }, 12000);

async function bpaLoad(quiet){
  const j = await adminCall('get');
  if(!j.ok){
    BA.err = j.error === 'offline' || !j.error ? 'offline' : j.error;
    if(!BA.data){ BA.data = { ok:true, settings:{}, defaults:{}, offline:true, state:demoState(), tonight:{}, recent:[] }; }
  } else { BA.data = j; BA.err = ''; }
  if(quiet && BA.park && document.getElementById('bpaStage')){ BA.park.setState(BA.data.state, true); bpaPaintLive(); return; }
  bpaRender();
}
function amsg(k){ const m = BA.msg[k]; return `<span class="pra-msg" style="color:${m && m.ok ? 'var(--success)' : 'var(--danger)'}">${m ? esc(m.t) : ''}</span>`; }
function setMsg(k, j, okText){ BA.msg[k] = { ok:!!j.ok, t:j.ok ? okText : '⚠ ' + (j.error === 'offline' ? 'The bingo-park backend is not live yet.' : (j.error || 'Failed')) }; }
function bpaPaintLive(){
  const el = document.getElementById('bpaLiveInfo'); if(!el || !BA.data) return;
  const j = BA.data, t = j.tonight || {}, st = j.state || {};
  el.innerHTML = `<div class="bpa-stats">${[['🐾', 'Pets', t.pets], ['🧑', 'Players', t.players], ['🎟️', 'Tickets 🪙', t.tickets], ['⛏️', 'Finds', t.finds], ['🪙', 'Tokens out', t.tokensOut],
      ['🎟️', 'Vouchers out', t.vouchers], ['💕', 'Meetings', t.meets], ['💞', 'New couples', t.couples]].map(([i, l, v]) => `<div><small>${i} ${l}</small><b>${v ?? '—'}</b></div>`).join('')}</div>
    <div style="font-size:12px;color:var(--muted)">Weather now: <b>${esc(st.weather || j.weather || '—')}</b>${j.golden ? ` · ✨ Golden Hour until ${phtTime(j.golden)}` : ''}${j.chest ? ` · 🎁 Chest out (${(j.chest.boosts || []).length} boosted), opens ${phtTime(j.chest.ends)}` : ''}</div>`;
}
function bpaRender(){
  const root = document.getElementById('bpaRoot'); if(!root || !BA.data) return;
  const j = BA.data, s = Object.assign({}, j.defaults || {}, j.settings || {}), sl = s.slack || {};
  if(!BA.loot) BA.loot = JSON.parse(JSON.stringify(s.loot || []));
  const off = j.offline;
  const numF = ([k, l, h]) => `<div class="pra-f"><label>${l}<small>${h}</small></label><input type="number" min="0" step="any" data-bpa="${k}" value="${esc(s[k] ?? '')}"></div>`;
  const tot = BA.loot.reduce((a, r) => a + Math.max(0, Number(r.weight) || 0), 0) || 1;
  let h = off ? `<div class="panel" style="border-color:rgba(226,104,95,.5)"><div class="panel-title" style="color:var(--danger)">⚠ Backend not live yet</div>
      <div style="font-size:13px">The <b>bingo-park</b> edge function isn't deployed yet, so this tab shows a demo park and saving won't work. Everything goes live once Viktor runs park.sql and deploys bingo-park.</div></div>` : '';
  h += `<div class="panel"><div class="panel-title">🐾 Bayani Park</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">While Off, players see a "Coming soon" preview with sample pets. Beta testers can play while Off.</div>
    <div class="pra-form"><div class="pra-f"><label>Open<small>Off = "Coming soon"</small></label><select data-bpa="on" data-t="bool"><option value="true" ${s.on ? 'selected' : ''}>On</option><option value="false" ${!s.on ? 'selected' : ''}>Off</option></select></div>
      <div class="pra-f" style="grid-column:span 2"><label>Beta testers<small>comma-separated player names, e.g. Gilda, Ochi</small></label><input type="text" maxlength="500" data-bpa="beta" data-t="text" value="${esc(s.beta || '')}"></div></div>
    <div class="pra-save">${amsg('open')}<span><button class="btn btn-gold" onclick="bpaSave('open')">💾 Save Open / Beta</button></span></div></div>`;
  h += `<div class="panel"><div class="panel-title">📡 Live park (this shift)</div><div id="bpaStage"></div><div id="bpaLiveInfo"></div>
    <div class="bpa-ctl"><button class="btn btn-gold btn-sm" ${j.chest ? 'disabled' : ''} onclick="bpaDo('drop_chest','🎁 Chest dropped')">🎁 Drop a Treasure Chest</button>
      <button class="btn btn-outline btn-sm" ${j.chest ? '' : 'disabled'} onclick="bpaDo('end_chest','🏆 Chest opened')">Open chest now</button>
      ${j.golden ? `<button class="btn btn-outline btn-sm" onclick="bpaDo('golden_stop','Golden Hour stopped')">Stop Golden Hour</button>` : `<button class="btn btn-gold btn-sm" onclick="bpaDo('golden_start','✨ Golden Hour started')">✨ Start Golden Hour</button>`}
      <label style="display:flex;align-items:center;gap:6px;font-size:12px">Weather <select data-bpa="weather" data-t="text" onchange="bpaSave('weather')" style="width:auto">${['auto', 'day', 'night', 'rain'].map(w => `<option value="${w}" ${s.weather === w ? 'selected' : ''}>${{ auto:'Auto (clock + random rain)', day:'☀️ Day', night:'🌙 Night', rain:'🌧️ Rain' }[w]}</option>`).join('')}</select></label>
      ${amsg('ctl')}${amsg('weather')}</div>
    <div style="font-size:11px;color:var(--muted);margin-top:6px">Tap a pet in the park to see its owner and remove it if needed.</div></div>`;
  h += `<div class="panel"><div class="panel-title">⚙️ Prices & rates</div>${NUM.map(([g, fs]) => `<div class="pra-sec">${g}</div><div class="pra-form">${fs.map(numF).join('')}${g === 'Entry' ? `<div class="pra-f"><label>Adults only<small>only 👑 Adult pets can enter</small></label><select data-bpa="adultsOnly" data-t="bool"><option value="false" ${!s.adultsOnly ? 'selected' : ''}>No, any hatched pet</option><option value="true" ${s.adultsOnly ? 'selected' : ''}>Yes</option></select></div>` : ''}</div>`).join('')}
    <div class="pra-save">${amsg('rules')}<span><button class="btn btn-gold" onclick="bpaSave('rules')">💾 Save prices & rates</button></span></div></div>`;
  h += `<div class="panel"><div class="panel-title">🎁 Loot table</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">What pets can find. Higher weight = more common. Lucky pets get x1.5 on anything above Common, Golden Hour multiplies it again. Treasure Chests only give Rare and up. Vouchers land in the player's 🎟️ My Vouchers.</div>
    <div style="overflow-x:auto"><table class="bpa-loot"><tr><th></th><th>Name</th><th>Tier</th><th>Gives</th><th>Voucher</th><th>Amount</th><th>Weight</th><th>Chance</th><th></th></tr>
    ${BA.loot.map((r, i) => `<tr><td class="em"><input value="${esc(r.emoji || '')}" oninput="bpaLoot(${i},'emoji',this.value)"></td><td><input value="${esc(r.label || '')}" oninput="bpaLoot(${i},'label',this.value)"></td>
      <td><select onchange="bpaLoot(${i},'tier',this.value)">${['common', 'rare', 'epic', 'legendary'].map(t => `<option ${r.tier === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td>
      <td><select onchange="bpaLoot(${i},'kind',this.value,1)">${[['tokens', 'SMB Tokens'], ['voucher', 'Voucher'], ['collectible', 'Collectible']].map(([k, l]) => `<option value="${k}" ${r.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
      <td>${r.kind === 'voucher' ? `<select onchange="bpaLoot(${i},'voucher',this.value)">${[['spin', '🎡 Free spin'], ['bingo_card', '🎟️ BINGO card'], ['pet_care_pack', '🐾 Care Pack']].map(([k, l]) => `<option value="${k}" ${r.voucher === k ? 'selected' : ''}>${l}</option>`).join('')}</select>` : ''}</td>
      <td class="num"><input type="number" min="1" value="${esc(r.amount ?? 1)}" oninput="bpaLoot(${i},'amount',+this.value)"></td>
      <td class="num"><input type="number" min="0" step="any" value="${esc(r.weight ?? 1)}" oninput="bpaLoot(${i},'weight',+this.value,1)"></td>
      <td style="color:var(--muted);white-space:nowrap">${((Math.max(0, Number(r.weight) || 0)) / tot * 100).toFixed(1)}%</td>
      <td><button class="btn btn-outline btn-sm" onclick="bpaLootDel(${i})">✕</button></td></tr>`).join('')}</table></div>
    <div class="pra-save">${amsg('loot')}<span><button class="btn btn-outline btn-sm" onclick="bpaLootAdd()">＋ Add item</button> <button class="btn btn-outline btn-sm" onclick="bpaLootReset()">Reset to default</button> <button class="btn btn-gold" onclick="bpaSaveLoot()">💾 Save loot table</button></span></div></div>`;
  h += `<div class="panel"><div class="panel-title">🔔 Bayani Park Slack</div>
    <div style="font-size:12px;margin-bottom:8px">${j.hook ? '✅ A webhook is saved (hidden for safety). Paste a new one to replace it.' : 'No webhook yet: nothing posts to Slack.'}</div>
    <div class="pra-form"><div class="pra-f" style="grid-column:1/-1"><label>Webhook URL<small>https://hooks.slack.com/services/…</small></label><input type="password" autocomplete="off" id="bpaHook" style="background:var(--deep,#151824);color:var(--white,#fff);border:1px solid var(--line,#333);border-radius:8px;padding:8px 10px" placeholder="${j.hook ? 'Paste a new one to replace it' : 'https://hooks.slack.com/services/…'}"></div></div>
    <div class="pra-save">${amsg('hook')}<span><button class="btn btn-gold btn-sm" onclick="bpaHook()">💾 Save webhook</button> <button class="btn btn-outline btn-sm" ${j.hook ? '' : 'disabled'} onclick="bpaTestHook()">Send test post</button> ${j.hook ? '<button class="btn btn-outline btn-sm" onclick="bpaHook(true)">Remove</button>' : ''}</span></div>
    <div class="pra-sec">What gets posted</div><div class="pra-form">${SLACK_FLAGS.map(([k, l]) => `<div class="pra-f"><label>${l}</label><select data-bps="${k}"><option value="true" ${sl[k] !== false ? 'selected' : ''}>On</option><option value="false" ${sl[k] === false ? 'selected' : ''}>Off</option></select></div>`).join('')}</div>
    <div class="pra-save">${amsg('slack')}<span><button class="btn btn-gold btn-sm" onclick="bpaSaveSlack()">💾 Save Slack posts</button></span></div></div>`;
  const recent = j.recent || [];
  h += `<div class="panel"><div class="panel-title">🧾 Recent finds (this shift)</div>${recent.length ? `<div class="pr-tbl"><table class="roster-table"><thead><tr><th>When (PHT)</th><th>Player</th><th>Pet</th><th>Found</th><th>How</th></tr></thead><tbody>${recent.map(f => { const it = f.item || {};
      return `<tr><td>${phtTime(f.at)}</td><td>${esc(f.playerName || f.playerId)}</td><td>${esc(f.pet || '')}</td><td>${it.emoji || ''} ${esc(it.label || '')}${it.kind === 'tokens' ? ` +${it.amount}🪙` : ''} <span style="color:${TIER[it.tier]};font-size:11px">${esc(it.tier || '')}</span></td><td>${esc(f.source)}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty-state">No finds yet this shift.</div>'}</div>`;
  root.innerHTML = h;
  if(BA.park) BA.park.destroy();
  BA.park = new Park(document.getElementById('bpaStage'), { admin:true, cardExtra:d => off || String(d.petId).startsWith('demo') ? '' :
    `<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-outline btn-sm" onclick="bpaRemove('${esc(d.petId)}',true)">Remove + refund</button><button class="btn btn-outline btn-sm" onclick="bpaRemove('${esc(d.petId)}',false)">Remove</button></div>` });
  BA.park.setState(j.state || demoState(), false);
  if(BA.park.chest) BA.park.centerOn(BA.park.chest.x, BA.park.chest.y); else BA.park.centerOn(W / 2 - 200, H / 2);
  bpaPaintLive();
}
function readFields(sel){ const out = {}; document.querySelectorAll(sel).forEach(el => { const k = el.dataset.bpa, t = el.dataset.t;
  out[k] = t === 'bool' ? el.value === 'true' : t === 'text' ? el.value.trim() : Number(el.value); }); return out; }
window.bpaSave = async which => {
  const all = readFields('#bpaRoot [data-bpa]'); let payload = {};
  if(which === 'open') payload = { on:all.on, beta:all.beta };
  else if(which === 'weather') payload = { weather:all.weather };
  else { NUM.forEach(([, fs]) => fs.forEach(([k]) => { if(!isNaN(all[k])) payload[k] = Math.max(0, all[k]); })); payload.adultsOnly = all.adultsOnly; }
  const j = await adminCall('save', payload); setMsg(which, j, '✅ Saved. Players see it on their next refresh.');
  if(j.ok){ BA.data = j; } bpaRender();
};
window.bpaLoot = (i, k, v, re) => { BA.loot[i][k] = v; if(k === 'kind' && v === 'voucher' && !BA.loot[i].voucher) BA.loot[i].voucher = 'spin'; if(re) bpaRender(); };
window.bpaLootDel = i => { BA.loot.splice(i, 1); bpaRender(); };
window.bpaLootAdd = () => { BA.loot.push({ id:'item' + Date.now().toString(36), emoji:'🎁', label:'New item', tier:'common', kind:'collectible', amount:1, weight:5 }); bpaRender(); };
window.bpaLootReset = () => { if(!confirm('Reset the loot table to the default items?')) return; BA.loot = JSON.parse(JSON.stringify((BA.data.defaults || {}).loot || [])); bpaRender(); };
window.bpaSaveLoot = async () => {
  const bad = BA.loot.find(r => !r.label || !(Number(r.weight) >= 0) || !(Number(r.amount) >= 1)); if(bad){ BA.msg.loot = { ok:false, t:'⚠ Every item needs a name, an amount of 1+ and a weight of 0+.' }; return bpaRender(); }
  const loot = BA.loot.map(r => Object.assign({ id:r.id || ('item' + Math.random().toString(36).slice(2, 7)) }, r, { amount:Math.floor(Number(r.amount)), weight:Number(r.weight) }));
  const j = await adminCall('save', { loot }); setMsg('loot', j, '✅ Loot table saved.'); if(j.ok){ BA.data = j; BA.loot = null; } bpaRender();
};
window.bpaSaveSlack = async () => { const slack = {}; document.querySelectorAll('#bpaRoot [data-bps]').forEach(el => slack[el.dataset.bps] = el.value === 'true');
  const j = await adminCall('save', { slack }); setMsg('slack', j, '✅ Slack posts saved.'); if(j.ok) BA.data = j; bpaRender(); };
window.bpaHook = async remove => {
  const url = remove ? '' : (document.getElementById('bpaHook').value || '').trim();
  if(remove && !confirm('Remove the Bayani Park webhook? Nothing will post to Slack.')) return;
  if(!remove && !url) return;
  const j = await adminCall('hook', { url }); setMsg('hook', j, remove ? '✅ Webhook removed.' : '✅ Webhook saved. Tap "Send test post" to check it.'); if(j.ok) BA.data = j; bpaRender();
};
window.bpaTestHook = async () => { const j = await adminCall('test_hook'); setMsg('hook', j, '✅ Test post sent. Check the channel.'); bpaRender(); };
window.bpaDo = async (a, okText) => { const j = await adminCall(a); setMsg('ctl', j, okText); if(j.ok) BA.data = j; bpaRender(); };
window.bpaRemove = async (petId, refund) => {
  if(!confirm(refund ? 'Remove this pet from the park and refund the ticket?' : 'Remove this pet from the park (no refund)?')) return;
  const j = await adminCall('remove_pet', { petId, refund }); setMsg('ctl', j, '✅ Pet removed.'); if(j.ok) BA.data = j; bpaRender();
};

// ═════════════════════ BOOT ═════════════════════
if(typeof TOKEN_EVENT_LABELS !== 'undefined') Object.assign(TOKEN_EVENT_LABELS, { park_ticket:'🐾 Bayani Park Ticket', park_dig:'🐾 Bayani Park Dig', park_hi:'🐾 Bayani Park Say Hi',
  park_boost:'🐾 Bayani Park Chest Boost', park_find:'🐾 Bayani Park Find', park_chest:'🎁 Bayani Park Chest', park_refund:'🐾 Bayani Park Refund' });
function boot(){ try { injectPlayer(); injectAdmin(); updateBadges(); if(typeof _gpView !== 'undefined' && _gpView === 'park') render(); } catch(e){ console.error('bayani-park', e); } }
boot(); setTimeout(boot, 1500);
window.bayaniPark = { load, render, Park, _pk:PK, _ba:BA };
})();
