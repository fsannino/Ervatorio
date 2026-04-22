// ============================================================
// RODA DE SABORES — Tea Flavor Wheel (vanilla JS + SVG)
// ============================================================

const FLAVOR_CATS = [
  {
    name:"FLORAL", color:"#DDA0DD", emoji:"🌸",
    desc:"Notas perfumadas e delicadas de flores. Características de chás brancos, oolongs leves e infusões de flores como hibisco e lavanda.",
    subs:[
      {name:"Flores Brancas",color:"#C87DC8",items:["Jasmim","Gardênia","Frangipani"]},
      {name:"Flores Secas",color:"#E8B8E8",items:["Lavanda","Rosa","Violeta","Camomila"]},
      {name:"Floral Doce",color:"#F0D0F0",items:["Baunilha Floral","Elderflower","Lírio"]},
    ]
  },
  {
    name:"FRUTADO", color:"#FF8C69", emoji:"🍑",
    desc:"Notas de frutas frescas ou secas. Presentes em oolongs frutados, chás pretos de terroir e infusões de hibisco e frutas.",
    subs:[
      {name:"Cítricas",color:"#FF6040",items:["Limão","Laranja","Bergamota","Toranja","Yuzu"]},
      {name:"Vermelhas",color:"#E84040",items:["Framboesa","Morango","Groselha","Amora"]},
      {name:"Tropicais",color:"#FFA060",items:["Manga","Abacaxi","Maracujá","Lichia"]},
      {name:"De Caroço",color:"#FFB880",items:["Pêssego","Damasco","Cereja","Ameixa"]},
      {name:"Secas",color:"#CC7050",items:["Tâmara","Figo","Uva-passa","Ameixão"]},
    ]
  },
  {
    name:"VEGETAL", color:"#5DBB63", emoji:"🌿",
    desc:"Notas verdes e herbáceas. Muito características de chás verdes japoneses (matcha, sencha), chás frescos e infusões de ervas.",
    subs:[
      {name:"Verde Fresco",color:"#48A850",items:["Capim","Ervilha","Pepino","Espinafre"]},
      {name:"Herbáceo",color:"#70C870",items:["Menta","Hortelã","Tomilho","Alecrim","Sálvia"]},
      {name:"Marinho",color:"#40B870",items:["Alga","Marinho","Umami","Oceânico"]},
      {name:"Vegetal Cozido",color:"#88D088",items:["Feijão Verde","Aspargo","Alcachofra","Couve"]},
    ]
  },
  {
    name:"AMADEIRADO", color:"#8B7355", emoji:"🪵",
    desc:"Notas de madeira, terra e floresta. Comuns em pu-erhs fermentados, chás envelhecidos e infusões de raízes como rooibos.",
    subs:[
      {name:"Madeira Fresca",color:"#7A6245",items:["Cedro","Bambu","Carvalho","Madeira Verde"]},
      {name:"Amadeirado Seco",color:"#9A8265",items:["Teca","Sândalo","Cortiça"]},
      {name:"Florestal",color:"#6A7245",items:["Musgo","Folhas Úmidas","Pinheiro","Cogumelo"]},
    ]
  },
  {
    name:"ESPECIARIAS", color:"#CC7722", emoji:"🌶️",
    desc:"Notas picantes e aromáticas. Característicos de chais masala, misturas de ervas, rooibos condimentado e pu-erhs.",
    subs:[
      {name:"Quentes",color:"#BB6620",items:["Canela","Cravo","Cardamomo","Noz-moscada","Pimenta-da-Jamaica"]},
      {name:"Frescas",color:"#DD8840",items:["Gengibre","Pimenta","Pimenta Branca","Anis","Erva-doce"]},
      {name:"Aromático",color:"#EEA060",items:["Alcaçuz","Anis Estrelado","Funcho","Cominho"]},
    ]
  },
  {
    name:"DOCE", color:"#F0C040", emoji:"🍯",
    desc:"Notas naturalmente adocicadas. Muito presentes em chás brancos, oolongs de alta qualidade, rooibos e infusões de camomila.",
    subs:[
      {name:"Mel e Caramelo",color:"#E0B030",items:["Mel","Caramelo","Butterscotch","Toffee"]},
      {name:"Malte e Cereal",color:"#D09020",items:["Malte","Biscoito","Pão de Mel","Cevada"]},
      {name:"Baunilha",color:"#F8D860",items:["Baunilha","Creme","Leite Condensado","Coco"]},
    ]
  },
  {
    name:"TERROSO", color:"#9B8B70", emoji:"🪨",
    desc:"Notas de terra, minerais e pedra. Muito presentes em pu-erhs, chás de pedra, chás de alta altitude e chás maturados.",
    subs:[
      {name:"Mineral",color:"#8A7A60",items:["Pedra","Giz","Xisto","Ardósia","Água de Fonte"]},
      {name:"Terroso",color:"#A89070",items:["Terra Úmida","Argila","Húmus","Petrichor"]},
      {name:"Cogumelo",color:"#C0A880",items:["Cogumelo","Umami","Shiitake","Trufas"]},
    ]
  },
  {
    name:"TORRADO", color:"#6B4C3B", emoji:"🔥",
    desc:"Notas de torrefação e fumaça. Presentes em chás pretos fortemente torrados, hojicha, chás defumados como Lapsang Souchong.",
    subs:[
      {name:"Torrado",color:"#7A5040",items:["Tostado","Avelã Torrada","Pão Torrado","Cereal Torrado"]},
      {name:"Defumado",color:"#5A3C2A",items:["Defumado","Pinho","Fumaça","Carvão"]},
      {name:"Carbonizado",color:"#4A2C1A",items:["Cinzas","Queimado","Turfa"]},
    ]
  },
  {
    name:"CÍTRICO", color:"#C8D400", emoji:"🍋",
    desc:"Notas cítricas e de acidez brilhante. Muito presentes em chás brancos, verdes leves, rooibos e infusões de hibisco.",
    subs:[
      {name:"Cítrico Fresco",color:"#B8C400",items:["Limão Siciliano","Lima","Toranja","Limão Cravo"]},
      {name:"Ácido Brilhante",color:"#D8E020",items:["Vinagre de Maçã","Iogurte","Kefir","Azedo Suave"]},
      {name:"Tamarindo",color:"#A8A820",items:["Tamarindo","Hibisco","Groselha-Negra","Amora Ácida"]},
    ]
  },
];

