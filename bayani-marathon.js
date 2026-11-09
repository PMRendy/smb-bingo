// ═══════════════════════════════════════════════════════════════════════════
//  bayani-marathon.js — 🏅 Bayani World Marathon (premium game) · SMB Game Portal
//  v1 · 2026-11-09 · load after bayani-park.js. Backend: bingo-games action "marathon"
//  (marathon.sql + marathonEngine.ts, see MARATHON_HANDOFF.md).
//
//  Player side: Games → 🏅 World Marathon (first in the list).
//   • Status Off / not a beta tester, or backend not live yet: preview with sample racers.
//   • Open / beta: the live World Course. Join (entrance fee), one brain challenge per shift
//     (server-checked, timer + focus mode + strikes), Swim/Bike/Run legs across 4 countries,
//     transfers by plane/train/cruise, weather, gear and pet pacers, leaderboard with fog.
//  Admin side: 🏅 World Marathon tab → status (Off/Beta/Open), prize, season & holidays,
//   prize ladder, world route, weather & theme, prices, anti-cheat, token burn, winner.
//  Also sets the Games order: World Marathon → Bayani City → Pet Race → Bayani Park → BINGO.
//  The page renders inside a Shadow DOM so its styles never touch the rest of the portal.
//  The server decides every roll and checks every answer. This page only draws what it gets back.
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof GP_TITLES === 'undefined' || typeof gpGo !== 'function') return;

const CSS = "\n/* Layout: portal-style dark shell; premium hero at top of BINGO tab; tower column left (sticky), tabbed play/admin panels right */\n:host{\n  --bg:#0c111c; --panel:#141b2a; --panel2:#1b2436; --line:#27324a;\n  --fg:#e9edf5; --muted:#8e9ab3; --gold:#efb042; --gold2:#ffd27a;\n  --ok:#3ccf8e; --warn:#f2b33d; --bad:#ef5f5f; --sky:#5fa8ff; --burn:#ff7a3d; --xmas:#e5484d;\n  --display:\"Baloo 2\",\"Trebuchet MS\",system-ui,sans-serif;\n  --body:\"Nunito Sans\",system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --mono:\"JetBrains Mono\",ui-monospace,Menlo,Consolas,monospace;\n  color-scheme:dark;\n}\n*{box-sizing:border-box}\n[hidden]{display:none!important}\n:host{display:block;background:var(--bg);color:var(--fg);font-family:var(--body);font-size:14px;line-height:1.45;border-radius:16px;-webkit-font-smoothing:antialiased}\nbutton,input,select{font-family:inherit}\n.wrap{max-width:1280px;margin:0 auto;padding:4px 0 24px}\n.crumb{font-size:12px;color:var(--muted);font-weight:700;letter-spacing:.06em;margin-bottom:8px}\n.crumb b{color:var(--fg)}\n.hero{position:relative;overflow:hidden;border-radius:16px;border:1px solid rgba(239,176,66,.55);background:radial-gradient(120% 140% at 100% 0%,rgba(239,176,66,.22),transparent 55%),linear-gradient(135deg,#1a2238,#121827);padding:16px 18px;margin-bottom:14px;display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between}\n.hero h1{font-family:var(--display);font-weight:800;font-size:30px;letter-spacing:.05em;color:var(--gold);margin:0;line-height:1}\n.prem{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#1a1205;background:linear-gradient(90deg,var(--gold),var(--gold2));padding:3px 9px;border-radius:99px;margin:0 6px 6px 0}\n.xpill{display:inline-flex;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:var(--xmas);padding:3px 9px;border-radius:99px}\n.hero p{margin:4px 0 0;color:#c3cbe0;font-size:13px;max-width:62ch}\n.seg{display:inline-flex;background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:3px;flex-wrap:wrap}\n.seg button{all:unset;cursor:pointer;padding:6px 13px;border-radius:999px;font-weight:700;font-size:13px;color:var(--muted)}\n.seg button[aria-pressed=\"true\"]{background:var(--gold);color:#1a1205}\n.seg button:focus-visible{outline:2px solid var(--gold2);outline-offset:2px}\n.controls{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center}\n.controls .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:700}\n.note{background:#132238;border:1px solid #234068;color:#b9d3f5;border-radius:10px;padding:8px 12px;font-size:12.5px;margin-bottom:14px}\n.statusbar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:14px}\n.stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 12px;min-width:0}\n.stat .k{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:700}\n.stat .v{font-family:var(--mono);font-weight:700;font-size:19px;font-variant-numeric:tabular-nums;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.stat .s{font-size:12px;color:var(--muted)}\n.meter{height:8px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-top:6px}\n.meter i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:99px;transition:width .6s}\n.grid{display:grid;grid-template-columns:minmax(300px,390px) minmax(0,1fr);gap:16px;align-items:start}\n.towercol{position:sticky;top:env(safe-area-inset-top,0px)}\n.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}\n.card h2{font-family:var(--display);font-size:19px;margin:0 0 2px;font-weight:800}\n.card h3{font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:var(--gold);margin:0 0 8px;font-weight:800}\n.card h4{font-size:13px;margin:14px 0 6px;font-weight:800}\n.sub{margin:0 0 10px;color:var(--muted);font-size:13px}\n.stack{display:flex;flex-direction:column;gap:16px;min-width:0}\n.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}\n\n/* Tower */\n.towerhead{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:8px;flex-wrap:wrap}\n.legend{display:flex;gap:10px;flex-wrap:wrap;font-size:11.5px;color:var(--muted)}\n.legend span::before{content:\"\";display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:-1px;background:var(--c)}\n.tscroll{position:relative;height:640px;overflow-y:auto;overflow-x:hidden;border-radius:12px;border:1px solid var(--line);background:#050816;scroll-behavior:smooth}\n.tower{position:relative;margin:0}\n.scene{position:absolute;left:0;top:0;display:block}\n.scene .zlbl{font:800 10px var(--body);letter-spacing:.16em;fill:#fff;fill-opacity:.55}\n.scene .mk{font:700 10px var(--mono);fill:#fff;fill-opacity:.85;paint-order:stroke;stroke:#0b0f18;stroke-width:3px}\n.scene .lg{font:800 10px var(--body);letter-spacing:.12em;fill:#fff;fill-opacity:.75;paint-order:stroke;stroke:#0b0f18;stroke-width:3px}\n.scene .cty{font:800 10.5px var(--body);letter-spacing:.06em;fill:#ffd27a}\n.scene .trf{font:800 10px var(--body);letter-spacing:.06em;fill:#fff}\n.route{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:12px;margin:0 0 8px}\n.route .c{padding:2px 8px;border-radius:99px;border:1px solid var(--line);font-weight:700;background:var(--panel2)}\n.route .c.on{background:var(--gold);color:#1a1205;border-color:var(--gold)}\n.route .m{color:var(--muted)}\n.scene .camp{font:800 9px var(--body);letter-spacing:.08em;fill:#1a1205}\n.scene .xl{animation:twinkle 1.6s infinite alternate}\n@keyframes twinkle{to{opacity:.35}}\n.facade{position:absolute;left:38px;right:6px;top:0;bottom:0;border-radius:8px 8px 0 0;background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(255,210,122,.07) 22px 30px),linear-gradient(90deg,#1a2338,#1f2a42 50%,#1a2338)}\n.tower.pasko .facade{border-left:4px dotted #ffd27a;border-right:4px dotted #e5484d}\n.fl{position:absolute;left:0;right:0;border-bottom:1px solid rgba(255,255,255,.05)}\n.fl .n{position:absolute;left:0;bottom:3px;font-family:var(--mono);font-size:10px;color:#5d6a86;width:32px;text-align:right}\n.fl.five .n{color:#8e9ab3}\n.fl.cp{border-bottom:2px solid var(--gold);background:linear-gradient(90deg,transparent 38px,rgba(239,176,66,.14) 38px)}\n.fl.cp .n{color:var(--gold);font-weight:700}\n.fl .cpl{position:absolute;right:10px;bottom:3px;font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--gold);text-transform:uppercase}\n.fl.top{background:linear-gradient(90deg,transparent 38px,rgba(239,176,66,.28) 38px);border-bottom:2px solid var(--gold2)}\n.fl.top .cpl{color:var(--gold2)}\n.fl.ground{border-bottom:3px solid #3a4560}\n.mys{position:absolute;font-size:17px;z-index:2;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))}\n.mys.hidden{opacity:.35;filter:grayscale(.6)}\n.fog{position:absolute;left:0;right:0;top:0;pointer-events:none;background:radial-gradient(90px 34px at 18% 82%,rgba(236,241,252,.8),transparent 70%),radial-gradient(110px 40px at 72% 74%,rgba(236,241,252,.75),transparent 70%),radial-gradient(80px 30px at 45% 92%,rgba(236,241,252,.7),transparent 70%),linear-gradient(180deg,rgba(214,222,240,.82),rgba(200,212,236,.6) 75%,rgba(200,212,236,0));backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);z-index:3;display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px}\n.fog b{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#1b2540;background:rgba(255,255,255,.7);padding:3px 8px;border-radius:99px}\n.wx,.snow{position:absolute;inset:0;pointer-events:none;z-index:1}\n.wx.rain,.wx.storm{background:repeating-linear-gradient(105deg,transparent 0 14px,rgba(150,190,255,.18) 14px 15px);background-size:100% 60px;animation:rain .5s linear infinite}\n.wx.storm{background-color:rgba(10,14,30,.35);animation:rain .35s linear infinite,flashy 5s infinite}\n.wx.wind{background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='120'%3E%3Cpath d='M12 22h56M130 58h44M40 96h34M170 104h30' stroke='%23dcefff' stroke-opacity='.35' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\");background-size:220px 120px;animation:wind 1.6s linear infinite}\n.wx.heat{background:linear-gradient(180deg,rgba(255,122,61,.10),rgba(255,180,61,.04))}\n.snow{background-image:radial-gradient(2px 2px at 20px 30px,#fff,transparent),radial-gradient(2px 2px at 120px 80px,#fff,transparent),radial-gradient(1.5px 1.5px at 220px 140px,#fff,transparent),radial-gradient(2px 2px at 300px 40px,#fff,transparent),radial-gradient(1.5px 1.5px at 70px 170px,#fff,transparent);background-size:340px 200px;opacity:.55;animation:snow 6s linear infinite}\n@keyframes rain{to{background-position:0 60px}}\n@keyframes wind{to{background-position:220px 0}}\n@keyframes snow{to{background-position:20px 200px,-20px 200px,10px 200px,-10px 200px,15px 200px}}\n@keyframes flashy{0%,93%,97%,100%{box-shadow:inset 0 0 0 999px rgba(255,255,255,0)}95%{box-shadow:inset 0 0 0 999px rgba(255,255,255,.18)}}\n.av{position:absolute;width:32px;height:40px;transition:top .9s cubic-bezier(.3,1.2,.5,1),left .9s;z-index:2;cursor:pointer;outline:none}\n.av.walking svg{animation:bob .18s infinite alternate}\n@keyframes bob{to{transform:translateY(-3px) rotate(4deg)}}\n.av svg{width:32px;height:40px;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}\n.av .ride{position:absolute;right:-9px;bottom:-2px;font-size:14px;line-height:1;white-space:nowrap}\n.av .crown{position:absolute;left:50%;top:-11px;transform:translateX(-50%);font-size:13px;line-height:1}\n.av .prank{position:absolute;left:-10px;top:-4px;font-size:12px;line-height:1}\n.av .tag{position:absolute;left:50%;bottom:calc(100% + 4px);transform:translateX(-50%);white-space:nowrap;font-size:10.5px;font-weight:800;background:#0b0f18;border:1px solid var(--line);color:var(--fg);padding:1px 6px;border-radius:6px;opacity:0;pointer-events:none;transition:opacity .15s;z-index:5}\n.av:hover .tag,.av:focus .tag,.av.flash .tag{opacity:1}\n.av.me{z-index:4}\n.av.me .tag{opacity:1;background:var(--gold);color:#1a1205;border-color:var(--gold)}\n.av.me svg{filter:drop-shadow(0 0 5px rgba(255,210,122,.9))}\n.av.aura svg{filter:drop-shadow(0 0 4px #ffd27a) drop-shadow(0 0 10px #efb042)}\n.av.fogged{z-index:1}\n.av.fogged svg,.av.fogged .ride,.av.fogged .prank{filter:blur(3px) grayscale(1) brightness(.85)}\n.av.fogged .tag,.av.fogged .crown{display:none}\n.av.flash svg{animation:pulse 1s 2}\n.av.hit svg{animation:hit .5s 3}\n@keyframes pulse{50%{transform:translateY(-6px) scale(1.15)}}\n@keyframes hit{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}\n\n/* Tabs */\n.atabs{display:flex;gap:6px;flex-wrap:wrap}\n.atabs button{all:unset;cursor:pointer;padding:7px 12px;border-radius:10px;font-weight:800;font-size:13px;color:var(--muted);border:1px solid var(--line);background:var(--panel)}\n.atabs button[aria-pressed=\"true\"]{color:#1a1205;background:var(--gold);border-color:var(--gold)}\n.atabs button:focus-visible{outline:2px solid var(--gold2)}\n\n/* Challenge */\n#chalCard:fullscreen{overflow:auto;padding:24px;background:var(--panel)}\n.locked{user-select:none;-webkit-user-select:none}\n.diffs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}\n.diff{all:unset;cursor:pointer;border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:3px;min-width:0}\n.diff:hover{border-color:var(--gold)}\n.diff:focus-visible{outline:2px solid var(--gold2)}\n.diff b{font-family:var(--display);font-size:18px}\n.diff .tl{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:800}\n.diff .r{font-family:var(--mono);font-size:12.5px}\n.up{color:var(--ok)} .down{color:var(--bad)} .flat{color:var(--muted)}\n.qcat{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:rgba(95,168,255,.14);color:var(--sky);padding:2px 8px;border-radius:99px;margin-bottom:8px}\n.qtext{font-size:16px;font-weight:700;margin:0 0 12px;text-wrap:balance}\ncanvas.qcv{display:block;width:100%;border-radius:10px;background:var(--panel2);margin-bottom:12px}\n.lockbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}\n.timer{font-family:var(--mono);font-weight:700;font-size:18px}\n.timer.low{color:var(--bad)}\n.tbar{height:6px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-bottom:12px}\n.tbar i{display:block;height:100%;background:var(--sky);transition:width .25s linear}\n.rules{margin:0 0 4px;padding-left:18px;color:#c3cbe0}\n.rules li{margin:3px 0}\n.opts{display:grid;gap:8px}\n.opt{all:unset;cursor:pointer;border:1px solid var(--line);background:var(--panel2);border-radius:10px;padding:10px 12px;font-weight:600}\n.opt:hover:not([disabled]){border-color:var(--sky)}\n.opt:focus-visible{outline:2px solid var(--sky)}\n.opt[aria-pressed=\"true\"]{border-color:var(--gold);background:rgba(239,176,66,.12)}\n.opt.gone{opacity:.3;text-decoration:line-through;cursor:not-allowed}\n.opt.right{border-color:var(--ok);background:rgba(60,207,142,.12)}\n.opt.wrong{border-color:var(--bad);background:rgba(239,95,95,.12)}\n.row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}\n.btn{all:unset;cursor:pointer;background:var(--gold);color:#1a1205;font-weight:800;padding:8px 14px;border-radius:10px;font-size:13.5px;text-align:center}\n.btn.ghost{background:transparent;color:var(--fg);border:1px solid var(--line)}\n.btn.sky{background:var(--sky);color:#06142a}\n.btn.sm{padding:5px 10px;font-size:12.5px}\n.btn[disabled]{opacity:.4;cursor:not-allowed}\n.btn:focus-visible{outline:2px solid var(--gold2);outline-offset:2px}\n.result{border-radius:12px;padding:12px;margin-top:12px;border:1px solid var(--line);background:var(--panel2)}\n.result.good{border-color:rgba(60,207,142,.5)} .result.badr{border-color:rgba(239,95,95,.5)}\n.result ul{margin:6px 0 0;padding-left:18px}\n.pill{display:inline-block;font-size:11px;font-weight:800;padding:2px 8px;border-radius:99px;letter-spacing:.04em}\n.pill.ok{background:rgba(60,207,142,.15);color:var(--ok)}\n.pill.warn{background:rgba(242,179,61,.15);color:var(--warn)}\n.pill.bad{background:rgba(239,95,95,.15);color:var(--bad)}\n.pill.gold{background:rgba(239,176,66,.18);color:var(--gold2)}\n.pill.burn{background:rgba(255,122,61,.16);color:var(--burn)}\n.pill.sky{background:rgba(95,168,255,.15);color:var(--sky)}\n.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}\n\n/* Boss, tropa, bets */\n.boss{border:1px solid rgba(229,72,77,.55);background:linear-gradient(135deg,rgba(229,72,77,.12),rgba(229,72,77,.02))}\n.boss h3{color:#ff8c8f}\n.tropa{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.tm{border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:8px;text-align:center;min-width:0}\n.tm svg{width:34px;height:42px}\n.tm b{display:block;font-size:13px}\n.market{border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:10px;margin-bottom:10px}\n.bopts{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}\n.bopt{all:unset;cursor:pointer;border:1px solid var(--line);border-radius:8px;padding:5px 9px;font-weight:700;font-size:12.5px;background:var(--panel)}\n.bopt[aria-pressed=\"true\"]{border-color:var(--gold);background:rgba(239,176,66,.14)}\n.bopt small{color:var(--muted);font-family:var(--mono)}\n.news li{margin:6px 0}\n\n/* PvP */\n.moves{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.move{all:unset;cursor:pointer;text-align:center;border:1px solid var(--line);background:var(--panel2);border-radius:10px;padding:10px 4px;font-weight:800}\n.move span{display:block;font-size:24px;line-height:1.1}\n.move[aria-pressed=\"true\"]{border-color:var(--gold);background:rgba(239,176,66,.12)}\n.move:focus-visible{outline:2px solid var(--gold2)}\n.incoming{border:1px solid rgba(239,95,95,.5);background:rgba(239,95,95,.07);border-radius:12px;padding:10px;margin:10px 0}\n.die{display:inline-grid;place-items:center;width:40px;height:40px;background:#f4f1e8;color:#1a1205;font-family:var(--mono);font-weight:800;font-size:20px;margin:0 6px;vertical-align:middle;clip-path:polygon(50% 0,100% 100%,0 100%);padding-top:12px}\n\n/* Shop */\n.shop{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n.item{border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:4px;min-width:0}\n.item .ic{font-size:26px;line-height:1}\n.item b{font-size:14px}\n.item small{color:var(--muted);font-size:11.5px;line-height:1.35}\n.item.owned{border-color:rgba(60,207,142,.5)}\n.pets{display:grid;gap:8px}\n.pet{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line);background:var(--panel2);border-radius:12px;padding:10px}\n.pet .ic{font-size:28px;text-align:center}\n.pet select{width:auto}\n.ebar{height:6px;background:#0c111c;border-radius:99px;overflow:hidden;margin-top:4px;max-width:180px}\n.ebar i{display:block;height:100%;background:var(--ok)}\n.active{border:1px solid rgba(60,207,142,.5);background:rgba(60,207,142,.08);border-radius:12px;padding:10px;margin-bottom:10px}\n\n/* Leaderboard */\n.lb{list-style:none;margin:0;padding:0;max-height:460px;overflow-y:auto}\n.lb li{display:grid;grid-template-columns:26px 30px minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:6px 4px;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;border-radius:8px}\n.lb li:hover{background:var(--panel2)}\n.lb li.me{background:rgba(239,176,66,.1)}\n.lb .rk{font-family:var(--mono);color:var(--muted);text-align:right;font-size:12px}\n.lb .nm{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.lb .nm small{display:block;font-weight:600;color:var(--muted);font-size:11px}\n.lb .fl2{font-family:var(--mono);font-weight:700}\n.lb .st{font-size:11.5px;color:var(--muted);font-family:var(--mono)}\n.lb .grp{display:block;cursor:default;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#b9c6e4;font-weight:800;background:rgba(200,214,240,.08);padding:6px 8px}\n.mini svg{width:26px;height:32px}\n.frags{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}\n.frag{border:1px dashed var(--line);border-radius:8px;padding:8px 4px;text-align:center;font-family:var(--mono);font-size:12px;color:var(--muted);min-width:0;overflow:hidden;text-overflow:ellipsis}\n.frag.have{border-style:solid;border-color:var(--gold);color:var(--gold2);background:rgba(239,176,66,.08);font-weight:700}\n.elev{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}\n.elev div{background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px;text-align:center}\n.elev b{font-family:var(--mono);font-size:18px;color:var(--ok);display:block}\n.elev span{font-size:11px;color:var(--muted)}\n\n/* Forms */\ninput[type=text],input[type=number],input[type=url],input[type=date],input[type=time],select{background:var(--panel2);border:1px solid var(--line);color:var(--fg);border-radius:8px;padding:7px 10px;font:inherit;width:100%;min-width:0}\ninput:focus,select:focus{outline:2px solid var(--gold);outline-offset:0}\n.field{display:flex;flex-direction:column;gap:4px;min-width:0}\n.field label,.flabel{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);font-weight:800}\n.fgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}\n.toggle{display:flex;align-items:center;gap:8px;font-weight:700}\n.toggle input{width:auto;accent-color:var(--gold)}\n.radios{display:flex;flex-wrap:wrap;gap:8px}\n.radio{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);background:var(--panel2);border-radius:10px;padding:8px 10px;cursor:pointer;flex:1 1 180px;min-width:0}\n.radio input{accent-color:var(--gold);margin-top:3px}\n.radio small{display:block;color:var(--muted);font-size:12px}\n.radio:has(input:checked){border-color:var(--gold);background:rgba(239,176,66,.08)}\n.days{display:flex;flex-wrap:wrap;gap:6px}\n.days label{display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:8px;padding:5px 9px;font-weight:700;font-size:12.5px;cursor:pointer}\n.days input{accent-color:var(--gold)}\n.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;margin-top:6px}\n.cal .h{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);text-align:center;font-weight:800}\n.cal .c{border-radius:7px;padding:5px 2px;text-align:center;font-size:11.5px;font-family:var(--mono);border:1px solid transparent;min-width:0}\n.cal .shift{background:rgba(95,168,255,.12);border-color:rgba(95,168,255,.35)}\n.cal .push{background:rgba(239,176,66,.14);border-color:rgba(239,176,66,.45)}\n.cal .hol{background:rgba(239,95,95,.12);border-color:rgba(239,95,95,.45);color:#ffb3b3}\n.cal .reveal{background:rgba(60,207,142,.15);border-color:rgba(60,207,142,.5);color:var(--ok)}\n.cal .off{color:#4f5b76}\n.cal .c i{display:block;font-style:normal;font-size:9.5px;color:var(--muted)}\n.forecast{display:flex;gap:6px;flex-wrap:wrap}\n.forecast span{display:inline-flex;flex-direction:column;align-items:center;border:1px solid var(--line);background:var(--panel2);border-radius:8px;padding:4px 8px;font-size:11px;color:var(--muted);font-weight:700;min-width:44px}\n.forecast span b{font-size:18px;line-height:1.2}\n\n/* Admin */\n.tbl{overflow-x:auto}\ntable{border-collapse:collapse;width:100%;font-size:13px}\nth{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}\ntd{padding:6px 8px;border-bottom:1px solid rgba(255,255,255,.04);white-space:nowrap}\ntd.num,th.num{font-family:var(--mono);text-align:right}\ntd input[type=number]{width:80px}\n.feed{list-style:none;margin:0;padding:0;max-height:280px;overflow-y:auto;font-size:13px}\n.feed li{padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:8px;align-items:center}\n.feed time{font-family:var(--mono);color:var(--muted);font-size:11.5px;flex:none;width:54px}\n.winner{display:flex;gap:12px;align-items:center;background:linear-gradient(135deg,rgba(239,176,66,.18),rgba(239,176,66,.04));border:1px solid rgba(239,176,66,.5);border-radius:12px;padding:12px}\n.winner svg{width:40px;height:50px;flex:none}\n.confirm{margin-top:10px;border:1px solid var(--warn);border-radius:10px;padding:10px;background:rgba(242,179,61,.08)}\n.burnhero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start}\n.bignum{font-family:var(--mono);font-weight:700;font-size:36px;color:var(--burn);line-height:1.05;font-variant-numeric:tabular-nums}\n.bars{display:flex;align-items:flex-end;gap:3px;height:90px;margin-top:8px;border-bottom:1px solid var(--line)}\n.bars div{flex:1;background:linear-gradient(180deg,var(--burn),rgba(255,122,61,.35));border-radius:4px 4px 0 0;position:relative;min-width:0}\n.bars div:hover::after{content:attr(data-v);position:absolute;bottom:100%;left:50%;transform:translateX(-50%);font-size:10.5px;font-family:var(--mono);background:#0b0f18;border:1px solid var(--line);padding:1px 5px;border-radius:5px;white-space:nowrap;z-index:3}\n.barlbl{display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted);font-family:var(--mono);margin-top:3px}\n.sinks{display:grid;gap:6px}\n.sink{display:grid;grid-template-columns:minmax(0,1fr) 70px;gap:8px;align-items:center;font-size:12.5px}\n.sink .sb{height:8px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-top:3px}\n.sink .sb i{display:block;height:100%;background:var(--burn);border-radius:99px}\n.sink .sv{font-family:var(--mono);text-align:right;font-weight:700}\n.slack{border:1px solid var(--line);border-radius:12px;background:#1a1d21;padding:12px;font-size:13.5px}\n.slack .who{display:flex;gap:8px;align-items:center;margin-bottom:6px}\n.slack .who b{font-size:14px}\n.slack .who small{color:var(--muted)}\n.slack .bot{width:30px;height:30px;border-radius:7px;background:var(--gold);display:grid;place-items:center;font-size:16px}\n\n/* Overlays */\n.overlay{position:fixed;inset:0;background:rgba(5,8,15,.82);z-index:40;display:grid;place-items:center;padding:16px}\n.ovl{width:min(520px,100%);max-height:calc(100% - 20px);overflow:auto;background:var(--panel);border:1px solid var(--gold);border-radius:18px;padding:20px;text-align:center}\n.ovl h2{font-family:var(--display);font-size:26px;color:var(--gold);margin:0}\n.rev{list-style:none;margin:14px 0;padding:0;display:flex;flex-direction:column-reverse;gap:6px}\n.rev li{display:grid;grid-template-columns:36px 40px minmax(0,1fr) auto;align-items:center;gap:10px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:8px 10px;text-align:left;animation:rise .6s ease-out}\n.rev li.champ{border-color:var(--gold);background:rgba(239,176,66,.15)}\n.rev li svg{width:34px;height:42px}\n.rev .rk{font-family:var(--display);font-size:22px;color:var(--gold)}\n@keyframes rise{from{opacity:0;transform:translateY(14px)}}\n.wrapped{background:linear-gradient(160deg,#2a1c4a,#141b2a 55%,#3a2410);text-align:left}\n.wgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0}\n.wgrid div{background:rgba(255,255,255,.06);border-radius:12px;padding:10px;min-width:0}\n.wgrid b{display:block;font-family:var(--mono);font-size:20px;color:var(--gold2)}\n.wgrid span{font-size:12px;color:#c3cbe0}\n\n.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) translateY(20px);background:#0b0f18;border:1px solid var(--gold);color:var(--fg);padding:10px 16px;border-radius:12px;font-weight:700;opacity:0;transition:.25s;z-index:60;max-width:calc(100% - 32px)}\n.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}\n\n@media (max-width:1000px){ .statusbar{grid-template-columns:repeat(3,minmax(0,1fr))} }\n@media (max-width:900px){\n  .grid,.burnhero{grid-template-columns:minmax(0,1fr)}\n  .towercol{position:static}\n  .tscroll{height:460px}\n  .statusbar{grid-template-columns:repeat(2,minmax(0,1fr))}\n  .two,.fgrid{grid-template-columns:minmax(0,1fr)}\n}\n@media (max-width:460px){ .diffs{grid-template-columns:minmax(0,1fr)} .hero h1{font-size:24px} .shop{grid-template-columns:minmax(0,1fr)} }\n@media (prefers-reduced-motion:reduce){ .av,.meter i,.tscroll{transition:none;scroll-behavior:auto} .av.flash svg,.av.hit svg,.av.walking svg,.wx,.snow,.rev li,.scene .xl{animation:none!important} }\n";
const HTML = "\n\n<div class=\"wrap\">\n  <section class=\"hero\" aria-label=\"Bayani World Marathon\">\n    <div>\n      <span class=\"prem\">\u2605 Premium game</span><span class=\"xpill\" id=\"xpill\" hidden>\ud83c\udf84 Paskong Karera</span>\n      <h1>BAYANI WORLD MARATHON</h1>\n      <p id=\"heroText\"></p>\n    </div>\n    <div class=\"controls\">\n      \n      <span class=\"lbl\" id=\"demoLbl\">Preview</span>\n      <div class=\"seg\" id=\"demoSeg\" role=\"group\" aria-label=\"Preview point in season\">\n        <button id=\"d12\" aria-pressed=\"true\">Shift 9 \u00b7 Nov 30</button>\n        <button id=\"d27\" aria-pressed=\"false\">Shift 22 \u00b7 Dec 17</button>\n      </div>\n    </div>\n  </section>\n\n  <div class=\"note\" id=\"note\"></div>\n  <div class=\"statusbar\" id=\"statusbar\"></div>\n\n  <div class=\"grid\">\n    <div class=\"towercol\">\n      <div class=\"card\">\n        <div class=\"towerhead\">\n          <h2>World Course</h2>\n          <div class=\"legend\"><span style=\"--c:transparent\">\ud83c\udfca\ud83d\udeb4\ud83c\udfc3 Legs</span><span style=\"--c:transparent\">\u2708\ufe0f Transfer</span><span style=\"--c:#c8d6f0\" id=\"fogLegend\">Fog 90\u2013100</span><span style=\"--c:transparent\">\ud83c\udf81 Mystery</span></div>\n        </div>\n        <div class=\"route\" id=\"routeStrip\"></div><div class=\"tscroll\" id=\"tscroll\"><div class=\"tower\" id=\"tower\"></div></div>\n      </div>\n    </div>\n    <div class=\"stack\" id=\"side\"></div>\n  </div>\n</div>\n<div id=\"ovl\"></div>\n<div class=\"toast\" id=\"toast\" role=\"status\" aria-live=\"polite\"></div>\n\n";

