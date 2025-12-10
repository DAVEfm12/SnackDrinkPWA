/* app.js - Reservaciones dinámicas + ticket + productos */
let productos = [];
let carrito = [];
let favoritos = [];
let db;

const WA_NUMBER = '527443861188'; // +52 744 386 1188 (wa.me/...) 

document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  await loadData();
  renderProducts();
  renderServices();
  initVideos();
  hookupFormLogic();
  loadLocalState();
});

async function initDB(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open('snackdrink-db',1);
    r.onupgradeneeded = e => {
      const d=e.target.result;
      if(!d.objectStoreNames.contains('reservas')) d.createObjectStore('reservas',{keyPath:'id',autoIncrement:true});
    };
    r.onsuccess = ()=>{db=r.result;res()};
    r.onerror = ()=>rej();
  });
}
async function saveReserva(obj){
  return new Promise((res,rej)=>{
    const tx=db.transaction('reservas','readwrite');
    tx.objectStore('reservas').add(obj);
    tx.oncomplete=()=>res();
    tx.onerror=()=>rej();
  });
}

async function loadData(){
  try {
    const r = await fetch('data.json');
    productos = await r.json();
  } catch(e){
    productos = [];
    console.error(e);
  }
}

function renderProducts(){
  const cont=document.getElementById('productos');
  cont.innerHTML='';
  productos.filter(p => p.precio !== 0).forEach(p=>{
    const card=document.createElement('article');
    card.className='card';
    card.innerHTML = `
      <img src="images/${p.img}" onerror="this.src='images/sd_logo.png'" class="card-img">
      <div style="padding:10px">
        <h3 class="card-title">${p.nombre}</h3>
        <p class="card-price">${p.precio ? '$' + p.precio : 'Servicio'}</p>
      </div>`;
    cont.appendChild(card);
  });
}

function renderServices(){
  const cont=document.getElementById('servicios');
  cont.innerHTML='';
  productos.filter(p => p.precio === 0).forEach(s=>{
    const el=document.createElement('div');
    el.className='card-service';
    el.innerHTML = `
      <img src="images/${s.img}" onerror="this.src='images/sd_logo.png'" class="service-img">
      <p class="service-name">${s.nombre}</p>
    `;
    cont.appendChild(el);
  });
}

function initVideos(){
  const videos = [
    'https://www.youtube.com/embed/CUSf93LLO38',
    'https://www.youtube.com/embed/CUSf93LLO38'
  ];
  const wrap=document.getElementById('videos');
  videos.forEach(v=>{
    const card=document.createElement('div');
    card.className='video-card';
    card.innerHTML = `<iframe src="${v}" class="w-full h-48 rounded" allowfullscreen></iframe>`;
    wrap.appendChild(card);
  });
}

/* ====== FORM DYNAMICS ====== */
const bebidasPorPublico = {
  'Infantil': ['Jugos Naturales','Refrescos','Malteadas'],
  'Juvenil': ['Mojito Tradicional','Piña Colada','Azulito Original'],
  'Adultos': ['Cóctel Especial','Vino Tinto','Cerveza Artesanal']
};

const snacksPorPublico = {
  'Infantil': ['Mini Sándwiches','Dulces','Palomitas'],
  'Juvenil': ['Nachos','Alitas','Bowles'],
  'Adultos': ['Tabla de Quesos','Tapas Gourmet','Aceitunas']
};

function hookupFormLogic(){
  const tipoPublico = document.getElementById('tipoPublico');
  const tipoBebida = document.getElementById('tipoBebida');
  const tipoSnack = document.getElementById('tipoSnack');
  const btnCalc = document.getElementById('btnCalculate');
  const resForm = document.getElementById('resForm');
  const btnDownload = document.getElementById('btnDownloadTicket');
  const btnShareWA = document.getElementById('btnShareWA');

  tipoPublico.addEventListener('change', () => {
    const val = tipoPublico.value;
    fillSelect(tipoBebida, bebidasPorPublico[val] || []);
    fillSelect(tipoSnack, snacksPorPublico[val] || []);
  });

  btnCalc.addEventListener('click', (e)=>{
    e.preventDefault();
    const payload = collectForm();
    if (!payload) return;
    payload.total = estimatePrice(payload);
    showTicket(payload);
  });

  resForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = collectForm();
    if (!payload) return;
    payload.total = estimatePrice(payload);
    payload.createdAt = new Date().toISOString();
    await saveReserva(payload);
    mostrarToast('Reserva registrada ✅');
    // auto generate ticket preview
    showTicket(payload);
  });

  btnDownload.addEventListener('click', ()=> {
    const el = document.getElementById('ticketCard');
    generatePNG(el).then(url => {
      const a=document.createElement('a'); a.href=url; a.download = `ticket_snackdrink_${Date.now()}.png`; a.click();
    });
  });

  btnShareWA.addEventListener('click', ()=> {
    const payload = currentTicket;
    if(!payload) { mostrarToast('Genera el ticket primero'); return; }
    const text = ticketText(payload);
    const url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
    window.open(url,'_blank');
  });

  // clear
  document.getElementById('btnClear').addEventListener('click', ()=> {
    resForm.reset(); document.getElementById('ticketWrap').classList.add('hidden');
  });
}

function fillSelect(selectEl, arr){
  selectEl.innerHTML = '<option value="">Selecciona...</option>';
  arr.forEach(v=>{
    const op=document.createElement('option'); op.value=v; op.textContent=v; selectEl.appendChild(op);
  });
}