// Perfis sensoriais por tipo — Camellia sinensis + Rooibos (infusão próxima).
// Camomila, hibisco e hortelã foram removidos: são infusões herbais, não chás.
const FLAVOR_TEA_TYPES = [
  {name:"Chá Verde",color:"#5DBB63",notes:"Vegetal, Herbáceo, Marinho, Doce suave"},
  {name:"Chá Branco",color:"#DDA0DD",notes:"Floral, Mel, Frutado leve, Delicado"},
  {name:"Chá Preto",color:"#8B5E3C",notes:"Malte, Amadeirado, Frutado, Torrado"},
  {name:"Oolong",color:"#CC7722",notes:"Floral, Frutado, Torrado, Mel"},
  {name:"Pu-erh",color:"#6B4C3B",notes:"Terroso, Amadeirado, Cogumelo, Defumado"},
  {name:"Rooibos",color:"#E8803A",notes:"Doce, Baunilha, Especiarias, Terroso"},
];

// ── SVG geometry helpers ──
const TAU=2*Math.PI;
const RI={c0:72,c1:142,s0:146,s1:234,i0:238,i1:302};

function flavorLighten(hex,t){
  const n=parseInt(hex.replace('#',''),16);
  const r=(n>>16)&0xff,g=(n>>8)&0xff,b=n&0xff;
  return `rgb(${Math.round(r+(255-r)*t)},${Math.round(g+(255-g)*t)},${Math.round(b+(255-b)*t)})`;
}

function flavorArc(a0,a1,ri,ro,pad){
  pad=pad||0.01;
  const sa=a0+pad,ea=a1-pad;
  if(ea-sa<=0.001)return'';
  const lg=(ea-sa)>Math.PI?1:0;
  const f=v=>v.toFixed(3);
  const x1=Math.sin(sa)*ro,y1=-Math.cos(sa)*ro;
  const x2=Math.sin(ea)*ro,y2=-Math.cos(ea)*ro;
  const x3=Math.sin(ea)*ri,y3=-Math.cos(ea)*ri;
  const x4=Math.sin(sa)*ri,y4=-Math.cos(sa)*ri;
  return `M${f(x1)},${f(y1)} A${ro},${ro},0,${lg},1,${f(x2)},${f(y2)} L${f(x3)},${f(y3)} A${ri},${ri},0,${lg},0,${f(x4)},${f(y4)}Z`;
}

