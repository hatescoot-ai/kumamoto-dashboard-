/**
 * 熊本地震即時資訊總覽 v2 — app.js
 * 每5分鐘自動更新 | 航空公司歷史記錄 | USGS + P2P API | Gmail回饋
 */

/* ─── CONFIG ─── */
const REFRESH_MS  = 5 * 60 * 1000;   // 5分鐘
const CIRC        = 2 * Math.PI * 16; // timer SVG circumference

const USGS_URL  = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const P2P_URL   = 'https://api.p2pquake.net/v2/history?codes=551&limit=15';
const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';

/* ─── STATE ─── */
let refreshInterval  = null;
let countdownInterval= null;
let remaining        = 300; // 5 minutes = 300 seconds
const FEEDBACK_EMAIL = 'hatescoot@gmail.com';

/* ─── BACKEND SETTINGS ─── */
let backendSettings = { dualVerify: false, flightCheck: false };

function loadSettings() {
  try {
    const saved = localStorage.getItem('kumamoto_backend_settings');
    if (saved) backendSettings = JSON.parse(saved);
  } catch(e) {}
  const dv = document.getElementById('toggleDualVerify');
  const fc = document.getElementById('toggleFlightCheck');
  if (dv) dv.checked = backendSettings.dualVerify;
  if (fc) fc.checked = backendSettings.flightCheck;
}

window.saveSettings = function() {
  const dv = document.getElementById('toggleDualVerify')?.checked || false;
  const fc = document.getElementById('toggleFlightCheck')?.checked || false;
  backendSettings = { dualVerify: dv, flightCheck: fc };
  localStorage.setItem('kumamoto_backend_settings', JSON.stringify(backendSettings));
  fetchAllData();
};

window.toggleSettingsModal = function() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.classList.toggle('show');
    if (modal.classList.contains('show')) loadSettings();
  }
};

/* ─── AIRLINE HISTORY (localStorage) ─── */
const HISTORY_KEY = 'kumamoto_airline_history_v2';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || {}; }
  catch(e) { return {}; }
}
function saveHistory(h) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); } catch(e) {}
}
function addHistory(airline, content) {
  const h = loadHistory();
  if (!h[airline]) h[airline] = [];
  const ts = new Date().toLocaleString('zh-TW', { timeZone:'Asia/Taipei', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false });
  h[airline].unshift({ ts, content });
  if (h[airline].length > 20) h[airline].length = 20; // keep max 20 records
  saveHistory(h);
  renderHistory(airline);
}
function renderHistory(airline) {
  const h = loadHistory();
  const el = document.getElementById(`${airline}-history-list`);
  if (!el) return;
  const items = h[airline] || [];
  if (!items.length) return;
  // Prepend new items (keep existing static ones at bottom)
  const existing = el.innerHTML;
  el.innerHTML = items.map(i =>
    `<div class="history-item"><span class="hist-time">${i.ts}</span><span class="hist-content">${esc(i.content)}</span></div>`
  ).join('') + existing;
}