if(!document.getElementById('bmFonts')){
  const l = document.createElement('link'); l.id = 'bmFonts'; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap';
  document.head.appendChild(l);
}

const APPS = {};
function createApp(host, MODE){
const root = host.attachShadow({ mode:'open' });
root.innerHTML = '<style>' + CSS + '</style>' + HTML;

const FH=34;
const NAMES=['Gilda','Winnie','Marco','Jessa','Paolo','Rica','Jomar','Aileen','Kevin','Trisha','Dindo','Mae','Arnel','Bea','Carlo','Joy','Rommel','Liza','Nico','Faye','Jun','Shiela','Ivan','Cherry','Tonyo','Grace'];
const ME='Jessa';
const SKIN=['#f1c27d','#e0ac69','#c68642','#8d5524','#ffdbac'];
const HAIR=['#1b1b1b','#3b2416','#6b3e1f','#a0522d','#d4a017','#7b3fa0'];
const OUT=['#2f6fdf','#e05a47','#2fa36b','#e8a93a','#8b5cf6','#ec4899','#14b8a6','#475569'];
const ACC=['headset','cap','bow',null,'headset','glasses'];
const RIDE_ICONS=[null,null,null,'🤿','🚴','👟','⚡','🐕','🐎','🦜',null,null];
let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};

const SHIFT={12:9,27:22};
let players=NAMES.map((n,i)=>{
  const f12=6+Math.floor(rnd()*31),c12=5+Math.floor(rnd()*5);
  return {id:i,name:n,skin:SKIN[i%5],hair:HAIR[Math.floor(rnd()*6)],style:Math.floor(rnd()*3),outfit:OUT[Math.floor(rnd()*8)],acc:ACC[Math.floor(rnd()*6)],
    floor:{12:f12,27:Math.min(99,Math.round(f12*2.55+rnd()*8))},
    climbs:{12:c12,27:Math.min(22,Math.round(c12/9*22+(rnd()*3-1)))},
    streak:{12:Math.floor(rnd()*6),27:Math.floor(rnd()*9)},
    spent:{12:60+Math.floor(rnd()*260),27:260+Math.floor(rnd()*620)},
    ride:{12:RIDE_ICONS[Math.floor(rnd()*12)],27:RIDE_ICONS[Math.floor(rnd()*12)]}};
});
let me=players.find(p=>p.name===ME);
const byName=n=>players.find(p=>(p.demoName||p.name)===n)||players.find(p=>p!==me)||me;
function resetMe(){Object.assign(me,{floor:{12:22,27:88},climbs:{12:8,27:21},streak:{12:4,27:9},spent:{12:185,27:640},ride:{12:null,27:null},acc:'headset',outfit:'#e8a93a',style:1})}
resetMe();
const CLIMBS_TEAM={12:246,27:520};
const BONUS={12:40,27:100};
const BURN_BASE={12:{entry:1300,hints:465,second:330,extra:1240,auction:1520,vehicles:2380,pets:1110,pvp:640,bets:420,kahon:610,pranks:385,cosmetics:1450},
                 27:{entry:1300,hints:1420,second:930,extra:3640,auction:4310,vehicles:6520,pets:3240,pvp:1830,bets:1460,kahon:1980,pranks:1190,cosmetics:4870}};
const SINK_LABEL={entry:'Entrance fees',hints:'Hints',second:'Second Chances',extra:'Extra climbs',auction:'Fast-pass auction',vehicles:'Vehicles',pets:'Pet rides',pvp:'PvP losing stakes',bets:'Pustahan house cut',kahon:'Mystery boxes',pranks:'Kalokohan pranks',cosmetics:'Marathon cosmetics'};
const DAILY_BURN=[1310,980,1105,1310,1180,1440,1060,1215,1360,1490,1380,1540,1620,1405,1700,1810,1930,2080,1990,2140,2310,2460];

const WEATHER={
  clear:{icon:'☀️',name:'Maaliwalas',en:'Clear',fx:'Normal climbing.'},
  rain:{icon:'🌧️',name:'Ulan',en:'Rain',fx:'Wrong answers lose 1 extra step. Racing shoes and Mingming ignore it.'},
  wind:{icon:'🌬️',name:'Habagat',en:'Tailwind',fx:'Correct answers climb +1 extra step.'},
  storm:{icon:'⛈️',name:'Bagyo',en:'Storm',fx:'Energy gels wasted. Correct Hard answers +2 extra.'},
  heat:{icon:'🔥',name:'Init',en:'Heatwave',fx:'Pet rides use double energy.'}
};
const VEH={
  fins:{icon:'🤿',name:'Swim fins',leg:'swim',bonus:2,shifts:3,cost:40,note:'Swim legs only'},
  bike:{icon:'🚴',name:'Carbon bike',leg:'bike',bonus:2,shifts:3,cost:70,note:'Bike legs only'},
  shoes:{icon:'👟',name:'Racing shoes',leg:'run',bonus:2,shifts:3,cost:60,note:'Run legs only · grip ignores rain'},
  gel:{icon:'⚡',name:'Energy gel',leg:'any',bonus:3,shifts:1,cost:80,note:'Any leg · wasted in Bagyo'}
};
const MYPETS=[
  {key:'bantay',icon:'🐕',name:'Bantay',level:'Adult · Lv 34',lv:34,energy:80,perk:'Blocks 1 PvP dice knockback per ride',bonus:2},
  {key:'kidlat',icon:'🐎',name:'Kidlat',level:'Adult · Lv 31',lv:31,energy:55,perk:'Climbs +1 more on Hard answers',bonus:2},
  {key:'mingming',icon:'🐈',name:'Mingming',level:'Teen · Lv 18',lv:18,energy:100,perk:'Ignores rain penalty',bonus:2}
];
const PRANKS={
  saging:{icon:'🍌',name:'Balat ng saging',fx:'Target slips 1 step on their next climb.',cost:35},
  ulap:{icon:'🌩️',name:'Bagyo cloud',fx:'Target\'s next wrong answer costs 1 extra step.',cost:50}
};
const COSMETICS={
  aura:{icon:'✨',name:'Gintong Aura',fx:'Golden glow around your avatar on the course.',cost:150},
  parol:{icon:'⭐',name:'Parol Hat',fx:'A glowing parol on your head.',cost:120},
  goldtri:{icon:'🚴',name:'Golden Bike skin',fx:'Your Carbon bike shows in gold.',cost:200},
  trail:{icon:'☁️',name:'Ulap Trail',fx:'A cloud follows you along the course.',cost:100}
};
const COUNTRIES={
  PH:{flag:'🇵🇭',name:'Philippines',city:'El Nido',lm:'karst',water:'#118fa3',land:'#2d6f4c',land2:'#3f7d3d'},
  JP:{flag:'🇯🇵',name:'Japan',city:'Kyoto',lm:'fuji',water:'#1f6f9e',land:'#3d5f52',land2:'#5a6e3e'},
  KR:{flag:'🇰🇷',name:'South Korea',city:'Seoul',lm:'namsan',water:'#1f6a98',land:'#3d5a4c',land2:'#556b40'},
  AU:{flag:'🇦🇺',name:'Australia',city:'Sydney',lm:'opera',water:'#1683b0',land:'#8a5a2e',land2:'#a06a35'},
  US:{flag:'🇺🇸',name:'USA',city:'New York',lm:'liberty',water:'#22648f',land:'#3e5a44',land2:'#566343'},
  GB:{flag:'🇬🇧',name:'UK',city:'London',lm:'bigben',water:'#2a5f86',land:'#3f6648',land2:'#4f7444'},
  FR:{flag:'🇫🇷',name:'France',city:'Paris',lm:'eiffel',water:'#26709c',land:'#456a3f',land2:'#6a7a3e'},
  CH:{flag:'🇨🇭',name:'Switzerland',city:'Zermatt',lm:'alps',water:'#2a7aa6',land:'#3c6d57',land2:'#4f7b4a'},
  IT:{flag:'🇮🇹',name:'Italy',city:'Rome',lm:'colosseum',water:'#1d79a8',land:'#7a6b3c',land2:'#8a7a44'},
  GR:{flag:'🇬🇷',name:'Greece',city:'Athens',lm:'parthenon',water:'#1a7fc0',land:'#8c7a4e',land2:'#9a8a55'},
  EG:{flag:'🇪🇬',name:'Egypt',city:'Giza',lm:'pyramids',water:'#2a7e9e',land:'#a8844c',land2:'#b8955a'}
};
const RAIL=['FR-CH','FR-IT','CH-IT','FR-GB'],SEA=['IT-GR','JP-KR','GR-EG','IT-EG','US-GB','PH-JP'];
const MODES={plane:{icon:'✈️',name:'Plane',twist:'Gear keeps its time: your gear does not lose a shift on travel day.'},
  train:{icon:'🚄',name:'Train',twist:'Scenic ride: +1 free step on arrival.'},
  cruise:{icon:'🚢',name:'Cruise',twist:'Rest on board: your pets get +40 energy on arrival.'}};
const pairIn=(L2,a1,b1)=>L2.includes(a1+'-'+b1)||L2.includes(b1+'-'+a1);
function travelMode(a1,b1){return pairIn(RAIL,a1,b1)?'train':pairIn(SEA,a1,b1)?'cruise':'plane'}
function hopMode(i){const c=S.settings.countries;return S.settings.hops[i]||travelMode(c[i],c[i+1])}
const MYST_TYPES={
  kahon:{icon:'🎁',name:'Kahon',fx:'Mystery box. Pay to open it.'},
  saging:{icon:'🍌',name:'Balat ng saging',fx:'Slip down 1 step.'},
  karinderya:{icon:'🥤',name:'Water station',fx:'Your pets get +40 energy.'},
  hagdan:{icon:'🛴',name:'Shortcut',fx:'Secret shortcut: +3 steps.'}
};
const MYST={};
(function(){let s2=99;const r=()=>{s2=(s2*16807)%2147483647;return (s2-1)/2147483646};const ks=Object.keys(MYST_TYPES);
  for(let f=3;f<99;f++)if(r()<0.2)MYST[f]=ks[Math.floor(r()*4)];
  [20,21,22,23,27,29,88,89,90,91,94,96,97,98].forEach(f=>delete MYST[f]);
  Object.assign(MYST,{24:'saging',25:'kahon',26:'hagdan',28:'karinderya',92:'kahon',93:'saging',95:'hagdan'});})();
const FOUND_BASE={12:[11,15,18,25,31],27:[11,15,18,25,31,44,52,63,71,80]};

const S={view:'player',day:12,tokens:310,climbsTeam:{...CLIMBS_TEAM},atab:'overview',ptab:'climb',
  settings:{prizeMode:'pot',fixed:500,base:150,per:0.5,bonus:20,bonusPct:80,cap:500,cp2:300,cp3:150,cpMerit:50,cpStart:5,prices:{hint:15,second:30,extra:40,kahon:25},phpCap:1000,phpCapOn:true,elig:80,fee:50,lateJoin:3,
    start:'2026-11-16',length:25,days:[1,2,3,4,5],holidayMode:'extend',leaves:true,hook:'',theme:'auto',
    holidays:[{d:'2026-11-26',label:'Thanksgiving',who:'All US clients'},{d:'2026-11-27',label:'Day after Thanksgiving',who:'Some clients'},{d:'2026-12-25',label:'Christmas Day',who:'All US clients'}],
    weatherMode:'auto',weatherManual:'storm',weights:{clear:40,rain:20,wind:20,storm:10,heat:10},
    ride:{cost:30,energy:40,minLv:30},pvp:{stake:10,range:5,dice:3,win:1,perShift:1,maxIn:2,auto:true,bounty:30,revenge:5},
    countries:['JP','FR','IT','GR'],hops:[null,null,null],pranksOn:true,prankLimit:1,mystDensity:20,kahonCost:25,bossDay:'Thursday',bossNeed:70,bossReward:2,tropaSize:3,tropaBonus:1,
    betCut:20,betMax:50,balitaOn:true,balitaTime:'04:50',wrappedOn:true,revealDate:'Dec 23, 9:30 PM',
    ac:{timer:60,strikes:2,fullscreen:true,image:true,shuffle:true,watermark:true,fast:4},burnTarget:32000},
  chal:null,usedSecond:false,extraBought:false,bid:null,feed:[],ride:null,pets:JSON.parse(JSON.stringify(MYPETS)),
  pvp:null,burnLive:{},flags:[],found:new Set(),owned:new Set(),equipped:new Set(),pranked:null,prankUsed:false,
  tropa:{nico:false,bonus:false},boss:{answered:false,pick:null,pct:64},bets:{}};
function resetBurn(){S.burnLive={};Object.keys(SINK_LABEL).forEach(k=>S.burnLive[k]=0)}
resetBurn();
function freshChal(){return {stage:'pick',diff:null,q:null,hidden:[],picked:null,correct:null,strikes:0}}
function freshPvp(){return {sent:false,move:null,target:null,incoming:true,log:''}}
S.chal=freshChal();S.pvp=freshPvp();
S.ladder=[{key:'summit',icon:'🏅',name:'Bayani World Marathon',every:null,prizes:[500]},{key:'city',icon:'🏙️',name:'Bayani City',every:2,prizes:[300]},{key:'race',icon:'🐾',name:'Pet Race',every:2,prizes:[300,150,50]},{key:'bingo',icon:'🎱',name:'BINGO Blackout',every:2,prizes:[250]}];

const DIFF={easy:{label:'Madali',en:'Easy',up:1,down:0},medium:{label:'Katamtaman',en:'Medium',up:2,down:-1},hard:{label:'Mahirap',en:'Hard',up:4,down:-2}};
const QB={
 easy:[{cat:'Pattern',q:'What comes next?  2, 6, 12, 20, 30, …',opts:['36','40','42','44'],a:2,why:'The gaps grow by 2 each time (+4, +6, +8, +10), so the next gap is +12.'},
       {cat:'Word scramble',q:'Unscramble these letters:  N · A · Y · B · I · A',opts:['BANAYI','BAYANI','YABANI','BAYNIA'],a:1,why:'B-A-Y-A-N-I.'}],
 medium:[{cat:'Bugtong',q:'Isang prinsesa, nakaupo sa tasa. Ano ito?',opts:['Mangga','Kasoy','Bayabas','Saging'],a:1,why:'The cashew nut sits on top of its fruit, like a princess seated on a cup.'},
         {cat:'VA scenario',q:'3:00 AM. A client emails: "Need the report ASAP." You are still waiting on data from another team. Best first move?',opts:['Wait for the data, then send the full report','Reply now: acknowledge, give a specific ETA, and say what you are waiting on','Forward it to your team lead','Reply "Noted."'],a:1,why:'The client learns you saw it and when to expect it. Silence reads as being ignored.'}],
 hard:[{cat:'Logic',q:'Ana, Ben and Cora each handle one task: calls, email, or scheduling. Ana does not do calls. Cora does neither email nor calls. Who handles calls?',opts:['Ana','Ben','Cora','Not enough info'],a:1,why:'Cora must do scheduling, so Ana does email, which leaves calls for Ben.'},
       {cat:'Quick math',q:'A clock reads 3:15. What is the smaller angle between the hour and minute hands?',opts:['0°','7.5°','15°','22.5°'],a:1,why:'The minute hand is at 90°. The hour hand has moved a quarter of the way from 3 to 4: 90° + 7.5°.'}]
};
const BOSSQ={q:'I am an odd number. Take away one letter and I become even. What number am I?',opts:['Three','Seven','Five','Nine'],a:1,why:'Take the S off SEVEN and you get EVEN.'};
const FRAGS=['ANG','TUNAY','NA','BAYANI','AY','GISING','KAHIT','HATING','GABI','!'];
const MOVES={bato:{i:'✊',n:'Bato'},papel:{i:'✋',n:'Papel'},gunting:{i:'✌️',n:'Gunting'}};
const BEATS={bato:'gunting',gunting:'papel',papel:'bato'};
const TITLES=[[100,'Kampeon ng Mundo'],[90,'Alamat ng Takbo'],[75,'Iron Bayani'],[50,'Mandirigma'],[25,'Mananakbo'],[0,'Baguhan']];
const titleOf=f=>TITLES.find(([m])=>f>=m)[1];

