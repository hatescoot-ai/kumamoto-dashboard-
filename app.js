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
  el.innerHTML = items.map(n => `
    <a class="news-item" href="${n.url||'#'}" target="_blank" rel="noopener">
      <div class="news-item-header">
        <span class="news-item-title">${esc(n.title)}</span>
        <span class="news-item-time">${n.time||''}</span>
      </div>
      <div>${(n.tags||[]).map(t=>`<span class="news-tag tag-${t}">${TAG_MAP[t]||t}</span>`).join('')}
        <span class="news-item-source">${esc(n.source||'')}</span>
      </div>
      ${n.summary?`<p class="news-item-summary">${esc(n.summary)}</p>`:''}
    </a>`).join('');
}

/* ─── REFRESH BUTTON ─── */
function setRefreshing(on) {
  document.getElementById('refreshBtn')?.classList.toggle('loading', on);
  document.getElementById('refreshIcon')?.classList.toggle('spin', on);
}

/* ─── ANTI-BOT & CORS PROXY ROTATION FETCH ─── */
async function safeFetchJSON(url, timeoutMs = 10000) {
  const separator = url.includes('?') ? '&' : '?';
  const targetUrl = `${url}${separator}_t=${Date.now()}`;

  // 1. Direct fetch with cache buster
  try {
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.warn('[防擋爬蟲] 直連 API 被擋或連線超時，自動切換至 CORS/Anti-bot 備用源：', url);
  }

  // 2. Fallback to AllOrigins proxy
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (e) {
    console.warn('[防擋爬蟲] 備用源請求失敗：', e);
  }

  return null;
}

/* ─── USGS ─── */
async function loadUSGS() {
  setLoading('usgsLoadingIndicator', true);
  const tbody = document.getElementById('usgsTableBody');
  try {
    const start = new Date(Date.now() - 7 * 864e5).toISOString();
    const url = `${USGS_URL}?format=geojson&starttime=${start}&minmagnitude=4.5&latitude=32.8&longitude=130.7&maxradiuskm=350&orderby=time&limit=25`;
    const d = await safeFetchJSON(url, 10000);
    if (!d?.features?.length) { tbody.innerHTML='<tr><td colspan="4" class="loading-text">暫無資料</td></tr>'; return; }
    tbody.innerHTML = d.features.map(f => {
      const p = f.properties, m = (p.mag||0).toFixed(1), dep = Math.round(f.geometry.coordinates[2]||0);
      const mc = p.mag >= 6.5 ? 'mag-high' : p.mag >= 5.5 ? 'mag-mid' : 'mag-low';
      return `<tr><td>${toJST(p.time)}</td><td>${esc(p.place||'-')}</td><td class="${mc}">M ${m}</td><td>${dep} km</td></tr>`;
    }).join('');
  } catch(e) {
    console.warn('USGS error', e);
    tbody.innerHTML = '<tr><td colspan="4" class="loading-text" style="color:var(--red)">USGS 資料載入失敗</td></tr>';
  } finally { setLoading('usgsLoadingIndicator', false); }
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

/* ─── MAIN FETCH ─── */
window.fetchAllData = async function() {
  setRefreshing(true);
  setLoading('usgsLoadingIndicator', true);
  setLoading('eqLoadingIndicator', true);
  try {
    await Promise.allSettled([
      loadUSGS(),
      loadP2P(),
      loadGdelt('JR Kyushu earthquake suspended Kumamoto 2026 transport', null, null, null),
    ]);
  } finally {
    setRefreshing(false);
    setLoading('usgsLoadingIndicator', false);
    setLoading('eqLoadingIndicator', false);
    stampTime();
    startTimer();
    console.log('[熊本資訊] 已更新：', nowTW());
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

// 立即執行
updateRealtimeClocks();
setInterval(updateRealtimeClocks, 1000);

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
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

  console.log('[熊本地震資訊總覽 v2] 初始化完成，每5分鐘自動更新。');
});

// Expose
window.fetchAllData = window.fetchAllData;