function flavorMid(a0,a1,r){
  const a=(a0+a1)/2;
  return {x:Math.sin(a)*r,y:-Math.cos(a)*r,a};
}

function flavorTextRot(a){
  const deg=a*180/Math.PI;
  return deg>180?deg-180:deg;
}

function buildFlavorSegments(){
  const total=FLAVOR_CATS.reduce((s,c)=>s+c.subs.reduce((ss,sub)=>ss+sub.items.length,0),0);
  const out=[];
  let ca=0;
  for(const cat of FLAVOR_CATS){
    const cl=cat.subs.reduce((s,sub)=>s+sub.items.length,0);
    const cs=(cl/total)*TAU;
    const ce=ca+cs;
    out.push({kind:'cat',name:cat.name,color:cat.color,emoji:cat.emoji,desc:cat.desc,subs:cat.subs,a0:ca,a1:ce});
    let sa=ca;
    for(const sub of cat.subs){
      const sl=sub.items.length;
      const ss=(sl/cl)*cs;
      const se=sa+ss;
      out.push({kind:'sub',name:sub.name,color:sub.color,catName:cat.name,catColor:cat.color,items:sub.items,a0:sa,a1:se});
      const iw=ss/sl;
      for(let i=0;i<sl;i++){
        out.push({kind:'item',name:sub.items[i],color:flavorLighten(sub.color,0.32),
          subName:sub.name,catName:cat.name,catColor:cat.color,a0:sa+i*iw,a1:sa+(i+1)*iw});
      }
      sa=se;
    }
    ca=ce;
  }
  return out;
}

// ── State ──
let flavorSegs=null;
let flavorSel=null;
let flavorTab='wheel'; // 'wheel' | 'types'

function getFlavorOp(seg){
  if(!flavorSel)return 0.88;
  if(flavorSel.kind==='cat'){
    if(seg.kind==='cat'&&seg.name===flavorSel.name)return 1;
    if((seg.kind==='sub'||seg.kind==='item')&&seg.catName===flavorSel.name)return 1;
    return 0.18;
  }
  if(flavorSel.kind==='sub'){
    if(seg.kind==='cat'&&seg.name===flavorSel.catName)return 0.8;
    if(seg.kind==='sub'&&seg.name===flavorSel.name&&seg.catName===flavorSel.catName)return 1;
    if(seg.kind==='item'&&seg.subName===flavorSel.name&&seg.catName===flavorSel.catName)return 1;
    return 0.18;
  }
  if(flavorSel.kind==='item'){
    if(seg.kind==='cat'&&seg.name===flavorSel.catName)return 0.7;
    if(seg.kind==='sub'&&seg.name===flavorSel.subName&&seg.catName===flavorSel.catName)return 0.85;
    if(seg.kind==='item'&&seg.a0===flavorSel.a0)return 1;
    return 0.18;
  }
  return 0.88;
}

function flavorClick(seg){
  if(flavorSel&&flavorSel.kind===seg.kind&&flavorSel.a0===seg.a0){flavorSel=null;}
  else{flavorSel=seg;}
  renderFlavorWheel();
}

function switchFlavorTab(t){
  flavorTab=t;
  document.getElementById('flavorTabWheel').classList.toggle('on',t==='wheel');
  document.getElementById('flavorTabTypes').classList.toggle('on',t==='types');
  document.getElementById('flavorWheelPanel').style.display=t==='wheel'?'':'none';
  document.getElementById('flavorTypesPanel').style.display=t==='types'?'':'none';
}