const $=s=>root.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const peso=n=>'₱'+Math.round(n).toLocaleString('en-PH');
const num=n=>Math.round(n).toLocaleString('en-US');
function toast(msg){const t=$('#toast');t.textContent=realize(msg);t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
function spend(amount,sink){S.tokens-=amount;S.burnLive[sink]+=amount;me.spent[S.day]+=amount}

function avatarSVG(p){
  if(p.pid&&!p.ghost&&typeof window.avatarHtml==='function'){const h=realAvatar(p.pid);if(h)return h;}
  const h=p.hair,o=p.outfit;
  let hair=`<path d="M10 16 Q10 6 20 6 Q30 6 30 16 Q26 11 20 11 Q14 11 10 16Z" fill="${h}"/>`;
  if(p.style===1)hair+=`<path d="M10 15 Q8 27 13 31 L13 16Z M30 15 Q32 27 27 31 L27 16Z" fill="${h}"/>`;
  if(p.style===2)hair+=`<circle cx="20" cy="5" r="4" fill="${h}"/>`;
  let acc='';
  if(p.acc==='headset')acc=`<path d="M9.5 17 Q9.5 4 20 4 Q30.5 4 30.5 17" stroke="#101418" stroke-width="2" fill="none"/><rect x="7.5" y="14" width="4" height="7" rx="1.5" fill="#101418"/><rect x="28.5" y="14" width="4" height="7" rx="1.5" fill="#101418"/><path d="M9.5 21 Q10.5 25.5 16 25" stroke="#101418" stroke-width="1.5" fill="none"/>`;
  if(p.acc==='cap')acc=`<path d="M10 12 Q10 4 20 4 Q30 4 30 12Z" fill="${o}"/><rect x="20" y="10" width="13" height="3" rx="1.5" fill="${o}"/>`;
  if(p.acc==='bow')acc=`<path d="M24 7 L30 3 L30 11Z M24 7 L18 3 L18 11Z" fill="#ff6fa8"/><circle cx="24" cy="7" r="1.6" fill="#d63d7c"/>`;
  if(p.acc==='glasses')acc=`<circle cx="16.5" cy="18" r="3" fill="none" stroke="#101418" stroke-width="1.2"/><circle cx="23.5" cy="18" r="3" fill="none" stroke="#101418" stroke-width="1.2"/><path d="M19.5 18 H20.5" stroke="#101418"/>`;
  const parol=(p===me&&S.equipped.has('parol'))?`<path d="M20 -1 L22.5 4.5 L28.5 4.5 L23.6 8 L25.5 13.5 L20 10.2 L14.5 13.5 L16.4 8 L11.5 4.5 L17.5 4.5Z" fill="#ffd27a" stroke="#e5484d" stroke-width=".8"/>`:'';
  return `<svg viewBox="0 -2 40 52" aria-hidden="true"><ellipse cx="20" cy="48" rx="11" ry="2" fill="rgba(0,0,0,.35)"/><rect x="14" y="40" width="5" height="8" rx="2" fill="#1f2937"/><rect x="21" y="40" width="5" height="8" rx="2" fill="#1f2937"/><rect x="5" y="29" width="8" height="13" rx="2.5" fill="#8b5a2b" stroke="#4a2c12" stroke-width=".8"/><path d="M9 44 Q9 28 20 28 Q31 28 31 44Z" fill="${o}"/><path d="M13 30 L16 42" stroke="#4a2c12" stroke-width="1.4"/><circle cx="20" cy="17" r="10" fill="${p.skin}"/>${hair}<circle cx="16.5" cy="18" r="1.3" fill="#1a1a1a"/><circle cx="23.5" cy="18" r="1.3" fill="#1a1a1a"/><path d="M17.5 22 Q20 24 22.5 22" stroke="#1a1a1a" stroke-width="1" fill="none"/>${acc}${parol}</svg>`;
}

const fl=p=>p.floor[S.day];
const isAdmin=()=>S.view==='admin';
const fogged=p=>!isAdmin()&&p!==me&&fl(p)>=90;
const sched=()=>SHIFT[S.day];
const elig=p=>p.elig!=null?p.elig:Math.round(p.climbs[S.day]/sched()*100);
const pot=()=>LIVE?LD.pot:S.settings.prizeMode==='fixed'?S.settings.fixed:Math.min(S.settings.cap,S.settings.base+S.settings.per*S.climbsTeam[S.day]+BONUS[S.day]);
const DEMO_WX={12:'rain',27:'wind'};
const wxNow=()=>LIVE?LD.season.weather:S.settings.weatherMode==='manual'?S.settings.weatherManual:DEMO_WX[S.day];
const rideIcon=p=>{if(p!==me)return p.ride[S.day];if(!S.ride)return null;return S.ride.key==='bike'&&S.equipped.has('goldtri')?'🌟🚴':S.ride.icon};
const safeFloor=f=>[75,50,25,0].find(x=>x<=f);
const leader=()=>[...players].filter(p=>!p.ghost).sort((a,b)=>fl(b)-fl(a))[0];
function burnTotals(){const b=BURN_BASE[S.day],o={};let t=0;for(const k in b){o[k]=b[k]+S.burnLive[k];t+=o[k]}return {o,t}}
const found=f=>FOUND_BASE[S.day].includes(f)||S.found.has(f);
const pushOn=()=>sched()>S.settings.length-5;

/* ---------- Season calendar ---------- */
function isoUTC(y,m,d){return new Date(Date.UTC(y,m-1,d))}
function fmtD(iso){return iso?new Date(iso+'T00:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}):'–'}
function seasonCalc(){
  const s=S.settings;const [y,m,d]=s.start.split('-').map(Number);
  let dt=isoUTC(y,m,d);const hol=new Map(s.holidays.map(h=>[h.d,h]));
  let count=0,skipped=0,optional=0,guard=0;const days=[];
  while(count<s.length&&guard<500){guard++;
    const iso=dt.toISOString().slice(0,10),wd=dt.getUTCDay();let type='off',n=null,label='';
    if(s.days.includes(wd)){
      if(hol.has(iso)){type='hol';label=hol.get(iso).label;if(s.holidayMode==='extend')skipped++;else{count++;n=count;optional++}}
      else{type='shift';count++;n=count}
    }
    days.push({iso,wd,type,n,label});dt=new Date(dt.getTime()+864e5);
  }
  let rv=null;for(let k=0;k<10;k++){const iso=dt.toISOString().slice(0,10);if(s.days.includes(dt.getUTCDay())&&!hol.has(iso)){rv=iso;break}dt=new Date(dt.getTime()+864e5)}
  return {days,end:days.length?days[days.length-1].iso:s.start,reveal:rv,skipped,optional};
}
function shiftDate(n){const d=seasonCalc().days.find(x=>x.n===n);return d?d.iso:null}
function paskoOn(){const t=S.settings.theme;if(t==='pasko')return true;if(t==='none')return false;const d=shiftDate(sched());return !!d&&d>='2026-12-01'}
function forecast(week){let s2=week*97+13;const r=()=>{s2=(s2*16807)%2147483647;return (s2-1)/2147483646};
  const w=S.settings.weights,keys=Object.keys(w),tot=keys.reduce((a,k)=>a+(+w[k]||0),0)||1;
  return ['Mon','Tue','Wed','Thu','Fri'].map(d=>{let x=r()*tot;for(const k of keys){x-=(+w[k]||0);if(x<=0)return [d,k]}return [d,'clear']})}

/* ---------- Mountain ---------- */
const avEls={};let G=null;const TOP=120;
function seedRand(n){let s3=n;return ()=>{s3=(s3*16807)%2147483647;return (s3-1)/2147483646}}
function geo(){
  const W=Math.max(280,$('#tscroll').clientWidth-2),cx=W/2,hw=W/2-44;
  const y=f=>TOP+(100-f)*FH;
  const x=f=>{const k=Math.floor(f/10),t=(f%10)/10;let u=k%2===0?t:1-t;u=u*u*(3-2*u);return cx+(u*2-1)*hw*0.62};
  return {W,H:TOP+101*FH+30,cx,x,y};
}
const legOf=f=>{if(f>=100)return 'finish';const s2=f%25;return s2<6?'swim':s2<17?'bike':'run'};
const LEGS={swim:{icon:'🏊',n:'Swim'},bike:{icon:'🚴',n:'Bike'},run:{icon:'🏃',n:'Run'}};
const ctyOf=f=>COUNTRIES[S.settings.countries[Math.min(3,Math.floor(f/25))]];
function landmark(k,bx,by,h){
  const c='#0a0f1f';let o='';
  if(k==='fuji')o=`<path d="M${bx-80} ${by} L${bx-16} ${by-h} L${bx+16} ${by-h} L${bx+80} ${by}Z" fill="${c}"/><path d="M${bx-16} ${by-h} L${bx+16} ${by-h} L${bx+30} ${by-h*.72} L${bx+12} ${by-h*.8} L${bx} ${by-h*.7} L${bx-12} ${by-h*.8} L${bx-30} ${by-h*.72}Z" fill="#e9eef8" opacity=".8"/>`;
  if(k==='eiffel')o=`<path d="M${bx-26} ${by} Q${bx-6} ${by-h*.45} ${bx-2} ${by-h} L${bx+2} ${by-h} Q${bx+6} ${by-h*.45} ${bx+26} ${by} L${bx+14} ${by} Q${bx} ${by-h*.22} ${bx-14} ${by}Z" fill="${c}"/><rect x="${bx-15}" y="${by-h*.36}" width="30" height="4" fill="${c}"/><rect x="${bx-9}" y="${by-h*.62}" width="18" height="3" fill="${c}"/><path d="M${bx} ${by-h} V${by-h-12}" stroke="${c}" stroke-width="2"/>`;
  if(k==='colosseum'){o=`<path d="M${bx-70} ${by} V${by-h*.55} Q${bx} ${by-h*.7} ${bx+70} ${by-h*.45} V${by}Z" fill="${c}"/>`;for(let r2=0;r2<3;r2++)for(let i=0;i<9;i++)o+=`<rect x="${bx-62+i*14}" y="${by-h*.5+r2*h*.15+ (i*1.2)}" width="7" height="${h*.09}" rx="3" fill="#2a3352"/>`}
  if(k==='parthenon'){o=`<path d="M${bx-64} ${by-h*.62} L${bx} ${by-h} L${bx+64} ${by-h*.62}Z" fill="${c}"/><rect x="${bx-66}" y="${by-h*.64}" width="132" height="8" fill="${c}"/><rect x="${bx-70}" y="${by-10}" width="140" height="10" fill="${c}"/>`;for(let i=0;i<8;i++)o+=`<rect x="${bx-60+i*16.5}" y="${by-h*.56}" width="8" height="${h*.56-10}" fill="${c}"/>`}
  if(k==='pyramids')o=`<path d="M${bx-90} ${by} L${bx-30} ${by-h} L${bx+30} ${by}Z" fill="${c}"/><path d="M${bx-10} ${by} L${bx+35} ${by-h*.7} L${bx+80} ${by}Z" fill="${c}" opacity=".85"/>`;
  if(k==='opera')o=`<rect x="${bx-80}" y="${by-8}" width="160" height="8" fill="${c}"/>`+[[-60,.55],[-28,.8],[6,1],[40,.7]].map(([dx,sc])=>`<path d="M${bx+dx} ${by-8} Q${bx+dx+4} ${by-8-h*sc} ${bx+dx+34} ${by-8-h*sc*.95} Q${bx+dx+22} ${by-8-h*sc*.4} ${bx+dx+34} ${by-8}Z" fill="${c}"/>`).join('');
  if(k==='liberty')o=`<rect x="${bx-22}" y="${by-h*.4}" width="44" height="${h*.4}" fill="${c}"/><rect x="${bx-8}" y="${by-h*.85}" width="16" height="${h*.45}" rx="5" fill="${c}"/><circle cx="${bx}" cy="${by-h*.9}" r="7" fill="${c}"/><path d="M${bx+6} ${by-h*.8} L${bx+16} ${by-h*1.08}" stroke="${c}" stroke-width="4"/><circle cx="${bx+17}" cy="${by-h*1.12}" r="4" fill="#ffd27a"/>`;
  if(k==='alps')o=`<path d="M${bx-110} ${by} L${bx-60} ${by-h*.7} L${bx-30} ${by-h*.4} L${bx} ${by-h} L${bx+40} ${by-h*.5} L${bx+70} ${by-h*.75} L${bx+110} ${by}Z" fill="${c}"/><path d="M${bx} ${by-h} L${bx-14} ${by-h*.8} L${bx+12} ${by-h*.78}Z M${bx-60} ${by-h*.7} L${bx-70} ${by-h*.58} L${bx-50} ${by-h*.58}Z" fill="#e9eef8" opacity=".8"/>`;
  if(k==='karst')o=`<path d="M${bx-100} ${by} Q${bx-90} ${by-h} ${bx-55} ${by-h*.9} Q${bx-40} ${by-h*.5} ${bx-30} ${by} Z M${bx-20} ${by} Q${bx-10} ${by-h*1.1} ${bx+25} ${by-h} Q${bx+45} ${by-h*.6} ${bx+50} ${by}Z" fill="${c}"/><path d="M${bx+75} ${by} Q${bx+70} ${by-h*.4} ${bx+80} ${by-h*.6}" stroke="${c}" stroke-width="3" fill="none"/><path d="M${bx+80} ${by-h*.6} q-16 -2 -22 8 M${bx+80} ${by-h*.6} q14 -6 22 4 M${bx+80} ${by-h*.6} q2 -12 12 -16" stroke="${c}" stroke-width="3" fill="none"/>`;
  if(k==='namsan')o=`<path d="M${bx-90} ${by} Q${bx} ${by-h*.5} ${bx+90} ${by}Z" fill="${c}"/><rect x="${bx-3}" y="${by-h*1.05}" width="6" height="${h*.8}" fill="${c}"/><ellipse cx="${bx}" cy="${by-h*.85}" rx="10" ry="6" fill="${c}"/>`;
  if(k==='bigben')o=`<rect x="${bx-12}" y="${by-h*.85}" width="24" height="${h*.85}" fill="${c}"/><circle cx="${bx}" cy="${by-h*.7}" r="8" fill="#ffd27a" opacity=".8"/><path d="M${bx-12} ${by-h*.85} L${bx} ${by-h*1.12} L${bx+12} ${by-h*.85}Z" fill="${c}"/><rect x="${bx-90}" y="${by-h*.35}" width="76" height="${h*.35}" fill="${c}"/>`;
  return o;
}
function sceneSVG(g){
  const {W,H,cx,x,y}=g,r=seedRand(42),C=S.settings.countries.map(k=>COUNTRIES[k]);
  let o=`<svg class="scene" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs>
   <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050816"/><stop offset="1" stop-color="#16244d"/></linearGradient>
   <radialGradient id="mglow"><stop offset="0" stop-color="#fff3c2" stop-opacity=".45"/><stop offset="1" stop-color="#fff3c2" stop-opacity="0"/></radialGradient>
   <pattern id="checker" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fff"/><rect width="5" height="5" fill="#111"/><rect x="5" y="5" width="5" height="5" fill="#111"/></pattern></defs>
   <rect width="${W}" height="${y(100)}" fill="url(#sky)"/>`;
  for(let i=0;i<40;i++)o+=`<circle cx="${(r()*W).toFixed(1)}" cy="${(r()*(y(100)-10)).toFixed(1)}" r="${(.5+r()).toFixed(2)}" fill="#fff" opacity="${(.3+r()*.6).toFixed(2)}"/>`;
  o+=`<circle cx="${W-44}" cy="44" r="40" fill="url(#mglow)"/><circle cx="${W-44}" cy="44" r="15" fill="#fdf1c7"/>`;
  // country segments
  C.forEach((c,i)=>{const lo=i*25,hi=lo+25;
    const yr=(a,b)=>[y(b),y(a)-y(b)];
    // night tint over everything so it still reads as overnight
    let [ty,th]=yr(lo+17,hi);o+=`<rect x="0" y="${ty}" width="${W}" height="${th}" fill="${c.land}"/>`;
    o+=landmark(c.lm,W-86,y(lo+21.5),FH*4.2);
    [ty,th]=yr(lo+6,lo+17);o+=`<rect x="0" y="${ty}" width="${W}" height="${th}" fill="${c.land2}"/>`;
    for(let k=0;k<26;k++){const bx=r()*W,by=ty+r()*th;o+=`<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${(3+r()*7).toFixed(1)}" fill="#000" opacity=".12"/>`}
    [ty,th]=yr(lo,lo+6);o+=`<rect x="0" y="${ty}" width="${W}" height="${th+(i===0?FH+30:0)}" fill="${c.water}"/>`;
    for(let yy=ty+10;yy<ty+th;yy+=14)o+=`<path d="M0 ${yy} q 15 -5 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0" stroke="#fff" stroke-opacity=".18" stroke-width="1.4" fill="none"/>`;
    // leg labels
    [['swim',lo+3],['bike',lo+11.5],['run',lo+19.5]].forEach(([lg,f])=>{o+=`<text x="8" y="${y(f)+4}" class="lg">${LEGS[lg].icon} ${LEGS[lg].n.toUpperCase()}</text>`});
    // country pill
    o+=`<rect x="6" y="${y(hi)+30}" width="${Math.min(W-12,150)}" height="22" rx="11" fill="#0b0f18" fill-opacity=".78" stroke="#efb042" stroke-opacity=".7"/><text x="16" y="${y(hi)+45}" class="cty">${c.flag} ${c.name.toUpperCase()} · ${c.city}</text>`;
  });
  o+=`<rect width="${W}" height="${H}" fill="#050816" opacity=".22"/>`;
  // trail per leg
  const seg=(a,b2)=>{let d='';for(let f=a;f<=b2+1e-6;f+=.25)d+=(f===a?'M':' L')+x(f).toFixed(1)+' '+y(f).toFixed(1);return d};
  for(let i=0;i<4;i++){const lo=i*25;
    const sw=seg(lo,lo+6),bk=seg(lo+6,lo+17),rn=seg(lo+17,lo+25);
    o+=`<path d="${sw}" fill="none" stroke="#e8f6ff" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round"/>`;
    for(let f=lo+.5;f<lo+6;f+=1)o+=`<circle cx="${x(f).toFixed(1)}" cy="${y(f).toFixed(1)}" r="3" fill="#ff8a3d"/>`;
    o+=`<path d="${bk}" fill="none" stroke="#14171d" stroke-opacity=".6" stroke-width="12" stroke-linecap="round"/><path d="${bk}" fill="none" stroke="#3a3f4a" stroke-width="9" stroke-linecap="round"/><path d="${bk}" fill="none" stroke="#ffd27a" stroke-width="1.4" stroke-dasharray="6 6"/>`;
    o+=`<path d="${rn}" fill="none" stroke="#24180e" stroke-opacity=".55" stroke-width="8" stroke-linecap="round"/><path d="${rn}" fill="none" stroke="#e6cf9c" stroke-width="4.5" stroke-linecap="round"/>`;
  }
  // xmas lights
  o+=`<g id="xlights" style="display:none">`;const LC=['#ff4d4d','#ffd27a','#4dd27a','#5fa8ff'];let li=0;
  for(let f=.6;f<100;f+=1.4){o+=`<circle cx="${(x(f)+(li%2?4:-4)).toFixed(1)}" cy="${(y(f)-5).toFixed(1)}" r="2.3" fill="${LC[li%4]}" class="xl"/>`;li++}
  o+=`</g>`;
  // markers
  for(let f=5;f<100;f+=5){if(f%25===0)continue;const right=x(f)>cx;o+=`<circle cx="${x(f)}" cy="${y(f)}" r="${f%10?2:3}" fill="#fff" opacity=".85"/><text x="${x(f)+(right?-9:9)}" y="${y(f)+4}" text-anchor="${right?'end':'start'}" class="mk">${f}</text>`}
  // transfers
  [1,2,3].forEach(i=>{const f=i*25,m=MODES[hopMode(i-1)],a1=C[i-1],b1=C[i];const yy=y(f);
    o+=`<rect x="0" y="${yy-15}" width="${W}" height="30" fill="#0b0f18" fill-opacity=".72"/><path d="M14 ${yy+8} Q${cx} ${yy-26} ${W-14} ${yy+8}" stroke="#ffd27a" stroke-opacity=".55" stroke-dasharray="4 5" fill="none"/>
      <text x="${cx}" y="${yy+5}" text-anchor="middle" class="trf">${m.icon} TRANSFER ${f} · ${a1.flag} ${a1.name} → ${b1.flag} ${b1.name}</text>
      <g class="xm" style="display:none"><text x="${W-18}" y="${yy+6}" text-anchor="middle" style="font-size:14px">⭐</text></g>`});
  // start + finish
  o+=`<rect x="${x(0)-46}" y="${y(0)+8}" width="92" height="17" rx="4" fill="#efb042"/><text x="${x(0)}" y="${y(0)+20}" text-anchor="middle" class="camp">START · ${C[0].city.toUpperCase()}</text>`;
  const fx=x(100),fy=y(100);
  o+=`<rect x="${fx-62}" y="${fy-58}" width="6" height="58" fill="#ddd"/><rect x="${fx+56}" y="${fy-58}" width="6" height="58" fill="#ddd"/><rect x="${fx-66}" y="${fy-70}" width="132" height="22" rx="3" fill="url(#checker)"/><rect x="${fx-56}" y="${fy-67}" width="112" height="16" rx="3" fill="#efb042"/><text x="${fx}" y="${fy-55}" text-anchor="middle" class="camp">FINISH · ${C[3].city.toUpperCase()}</text>
    <rect x="${fx-44}" y="${fy+8}" width="88" height="16" rx="8" fill="#ffd27a"/><text x="${fx}" y="${fy+20}" text-anchor="middle" class="camp">₱ MARATHON POT</text>`;
  return o+`</svg>`;
}
function buildTower(){
  G=geo();const t=$('#tower');t.style.height=G.H+'px';t.style.width=G.W+'px';
  let h=sceneSVG(G)+'<div class="wx" id="wx"></div><div class="snow" id="snow" hidden></div>';
  Object.entries(MYST).forEach(([f,k])=>{f=+f;if([25,50,75].includes(f))return;const right=G.x(f)>G.cx;
    h+=`<span class="mys" data-mf="${f}" style="left:${G.x(f)+(right?-30:12)}px;top:${G.y(f)-22}px" title="${MYST_TYPES[k].name}">${MYST_TYPES[k].icon}</span>`});
  h+=`<div class="fog" id="fog" style="height:${G.y(89.5)}px"><b>Fog zone · ranks hidden</b></div>`;
  t.innerHTML=h;
  players.forEach(p=>{
    const d=document.createElement('div');
    d.className='av'+(p===me?' me':'');d.tabIndex=0;d.setAttribute('aria-label',p.name);
    d.innerHTML='<span class="svgw"></span><span class="crown"></span><span class="prank"></span><span class="ride"></span><span class="tag"></span>';
    d.addEventListener('click',()=>flash(p,false));
    t.appendChild(d);avEls[p.id]=d;
  });
  lastMe=null;
}
function posFor(f,k){
  const dx=k===0?0:((k%2)?1:-1)*Math.ceil(k/2)*19,dy=k>4?-8:0;
  let left=G.x(f)-16+dx;left=Math.max(2,Math.min(G.W-34,left));
  return [left,G.y(f)-40+dy];
}
let lastMe=null,walkInt=null;
function walk(el,from,to){
  clearInterval(walkInt);const dir=to>from?1:-1;let f=from;el.classList.add('walking');el.style.transition='top .09s linear,left .09s linear';
  walkInt=setInterval(()=>{f+=dir*.5;if((dir>0&&f>=to)||(dir<0&&f<=to)){f=to;clearInterval(walkInt);el.classList.remove('walking');el.style.transition=''}
    const [l,t]=posFor(f,0);el.style.left=l+'px';el.style.top=t+'px';},90);
}
function place(){
  const byF={},L=leader(),pasko=paskoOn();
  [...players].filter(p=>!p.ghost).sort((a,b)=>(b===me)-(a===me)).forEach(p=>{(byF[fl(p)]=byF[fl(p)]||[]).push(p)});
  Object.values(byF).forEach(arr=>arr.forEach((p,k)=>{
    const el=avEls[p.id];
    el.querySelector('.svgw').innerHTML=avatarSVG(p);
    const [l,t]=posFor(fl(p),k);
    if(p===me){const cur={day:S.day,f:fl(me)};
      if(lastMe&&lastMe.day===S.day&&lastMe.f!==cur.f){walk(el,lastMe.f,cur.f)}else{el.style.left=l+'px';el.style.top=t+'px'}
      lastMe=cur}
    else{el.style.left=l+'px';el.style.top=t+'px'}
    el.style.display=p.ghost?'none':'';
    el.classList.toggle('fogged',fogged(p));
    el.classList.toggle('aura',p===me&&S.equipped.has('aura'));
    el.querySelector('.ride').textContent=(rideIcon(p)||'')+(p===me&&S.equipped.has('trail')?'☁️':'');
    el.querySelector('.crown').textContent=p===L?'👑':'';
    el.querySelector('.prank').textContent=S.pranked&&S.pranked.id===p.id?PRANKS[S.pranked.type].icon:'';
    el.querySelector('.tag').textContent=(p===me?'You · ':'')+p.name+(isAdmin()?' · '+fl(p):'')+(p===L&&!fogged(p)?' · bounty':'');
  }));
  root.querySelectorAll('.mys').forEach(m=>{const f=+m.dataset.mf;m.hidden=!(isAdmin()||found(f));m.classList.toggle('hidden',isAdmin()&&!found(f))});
  {const c=S.settings.countries,cur=Math.min(3,Math.floor(fl(me)/25));$('#routeStrip').innerHTML=c.map((k,i)=>`<span class="c ${!isAdmin()&&i===cur?'on':''}">${COUNTRIES[k].flag} ${COUNTRIES[k].name}</span>`+(i<3?`<span class="m">${MODES[hopMode(i)].icon}</span>`:'')).join('')}
  const xl=root.getElementById('xlights');if(xl)xl.style.display=pasko?'':'none';
  root.querySelectorAll('.xm').forEach(g=>g.style.display=pasko?'':'none');
  $('#snow').hidden=!pasko;
  $('#xpill').hidden=!pasko;
  $('#fog').hidden=isAdmin();
  $('#wx').className='wx '+wxNow();
  $('#fogLegend').textContent=isAdmin()?'Fog (admin sees through)':'Fog 90–100';
}
function flash(p,scroll=true,cls='flash'){
  const el=avEls[p.id];
  if(scroll){const sc=$('#tscroll');sc.scrollTop=parseInt(el.style.top)-sc.clientHeight/2}
  el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
  setTimeout(()=>el.classList.remove(cls),2100);
}
function scrollToMe(){const sc=$('#tscroll');sc.style.scrollBehavior='auto';sc.scrollTop=parseInt(avEls[me.id].style.top)-sc.clientHeight/2;sc.style.scrollBehavior=''}
let rsT=null;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{const w=Math.max(280,$('#tscroll').clientWidth-2);if(G&&Math.abs(w-G.W)>4){buildTower();place();scrollToMe()}},200)});

/* ---------- Status bar ---------- */
function renderStatus(){
  const climbedNow=LIVE?LD.climbedTonight:{12:18,27:22}[S.day];const NP=players.filter(p=>!p.ghost).length;
  const p=pot(),w=WEATHER[wxNow()],isPot=S.settings.prizeMode==='pot';
  const eligible=players.filter(x=>!x.ghost&&elig(x)>=S.settings.elig).length;
  const cal=seasonCalc(),bt=burnTotals().t;
  $('#statusbar').innerHTML=`
   <div class="stat"><div class="k">Season</div><div class="v">Shift ${sched()}/${S.settings.length}</div><div class="s">${fmtD(shiftDate(sched()))} · ends ${fmtD(cal.end)}${pushOn()?' · <b style="color:var(--gold2)">Final Stretch</b>':''}</div></div>
   <div class="stat"><div class="k">${isPot?'Marathon Pot':'Prize'}</div><div class="v" style="color:var(--gold2)">${peso(p)}</div>${isPot?`<div class="meter"><i style="width:${Math.round(p/S.settings.cap*100)}%"></i></div><div class="s">Cap ${peso(S.settings.cap)} · +₱${S.settings.per}/climb</div>`:'<div class="s">Fixed prize, paid via payroll</div>'}</div>
   <div class="stat"><div class="k">Tonight's weather</div><div class="v">${w.icon} ${w.name}</div><div class="s">${w.fx}</div></div>
   ${isAdmin()
     ?`<div class="stat"><div class="k">Tokens burned</div><div class="v" style="color:var(--burn)">${num(bt)}</div><div class="meter"><i style="width:${Math.min(100,bt/S.settings.burnTarget*100)}%;background:var(--burn)"></i></div><div class="s">${Math.round(bt/S.settings.burnTarget*100)}% of ${num(S.settings.burnTarget)} target</div></div>
       <div class="stat"><div class="k">Cash-eligible</div><div class="v">${eligible}/${NP}</div><div class="s">${climbedNow}/${NP} climbed tonight</div></div>`
     :`<div class="stat"><div class="k">Climbed tonight</div><div class="v">${climbedNow}/${NP}</div><div class="meter"><i style="width:${climbedNow/Math.max(1,NP)*100}%;background:var(--sky)"></i></div></div>
       <div class="stat"><div class="k">You · ${titleOf(fl(me))}</div><div class="v">Step ${fl(me)}</div><div class="s">${S.tokens} tokens · <span class="${elig(me)>=S.settings.elig?'up':'down'}">${elig(me)}% eligible</span></div></div>`}`;
}