function collectForm(){
  const tipoPublico = document.getElementById('tipoPublico').value;
  const tipoFiesta = document.getElementById('tipoFiesta').value;
  const fecha = document.getElementById('fecha').value;
  const hora = document.getElementById('hora').value;
  const personas = parseInt(document.getElementById('personas').value) || 0;
  const tipoBebida = document.getElementById('tipoBebida').value;
  const tipoSnack = document.getElementById('tipoSnack').value;
  const comentarios = document.getElementById('comentarios').value || '';

  if(!tipoPublico || !tipoFiesta || !fecha || !hora || !personas || !tipoBebida || !tipoSnack){
    mostrarToast('Completa todos los campos obligatorios');
    return null;
  }
  return { tipoPublico, tipoFiesta, fecha, hora, personas, tipoBebida, tipoSnack, comentarios };
}

function estimatePrice(payload){
  // simple heuristic: base por persona + extras
  let base = 20; // MXN per person baseline (snack+drink share)
  if(payload.tipoPublico === 'Infantil') base = 18;
  if(payload.tipoPublico === 'Juvenil') base = 28;
  if(payload.tipoPublico === 'Adultos') base = 45;

  // beverage premium
  let bevPremium = 0;
  if(payload.tipoBebida.includes('Mojito') || payload.tipoBebida.includes('Piña')) bevPremium = 12;
  if(payload.tipoBebida.includes('Cóctel') || payload.tipoBebida.includes('Vino')) bevPremium = 25;

  // snack premium
  let snackPremium = 0;
  if(payload.tipoSnack.includes('Alitas') || payload.tipoSnack.includes('Tabla')) snackPremium = 30;

  const perPerson = base + bevPremium/ (payload.personas>0?payload.personas:1) + snackPremium/ (payload.personas>0?payload.personas:1);
  const total = Math.max( (payload.personas * perPerson), 200); // min charge 200
  return Math.round(total);
}

/* ===== Ticket rendering ===== */
let currentTicket = null;
function showTicket(payload){
  const wrap = document.getElementById('ticketWrap');
  const card = document.getElementById('ticketCard');
  currentTicket = payload;
  card.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <img src="images/sd_logo.png" style="width:64px;height:64px;border-radius:8px" />
      <div>
        <h3 style="margin:0">Snack & Drink DAVE's</h3>
        <small>Reserva — ${new Date().toLocaleString()}</small>
      </div>
    </div>
    <hr style="margin:10px 0" />
    <div><strong>Público:</strong> ${payload.tipoPublico}</div>
    <div><strong>Fiesta:</strong> ${payload.tipoFiesta}</div>
    <div><strong>Fecha / Hora:</strong> ${payload.fecha} ${payload.hora}</div>
    <div><strong>Personas:</strong> ${payload.personas}</div>
    <div><strong>Bebida:</strong> ${payload.tipoBebida}</div>
    <div><strong>Snack:</strong> ${payload.tipoSnack}</div>
    <div><strong>Comentarios:</strong> ${payload.comentarios || '—'}</div>
    <hr style="margin:10px 0" />
    <h4 style="margin:0">Total estimado: $ ${payload.total} MXN</h4>
    <small style="color:#444">* Precio estimado, sujeto a confirmación.</small>
  `;
  wrap.classList.remove('hidden');
}

/* generate PNG of an element using canvas (html2canvas-lite approach) */
function generatePNG(el){
  return new Promise((resolve)=>{
    // minimal html->canvas technique: draw text; since full html2canvas isn't allowed offline, we'll create simple canvas snapshot
    const rect = el.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // draw logo
    const img = new Image();
    img.src = 'images/sd_logo.png';
    img.onload = () => {
      ctx.drawImage(img, 16*scale, 16*scale, 64*scale, 64*scale);
      // draw text lines from card innerText
      ctx.fillStyle = '#111';
      ctx.font = `${14*scale}px Arial`;
      const lines = el.innerText.split('\n').map(l=>l.trim()).filter(Boolean);
      let y = (100)*scale;
      for(const line of lines){
        wrapText(ctx, line, 16*scale + 80*scale, y, (rect.width-40)*scale, 18*scale);
        y += 22*scale;
      }
      const url = canvas.toDataURL('image/png');
      resolve(url);
    };
    img.onerror = ()=> {
      // fallback: just export white canvas with text
      ctx.fillStyle = '#111';
      ctx.font = `${14*scale}px Arial`;
      wrapText(ctx, el.innerText, 16*scale, 20*scale, (rect.width-32)*scale, 18*scale);
      resolve(canvas.toDataURL('image/png'));
    };
  });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '';
  for(let n=0;n<words.length;n++){
    const test = line + words[n] + ' ';
    const metrics = ctx.measureText(test);
    if(metrics.width > maxWidth && n>0){
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

/* ticket text for WhatsApp */
function ticketText(payload){
  return `*Snack & Drink DAVE's*%0AReserva:%20${new Date().toLocaleString()}%0A
Público: ${payload.tipoPublico}%0ATipo Fiesta: ${payload.tipoFiesta}%0AFecha: ${payload.fecha} ${payload.hora}%0APersonas: ${payload.personas}%0ABebida: ${payload.tipoBebida}%0ASnack: ${payload.tipoSnack}%0AComentarios: ${payload.comentarios}%0ATotal estimado: $${payload.total} MXN%0A%0AGracias!`;
}

/* small helpers */
function mostrarToast(msg){
  const t=document.getElementById('noti');
  t.textContent=msg; t.classList.add('show'); t.classList.remove('hidden');
  setTimeout(()=>{ t.classList.remove('show'); t.classList.add('hidden'); },2200);
}

/* local state (theme) */
function loadLocalState(){
  const theme = localStorage.getItem('sd-theme');
  if(theme === 'dark') document.body.classList.add('dark');
  document.getElementById('btn-theme').addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    localStorage.setItem('sd-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}
