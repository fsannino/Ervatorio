// ============================================================
// ADMIN PANEL — Ervatório
// ============================================================
const ADM_SUPABASE_URL = 'https://lwzrzztzpklzbmxbqcrx.supabase.co';
const ADM_SUPABASE_KEY = 'sb_publishable_bZGiaIhD7KqZ5QffyrHwRA_g7fmRT25';

let sb = null;
let admUser = null;
let currentSection = 'dashboard';

// ── INIT ──
async function admInit(){
  sb = window.supabase.createClient(ADM_SUPABASE_URL, ADM_SUPABASE_KEY);
  const {data:{session}} = await sb.auth.getSession();
  if(!session?.user){
    document.getElementById('admLogin').style.display='flex';
    document.getElementById('admShell').style.display='none';
    return;
  }
  admUser = session.user;
  const {data:profile} = await sb.from('user_profiles').select('is_admin,display_name').eq('id',admUser.id).maybeSingle();
  if(!profile?.is_admin){
    document.getElementById('admLogin').style.display='flex';
    document.getElementById('admShell').style.display='none';
    document.getElementById('loginMsg').textContent='Acesso negado. Você não é administrador.';
    document.getElementById('loginMsg').style.color='#e08080';
    return;
  }
  document.getElementById('admLogin').style.display='none';
  document.getElementById('admShell').style.display='flex';
  document.getElementById('admUserName').textContent=profile.display_name||admUser.email;
  showSection('dashboard');
}

async function admLogin(){
  const email=document.getElementById('admEmail').value.trim();
  const pass=document.getElementById('admPass').value;
  const msg=document.getElementById('loginMsg');
  if(!email||!pass){msg.textContent='Preencha email e senha';msg.style.color='#e08080';return;}
  msg.textContent='Entrando...';msg.style.color='var(--adm-gold)';
  try{
    const {error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error)throw error;
    await admInit();
  }catch(e){msg.textContent=e.message==='Invalid login credentials'?'Email ou senha incorretos':e.message;msg.style.color='#e08080';}
}

async function admLogout(){
  await sb.auth.signOut();
  location.reload();
}