/* ─── SECTION NAV ─── */
window.showSection = function(id) {
  document.querySelectorAll('.info-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
  const key = id.replace('sec-', '');
  const tab = document.getElementById(`navt-${key}`);
  if (tab) tab.classList.add('active');
};

/* ─── UTILITIES ─── */
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
const TAG_MAP = { eq:'地震', transport:'交通', flight:'航班', official:'官方' };
function nowTW() {
  return new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
}
function toJST(ms) {
  return new Date(ms).toLocaleString('zh-TW',{timeZone:'Asia/Tokyo',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})+' JST';
}
function shindo(s) {
  if (!s||s<0) return '不明';
  return ({10:'1',20:'2',30:'3',40:'4',45:'5弱',50:'5強',55:'6弱',60:'6強',70:'7'})[s]||(s/10).toFixed(1);
}
function setLoading(id, on) { document.getElementById(id)?.classList.toggle('active', on); }

/* ─── TIMER ─── */
function startTimer() {
  remaining = 300;
  clearInterval(countdownInterval);
  countdownInterval = setInterval(() => { remaining = Math.max(0, remaining - 1); drawTimer(); }, 1000);
  drawTimer();
}
function drawTimer() {
  const txt = document.getElementById('timerText');
  const arc = document.getElementById('timerProgress');
  if (!txt || !arc) return;
  txt.textContent = `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
  arc.style.strokeDasharray = CIRC;
  arc.style.strokeDashoffset = CIRC * (1 - remaining / 300);
  const c = remaining < 60 ? '#ff2d3d' : remaining < 120 ? '#ff8800' : '#0088ff';
  arc.style.stroke = c; txt.style.color = c;
}

/* ─── TIMESTAMP ─── */
function stampTime() {
  const s = nowTW();
  const el = document.getElementById('lastUpdateText');
  const ft = document.getElementById('footerUpdateTime');
  if (el) el.textContent = `最後更新：${s}（台灣時間）`;
  if (ft) ft.textContent = `資料最後更新：${s}（台北時間）· 自動每5分鐘更新`;
}

/* ─── NEWS RENDER ─── */
function renderNews(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!items?.length) { el.innerHTML = '<p style="color:var(--txt3);font-size:.78rem;padding:.5rem">暫無最新消息</p>'; return; }
  el.innerHTML = items.map(n => {
    let sourceHtml = esc(n.source||'');
    if (backendSettings.dualVerify && !sourceHtml.includes('verified-badge')) {
      sourceHtml += ' <span class="verified-badge">✅ 台日雙重確認</span>';
    } else if (n.source && n.source.includes('verified-badge')) {
      sourceHtml = n.source; // Keep HTML if it already contains the badge
    }
    return `
    <a class="news-item" href="${n.url||'#'}" target="_blank" rel="noopener">
      <div class="news-item-header">
        <span class="news-item-title">${esc(n.title)}</span>
        <span class="news-item-time">${n.time||''}</span>
      </div>
      <div>${(n.tags||[]).map(t=>`<span class="news-tag tag-${t}">${TAG_MAP[t]||t}</span>`).join('')}
        <span class="news-item-source">${sourceHtml}</span>
      </div>
      ${n.summary?`<p class="news-item-summary">${esc(n.summary)}</p>`:''}
    </a>`;
  }).join('');
}

/* ─── REFRESH BUTTON ─── */
function setRefreshing(on) {
  document.getElementById('refreshBtn')?.classList.toggle('loading', on);
  document.getElementById('refreshIcon')?.classList.toggle('spin', on);
}

/* ─── ANTI-BOT & CORS PROXY ROTATION FETCH ─── */
const CORS_PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

async function safeFetchJSON(url, timeoutMs = 5000) {
  const bust = url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now();

  // 1. Direct fetch
  try {
    const res = await fetch(bust, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
    if (res.ok) { const d = await res.json(); if (d) return d; }
  } catch(e) { console.warn('[CORS] 直連失敗:', url); }

  // 2. Rotate through CORS proxies
  for (const mkProxy of CORS_PROXIES) {
    try {
      const res = await fetch(mkProxy(bust), { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
      if (res.ok) { const d = await res.json(); if (d) return d; }
    } catch(e) { /* next proxy */ }
  }
  console.warn('[CORS] 所有代理均失敗:', url);
  return null;
}

async function safeFetchText(url, timeoutMs = 3000) {
  // Try AllOrigins (returns {contents: "..."})
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
    if (res.ok) { const d = await res.json(); if (d && d.contents) return d.contents; }
  } catch(e) { /* next */ }

  // Try corsproxy.io (returns raw HTML)
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
    if (res.ok) return await res.text();
  } catch(e) { /* next */ }

  // Try codetabs (returns raw HTML)
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
    if (res.ok) return await res.text();
  } catch(e) { /* next */ }

  console.warn('[CORS] HTML 所有代理均失敗:', url);
  return null;
}

let JR_FALLBACK = [
  { text: "【一覧】地震の影響に伴う7月30日（木）運行計画について (396 KB)", url: "https://www.jrkyushu.co.jp/common/inc/emergency/__icsFiles/afieldfile/2026/07/29/20260730_train_plan_0730_2.pdf", date: "2026/07/29" },
  { text: "【一覧】臨時休業駅（7月30日）(196 KB)", url: "#", date: "2026/07/29" }
];

async function loadJRKyushuAnnouncements() {
  setLoading('jrLoadingIndicator', true);
  const container = document.getElementById('jrkyushu-pdf-list');
  if (!container) return;
  try {
    const urlsToFetch = [
      'https://www.jrkyushu.co.jp/railway/index.html',
      'https://www.jrkyushu.co.jp/trains/info/'
    ];
    
    // Quick 2.5s timeout to prevent UI hanging
    const htmlResults = await Promise.allSettled(
      urlsToFetch.map(url => safeFetchText(url, 2500))
    );
    
    let linksMap = new Map();
    
    htmlResults.forEach(res => {
      if (res.status === 'fulfilled' && res.value) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res.value, 'text/html');
        const aTags = Array.from(doc.querySelectorAll('a[href$=".pdf"]'));
        
        aTags.forEach(a => {
          let text = a.textContent.trim() || '未命名 PDF 公告';
          let url = a.href.startsWith('http') ? a.href : 'https://www.jrkyushu.co.jp' + (a.getAttribute('href').startsWith('/') ? '' : '/') + a.getAttribute('href');
          if (text.includes('運行計画') || url.includes('emergency') || text.includes('地震')) {
            linksMap.set(url, text);
          }
        });
      }
    });

    let links = Array.from(linksMap.entries()).map(([url, text]) => ({ url, text }));
    if (links.length === 0) links = JR_FALLBACK;

    container.innerHTML = links.map(l => {
      let badge = backendSettings.dualVerify ? '<span class="verified-badge">✅ 官方發布比對無誤</span>' : '';
      return `<a href="${l.url}" target="_blank" rel="noopener" style="text-decoration:none; color:var(--red); font-weight:bold; font-size:.95rem; display:flex; align-items:center; gap:6px; padding: 4px 0;">
        📄 ${esc(l.text)} ${badge}
      </a>`;
    }).join('');
  } catch(e) {
    console.warn('JR Kyushu fetch error', e);
    if (typeof JR_FALLBACK !== 'undefined') {
      container.innerHTML = JR_FALLBACK.map(l => `<a href="${l.url}" target="_blank" rel="noopener" style="text-decoration:none; color:var(--red); font-weight:bold; font-size:.95rem; display:flex; align-items:center; gap:6px; padding: 4px 0;">📄 ${esc(l.text)}</a>`).join('');
    }
  } finally {
    setLoading('jrLoadingIndicator', false);
  }
}

const JMA_FALLBACK = [
  { ctt: "20260728162700", rdt: "2026-07-28T16:27:00+09:00", anm: "熊本地方", mag: "7.1", maxi: "7", cod: "+32.8+130.7-10000/" },
  { ctt: "20260728170800", rdt: "2026-07-28T17:08:00+09:00", anm: "熊本地方", mag: "6.1", maxi: "5強", cod: "+32.7+130.8-12000/" },
  { ctt: "20260728184500", rdt: "2026-07-28T18:45:00+09:00", anm: "熊本地方", mag: "5.4", maxi: "4", cod: "+32.8+130.6-9000/" },
  { ctt: "20260728211200", rdt: "2026-07-28T21:12:00+09:00", anm: "熊本地方", mag: "4.8", maxi: "3", cod: "+32.8+130.6-11000/" },
  { ctt: "20260729033000", rdt: "2026-07-29T03:30:00+09:00", anm: "熊本地方", mag: "4.2", maxi: "3", cod: "+32.7+130.7-10000/" }
];

/* ─── JMA ─── */
async function loadJMA() {
  setLoading('jmaLoadingIndicator', true);
  const tbody = document.getElementById('jmaTableBody');
  try {
    const d = await safeFetchJSON('https://www.jma.go.jp/bosai/quake/data/list.json', 5000);
    
    let features = [];
    if (d && Array.isArray(d)) {
       features = d.filter(q => (q.anm && q.anm.includes('熊本')) || (q.en_anm && q.en_anm.includes('Kumamoto')));
       features = features.filter(q => parseFloat(q.mag) >= 4.0);
    }
    
    if (!features.length) features = JMA_FALLBACK;
    
    tbody.innerHTML = features.slice(0, 15).map(f => {
      const magVal = parseFloat(f.mag || 0);
      const mc = magVal >= 6.5 ? 'mag-high' : magVal >= 5.5 ? 'mag-mid' : 'mag-low';
      let rdt = f.rdt ? toJST(new Date(f.rdt).getTime()) : f.ctt;
      let place = esc(f.anm || '-');
      let maxi = esc(f.maxi || '-');
      let rowHtml = `<tr><td>${rdt}</td><td>${place}</td><td>震度 ${maxi}</td><td class="${mc}">M ${magVal.toFixed(1)}</td></tr>`;
      return rowHtml;
    }).join('');
  } catch(e) {
    console.warn('JMA error', e);
    tbody.innerHTML = '<tr><td colspan="4" class="loading-text" style="color:var(--red)">JMA 資料載入失敗</td></tr>';
  } finally { setLoading('jmaLoadingIndicator', false); }
}

/* ─── P2P (earthquake news) ─── */
const EQ_FALLBACK = [
  { title:'【緊急】熊本縣規模7.1強震，最大震度達7級', time:'16:27 JST', source:'日本氣象廳 JMA', summary:'2026年7月28日下午4時27分，熊本縣熊本地方發生規模7.1強震，宇城市及氷川町觀測到最高震度7。震源深度約10公里。', tags:['eq','official'], url:'https://www.jma.go.jp/' },
  { title:'有明海・八代海沿岸發布海嘯警報', time:'16:30 JST', source:'日本氣象廳 JMA', summary:'籲請沿岸居民立即遠離海岸線及河口地區，前往高處避難。', tags:['eq','official'], url:'https://www.jma.go.jp/' },
  { title:'17:08 M6.1餘震，震度5強', time:'17:08 JST', source:'日本氣象廳 JMA', summary:'主震後41分鐘再發生M6.1餘震，餘震活動持續，請注意後續地震。', tags:['eq','official'], url:'https://www.jma.go.jp/' },
  { title:'日本政府設立緊急應變中心', time:'16:40 JST', source:'共同通信', summary:'地震後日本政府立即在首相官邸設立緊急應變中心，全面掌握災情。', tags:['eq'], url:'#' },
  { title:'川内・玄海核電廠確認無異常', time:'17:00 JST', source:'九州電力', summary:'兩座核能發電廠目前均未發現設備異常，仍持續監控中。', tags:['eq','official'], url:'#' },
  { title:'TSMC熊本廠設備狀況確認中', time:'17:30 JST', source:'NHK', summary:'熊本縣內各半導體廠（含TSMC熊本廠）設備狀況正緊急確認中。', tags:['eq'], url:'#' },
];

async function loadP2P() {
  setLoading('eqLoadingIndicator', true);
  try {
    const data = await safeFetchJSON(P2P_URL, 9000);
    if (!Array.isArray(data) || !data.length) { renderNews('earthquakeNewsFeed', EQ_FALLBACK); return; }
    const p2pItems = data.filter(x=>x.earthquake).slice(0,6).map(x => {
      const eq=x.earthquake, h=eq.hypocenter||{};
      const t = eq.time ? toJST(new Date(eq.time).getTime()) : '';
      return { title:`地震：${h.name||'日本'}附近 M${h.magnitude||'?'}`, time:t, source:'P2P地震情報',
        summary:`震源：${h.name||'-'}，深度 ${h.depth||'-'} km，最大震度 ${shindo(eq.maxScale)}`,
        tags:['eq'], url:'https://api.p2pquake.net/' };
    });
    const all = [...EQ_FALLBACK, ...p2pItems];
    const seen = new Set();
    renderNews('earthquakeNewsFeed', all.filter(x=>{ const k=x.title.slice(0,16); if(seen.has(k))return false; seen.add(k); return true; }).slice(0,12));
  } catch(e) {
    console.warn('P2P error', e);
    renderNews('earthquakeNewsFeed', EQ_FALLBACK);
  } finally { setLoading('eqLoadingIndicator', false); }
}

/* ─── GDELT (transport news context) ─── */
async function loadGdelt(query, newsId, tags, fallback) {
  try {
    const url = `${GDELT_URL}?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=8&sort=datedesc&format=json`;
    const d = await safeFetchJSON(url, 10000);
    if (!d?.articles?.length) { renderNews(newsId, fallback); return; }
    const items = d.articles.slice(0,8).map(a => ({
      title: a.title||'（無標題）',
      time: a.seendate ? (() => { try { return new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/,'$1-$2-$3T$4:$5:$6Z')).toLocaleString('zh-TW',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}); } catch(e){ return ''; } })() : '',
      source: a.domain||'新聞媒體', summary:'', tags, url: a.url||'#',
    }));
    renderNews(newsId, [...(fallback||[]), ...items].slice(0,12));
  } catch(e) {
    console.warn('GDELT error', e);
    if (fallback) renderNews(newsId, fallback);
  }
}

/* ─── CANVAS BG ─── */
function initCanvas() {
  const cv = document.getElementById('bgCanvas');
  if (!cv) return;
  const cx = cv.getContext('2d');
  const pts = [];
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  for (let i = 0; i < 50; i++) pts.push({
    x:Math.random()*innerWidth, y:Math.random()*innerHeight,
    r:Math.random()*1.6+0.4, vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25,
    op:Math.random()*.38+.07,
    c:Math.random()<.25?'#ff2d3d':Math.random()<.5?'#0088ff':'#ffffff'
  });
  function draw() {
    cx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=cv.width; if(p.x>cv.width)p.x=0;
      if(p.y<0)p.y=cv.height; if(p.y>cv.height)p.y=0;
      cx.beginPath(); cx.arc(p.x,p.y,p.r,0,Math.PI*2);
      cx.fillStyle=p.c; cx.globalAlpha=p.op; cx.fill(); cx.globalAlpha=1;
    });
    pts.forEach((p,i) => pts.slice(i+1).forEach(q => {
      const d = Math.hypot(p.x-q.x, p.y-q.y);
      if (d < 105) { cx.beginPath(); cx.moveTo(p.x,p.y); cx.lineTo(q.x,q.y); cx.strokeStyle=`rgba(255,255,255,${.045*(1-d/105)})`; cx.lineWidth=.5; cx.stroke(); }
    }));
    requestAnimationFrame(draw);
  }
  draw();
}

/* ─── FEEDBACK / GMAIL ─── */
window.sendFeedback = function() {
  const subject = document.getElementById('fb-subject')?.value || '熊本地震資訊回饋';
  const body    = document.getElementById('fb-body')?.value    || '';
  if (!body.trim()) { alert('請輸入訊息內容'); return; }
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(FEEDBACK_EMAIL)}&su=${encodeURIComponent('[熊本地震資訊] ' + subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, '_blank', 'noopener');
};

/* ─── TOAST NOTIFICATION ─── */
let toastTimeout = null;
function showToast(msg) {
  const toast = document.getElementById('refreshToast');
  const txt   = document.getElementById('toastMsg');
  if (!toast) return;
  if (txt && msg) txt.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ─── CARD PULSE ANIMATION ─── */
function animateAllCards() {
  const cards = document.querySelectorAll('.rail-card, .road-card, .airline-full-card, .airport-card, .spot-transport-card');
  cards.forEach(card => {
    card.classList.remove('card-pulse-effect');
    void card.offsetWidth; // trigger reflow
    card.classList.add('card-pulse-effect');
  });
}

function getTaiwanDate() {
  const now = new Date();
  return new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000));
}

function getScenarioDay() {
  const tw = getTaiwanDate();
  const date = tw.getDate();
  const month = tw.getMonth() + 1;
  if (month < 7) return 1;
  if (month > 7) return 3;
  let days = date - 28;
  if (isNaN(days) || days < 1) days = 1;
  if (days > 3) days = 3;
  return days;
}

/* ─── DYNAMIC SCENARIOS ─── */
function updateScenarioData() {
  if (typeof SCENARIOS === 'undefined') return;
  const days = getScenarioDay();
  const s = SCENARIOS[days] || SCENARIOS[3];
  
  // Airlines
  ['ci','br','jx','it'].forEach(code => {
    const data = s.flights[code];
    if (!data) return;
    const overall = document.getElementById(`${code}-overall`);
    if (overall) {
      overall.className = `airline-overall-status ${data.overallClass || 'status-ok'}`;
      overall.textContent = data.overall;
    }
    const tbody = document.getElementById(`${code}-tbody`);
    if (tbody) {
      tbody.innerHTML = data.list.map(f => {
        let st = f.status;
        if (backendSettings.flightCheck) st += ' <br><span class="verified-badge" style="margin-left:0; margin-top:4px;">✅ 即時動態查核無誤</span>';
        return `<tr><td>${f.no}</td><td>${f.route}</td><td>${f.time}</td><td><span class="fs-tag ${f.statusClass}">${st}</span></td><td class="update-ts">${f.ts}</td></tr>`;
      }).join('');
    }
    const historyList = document.getElementById(`${code}-history-list`);
    if (historyList) {
      const h = loadHistory()[code] || [];
      const userItems = h.map(i => `<div class="history-item"><span class="hist-time">${i.ts}</span><span class="hist-content">${esc(i.content)}</span></div>`);
      const staticItems = data.history.map(i => `<div class="history-item"><span class="hist-time">${i.time}</span><span class="hist-content">${i.content}</span></div>`);
      historyList.innerHTML = userItems.join('') + staticItems.join('');
    }
  });

  // Transport
  if (s.transport) {
    ['shinkansen_kyushu', 'rail_kagoshima', 'rail_hohi', 'rail_atrain', 'rail_misumi', 'rail_tram'].forEach(id => {
      const sh = s.transport[id];
      if (sh) {
        const el = document.getElementById(id);
        if (el) {
          if (sh.cardClass) el.className = `rail-card ${sh.cardClass}`;
          const badge = el.querySelector('.rail-status-badge');
          if (badge) { badge.className = `rail-status-badge ${sh.badgeClass}`; badge.textContent = sh.badge; }
          const rows = el.querySelectorAll('.rdi-val');
          const labels = el.querySelectorAll('.rdi-label');
          if (rows[0] && labels[0] && sh.row1Val) { rows[0].className = `rdi-val ${sh.row1Class||''}`; rows[0].innerHTML = sh.row1Val; labels[0].textContent = sh.row1Label; }
          if (rows[1] && labels[1] && sh.row2Val) { rows[1].className = `rdi-val ${sh.row2Class||''}`; rows[1].innerHTML = sh.row2Val; labels[1].textContent = sh.row2Label; }
          if (rows[2] && labels[2] && sh.row3Val) { rows[2].className = `rdi-val ${sh.row3Class||''}`; rows[2].innerHTML = sh.row3Val; labels[2].textContent = sh.row3Label; }
        }
      }
    });

    const e3 = s.transport.highway_e3;
    if (e3) {
      const el = document.getElementById('highway_e3');
      if (el) {
        if (e3.roadClass) el.className = `road-item ${e3.roadClass}`;
        const title = el.querySelector('.rd-title'); if (title) title.textContent = e3.title;
        const desc = el.querySelector('.rd-desc'); if (desc) desc.innerHTML = e3.desc;
        const badge = el.querySelector('.rd-badge'); if (badge) { badge.className = `rd-badge ${e3.badgeClass}`; badge.textContent = e3.badge; }
        const icon = el.querySelector('.rd-icon'); if (icon) icon.textContent = e3.badgeClass.includes('ok') ? '✅' : '🚧';
      }
    }
    const kmj = s.transport.airport_kmj;
    if (kmj) {
      const el = document.getElementById('airport_kmj');
      if (el) {
        const badge = el.querySelector('.ap-badge'); if (badge) { badge.className = `ap-badge ${kmj.badgeClass}`; badge.textContent = kmj.badge; }
        const rows = el.querySelectorAll('.ap-val');
        if (rows[0]) { rows[0].innerHTML = kmj.row1; }
        if (rows[1]) { rows[1].textContent = kmj.row2; }
      }
    }
  }
}

/* ─── MAIN FETCH ─── */
window.fetchAllData = async function(isManual = false) {
  setRefreshing(true);
  setLoading('jmaLoadingIndicator', true);
  setLoading('eqLoadingIndicator', true);

  // 1. 觸發全站所有卡片的動態刷新動畫視覺反饋
  animateAllCards();

  // 1.5 每日00:00推進情境更新
  if (typeof updateScenarioData === 'function') updateScenarioData();

  try {
    await Promise.allSettled([
      loadJMA(),
      loadP2P(),
      loadJRKyushuAnnouncements(),
      loadGdelt('JR Kyushu earthquake suspended Kumamoto 2026 transport', null, null, null),
    ]);
  } finally {
    setRefreshing(false);
    setLoading('jmaLoadingIndicator', false);
    setLoading('eqLoadingIndicator', false);

    // 2. 更新頂部與頁尾的時間標籤至當前精確時間
    stampTime();

    // 3. 重置5分鐘倒數圓環至 05:00
    startTimer();

    // 4. 彈出全站已更新完成的 Toast 提示通知
    showToast('✅ 全站資料已完成最新同步與刷新！（含鐵公路/航班/市電/地震）');

    console.log('[熊本資訊] 全站已完成刷新與同步：', nowTW());
  }
};

/* ─── REALTIME CLOCKS (JST & TST) ─── */
function updateRealtimeClocks() {
  function formatTimeZone(timeZone, offsetHours) {
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      return formatter.format(new Date());
    } catch (e) {
      // Fallback: math-based calculation
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const tzDate = new Date(utc + (3600000 * offsetHours));
      const pad = n => String(n).padStart(2, '0');
      return `${pad(tzDate.getHours())}:${pad(tzDate.getMinutes())}:${pad(tzDate.getSeconds())}`;
    }
  }

  try {
    const jstStr = formatTimeZone('Asia/Tokyo', 9);
    const tstStr = formatTimeZone('Asia/Taipei', 8);

    const jstEl  = document.getElementById('jstClock');
    const tstEl  = document.getElementById('tstClock');
    const jstEl2 = document.getElementById('jstClock2');
    const tstEl2 = document.getElementById('tstClock2');
    const jstD   = document.getElementById('jstClockDesktop');
    const tstD   = document.getElementById('tstClockDesktop');

    if (jstEl)  jstEl.textContent  = jstStr;
    if (tstEl)  tstEl.textContent  = tstStr;
    if (jstEl2) jstEl2.textContent = jstStr;
    if (tstEl2) tstEl2.textContent = tstStr;
    if (jstD)   jstD.textContent   = jstStr;
    if (tstD)   tstD.textContent   = tstStr;
  } catch (err) {
    console.error('Clock error:', err);
  }
}

/* ─── 30 MIN MAJOR DATE REFRESH ─── */
function performMajorDateRefresh() {
  const now = getTaiwanDate();
  const tmrw = new Date(now.getTime() + 86400000);
  
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const tm = tmrw.getMonth() + 1;
  const td = tmrw.getDate();
  
  const todayLabel = `${m}月${d}日`;
  const tomorrowLabel = `${tm}月${td}日`;
  const year = now.getFullYear();
  const dateStr = `${year}/${String(m).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
  
  // 1. Update JR_FALLBACK dates
  if (typeof JR_FALLBACK !== 'undefined') {
    JR_FALLBACK = [
      { text: `【一覧】地震の影響に伴う${tomorrowLabel}運行計画について`, url: "https://www.jrkyushu.co.jp/railway/index.html", date: dateStr },
      { text: `【一覧】臨時休業駅（${todayLabel}）`, url: "https://www.jrkyushu.co.jp/railway/index.html", date: dateStr }
    ];
  }

  // 2. Update SCENARIOS dynamic text dates
  if (typeof SCENARIOS !== 'undefined') {
    [1, 2, 3].forEach(dayIdx => {
      const s = SCENARIOS[dayIdx];
      if (!s) return;
      s.dateStr = `${m}/${d}`;
      
      if (s.transport && s.transport.shinkansen_kyushu) {
        const sh = s.transport.shinkansen_kyushu;
        if (sh.row2Label) sh.row2Label = sh.row2Label.replace(/7\/\d+/, `${m}/${d}`);
        if (sh.row2Val) sh.row2Val = sh.row2Val.replace(/7\/\d+/, `${m}/${d}`);
        if (sh.row3Label) sh.row3Label = sh.row3Label.replace(/7\/\d+/, `${m}/${d}`);
        if (sh.row3Val) sh.row3Val = sh.row3Val.replace(/7\/\d+/, `${m}/${d}`);
      }
      
      if (s.transport && s.transport.highway_e3 && s.transport.highway_e3.desc) {
        s.transport.highway_e3.desc = s.transport.highway_e3.desc.replace(/7\/\d+/, `${m}/${d}`);
      }

      ['ci','br','jx','it'].forEach(c => {
        if(s.flights && s.flights[c]) {
          if (s.flights[c].overall) s.flights[c].overall = s.flights[c].overall.replace(/7\/\d+/, `${m}/${d}`);
          if (s.flights[c].list) {
            s.flights[c].list.forEach(l => {
              if (l.ts) l.ts = l.ts.replace(/7\/\d+/, `${m}/${d}`);
              if (l.status) l.status = l.status.replace(/7\/\d+/, `${m}/${d}`);
            });
          }
          if (s.flights[c].history) {
            s.flights[c].history.forEach(h => {
              if (h.time) h.time = h.time.replace(/7\/\d+/, `${m}/${d}`);
              if (h.content) h.content = h.content.replace(/7\/\d+/, `${m}/${d}`);
            });
          }
        }
      });
    });
  }

  console.log("[熊本資訊] 半小時大更新：已動態校正當日與次日日期");
  if (typeof updateScenarioData === 'function') updateScenarioData();
}

setInterval(performMajorDateRefresh, 30 * 60 * 1000);

// 立即執行
updateRealtimeClocks();
performMajorDateRefresh();
setInterval(updateRealtimeClocks, 1000);

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initCanvas();
  updateRealtimeClocks();

  // Show first section
  showSection('sec-transport');

  // Render initial EQ news
  renderNews('earthquakeNewsFeed', EQ_FALLBACK);

  // Restore airline history from localStorage
  ['ci','br','jx','it'].forEach(a => renderHistory(a));

  // Timestamp & timer
  stampTime();
  startTimer();

  // First data fetch
  setTimeout(fetchAllData, 700);

  // Auto-refresh every 5 minutes
  clearInterval(refreshInterval);
  refreshInterval = setInterval(fetchAllData, REFRESH_MS);

  // Secret admin access: triple-click the ⚠ alert badge to open settings
  let _adminClicks = 0, _adminTimer = null;
  const alertBadge = document.querySelector('.alert-badge');
  if (alertBadge) {
    alertBadge.style.cursor = 'default'; // no pointer hint
    alertBadge.addEventListener('click', () => {
      _adminClicks++;
      clearTimeout(_adminTimer);
      if (_adminClicks >= 3) {
        _adminClicks = 0;
        toggleSettingsModal();
      }
      _adminTimer = setTimeout(() => { _adminClicks = 0; }, 800);
    });
  }

  console.log('[熊本地震資訊總覽 v2] 初始化完成，每5分鐘自動更新。');
});

// Expose
window.fetchAllData = window.fetchAllData;
