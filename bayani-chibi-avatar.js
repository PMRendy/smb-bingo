// ═══════════════════════════════════════════════════════════════════════════
//  Bayani Chibi v2 — layered SVG RPG avatar for the SMB Game Portal
//  Original art: thick dark outline, flat cel shading, big eyes, 2.5-head chibi,
//  drawn to sit on the same 240 px stage as the pet GIFs.
//
//  Inclusive by design: nothing is locked to a gender. Hair style, lashes,
//  bottoms (pants / shorts / skirt), outfits, makeup and jewelry are separate
//  choices any player can mix. The old boy/girl pick only seeds defaults.
//
//  avatarSVG(opts) -> SVG string. All opts optional:
//   gender     'boy'|'girl'   legacy: seeds defaults for hairStyle/lashes/bottom
//   skin       light|tan|morena|deep
//   hair       hair COLOR id (existing catalog: short brown, curly black, spiky blonde, long red, bald silver)
//   hairStyle  spiky|pompadour|buzz|bob|long|ponytail|curly
//   lashes     true|false
//   bottom     pants|shorts|skirt
//   outfit     casual|barong|terno|sporty|superhero|royal|knight|mage|pride   ('formal' = legacy: barong or terno)
//   acc        shades|cap|crown|headphones|bowtie|helmet|wizard|flower
//   pin        rainbow|trans|bi|pan|nonbinary|lesbian|smb   (small chest pin)
//   lipstick, nails, earrings  existing Kikay ids
//   mood       personality: mabait|pilyo|masungit|mahiyain|kabado|matalino|bibo|chill|drama|boss
//   bg, frame  existing background / frame ids (bg:false = transparent)
//   pose       idle|walk|cheer      step/bob: static walk frame values
//   anim       true = CSS idle animation (blink, bob, mood motion)
// ═══════════════════════════════════════════════════════════════════════════
(function(G){
const OL = '#2b1a12';
const SW = w => `stroke="${OL}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const S = SW(3.6), S2 = SW(2.2), S1 = SW(1.5);
const SKIN = { light:['#ffe1c8','#f3c3a3'], tan:['#f2c39b','#dba27a'], morena:['#d79a6c','#b97d52'], deep:['#9c6542','#7d4c2f'] };
const HAIR = { short:'#6b3f1d', curly:'#1c1c1c', spiky:'#e8c468', long:'#b33a1e', bald:'#c0c0c0', pink:'#ff7eb6', blue:'#4ea8ff' };
const LIP = { red:'#c0392b', pink:'#e75480', nude:'#c98a6b', wine:'#5c1f2e' };
const NAIL = { red:'#c0392b', pink:'#e75480', black:'#1c1c1c', glitter:'#f5c842' };
const BG = { sunset:['#ff7e5f','#feb47b'], ocean:['#2193b0','#6dd5ed'], forest:['#134e5e','#71b280'], galaxy:['#0f0c29','#302b63'], gold:['#f5c842','#f7971e'] };
const FRAME = { bronze:'#cd7f32', silver:'#c0c0c0', gold:'#f5c842', diamond:'#b9f2ff' };
const OUT = {
  none:      { top:'#94a3b8', sh:'#7b8ba0', bot:'#475569', shoe:'#334155' },
  casual:    { top:'#5aa9e6', sh:'#3d7fc4', bot:'#33507a', shoe:'#f1f5f9' },
  barong:    { top:'#f6efd9', sh:'#e2d6b2', bot:'#1f2937', shoe:'#111827' },
  terno:     { top:'#f6efd9', sh:'#e2d6b2', bot:'#c94f6d', shoe:'#8a2c44' },
  sporty:    { top:'#4caf50', sh:'#2e7d32', bot:'#1b5e20', shoe:'#ffffff' },
  superhero: { top:'#e74c3c', sh:'#b83227', bot:'#2c3e93', shoe:'#e74c3c' },
  royal:     { top:'#8e44ad', sh:'#6c3483', bot:'#5b2c6f', shoe:'#f5c842' },
  knight:    { top:'#c9d3e0', sh:'#9aa8bb', bot:'#7b8798', shoe:'#5b6575' },
  mage:      { top:'#3b2a8f', sh:'#2c1f6e', bot:'#2c1f6e', shoe:'#5b3a8f' },
  pride:     { top:'#ffffff', sh:'#e5e7eb', bot:'#334155', shoe:'#f1f5f9' },
  agent:     { top:'#1f2430', sh:'#141821', bot:'#1f2430', shoe:'#0b0d12' },   // SMB Agent: black suit + VA headset
};
const PIN = { rainbow:['#e5383b','#ff8a1f','#ffd23f','#3a9d5d','#2257c9','#7b3fb5'], trans:['#5bcefa','#f5a9b8','#ffffff','#f5a9b8','#5bcefa'],
  bi:['#d60270','#d60270','#9b4f96','#0038a8','#0038a8'], pan:['#ff218c','#ffd800','#21b1ff'], nonbinary:['#fcf434','#ffffff','#9c59d1','#2c2c2c'],
  lesbian:['#d52d00','#ff9a56','#ffffff','#d362a4','#a30262'], smb:['#f5b942','#f5b942'] };
function darker(hex, f=.78){ const n=parseInt(hex.slice(1),16); const r=Math.round((n>>16)*f),g=Math.round((n>>8&255)*f),b=Math.round((n&255)*f); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
function stripes(colors, x, y, w, h, id){
  const n = colors.length, sh = h / n;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w,h)/3}"/></clipPath><g clip-path="url(#${id})">` +
    colors.map((c, i) => `<rect x="${x}" y="${y + i*sh}" width="${w}" height="${sh + .5}" fill="${c}"/>`).join('') + `</g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w,h)/3}" fill="none" ${S1}/>`;
}

// ── Personalities: brows, eyes, mouth, extras, idle motion ──
const MOODS = {
  neutral:  { brow:'soft', eye:'round', mouth:'smile' },
  mabait:   { brow:'soft', eye:'happy', mouth:'grin', extra:'heart', motion:'sway' },
  pilyo:    { brow:'raised', eye:'side', mouth:'smirk', extra:'horns', motion:'bounce' },
  masungit: { brow:'angry', eye:'narrow', mouth:'frown', extra:'vein', motion:'stomp' },
  mahiyain: { brow:'worried', eye:'down', mouth:'wavy', extra:'blush', motion:'peek' },
  kabado:   { brow:'worried', eye:'small', mouth:'wavy', extra:'sweat', motion:'shiver' },
  matalino: { brow:'soft', eye:'round', mouth:'smile', extra:'glasses', motion:'nod' },
  bibo:     { brow:'high', eye:'star', mouth:'open', extra:'sparkle', motion:'hop' },
  chill:    { brow:'flat', eye:'half', mouth:'smile', extra:'note', motion:'sway' },
  drama:    { brow:'worried', eye:'teary', mouth:'o', extra:'tear', motion:'swoon' },
  boss:     { brow:'flat', eye:'half', mouth:'smirk', extra:'shine', motion:'nod' },
};

function avatarSVG(o){
  o = Object.assign({ gender:'boy', skin:'tan', hair:null, outfit:null, acc:null, pin:null, lipstick:null, nails:null, earrings:null,
                      bg:null, frame:null, pose:'idle', anim:true, eyes:'#3b2416', mood:'neutral', id:'a'+Math.random().toString(36).slice(2,7) }, o||{});
  const legacyGirl = o.gender === 'girl';
  const hairStyle = o.hairStyle || (legacyGirl ? 'long' : (o.hair === 'bald' ? 'buzz' : 'spiky'));
  const lashes = o.lashes !== undefined ? !!o.lashes : legacyGirl;
  let outfit = o.outfit === 'formal' ? (legacyGirl ? 'terno' : 'barong') : o.outfit;
  const bottom = o.bottom || (outfit === 'terno' ? 'skirt' : legacyGirl && outfit !== 'sporty' && outfit !== 'superhero' && outfit !== 'knight' ? 'skirt' : 'pants');
  const M = MOODS[o.mood] || MOODS.neutral;
  const [sk, skD] = SKIN[o.skin] || SKIN.tan;
  const hc = HAIR[o.hair] || '#3a2416', hcD = darker(hc, .72);
  const of = OUT[outfit] || OUT.none;
  const id = o.id;
  const L = [];
  let defs = `<defs><linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${(BG[o.bg]||['#1e3350','#16293f'])[0]}"/><stop offset="1" stop-color="${(BG[o.bg]||['#1e3350','#16293f'])[1]}"/></linearGradient></defs>`;
  if(o.bg !== false){
    if(o.bg === 'pride') L.push(stripes(PIN.rainbow, 4, 32, 192, 192, id+'pbg').replace(/rx="[^"]+"/g, 'rx="96"'));
    else L.push(`<circle cx="100" cy="128" r="96" fill="url(#${id}bg)"/>`);
    if(o.bg==='galaxy') L.push(`<g fill="#fff" opacity=".8"><circle cx="40" cy="70" r="1.6"/><circle cx="160" cy="60" r="1.2"/><circle cx="150" cy="170" r="1.5"/><circle cx="55" cy="180" r="1.1"/><circle cx="120" cy="40" r="1"/></g>`);
    if(o.frame) L.push(`<circle cx="100" cy="128" r="94" fill="none" stroke="${FRAME[o.frame]}" stroke-width="6"/>`);
  }
  L.push(`<ellipse cx="100" cy="226" rx="44" ry="7" fill="#000" opacity=".22"/>`);
  if(outfit==='superhero') L.push(`<path d="M70 138 Q60 190 66 220 L134 220 Q140 190 130 138 Z" fill="#c0392b" ${S}/>`);
  if(outfit==='royal') L.push(`<path d="M66 136 Q52 192 60 222 L140 222 Q148 192 134 136 Z" fill="#b5172f" ${S}/><path d="M60 222 L140 222" stroke="#f5c842" stroke-width="5"/>`);
  // back hair
  if(hairStyle==='long') L.push(`<path d="M46 92 Q40 150 58 176 Q78 168 80 140 L120 140 Q122 168 142 176 Q160 150 154 92 Z" fill="${hc}" ${S}/>`);
  if(hairStyle==='bob') L.push(`<path d="M46 92 Q42 128 56 138 Q70 140 76 128 L124 128 Q130 140 144 138 Q158 128 154 92 Z" fill="${hc}" ${S}/>`);
  if(hairStyle==='ponytail') L.push(`<path d="M146 70 Q178 86 170 132 Q166 150 154 156 Q162 128 150 104 Z" fill="${hc}" ${S}/>`);
  if(hairStyle==='curly') L.push(`<path d="M40 104 q-12 -14 0 -30 q-6 -22 16 -32 q8 -22 32 -18 q12 -14 32 -2 q24 -6 30 18 q22 10 14 32 q12 16 -2 32 Z" fill="${hc}" ${S}/>`);
  // legs / bottoms
  const st = o.step||0;
  const legW = bottom==='shorts' ? 17 : 17;
  const legs = (pantsColor) => `<g class="legL" transform="rotate(${st} 88 190)"><rect x="80" y="188" width="${legW}" height="28" rx="6" fill="${bottom==='shorts'?sk:pantsColor}" ${S}/>${bottom==='shorts'?`<rect x="79" y="186" width="19" height="12" rx="4" fill="${pantsColor}" ${S}/>`:''}<path d="M76 214 h24 q3 0 3 5 v3 h-29 v-3 q0-5 2-5z" fill="${of.shoe}" ${S}/></g>
    <g class="legR" transform="rotate(${-st} 112 190)"><rect x="103" y="188" width="${legW}" height="28" rx="6" fill="${bottom==='shorts'?sk:pantsColor}" ${S}/>${bottom==='shorts'?`<rect x="102" y="186" width="19" height="12" rx="4" fill="${pantsColor}" ${S}/>`:''}<path d="M100 214 h24 q2 0 2 5 v3 h-29 v-3 q0-5 3-5z" fill="${of.shoe}" ${S}/></g>`;
  if(outfit==='terno' && bottom==='skirt') L.push(`<path d="M74 180 Q66 210 64 222 L136 222 Q134 210 126 180 Z" fill="${of.bot}" ${S}/><path d="M80 196 Q100 202 120 196" stroke="#f5c842" stroke-width="2.5" fill="none"/>`);
  else if(bottom==='skirt'){ L.push(legs(sk)); L.push(`<path d="M76 178 Q72 198 70 204 L130 204 Q128 198 124 178 Z" fill="${of.bot}" ${S}/>`); }
  else L.push(legs(of.bot));
  // torso
  if(outfit==='pride'){
    L.push(`<path d="M72 140 Q70 165 74 192 L126 192 Q130 165 128 140 Q100 128 72 140 Z" fill="#fff" ${S}/>`);
    L.push(stripes(PIN.rainbow, 84, 150, 32, 30, id+'pt'));
  } else {
    L.push(`<path d="M72 140 Q70 165 74 192 L126 192 Q130 165 128 140 Q100 128 72 140 Z" fill="${of.top}" ${S}/>`);
    L.push(`<path d="M114 142 Q124 165 122 190 L126 192 Q130 165 128 140 Z" fill="${of.sh}" opacity=".9"/>`);
  }
  if(outfit==='barong') L.push(`<path d="M100 142 V188 M90 150 q10 8 20 0 M88 162 q12 8 24 0 M88 174 q12 8 24 0" stroke="#c9b27a" stroke-width="2" fill="none"/>`);
  if(outfit==='terno') L.push(`<path d="M68 140 Q58 128 66 120 Q76 126 80 138 Z M132 140 Q142 128 134 120 Q124 126 120 138 Z" fill="#f6efd9" ${S}/><path d="M86 152 q14 10 28 0" stroke="#c9b27a" stroke-width="2" fill="none"/>`);
  if(outfit==='sporty') L.push(`<text x="100" y="176" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#fff" stroke="${OL}" stroke-width="1.2">9</text><path d="M74 150 H126" stroke="#fff" stroke-width="4"/>`);
  if(outfit==='superhero') L.push(`<path d="M100 150 l5 10 11 1 -8 7 3 11 -11 -6 -11 6 3 -11 -8 -7 11 -1z" fill="#f5c842" ${S2}/><rect x="73" y="180" width="54" height="7" fill="#f5c842" ${S2}/>`);
  if(outfit==='royal') L.push(`<path d="M72 140 Q100 158 128 140 Q122 152 100 160 Q78 152 72 140 Z" fill="#fff" ${S}/><g fill="${OL}"><circle cx="88" cy="150" r="1.6"/><circle cx="100" cy="155" r="1.6"/><circle cx="112" cy="150" r="1.6"/></g><path d="M100 160 V190" stroke="#f5c842" stroke-width="4"/>`);
  if(outfit==='knight') L.push(`<path d="M74 150 H126 M74 166 H126" stroke="#7b8798" stroke-width="2.5"/><path d="M100 142 V190" stroke="#7b8798" stroke-width="2.5"/><ellipse cx="72" cy="142" rx="14" ry="9" fill="#e1e8f1" ${S}/><ellipse cx="128" cy="142" rx="14" ry="9" fill="#e1e8f1" ${S}/><path d="M92 176 h16 v8 h-16z" fill="#f5c842" ${S2}/>`);
  if(outfit==='mage') L.push(`<path d="M72 186 Q70 206 68 220 L132 220 Q130 206 128 186 Z" fill="#3b2a8f" ${S}/><path d="M86 168 l2 4 4 .5 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-.5z M114 200 l2 4 4 .5 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-.5z" fill="#ffd23f"/><path d="M100 142 V186" stroke="#ffd23f" stroke-width="3"/>`);
  if(outfit==='agent') L.push(`<path d="M88 138 L100 166 L112 138 Z" fill="#ffffff" ${S2}/><path d="M100 146 L96 152 L100 176 L104 152 Z" fill="#0b0d12" ${SW(1.4)}/><path d="M88 138 L84 160 L96 150 Z M112 138 L116 160 L104 150 Z" fill="#2c3344" ${S2}/><circle cx="116" cy="168" r="4.5" fill="#f5b942" ${SW(1.4)}/><path d="M76 188 H124" stroke="#0b0d12" stroke-width="3"/>`);
  if(outfit==='casual') L.push(`<path d="M90 142 Q100 150 110 142" stroke="${OL}" stroke-width="2.4" fill="none"/>`);
  if(o.pin && PIN[o.pin]) L.push(o.pin==='smb' ? `<circle cx="116" cy="156" r="7" fill="#f5b942" ${S2}/><text x="116" y="159" text-anchor="middle" font-family="Arial Black,Arial" font-size="7" font-weight="900" fill="${OL}">S</text>` : stripes(PIN[o.pin], 108, 148, 16, 14, id+'pin'));
  // arms
  const armUp = o.pose==='cheer';
  const shy = o.mood==='mahiyain' && !armUp;
  const nail = o.nails ? `<circle cx="0" cy="22" r="2.6" fill="${NAIL[o.nails]}" stroke="${OL}" stroke-width="1"/>` : '';
  const sleeve = outfit==='pride' ? '#fff' : of.top;
  const arm = (side) => {
    const x = side<0 ? 72 : 128, rot = armUp ? side*-122 : shy ? side*22 : side*-14;
    return `<g class="arm${side<0?'L':'R'}" transform="translate(${x} 146) rotate(${rot})"><rect x="-8" y="-4" width="16" height="30" rx="7" fill="${sleeve}" ${S}/><circle cx="0" cy="28" r="8" fill="${sk}" ${S}/><g transform="translate(0 6)">${nail}</g></g>`;
  };
  L.push(arm(-1), arm(1));
  if(o.acc==='bowtie') L.push(`<path d="M100 141 L86 133 L86 149 Z M100 141 L114 133 L114 149 Z" fill="#e5383b" ${S}/><circle cx="100" cy="141" r="4" fill="#b5172f" ${S}/>`);

  // ── HEAD ──
  const H = [];
  if(M.extra==='horns') H.push(`<path d="M62 52 Q56 30 70 24 Q70 40 78 46Z M138 52 Q144 30 130 24 Q130 40 122 46Z" fill="#e5383b" ${S2}/>`);
  H.push(`<circle cx="46" cy="96" r="9" fill="${sk}" ${S}/><circle cx="154" cy="96" r="9" fill="${sk}" ${S}/>`);
  if(o.earrings){
    const e = { studs:`<circle cx="44" cy="106" r="3.5" fill="#fff" ${S1}/><circle cx="156" cy="106" r="3.5" fill="#fff" ${S1}/>`,
      hoops:`<circle cx="44" cy="112" r="6.5" fill="none" stroke="#f5c842" stroke-width="3"/><circle cx="156" cy="112" r="6.5" fill="none" stroke="#f5c842" stroke-width="3"/>`,
      pearls:`<path d="M44 104v6M156 104v6" stroke="#f5c842" stroke-width="2"/><circle cx="44" cy="114" r="4.5" fill="#fbf7f0" ${S1}/><circle cx="156" cy="114" r="4.5" fill="#fbf7f0" ${S1}/>`,
      diamonds:`<path d="M44 102 l5 5 -5 6 -5 -6z M156 102 l5 5 -5 6 -5 -6z" fill="#b9f2ff" ${S1}/>` }[o.earrings];
    if(e) H.push(e);
  }
  H.push(`<ellipse cx="100" cy="92" rx="54" ry="50" fill="${sk}" ${S}/>`);
  H.push(`<path d="M128 70 Q152 92 140 126 Q150 96 128 70Z" fill="${skD}" opacity=".35"/>`);
  // eyes
  const EY = o.eyes, eyeL = 80, eyeR = 120, ey = 100;
  const shine = (dx=0,dy=0) => `<circle cx="${eyeL+3+dx}" cy="${ey-5+dy}" r="4" fill="#fff"/><circle cx="${eyeR+3+dx}" cy="${ey-5+dy}" r="4" fill="#fff"/><circle cx="${eyeL-3+dx}" cy="${ey+5+dy}" r="1.8" fill="#fff"/><circle cx="${eyeR-3+dx}" cy="${ey+5+dy}" r="1.8" fill="#fff"/>`;
  const eyeShapes = {
    round: `<ellipse cx="${eyeL}" cy="${ey}" rx="9" ry="12" fill="${EY}"/><ellipse cx="${eyeR}" cy="${ey}" rx="9" ry="12" fill="${EY}"/>${shine()}`,
    happy: `<path d="M71 102 Q80 90 89 102 M111 102 Q120 90 129 102" stroke="${OL}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`,
    side:  `<ellipse cx="${eyeL}" cy="${ey}" rx="9" ry="10" fill="${EY}"/><ellipse cx="${eyeR}" cy="${ey}" rx="9" ry="10" fill="${EY}"/><path d="M70 94 H90 M110 94 H130" stroke="${sk}" stroke-width="7"/><path d="M70 96 H90 M110 96 H130" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/><circle cx="${eyeL+5}" cy="${ey+1}" r="3" fill="#fff"/><circle cx="${eyeR+5}" cy="${ey+1}" r="3" fill="#fff"/>`,
    narrow:`<path d="M70 96 L90 100 L88 106 Q80 108 72 104Z M130 96 L110 100 L112 106 Q120 108 128 104Z" fill="${EY}" ${S2}/><circle cx="82" cy="102" r="1.8" fill="#fff"/><circle cx="118" cy="102" r="1.8" fill="#fff"/>`,
    down:  `<ellipse cx="${eyeL}" cy="${ey+3}" rx="8" ry="10" fill="${EY}"/><ellipse cx="${eyeR}" cy="${ey+3}" rx="8" ry="10" fill="${EY}"/><circle cx="${eyeL+1}" cy="${ey+7}" r="3" fill="#fff"/><circle cx="${eyeR+1}" cy="${ey+7}" r="3" fill="#fff"/>`,
    small: `<ellipse cx="${eyeL}" cy="${ey}" rx="9" ry="11" fill="#fff" ${S2}/><ellipse cx="${eyeR}" cy="${ey}" rx="9" ry="11" fill="#fff" ${S2}/><circle cx="${eyeL}" cy="${ey+1}" r="3.4" fill="${EY}"/><circle cx="${eyeR}" cy="${ey+1}" r="3.4" fill="${EY}"/>`,
    star:  `<path d="M80 88 l3.5 7.5 8 1 -6 5.5 1.5 8 -7 -4 -7 4 1.5 -8 -6 -5.5 8 -1z M120 88 l3.5 7.5 8 1 -6 5.5 1.5 8 -7 -4 -7 4 1.5 -8 -6 -5.5 8 -1z" fill="#ffd23f" ${S2}/>`,
    half:  `<ellipse cx="${eyeL}" cy="${ey+2}" rx="9" ry="9" fill="${EY}"/><ellipse cx="${eyeR}" cy="${ey+2}" rx="9" ry="9" fill="${EY}"/><path d="M69 98 H91 M109 98 H131" stroke="${sk}" stroke-width="9"/><path d="M70 98 H90 M110 98 H130" stroke="${OL}" stroke-width="3" stroke-linecap="round"/><circle cx="${eyeL+3}" cy="${ey+4}" r="2.4" fill="#fff"/><circle cx="${eyeR+3}" cy="${ey+4}" r="2.4" fill="#fff"/>`,
    teary: `<ellipse cx="${eyeL}" cy="${ey}" rx="10" ry="13" fill="${EY}"/><ellipse cx="${eyeR}" cy="${ey}" rx="10" ry="13" fill="${EY}"/>${shine()}<circle cx="${eyeL+4}" cy="${ey+3}" r="3" fill="#fff"/><circle cx="${eyeR+4}" cy="${ey+3}" r="3" fill="#fff"/><path d="M71 108 Q80 113 89 108 M111 108 Q120 113 129 108" stroke="#7fd6ff" stroke-width="3" fill="none"/>`,
  };
  H.push(`<g class="eyes">${eyeShapes[M.eye] || eyeShapes.round}${lashes && !['happy','star'].includes(M.eye) ? `<path d="M70 92 l-5 -3 M70 97 l-6 -1 M130 92 l5 -3 M130 97 l6 -1" stroke="${OL}" stroke-width="2.2"/>` : lashes ? `<path d="M70 98 l-5 -3 M130 98 l5 -3" stroke="${OL}" stroke-width="2.2"/>` : ''}</g>`);
  const bc = darker(hc,.8);
  const brows = { soft:'M71 84 q9 -5 17 -1 M112 83 q9 -4 17 1', raised:'M71 86 q9 -2 17 0 M112 80 q9 -8 17 -2', angry:'M70 80 L89 88 M130 80 L111 88',
    worried:'M70 86 L88 80 M130 86 L112 80', high:'M71 78 q9 -6 17 -2 M112 76 q9 -4 17 2', flat:'M71 86 H88 M112 86 H129' };
  H.push(`<path d="${brows[M.brow]}" stroke="${bc}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`);
  const blush = M.extra==='blush' ? 1 : .55;
  H.push(`<ellipse cx="68" cy="116" rx="${M.extra==='blush'?11:8}" ry="${M.extra==='blush'?7:5}" fill="#ff7a93" opacity="${blush}"/><ellipse cx="132" cy="116" rx="${M.extra==='blush'?11:8}" ry="${M.extra==='blush'?7:5}" fill="#ff7a93" opacity="${blush}"/>`);
  if(M.extra==='blush') H.push(`<path d="M62 114 l4 -4 M68 115 l4 -4 M126 114 l4 -4 M132 115 l4 -4" stroke="#d94f6b" stroke-width="1.8"/>`);
  const lip = o.lipstick ? LIP[o.lipstick] : null, mc = lip || '#8c2f2f';
  const mouths = {
    smile: lip ? `<path d="M92 118 Q100 126 108 118 Q100 121 92 118Z" fill="${lip}" stroke="${OL}" stroke-width="1.8" stroke-linejoin="round"/>` : `<path d="M93 118 Q100 124 107 118" stroke="${OL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    grin:  `<path d="M89 115 Q100 130 111 115 Z" fill="${mc}" ${S2}/><path d="M92 116 H108" stroke="#fff" stroke-width="2.5"/>`,
    smirk: `<path d="M92 120 Q102 122 110 113" stroke="${lip||OL}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    frown: `<path d="M92 123 Q100 115 108 123" stroke="${lip||OL}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    wavy:  `<path d="M91 120 q3 -3 6 0 t6 0 t6 0" stroke="${lip||OL}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    open:  `<path d="M88 114 Q100 134 112 114 Z" fill="${mc}" ${S2}/><path d="M94 124 Q100 128 106 124" fill="#ff8fa3"/>`,
    o:     `<ellipse cx="100" cy="121" rx="5" ry="6.5" fill="${mc}" ${S2}/>`,
  };
  H.push(o.pose==='cheer' && !['frown','wavy'].includes(M.mouth) ? mouths.open : mouths[M.mouth] || mouths.smile);
  // front hair
  const hl = `<path d="M74 48 Q92 40 112 43" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const bangs = `<path d="M46 96 Q40 44 100 38 Q160 44 154 96 Q150 72 132 64 Q126 78 108 74 Q114 66 110 60 Q96 76 72 74 Q60 78 52 100 Z" fill="${hc}" ${S}/>${hl}`;
  const HS = {
    spiky: `<path d="M46 98 Q36 40 100 36 Q164 40 154 98 Q150 80 142 72 L136 82 L128 66 L116 78 L108 62 L96 76 L86 62 L78 78 L68 66 L60 82 Q52 84 46 98Z" fill="${hc}" ${S}/>${hl}`,
    pompadour: `<path d="M48 92 Q40 50 70 40 Q86 14 124 22 Q156 30 152 92 Q148 66 128 62 Q102 58 80 64 Q60 70 48 92Z" fill="${hc}" ${S}/><path d="M86 30 Q106 22 126 30" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M48 92 Q50 100 52 108 M152 92 Q150 100 148 108" stroke="${hcD}" stroke-width="5"/>`,
    buzz: `<path d="M48 82 Q52 44 100 40 Q148 44 152 82 Q146 64 128 60 Q100 52 72 60 Q54 64 48 82Z" fill="${hc}" ${S}/>`,
    bob: bangs, long: bangs, ponytail: bangs + `<path d="M144 62 q10 -2 12 6" stroke="#ff5fa2" stroke-width="6" stroke-linecap="round"/>`,
    curly: `<path d="M48 90 q-4 -16 10 -24 q0 -18 20 -20 q8 -14 24 -8 q16 -8 26 6 q20 2 20 22 q12 10 4 24 q-10 -14 -22 -12 q-6 -10 -18 -6 q-10 -10 -22 -2 q-12 -6 -20 4 q-14 0 -22 16Z" fill="${hc}" ${S}/>`,
  };
  H.push(HS[hairStyle] || HS.spiky);
  const A = {
    shades:`<g><rect x="64" y="90" width="30" height="20" rx="7" fill="#111" ${SW(2.6)}/><rect x="106" y="90" width="30" height="20" rx="7" fill="#111" ${SW(2.6)}/><path d="M94 98 Q100 94 106 98" stroke="${OL}" stroke-width="3" fill="none"/><path d="M69 95 h9 M111 95 h9" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/></g>`,
    cap:`<g><path d="M48 70 Q50 30 100 28 Q150 30 152 70 Z" fill="#2257c9" ${S}/><path d="M100 70 Q150 64 170 76 Q150 84 100 78 Z" fill="#1a45a3" ${S}/><circle cx="100" cy="30" r="4" fill="#1a45a3" ${S2}/><text x="100" y="60" text-anchor="middle" font-family="Arial Black,Arial" font-size="13" font-weight="900" fill="#f5c842">SMB</text></g>`,
    crown:`<g><path d="M66 50 V20 L80 36 L100 10 L120 36 L134 20 V50 Z" fill="#ffd23f" ${S}/><rect x="66" y="42" width="68" height="10" fill="#e9a800" ${S}/><circle cx="100" cy="34" r="5" fill="#e5383b" ${S2}/><circle cx="80" cy="46" r="3" fill="#3a86ff"/><circle cx="120" cy="46" r="3" fill="#3a86ff"/></g>`,
    headphones:`<g><path d="M44 96 Q40 26 100 24 Q160 26 156 96" stroke="#22262e" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="34" y="84" width="20" height="30" rx="8" fill="#e5383b" ${S}/><rect x="146" y="84" width="20" height="30" rx="8" fill="#e5383b" ${S}/></g>`,
    helmet:`<g><path d="M44 92 Q40 26 100 24 Q160 26 156 92 L140 92 Q138 60 100 58 Q62 60 60 92 Z" fill="#c9d3e0" ${S}/><path d="M100 24 V58" stroke="#9aa8bb" stroke-width="4"/><path d="M100 22 Q114 4 132 10 Q114 14 104 26Z" fill="#e5383b" ${SW(2.4)}/></g>`,
    wizard:`<g><path d="M100 4 Q116 26 138 50 L62 50 Q86 26 100 4Z" fill="#3b2a8f" ${S}/><ellipse cx="100" cy="52" rx="58" ry="10" fill="#2c1f6e" ${S}/><path d="M96 26 l2 4 4 .5 -3 3 1 4 -4-2 -4 2 1-4 -3-3 4-.5z" fill="#ffd23f"/></g>`,
    flower:`<g><circle cx="138" cy="60" r="7" fill="#ff5fa2" ${SW(2.4)}/><circle cx="148" cy="66" r="5" fill="#ff5fa2" ${SW(2.4)}/><circle cx="138" cy="60" r="2.4" fill="#ffd23f"/></g>`,
  };
  if(A[o.acc]) H.push(A[o.acc]);
  if(outfit==='agent' && !['headphones','helmet'].includes(o.acc)) H.push(`<g><path d="M46 92 Q42 30 100 28 Q158 30 154 92" stroke="#22262e" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="145" y="84" width="17" height="24" rx="7" fill="#2b2f38" ${S2}/><path d="M152 106 Q150 124 118 124" stroke="#22262e" stroke-width="3.2" fill="none" stroke-linecap="round"/><rect x="110" y="120" width="10" height="7" rx="3.5" fill="#f5b942" ${SW(1.4)}/><rect x="38" y="86" width="12" height="18" rx="5" fill="#2b2f38" ${S2}/></g>`);
  // mood extras (on top)
  const X = {
    heart:  `<path d="M150 46 c-4 -6 -12 -2 -8 4 l8 8 8 -8 c4 -6 -4 -10 -8 -4z" fill="#ff5fa2" ${S2}/>`,
    vein:   `<path d="M136 62 l6 6 M142 62 l-6 6 M134 65 h10 M139 59 v12" stroke="#e5383b" stroke-width="3.2" stroke-linecap="round"/>`,
    sweat:  `<path d="M146 66 q6 10 0 14 q-6 -4 0 -14z" fill="#7fd6ff" ${S2}/>`,
    glasses:`<g><circle cx="80" cy="100" r="15" fill="#cfefff" fill-opacity=".25" ${SW(3)}/><circle cx="120" cy="100" r="15" fill="#cfefff" fill-opacity=".25" ${SW(3)}/><path d="M95 100 H105" stroke="${OL}" stroke-width="3"/><path d="M72 92 l5 -3" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`,
    sparkle:`<path d="M152 50 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z M40 58 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffd23f" ${S1}/>`,
    note:   `<path d="M148 40 v18 a5 4 0 1 1 -3 -3 v-15 l12 -3 v14 a5 4 0 1 1 -3 -3 v-9z" fill="#3ddc97" ${S1}/>`,
    tear:   `<path d="M72 110 q4 8 0 12 q-4 -4 0 -12z" fill="#7fd6ff" ${S1}/>`,
    shine:  `<path d="M154 44 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff" ${S1}/>`,
  };
  if(X[M.extra]) H.push(X[M.extra]);
  L.push(`<g class="head" transform="translate(0 ${o.bob||0})">${H.join('')}</g>`);

  const motion = { sway:'0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}', bounce:'50%{transform:translateY(-6px)}', stomp:'0%,100%{transform:none}20%{transform:translateY(-3px)}25%{transform:translateY(1px)}',
    peek:'0%,100%{transform:translateX(0)}50%{transform:translateX(-3px) rotate(-2deg)}', shiver:'0%,100%{transform:translateX(0)}25%{transform:translateX(-1.5px)}75%{transform:translateX(1.5px)}',
    nod:'0%,100%{transform:none}50%{transform:translateY(2px)}', hop:'0%,60%,100%{transform:none}30%{transform:translateY(-10px)}', swoon:'0%,100%{transform:rotate(0)}50%{transform:rotate(-5deg)}' }[M.motion];
  const css = o.anim ? `<style>
    #${id} .head{transform-origin:100px 140px;animation:${id}bob 2.4s ease-in-out infinite}
    #${id} .eyes{transform-origin:100px 100px;animation:${id}blink 4.2s infinite}
    #${id} > .body{transform-origin:100px 226px;${motion?`animation:${id}mood ${M.motion==='shiver'?'.25':'2.2'}s ease-in-out infinite`:''}}
    #${id}.walk .legL{transform-origin:88px 190px;animation:${id}stepA .5s ease-in-out infinite}
    #${id}.walk .legR{transform-origin:112px 190px;animation:${id}stepB .5s ease-in-out infinite}
    #${id}.cheer > .body{animation:${id}jump .7s ease-in-out infinite}
    @keyframes ${id}bob{50%{transform:translateY(2.5px)}}
    @keyframes ${id}blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
    @keyframes ${id}stepA{50%{transform:rotate(14deg)}} @keyframes ${id}stepB{50%{transform:rotate(-14deg)}}
    @keyframes ${id}jump{50%{transform:translateY(-10px)}}
    ${motion?`@keyframes ${id}mood{${motion}}`:''}
    @media (prefers-reduced-motion:reduce){#${id} *{animation:none!important}}
  </style>` : '';
  const cls = o.pose==='walk' ? 'walk' : o.pose==='cheer' ? 'cheer' : '';
  const bgPart = o.bg !== false ? 1 + (o.bg==='galaxy'?1:0) + (o.frame?1:0) : 0;
  const back = L.slice(0, bgPart).join(''), body = L.slice(bgPart).join('');
  return `<svg id="${id}" class="${cls}" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Player avatar">${defs}${css}${back}<g class="body">${body}</g></svg>`;
}
G.avatarSVG = avatarSVG;
G.AVATAR_ART = { SKIN, HAIR, OUT, BG, FRAME, PIN, MOODS };
})(typeof window!=='undefined'?window:globalThis);
