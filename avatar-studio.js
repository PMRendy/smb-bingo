// ═══════════════════════════════════════════════════════════════════════════
//  avatar-studio.js — Avatar Studio revamp (page side) · SMB Game Portal
//  2026-11-04 · needs bayani-chibi-avatar.js loaded first
//
//  Load AFTER the portal's main scripts (just before </body>). It:
//   • adds the new catalog items (hair styles, personalities, pins, new outfits…)
//     to the existing AVATAR_* lists, so Admin prices / on-off apply as usual
//   • replaces avatarHtml() with the chibi SVG renderer (cached, head crop < 40px)
//   • replaces the Avatar Studio screen (6 steps, tap-to-try, try-on cost,
//     Save look / Reset, pronouns, 3 saved looks) and the profile pop-up
//
//  Works BEFORE the backend update (Viktor): legacy items keep working; new items
//  can be tried on and show "Soon" until the server lists them in shop.items.
//  Look settings / saved looks fall back to this device until the endpoints exist.
//
//  Backend contract this file expects (see Viktor brief):
//   GET config  shop.items[cat][id] = {price,on}  — include NEW ids, also price-0 ones
//   GET /state  avatarLook[playerId] = {skin,lashes,bottom,pronouns,showPronouns}
//               savedLooks[playerId] = [{name,equipped:{cat:id},look:{…}} | null ×3]
//   POST {COSMETICS}/equip-cosmetic {playerId,category,itemId}   (+3 new categories)
//   POST {COSMETICS}/avatar-look    {playerId,look}              -> {ok,avatarLook}
//   POST {COSMETICS}/saved-looks    {playerId,slot,name,equipped,look} | {playerId,slot,remove:true} -> {ok,savedLooks}
// ═══════════════════════════════════════════════════════════════════════════
(function(){
'use strict';
if(typeof avatarSVG !== 'function' || typeof AVATAR_CATEGORIES === 'undefined') { console.warn('[avatar-studio] renderer or catalog missing'); return; }

// ── 1. Catalog ───────────────────────────────────────────────────────────────
// Snapshot what the server already knows (legacy ids) BEFORE adding new ones.
const LEGACY = {};
AVATAR_CATEGORIES.forEach(c => { LEGACY[c.key] = c.catalog.map(i => i.id); });

const ART = window.AVATAR_ART || {};
const hx = id => (ART.HAIR && ART.HAIR[id]) || '#888';
const add = (list, items) => items.forEach(it => { if(!list.find(x => x.id === it.id)) list.push(it); });

add(AVATAR_HAIR, [
  { id:'pink', name:'Pink', price:30, hex:hx('pink'), css:`background:${hx('pink')};`, proposed:true },
  { id:'blue', name:'Blue', price:30, hex:hx('blue'), css:`background:${hx('blue')};`, proposed:true },
]);
// 'formal' becomes two items. Keep the old entry (hidden) so saved data still resolves.
const formal = AVATAR_OUTFITS.find(i => i.id === 'formal'); if(formal) formal.legacy = true;
add(AVATAR_OUTFITS, [
  { id:'barong', name:'Barong', price:60, emoji:'🥻' },
  { id:'terno',  name:'Terno',  price:60, emoji:'👘' },
  { id:'agent',  name:'SMB Agent', price:150, emoji:'🎧', rarity:'legendary', signature:true, proposed:true },
  { id:'knight', name:'Knight', price:120, emoji:'🛡️', proposed:true },
  { id:'mage',   name:'Mage',   price:120, emoji:'🔮', proposed:true },
  { id:'pride',  name:'Pride Tee', price:0, emoji:'🏳️‍🌈', free:true },
]);
add(AVATAR_ACCESSORIES, [
  { id:'helmet', name:'Knight Helm', price:60, emoji:'⛑️', proposed:true },
  { id:'wizard', name:'Wizard Hat',  price:60, emoji:'🧙', proposed:true },
  { id:'flower', name:'Flower Clip', price:15, emoji:'🌺', proposed:true },
]);
const AVATAR_HAIR_STYLES = [
  { id:'spiky', name:'Spiky', price:0, free:true }, { id:'long', name:'Long', price:0, free:true },
  { id:'buzz', name:'Buzz', price:0, free:true },   { id:'bob', name:'Bob', price:20, proposed:true },
  { id:'pompadour', name:'Pompadour', price:25, proposed:true }, { id:'ponytail', name:'Ponytail', price:25, proposed:true },
  { id:'curly', name:'Curly', price:25, proposed:true },
];
const AVATAR_MOODS = [
  { id:'mabait',   name:'Mabait',   sub:'Kind',        price:0,  rarity:'starter',   line:'Kain ka na ba? Ingat sa shift!' },
  { id:'mahiyain', name:'Mahiyain', sub:'Shy',         price:25, rarity:'common',    line:'Uhm... hi po.' },
  { id:'chill',    name:'Chill',    sub:'Relaxed',     price:25, rarity:'common',    line:'Relax lang, kape muna.' },
  { id:'pilyo',    name:'Pilyo',    sub:'Mischievous', price:40, rarity:'rare',      line:'Hehe, sino kumuha ng last piece?' },
  { id:'kabado',   name:'Kabado',   sub:'Nervous',     price:40, rarity:'rare',      line:'Na-send ko na ba? Check ko ulit...' },
  { id:'matalino', name:'Matalino', sub:'Smart',       price:40, rarity:'rare',      line:'Na-automate ko na yan kanina pa.' },
  { id:'bibo',     name:'Bibo',     sub:'Hyper',       price:40, rarity:'rare',      line:'Tara, BINGO na!' },
  { id:'masungit', name:'Masungit', sub:'Grumpy',      price:60, rarity:'epic',      line:'Mamaya na, may ticket pa ako.' },
  { id:'drama',    name:'Drama',    sub:'Dramatic',    price:60, rarity:'epic',      line:'Bakit ako na-skip sa draw?!' },
  { id:'boss',     name:'Boss',     sub:'Confident',   price:80, rarity:'legendary', line:'Ako na bahala. Next!' },
];
AVATAR_MOODS.forEach(m => { if(!m.price) m.free = true; });
const AVATAR_PINS = [
  { id:'rainbow', name:'Rainbow Pride', price:0, free:true }, { id:'trans', name:'Trans Pride', price:0, free:true },
  { id:'bi', name:'Bi Pride', price:0, free:true },           { id:'pan', name:'Pan Pride', price:0, free:true },
  { id:'nonbinary', name:'Nonbinary', price:0, free:true },   { id:'lesbian', name:'Lesbian Pride', price:0, free:true },
  { id:'smb', name:'SMB Gold', price:30, proposed:true },
];
const NEW_CATS = [
  { key:'avatarHairStyle', label:'💇 Hair Style',  catalog:AVATAR_HAIR_STYLES },
  { key:'avatarMood',      label:'😊 Personality', catalog:AVATAR_MOODS },
  { key:'avatarPin',       label:'📍 Pin',         catalog:AVATAR_PINS },
];
NEW_CATS.forEach(c => { if(!AVATAR_CATEGORIES.find(x => x.key === c.key)) AVATAR_CATEGORIES.push(c); LEGACY[c.key] = LEGACY[c.key] || []; });
window.AVATAR_HAIR_STYLES = AVATAR_HAIR_STYLES; window.AVATAR_MOODS = AVATAR_MOODS; window.AVATAR_PINS = AVATAR_PINS;

const CATS = AVATAR_CATEGORIES.map(c => c.key);
const catOf = key => AVATAR_CATEGORIES.find(c => c.key === key);
const itemOf = (key, id) => { const c = catOf(key); return c && id ? c.catalog.find(i => i.id === id) : null; };
const isFree = it => !!it && !Number(it.price);

// The server "knows" an item if it is a legacy id, or it is listed in shop.items.
function serverHas(cat, id){
  if((LEGACY[cat] || []).includes(id)) return true;
  const it = (typeof GAMES_CFG !== 'undefined' && GAMES_CFG && GAMES_CFG.shop && GAMES_CFG.shop.items) || null;
  return !!(it && it[cat] && it[cat][id]);
}
function owns(pid, cat, id){
  const it = itemOf(cat, id); if(!it) return false;
  if(isFree(it)) return true;
  const o = ownedCosmetics(pid, cat);
  if(o.includes(id)) return true;
  if(cat === 'avatarOutfit' && (id === 'barong' || id === 'terno') && o.includes('formal')) return true; // mirrors the one-time migration
  return false;
}

// ── 2. Player state (equipped ids + free look settings) ──────────────────────
const LS = k => 'smbAvatar_' + k + '_' + (currentPlayer ? currentPlayer.id : '');
const lsGet = k => { try { return JSON.parse(localStorage.getItem(LS(k)) || 'null'); } catch(e){ return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(LS(k)) : localStorage.setItem(LS(k), JSON.stringify(v)); } catch(e){} };
const isMe = pid => !!(currentPlayer && currentPlayer.id === pid);

function defaultHairStyle(gender, hair){ return gender === 'girl' ? 'long' : (hair === 'bald' ? 'buzz' : 'spiky'); }
function currentCats(pid){
  const g = avatarGenderFor(pid), c = {};
  CATS.forEach(k => { c[k] = equippedCosmetic(pid, k); });
  if(c.avatarOutfit === 'formal') c.avatarOutfit = g === 'girl' ? 'terno' : 'barong';
  if(!c.avatarHairStyle) c.avatarHairStyle = defaultHairStyle(g, c.avatarHair);
  if(!c.avatarMood) c.avatarMood = 'mabait';
  return c;
}
function currentLook(pid){
  const g = avatarGenderFor(pid);
  const seed = { skin:'tan', lashes: g === 'girl', bottom:null, pronouns:'', showPronouns:false };
  const srv = DB.avatarLook && DB.avatarLook[pid];
  const loc = !srv && isMe(pid) ? lsGet('look') : null;
  return Object.assign(seed, srv || loc || {});
}
function savedLooksFor(pid){
  const srv = DB.savedLooks && DB.savedLooks[pid];
  const arr = Array.isArray(srv) ? srv : (isMe(pid) ? (lsGet('saved') || []) : []);
  return [0,1,2].map(i => arr[i] || null);
}
function effectiveBottom(look, cats, gender){
  if(look.bottom) return look.bottom;
  const o = cats.avatarOutfit;
  return o === 'terno' ? 'skirt' : (gender === 'girl' && !['sporty','superhero','knight'].includes(o) ? 'skirt' : 'pants');
}
function optsFrom(cats, look, gender, extra){
  const o = { gender, skin:look.skin, lashes:look.lashes, bottom:look.bottom || undefined,
    hair:cats.avatarHair, hairStyle:cats.avatarHairStyle, outfit:cats.avatarOutfit, acc:cats.avatarAccessory,
    mood:cats.avatarMood, pin:cats.avatarPin, lipstick:cats.avatarLipstick, nails:cats.avatarNails,
    earrings:cats.avatarEarrings, bg:cats.avatarBackground, frame:cats.avatarFrame };
  Object.assign(o, extra || {});
  Object.keys(o).forEach(k => { if(o[k] === undefined || o[k] === null) delete o[k]; });
  return o;
}

// ── 3. Cached SVG ────────────────────────────────────────────────────────────
const PH = 'avQZ9', _cache = new Map(); let _uid = 0;
function svgCached(opts, mode){
  const key = mode + '|' + JSON.stringify(opts);
  let s = _cache.get(key);
  if(!s){
    const o = Object.assign({}, opts, { id:PH, anim: mode === 'live' });
    if(mode !== 'live' && mode !== 'static') o.bg = false;
    s = avatarSVG(o);
    if(mode === 'head' || mode === 'thumbHead') s = s.replace('viewBox="0 0 200 240"', 'viewBox="40 20 120 120"');
    if(mode === 'thumbChest') s = s.replace('viewBox="0 0 200 240"', 'viewBox="92 132 48 48"');
    if(_cache.size > 600) _cache.clear();
    _cache.set(key, s);
  }
  return s.split(PH).join('av' + (++_uid).toString(36)); // unique ids per copy (gradients, clip paths, CSS)
}
window.avatarSvgCached = svgCached;

// ── 4. avatarHtml(): drop-in replacement used by leaderboards, names, modal ───
window.avatarHtml = function(playerId, size, clickable){
  size = size || 40; clickable = clickable !== false;
  const g = avatarGenderFor(playerId), cats = currentCats(playerId), look = currentLook(playerId);
  const click = clickable ? `onclick="openAvatarModal('${playerId}');event.stopPropagation();" ` : '';
  const cur = clickable ? 'cursor:pointer;' : '';
  if(size < 40){
    const bg = itemOf('avatarBackground', cats.avatarBackground), fr = itemOf('avatarFrame', cats.avatarFrame);
    const frCss = fr ? fr.css.replace(/outline:3px/, 'outline:2px').replace(/outline-offset:2px/, 'outline-offset:1px') : 'outline:1px solid rgba(255,255,255,.15);outline-offset:1px;';
    return `<span ${click}class="avx-head" style="${cur}width:${size}px;height:${size}px;${bg ? bg.css : 'background:#16293f;'}${frCss}">${svgCached(optsFrom(cats, look, g), 'head')}</span>`;
  }
  const mode = size >= 80 ? 'live' : 'static';
  return `<span ${click}class="avx-full" style="${cur}width:${size}px;height:${Math.round(size * 1.2)}px;">${svgCached(optsFrom(cats, look, g), mode)}</span>`;
};

function pronounChip(pid){
  const l = currentLook(pid);
  return l.showPronouns && l.pronouns ? `<span class="avs-pro">${escapeHtml(l.pronouns)}</span>` : '';
}
function moodLine(cats){ const m = itemOf('avatarMood', cats.avatarMood); return m && m.line ? m.line : ''; }

window.openAvatarModal = function(playerId){
  const overlay = document.getElementById('avatarModalOverlay'), content = document.getElementById('avatarModalContent');
  if(!overlay || !content) return;
  const p = (DB.players || []).find(x => x.id === playerId);
  const name = p ? p.name : (isMe(playerId) ? currentPlayer.name : 'Player');
  const cats = currentCats(playerId), line = moodLine(cats), mood = itemOf('avatarMood', cats.avatarMood);
  content.innerHTML = `<div style="text-align:center;">
      ${line ? `<div class="avs-bubble" style="position:relative;left:auto;top:auto;transform:none;display:inline-block;margin-bottom:6px;">${escapeHtml(line)}</div>` : ''}
      <div>${avatarHtml(playerId, 200, false)}</div>
      <div style="font-weight:700;font-size:16px;color:var(--gold);margin-top:6px;">${escapeHtml(name)} ${pronounChip(playerId)}</div>
      ${mood ? `<div style="font-size:11px;color:var(--muted);margin-top:2px;">${escapeHtml(mood.name)} · ${escapeHtml(mood.sub || '')}</div>` : ''}
    </div>`;
  overlay.classList.add('show');
};

// ── 5. Studio ────────────────────────────────────────────────────────────────
const STEPS = [
  { id:'look',   label:'🧑 Look',        sec:[ {type:'skin'}, {cat:'avatarHairStyle', label:'Hair style', th:'head'}, {cat:'avatarHair', label:'Hair color', th:'head', opt:'Default'}, {type:'lashes'}, {type:'bottom'} ] },
  { id:'outfit', label:'👕 Outfit',      sec:[ {cat:'avatarOutfit', label:'Outfit', th:'full', opt:'Basic'} ] },
  { id:'mood',   label:'😊 Personality', sec:[ {cat:'avatarMood', label:'Personality · one at a time, switching is free', th:'head'} ] },
  { id:'kikay',  label:'💄 Kikay',       sec:[ {cat:'avatarLipstick', label:'Lipstick', th:'head', opt:'None'}, {cat:'avatarEarrings', label:'Earrings', th:'head', opt:'None'}, {cat:'avatarNails', label:'Nails', th:'swatch', opt:'None'} ] },
  { id:'hats',   label:'🎩 Hats & Pins', sec:[ {cat:'avatarAccessory', label:'Hats & accessories', th:'head', opt:'None'}, {cat:'avatarPin', label:'Pins · free and optional', th:'chest', opt:'None'} ] },
  { id:'stage',  label:'🎨 Stage',       sec:[ {cat:'avatarBackground', label:'Background', th:'swatch', opt:'Default'}, {cat:'avatarFrame', label:'Frame', th:'swatch', opt:'None'}, {type:'pose'} ] },
];
const SKINS = [['light','Light'],['tan','Tan'],['morena','Morena'],['deep','Deep']];
const BOTTOMS = [['pants','Pants'],['shorts','Shorts'],['skirt','Skirt']];
const PRONOUNS = ['he/him','she/her','they/them'];
const RAR = { starter:'#7a92b0', common:'#4ecb84', rare:'#2ECAD5', epic:'#b07cff', legendary:'#F5C842' };

const S = { pid:null, step:'look', cats:null, look:null, pose:'idle', busy:false, msg:'', msgOk:true, proCustom:false };
function resetTrial(){ S.cats = currentCats(S.pid); S.look = currentLook(S.pid); S.proCustom = !!(S.look.pronouns && !PRONOUNS.includes(S.look.pronouns)); }

function tryOnList(){
  // items in the trial the player doesn't own yet
  const out = [];
  CATS.forEach(k => { const id = S.cats[k]; if(id && (!owns(S.pid, k, id) || !serverHas(k, id))){ const it = itemOf(k, id); if(it) out.push({ cat:k, id, it, live: serverHas(k, id) && !it.off, free: owns(S.pid, k, id) }); } });
  return out;
}
function changedCats(){ const base = currentCats(S.pid); return CATS.filter(k => (S.cats[k] || null) !== (base[k] || null)); }
function lookChanged(){ const b = currentLook(S.pid); return ['skin','lashes','bottom','pronouns','showPronouns'].some(k => (S.look[k] ?? null) !== (b[k] ?? null)); }

function swatchFor(cat, it){
  if(!it) return `<div class="avs-sw" style="background:repeating-linear-gradient(45deg,#2a3f5c 0 6px,#1a2f4a 6px 12px)"></div>`;
  if(cat === 'avatarFrame') return `<div class="avs-sw" style="background:#16293f;${it.css}"></div>`;
  return `<div class="avs-sw" style="${it.css || `background:${it.hex || '#555'}`}"></div>`;
}
function tag(cat, it, selected){
  if(!it) return '';
  const live = serverHas(cat, it.id) && !it.off;
  if(!live) return `<span class="avs-tag soon">Soon${isFree(it) ? ' · Free' : ' · ' + it.price + ' 🪙'}</span>`;
  if(owns(S.pid, cat, it.id)) return `<span class="avs-tag ok">${isFree(it) ? 'Free' : 'Owned'}</span>`;
  return `<span class="avs-tag">${it.price} 🪙</span>`;
}
function tile(sec, it){
  const cat = sec.cat, id = it ? it.id : null, sel = (S.cats[cat] || null) === id;
  const cats = Object.assign({}, S.cats, { [cat]: id });
  let th;
  if(sec.th === 'swatch') th = swatchFor(cat, it);
  else th = svgCached(optsFrom(cats, S.look, avatarGenderFor(S.pid)), sec.th === 'head' ? 'thumbHead' : sec.th === 'chest' ? 'thumbChest' : 'thumbFull');
  const rar = it && it.rarity ? `<span class="avs-rar" style="color:${RAR[it.rarity]}">${it.rarity}</span>` : '';
  const sub = it && it.sub ? `<span class="avs-sub">${escapeHtml(it.sub)}</span>` : '';
  return `<button type="button" class="avs-tile${sel ? ' sel' : ''}${it && it.signature ? ' sig' : ''}" onclick="avsTry('${cat}',${id ? `'${id}'` : 'null'})">
    <div class="avs-th">${th}</div><div class="avs-nm">${it ? escapeHtml(it.name) : sec.opt}</div>${sub}${rar}${tag(cat, it, sel)}</button>`;
}
function section(sec){
  const g = avatarGenderFor(S.pid);
  if(sec.type === 'skin') return `<div class="avs-sl">Skin tone · free</div><div class="avs-row">${SKINS.map(([id, n]) => {
      const c = (ART.SKIN && ART.SKIN[id] || ['#ccc'])[0];
      return `<button type="button" class="avs-chip${S.look.skin === id ? ' sel' : ''}" onclick="avsLook('skin','${id}')"><i style="background:${c}"></i>${n}</button>`; }).join('')}</div>`;
  if(sec.type === 'lashes') return `<div class="avs-sl">Lashes · free</div><div class="avs-row">${[[true,'On'],[false,'Off']].map(([v, n]) =>
      `<button type="button" class="avs-chip${!!S.look.lashes === v ? ' sel' : ''}" onclick="avsLook('lashes',${v})">${n}</button>`).join('')}</div>`;
  if(sec.type === 'bottom'){ const b = effectiveBottom(S.look, S.cats, g);
    return `<div class="avs-sl">Bottoms · free, works with every outfit</div><div class="avs-row">${BOTTOMS.map(([id, n]) =>
      `<button type="button" class="avs-chip${b === id ? ' sel' : ''}" onclick="avsLook('bottom','${id}')">${n}</button>`).join('')}</div>`; }
  if(sec.type === 'pose') return `<div class="avs-sl">Preview pose · just for fun</div><div class="avs-row">${[['idle','Idle'],['walk','Walk'],['cheer','Cheer']].map(([id, n]) =>
      `<button type="button" class="avs-chip${S.pose === id ? ' sel' : ''}" onclick="avsPose('${id}')">${n}</button>`).join('')}</div>`;
  const c = catOf(sec.cat), owned = ownedCosmetics(S.pid, sec.cat);
  const items = c.catalog.filter(it => !it.legacy && (!it.off || owned.includes(it.id) || S.cats[sec.cat] === it.id));
  // signature item first, then owned, then by price
  items.sort((a, b) => (b.signature ? 1 : 0) - (a.signature ? 1 : 0) || (owns(S.pid, sec.cat, b.id) ? 1 : 0) - (owns(S.pid, sec.cat, a.id) ? 1 : 0) || (a.price - b.price));
  return `<div class="avs-sl">${sec.label}</div><div class="avs-grid">${sec.opt ? tile(sec, null) : ''}${items.map(it => tile(sec, it)).join('')}</div>`;
}
function petBeside(){
  const pets = ((DB.pets || {})[S.pid] || []).filter(p => p && p.status === 'alive');
  if(!pets.length) return '';
  pets.sort((a, b) => (b.evolved ? 1 : 0) - (a.evolved ? 1 : 0) || (b.level || 0) - (a.level || 0));
  const p = pets[0];
  const src = p.evolved ? petAdultSrc(p.species) : petBabySrc(p.species);
  return `<div class="avs-pet"><img src="${src}" alt="${escapeHtml(p.name || 'Pet')}" onerror="this.parentNode.style.display='none'"><div>${escapeHtml(p.name || '')}</div></div>`;
}
function savedLooksHtml(){
  const L = savedLooksFor(S.pid);
  return `<div class="avs-sl">Saved looks · tap to wear (only items you own)</div><div class="avs-row">${L.map((l, i) => l
      ? `<span class="avs-slot"><button type="button" class="avs-chip sel" onclick="avsApplySaved(${i})">⭐ ${escapeHtml(l.name || 'Look ' + (i + 1))}</button><button type="button" class="avs-x" title="Remove" onclick="avsDeleteSaved(${i})">✕</button></span>`
      : `<button type="button" class="avs-chip dashed" onclick="avsSaveSlot(${i})">＋ Save current as look ${i + 1}</button>`).join('')}</div>`;
}
function pronounsHtml(){
  const v = S.look.pronouns || '', show = !!S.look.showPronouns && !!v;
  const opts = [['', "Don't show"], ...PRONOUNS.map(p => [p, p]), ['__custom', 'Custom']];
  const cur = S.proCustom ? '__custom' : (show ? v : '');
  return `<div class="avs-sl">Pronouns on your profile card · optional, never posted to Slack</div><div class="avs-row">${opts.map(([id, n]) =>
      `<button type="button" class="avs-chip${cur === id ? ' sel' : ''}" onclick="avsPronoun('${id}')">${n}</button>`).join('')}
    ${S.proCustom ? `<input id="avsProIn" type="text" maxlength="20" placeholder="max 20 characters" value="${escapeHtml(S.proCustom ? v : '')}" oninput="avsProType(this.value)" style="max-width:180px;margin:0;">` : ''}</div>`;
}

window.renderAvatarStudioPanel = function(){
  const panel = document.getElementById('avatarStudioPanel'), content = document.getElementById('avatarStudioPanelContent');
  if(!panel || !content || !currentPlayer) return;
  panel.style.display = 'block';
  const intro = panel.firstElementChild;
  if(intro && intro !== content && !intro.dataset.avs){ intro.dataset.avs = 1; intro.textContent = 'Build your Bayani! Tap anything to try it on — you only pay when you save. Wear anything: no boy/girl lock. Your avatar shows on your profile, leaderboards, Pet Race and Bayani City.'; }
  if(S.pid !== currentPlayer.id || !S.cats){ S.pid = currentPlayer.id; resetTrial(); }
  if(S.busy) return;
  const ae = document.activeElement; if(ae && ae.id === 'avsProIn' && content.contains(ae)) return; // don't wipe the field while typing
  const g = avatarGenderFor(S.pid), step = STEPS.find(s => s.id === S.step) || STEPS[0];
  const list = tryOnList(), liveCost = list.filter(x => x.live && !x.free).reduce((a, x) => a + Number(x.it.price || 0), 0), soon = list.filter(x => !x.live);
  const dirty = changedCats().length || lookChanged();
  const bal = Number(typeof _myTokenBalance !== 'undefined' ? _myTokenBalance : 0);
  const line = moodLine(S.cats);
  const scrollY = window.scrollY, gridEl = content.querySelector('.avs-steps-body'), keep = gridEl ? gridEl.scrollTop : 0;
  content.innerHTML = `<div class="avs">
    <div class="avs-stage">
      ${line ? `<div class="avs-bubble">${escapeHtml(line)}</div>` : ''}
      <div class="avs-hero">${svgCached(optsFrom(S.cats, S.look, g, { pose:S.pose }), 'live')}</div>
      ${petBeside()}
      <div class="avs-name">${escapeHtml(currentPlayer.name)} ${S.look.showPronouns && S.look.pronouns ? `<span class="avs-pro">${escapeHtml(S.look.pronouns)}</span>` : ''}</div>
    </div>
    <div class="avs-steps">${STEPS.map(s => `<button type="button" class="avs-step${s.id === step.id ? ' sel' : ''}" onclick="avsStep('${s.id}')">${s.label}</button>`).join('')}</div>
    <div class="avs-steps-body">${step.sec.map(section).join('')}</div>
    <div class="avs-extra">${pronounsHtml()}${savedLooksHtml()}</div>
    <div class="avs-bar">
      <div class="avs-cost">Try-on cost: <b>${liveCost} 🪙</b> <span>· balance ${bal} 🪙</span>${soon.length ? `<div class="avs-soonnote">${soon.length} item${soon.length > 1 ? 's' : ''} marked Soon: try-on only until the server update</div>` : ''}</div>
      <button type="button" class="btn btn-outline btn-sm" ${dirty ? '' : 'disabled'} onclick="avsReset()">Reset</button>
      <button type="button" class="btn btn-gold btn-sm" ${dirty ? '' : 'disabled'} onclick="avsSave()">${liveCost ? `Buy & save · ${liveCost} 🪙` : 'Save look'}</button>
    </div>
    ${S.msg ? `<div class="avs-msg${S.msgOk ? '' : ' err'}">${S.msg}</div>` : ''}
  </div>`;
  const nb = content.querySelector('.avs-steps-body'); if(nb) nb.scrollTop = keep;
  if(Math.abs(window.scrollY - scrollY) > 2) window.scrollTo(0, scrollY);
};
const rerender = () => window.renderAvatarStudioPanel();
const say = (m, ok = true) => { S.msg = m; S.msgOk = ok; };

window.avsStep = id => { S.step = id; rerender(); };
window.avsPose = id => { S.pose = id; rerender(); };
window.avsTry = (cat, id) => {
  const sec = STEPS.flatMap(s => s.sec).find(x => x.cat === cat);
  if(S.cats[cat] === id && id && sec && sec.opt) id = null; // tap again = take off (optional slots)
  S.cats[cat] = id; S.msg = ''; rerender();
};
window.avsLook = (k, v) => { S.look[k] = v; S.msg = ''; rerender(); };
window.avsPronoun = id => {
  if(id === '') { S.look.showPronouns = false; S.proCustom = false; }
  else if(id === '__custom'){ S.proCustom = true; S.look.showPronouns = true; if(PRONOUNS.includes(S.look.pronouns)) S.look.pronouns = ''; }
  else { S.proCustom = false; S.look.pronouns = id; S.look.showPronouns = true; }
  rerender();
  if(id === '__custom') setTimeout(() => { const el = document.getElementById('avsProIn'); if(el) el.focus(); }, 0);
};
function cleanPronoun(v){ return String(v || '').replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
window.avsProType = v => { S.look.pronouns = cleanPronoun(v); S.look.showPronouns = true;
  // update the bar without re-rendering the input (keeps the caret)
  const btns = document.querySelectorAll('.avs-bar .btn'); btns.forEach(b => b.disabled = false); };
window.avsReset = () => { resetTrial(); say(''); rerender(); };

async function post(url, body){
  const r = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch(e){}
  if(!r.ok && j.ok === undefined) j.ok = false;
  return j;
}
function validLook(l){
  const out = { skin: SKINS.some(s => s[0] === l.skin) ? l.skin : 'tan', lashes: !!l.lashes,
    bottom: BOTTOMS.some(b => b[0] === l.bottom) ? l.bottom : null, pronouns: cleanPronoun(l.pronouns), showPronouns: !!l.showPronouns };
  if(/https?:|www\.|\.(com|net|org|ph|io)\b/i.test(out.pronouns)) out.pronouns = '';
  if(!out.pronouns) out.showPronouns = false;
  return out;
}
async function saveLookSettings(look){
  const clean = validLook(look);
  try {
    const j = await post(`${COSMETICS_BACKEND_URL}/avatar-look`, { playerId:S.pid, look:clean });
    if(j.ok){ DB.avatarLook = DB.avatarLook || {}; DB.avatarLook[S.pid] = j.avatarLook || clean; lsSet('look', null); return 'server'; }
  } catch(e){}
  lsSet('look', clean); return 'local';
}
async function equipList(pairs){
  const failed = [];
  for(const [cat, id] of pairs){
    if(id && !serverHas(cat, id)){ failed.push(cat); continue; }
    try {
      const j = await post(`${COSMETICS_BACKEND_URL}/equip-cosmetic`, { playerId:S.pid, category:cat, itemId:id });
      if(j.ok){ DB.equipped2 = DB.equipped2 || {}; DB.equipped2[S.pid] = j.equipped2; } else failed.push(cat);
    } catch(e){ failed.push(cat); }
  }
  return failed;
}
const catLabel = k => (catOf(k) || {}).label || k;

window.avsSave = async () => {
  if(S.busy) return;
  const buy = tryOnList().filter(x => x.live && !x.free), cost = buy.reduce((a, x) => a + Number(x.it.price || 0), 0);
  const bal = Number(_myTokenBalance || 0);
  if(cost > bal){ say(`Kulang ang tokens: this look costs ${cost} 🪙, you have ${bal} 🪙. Tap an item again to take it off.`, false); return rerender(); }
  if(buy.length && !confirm(`Buy ${buy.map(x => x.it.name).join(', ')} for ${cost} 🪙 and save this look?`)) return;
  S.busy = true; say('Saving…'); const btns = document.querySelectorAll('.avs-bar .btn'); btns.forEach(b => b.disabled = true);
  const notes = [];
  try {
    // 1) buy
    for(const x of buy){
      const j = await post(GAMES_URL, { action:'cosmetic', playerId:S.pid, playerName:currentPlayer.name, category:x.cat, itemId:x.id });
      if(!j.ok){ throw new Error(`${x.it.name}: ${j.error || 'purchase failed'}`); }
      if(j.tokens !== undefined) _myTokenBalance = j.tokens;
      if(j.unlocks2){ DB.unlocks2 = DB.unlocks2 || {}; DB.unlocks2[S.pid] = j.unlocks2; }
    }
    // 2) equip what changed (only items the player owns now)
    const pairs = changedCats().filter(k => !S.cats[k] || owns(S.pid, k, S.cats[k])).map(k => [k, S.cats[k] || null]);
    const soonNames = changedCats().filter(k => S.cats[k] && !serverHas(k, S.cats[k])).map(k => itemOf(k, S.cats[k])).filter(Boolean).map(i => i.name);
    const failed = await equipList(pairs.filter(([k, id]) => !id || serverHas(k, id)));
    if(soonNames.length) notes.push(`${soonNames.join(', ')}: try-on only until the server update`);
    if(failed.length) notes.push(`${failed.map(catLabel).join(', ')}: try-on only until the server update`);
    // 3) free look settings
    if(lookChanged()){ const where = await saveLookSettings(S.look); if(where === 'local') notes.push('skin, lashes, bottoms and pronouns are saved on this device until the server update'); }
    if(buy.length) playerLog(`Na-unlock: ${buy.map(x => x.it.name).join(', ')}! Bagong balance: ${_myTokenBalance} 🪙`, 'ok');
    try { await refreshTokenBalance(); } catch(e){}
    S.busy = false; resetTrial();
    say(notes.length ? `✅ Saved. Note: ${notes.join('; ')}.` : '✅ Look saved!', true);
  } catch(e){
    S.busy = false; say(`Hindi na-save: ${escapeHtml(e.message || 'try ulit')}`, false);
  }
  rerender();
  try { refreshPlayerNameBadge(); } catch(e){}
};

async function saveSlots(slot, entry){
  try {
    const body = entry ? { playerId:S.pid, slot, name:entry.name, equipped:entry.equipped, look:entry.look } : { playerId:S.pid, slot, remove:true };
    const j = await post(`${COSMETICS_BACKEND_URL}/saved-looks`, body);
    if(j.ok){ DB.savedLooks = DB.savedLooks || {}; DB.savedLooks[S.pid] = j.savedLooks; lsSet('saved', null); return 'server'; }
  } catch(e){}
  const arr = savedLooksFor(S.pid); arr[slot] = entry; lsSet('saved', arr); return 'local';
}
window.avsSaveSlot = async slot => {
  const name = cleanPronoun(prompt('Name this look (e.g. Work, Party):', ['Work','Party','Chill'][slot]) || '').slice(0, 16);
  if(!name) return;
  const equipped = {}; CATS.forEach(k => { if(S.cats[k] && owns(S.pid, k, S.cats[k])) equipped[k] = S.cats[k]; });
  const where = await saveSlots(slot, { name, equipped, look: validLook(S.look) });
  say(`⭐ Saved as “${escapeHtml(name)}”${where === 'local' ? ' (on this device until the server update)' : ''}. Items you don't own yet aren't included.`); rerender();
};
window.avsDeleteSaved = async slot => { if(!confirm('Remove this saved look?')) return; await saveSlots(slot, null); say('Removed.'); rerender(); };
window.avsApplySaved = async slot => {
  const l = savedLooksFor(S.pid)[slot]; if(!l) return;
  resetTrial();
  CATS.forEach(k => { const id = (l.equipped || {})[k] || null; if(!id || owns(S.pid, k, id)) S.cats[k] = id; });
  if(!S.cats.avatarHairStyle) S.cats.avatarHairStyle = currentCats(S.pid).avatarHairStyle;
  if(!S.cats.avatarMood) S.cats.avatarMood = 'mabait';
  Object.assign(S.look, l.look || {});
  await window.avsSave();
};

// Gender switch is retired: keep the old function harmless if anything still calls it.
window.setAvatarGender = function(){ window.renderAvatarStudioPanel(); };

// ── 6. Styles ────────────────────────────────────────────────────────────────
const css = `
.avx-head{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;vertical-align:middle;flex:none}
.avx-head svg{width:100%;height:100%;display:block}
.avx-full{display:inline-block;vertical-align:middle;line-height:0}
.avx-full svg{width:100%;height:100%;display:block}
.avs{display:flex;flex-direction:column;gap:10px;color:var(--white)}
.avs-stage{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:4px;padding:34px 8px 8px;border-radius:14px;background:radial-gradient(ellipse at 50% 100%,rgba(245,200,66,.14),transparent 60%),var(--panel);border:1px solid rgba(255,255,255,.08);min-height:250px}
.avs-hero{width:200px;height:240px;flex:none}.avs-hero svg{width:100%;height:100%}
.avs-pet{width:110px;text-align:center;font-size:10px;color:var(--muted);flex:none}.avs-pet img{width:110px;height:110px;object-fit:contain;display:block}
.avs-name{position:absolute;left:0;right:0;bottom:6px;text-align:center;font-weight:700;font-size:13px;color:var(--gold);pointer-events:none}
.avs-bubble{position:absolute;top:8px;left:50%;transform:translateX(-50%);max-width:88%;background:#fff;color:#2b1a12;font-size:12px;font-weight:600;padding:6px 12px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;z-index:2}
.avs-bubble:after{content:'';position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-top-color:#fff;border-bottom:0}
.avs-pro{display:inline-block;font-size:10px;font-weight:700;color:var(--teal);background:rgba(46,202,213,.12);border:1px solid rgba(46,202,213,.35);border-radius:10px;padding:1px 7px;vertical-align:middle}
.avs-steps{display:flex;flex-wrap:wrap;gap:6px}
.avs-step{flex:1 1 auto;background:var(--card-bg);color:var(--white);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:7px 10px;font-size:12px;font-weight:600;cursor:pointer}
.avs-step.sel{background:var(--gold);color:#1a1200;border-color:var(--gold)}
.avs-sl{font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.6px;margin:10px 0 6px}
.avs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:8px}
.avs-tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--card-bg);border:2px solid rgba(255,255,255,.07);border-radius:12px;padding:6px 4px 7px;color:var(--white);cursor:pointer;font:inherit}
.avs-tile:hover{border-color:rgba(245,200,66,.45)}
.avs-tile.sel{border-color:var(--gold);box-shadow:0 0 0 2px rgba(245,200,66,.25)}
.avs-tile.sig{background:linear-gradient(160deg,rgba(245,200,66,.18),var(--card-bg) 60%)}
.avs-th{width:64px;height:64px;display:flex;align-items:center;justify-content:center}.avs-th svg{width:100%;height:100%}
.avs-sw{width:40px;height:40px;border-radius:50%;border:2px solid rgba(255,255,255,.2)}
.avs-nm{font-size:11px;font-weight:700;text-align:center;line-height:1.15}
.avs-sub{font-size:9.5px;color:var(--muted)}
.avs-rar{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}
.avs-tag{font-size:10px;font-weight:700;color:var(--gold)}.avs-tag.ok{color:var(--success)}.avs-tag.soon{color:var(--muted)}
.avs-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.avs-chip{display:inline-flex;align-items:center;gap:6px;background:var(--card-bg);color:var(--white);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit}
.avs-chip i{width:14px;height:14px;border-radius:50%;border:1px solid rgba(0,0,0,.4)}
.avs-chip.sel{border-color:var(--gold);color:var(--gold);background:rgba(245,200,66,.1)}
.avs-chip.dashed{border-style:dashed;color:var(--muted)}
.avs-slot{display:inline-flex;align-items:center;gap:2px}.avs-x{background:none;border:0;color:var(--muted);cursor:pointer;font-size:13px;padding:4px}
.avs-extra{border-top:1px solid rgba(255,255,255,.08);padding-top:2px}
.avs-bar{position:sticky;bottom:0;z-index:4;display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--deep);border:1px solid rgba(245,200,66,.3);border-radius:12px;padding:9px 10px;box-shadow:0 -6px 16px rgba(0,0,0,.35)}
.avs-bar .btn{width:auto;padding:7px 14px}
.avs-cost{flex:1 1 160px;font-size:12px}.avs-cost b{color:var(--gold)}.avs-cost span{color:var(--muted)}
.avs-soonnote{font-size:10.5px;color:var(--muted);margin-top:2px}
.avs-msg{font-size:12px;color:var(--success);padding:2px 4px}.avs-msg.err{color:var(--danger)}
@media(max-width:700px){
  .avs-stage{position:sticky;top:0;z-index:3;min-height:0;padding-top:30px}
  .avs-hero{width:130px;height:156px}.avs-pet,.avs-pet img{width:76px}.avs-pet img{height:76px}
  .avs-grid{grid-template-columns:repeat(auto-fill,minmax(76px,1fr))}.avs-th{width:54px;height:54px}
  .avs-step{font-size:11px;padding:6px 8px}
  .avs-cost{flex:1 1 100%}.avs-bar .btn{flex:1 1 0}
}`;
const st = document.createElement('style'); st.id = 'avatarStudioCss'; st.textContent = css; document.head.appendChild(st);

// Re-read config so new items pick up Admin prices / "live" state even if config loaded first.
try { if(typeof loadGamesConfig === 'function') loadGamesConfig().then(() => { try { if(currentPlayer) rerender(); } catch(e){} }); } catch(e){}
try { if(currentPlayer) rerender(); } catch(e){}
})();