/* ---------- Player: challenge ---------- */
let timerInt=null;
function challengeHTML(){
  const c=S.chal,ac=S.settings.ac;
  if(c.stage==='pick'){
    return `<h3>Daily Takbo Challenge</h3><h2>Pick your difficulty</h2><p class="sub">Choose before you see the question. Start any time during your shift.</p><div class="diffs">`+
      Object.entries(DIFF).map(([k,d])=>`<button class="diff" data-diff="${k}"><span class="tl">${d.en}</span><b>${d.label}</b><span class="r"><span class="up">✓ +${d.up}</span> · <span class="${d.down<0?'down':'flat'}">✗ ${d.down<0?d.down:'±0'}</span></span></button>`).join('')+`</div>`;
  }
  const d=DIFF[c.diff];
  if(c.stage==='ready'){
    return `<h3>Daily Takbo Challenge · ${d.label}</h3><h2>Focus mode</h2><p class="sub">Read the rules, then start when you have ${ac.timer} seconds free.</p>
      <ul class="rules"><li>The ${ac.timer}-second timer starts when you tap Start.</li>
      ${ac.fullscreen?'<li>The challenge opens full screen.</li>':''}
      <li>Leaving this tab or window counts as a strike. ${ac.strikes} strikes and the question is forfeited (counted as wrong).</li>
      ${ac.image?'<li>The question shows as an image, so it can\'t be copied or pasted.</li>':''}
      ${ac.shuffle?'<li>Your answer order is different from everyone else\'s.</li>':''}</ul>
      <label class="toggle" style="margin-top:10px"><input type="checkbox" id="insure"> Add Second Chance · ${(S.settings.prices||{}).second||30} tokens (retry once if wrong, 1 per week)</label>
      <div class="row"><button class="btn" id="startQ">Start · ${ac.timer}s</button><button class="btn ghost" id="backPick">Change difficulty</button></div>`;
  }
  const q=c.q;
  const opts=q.opts.map((o,i)=>{
    let cls='opt',dis='';
    if(c.hidden.includes(i)){cls+=' gone';dis='disabled'}
    if(c.stage==='result'||c.stage==='done'){dis='disabled';if(i===q.a)cls+=' right';if(i===c.picked&&!c.correct)cls+=' wrong'}
    return `<button class="${cls}" data-opt="${i}" ${dis} aria-pressed="${c.picked===i}">${esc(o)}</button>`}).join('');
  let h=`<h3>Daily Takbo Challenge · ${d.label}</h3>`;
  if(c.stage==='q'){
    const left=Math.max(0,Math.ceil((c.deadline-Date.now())/1000));
    h+=`<div class="lockbar"><span class="qcat" style="margin:0">${q.cat}</span><span class="pill bad" id="strikes">Strikes ${c.strikes}/${ac.strikes}</span><span class="timer" id="qtimer">${left}s</span></div>
      <div class="tbar"><i id="tbar" style="width:${left/c.total*100}%"></i></div>
      ${ac.image?`<canvas class="qcv" id="qcv" height="90" aria-label="Question shown as image"></canvas>`:`<p class="qtext">${esc(q.q)}</p>`}
      <div class="opts">${opts}</div>
      <div class="row"><button class="btn" id="submitAns" ${c.picked===null?'disabled':''}>Lock in answer</button>
      <button class="btn ghost" id="hintBtn" ${c.hidden.length||S.tokens<((S.settings.prices||{}).hint||15)?'disabled':''}>Pahiwatig hint · ${(S.settings.prices||{}).hint||15} tokens</button></div>`;
  } else h+=`<span class="qcat">${q.cat}</span><p class="qtext">${esc(q.q)}</p><div class="opts">${opts}</div>`;
  if(c.stage==='result'){
    h+=`<div class="result badr"><b class="down">Not quite.</b> ${d.down<0?`This costs ${d.down} steps.`:'You stay on your step.'}
      <div class="row"><button class="btn sky" id="secondBtn" ${S.usedSecond||S.tokens<30?'disabled':''}>Second Chance · 30 tokens ${S.usedSecond?'(used this week)':''}</button><button class="btn ghost" id="acceptBtn">Accept result</button></div></div>`;
  }
  if(c.stage==='done'){
    h+=`<div class="result ${c.correct?'good':'badr'}">${c.summary}
      ${c.kahon?`<div class="row"><button class="btn" id="openKahon" ${S.tokens<S.settings.kahonCost?'disabled':''}>🎁 Open the Kahon · ${S.settings.kahonCost} tokens</button><button class="btn ghost" id="skipKahon">Leave it</button></div>`:''}</div>
      <div class="row"><span class="pill gold">Next free race: next shift, from 9:30 PM</span></div>
      <div class="row"><button class="btn" id="extraBtn" ${S.extraBought||S.tokens<((S.settings.prices||{}).extra||40)?'disabled':''}>Buy extra race · ${(S.settings.prices||{}).extra||40} tokens</button>${LIVE?'':'<button class="btn ghost" id="resetBtn">Reset demo</button>'}</div>`;
  }
  return h;
}
function drawQ(){
  const cv=$('#qcv');if(!cv)return;
  const q=S.chal.q,dpr=window.devicePixelRatio||1,w=cv.clientWidth||400;
  const ctx=cv.getContext('2d');ctx.font='700 16px "Nunito Sans", system-ui, sans-serif';
  const words=q.q.split(' '),lines=[];let line='';
  words.forEach(wd=>{const t=line?line+' '+wd:wd;if(ctx.measureText(t).width>w-28&&line){lines.push(line);line=wd}else line=t});lines.push(line);
  const hgt=lines.length*23+26;cv.style.height=hgt+'px';cv.width=w*dpr;cv.height=hgt*dpr;
  ctx.scale(dpr,dpr);ctx.fillStyle='#1b2436';ctx.fillRect(0,0,w,hgt);
  if(S.settings.ac.watermark){ctx.save();ctx.fillStyle='rgba(255,255,255,.05)';ctx.font='700 12px monospace';ctx.rotate(-0.25);
    for(let y=0;y<hgt+80;y+=34)for(let x=-60;x<w;x+=170)ctx.fillText(`${me.name} · S${sched()}`,x,y);ctx.restore()}
  ctx.fillStyle='#e9edf5';ctx.font='700 16px "Nunito Sans", system-ui, sans-serif';
  lines.forEach((l,i)=>ctx.fillText(l,14,26+i*23));
}
function startTimer(secs){
  const c=S.chal;c.total=secs;c.deadline=Date.now()+secs*1000;c.started=Date.now();
  clearInterval(timerInt);
  timerInt=setInterval(()=>{
    if(S.chal.stage!=='q'){clearInterval(timerInt);return}
    const left=Math.max(0,(S.chal.deadline-Date.now())/1000);
    const t=$('#qtimer'),b=$('#tbar');
    if(t){t.textContent=Math.ceil(left)+'s';t.classList.toggle('low',left<=10)}
    if(b)b.style.width=(left/S.chal.total*100)+'%';
    if(left<=0)forfeit("Time's up");
  },250);
  if(S.settings.ac.fullscreen){const card=$('#chalCard');try{const r=card.requestFullscreen&&card.requestFullscreen();r&&r.catch&&r.catch(()=>{})}catch(e){}}
}
function exitFS(){try{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(e){}}
function forfeit(reason){
  if(S.chal.stage!=='q')return;
  clearInterval(timerInt);exitFS();
  S.chal.correct=false;S.chal.forfeit=reason;S.chal.picked=null;
  S.flags.unshift({who:ME,what:reason+' · forfeited',when:'now',sev:'bad'});
  applyClimb();
}
let lastStrike=0;
function strike(){
  if(S.view!=='player'||!S.chal||S.chal.stage!=='q'||Date.now()-lastStrike<800)return;
  lastStrike=Date.now();S.chal.strikes++;
  if(S.chal.strikes>=S.settings.ac.strikes){forfeit('Left the challenge screen');return}
  S.flags.unshift({who:ME,what:'Left the challenge screen (strike '+S.chal.strikes+')',when:'now',sev:'warn'});
  const el=$('#strikes');if(el)el.textContent=`Strikes ${S.chal.strikes}/${S.settings.ac.strikes}`;
  toast(`Strike ${S.chal.strikes}: stay on the challenge screen`);
}
window.addEventListener('blur',()=>strike());
document.addEventListener('visibilitychange',()=>{if(document.hidden)strike()});
root.addEventListener('copy',e=>{if(S.chal&&S.chal.stage==='q'){e.preventDefault();toast('Copying is disabled during the challenge')}});
root.addEventListener('contextmenu',e=>{if(S.chal&&S.chal.stage==='q')e.preventDefault()});

/* ---------- Player: tropa & boss ---------- */
function tropaHTML(){
  const mates=[me,byName('Bea'),byName('Nico')];
  const done={Jessa:S.chal.stage==='done',Bea:true,Nico:S.tropa.nico};
  const all=Object.values(done).every(Boolean);
  return `<h3>Tropa · Puyat Squad</h3><h2>${all?'Kumpleto! +'+S.settings.tropaBonus+' each':'Climb together tonight'}</h2><p class="sub">If all ${S.settings.tropaSize} of you climb this shift, everyone gets +${S.settings.tropaBonus} step. Still one cash winner.</p>
   <div class="tropa">${mates.map(p=>`<div class="tm">${avatarSVG(p)}<b>${esc(p.name)}${p===me?' (you)':''}</b>${done[p.demoName||p.name]?'<span class="pill ok">Climbed ✓</span>':'<span class="pill warn">Not yet</span>'}</div>`).join('')}</div>
   <div class="row">${!S.tropa.nico?'<button class="btn ghost sm" id="nudge">Nudge Nico on Slack</button><button class="btn ghost sm" id="nicoClimb">Demo: Nico climbs</button>':''}${all&&S.tropa.bonus?'<span class="pill ok">+1 step added for the squad</span>':''}</div>`;
}
function bossHTML(){
  const b=S.boss,need=S.settings.bossNeed,pass=b.pct>=need;
  return `<h3>Boss Night with Sir Rendy · every ${S.settings.bossDay}</h3><h2>One question for the whole team</h2>
   <p class="sub">If ${need}% of the team gets it right by 4:30 AM, everyone climbs +${S.settings.bossReward}.</p>
   <p class="qtext">${esc(BOSSQ.q)}</p>
   <div class="opts">${BOSSQ.opts.map((o,i)=>{let cls='opt';if(b.answered){if(i===BOSSQ.a)cls+=' right';else if(i===b.pick)cls+=' wrong'}return `<button class="${cls}" data-boss="${i}" ${b.answered?'disabled':''}>${esc(o)}</button>`}).join('')}</div>
   ${b.answered?`<p class="sub" style="margin-top:8px">${esc(BOSSQ.why)}</p>`:''}
   <div class="flabel" style="margin-top:12px">Team correct so far: ${b.pct}% (need ${need}%)</div>
   <div class="meter" style="height:12px"><i style="width:${b.pct}%;background:${pass?'var(--ok)':'var(--xmas)'}"></i></div>
   ${pass?'<div class="row"><span class="pill ok">Boss defeated! Everyone +'+S.settings.bossReward+' at 4:30 AM</span></div>':''}`;
}

/* ---------- Player: PvP & bets ---------- */
function pvpHTML(){
  const P=S.settings.pvp,mf=fl(me),L=leader();
  const opps=players.filter(p=>p!==me&&(Math.abs(fl(p)-mf)<=P.range||p===L)).sort((a,b)=>fl(b)-fl(a));
  const marco=byName('Marco');
  let h=`<h3>Hamon · PvP duel</h3><h2>Bato, Papel, Gunting</h2><p class="sub">Challenge anyone within ±${P.range} steps, or the 👑 leader from anywhere. Both stake ${P.stake} tokens; the loser's stake is burned and they roll a ${P.dice}-sided die to fall 1–${P.dice} steps. Winner +${P.win}. Beat the leader for a ${P.bounty}-token bounty.</p>`;
  if(S.pvp.incoming){
    h+=`<div class="incoming"><b>⚔️ ${esc(marco.name)}</b> (step ${fogged(marco)?'??':fl(marco)}) challenged you. Pick your move:
      <div class="moves" style="margin-top:8px">${Object.entries(MOVES).map(([k,m])=>`<button class="move" data-inmove="${k}"><span>${m.i}</span>${m.n}</button>`).join('')}</div></div>`;
  }
  if(S.pvp.inLog!==undefined)h+=`<div class="result" id="inLog">${S.pvp.inLog}</div>`;
  if(S.pvp.revenge!=null){const r=players[S.pvp.revenge];
    h+=`<div class="incoming" style="border-color:rgba(239,176,66,.6);background:rgba(239,176,66,.07)"><b>🔥 Revenge right vs ${esc(r.name)}</b> · stake only ${P.revenge} tokens, this shift only. Pick your move:
      <div class="moves" style="margin-top:8px">${Object.entries(MOVES).map(([k,m])=>`<button class="move" data-rmove="${k}"><span>${m.i}</span>${m.n}</button>`).join('')}</div></div>`}
  if(S.pvp.rLog!==undefined)h+=`<div class="result" id="rLog">${S.pvp.rLog}</div>`;
  if(S.pvp.sent){
    h+=`<div class="result" id="outLog">${S.pvp.log||'Waiting…'}</div><div class="row"><span class="pill gold">1 challenge per shift · next one tonight</span></div>`;
  } else {
    h+=`<div class="field" style="margin-top:10px"><label for="pvpTarget">Opponent (${opps.length} available)</label><select id="pvpTarget">${opps.map(p=>`<option value="${p.id}" ${S.pvp.target==p.id?'selected':''}>${p===L&&!fogged(p)?'👑 ':''}${esc(p.name)} · step ${fogged(p)?'??':fl(p)}${rideIcon(p)?' '+rideIcon(p):''}${p===L?' · bounty '+P.bounty:''}</option>`).join('')}</select></div>
      <div class="moves" style="margin-top:10px">${Object.entries(MOVES).map(([k,m])=>`<button class="move" data-move="${k}" aria-pressed="${S.pvp.move===k}"><span>${m.i}</span>${m.n}</button>`).join('')}</div>
      <div class="row"><button class="btn" id="pvpSend" ${!S.pvp.move||!opps.length||S.tokens<P.stake?'disabled':''}>Send challenge · ${P.stake} tokens</button></div>`;
  }
  return h;
}
function duel(opp,myMove,oppMove,box,stake){
  const P=S.settings.pvp,L=leader();
  const head=`You ${MOVES[myMove].i} vs ${MOVES[oppMove].i} ${esc(opp.name)}`;
  if(myMove===oppMove){box(`${head}<br><b>Draw.</b> Stakes returned.`);S.feed.unshift(['now',`${ME} and ${opp.name} drew a Hamon`]);render();return}
  const iWin=BEATS[myMove]===oppMove,loser=iWin?opp:me,winner=iWin?me:opp;
  S.burnLive.pvp+=stake;
  if(!iWin){S.tokens-=stake;me.spent[S.day]+=stake}
  box(`${head}<br><b class="${iWin?'up':'down'}">${iWin?'You win!':'You lose.'}</b> ${loser===me?'You roll':esc(loser.name)+' rolls'} the die… <span class="die" id="die">?</span>`);
  let n=0;const iv=setInterval(()=>{const d=$('#die');if(d)d.textContent=1+Math.floor(Math.random()*P.dice);if(++n>9){clearInterval(iv);finish()}},90);
  function finish(){
    const roll=1+Math.floor(Math.random()*P.dice);let msg;
    const shielded=loser===me&&S.ride&&S.ride.key==='bantay'&&!S.ride.shieldUsed;
    if(shielded){S.ride.shieldUsed=true;msg=`Rolled <b>${roll}</b>, but Bantay blocked the knockback.`}
    else{const before=fl(loser),sf=safeFloor(before);loser.floor[S.day]=Math.max(sf,before-roll);
      msg=`Rolled <b class="mono">${roll}</b>. ${loser===me?'You fall':esc(loser.name)+' falls'} ${before}→${fl(loser)}${before-roll<sf?` (Transfer ${sf} caught ${loser===me?'you':'them'})`:''}.`}
    winner.floor[S.day]=Math.min(100,fl(winner)+P.win);
    let extra='';
    if(iWin&&opp===L){S.tokens+=P.bounty;extra=` 👑 Leader bounty: +${P.bounty} tokens!`}
    if(!iWin&&!S.pvp.revengeUsed){S.pvp.revenge=opp.id;extra+=' 🔥 You earned a revenge right.'}
    box(`${head}<br><b class="${iWin?'up':'down'}">${iWin?'You win!':'You lose.'}</b> <span class="die">${roll}</span> ${msg} ${winner===me?'You':esc(winner.name)} +${P.win} step. ${stake} tokens burned.${extra}`);
    S.feed.unshift(['now',`Hamon: ${winner.name} beat ${loser.name}, die roll ${roll}`]);
    render();flash(loser,false,'hit');
  }
}
function betsHTML(){
  const top=[...players].filter(p=>!p.ghost).sort((a,b)=>fl(b)-fl(a)).slice(0,4);
  const mk=[{id:'duel',title:'Tonight\'s Hamon: Kevin vs Rica',opts:[['Kevin',1.8],['Rica',1.8]]},
    {id:'lead',title:'Who leads on Friday at 4:30 AM?',opts:top.map((p,i)=>[fogged(p)?'??? (in the fog #'+(i+1)+')':p.name,[2.2,3,4,5][i]]).concat([['Someone else',6]])},
    {id:'boss',title:'Will the team beat Boss Night?',opts:[['Yes',1.6],['No',2.2]]}];
  return `<h3>Pustahan · spectator bets</h3><h2>Call the drama</h2><p class="sub">Bet up to ${S.settings.betMax} tokens. ${S.settings.betCut}% of every bet is burned as the house cut; winners get stake × odds.</p>`+
   mk.map(m=>{const b=S.bets[m.id];
    return `<div class="market"><b>${esc(m.title)}</b>
     ${b?`<div class="row" style="margin-top:6px">${b.settled?(b.won?`<span class="pill ok">Won ${b.payout} tokens</span>`:`<span class="pill bad">Lost this one</span>`):`<span class="pill sky">You bet ${b.amt} on ${esc(b.opt)} · pays ${b.payout}</span><span class="pill burn">${b.cut} burned</span><button class="btn ghost sm" data-settle="${m.id}">Demo: settle</button>`}</div>`
     :`<div class="bopts">${m.opts.map(([o,od])=>`<button class="bopt" data-bopt="${m.id}|${esc(o)}|${od}" aria-pressed="${!!(S.bets['_'+m.id]&&S.bets['_'+m.id].o===o)}">${esc(o)} <small>×${od}</small></button>`).join('')}</div>
       <div class="row" style="margin-top:0"><input type="number" id="bamt_${m.id}" min="1" max="${S.settings.betMax}" placeholder="Tokens" style="width:110px"><button class="btn sm" data-bet="${m.id}">Place bet</button></div>`}</div>`}).join('');
}

/* ---------- Player: shop ---------- */
function garageHTML(){
  const w=wxNow(),R=S.settings.ride;
  let h=`<h3>Gear &amp; Pet Pacers</h3><h2>Race faster</h2><p class="sub">Gear only works in its own leg (Swim, Bike or Run) and only on correct answers. One boost at a time. Tokens spent here are burned. You're in the <b>${LEGS[legOf(fl(me))]?LEGS[legOf(fl(me))].icon+' '+LEGS[legOf(fl(me))].n:'Finish'}</b> leg.</p>`;
  if(S.ride){const grounded=S.ride.key==='gel'&&w==='storm';
    h+=`<div class="active"><b>${rideIcon(me)} Riding ${esc(S.ride.name)}</b> · +${S.ride.bonus} per correct answer · ${S.ride.left} shift${S.ride.left>1?'s':''} left ${grounded?'<span class="pill bad">Wasted in Bagyo</span>':''}${S.ride.pet?`<br><small class="sub">${esc(S.ride.perk)}</small>`:''}</div>`}
  h+=`<div class="shop">${Object.entries(VEH).map(([k,v])=>`<div class="item"><span class="ic">${v.icon}</span><b>${v.name}</b><small>+${v.bonus} steps/correct · ${v.shifts} shift${v.shifts>1?'s':''} · ${v.note}</small><button class="btn sm" data-veh="${k}" ${(LIVE?(LD.me&&LD.me.gear):S.ride)||S.tokens<v.cost?'disabled':''}>Gear up · ${v.cost}</button></div>`).join('')}</div>
   <h4>Pet pacer</h4><p class="sub">Your pet runs beside you as a pacer in any leg; it does not race on its own. ${R.cost} tokens + ${R.energy} energy per shift${w==='heat'?' (doubled tonight: Heatwave)':''}. Pets must be Lv ${R.minLv}+. Energy refills in Bayani Park or at a 🥤 Water station.</p>
   <div class="pets">${S.pets.map((p,i)=>{const locked=p.lv<R.minLv,eCost=R.energy*(w==='heat'?2:1);
     return `<div class="pet"><span class="ic">${p.icon}</span><div style="min-width:0"><b>${esc(p.name)}</b> <small class="sub">${p.level}</small><br><small class="sub">${esc(p.perk)}</small><div class="ebar"><i style="width:${Math.min(100,p.energy)}%;background:${p.energy<40?'var(--warn)':'var(--ok)'}"></i></div><small class="sub">Energy ${p.energy}/100</small></div>
     <div>${locked?'<span class="pill warn">Needs Lv '+R.minLv+'</span>':`<select id="petS${i}" aria-label="Shifts to ride">${[1,2,3].map(n=>`<option value="${n}" ${n*eCost>p.energy?'disabled':''}>${n} shift${n>1?'s':''}</option>`).join('')}</select><div class="row" style="margin-top:6px"><button class="btn sm" data-pet="${i}" ${(LIVE?(LD.me&&LD.me.pacer):S.ride)||p.energy<eCost||S.tokens<R.cost?'disabled':''}>Pace me</button></div>`}</div></div>`}).join('')}</div>`;
  return h;
}
function pranksHTML(){
  const others=players.filter(p=>p!==me&&!fogged(p)).sort((a,b)=>fl(b)-fl(a));
  return `<h3>Kalokohan · pranks</h3><h2>Mess with a friend</h2><p class="sub">${S.settings.prankLimit} prank per player per week. The target sees it on the course but not who sent it, until the Balita recap.</p>
   ${S.pranked?`<div class="active">${PRANKS[S.pranked.type].icon} Planted on <b>${esc(players[S.pranked.id].name)}</b>. Watch their avatar on the course.</div>`:''}
   <div class="field"><label for="prankTarget">Target</label><select id="prankTarget" ${S.prankUsed?'disabled':''}>${others.map(p=>`<option value="${p.id}">${esc(p.name)} · step ${fl(p)}</option>`).join('')}</select></div>
   <div class="shop" style="margin-top:10px">${Object.entries(PRANKS).map(([k,v])=>`<div class="item"><span class="ic">${v.icon}</span><b>${v.name}</b><small>${v.fx}</small><button class="btn sm" data-prank="${k}" ${S.prankUsed||S.tokens<v.cost||!S.settings.pranksOn?'disabled':''}>Use · ${v.cost}</button></div>`).join('')}</div>`;
}
function cosmeticsHTML(){
  return `<h3>Marathon Shop · season-only</h3><h2>Show off on the course</h2><p class="sub">Cosmetics you can only buy during this season. Gone after the last shift.</p>
   <div class="shop">${Object.entries(COSMETICS).map(([k,v])=>{const own=S.owned.has(k),eq=S.equipped.has(k);
     return `<div class="item ${own?'owned':''}"><span class="ic">${v.icon}</span><b>${v.name}</b><small>${v.fx}</small>${own?`<button class="btn ${eq?'ghost':''} sm" data-equip="${k}">${eq?'Unequip':'Equip'}</button>`:`<button class="btn sm" data-cos="${k}" ${S.tokens<v.cost?'disabled':''}>Buy · ${v.cost}</button>`}</div>`}).join('')}</div>`;
}

/* ---------- Player: news, ranks, auction, cipher ---------- */
function balitaLines(){
  if(LIVE) return S.feed.length?S.feed.slice(0,8).map(f=>esc(f[1])):['No news yet tonight.'];
  const live=S.feed.slice(0,2).map(f=>`<b>BREAKING:</b> ${esc(f[1])}`);
  const base=S.day===12?[
    '🏍️ Gilda humataw ng +6 sa Bike leg gamit ang Carbon bike kahit umuulan. Siya ang pinakamabilis kagabi.',
    '⚔️ UPSET! Tinalo ni Kevin si Rica sa Hamon. Nagulong si Rica ng 3 palapag.',
    '🍌 Nadulas si Mae sa balat ng saging sa step 24. Ang nagtanim: si Paolo. 👀',
    '👥 Puyat Squad kumpleto ulit: +1 sa lahat ng tatlo.',
    `💰 Marathon Pot ngayon: ${peso(pot())}. Kayo ang nagpapalaki nito.`]:[
    '🌫️ Lima na ang nasa fog zone. Walang nakakaalam kung sino ang nangunguna.',
    '👑 Kinuha ni Ivan ang leader bounty matapos talunin ang 👑 sa Bato-Papel-Gunting.',
    '🎁 Si Joy nakabukas ng Kahon sa step 92: libreng Energy gel!',
    '🎄 Paskong Karera na! May parol na ang bawat transfer station.',
    `🔥 ${num(burnTotals().t)} tokens na ang nasunog ngayong season.`];
  return live.concat(base);
}
function balitaHTML(){
  return `<h3>Balita sa Karera · posted 4:50 AM in Slack</h3><h2>Kagabi sa Karera</h2><ul class="news">${balitaLines().map(l=>`<li>${l}</li>`).join('')}</ul>`;
}
function leaderboardHTML(){
  const sorted=[...players].filter(p=>!p.ghost).sort((a,b)=>fl(b)-fl(a)||a.name.localeCompare(b.name));
  const inFog=sorted.filter(fogged),rest=sorted.filter(p=>!fogged(p)),L=leader();
  const row=(p,rk,f)=>`<li data-pid="${p.id}" class="${p===me?'me':''}"><span class="rk">${rk}</span><span class="mini">${avatarSVG(p)}</span><span class="nm">${p===L&&!fogged(p)?'👑 ':''}${esc(p.name)}${p===me?' (you)':''} ${rideIcon(p)||''}<small>${fogged(p)?'In the fog':titleOf(fl(p))}</small></span><span class="st">🔥${p.streak[S.day]}</span><span class="fl2">${f}</span></li>`;
  let rows='';
  if(inFog.length){rows+=`<li class="grp">In the fog · ${inFog.length} climber${inFog.length>1?'s':''}, order hidden</li>`;rows+=[...inFog].sort((a,b)=>a.name.localeCompare(b.name)).map(p=>row(p,'?','??')).join('')}
  rows+=rest.map((p,i)=>row(p,inFog.length+i+1,fl(p))).join('');
  return `<h3>Leaderboard</h3><p class="sub">Titles: Baguhan → Mananakbo (25) → Mandirigma (50) → Iron Bayani (75) → Alamat ng Takbo (90) → Kampeon ng Mundo (100).</p><ul class="lb">${rows}</ul>`;
}
function cipherHTML(){
  const have=Math.min(10,Math.floor(fl(me)/10)),open=pushOn();
  return `<h3>Finish Line Cipher</h3><h2>${have}/10 fragments</h2><p class="sub">One fragment per 10 steps. ${open?'The cipher is open. First full phrase wins +10 steps.':'Opens in the Final Stretch (last 5 shifts). Collect and trade until then.'}</p>
   <div class="frags">${FRAGS.map((w,i)=>`<div class="frag ${i<have?'have':''}">${i<have?w:'#'+(i+1)}</div>`).join('')}</div>
   <div class="row"><button class="btn ghost" id="tradeBtn">Offer a trade</button>${open?`<input type="text" id="cipherIn" placeholder="Type the full phrase" style="flex:1;min-width:160px"><button class="btn" id="cipherBtn">Submit</button>`:''}</div>`;
}
function auctionHTML(){
  return `<h3>🎟️ Friday Fast-Pass Auction</h3><h2>Sealed bids</h2><p class="sub">Top 3 bids win the fast passes. Every bid is burned, win or lose. Closes Friday 4:30 AM.</p>
   <div class="elev"><div><b>+5</b><span>1st highest</span></div><div><b>+3</b><span>2nd</span></div><div><b>+2</b><span>3rd</span></div></div>
   ${S.bid!==null?`<div class="result good">Your sealed bid: <b class="mono">${S.bid} tokens</b>. Results post Friday 4:50 AM in Slack.</div>`
   :`<div class="row" style="margin-top:0"><input type="number" id="bidIn" min="1" max="${S.tokens}" placeholder="Your bid in tokens" style="flex:1;min-width:140px"><button class="btn" id="bidBtn">Seal bid</button></div>`}`;
}
const PTABS=[['climb','Takbo'],['pvp','Hamon & Pustahan'],['shop','Tindahan'],['news','Balita & Ranks']];
function renderPlayer(){
  const tabs=`<div class="atabs" role="group" aria-label="Game sections">${PTABS.map(([k,l])=>`<button data-ptab="${k}" aria-pressed="${S.ptab===k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(S.ptab==='climb')body=`<div class="card ${S.chal.stage==='q'?'locked':''}" id="chalCard">${challengeHTML()}</div><div class="two"><div class="card">${tropaHTML()}</div><div class="card boss">${bossHTML()}</div></div>`;
  if(S.ptab==='pvp')body=`<div class="two"><div class="card">${pvpHTML()}</div><div class="card">${betsHTML()}</div></div>`;
  if(S.ptab==='shop')body=`<div class="card">${garageHTML()}</div><div class="two"><div class="card">${pranksHTML()}</div><div class="card">${cosmeticsHTML()}</div></div>`;
  if(S.ptab==='news')body=`<div class="card">${balitaHTML()}<div class="row"><button class="btn sky" id="wrappedBtn">Preview my Marathon Wrapped</button><button class="btn" id="revealBtn">Preview Finish Line Reveal</button></div></div>
     <div class="two"><div class="card">${leaderboardHTML()}</div><div class="stack"><div class="card">${auctionHTML()}</div><div class="card">${cipherHTML()}</div></div></div>`;
  $('#side').innerHTML=realize(tabs+body);
  if(S.ptab==='climb'&&S.chal.stage==='q')drawQ();
}

/* ---------- Overlays ---------- */
function showReveal(){
  const sorted=[...players].filter(p=>!p.ghost).sort((a,b)=>fl(b)-fl(a)).slice(0,5);
  const champ=sorted.find(p=>elig(p)>=S.settings.elig)||sorted[0];
  $('#ovl').innerHTML=`<div class="overlay" role="dialog" aria-label="Finish Line Reveal"><div class="ovl"><span class="prem">Finish Line Reveal · ${esc(S.settings.revealDate)}</span><h2>The fog lifts…</h2><p class="sub">Revealing the top 5, from 5th to 1st. Plays live in the portal and posts to Slack. (Preview uses today's standings.)</p><ul class="rev" id="revList"></ul><div id="revFinal"></div><div class="row" style="justify-content:center"><button class="btn ghost" id="closeOvl">Close</button></div></div></div>`;
  let i=4;
  const step=()=>{const list=$('#revList');if(!list)return;
    if(i<0){$('#revFinal').innerHTML=`<div class="winner" style="justify-content:center">${avatarSVG(champ)}<div style="text-align:left"><h2>🏆 ${esc(champ.name)} wins ${peso(pot())}!</h2><p class="sub" style="margin:0">${titleOf(fl(champ))} · step ${fl(champ)} · credited in the next payroll · + champion perks</p><p class="sub" style="margin:4px 0 0">🥈 ${esc(sorted.filter(p=>p!==champ)[0].name)} +${S.settings.cp2} tokens · 🥉 ${esc(sorted.filter(p=>p!==champ)[1].name)} +${S.settings.cp3} tokens</p></div></div>`;return}
    const p=sorted[i];const li=document.createElement('li');li.className=p===champ?'champ':'';
    li.innerHTML=`<span class="rk">#${i+1}</span>${avatarSVG(p)}<span><b>${esc(p.name)}</b><br><small class="sub">${titleOf(fl(p))}${elig(p)<S.settings.elig?' · not cash-eligible':''}</small></span><span class="mono" style="font-weight:700">${fl(p)}</span>`;
    list.appendChild(li);i--;setTimeout(step,1100)};
  setTimeout(step,500);
}
function showWrapped(){
  const climbed=fl(me);
  $('#ovl').innerHTML=`<div class="overlay" role="dialog" aria-label="Marathon Wrapped"><div class="ovl wrapped"><span class="prem">Marathon Wrapped · ${ME}</span><h2>Your season on the course</h2><p class="sub" style="color:#c3cbe0">Every player gets this card at the end of the season, winner or not.</p>
   <div class="wgrid"><div><b>${climbed}</b><span>Steps climbed</span></div><div><b style="font-size:15px">${titleOf(climbed)}</b><span>Title earned</span></div><div><b>${S.day===12?'6/8':'17/21'}</b><span>Correct answers</span></div><div><b>${me.streak[S.day]}</b><span>Best climb streak</span></div><div><b>${S.day===12?'2/3':'7/11'}</b><span>Hamon wins</span></div><div><b>${num(me.spent[S.day])}</b><span>Tokens burned</span></div></div>
   <p>😂 <b>Funniest moment:</b> slipped on a balat ng saging at step ${S.day===12?'18':'61'}, planted by Marco.</p>
   <p>🐕 <b>Favorite ride:</b> Bantay, ${S.day===12?'2':'7'} shifts.</p>
   <div class="row" style="justify-content:center"><button class="btn" id="shareWrapped">Share to Slack</button><button class="btn ghost" id="closeOvl">Close</button></div></div></div>`;
}

/* ---------- Admin ---------- */
const ATABS=[['overview','Overview'],['burn','Token burn'],['season','Season & prize'],['ladder','Prize ladder'],['route','World route'],['weather','Weather & theme'],['shop','Shop & PvP'],['events','Events'],['slack','Slack & finale'],['integrity','Anti-cheat'],['questions','Questions']];
function renderAdmin(){
  const tabs=`<div class="atabs" role="group" aria-label="Admin sections">${ATABS.map(([k,l])=>`<button data-atab="${k}" aria-pressed="${S.atab===k}">${l}</button>`).join('')}</div>`;
  const body={overview:adminOverview,burn:adminBurn,season:adminSeason,ladder:adminLadder,route:adminRoute,weather:adminWeather,shop:adminShop,events:adminEvents,slack:adminSlack,integrity:adminIntegrity,questions:adminQuestions}[S.atab]();
  $('#side').innerHTML=realize(tabs+(S.atab==='overview'?adminStatusCard():'')+body);
}
function adminOverview(){
  const sorted=[...players].filter(p=>!p.ghost).sort((a,b)=>fl(b)-fl(a));
  const lead=sorted.find(p=>elig(p)>=S.settings.elig)||sorted[0];
  const st=p=>{const e=elig(p);return e>=S.settings.elig?'<span class="pill ok">Eligible</span>':e>=60?'<span class="pill warn">At risk</span>':'<span class="pill bad">Not eligible</span>'};
  const feed=[...S.feed,['4:12 AM','Gilda answered Hard ✓ and climbed +4'],['3:58 AM','Paolo planted 🍌 on Mae (35 tokens burned)'],['3:41 AM','Mae geared up with a 🚴 Carbon bike (70 tokens burned)'],['3:20 AM','Hamon: Kevin beat Rica, die roll 3'],['2:52 AM','Joy opened a 🎁 Kahon on step 31'],['2:47 AM','Rica rode 🐎 for 2 shifts (60 tokens burned)'],['1:05 AM','Puyat Squad completed: +1 each']].slice(0,14);
  return `
   <div class="card"><h3>Payroll winner preview</h3>
     <div class="winner">${avatarSVG(lead)}<div style="min-width:0"><h2>${esc(lead.name)} · step ${fl(lead)}</h2><p class="sub" style="margin:0">Highest eligible climber right now. Prize if the season ended now: <b style="color:var(--gold2)">${peso(pot())}</b></p></div></div>
     <div class="row"><button class="btn" id="declareBtn">Declare winner &amp; send to payroll</button><button class="btn ghost" id="revealBtn">Preview Finish Line Reveal</button><button class="btn ghost" id="pauseBtn">Pause season</button></div>
     <div id="confirmBox"></div></div>
   <div class="card"><h3>Players &amp; eligibility</h3><p class="sub">Eligibility = free climbs ÷ scheduled shifts (${sched()} so far). Holidays${S.settings.leaves?' and approved leaves':''} don't count against anyone.</p>
     <div class="tbl"><table><thead><tr><th class="num">#</th><th>Player</th><th>Title</th><th class="num">Step</th><th>Ride</th><th class="num">Climbs</th><th class="num">Elig.</th><th class="num">Burned</th><th>Status</th></tr></thead>
     <tbody>${sorted.map((p,i)=>`<tr data-pid="${p.id}" style="cursor:pointer"><td class="num">${i+1}</td><td><b>${i===0?'👑 ':''}${esc(p.name)}</b>${fl(p)>=90?' <span class="pill" style="background:rgba(200,214,240,.12);color:#c8d6f0">fog</span>':''}</td><td>${titleOf(fl(p))}</td><td class="num">${fl(p)}</td><td>${rideIcon(p)||'–'}</td><td class="num">${p.climbs[S.day]}/${sched()}</td><td class="num">${elig(p)}%</td><td class="num" style="color:var(--burn)">${num(p.spent[S.day])}</td><td>${st(p)}</td></tr>`).join('')}</tbody></table></div></div>
   <div class="card"><h3>Live activity</h3><ul class="feed">${feed.map(([t,m])=>`<li><time>${t}</time><span>${esc(m)}</span></li>`).join('')}</ul></div>`;
}
function adminBurn(){
  const {o,t}=burnTotals(),max=Math.max(...Object.values(o));
  const shifts=DAILY_BURN.slice(0,sched());const live=Object.values(S.burnLive).reduce((a,b)=>a+b,0);
  if(live)shifts[shifts.length-1]+=live;
  const bmax=Math.max(...shifts),avg=t/sched(),projected=Math.round(avg*S.settings.length);
  const top=[...players].filter(p=>!p.ghost).sort((a,b)=>b.spent[S.day]-a.spent[S.day]).slice(0,6);
  const earned=26*48*sched();
  return `
   <div class="card"><h3>Token burn monitor</h3>
    <div class="burnhero">
     <div><div class="flabel">Burned this season</div><div class="bignum">${num(t)}</div>
       <div class="meter"><i style="width:${Math.min(100,t/S.settings.burnTarget*100)}%;background:var(--burn)"></i></div>
       <p class="sub" style="margin-top:6px">${Math.round(t/S.settings.burnTarget*100)}% of the ${num(S.settings.burnTarget)} season target · avg ${num(avg)}/shift · projected <b>${num(projected)}</b> by shift ${S.settings.length} ${projected>=S.settings.burnTarget?'<span class="pill ok">On track</span>':'<span class="pill warn">Below target</span>'}</p>
       ${LIVE?'':`<p class="sub">Burn ratio: <b>${Math.round(t/earned*100)}%</b> of the ${num(earned)} tokens the team earned so far this season.</p>`}</div>
     <div><div class="flabel">Burn per shift</div>
       <div class="bars">${shifts.map((v,i)=>`<div style="height:${v/bmax*100}%" data-v="Shift ${i+1}: ${num(v)}"></div>`).join('')}</div>
       <div class="barlbl"><span>Shift 1</span><span>Shift ${shifts.length}</span></div></div>
    </div></div>
   <div class="two">
    <div class="card"><h3>Where tokens go</h3><div class="sinks">${Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="sink"><div>${SINK_LABEL[k]}<div class="sb"><i style="width:${v/max*100}%"></i></div></div><span class="sv">${num(v)}</span></div>`).join('')}</div></div>
    <div class="card"><h3>Top burners</h3><ul class="feed">${top.map(p=>`<li><span class="mini">${avatarSVG(p)}</span><span style="flex:1"><b>${esc(p.name)}</b></span><span class="mono" style="color:var(--burn)">${num(p.spent[S.day])}</span></li>`).join('')}</ul>
      <p class="sub" style="margin-top:10px">Tokens paid back to players (bounties, bet winnings, Kahon prizes) are tracked separately and don't count as burned.</p>
      <div class="field"><label for="sBurnT">Season burn target (tokens)</label><input id="sBurnT" type="number" value="${S.settings.burnTarget}"></div>
      <div class="row"><button class="btn" id="saveBtn">Save target</button></div></div>
   </div>`;
}
function adminSeason(){
  const s=S.settings,cal=seasonCalc();
  const offset=(cal.days[0].wd+6)%7;
  const pushFrom=s.length-4;
  const cells=Array(offset).fill('<div></div>').concat(cal.days.map(d=>{let cls=d.type;if(d.type==='shift'&&d.n>=pushFrom)cls='push';
    return `<div class="c ${cls}" title="${esc(d.label)}">${+d.iso.slice(8)}<i>${d.type==='shift'?'S'+d.n:d.type==='hol'?(s.holidayMode==='extend'?'off':'opt'):''}</i></div>`}));
  if(cal.reveal){let cur=new Date(new Date(cal.end+'T00:00:00Z').getTime()+864e5);while(cur.toISOString().slice(0,10)<cal.reveal){cells.push(`<div class="c off">${cur.getUTCDate()}<i></i></div>`);cur=new Date(cur.getTime()+864e5)}
    cells.push(`<div class="c reveal">${+cal.reveal.slice(8)}<i>Reveal</i></div>`)}
  const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const beforeXmas=cal.reveal&&cal.reveal<'2026-12-25';
  return `
  <div class="card"><h3>Prize</h3>
    <div class="radios">
     <label class="radio"><input type="radio" name="prizeMode" value="pot" ${s.prizeMode==='pot'?'checked':''}><span><b>Growing pot</b><small>Starts at a base and grows with every free climb, up to a cap.</small></span></label>
     <label class="radio"><input type="radio" name="prizeMode" value="fixed" ${s.prizeMode==='fixed'?'checked':''}><span><b>Fixed prize</b><small>One set amount, announced on day 1.</small></span></label>
    </div>
    <div class="fgrid" style="margin-top:10px">
     ${s.prizeMode==='fixed'?`<div class="field"><label for="sFixed">Prize amount (₱)</label><input id="sFixed" type="number" value="${s.fixed}"></div>`:
     `<div class="field"><label for="sBase">Base prize (₱)</label><input id="sBase" type="number" value="${s.base}"></div>
      <div class="field"><label for="sPer">₱ per free climb</label><input id="sPer" type="number" step="0.5" value="${s.per}"></div>
      <div class="field"><label for="sCap">Pot cap (₱)</label><input id="sCap" type="number" value="${s.cap}"></div>
      <div class="field"><label for="sBonus">Weekly team bonus (₱)</label><input id="sBonus" type="number" value="${s.bonus}"></div>
      <div class="field"><label for="sBonusPct">Bonus unlocks at (% participation)</label><input id="sBonusPct" type="number" value="${s.bonusPct}"></div>`}
     <div class="field"><label for="sElig">Cash eligibility (% of shifts)</label><input id="sElig" type="number" value="${s.elig}"></div>
    </div></div>
  <div class="card"><h3>Champion perks</h3><p class="sub">Extra rewards that cost little or no cash. The cash prize stays the biggest in the portal at ${peso(s.prizeMode==='fixed'?s.fixed:s.cap)}.</p>
    <div class="row" style="margin-top:0">
     <label class="toggle"><input type="checkbox" checked> 👑 Permanent crown on the champion's avatar</label>
     <label class="toggle"><input type="checkbox" checked> 🎁 First Marathon cosmetic of next season, free</label>
     <label class="toggle"><input type="checkbox" checked> 🏆 Hall of Fame card on the Game Portal + Slack announcement</label></div>
    <div class="fgrid" style="margin-top:10px">
     <div class="field"><label for="cpStart">Champion starts next season at step</label><input id="cpStart" type="number" value="${s.cpStart}"></div>
     <div class="field"><label for="cpMerit">Merit points (Bayaning Puyat)</label><input id="cpMerit" type="number" value="${s.cpMerit}"></div>
     <div class="field"><span class="flabel">Runner-up token prizes</span><div style="display:flex;gap:6px"><input id="cp2" type="number" value="${s.cp2}" aria-label="2nd place tokens" title="2nd place"><input id="cp3" type="number" value="${s.cp3}" aria-label="3rd place tokens" title="3rd place"></div><small class="sub">2nd · 3rd place, in tokens</small></div></div></div>
  <div class="card"><h3>Entrance fee</h3><p class="sub">Paid once in tokens to join, like the race and the park. Fees are burned.</p>
    <div class="fgrid"><div class="field"><label for="sFee">Entrance fee (tokens)</label><input id="sFee" type="number" value="${s.fee}"></div>
     <div class="field"><label for="sLate">Late joining allowed until shift</label><input id="sLate" type="number" value="${s.lateJoin}"></div></div></div>
  <div class="card"><h3>Duration</h3><p class="sub">The season counts <b>shifts</b>, not calendar days, so weekends never count.</p>
    <div class="fgrid">
     <div class="field"><label for="sStart">First shift</label><input id="sStart" type="date" value="${s.start}"></div>
     <div class="field"><label for="sLen">Length (shifts)</label><input id="sLen" type="number" min="5" max="60" value="${s.length}"></div>
     <div class="field"><span class="flabel">Last shift → Reveal</span><div class="mono" style="padding:8px 0;font-weight:700">${fmtD(cal.end)} → ${fmtD(cal.reveal)} ${beforeXmas?'<span class="pill ok">Before Christmas</span>':'<span class="pill bad">After Dec 25</span>'}</div></div>
    </div>
    <h4>Shift days</h4><div class="days">${[1,2,3,4,5,6,0].map(w=>`<label><input type="checkbox" data-wd="${w}" ${s.days.includes(w)?'checked':''}>${DN[w]}</label>`).join('')}</div>
    <h4>Client holidays</h4>
    <div class="tbl"><table><thead><tr><th>Date</th><th>Holiday</th><th>Applies to</th><th></th></tr></thead><tbody>
     ${s.holidays.map((h,i)=>`<tr><td class="mono">${fmtD(h.d)}</td><td>${esc(h.label)}</td><td>${esc(h.who)}</td><td><button class="btn ghost sm" data-delhol="${i}">Remove</button></td></tr>`).join('')}</tbody></table></div>
    <div class="fgrid" style="margin-top:8px"><div class="field"><label for="hDate">Date</label><input id="hDate" type="date"></div><div class="field"><label for="hLabel">Holiday</label><input id="hLabel" type="text" placeholder="e.g. New Year's Day"></div><div class="field"><label for="hWho">Applies to</label><select id="hWho"><option>All US clients</option><option>Some clients</option></select></div></div>
    <div class="row"><button class="btn ghost" id="addHol">Add holiday</button></div>
    <h4>On a holiday</h4>
    <div class="radios">
     <label class="radio"><input type="radio" name="holidayMode" value="extend" ${s.holidayMode==='extend'?'checked':''}><span><b>Skip &amp; extend</b><small>No climbing. The season adds a shift at the end. Best when all clients are off.</small></span></label>
     <label class="radio"><input type="radio" name="holidayMode" value="optional" ${s.holidayMode==='optional'?'checked':''}><span><b>Optional shift</b><small>Agents on duty can climb; it never counts against eligibility. Best when only some clients are off.</small></span></label>
    </div>
    <label class="toggle" style="margin-top:10px"><input type="checkbox" id="sLeaves" ${s.leaves?'checked':''}> Approved leaves from the Time Tracker don't count against eligibility</label>
    <h4>Season calendar · ${s.length} shifts${cal.skipped?` · ${cal.skipped} holiday${cal.skipped>1?'s':''} skipped`:''}${cal.optional?` · ${cal.optional} optional`:''}</h4>
    <div class="legend" style="margin-bottom:4px"><span style="--c:rgba(95,168,255,.5)">Shift</span><span style="--c:rgba(239,176,66,.6)">Final Stretch</span><span style="--c:rgba(239,95,95,.6)">Holiday</span><span style="--c:rgba(60,207,142,.6)">Finish Line Reveal</span></div>
    <div class="cal">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="h">${d}</div>`).join('')}${cells.join('')}</div>
  </div>
  <div class="card"><h3>Visibility</h3>
    <div class="row"><label class="toggle"><input type="checkbox" checked> Pin as Premium at top of BINGO tab</label><label class="toggle"><input type="checkbox" checked> Fog zone in Final Stretch</label><label class="toggle"><input type="checkbox" checked> Monday catch-up wind (+3)</label></div>
    <div class="row"><button class="btn" id="saveBtn">Save settings</button></div></div>`;
}
function adminRoute(){
  const s=S.settings,c=s.countries,dup=new Set(c).size<4;
  const opts=sel=>Object.entries(COUNTRIES).map(([k,v])=>`<option value="${k}" ${k===sel?'selected':''}>${v.flag} ${v.name} · ${v.city}</option>`).join('');
  return `<div class="card"><h3>World route</h3><p class="sub">Pick the 4 countries before the season starts. Each country is 25 steps: 🏊 Swim (6) → 🚴 Bike (11) → 🏃 Run (8). Racers move to the next country when they pass steps 25, 50 and 75, so the course changes about once a week for the average racer.</p>
   <div class="route" style="font-size:13px">${c.map((k,i)=>`<span class="c">${COUNTRIES[k].flag} ${COUNTRIES[k].name}</span>`+(i<3?`<span class="m">${MODES[hopMode(i)].icon}</span>`:'')).join('')}</div>
   ${dup?'<div class="row"><span class="pill bad">The same country is picked twice. Pick 4 different countries.</span></div>':''}
   <div class="tbl" style="margin-top:10px"><table><thead><tr><th>Stage</th><th>Country</th><th>Steps</th><th>Travel to next</th><th>Auto pick</th></tr></thead><tbody>
   ${c.map((k,i)=>`<tr><td><b>${i+1}</b></td><td><select data-rc="${i}" aria-label="Country ${i+1}" style="width:auto">${opts(k)}</select></td><td class="mono">${i*25}–${i*25+25}</td>
     <td>${i<3?`<select data-hop="${i}" aria-label="Travel after country ${i+1}" style="width:auto"><option value="">Auto</option>${Object.entries(MODES).map(([m,v])=>`<option value="${m}" ${s.hops[i]===m?'selected':''}>${v.icon} ${v.name}</option>`).join('')}</select>`:'🏁 Finish line'}</td>
     <td>${i<3?`${MODES[travelMode(k,c[i+1])].icon} ${MODES[travelMode(k,c[i+1])].name}`:'–'}</td></tr>`).join('')}</tbody></table></div>
   <div class="row"><button class="btn" id="saveBtn">Save route</button></div><p class="sub" style="margin-top:8px">Auto picks a train when the countries are connected by rail, a cruise when they share a sea route, and a plane for everything else. You can override any hop.</p></div>
  <div class="card"><h3>What each transfer does</h3><div class="tbl"><table><thead><tr><th>Travel</th><th>Effect when a racer crosses</th></tr></thead><tbody>${Object.values(MODES).map(m=>`<tr><td>${m.icon} ${m.name}</td><td style="white-space:normal">${m.twist}</td></tr>`).join('')}</tbody></table></div></div>`;
}
function adminLadder(){
  const s=S.settings,cal=seasonCalc();
  const days=(new Date(cal.end+'T00:00:00Z')-new Date(s.start+'T00:00:00Z'))/864e5+1,wk=days/7;
  const sumPrize=s.prizeMode==='fixed'?s.fixed:s.cap;
  const rows=S.ladder.map(g=>{const prizes=g.key==='summit'?[sumPrize]:g.prizes;const ev=prizes.reduce((a,b)=>a+(+b||0),0);
    const events=g.key==='summit'?1:Math.max(1,Math.round(wk/g.every));const perWk=g.key==='summit'?ev/wk:ev/g.every;
    return {...g,prizes,ev,events,perWk,season:ev*events,top:Math.max(...prizes)}});
  const totWk=rows.reduce((a,r)=>a+r.perWk,0),totSeason=rows.reduce((a,r)=>a+r.season,0);
  const sum=rows[0],others=rows.slice(1),maxOther=Math.max(...others.map(r=>r.top)),ok=sum.top>maxOther;
  const sorted=[...rows].sort((a,b)=>b.top-a.top),maxTop=sorted[0].top;
  const capShare=s.phpCapOn?Math.round(s.phpCap/totSeason*100):null;
  return `<div class="card"><h3>Prize ladder · all PHP games</h3><p class="sub">Every cash prize in the portal in one place. Season window: ${fmtD(s.start)} – ${fmtD(cal.end)} (≈${wk.toFixed(1)} weeks). Change a prize or how often a game runs and the totals update.</p>
   <div class="tbl"><table><thead><tr><th>Game</th><th>Runs</th><th>Prizes (₱)</th><th class="num">Per event</th><th class="num">≈ Per week</th><th class="num">This season</th></tr></thead><tbody>
   ${rows.map(r=>`<tr><td><b>${r.icon} ${r.name}</b>${r.key==='summit'?' <span class="pill gold">Premium</span>':''}</td>
     <td>${r.key==='summit'?'Once per season':`<select data-lad="${r.key}|every" aria-label="${r.name} frequency" style="width:auto">${[1,2,3,4].map(n=>`<option value="${n}" ${r.every===n?'selected':''}>${n===1?'Weekly':'Every '+n+' wks'}</option>`).join('')}</select>`}</td>
     <td>${r.key==='summit'?`<span class="mono">${peso(sumPrize)}</span><br><small class="sub">set in Season &amp; prize</small>`:`<div style="display:flex;gap:4px">${r.prizes.map((p,i)=>`<input type="number" min="0" step="50" value="${p}" data-lad="${r.key}|p|${i}" aria-label="${r.name} place ${i+1}" style="width:62px;padding:7px 6px">`).join('')}</div>`}</td>
     <td class="num">${peso(r.ev)}</td><td class="num">${peso(r.perWk)}</td><td class="num">${peso(r.season)}<br><small class="sub">${r.events} event${r.events>1?'s':''}</small></td></tr>`).join('')}
   <tr><td colspan="4"><b>Total</b></td><td class="num"><b>${peso(totWk)}</b></td><td class="num"><b>${peso(totSeason)}</b></td></tr></tbody></table></div>
   <p class="sub" style="margin-top:8px">≈ ${peso(totWk*4.33)} per month at this pace. Per-week and season figures are estimates based on the season window.</p></div>
  <div class="two">
   <div class="card"><h3>Biggest single win</h3>
    <div class="sinks">${sorted.map(r=>`<div class="sink"><div>${r.icon} ${r.name}<div class="sb"><i style="width:${r.top/maxTop*100}%;background:${r.key==='summit'?'var(--gold)':'var(--sky)'}"></i></div></div><span class="sv">${peso(r.top)}</span></div>`).join('')}</div>
    <div class="row">${ok?'<span class="pill ok">The Marathon is the biggest single prize</span>':'<span class="pill bad">Another game pays as much as the Marathon. Raise the Marathon prize or lower the other prize.</span>'}</div></div>
   <div class="card"><h3>Per-person cash cap</h3><p class="sub">Limits how much PHP one person can win across all games during the Marathon season, so the cash spreads across the team.</p>
    <label class="toggle"><input type="checkbox" id="phpCapOn" ${s.phpCapOn?'checked':''}> Cap each person's PHP winnings this season</label>
    <div class="field" style="margin-top:10px"><label for="phpCap">Cap per person (₱)</label><input id="phpCap" type="number" step="100" value="${s.phpCap}" ${s.phpCapOn?'':'disabled'}></div>
    <p class="sub" style="margin-top:8px">${s.phpCapOn?`No one can take more than ${capShare}% of the season's ${peso(totSeason)}. Prizes over the cap go to the next eligible finisher.`:'No cap: one person could win several games in the same season.'}</p><div class="row"><button class="btn" id="saveBtn">Save ladder</button></div></div>
  </div>`;
}
function adminWeather(){
  const s=S.settings,w=WEATHER;
  const fc=wk=>`<div class="forecast">${forecast(wk).map(([d,k])=>`<span title="${w[k].en}"><b>${w[k].icon}</b>${d}</span>`).join('')}</div>`;
  return `<div class="card"><h3>Weather control</h3><p class="sub">Weather changes the rules for one shift. Tonight: <b>${w[wxNow()].icon} ${w[wxNow()].name}</b> · ${w[wxNow()].fx}</p>
    <div class="radios">
     <label class="radio"><input type="radio" name="weatherMode" value="auto" ${s.weatherMode==='auto'?'checked':''}><span><b>Auto (forecast)</b><small>System plans the week from the weights below. Players see the forecast ahead.</small></span></label>
     <label class="radio"><input type="radio" name="weatherMode" value="random" ${s.weatherMode==='random'?'checked':''}><span><b>Random (surprise)</b><small>Rolled at 9:30 PM each shift. Nobody knows until the shift starts.</small></span></label>
     <label class="radio"><input type="radio" name="weatherMode" value="manual" ${s.weatherMode==='manual'?'checked':''}><span><b>Manual</b><small>You pick tonight's weather.</small></span></label>
    </div>
    ${s.weatherMode==='manual'?`<h4>Tonight's weather</h4><div class="radios">${Object.entries(w).map(([k,v])=>`<label class="radio"><input type="radio" name="wxPick" value="${k}" ${((s.weatherManual&&s.weatherManual.key)||s.weatherManual)===k?'checked':''}><span><b>${v.icon} ${v.name}</b><small>${v.fx}</small></span></label>`).join('')}</div>`:''}
    ${s.weatherMode!=='manual'?`<h4>Chance of each weather (weights)</h4><div class="fgrid">${Object.entries(w).map(([k,v])=>`<div class="field"><label for="w_${k}">${v.icon} ${v.en}</label><input id="w_${k}" type="number" min="0" value="${s.weights[k]}"></div>`).join('')}</div>`:''}
    ${s.weatherMode==='auto'?`<h4>This week</h4>${fc(1)}<h4>Next week</h4>${fc(2)}`:''}
    <div class="row"><button class="btn" id="saveBtn">Save weather</button></div></div>
   <div class="card"><h3>Season theme</h3><p class="sub">Themes change the course's look. Paskong Karera adds parols at transfer stations, Christmas lights along the trail and snow.</p>
    <div class="radios">
     <label class="radio"><input type="radio" name="theme" value="auto" ${s.theme==='auto'?'checked':''}><span><b>Auto</b><small>Paskong Karera turns on from Dec 1.</small></span></label>
     <label class="radio"><input type="radio" name="theme" value="pasko" ${s.theme==='pasko'?'checked':''}><span><b>🎄 Paskong Karera now</b><small>Christmas look all season.</small></span></label>
     <label class="radio"><input type="radio" name="theme" value="none" ${s.theme==='none'?'checked':''}><span><b>Classic</b><small>No theme.</small></span></label>
    </div><p class="sub" style="margin-top:8px">Currently: <b>${paskoOn()?'🎄 Paskong Karera':'Classic'}</b> (shift ${sched()} is ${fmtD(shiftDate(sched()))}).</p></div>`;
}
function adminShop(){
  const s=S.settings;
  const PR=S.settings.prices||(S.settings.prices={hint:15,second:30,extra:40,kahon:25});
  return `<div class="card"><h3>Race extras</h3><div class="fgrid"><div class="field"><label for="pr_hint">Hint (tokens)</label><input id="pr_hint" type="number" value="${PR.hint}"></div><div class="field"><label for="pr_second">Second Chance (tokens)</label><input id="pr_second" type="number" value="${PR.second}"></div><div class="field"><label for="pr_extra">Extra race (tokens)</label><input id="pr_extra" type="number" value="${PR.extra}"></div></div></div>
   <div class="card"><h3>Gear</h3><p class="sub">Rental prices are your main burn lever. Bonuses only apply to correct answers.</p>
    <div class="tbl"><table><thead><tr><th>Gear</th><th class="num">Price</th><th class="num">+Steps/correct</th><th class="num">Shifts</th><th>Note</th></tr></thead><tbody>
    ${Object.entries(VEH).map(([k,v])=>`<tr><td>${v.icon} ${v.name}</td><td class="num"><input type="number" id="vc_${k}" value="${v.cost}"></td><td class="num"><input type="number" id="vb_${k}" value="${v.bonus}"></td><td class="num"><input type="number" id="vs_${k}" value="${v.shifts}"></td><td>${v.note}</td></tr>`).join('')}</tbody></table></div></div>
   <div class="two">
   <div class="card"><h3>Pet rides</h3><div class="fgrid" style="grid-template-columns:minmax(0,1fr)">
     <div class="field"><label for="rCost">Tokens per shift</label><input id="rCost" type="number" value="${s.ride.cost}"></div>
     <div class="field"><label for="rEn">Pet energy per shift</label><input id="rEn" type="number" value="${s.ride.energy}"></div>
     <div class="field"><label for="rLv">Minimum pet level</label><input id="rLv" type="number" value="${s.ride.minLv}"></div></div></div>
   <div class="card"><h3>Kalokohan pranks</h3>
     <div class="tbl"><table><thead><tr><th>Prank</th><th class="num">Price</th></tr></thead><tbody>${Object.entries(PRANKS).map(([k,v])=>`<tr><td>${v.icon} ${v.name}</td><td class="num"><input type="number" id="pk_${k}" value="${v.cost}"></td></tr>`).join('')}</tbody></table></div>
     <div class="field" style="margin-top:8px"><label for="pkLim">Pranks per player per week</label><input id="pkLim" type="number" value="${s.prankLimit}"></div>
     <label class="toggle" style="margin-top:8px"><input type="checkbox" id="pkOn" ${s.pranksOn?'checked':''}> Pranks enabled</label></div>
   </div>
   <div class="card"><h3>Marathon cosmetics</h3><div class="tbl"><table><thead><tr><th>Item</th><th class="num">Price</th><th>Effect</th></tr></thead><tbody>${Object.entries(COSMETICS).map(([k,v])=>`<tr><td>${v.icon} ${v.name}</td><td class="num"><input type="number" id="cs_${k}" value="${v.cost}"></td><td style="white-space:normal">${v.fx}</td></tr>`).join('')}</tbody></table></div>
     <div class="row"><button class="btn ghost" id="addCos">Add cosmetic (mock)</button></div></div>
   <div class="card"><h3>Hamon (PvP)</h3><div class="fgrid">
     <div class="field"><label for="pStake">Stake (loser's is burned)</label><input id="pStake" type="number" value="${s.pvp.stake}"></div>
     <div class="field"><label for="pRange">Challenge range (± steps)</label><input id="pRange" type="number" value="${s.pvp.range}"></div>
     <div class="field"><label for="pDice">Knockback die</label><select id="pDice"><option value="2" ${s.pvp.dice==2?'selected':''}>2-sided (1–2 steps)</option><option value="3" ${s.pvp.dice==3?'selected':''}>3-sided (1–3 steps)</option></select></div>
     <div class="field"><label for="pWin">Winner bonus (steps)</label><input id="pWin" type="number" value="${s.pvp.win}"></div>
     <div class="field"><label for="pBounty">👑 Leader bounty (tokens)</label><input id="pBounty" type="number" value="${s.pvp.bounty}"></div>
     <div class="field"><label for="pRev">Revenge stake (tokens)</label><input id="pRev" type="number" value="${s.pvp.revenge}"></div>
     <div class="field"><label for="pPer">Challenges sent per shift</label><input id="pPer" type="number" value="${s.pvp.perShift}"></div>
     <div class="field"><label for="pMax">Max received per shift</label><input id="pMax" type="number" value="${s.pvp.maxIn}"></div></div>
     <label class="toggle" style="margin-top:10px"><input type="checkbox" id="pAuto" ${s.pvp.auto?'checked':''}> No reply by 4:30 AM = random move (nobody has to stop work to answer)</label>
     <div class="row"><button class="btn" id="saveBtn">Save shop &amp; PvP</button></div></div>`;
}
function adminEvents(){
  const s=S.settings,counts={};Object.values(MYST).forEach(k=>counts[k]=(counts[k]||0)+1);
  const tropas=[['Puyat Squad','Jessa, Bea, Nico',S.tropa.bonus?'3/3':'2/3',82],['Kape Gang','Gilda, Marco, Joy','3/3',91],['Night Owls','Paolo, Rica, Ivan','1/3',64],['Team Turon','Kevin, Mae, Liza','3/3',88],['Bantay Sarado','Carlo, Faye, Jun','2/3',73]];
  return `<div class="card"><h3>Mystery steps</h3><p class="sub">${Object.keys(MYST).length} hidden steps. The admin course view shows all of them (faded = not found yet). Players only see ones someone has found.</p>
    <div class="shop" style="grid-template-columns:repeat(4,minmax(0,1fr))">${Object.entries(MYST_TYPES).map(([k,v])=>`<div class="item"><span class="ic">${v.icon}</span><b>${v.name} · ${counts[k]||0}</b><small>${v.fx}</small></div>`).join('')}</div>
    <div class="fgrid" style="margin-top:10px"><div class="field"><label for="eDens">Density (% of steps)</label><input id="eDens" type="number" value="${s.mystDensity}"></div><div class="field"><label for="eKahon">Kahon open price (tokens)</label><input id="eKahon" type="number" value="${s.kahonCost}"></div></div>
    <div class="row"><button class="btn ghost" id="reshuffle">Reshuffle steps (mock)</button></div></div>
   <div class="card boss"><h3>Boss Night</h3><div class="fgrid">
     <div class="field"><label for="eBossDay">Night</label><select id="eBossDay">${['Monday','Tuesday','Wednesday','Thursday','Friday'].map(d=>`<option ${s.bossDay===d?'selected':''}>${d}</option>`).join('')}</select></div>
     <div class="field"><label for="eBossNeed">Team must reach (% correct)</label><input id="eBossNeed" type="number" value="${s.bossNeed}"></div>
     <div class="field"><label for="eBossRew">Reward (steps for everyone)</label><input id="eBossRew" type="number" value="${s.bossReward}"></div></div>
     <div class="field" style="margin-top:10px"><label for="eBossQ">This week's question</label><input id="eBossQ" type="text" value="${esc(BOSSQ.q)}"></div>
     <p class="sub" style="margin-top:8px">Live: ${S.boss.pct}% correct so far.</p></div>
   <div class="card"><h3>Tropa</h3><div class="fgrid"><div class="field"><label for="eTSize">Members per tropa</label><input id="eTSize" type="number" value="${s.tropaSize}"></div><div class="field"><label for="eTBonus">Bonus steps when all climb</label><input id="eTBonus" type="number" value="${s.tropaBonus}"></div></div>
     <div class="tbl" style="margin-top:10px"><table><thead><tr><th>Tropa</th><th>Members</th><th>Tonight</th><th class="num">Season completion</th></tr></thead><tbody>${tropas.map(t=>`<tr><td><b>${t[0]}</b></td><td>${t[1]}</td><td>${t[2]==='3/3'?'<span class="pill ok">3/3</span>':'<span class="pill warn">'+t[2]+'</span>'}</td><td class="num">${t[3]}%</td></tr>`).join('')}</tbody></table></div></div>
   <div class="card"><h3>Pustahan</h3><div class="fgrid"><div class="field"><label for="eCut">House cut (% burned)</label><input id="eCut" type="number" value="${s.betCut}"></div><div class="field"><label for="eMax">Max bet (tokens)</label><input id="eMax" type="number" value="${s.betMax}"></div></div>
     <div class="tbl" style="margin-top:10px"><table><thead><tr><th>Market</th><th class="num">Pool</th><th class="num">Burned</th><th>Status</th></tr></thead><tbody>
     <tr><td>Kevin vs Rica Hamon</td><td class="num">340</td><td class="num">68</td><td><span class="pill sky">Open</span></td></tr>
     <tr><td>Who leads Friday?</td><td class="num">915</td><td class="num">183</td><td><span class="pill sky">Open</span></td></tr>
     <tr><td>Boss Night: team wins?</td><td class="num">480</td><td class="num">96</td><td><span class="pill sky">Open</span></td></tr>
     <tr><td>Week 1 leader</td><td class="num">1,120</td><td class="num">224</td><td><span class="pill ok">Settled</span></td></tr></tbody></table></div>
     <div class="row"><button class="btn ghost" id="newMarket">Open a new market (mock)</button><button class="btn" id="saveBtn">Save events</button></div></div>`;
}
function adminSlack(){
  const s=S.settings,cal=seasonCalc();
  return `<div class="card"><h3>Slack connection</h3><div class="field"><label for="sHook">Slack webhook URL</label><input id="sHook" type="url" placeholder="https://hooks.slack.com/services/…" value="${esc(s.hook)}"></div></div>
   <div class="card"><h3>Balita sa Karera · nightly recap</h3>
    <div class="fgrid"><div class="field"><label for="bTime">Post time (PHT)</label><input id="bTime" type="time" value="${s.balitaTime}"></div><div class="field"><span class="flabel">Writer</span><div style="padding:8px 0">AI, Taglish, newsy and funny</div></div><div class="field"><span class="flabel">Status</span><label class="toggle" style="padding:6px 0"><input type="checkbox" id="bOn" ${s.balitaOn?'checked':''}> Post every shift</label></div></div>
    <h4>Preview</h4><div class="slack"><div class="who"><span class="bot">🗼</span><b>Bayani World Marathon</b><small>4:50 AM</small></div><b>📰 Balita sa Karera · Shift ${sched()}</b><ul class="news">${balitaLines().map(l=>`<li>${l}</li>`).join('')}</ul></div>
    <div class="row"><button class="btn ghost" id="testSlack">Send test to Slack (mock)</button></div></div>
   <div class="card"><h3>Finish Line Reveal finale</h3><p class="sub">On reveal night the fog lifts one rank at a time, live in the portal and in Slack, ending with the champion.</p>
    <div class="fgrid"><div class="field"><label for="rDate">Reveal</label><input id="rDate" type="text" value="${esc(s.revealDate)}"></div><div class="field"><span class="flabel">Last shift</span><div class="mono" style="padding:8px 0;font-weight:700">${fmtD(cal.end)}</div></div></div>
    <div class="row"><button class="btn" id="revealBtn">Preview Finish Line Reveal</button></div></div>
   <div class="card"><h3>Marathon Wrapped</h3><p class="sub">Every player gets a personal recap card after the reveal: steps, title, best streak, duels, tokens burned and their funniest moment.</p>
    <label class="toggle"><input type="checkbox" id="wOn" ${s.wrappedOn?'checked':''}> Send Wrapped cards by Slack DM after the reveal</label>
    <div class="row"><button class="btn sky" id="wrappedBtn">Preview a Wrapped card</button><button class="btn" id="saveBtn">Save</button></div></div>`;
}
function adminIntegrity(){
  const a=S.settings.ac;
  const flags=[...S.flags,{who:'Kevin',what:'Left the challenge screen twice · forfeited',when:'3:22 AM',sev:'bad'},{who:'Rica',what:'Hard question answered in 3s',when:'2:10 AM',sev:'warn'},{who:'Joy',what:'9 Hard answers correct in a row (review)',when:'Shift 8',sev:'warn'},{who:'Jun',what:'Opened the challenge on 2 devices · second session blocked',when:'Shift 7',sev:'bad'}];
  return `<div class="card"><h3>Anti-cheat settings</h3><p class="sub">A web page can't lock the computer, but it can make cheating slow, visible and not worth it.</p>
    <div class="fgrid">
     <div class="field"><label for="aTimer">Question timer (seconds)</label><input id="aTimer" type="number" value="${a.timer}"></div>
     <div class="field"><label for="aStrikes">Strikes before forfeit</label><input id="aStrikes" type="number" value="${a.strikes}"></div>
     <div class="field"><label for="aFast">Flag answers faster than (s)</label><input id="aFast" type="number" value="${a.fast}"></div></div>
    <div class="row">
     <label class="toggle"><input type="checkbox" id="aFs" ${a.fullscreen?'checked':''}> Full-screen focus mode</label>
     <label class="toggle"><input type="checkbox" id="aImg" ${a.image?'checked':''}> Question as image (no copy-paste)</label>
     <label class="toggle"><input type="checkbox" id="aShuf" ${a.shuffle?'checked':''}> Shuffle answers per player</label>
     <label class="toggle"><input type="checkbox" id="aWm" ${a.watermark?'checked':''}> Name watermark</label>
     <label class="toggle"><input type="checkbox" checked> One device per challenge</label>
     <label class="toggle"><input type="checkbox" checked> Reveal answers after the shift</label></div>
    <div class="row"><button class="btn" id="saveBtn">Save anti-cheat</button></div></div>
   <div class="card"><h3>Integrity flags</h3><div class="tbl"><table><thead><tr><th>Player</th><th>What happened</th><th>When</th><th></th></tr></thead><tbody>
    ${flags.map(f=>`<tr><td><b>${esc(f.who)}</b></td><td style="white-space:normal"><span class="pill ${f.sev}">${f.sev==='bad'?'Forfeit':'Review'}</span> ${esc(f.what)}</td><td class="mono">${esc(f.when)}</td><td><button class="btn ghost sm" data-flag>Dismiss</button></td></tr>`).join('')}</tbody></table></div></div>`;
}
function adminQuestions(){
  return `<div class="card"><h3>Question bank</h3><p class="sub">Questions rotate by type each shift. Every player gets a different variant, with fresh numbers and names.</p>
    <div class="tbl"><table><thead><tr><th>Type</th><th class="num">Easy</th><th class="num">Med</th><th class="num">Hard</th></tr></thead><tbody>
    ${[['Logic & patterns',18,14,12],['Bugtong',10,12,6],['Quick math',15,12,10],['VA scenarios',8,16,9],['Word puzzles',14,9,5],['Boss Night',0,0,6]].map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td></tr>`).join('')}</tbody></table></div>
    <div class="row"><button class="btn" id="genBtn">Generate next week's set</button><button class="btn ghost" id="addQBtn">Add a question</button></div></div>`;
}

/* ---------- Render ---------- */
function render(){
  renderStatus();
  isAdmin()?renderAdmin():(LIVE?renderPlayerLive():renderPlayer());
  {const ds=$('#demoSeg'),dl=$('#demoLbl');if(ds)ds.hidden=LIVE;if(dl)dl.hidden=LIVE;}
  place();
  const cal=seasonCalc();
  $('#heroText').textContent=`${S.settings.length} shifts · ${fmtD(S.settings.start)} – ${fmtD(cal.end)} · Finish Line Reveal ${fmtD(cal.reveal)}. One brain challenge per shift moves you along the course. Swim, bike and run through ${S.settings.countries.map(k=>COUNTRIES[k].flag+' '+COUNTRIES[k].name).join(' → ')}. One racer takes the ${peso(S.settings.prizeMode==='fixed'?S.settings.fixed:S.settings.cap)} top prize, the biggest cash prize in the portal.`;
  $('#note').innerHTML=noteText();
}

/* ---------- Climb logic ---------- */
function applyClimb(){
  const c=S.chal,d=DIFF[c.diff],w=wxNow();
  const before=fl(me),sf=safeFloor(before),lines=[];
  let delta=c.correct?d.up:d.down;
  if(c.correct){
    lines.push(`<b class="up">Correct!</b> +${d.up} steps. ${esc(c.q.why)}`);
    if(w==='wind'){delta+=1;lines.push('🌬️ Habagat tailwind: +1')}
    if(w==='storm'&&c.diff==='hard'){delta+=2;lines.push('⛈️ Bagyo bonus on Hard: +2')}
    if(S.ride){
      if(S.ride.key==='gel'&&w==='storm')lines.push('⚡ Energy gel wasted in Bagyo: no bonus');
      else if(S.ride.leg&&S.ride.leg!=='any'&&S.ride.leg!==legOf(before))lines.push(`${S.ride.icon} ${esc(S.ride.name)} doesn't help in the ${LEGS[legOf(before)]?LEGS[legOf(before)].n:''} leg`);
      else{delta+=S.ride.bonus;lines.push(`${rideIcon(me)} ${esc(S.ride.name)}: +${S.ride.bonus}`);
        if(S.ride.key==='kidlat'&&c.diff==='hard'){delta+=1;lines.push('🐎 Kidlat Hard perk: +1')}}
    }
  } else {
    lines.push(`<b class="down">${c.forfeit?esc(c.forfeit)+'.':'Wrong answer.'}</b> ${esc(c.q.why)}`);
    if(w==='rain'){const immune=S.ride&&(S.ride.key==='shoes'||S.ride.key==='mingming');
      if(immune)lines.push(`🌧️ Rain penalty blocked by your ${esc(S.ride.name)}`);else{delta-=1;lines.push('🌧️ Ulan: −1 extra')}}
  }
  let after=Math.max(sf,Math.min(100,before+delta));
  if(before+delta<sf)lines.push(`🏁 Transfer ${sf} caught you.`);
  me.streak[S.day]++;
  if(me.streak[S.day]%5===0){after=Math.min(100,after+2);lines.push(`🔥 ${me.streak[S.day]}-shift streak bonus: +2`)}
  const mk=MYST[after];c.kahon=false;
  if(mk){S.found.add(after);const t=MYST_TYPES[mk];
    if(mk==='hagdan'){after=Math.min(100,after+3);lines.push('🛴 You found a secret Shortcut! +3 steps')}
    if(mk==='saging'){after=Math.max(safeFloor(after),after-1);lines.push('🍌 Balat ng saging! You slipped 1 step.')}
    if(mk==='karinderya'){S.pets.forEach(p=>p.energy=Math.min(100,p.energy+40));lines.push('🥤 Water station! Your pets got +40 energy.')}
    if(mk==='kahon'){c.kahon=true;lines.push(`🎁 You found a Kahon on step ${after}! Open it below.`)}
    S.feed.unshift(['now',`${ME} found a ${t.icon} ${t.name} on step ${after}`]);
  }
  [25,50,75].forEach((cp,i)=>{if(before<cp&&after>=cp){const m=hopMode(i),C2=COUNTRIES[S.settings.countries[i+1]];
    if(m==='train'){after=Math.min(100,after+1);lines.push(`🚄 Train to ${C2.flag} ${C2.name}: scenic ride, +1 step`)}
    if(m==='cruise'){S.pets.forEach(p=>p.energy=Math.min(100,p.energy+40));lines.push(`🚢 Cruise to ${C2.flag} ${C2.name}: your pets rested, +40 energy`)}
    if(m==='plane'){if(S.ride)S.ride.left++;lines.push(`✈️ Flew to ${C2.flag} ${C2.name}: your gear keeps its time`)}}});
  [25,50,75].forEach(cp=>{if(before<cp&&after>=cp)lines.push(`🏁 Transfer ${cp} reached. You can't fall below it now.`)});
  if(Math.floor(after/10)>Math.floor(before/10))lines.push('🧩 New cipher fragment unlocked');
  if(titleOf(after)!==titleOf(before))lines.push(`🏅 New title: <b>${titleOf(after)}</b>`);
  me.floor[S.day]=after;
  if(!c.extra){S.climbsTeam[S.day]++;me.climbs[S.day]=Math.min(sched(),me.climbs[S.day]+1);if(S.settings.prizeMode==='pot')lines.push(`💰 Marathon Pot +₱${S.settings.per}`)}
  if(S.ride){S.ride.left--;if(S.ride.left<=0){lines.push(`Your ${esc(S.ride.name)} ride ended`);S.ride=null}}
  if(!S.tropa.nico)lines.push('👥 Tropa: waiting on Nico for the squad bonus');
  if(c.correct&&c.started&&(Date.now()-c.started)/1000<S.settings.ac.fast)S.flags.unshift({who:ME,what:`${d.en} question answered in ${Math.round((Date.now()-c.started)/1000)}s`,when:'now',sev:'warn'});
  c.summary=`<div>Step ${before} → <b class="mono">${after}</b></div><ul>${lines.map(l=>`<li>${l}</li>`).join('')}</ul>`;
  c.stage='done';
  S.feed.unshift(['now',`${ME} answered ${d.en} ${c.correct?'✓':'✗'} → step ${after}`]);
  render();setTimeout(()=>flash(me),60);
}
function shuffled(q){
  if(!S.settings.ac.shuffle)return q;
  const order=q.opts.map((_,i)=>i).sort(()=>Math.random()-.5);
  return {...q,opts:order.map(i=>q.opts[i]),a:order.indexOf(q.a)};
}

/* ---------- Save admin forms ---------- */
const val=id=>{const e=root.getElementById(id);return e?e.value:null};
const nv=(id,cur)=>{const v=parseInt(val(id),10);return isNaN(v)?cur:v};
const chk=(id,cur)=>{const e=root.getElementById(id);return e?e.checked:cur};
function saveForms(){
  const s=S.settings;
  ['fixed','base','cap','bonus','bonusPct','elig','fee'].forEach(k=>s[k]=nv('s'+k[0].toUpperCase()+k.slice(1),s[k]));{const v=parseFloat(val('sPer'));if(!isNaN(v))s.per=v}
  s.cp2=nv('cp2',s.cp2);s.cp3=nv('cp3',s.cp3);s.cpMerit=nv('cpMerit',s.cpMerit);s.cpStart=nv('cpStart',s.cpStart);
  s.lateJoin=nv('sLate',s.lateJoin);s.length=Math.max(5,Math.min(60,nv('sLen',s.length)));
  if(val('sStart'))s.start=val('sStart');if(val('sHook')!==null)s.hook=val('sHook');s.leaves=chk('sLeaves',s.leaves);
  s.burnTarget=nv('sBurnT',s.burnTarget);
  s.prices=s.prices||{hint:15,second:30,extra:40,kahon:25};['hint','second','extra'].forEach(k=>s.prices[k]=nv('pr_'+k,s.prices[k]));
  Object.keys(s.weights).forEach(k=>s.weights[k]=nv('w_'+k,s.weights[k]));
  Object.keys(VEH).forEach(k=>{VEH[k].cost=nv('vc_'+k,VEH[k].cost);VEH[k].bonus=nv('vb_'+k,VEH[k].bonus);VEH[k].shifts=nv('vs_'+k,VEH[k].shifts)});
  Object.keys(PRANKS).forEach(k=>PRANKS[k].cost=nv('pk_'+k,PRANKS[k].cost));
  Object.keys(COSMETICS).forEach(k=>COSMETICS[k].cost=nv('cs_'+k,COSMETICS[k].cost));
  s.prankLimit=nv('pkLim',s.prankLimit);s.pranksOn=chk('pkOn',s.pranksOn);
  s.ride.cost=nv('rCost',s.ride.cost);s.ride.energy=nv('rEn',s.ride.energy);s.ride.minLv=nv('rLv',s.ride.minLv);
  const P=s.pvp;P.stake=nv('pStake',P.stake);P.range=nv('pRange',P.range);P.dice=Math.min(3,nv('pDice',P.dice));P.win=nv('pWin',P.win);P.bounty=nv('pBounty',P.bounty);P.revenge=nv('pRev',P.revenge);P.perShift=nv('pPer',P.perShift);P.maxIn=nv('pMax',P.maxIn);P.auto=chk('pAuto',P.auto);
  s.mystDensity=nv('eDens',s.mystDensity);s.kahonCost=nv('eKahon',s.kahonCost);if(s.prices)s.prices.kahon=s.kahonCost;if(val('eBossDay'))s.bossDay=val('eBossDay');s.bossNeed=nv('eBossNeed',s.bossNeed);s.bossReward=nv('eBossRew',s.bossReward);
  if(val('eBossQ'))BOSSQ.q=val('eBossQ');
  s.tropaSize=nv('eTSize',s.tropaSize);s.tropaBonus=nv('eTBonus',s.tropaBonus);s.betCut=nv('eCut',s.betCut);s.betMax=nv('eMax',s.betMax);
  if(val('bTime'))s.balitaTime=val('bTime');s.balitaOn=chk('bOn',s.balitaOn);if(val('rDate'))s.revealDate=val('rDate');s.wrappedOn=chk('wOn',s.wrappedOn);
  const a=s.ac;a.timer=Math.max(15,nv('aTimer',a.timer));a.strikes=Math.max(1,nv('aStrikes',a.strikes));a.fast=nv('aFast',a.fast);
  a.fullscreen=chk('aFs',a.fullscreen);a.image=chk('aImg',a.image);a.shuffle=chk('aShuf',a.shuffle);a.watermark=chk('aWm',a.watermark);
}

/* ---------- Events ---------- */
root.addEventListener('change',e=>{
  const t=e.target,s=S.settings;
  if(['prizeMode','holidayMode','weatherMode','theme'].includes(t.name)){saveForms();s[t.name]=t.value;render()}
  else if(t.name==='wxPick'){if(LIVE&&MODE==='admin'){acall('weather_tonight',{key:t.value}).then(j=>{if(j.ok){applyLive(j);toast('Weather set for tonight')}else toast(j.error)})}else{s.weatherManual=t.value;render()}}
  else if(t.dataset&&t.dataset.wd!==undefined){saveForms();const w=+t.dataset.wd;s.days=t.checked?[...new Set([...s.days,w])]:s.days.filter(x=>x!==w);if(!s.days.length)s.days=[w];render()}
  else if(t.id==='sStart'||t.id==='sLen'){saveForms();render()}
  else if(t.id==='pvpTarget'){S.pvp.target=+t.value}
  else if(t.dataset&&t.dataset.rc!==undefined){s.countries[+t.dataset.rc]=t.value;buildTower();render()}
  else if(t.dataset&&t.dataset.hop!==undefined){s.hops[+t.dataset.hop]=t.value||null;buildTower();render()}
  else if(t.dataset&&t.dataset.lad){const [k,f,i]=t.dataset.lad.split('|');const g=S.ladder.find(x=>x.key===k);if(f==='every')g.every=+t.value;else g.prizes[+i]=Math.max(0,parseInt(t.value,10)||0);render()}
  else if(t.id==='phpCap'||t.id==='phpCapOn'){s.phpCapOn=chk('phpCapOn',s.phpCapOn);s.phpCap=nv('phpCap',s.phpCap);render()}
});
root.addEventListener('click',e=>{
  const t=e.target.closest('button,li[data-pid],tr[data-pid]');if(!t)return;
  const busy=S.chal.stage==='q';
  if(LIVE&&liveClick(t))return;
  if(!LIVE&&MODE==='admin'&&adminLiveClick(t))return;
  if(t.id==='vPlayer'||t.id==='vAdmin'){if(busy)return toast('Finish the challenge first');S.view=t.id==='vAdmin'?'admin':'player';$('#vPlayer').setAttribute('aria-pressed',S.view==='player');$('#vAdmin').setAttribute('aria-pressed',S.view==='admin');render();return}
  if(t.id==='d12'||t.id==='d27'){if(busy)return toast('Finish the challenge first');S.day=t.id==='d27'?27:12;$('#d12').setAttribute('aria-pressed',S.day===12);$('#d27').setAttribute('aria-pressed',S.day===27);S.chal=freshChal();S.extraBought=false;S.pvp=freshPvp();S.tropa={nico:false,bonus:false};S.boss={answered:false,pick:null,pct:64};S.bets={};render();scrollToMe();return}
  if(t.dataset.atab){saveForms();S.atab=t.dataset.atab;render();return}
  if(t.dataset.ptab){if(busy)return toast('Finish the challenge first');S.ptab=t.dataset.ptab;render();return}
  if(t.dataset.pid){flash(players[+t.dataset.pid]);return}
  if(t.dataset.diff){const k=t.dataset.diff,pool=QB[k];S.chal={...freshChal(),stage:'ready',diff:k,q:shuffled(pool[Math.floor(Math.random()*pool.length)]),extra:S.chal.extra};render();return}
  if(t.dataset.opt!==undefined&&S.chal.stage==='q'){S.chal.picked=+t.dataset.opt;root.querySelectorAll('#chalCard .opt').forEach(b=>b.setAttribute('aria-pressed',b===t));const sb=$('#submitAns');if(sb)sb.disabled=false;return}
  if(t.dataset.boss!==undefined){const i=+t.dataset.boss;S.boss.answered=true;S.boss.pick=i;S.boss.pct=i===BOSSQ.a?72:66;toast(i===BOSSQ.a?'Correct! The team just passed the goal':'Not quite. The team still needs more correct answers');render();return}
  if(t.dataset.move){S.pvp.move=t.dataset.move;const sel=$('#pvpTarget');if(sel)S.pvp.target=+sel.value;render();return}
  if(t.dataset.inmove){const marco=byName('Marco');const om=Object.keys(MOVES)[Math.floor(Math.random()*3)];S.pvp.incoming=false;S.pvp.inLog='';render();
    duel(marco,t.dataset.inmove,om,html=>{S.pvp.inLog=html;const el=$('#inLog');if(el)el.innerHTML=html},S.settings.pvp.stake);return}
  if(t.dataset.rmove){const opp=players[S.pvp.revenge];S.pvp.revenge=null;S.pvp.revengeUsed=true;S.pvp.rLog='';render();const om=Object.keys(MOVES)[Math.floor(Math.random()*3)];
    duel(opp,t.dataset.rmove,om,html=>{S.pvp.rLog=html;const el=$('#rLog');if(el)el.innerHTML=html},S.settings.pvp.revenge);return}
  if(t.dataset.bopt){const [m,o,od]=t.dataset.bopt.split('|');S.bets['_'+m]={o,od:+od};root.querySelectorAll(`[data-bopt^="${m}|"]`).forEach(b=>b.setAttribute('aria-pressed',b===t));return}
  if(t.dataset.bet){const m=t.dataset.bet,sel=S.bets['_'+m],amt=parseInt(val('bamt_'+m),10);
    if(!sel)return toast('Pick who you think will win');if(!amt||amt<1)return toast('Enter how many tokens to bet');if(amt>S.settings.betMax)return toast(`Max bet is ${S.settings.betMax} tokens`);if(amt>S.tokens)return toast(`You only have ${S.tokens} tokens`);
    const cut=Math.round(amt*S.settings.betCut/100);S.tokens-=amt;S.burnLive.bets+=cut;me.spent[S.day]+=cut;
    S.bets[m]={opt:sel.o,amt,cut,payout:Math.round(amt*sel.od),settled:false};toast(`Bet placed · ${cut} tokens burned as house cut`);render();return}
  if(t.dataset.settle){const b=S.bets[t.dataset.settle];b.settled=true;b.won=Math.random()<0.5;if(b.won)S.tokens+=b.payout;toast(b.won?`You won ${b.payout} tokens!`:'Better luck next time');render();return}
  if(t.dataset.veh){const v=VEH[t.dataset.veh];spend(v.cost,'vehicles');S.ride={key:t.dataset.veh,icon:v.icon,name:v.name,bonus:v.bonus,left:v.shifts,leg:v.leg};toast(`${v.icon} ${v.name} rented · ${v.cost} tokens burned`);render();flash(me,false);return}
  if(t.dataset.pet!==undefined){const p=S.pets[+t.dataset.pet],R=S.settings.ride,n=+val('petS'+t.dataset.pet)||1,eCost=R.energy*(wxNow()==='heat'?2:1)*n;
    if(eCost>p.energy)return toast(`${p.name} needs ${eCost} energy`);
    p.energy-=eCost;spend(R.cost*n,'pets');S.ride={key:p.key,icon:p.icon,name:p.name,bonus:p.bonus,left:n,pet:true,perk:p.perk};toast(`Riding ${p.name} for ${n} shift${n>1?'s':''} · ${R.cost*n} tokens burned`);render();flash(me,false);return}
  if(t.dataset.prank){const pr=PRANKS[t.dataset.prank],id=+val('prankTarget');spend(pr.cost,'pranks');S.pranked={type:t.dataset.prank,id};S.prankUsed=true;S.feed.unshift(['now',`Someone planted ${pr.icon} on ${players[id].name}`]);toast(`${pr.icon} planted on ${players[id].name}`);render();flash(players[id]);return}
  if(t.dataset.cos){const c=COSMETICS[t.dataset.cos];spend(c.cost,'cosmetics');S.owned.add(t.dataset.cos);S.equipped.add(t.dataset.cos);toast(`${c.name} bought and equipped`);render();flash(me);return}
  if(t.dataset.equip){const k=t.dataset.equip;S.equipped.has(k)?S.equipped.delete(k):S.equipped.add(k);render();flash(me);return}
  if(t.dataset.delhol!==undefined){S.settings.holidays.splice(+t.dataset.delhol,1);render();return}
  if(t.hasAttribute('data-flag')){t.closest('tr').remove();return}
  switch(t.id){
    case 'backPick':S.chal={...freshChal(),extra:S.chal.extra};render();break;
    case 'startQ':S.chal.stage='q';render();startTimer(S.settings.ac.timer);break;
    case 'hintBtn':{const q=S.chal.q;const wrong=q.opts.map((_,i)=>i).filter(i=>i!==q.a&&!S.chal.hidden.includes(i));S.chal.hidden.push(wrong[Math.floor(Math.random()*wrong.length)]);if(S.chal.hidden.includes(S.chal.picked))S.chal.picked=null;spend(15,'hints');toast('Hint used: one wrong answer removed');render();break}
    case 'submitAns':{clearInterval(timerInt);exitFS();S.chal.correct=S.chal.picked===S.chal.q.a;if(S.chal.correct)applyClimb();else{S.chal.stage='result';render()}break}
    case 'secondBtn':{S.usedSecond=true;spend(30,'second');S.chal.hidden.push(S.chal.picked);S.chal.picked=null;S.chal.stage='q';toast('Second Chance: 30 seconds');render();startTimer(30);break}
    case 'acceptBtn':applyClimb();break;
    case 'openKahon':{spend(S.settings.kahonCost,'kahon');S.chal.kahon=false;const r=Math.random();let msg;
      if(r<.25){if(!S.ride)S.ride={key:'gel',icon:'⚡',name:'Energy gel',bonus:3,left:1,leg:'any'};msg='⚡ Free Energy gel for your next shift!'}
      else if(r<.5){S.tokens+=60;msg='💰 60 tokens inside!'}
      else if(r<.75){msg='🧩 A bonus cipher fragment (tradeable)!'}
      else msg='💨 Walang laman! The box was empty.';
      S.chal.summary+=`<div class="result good" style="margin-top:8px">${msg}</div>`;S.feed.unshift(['now',`${ME} opened a Kahon: ${msg}`]);toast(msg);render();break}
    case 'skipKahon':S.chal.kahon=false;render();break;
    case 'extraBtn':{spend(40,'extra');S.extraBought=true;S.chal={...freshChal(),extra:true};toast('Extra climb bought · 40 tokens burned');render();break}
    case 'resetBtn':{resetMe();S.tokens=310;S.usedSecond=false;S.extraBought=false;S.bid=null;S.ride=null;S.pets=JSON.parse(JSON.stringify(MYPETS));S.climbsTeam={...CLIMBS_TEAM};S.feed=[];S.flags=[];resetBurn();S.pvp=freshPvp();S.chal=freshChal();S.found=new Set();S.owned=new Set();S.equipped=new Set();S.pranked=null;S.prankUsed=false;S.tropa={nico:false,bonus:false};S.boss={answered:false,pick:null,pct:64};S.bets={};render();scrollToMe();break}
    case 'nudge':toast('Slack nudge sent to Nico: "Takbo na, tropa!" (mock)');break;
    case 'nicoClimb':{S.tropa.nico=true;if(S.chal.stage==='done'){S.tropa.bonus=true;me.floor[S.day]=Math.min(100,fl(me)+S.settings.tropaBonus);toast('Puyat Squad complete! +1 step each');flash(me)}else toast('Nico climbed. Your climb completes the squad');render();break}
    case 'pvpSend':{const id=+val('pvpTarget');const opp=players[id];const om=Object.keys(MOVES)[Math.floor(Math.random()*3)];
      S.pvp.sent=true;S.pvp.log=`Challenge sent to ${esc(opp.name)}. Waiting for their move…`;render();
      setTimeout(()=>duel(opp,S.pvp.move,om,html=>{S.pvp.log=html;const el=$('#outLog');if(el)el.innerHTML=html},S.settings.pvp.stake),1100);break}
    case 'bidBtn':{const v=parseInt(val('bidIn'),10);if(!v||v<1){toast('Enter a bid of at least 1 token');break}if(v>S.tokens){toast(`You only have ${S.tokens} tokens`);break}S.bid=v;spend(v,'auction');toast('Bid sealed');render();break}
    case 'tradeBtn':toast('Trade offer posted to the Marathon board (mock)');break;
    case 'cipherBtn':toast((val('cipherIn')||'').toUpperCase().replace(/\s+/g,'')==='ANGTUNAYNABAYANIAYGISINGKAHITHATINGGABI!'?'Correct phrase! +10 steps (mock)':'Not the phrase yet. Keep collecting fragments.');break;
    case 'addHol':{const d=val('hDate'),l=(val('hLabel')||'').trim();if(!d||!l){toast('Add a date and a holiday name');break}S.settings.holidays.push({d,label:l,who:val('hWho')});S.settings.holidays.sort((a,b)=>a.d.localeCompare(b.d));render();toast('Holiday added');break}
    case 'declareBtn':{const sorted=[...players].filter(p=>!p.ghost).sort((a,b)=>fl(b)-fl(a));const lead=sorted.find(p=>elig(p)>=S.settings.elig)||sorted[0];$('#confirmBox').innerHTML=`<div class="confirm">Send <b>${peso(pot())}</b> to <b>${esc(lead.name)}</b> as payroll line <b>"Incentive – Bayani World Marathon"</b>? This also posts the winner in Slack.<div class="row"><button class="btn" id="confirmYes">Confirm</button><button class="btn ghost" id="confirmNo">Cancel</button></div></div>`;break}
    case 'confirmYes':$('#confirmBox').innerHTML='';toast('Winner sent to payroll (mock)');break;
    case 'confirmNo':$('#confirmBox').innerHTML='';break;
    case 'revealBtn':showReveal();break;
    case 'wrappedBtn':showWrapped();break;
    case 'closeOvl':$('#ovl').innerHTML='';break;
    case 'shareWrapped':toast('Wrapped card posted to Slack (mock)');break;
    case 'pauseBtn':toast('Season paused (mock)');break;
    case 'genBtn':toast("Next week's questions generated (mock)");break;
    case 'addQBtn':toast('Opens the add-question form (mock)');break;
    case 'testSlack':toast('Test recap sent to Slack (mock)');break;
    case 'reshuffle':toast('Mystery steps reshuffled (mock)');break;
    case 'newMarket':toast('Opens the new market form (mock)');break;
    case 'addCos':toast('Opens the add-cosmetic form (mock)');break;
    case 'saveBtn':saveForms();toast('Saved');render();break;
  }
});
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#ovl').innerHTML)$('#ovl').innerHTML=''});

/* boot moved to the portal wrapper */

/* ═════════════ LIVE LAYER (portal) ═════════════ */
S.view = MODE;
let LIVE = false, LD = null, PREVIEW_STATUS = 'loading', BUSY = false, SIG = '', SKEW = 0;
const DEMO_SNAPSHOT = { players, me };
const API_URL = (typeof GAMES_URL !== 'undefined') ? GAMES_URL : '';
const cp = () => (typeof currentPlayer !== 'undefined' && currentPlayer) ? currentPlayer : null;
const SPECIES_ICON = { dog:'🐕', cat:'🐈', parrot:'🦜', arowana:'🐟', goldfish:'🐠', rabbit:'🐇', chicken:'🐔', goat:'🐐', cow:'🐄', hamster:'🐹', turtle:'🐢', snake:'🐍', spider:'🕷️', frog:'🐸', gecko:'🦎', horse:'🐎' };
const PERK_TEXT = { dog:'Blocks 1 PvP knockback (PvP coming soon)', horse:'+1 more on Hard answers', cat:'Ignores the rain penalty' };
SINK_LABEL.vehicles = 'Gear';

async function call(mAction, args){
  const p = cp(); if(!p) return { ok:false, error:'Log in first.' };
  try { const r = await fetch(API_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'marathon', playerId:p.id, playerName:p.name, mAction, args:args || {} }) });
    return await r.json(); } catch(e){ return { ok:false, error:'offline' }; }
}
async function acall(adminAction, payload){
  if(typeof _adminPinSession === 'undefined' || !_adminPinSession) return { ok:false, error:'Please log in to admin again.' };
  try { const r = await fetch(API_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'marathon', mAction:'admin', pin:_adminPinSession, adminAction, payload:payload || {} }) });
    return await r.json(); } catch(e){ return { ok:false, error:'offline' }; }
}