// ── Render ──
function initFlavorWheel(){
  if(!flavorSegs) flavorSegs=buildFlavorSegments();
  const el=document.getElementById('flavorWheelContainer');
  if(!el)return;
  el.innerHTML=`
    <div style="text-align:center;margin-bottom:12px">
      <div style="font-size:.62rem;letter-spacing:.3em;color:var(--muted);text-transform:uppercase;margin-bottom:4px">Guia Sensorial · Chás & Infusões</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;color:var(--gold2);font-weight:300">Roda de Sabores do Provador</div>
    </div>
    <div class="flavor-tabs">
      <button class="flavor-tab on" id="flavorTabWheel" onclick="switchFlavorTab('wheel')">🍵 Roda de Sabores</button>
      <button class="flavor-tab" id="flavorTabTypes" onclick="switchFlavorTab('types')">📋 Tipos de Chá</button>
    </div>
    <div id="flavorWheelPanel">
      <div style="display:flex;justify-content:center">
        <svg id="flavorSvg" viewBox="0 0 640 640" style="width:100%;max-width:520px;display:block"></svg>
      </div>
      <div id="flavorInfo"></div>
      <div class="flavor-legend">
        <span><span class="flavor-dot" style="width:12px;background:#5DBB63"></span> Categoria</span>
        <span><span class="flavor-dot" style="width:17px;background:#DDA0DD"></span> Subcategoria</span>
        <span><span class="flavor-dot" style="width:22px;background:#F0C040"></span> Descritor</span>
      </div>
    </div>
    <div id="flavorTypesPanel" style="display:none">
      <div style="font-size:.72rem;color:var(--muted);text-align:center;margin-bottom:16px">Principais perfis sensoriais por tipo de chá e infusão</div>
      <div class="flavor-types-list">${FLAVOR_TEA_TYPES.map(t=>`
        <div class="flavor-type-card" style="border-left-color:${t.color}">
          <div style="color:${t.color};font-size:.88rem;font-weight:500;margin-bottom:3px">${esc(t.name)}</div>
          <div style="color:var(--cream2);font-size:.78rem;line-height:1.5">${esc(t.notes)}</div>
        </div>`).join('')}
      </div>
    </div>`;
  renderFlavorWheel();
}

function renderFlavorWheel(){
  const svg=document.getElementById('flavorSvg');
  if(!svg)return;
  const C=320;
  const cats=flavorSegs.filter(s=>s.kind==='cat');
  const subs=flavorSegs.filter(s=>s.kind==='sub');
  const items=flavorSegs.filter(s=>s.kind==='item');
  const isLight=document.body.classList.contains('light');
  const bg=isLight?'#f5f2ec':'#050e08';
  const strokeBg=isLight?'#e8e4dc':'#050e08';

  let html=`<g transform="translate(${C},${C})">`;

  // Cat ring
  cats.forEach(seg=>{
    const p=flavorArc(seg.a0,seg.a1,RI.c0,RI.c1,0.012);
    const span=seg.a1-seg.a0;
    const m=flavorMid(seg.a0,seg.a1,(RI.c0+RI.c1)/2);
    const rot=flavorTextRot(m.a);
    const lines=seg.name.split('/');
    const fs=span>0.55?10.5:span>0.3?9.5:8;
    html+=`<path d="${p}" fill="${seg.color}" fill-opacity="${getFlavorOp(seg)}" stroke="${strokeBg}" stroke-width="1.5" style="cursor:pointer;transition:fill-opacity .2s" onclick="flavorClick(flavorSegs[${flavorSegs.indexOf(seg)}])"/>`;
    if(span>0.13){
      html+=`<text x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)},${m.x.toFixed(1)},${m.y.toFixed(1)})" fill="white" font-size="${fs}" font-weight="bold" letter-spacing="0.03em" style="pointer-events:none">`;
      lines.forEach((l,j)=>{html+=`<tspan x="${m.x.toFixed(1)}" dy="${j===0?(lines.length>1?'-0.55em':'0'):'1.3em'}">${esc(l)}</tspan>`;});
      html+=`</text>`;
    }
  });

  // Sub ring
  subs.forEach(seg=>{
    const p=flavorArc(seg.a0,seg.a1,RI.s0,RI.s1,0.009);
    const span=seg.a1-seg.a0;
    const m=flavorMid(seg.a0,seg.a1,(RI.s0+RI.s1)/2);
    const rot=flavorTextRot(m.a);
    const label=seg.name.length>16?seg.name.slice(0,15)+'…':seg.name;
    html+=`<path d="${p}" fill="${seg.color}" fill-opacity="${getFlavorOp(seg)}" stroke="${strokeBg}" stroke-width="0.8" style="cursor:pointer;transition:fill-opacity .2s" onclick="flavorClick(flavorSegs[${flavorSegs.indexOf(seg)}])"/>`;
    if(span>0.085){
      html+=`<text x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)},${m.x.toFixed(1)},${m.y.toFixed(1)})" fill="rgba(255,255,255,0.9)" font-size="7.8" font-family="Jost,sans-serif" style="pointer-events:none">${esc(label)}</text>`;
    }
  });

  // Item ring
  items.forEach(seg=>{
    const p=flavorArc(seg.a0,seg.a1,RI.i0,RI.i1,0.007);
    const span=seg.a1-seg.a0;
    const m=flavorMid(seg.a0,seg.a1,(RI.i0+RI.i1)/2);
    const rot=flavorTextRot(m.a);
    html+=`<path d="${p}" fill="${seg.color}" fill-opacity="${getFlavorOp(seg)}" stroke="${strokeBg}" stroke-width="0.6" style="cursor:pointer;transition:fill-opacity .2s" onclick="flavorClick(flavorSegs[${flavorSegs.indexOf(seg)}])"/>`;
    if(span>0.054){
      html+=`<text x="${m.x.toFixed(1)}" y="${m.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)},${m.x.toFixed(1)},${m.y.toFixed(1)})" fill="rgba(255,255,255,0.82)" font-size="6.3" font-family="Jost,sans-serif" style="pointer-events:none">${esc(seg.name)}</text>`;
    }
  });

  // Center
  html+=`<circle r="69" fill="${bg}"/>`;
  html+=`<circle r="67" fill="none" stroke="var(--gold)" stroke-width="0.8" stroke-opacity="0.4"/>`;
  html+=`<text text-anchor="middle" y="-8" font-size="28" fill="var(--gold2)">🍵</text>`;
  html+=`<text text-anchor="middle" y="14" fill="var(--gold2)" font-size="8.5" letter-spacing="3" font-family="Jost,sans-serif">SABORES</text>`;
  html+=`<text text-anchor="middle" y="27" fill="var(--muted)" font-size="6" letter-spacing="2" font-family="Jost,sans-serif">AROMAS</text>`;
  html+=`</g>`;
  svg.innerHTML=html;

  // Info panel
  renderFlavorInfo();
}