// ── NAVIGATION ──
function showSection(id){
  currentSection=id;
  document.querySelectorAll('.adm-section').forEach(s=>s.style.display='none');
  document.querySelectorAll('.adm-nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('sec-'+id).style.display='block';
  document.querySelector(`[data-sec="${id}"]`)?.classList.add('active');
  if(id==='dashboard')loadDashboard();
  if(id==='users')loadUsers();
  if(id==='herbs')loadHerbs();
  if(id==='products')loadProducts();
  if(id==='news')loadNews();
  if(id==='suppliers')loadSuppliers();
}

// ── TOAST ──
function admToast(msg){
  const t=document.getElementById('admToast');
  t.textContent=msg;t.classList.add('on');
  setTimeout(()=>t.classList.remove('on'),2500);
}

// ── DASHBOARD ──
async function loadDashboard(){
  const [users,herbs,products,suppliers,news]=await Promise.all([
    sb.from('user_profiles').select('id',{count:'exact',head:true}),
    sb.from('admin_herbs').select('id',{count:'exact',head:true}),
    sb.from('admin_products').select('id',{count:'exact',head:true}),
    sb.from('admin_suppliers').select('id',{count:'exact',head:true}),
    sb.from('admin_news').select('id',{count:'exact',head:true}),
  ]);
  document.getElementById('statUsers').textContent=users.count||0;
  document.getElementById('statHerbs').textContent=herbs.count||0;
  document.getElementById('statProducts').textContent=products.count||0;
  document.getElementById('statSuppliers').textContent=suppliers.count||0;
  document.getElementById('statNews').textContent=news.count||0;
}

// ══════════════════════════════════════
// USERS
// ══════════════════════════════════════
let allUsers=[];
async function loadUsers(){
  const {data}=await sb.from('user_profiles').select('*').order('created_at',{ascending:false});
  allUsers=data||[];
  renderUsers(allUsers);
}
function filterUsers(){
  const q=document.getElementById('userSearch').value.toLowerCase();
  renderUsers(allUsers.filter(u=>(u.display_name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)||(u.role||'').toLowerCase().includes(q)));
}
function renderUsers(list){
  const tbody=document.getElementById('usersBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum usuário encontrado</td></tr>';return;}
  tbody.innerHTML=list.map(u=>`<tr>
    <td><strong>${esc(u.display_name||'—')}</strong><br><span style="color:var(--adm-muted);font-size:.72rem">${esc(u.email||'')}</span></td>
    <td>${u.role?`<span class="adm-badge gold">${esc(u.role)}</span>`:'—'}</td>
    <td>${esc(u.city||'')}${u.state?', '+esc(u.state):''}</td>
    <td>${u.is_admin?'<span class="adm-badge green">Admin</span>':u.profile_completed?'<span class="adm-badge blue">Completo</span>':'<span class="adm-badge red">Pendente</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${u.created_at?new Date(u.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td><button class="adm-btn danger" onclick="deleteUser('${u.id}','${esc(u.display_name||u.email||'')}')">Excluir</button></td>
  </tr>`).join('');
}
async function deleteUser(id,name){
  if(!confirm(`Excluir o usuário "${name}"? Esta ação não pode ser desfeita.`))return;
  const {error}=await sb.from('user_profiles').delete().eq('id',id);
  if(error){admToast('Erro: '+error.message);return;}
  admToast('Usuário excluído');
  loadUsers();loadDashboard();
}

// ══════════════════════════════════════
// HERBS (Chás e Infusões)
// ══════════════════════════════════════
let allHerbs=[];
async function loadHerbs(){
  const {data}=await sb.from('admin_herbs').select('*').order('created_at',{ascending:false});
  allHerbs=data||[];
  renderHerbsAdmin(allHerbs);
}
function filterHerbsAdmin(){
  const q=document.getElementById('herbSearch').value.toLowerCase();
  renderHerbsAdmin(allHerbs.filter(h=>(h.name||'').toLowerCase().includes(q)||(h.category||'').toLowerCase().includes(q)));
}
function renderHerbsAdmin(list){
  const tbody=document.getElementById('herbsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum chá cadastrado. Clique em "+ Novo chá" para começar.</td></tr>';return;}
  const linhaColor={Essencial:'green',Global:'gold',Funcional:'red'};
  tbody.innerHTML=list.map(h=>`<tr>
    <td>${h.icon||'🍃'} <strong>${esc(h.name)}</strong><br><span style="color:var(--adm-muted);font-size:.72rem;font-style:italic">${esc(h.latin_name||'')}</span></td>
    <td><span class="adm-badge gold">${esc(h.category)}</span>${h.linha?` <span class="adm-badge ${linhaColor[h.linha]||'gold'}" style="margin-left:4px">${esc(h.linha)}</span>`:''}</td>
    <td style="font-size:.78rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(h.effects||'')}</td>
    <td>${h.active?'<span class="adm-badge green">Ativo</span>':'<span class="adm-badge red">Inativo</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${h.created_at?new Date(h.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editHerb('${h.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteHerb('${h.id}','${esc(h.name)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openHerbForm(herb){
  const m=document.getElementById('herbModal');
  document.getElementById('herbFormTitle').textContent=herb?'Editar Chá':'Novo Chá';
  document.getElementById('hfId').value=herb?.id||'';
  document.getElementById('hfName').value=herb?.name||'';
  document.getElementById('hfLatin').value=herb?.latin_name||'';
  document.getElementById('hfIcon').value=herb?.icon||'🍃';
  document.getElementById('hfCategory').value=herb?.category||'Calmante';
  document.getElementById('hfLinha').value=herb?.linha||'';
  document.getElementById('hfTagline').value=herb?.tagline||'';
  document.getElementById('hfEffects').value=herb?.effects||'';
  document.getElementById('hfDetail').value=herb?.detail||'';
  document.getElementById('hfTemp').value=herb?.temp||'';
  document.getElementById('hfTime').value=herb?.brew_time||'';
  document.getElementById('hfDose').value=herb?.dose||'';
  document.getElementById('hfFreq').value=herb?.frequency||'';
  document.getElementById('hfSafe').value=(herb?.safe_for||[]).join(', ');
  document.getElementById('hfAvoid').value=(herb?.avoid_for||[]).join(', ');
  document.getElementById('hfTags').value=(herb?.tags||[]).join(', ');
  document.getElementById('hfActive').checked=herb?.active!==false;
  m.classList.add('on');
}
function editHerb(id){openHerbForm(allHerbs.find(h=>h.id===id));}
function closeHerbForm(){document.getElementById('herbModal').classList.remove('on');}
async function saveHerb(){
  const id=document.getElementById('hfId').value;
  const row={
    name:document.getElementById('hfName').value.trim(),
    latin_name:document.getElementById('hfLatin').value.trim()||null,
    icon:document.getElementById('hfIcon').value.trim()||'🍃',
    category:document.getElementById('hfCategory').value,
    linha:document.getElementById('hfLinha').value||null,
    tagline:document.getElementById('hfTagline').value.trim()||null,
    effects:document.getElementById('hfEffects').value.trim()||null,
    detail:document.getElementById('hfDetail').value.trim()||null,
    temp:document.getElementById('hfTemp').value.trim()||null,
    brew_time:document.getElementById('hfTime').value.trim()||null,
    dose:document.getElementById('hfDose').value.trim()||null,
    frequency:document.getElementById('hfFreq').value.trim()||null,
    safe_for:document.getElementById('hfSafe').value.split(',').map(s=>s.trim()).filter(Boolean),
    avoid_for:document.getElementById('hfAvoid').value.split(',').map(s=>s.trim()).filter(Boolean),
    tags:document.getElementById('hfTags').value.split(',').map(s=>s.trim()).filter(Boolean),
    active:document.getElementById('hfActive').checked,
  };
  if(!row.name){admToast('Nome é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_herbs').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_herbs').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeHerbForm();admToast(id?'Chá atualizado':'Chá criado');loadHerbs();loadDashboard();
}
async function deleteHerb(id,name){
  if(!confirm(`Excluir "${name}"?`))return;
  await sb.from('admin_herbs').delete().eq('id',id);
  admToast('Chá excluído');loadHerbs();loadDashboard();
}

// ══════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════
let allProducts=[];
async function loadProducts(){
  const {data}=await sb.from('admin_products').select('*').order('created_at',{ascending:false});
  allProducts=data||[];
  renderProductsAdmin(allProducts);
}
function filterProductsAdmin(){
  const q=document.getElementById('prodSearch').value.toLowerCase();
  renderProductsAdmin(allProducts.filter(p=>(p.name||'').toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q)));
}
function renderProductsAdmin(list){
  const tbody=document.getElementById('productsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum produto cadastrado.</td></tr>';return;}
  tbody.innerHTML=list.map(p=>`<tr>
    <td>${p.icon||'📦'} <strong>${esc(p.name)}</strong></td>
    <td><span class="adm-badge gold">${esc(p.category)}</span></td>
    <td style="color:var(--adm-gold2)">R$ ${Number(p.price).toFixed(2)}</td>
    <td>${p.stock==='in'?'<span class="adm-badge green">Em estoque</span>':p.stock==='low'?'<span class="adm-badge gold">Últimas</span>':'<span class="adm-badge red">Esgotado</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${p.created_at?new Date(p.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editProduct('${p.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteProduct('${p.id}','${esc(p.name)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openProductForm(p){
  const m=document.getElementById('productModal');
  document.getElementById('productFormTitle').textContent=p?'Editar Produto':'Novo Produto';
  document.getElementById('pfId').value=p?.id||'';
  document.getElementById('pfName').value=p?.name||'';
  document.getElementById('pfDesc').value=p?.description||'';
  document.getElementById('pfIcon').value=p?.icon||'📦';
  document.getElementById('pfCategory').value=p?.category||'Folhas Secas';
  document.getElementById('pfPrice').value=p?.price||'';
  document.getElementById('pfUnit').value=p?.unit||'50g';
  document.getElementById('pfSupplier').value=p?.supplier||'';
  document.getElementById('pfStock').value=p?.stock||'in';
  document.getElementById('pfActive').checked=p?.active!==false;
  m.classList.add('on');
}
function editProduct(id){openProductForm(allProducts.find(p=>p.id===id));}
function closeProductForm(){document.getElementById('productModal').classList.remove('on');}
async function saveProduct(){
  const id=document.getElementById('pfId').value;
  const row={
    name:document.getElementById('pfName').value.trim(),
    description:document.getElementById('pfDesc').value.trim()||null,
    icon:document.getElementById('pfIcon').value.trim()||'📦',
    category:document.getElementById('pfCategory').value,
    price:parseFloat(document.getElementById('pfPrice').value)||0,
    unit:document.getElementById('pfUnit').value.trim()||'50g',
    supplier:document.getElementById('pfSupplier').value.trim()||null,
    stock:document.getElementById('pfStock').value,
    active:document.getElementById('pfActive').checked,
  };
  if(!row.name){admToast('Nome é obrigatório');return;}
  if(!row.price){admToast('Preço é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_products').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_products').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeProductForm();admToast(id?'Produto atualizado':'Produto criado');loadProducts();loadDashboard();
}
async function deleteProduct(id,name){
  if(!confirm(`Excluir "${name}"?`))return;
  await sb.from('admin_products').delete().eq('id',id);
  admToast('Produto excluído');loadProducts();loadDashboard();
}

// ══════════════════════════════════════
// NEWS
// ══════════════════════════════════════
let allNews=[];
async function loadNews(){
  const {data}=await sb.from('admin_news').select('*').order('created_at',{ascending:false});
  allNews=data||[];
  renderNewsAdmin(allNews);
}
function renderNewsAdmin(list){
  const tbody=document.getElementById('newsBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="5" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhuma notícia cadastrada.</td></tr>';return;}
  tbody.innerHTML=list.map(n=>`<tr>
    <td><strong>${esc(n.title)}</strong><br><span style="color:var(--adm-muted);font-size:.72rem;max-width:250px;display:inline-block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((n.content||'').substring(0,80))}</span></td>
    <td><span class="adm-badge blue">${esc(n.category)}</span></td>
    <td>${n.published?'<span class="adm-badge green">Publicado</span>':'<span class="adm-badge red">Rascunho</span>'}</td>
    <td style="font-size:.72rem;color:var(--adm-muted)">${n.created_at?new Date(n.created_at).toLocaleDateString('pt-BR'):''}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editNews('${n.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteNews('${n.id}','${esc(n.title)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openNewsForm(n){
  const m=document.getElementById('newsModal');
  document.getElementById('newsFormTitle').textContent=n?'Editar Notícia':'Nova Notícia';
  document.getElementById('nfId').value=n?.id||'';
  document.getElementById('nfTitle').value=n?.title||'';
  document.getElementById('nfContent').value=n?.content||'';
  document.getElementById('nfCategory').value=n?.category||'noticia';
  document.getElementById('nfPublished').checked=n?.published||false;
  m.classList.add('on');
}
function editNews(id){openNewsForm(allNews.find(n=>n.id===id));}
function closeNewsForm(){document.getElementById('newsModal').classList.remove('on');}
async function saveNews(){
  const id=document.getElementById('nfId').value;
  const row={
    title:document.getElementById('nfTitle').value.trim(),
    content:document.getElementById('nfContent').value.trim(),
    category:document.getElementById('nfCategory').value,
    published:document.getElementById('nfPublished').checked,
  };
  if(!row.title){admToast('Título é obrigatório');return;}
  if(!row.content){admToast('Conteúdo é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_news').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_news').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeNewsForm();admToast(id?'Notícia atualizada':'Notícia criada');loadNews();loadDashboard();
}
async function deleteNews(id,title){
  if(!confirm(`Excluir "${title}"?`))return;
  await sb.from('admin_news').delete().eq('id',id);
  admToast('Notícia excluída');loadNews();loadDashboard();
}

// ══════════════════════════════════════
// SUPPLIERS
// ══════════════════════════════════════
let allSuppliers=[];
async function loadSuppliers(){
  const {data}=await sb.from('admin_suppliers').select('*').order('created_at',{ascending:false});
  allSuppliers=data||[];
  renderSuppliersAdmin(allSuppliers);
}
function renderSuppliersAdmin(list){
  const tbody=document.getElementById('suppliersBody');
  if(!list.length){tbody.innerHTML='<tr><td colspan="6" style="text-align:center;color:var(--adm-muted);padding:2rem">Nenhum fornecedor cadastrado.</td></tr>';return;}
  tbody.innerHTML=list.map(s=>`<tr>
    <td><strong>${esc(s.name)}</strong></td>
    <td><span class="adm-badge gold">${esc(s.type||'')}</span></td>
    <td style="font-size:.78rem">${esc(s.city||'')}</td>
    <td style="font-size:.78rem">${esc(s.certification||'')}</td>
    <td style="font-size:.72rem;color:var(--adm-muted);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(s.herbs||[]).map(h=>esc(h)).join(', ')}</td>
    <td style="white-space:nowrap">
      <button class="adm-btn" onclick="editSupplier('${s.id}')">Editar</button>
      <button class="adm-btn danger" onclick="deleteSupplier('${s.id}','${esc(s.name)}')">Excluir</button>
    </td>
  </tr>`).join('');
}
function openSupplierForm(s){
  const m=document.getElementById('supplierModal');
  document.getElementById('supplierFormTitle').textContent=s?'Editar Fornecedor':'Novo Fornecedor';
  document.getElementById('sfId').value=s?.id||'';
  document.getElementById('sfName').value=s?.name||'';
  document.getElementById('sfType').value=s?.type||'';
  document.getElementById('sfCity').value=s?.city||'';
  document.getElementById('sfSince').value=s?.since||'';
  document.getElementById('sfCert').value=s?.certification||'';
  document.getElementById('sfShip').value=s?.shipping||'';
  document.getElementById('sfMinOrder').value=s?.min_order||'';
  document.getElementById('sfHerbs').value=(s?.herbs||[]).join(', ');
  document.getElementById('sfActive').checked=s?.active!==false;
  m.classList.add('on');
}
function editSupplier(id){openSupplierForm(allSuppliers.find(s=>s.id===id));}
function closeSupplierForm(){document.getElementById('supplierModal').classList.remove('on');}
async function saveSupplier(){
  const id=document.getElementById('sfId').value;
  const row={
    name:document.getElementById('sfName').value.trim(),
    type:document.getElementById('sfType').value.trim()||null,
    city:document.getElementById('sfCity').value.trim()||null,
    since:document.getElementById('sfSince').value.trim()||null,
    certification:document.getElementById('sfCert').value.trim()||null,
    shipping:document.getElementById('sfShip').value.trim()||null,
    min_order:document.getElementById('sfMinOrder').value.trim()||null,
    herbs:document.getElementById('sfHerbs').value.split(',').map(s=>s.trim()).filter(Boolean),
    active:document.getElementById('sfActive').checked,
  };
  if(!row.name){admToast('Nome é obrigatório');return;}
  let error;
  if(id){({error}=await sb.from('admin_suppliers').update(row).eq('id',id));}
  else{row.created_by=admUser.id;({error}=await sb.from('admin_suppliers').insert(row));}
  if(error){admToast('Erro: '+error.message);return;}
  closeSupplierForm();admToast(id?'Fornecedor atualizado':'Fornecedor criado');loadSuppliers();loadDashboard();
}
async function deleteSupplier(id,name){
  if(!confirm(`Excluir "${name}"?`))return;
  await sb.from('admin_suppliers').delete().eq('id',id);
  admToast('Fornecedor excluído');loadSuppliers();loadDashboard();
}

// ── UTILS ──
function esc(s){
  if(s==null)return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── START ──
document.addEventListener('DOMContentLoaded',()=>{
  sb=window.supabase.createClient(ADM_SUPABASE_URL,ADM_SUPABASE_KEY);
  admInit();
});