const _avCache = new Map();
function realAvatar(pid){
  if(_avCache.has(pid)) return _avCache.get(pid);
  let out = null;
  try { const h = window.avatarHtml(pid, 40, false); const m = h && h.match(/<svg[\s\S]*<\/svg>/);
    if(m) out = m[0].replace(/<circle cx="100" cy="128" r="96"[^>]*\/>/, '').replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, ''); } catch(e){}
  _avCache.set(pid, out); return out;
}
function lookFor(pid, i){ const h = hash32(pid); return { skin:SKIN[h % 5], hair:HAIR[(h >> 3) % 6], style:(h >> 6) % 3, outfit:OUT[(h >> 9) % 8], acc:ACC[(h >> 12) % 6] }; }
function hash32(s){ let h = 2166136261; for(const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

function applyLive(j){
  LD = j; LIVE = true; S.day = 'live'; SKEW = (j.now || Date.now()) - Date.now();
  const st = j.settings || {};
  Object.keys(st).forEach(k => { if(st[k] === undefined || k === 'ladder' || k === 'gear') return;
    const v = st[k], cur = S.settings[k];
    S.settings[k] = (v && typeof v === 'object' && !Array.isArray(v) && cur && typeof cur === 'object' && !Array.isArray(cur)) ? Object.assign({}, cur, v) : v; });
  if(S.settings.prices) S.settings.kahonCost = S.settings.prices.kahon;
  if(st.gear) Object.keys(VEH).forEach(k => { if(st.gear[k]) Object.assign(VEH[k], st.gear[k]); });
  if(Array.isArray(st.ladder)) S.ladder = st.ladder;
  if(!Array.isArray(S.settings.hops)) S.settings.hops = [null, null, null];
  SHIFT.live = Math.max(1, j.season.shift || 1);
  CLIMBS_TEAM.live = j.totalClimbs || 0; BONUS.live = j.bonus || 0;
  FOUND_BASE.live = j.found || [];
  Object.keys(MYST).forEach(k => delete MYST[k]); Object.assign(MYST, j.mystery || {});
  const b = j.burn || {};
  BURN_BASE.live = { entry:b.entry || 0, hints:b.hints || 0, second:b.second || 0, extra:b.extra || 0, auction:0, vehicles:b.gear || 0, pets:b.pets || 0, pvp:0, bets:0, kahon:b.kahon || 0, pranks:0, cosmetics:0 };
  Object.keys(S.burnLive).forEach(k => S.burnLive[k] = 0);
  DAILY_BURN.length = 0;
  const days = (j.seasonDays || seasonCalc().days).filter(d => d.n && d.n <= SHIFT.live);
  days.forEach(d => DAILY_BURN.push((j.burnByShift || {})[d.iso] || 0)); if(!DAILY_BURN.length) DAILY_BURN.push(0);
  const pid = cp() ? cp().id : null;
  players = (j.racers || []).map((r, i) => Object.assign({ id:i, pid:r.id, name:r.name, floor:{ live:r.step == null ? 90 + hash32(r.id) % 9 : r.step }, climbs:{ live:r.climbs || 0 },
    streak:{ live:r.streak || 0 }, spent:{ live:r.spentTotal || 0 }, ride:{ live:r.ride || null }, elig:r.elig, title:r.title }, lookFor(r.id, i)));
  me = MODE === 'player' ? players.find(p => p.pid === pid) : null;
  if(!me){ me = Object.assign({ id:players.length, pid:pid || 'ghost', name:MODE === 'admin' ? 'Admin' : (cp() ? cp().name : 'You'), ghost:true, floor:{ live:0 }, climbs:{ live:0 }, streak:{ live:0 }, spent:{ live:0 }, ride:{ live:null }, elig:100 }, lookFor(pid || 'x', 0)); players.push(me); }
  S.tokens = (typeof _myTokenBalance !== 'undefined' && _myTokenBalance != null) ? _myTokenBalance : S.tokens;
  S.feed = (j.feed || []).map(e => [new Date(e.ts).toLocaleTimeString('en-PH', { timeZone:'Asia/Manila', hour:'numeric', minute:'2-digit' }), e.text]);
  S.flags = (j.flags || []).map(f => ({ who:f.who, what:f.what, when:new Date(f.ts).toLocaleString('en-PH', { timeZone:'Asia/Manila', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }), sev:f.sev }));
  // pets & boosts
  const m = j.me || {};
  const pets = (typeof DB !== 'undefined' && DB.pets && pid) ? (DB.pets[pid] || []).filter(p => p && p.status === 'alive') : [];
  S.pets = pets.map(p => ({ key:p.id, icon:SPECIES_ICON[p.species] || '🐾', name:p.name || 'Pet', level:`Lv ${p.level || 1}`, lv:+p.level || 1, species:p.species,
    energy:(m.petEnergy || {})[p.id] ?? 100, perk:PERK_TEXT[p.species] || 'Steady pacer: +2 on correct answers', bonus:2 }));
  const g = m.gear, pc = m.pacer;
  S.ride = g ? { key:g.key, icon:g.icon, name:g.name, bonus:g.bonus, left:g.left, leg:(VEH[g.key] || {}).leg } : pc ? { key:pc.petId, icon:SPECIES_ICON[pc.species] || '🐾', name:pc.name, bonus:pc.bonus, left:pc.left, pet:true, perk:PERK_TEXT[pc.species] || '' } : null;
  if(me && !me.ghost) me.ride.live = g ? g.icon : pc ? (SPECIES_ICON[pc.species] || '🐾') : null;
  // challenge
  const t = m.today;
  if(!t) S.chal = S.chal && S.chal.stage === 'ready' ? S.chal : freshChal();
  else if(t.stage === 'q'){
    const same = S.chal && S.chal.stage === 'q' && S.chal.q && S.chal.q.q === t.q.text;
    S.chal = { stage:'q', diff:t.diff, q:{ cat:t.q.cat, q:t.q.text, opts:t.q.opts, a:-1, why:'' }, hidden:t.q.hidden || [], picked:same ? S.chal.picked : null, strikes:t.strikes,
      total:t.total, deadline:t.deadline - SKEW, started:Date.now(), insured:t.insured };
  } else if(t.stage === 'done'){
    if(t.extraOpen) S.chal = S.chal && S.chal.stage === 'ready' ? S.chal : Object.assign(freshChal(), { extra:true });
    else { const sm = t.summary || { before:0, after:0, lines:[] };
      S.chal = { stage:'done', diff:t.diff, q:{ cat:t.q.cat, q:t.q.text, opts:t.q.opts, a:t.answer, why:t.why || '' }, hidden:[], picked:t.picked, correct:t.correct, kahon:t.kahon,
        summary:`<div>Step ${sm.before} → <b class="mono">${sm.after}</b></div><ul>${sm.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul><p class="sub" style="margin-top:6px">${esc(t.why || '')}</p>` }; }
    S.extraBought = !!t.extraUsed;
  }
  const sig = (me && me.ghost ? 'g|' : 'r|') + players.map(p => p.pid).join(',') + '|' + Object.keys(MYST).join(',') + '|' + S.settings.countries.join(',') + '|' + (S.settings.hops || []).join(',');
  const rebuilt = sig !== SIG; if(rebuilt){ SIG = sig; buildTower(); }
  render();
  if(rebuilt) setTimeout(() => { try { scrollToMe(); } catch(e){} }, 30);
  if(S.chal.stage === 'q' && !timerInt) resumeTimer();
}
function resumeTimer(){
  const c = S.chal; clearInterval(timerInt);
  timerInt = setInterval(() => {
    if(S.chal.stage !== 'q'){ clearInterval(timerInt); timerInt = null; return; }
    const left = Math.max(0, (S.chal.deadline - Date.now()) / 1000), t = $('#qtimer'), b2 = $('#tbar');
    if(t){ t.textContent = Math.ceil(left) + 's'; t.classList.toggle('low', left <= 10); }
    if(b2) b2.style.width = (left / (S.chal.total || 60) * 100) + '%';
    if(left <= 0){ clearInterval(timerInt); timerInt = null; liveAct('timeout'); }
  }, 250);
}
async function liveAct(mAction, args, okMsg){
  if(BUSY) return; BUSY = true;
  const j = await call(mAction, args); BUSY = false;
  if(!j || !j.ok){ toast((j && j.error === 'offline') ? 'Can\'t reach the server. Try ulit.' : (j && j.error) || 'Something went wrong.'); return j; }
  if(mAction === 'answer' || mAction === 'timeout' || (mAction === 'strike' && j.me && j.me.today && j.me.today.stage === 'done')) { exitFS(); clearInterval(timerInt); timerInt = null; }
  try { if(typeof refreshTokenBalance === 'function') await refreshTokenBalance(); } catch(e){}
  applyLive(j);
  if(j.retry){ resumeTimer(); }
  if(j.msg || okMsg) toast(j.msg || okMsg);
  if(['answer', 'timeout', 'kahon', 'gear', 'pacer'].includes(mAction)) setTimeout(() => flash(me), 80);
  return j;
}
function liveClick(t){
  if(MODE === 'admin') return adminLiveClick(t);
  if(t.id === 'joinBtn'){ liveAct('join'); return true; }
  if(t.dataset.diff){ S.chal = Object.assign(freshChal(), { stage:'ready', diff:t.dataset.diff, extra:S.chal.extra }); render(); return true; }
  if(t.id === 'startQ'){
    const insure = !!($('#insure') && $('#insure').checked);
    if(S.settings.ac.fullscreen !== false){ const card = $('#chalCard'); try { const r = card.requestFullscreen && card.requestFullscreen(); r && r.catch && r.catch(() => {}); } catch(e){} }
    liveAct('start', { diff:S.chal.diff, insure }); return true;
  }
  if(t.id === 'submitAns'){ if(S.chal.picked == null) return true; liveAct('answer', { choice:S.chal.picked }); return true; }
  if(t.id === 'hintBtn'){ liveAct('hint', {}, 'Hint used: one wrong answer removed'); return true; }
  if(t.id === 'extraBtn'){ liveAct('extra'); return true; }
  if(t.id === 'openKahon'){ liveAct('kahon'); return true; }
  if(t.id === 'skipKahon'){ liveAct('skip_kahon'); return true; }
  if(t.dataset.veh){ liveAct('gear', { key:t.dataset.veh }); return true; }
  if(t.dataset.pet !== undefined){ const p = S.pets[+t.dataset.pet], n = +val('petS' + t.dataset.pet) || 1;
    liveAct('pacer', { petId:p.key, petName:p.name, species:p.species, level:p.lv, shifts:n }); return true; }
  if(t.id === 'resetBtn') return true;
  return false;
}
// strikes go to the server in live mode
const _strikeLocal = strike;
strike = function(){
  if(!visible()) return;
  if(!LIVE) return _strikeLocal();
  if(S.view !== 'player' || !S.chal || S.chal.stage !== 'q' || Date.now() - lastStrike < 800 || !visible()) return;
  lastStrike = Date.now(); toast('Strike: stay on the challenge screen'); liveAct('strike');
};
function visible(){ return host.isConnected && host.offsetParent !== null && !document.hidden; }

function settingsPayload(){
  const s = JSON.parse(JSON.stringify(S.settings));
  s.gear = {}; Object.keys(VEH).forEach(k => s.gear[k] = { cost:VEH[k].cost, bonus:VEH[k].bonus, shifts:VEH[k].shifts });
  s.ladder = S.ladder; delete s.weatherManual; delete s.status; delete s.betaIds;
  return s;
}
function adminLiveClick(t){
  if(t.id === 'saveBtn'){ saveForms(); acall('save', { settings:settingsPayload() }).then(j => { if(j.ok){ applyLive(j); toast('Saved to the server'); } else toast(j.error === 'offline' ? 'Backend not live yet: saved in this preview only.' : j.error); }); return true; }
  if(t.id === 'statusBtn'){ const st = (root.querySelector('input[name="bmStatus"]:checked') || {}).value || 'off';
    const beta = Array.from(root.querySelectorAll('input[data-beta]:checked')).map(x => x.dataset.beta);
    acall('status', { status:st, betaIds:beta }).then(j => { if(j.ok){ applyLive(j); toast(j.msg || 'Saved'); } else toast(j.error); }); return true; }
  if(t.id === 'confirmYes'){ const lead = [...players].filter(p => !p.ghost).sort((a, b) => fl(b) - fl(a)).find(p => elig(p) >= S.settings.elig);
    if(!lead) return true; acall('declare', { playerId:lead.pid }).then(j => { $('#confirmBox').innerHTML = ''; if(j.ok){ applyLive(j); toast(j.msg); } else toast(j.error); }); return true; }
  if(t.id === 'testSlack'){ acall('test_hook').then(j => toast(j.ok ? j.msg : j.error)); return true; }
  if(t.id === 'pauseBtn'){ acall('status', { status:'off' }).then(j => { if(j.ok){ applyLive(j); toast('Marathon turned off'); } else toast(j.error); }); return true; }
  return false;
}
function adminStatusCard(){
  if(!LIVE) return `<div class="card" style="border-color:rgba(242,179,61,.6)"><h3>Backend not live yet</h3><p class="sub" style="margin:0">The <b>marathon</b> action isn't deployed on bingo-games yet, so this tab shows demo data and saving only changes this preview. Everything goes live once Viktor runs marathon.sql and adds marathonEngine.ts.</p></div>`;
  const st = LD.status || 'off', beta = new Set(LD.settings.betaIds || []);
  const roster = (typeof DB !== 'undefined' && DB.players) ? DB.players : [];
  return `<div class="card"><h3>Game status</h3><div class="radios">
    ${[['off', 'Off', 'Players see a "coming soon" preview.'], ['beta', 'Beta', 'Only the players you tick below can play.'], ['open', 'Open', 'Everyone can join and race.']].map(([k, l, d]) => `<label class="radio"><input type="radio" name="bmStatus" value="${k}" ${st === k ? 'checked' : ''}><span><b>${l}</b><small>${d}</small></span></label>`).join('')}</div>
    <details style="margin-top:10px"><summary class="sub" style="cursor:pointer">Beta testers (${beta.size})</summary><div class="days" style="margin-top:8px">${roster.map(p => `<label><input type="checkbox" data-beta="${esc(p.id)}" ${beta.has(p.id) ? 'checked' : ''}>${esc(p.name)}</label>`).join('')}</div></details>
    <div class="row"><button class="btn" id="statusBtn">Save status</button>${LD.winner ? `<span class="pill gold">🏆 Winner: ${esc(LD.winner.name)} · ${peso(LD.winner.prize)}</span>` : ''}</div></div>`;
}
function joinHTML(){
  const s = S.settings, ph = LD.season.phase;
  const closed = ph === 'ended' || (ph === 'live' && LD.season.shift > s.lateJoin);
  return `<h3>Bayani World Marathon</h3><h2>${closed ? 'Joining is closed' : 'Join the race'}</h2>
    <p class="sub">Swim, bike and run through ${s.countries.map(k => COUNTRIES[k].flag + ' ' + COUNTRIES[k].name).join(' → ')}. One brain challenge per shift moves you along the course. Biggest cash prize in the portal: <b style="color:var(--gold2)">${peso(s.prizeMode === 'fixed' ? s.fixed : s.cap)}</b>.</p>
    <ul class="rules"><li>Entrance fee: <b>${s.fee} tokens</b>.</li><li>Race on at least ${s.elig}% of shifts to be eligible for the cash prize.</li><li>Starts ${fmtD(s.start)}. Joining closes after shift ${s.lateJoin}.</li></ul>
    <div class="row">${closed ? '<span class="pill bad">See you next season!</span>' : `<button class="btn" id="joinBtn" ${S.tokens < s.fee ? 'disabled' : ''}>Join · ${s.fee} tokens</button>`}</div>`;
}
function noteText(){
  if(LIVE) return isAdmin() ? 'Live race data: exact steps for everyone and every mystery step.' : `You're racing as <b>${esc(me.name)}</b>${LD.me && LD.me.joined ? '' : ' · not joined yet'}.`;
  if(isAdmin()) return 'Preview with demo data. The race server isn\'t live yet.';
  return PREVIEW_STATUS === 'soon' ? `🏁 Coming soon: the race starts ${fmtD(S.settings.start)}. Preview with your real team and sample progress.` : PREVIEW_STATUS === 'offline' ? 'Preview with your real team and sample progress. The race server isn\'t live yet.' : 'Loading the race…';
}
function noRaceHTML(){
  const ph = LD.season.phase;
  return `<h3>Daily Takbo Challenge</h3><h2>${ph === 'pre' ? 'Starting soon' : ph === 'ended' ? 'The race is over' : 'No race tonight'}</h2>
    <p class="sub">${ph === 'pre' ? `The first shift is ${fmtD(S.settings.start)}. You can gear up now.` : ph === 'ended' ? `Watch for the Finish Line Reveal on ${esc(S.settings.revealDate)}.` : 'Rest day (weekend or client holiday). See you next shift!'}</p>`;
}
function soonHTML(items){
  return `<h3>Coming during the season</h3><h2>More ways to play</h2><p class="sub">These switch on in phase 2. You can try them now in the preview on the admin's demo.</p><ul class="rules">${items.map(x => `<li>${x}</li>`).join('')}</ul>`;
}
function renderPlayerLive(){
  const PT = [['climb', 'Takbo'], ['shop', 'Tindahan'], ['news', 'Balita & Ranks']];
  if(!PT.find(x => x[0] === S.ptab)) S.ptab = 'climb';
  const tabs = `<div class="atabs" role="group" aria-label="Game sections">${PT.map(([k, l]) => `<button data-ptab="${k}" aria-pressed="${S.ptab === k}">${l}</button>`).join('')}</div>`;
  let body = '';
  const joined = LD.me && LD.me.joined;
  if(S.ptab === 'climb'){
    const main = !joined ? joinHTML() : (!LD.season.tonight && S.chal.stage !== 'done' && S.chal.stage !== 'q') ? noRaceHTML() : challengeHTML();
    body = `<div class="card ${S.chal.stage === 'q' ? 'locked' : ''}" id="chalCard">${main}</div><div class="card">${soonHTML(['⚔️ Hamon (Bato, Papel, Gunting duels)', '🎲 Pustahan spectator bets', '👥 Tropa squads', '🧠 Boss Night with Sir Rendy'])}</div>`;
  }
  if(S.ptab === 'shop') body = `<div class="card">${joined ? garageHTML() : '<h3>Gear &amp; Pet Pacers</h3><p class="sub">Join the marathon to gear up.</p>'}</div><div class="card">${soonHTML(['🍌 Kalokohan pranks', '✨ Marathon Shop cosmetics'])}</div>`;
  if(S.ptab === 'news') body = `<div class="card"><h3>Balita sa Karera</h3><h2>Latest on the course</h2><ul class="news">${S.feed.length ? S.feed.slice(0, 12).map(f => `<li><span class="mono" style="color:var(--muted)">${f[0]}</span> · ${esc(f[1])}</li>`).join('') : '<li>No news yet.</li>'}</ul>
      ${LIVE && LD.season.phase === 'ended' ? '<div class="row"><button class="btn" id="revealBtn">Finish Line Reveal</button></div>' : ''}</div>
    <div class="two"><div class="card">${leaderboardHTML()}</div><div class="card">${soonHTML(['🎟️ Friday Fast-Pass Auction', '🧩 Finish Line Cipher', '📊 Marathon Wrapped'])}</div></div>`;
  $('#side').innerHTML = tabs + body;
  if(S.ptab === 'climb' && S.chal.stage === 'q') drawQ();
}

async function load(){
  if(BUSY) return;
  if(MODE === 'admin'){ const j = await acall('state'); if(j && j.ok && j.racers){ applyLive(j); } else { LIVE = false; render(); } return; }
  const j = await call('state');
  if(j && j.ok && j.racers){ PREVIEW_STATUS = 'open'; if(S.chal.stage === 'q' && LIVE) { LD = j; return; } applyLive(j); return; }
  PREVIEW_STATUS = (j && j.ok) ? 'soon' : 'offline'; LIVE = false; players = DEMO_SNAPSHOT.players; me = DEMO_SNAPSHOT.me; applyRoster(); S.day = S.day === 'live' ? 12 : S.day; SIG = ''; buildTower(); render();
}
let pollT = null;
function startPolling(){ clearInterval(pollT); pollT = setInterval(() => { if(visible() && S.chal.stage !== 'q') load(); }, MODE === 'admin' ? 15000 : 20000); }
document.addEventListener('fullscreenchange', () => { if(S.chal && S.chal.stage === 'q') setTimeout(() => { try { drawQ(); } catch(e){} }, 60); });
const _scrollToMe0 = scrollToMe;
scrollToMe = function(){ if(me && me.ghost){ const sc = $('#tscroll'); if(sc){ sc.style.scrollBehavior = 'auto'; sc.scrollTop = sc.scrollHeight; sc.style.scrollBehavior = ''; } return; } _scrollToMe0(); };

// ── Preview uses the real roster: every active player takes one sample racer's spot ──
let NAME_MAP = null, NAME_RE = null;
function applyRoster(){
  const ros = (typeof DB !== 'undefined' && Array.isArray(DB.players) ? DB.players : []).filter(p => p && p.active !== false && p.name);
  const demo = DEMO_SNAPSHOT.players, meD = DEMO_SNAPSHOT.me;
  demo.forEach(p => { if(!p.demoName) p.demoName = p.name; });
  if(!ros.length){ players = demo; me = meD; return; }
  const myId = cp() ? cp().id : null, mine = ros.find(r => r.id === myId), others = ros.filter(r => r !== mine);
  NAME_MAP = {};
  demo.forEach(p => { p.pid = null; p.name = p.demoName; });
  const take = p => { const r = p === meD && mine ? mine : others.shift(); if(!r) return; p.name = r.name; p.pid = r.id; NAME_MAP[p.demoName] = r.name; };
  take(meD); demo.filter(p => p !== meD).forEach(take);
  players = demo.filter(p => p.pid); me = meD.pid ? meD : players[0];
  NAME_RE = new RegExp('\\b(' + Object.keys(NAME_MAP).join('|') + ')\\b', 'g');
  _avCache.clear();
}
function realize(str){ return (!LIVE && NAME_RE && typeof str === 'string') ? str.replace(NAME_RE, m => NAME_MAP[m] || m) : str; }
const _showWrapped0 = showWrapped;
showWrapped = function(){ _showWrapped0(); const o = $('#ovl'); if(o) o.innerHTML = realize(o.innerHTML); };

// Windows doesn't draw flag emoji (it shows letters like "JP"), so hide flags there instead of showing letters.
(function(){ try {
  const c = document.createElement('canvas'); c.width = c.height = 24; const x = c.getContext('2d');
  x.textBaseline = 'top'; x.font = '20px sans-serif'; x.fillStyle = '#000'; x.fillText('\u{1F1EF}\u{1F1F5}', 0, 0);
  const d = x.getImageData(0, 0, 24, 24).data; let red = false;
  for(let i = 0; i < d.length; i += 4) if(d[i + 3] > 0 && d[i] > 150 && d[i + 1] < 90 && d[i + 2] < 90){ red = true; break; }
  if(!red) Object.values(COUNTRIES).forEach(v => v.flag = '');
} catch(e){} })();

  buildTower(); render(); scrollToMe();
  load().then(() => { try { scrollToMe(); } catch(e){} });
  startPolling();
  return { load, render, get live(){ return LIVE; } };
}

// ═════════════════════ PORTAL WIRING ═════════════════════
GP_TITLES.marathon = 'Bayani World Marathon';
const GAME_ORDER = ['marathon', 'city', 'race', 'park', 'bingo'];
const ADMIN_ORDER = ['marathon', 'bayanicity', 'petrace', 'park', 'game'];

function injectPlayer(){
  const nav = document.getElementById('gpNav');
  if(nav && !nav.querySelector('[data-v="marathon"]')){
    const b = document.createElement('button'); b.className = 'sub'; b.dataset.v = 'marathon'; b.setAttribute('onclick', "gpGo('marathon')");
    b.innerHTML = '🏅 World Marathon <span class="gp-cnt" id="gpCntMarathon"></span>'; nav.appendChild(b);
  }
  const games = document.querySelector('#gpv-player .gp-games');
  if(games && !document.getElementById('gpTileMarathon')){
    const d = document.createElement('div'); d.className = 'gp-game'; d.setAttribute('onclick', "gpGo('marathon')");
    d.style.cssText = 'border-color:rgba(239,176,66,.6);background:linear-gradient(135deg,rgba(239,176,66,.16),transparent)';
    d.innerHTML = '<span class="ic">🏅</span><b>Bayani World Marathon</b><span class="gp-left" id="gpTileMarathon">★ Premium · biggest cash prize</span>';
    games.prepend(d);
  }
  const anyView = document.querySelector('.gp-view');
  if(anyView && !document.getElementById('gpv-marathon')){
    const s = document.createElement('section'); s.className = 'gp-view'; s.id = 'gpv-marathon';
    s.innerHTML = '<div id="bmHost" style="min-width:0"></div>'; anyView.parentNode.appendChild(s);
  }
}
function injectAdmin(){
  const anchor = document.querySelector('.tab-btn[data-tab="game"]');
  if(anchor && !document.querySelector('.tab-btn[data-tab="marathon"]')){
    const b = document.createElement('button'); b.className = 'tab-btn'; b.dataset.tab = 'marathon'; b.setAttribute('onclick', "switchAdminTab('marathon')");
    b.innerHTML = '🏅 World Marathon <span class="adm-chip">NEW</span>'; anchor.before(b);
  }
  const at = document.getElementById('tab-game') || document.querySelector('.tab-content');
  if(at && !document.getElementById('tab-marathon')){
    const d = document.createElement('div'); d.className = 'tab-content'; d.id = 'tab-marathon';
    d.innerHTML = '<div id="bmaHost" style="min-width:0"></div>'; at.parentNode.insertBefore(d, at);
  }
}
function reorder(){
  try {
    const nav = document.getElementById('gpNav');
    if(nav){
      const grp = Array.from(nav.querySelectorAll('.gp-grp')).find(g => g.textContent.trim() === 'Games');
      let a = grp; if(a) GAME_ORDER.forEach(v => { const b = nav.querySelector(`button[data-v="${v}"]`); if(b){ a.after(b); a = b; } });
    }
    const games = document.querySelector('#gpv-player .gp-games');
    if(games){
      const tile = v => Array.from(games.children).find(x => (x.getAttribute('onclick') || '').includes(`'${v}'`));
      let prev = null; GAME_ORDER.forEach(v => { const t = tile(v); if(!t) return; prev ? prev.after(t) : games.prepend(t); prev = t; });
    }
    const first = document.querySelector('.tab-btn[data-tab="marathon"]') || document.querySelector('.tab-btn[data-tab="game"]');
    if(first){ let a = null; ADMIN_ORDER.forEach(k => { const b = document.querySelector(`.tab-btn[data-tab="${k}"]`); if(!b) return; if(!a){ a = b; return; } a.after(b); a = b; }); }
  } catch(e){ console.error('bayani-marathon reorder', e); }
}
function ensure(kind){
  if(APPS[kind]) return APPS[kind];
  const host = document.getElementById(kind === 'admin' ? 'bmaHost' : 'bmHost'); if(!host) return null;
  try { APPS[kind] = createApp(host, kind === 'admin' ? 'admin' : 'player'); } catch(e){ console.error('bayani-marathon', e); }
  return APPS[kind];
}
const _gpGo = window.gpGo;
window.gpGo = function(v){
  const r = _gpGo.apply(this, arguments);
  if(v === 'marathon'){ const a = ensure('player'); if(a){ a.render(); a.load(); } }
  return r;
};
if(typeof switchAdminTab === 'function'){
  const _sw = window.switchAdminTab;
  window.switchAdminTab = function(name){ const r = _sw.apply(this, arguments); if(name === 'marathon'){ const a = ensure('admin'); if(a) a.load(); } return r; };
}
async function badge(){
  const p = (typeof currentPlayer !== 'undefined' && currentPlayer) ? currentPlayer : null; if(!p || typeof GAMES_URL === 'undefined') return;
  let j = null; try { const r = await fetch(GAMES_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ action:'marathon', playerId:p.id, playerName:p.name, mAction:'state' }) }); j = await r.json(); } catch(e){}
  const c = document.getElementById('gpCntMarathon'), t = document.getElementById('gpTileMarathon');
  const live = j && j.ok && j.racers, n = live ? j.racers.length : 0;
  if(c) c.textContent = live ? `${n}🏃` : 'Soon';
  if(t) t.textContent = live ? (j.me && j.me.joined ? `Step ${j.me.step} · ${n} racers` : `★ Premium · ${n} racers · join now`) : '★ Premium · coming soon';
}
if(typeof TOKEN_EVENT_LABELS !== 'undefined') Object.assign(TOKEN_EVENT_LABELS, { marathon_entry:'🏅 Marathon Entry', marathon_hint:'🏅 Marathon Hint', marathon_second:'🏅 Marathon Second Chance',
  marathon_extra:'🏅 Marathon Extra Race', marathon_gear:'🏅 Marathon Gear', marathon_pacer:'🏅 Marathon Pet Pacer', marathon_kahon:'🏅 Marathon Kahon', marathon_kahon_win:'🎁 Marathon Kahon Prize' });
function boot(){ try { injectPlayer(); injectAdmin(); reorder(); if(typeof _gpView !== 'undefined' && _gpView === 'marathon'){ const a = ensure('player'); if(a) a.render(); } } catch(e){ console.error('bayani-marathon', e); } }
boot(); setTimeout(boot, 1600); setTimeout(reorder, 3200); setTimeout(badge, 3500); setInterval(() => { if(!document.hidden) badge(); }, 180000);
window.bayaniMarathon = { apps:APPS, ensure, reorder };
})();