function renderFlavorInfo(){
  const el=document.getElementById('flavorInfo');
  if(!el)return;
  if(!flavorSel){
    el.innerHTML=`<div style="text-align:center;color:var(--muted);font-size:.72rem;margin-top:14px">Clique em qualquer segmento para explorar os sabores</div>`;
    return;
  }
  const s=flavorSel;
  let html=`<div class="flavor-info-card" style="border-color:${s.catColor||s.color}55;box-shadow:0 4px 30px ${(s.catColor||s.color)}15">`;
  if(s.catName||s.subName){
    html+=`<div style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">${[s.catName,s.kind==='item'?s.subName:null].filter(Boolean).join(' › ')}</div>`;
  }
  html+=`<div style="display:flex;justify-content:space-between;align-items:center">`;
  html+=`<div style="color:${s.color};font-size:1.1rem;font-weight:500;display:flex;align-items:center;gap:8px">${s.emoji?s.emoji:''}${esc(s.name)}</div>`;
  html+=`<button onclick="flavorSel=null;renderFlavorWheel()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1.2rem;padding:0">×</button>`;
  html+=`</div>`;

  if(s.desc){
    html+=`<div style="color:var(--cream2);font-size:.82rem;margin-top:10px;line-height:1.65">${esc(s.desc)}</div>`;
  }
  if(s.kind==='cat'&&s.subs){
    html+=`<div style="margin-top:12px"><div style="font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:6px">Subcategorias</div>`;
    html+=`<div style="display:flex;flex-wrap:wrap;gap:6px">${s.subs.map(sub=>`<span class="flavor-chip" style="background:${sub.color}25;border-color:${sub.color}70">${esc(sub.name)}</span>`).join('')}</div></div>`;
  }
  if(s.kind==='sub'&&s.items){
    html+=`<div style="margin-top:12px"><div style="font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:6px">Descritores</div>`;
    html+=`<div style="display:flex;flex-wrap:wrap;gap:6px">${s.items.map(item=>`<span class="flavor-chip" style="background:rgba(200,168,75,.1);border-color:rgba(200,168,75,.35);color:var(--gold2)">${esc(item)}</span>`).join('')}</div></div>`;
  }
  if(s.kind==='item'){
    html+=`<div style="color:var(--cream2);font-size:.82rem;margin-top:10px;line-height:1.6">Descritor sensorial de <strong style="color:var(--gold2)">${esc(s.subName)}</strong>, família <strong style="color:var(--gold2)">${esc(s.catName)}</strong>. Procure essa nota no aroma da xícara quente, no primeiro gole e no pós-gosto.</div>`;
  }
  html+=`</div>`;
  el.innerHTML=html;
}
