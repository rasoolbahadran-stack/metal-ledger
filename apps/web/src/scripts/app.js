/* ============================================================
   فلزنگار — کنترلر پنل نمایشی
   همه عملیات در حافظه مرورگر است؛ هیچ داده‌ای به سرور ارسال نمی‌شود.
   ============================================================ */

import {
  PRODUCTS, CUSTOMERS, TRADES, PAYMENTS, DELIVERIES, PRICES, NOTIFICATIONS,
  productById, customerById, tradeTotal, postedTrades,
  customerFinancialBalance, customerWeightBalances, customerStatement,
} from './demo-data.js';
import { toFaDigits, formatFaNumber, formatMoney, multiplyHalfUp } from './format.js';

const $ = (sel, scope = document) => scope.querySelector(sel);
const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const VIEW_TITLES = {
  dashboard: 'نمای کلی', customers: 'مشتریان', trades: 'معاملات', balances: 'مانده وزنی',
  prices: 'قیمت فلزات', products: 'محصولات', payments: 'پرداخت‌ها', deliveries: 'تحویل کالا',
  statements: 'دفتر حساب', reports: 'گزارش‌ها', settings: 'تنظیمات سامانه',
};
const STATUS_LABELS = { posted: 'قطعی', draft: 'پیش‌نویس', reversed: 'برگشت‌خورده' };
const STATUS_CLASS = { posted: 'success', draft: 'pending', reversed: 'danger' };
const PAY_LABELS = { receive: 'دریافت از مشتری', pay: 'پرداخت به مشتری' };
const AVATARS = ['a', 'b', 'c', 'd', 'e', 'f'];

/* ==================== Toast ==================== */
$('#dismissNotice')?.addEventListener('click', () => {
  $('.demo-notice')?.remove();
});

const toastRegion = $('#toastRegion');
function toast(message, variant = 'default', timeout = 3600) {
  if (!toastRegion) return;
  const node = document.createElement('div');
  node.className = `toast${variant !== 'default' ? ` ${variant}` : ''}`;
  node.setAttribute('role', 'status');
  node.textContent = message;
  toastRegion.append(node);
  window.setTimeout(() => {
    node.classList.add('hide');
    window.setTimeout(() => node.remove(), 260);
  }, timeout);
}
$$('[data-toast]').forEach((el) => el.addEventListener('click', () => toast(el.dataset.toast)));
$$('[data-toast-success]').forEach((el) => el.addEventListener('click', () => toast(el.dataset.toastSuccess, 'success')));

/* ==================== Theme ==================== */
const root = document.documentElement;
function setTheme(theme) {
  root.dataset.theme = theme;
  try { localStorage.setItem('metal-ledger-theme', theme); } catch { /* حافظه در دسترس نیست */ }
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#15161a' : '#f6f4ee');
  $$('.theme-icon-sun, .theme-icon-moon').forEach((el) => {
    el.style.display = el.classList.contains(theme === 'dark' ? 'theme-icon-sun' : 'theme-icon-moon') ? '' : 'none';
  });
}
let initialTheme = 'light';
try {
  initialTheme = localStorage.getItem('metal-ledger-theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
} catch { /* پیش‌فرض روشن */ }
setTheme(initialTheme);
function toggleTheme() { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); }
$('#themeToggle')?.addEventListener('click', toggleTheme);
$('#settingsTheme')?.addEventListener('click', toggleTheme);

/* ==================== ناوبری نماها ==================== */
const sections = $$('[data-section]');
const breadcrumb = $('#breadcrumbCurrent');

function showView(name, { focusHeading = false } = {}) {
  if (!VIEW_TITLES[name]) return;
  sections.forEach((s) => s.classList.toggle('active', s.dataset.section === name));
  $$('.nav-link[data-view]').forEach((l) => l.classList.toggle('active', l.dataset.view === name));
  if (breadcrumb) breadcrumb.textContent = VIEW_TITLES[name];
  document.title = `${VIEW_TITLES[name]} | فلزنگار`;
  const url = new URL(window.location.href);
  url.hash = name;
  history.replaceState(null, '', url);
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  closeSidebar();
  if (focusHeading) {
    const heading = $(`[data-section="${name}"] h1`);
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }
}
$$('.nav-link[data-view]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.view, { focusHeading: true })));
document.addEventListener('click', (e) => {
  const navTrigger = e.target.closest('[data-nav]');
  if (navTrigger) showView(navTrigger.dataset.nav);
});
const initialHash = window.location.hash.replace('#', '');
if (VIEW_TITLES[initialHash]) showView(initialHash);

/* ==================== سایدبار موبایل ==================== */
const sidebar = $('#sidebar');
const scrim = $('#mobileScrim');
function openSidebar() { sidebar?.classList.add('open'); scrim?.classList.add('open'); $('#sidebarClose')?.focus(); }
function closeSidebar() {
  sidebar?.classList.remove('open');
  scrim?.classList.remove('open');
}
$('#menuToggle')?.addEventListener('click', openSidebar);
$('#sidebarClose')?.addEventListener('click', () => { closeSidebar(); $('#menuToggle')?.focus(); });
scrim?.addEventListener('click', closeSidebar);

/* ==================== دراپ‌داون‌ها ==================== */
function bindDropdown(buttonId, panelId) {
  const button = document.getElementById(buttonId);
  const panel = document.getElementById(panelId);
  if (!button || !panel) return;
  const setOpen = (open) => {
    panel.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('button, a')?.focus();
  };
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!panel.classList.contains('open'));
  });
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-keep-open]')) return;
    setOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && e.target !== button && !button.contains(e.target)) setOpen(false);
  });
}
bindDropdown('notificationBtn', 'notificationsPanel');
bindDropdown('userMenuBtn', 'userDropdown');

/* ==================== Command Palette (Ctrl+K) ==================== */
const paletteBackdrop = $('#paletteBackdrop');
const paletteInput = $('#paletteInput');
const paletteResults = $('#paletteResults');
let paletteOpen = false;
let paletteItems = [];
let paletteIndex = 0;
let paletteOpener = null;

function paletteBuild(query) {
  const q = (query || '').trim().toLowerCase();
  const items = [];
  const addGroup = (label) => {
    const g = document.createElement('div');
    g.className = 'palette-group';
    g.textContent = label;
    paletteResults.append(g);
  };
  const addItem = (item) => {
    items.push(item);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'palette-item';
    b.setAttribute('data-idx', String(items.length - 1));
    b.innerHTML = `<span class="palette-icon">${item.icon}</span><span>${item.title}</span>${item.hint ? `<small>${item.hint}</small>` : ''}`;
    b.addEventListener('click', () => { runItem(item); });
    paletteResults.append(b);
  };
  paletteResults.innerHTML = '';
  const match = (text) => !q || String(text).toLowerCase().includes(q);

  const views = Object.entries(VIEW_TITLES).filter(([, t]) => match(t));
  if (views.length) {
    addGroup('ناوبری');
    views.forEach(([key, t]) => addItem({
      title: t, hint: 'صفحه', action: () => showView(key),
      icon: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5"/><rect x="13.5" y="11" width="7" height="9.5" rx="1.5"/><rect x="3.5" y="13" width="7" height="7.5" rx="1.5"/></svg>',
    }));
  }
  const customers = CUSTOMERS.filter((c) => match(c.name) || match(c.id));
  if (customers.length) {
    addGroup('مشتریان');
    customers.slice(0, 5).forEach((c) => addItem({
      title: c.name, hint: c.id, action: () => { showView('customers'); openCustomerDrawer(c.id); },
      icon: '<svg viewBox="0 0 24 24"><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.2a4 4 0 0 1 0 7.6M17 14.7a4 4 0 0 1 4 4V20"/></svg>',
    }));
  }
  const trades = TRADES.filter((t) => match(t.id) || match(customerById(t.customer)?.name));
  if (trades.length) {
    addGroup('اسناد معاملاتی');
    trades.slice(0, 5).forEach((t) => addItem({
      title: `${t.id} — ${customerById(t.customer)?.name}`, hint: t.type === 'buy' ? 'خرید مشتری' : 'فروش مشتری',
      action: () => { showView('trades'); openTradeDrawer(t.id); },
      icon: '<svg viewBox="0 0 24 24"><path d="M4 7h15M15 3l4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg>',
    }));
  }
  const actions = [];
  if (match('ثبت معامله') || q) actions.push({
    title: 'ثبت معامله جدید', hint: 'اقدام', action: () => openModal('tradeModal'),
    icon: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  });
  if (match('افزودن مشتری') || q) actions.push({
    title: 'افزودن مشتری', hint: 'اقدام', action: () => openModal('customerModal'),
    icon: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  });
  if (actions.length) {
    addGroup('اقدامات');
    actions.forEach(addItem);
  }
  if (!items.length) {
    paletteResults.innerHTML = '<div class="palette-empty">موردی مطابق جست‌وجو یافت نشد.</div>';
  }
  paletteItems = items;
  paletteIndex = 0;
  markPaletteSelection();
}
function markPaletteSelection() {
  $$('.palette-item', paletteResults).forEach((el) => {
    const idx = Number(el.dataset.idx);
    el.classList.toggle('selected', idx === paletteIndex);
    if (idx === paletteIndex) el.scrollIntoView({ block: 'nearest' });
  });
}
function runItem(item) { closePalette(); item.action(); }
function openPalette() {
  if (!paletteBackdrop) return;
  paletteOpener = document.activeElement;
  paletteOpen = true;
  paletteBackdrop.classList.add('open');
  paletteInput.value = '';
  paletteBuild('');
  paletteInput.focus();
}
function closePalette() {
  if (!paletteBackdrop) return;
  paletteOpen = false;
  paletteBackdrop.classList.remove('open');
  if (paletteOpener?.focus) paletteOpener.focus();
  paletteOpener = null;
}
$('#globalSearch')?.addEventListener('click', openPalette);
$('#globalSearch')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); openPalette(); } });
$('#paletteInput')?.addEventListener('input', () => paletteBuild(paletteInput.value));
paletteInput?.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); paletteIndex = Math.min(paletteIndex + 1, paletteItems.length - 1); markPaletteSelection(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); paletteIndex = Math.max(paletteIndex - 1, 0); markPaletteSelection(); }
  else if (e.key === 'Enter') { e.preventDefault(); const item = paletteItems[paletteIndex]; if (item) runItem(item); }
});
paletteBackdrop?.addEventListener('click', (e) => { if (e.target === paletteBackdrop) closePalette(); });
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
});

/* ==================== مودال‌ها ==================== */
let lastModalOpener = null;
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  lastModalOpener = document.activeElement;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => modal.querySelector('input,select,textarea,button')?.focus({ preventScroll: true }), 80);
}
function closeModals() {
  $$('.modal-backdrop.open').forEach((modal) => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
  if (lastModalOpener && lastModalOpener.offsetParent !== null) lastModalOpener.focus({ preventScroll: true });
  lastModalOpener = null;
}
document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open-modal]');
  if (opener) { e.preventDefault(); openModal(opener.dataset.openModal); return; }
  if (e.target.closest('[data-close-modal]')) closeModals();
  else {
    $$('.modal-backdrop.open').forEach((modal) => { if (e.target === modal) closeModals(); });
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (paletteOpen) { closePalette(); return; }
    closeModals(); closeDrawer(); closeSidebar();
  }
  if (e.key === 'Tab') {
    const modal = $('.modal-backdrop.open .modal-card');
    if (modal) trapFocus(e, modal);
  }
});
function trapFocus(e, container) {
  const focusables = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])', container)
    .filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ==================== Drawer عمومی ==================== */
const drawer = $('#drawer');
const drawerBackdrop = $('#drawerBackdrop');
const drawerBody = $('#drawerBody');
let drawerOpener = null;

function openDrawer(html, footHtml = '') {
  if (!drawer) return;
  drawerOpener = document.activeElement;
  $('#drawerFoot').innerHTML = footHtml;
  drawerBody.innerHTML = html;
  drawer.classList.add('open');
  drawerBackdrop?.classList.add('open');
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => $('#drawerClose')?.focus({ preventScroll: true }), 80);
}
function closeDrawer() {
  if (!drawer?.classList.contains('open')) return;
  drawer.classList.remove('open');
  drawerBackdrop?.classList.remove('open');
  document.body.style.overflow = '';
  drawerOpener?.focus?.();
  drawerOpener = null;
}
$('#drawerClose')?.addEventListener('click', closeDrawer);
drawerBackdrop?.addEventListener('click', closeDrawer);

/* ==================== شمارش نرم اعداد ==================== */
function countUp(el, target, formatter = formatMoney, duration = 700) {
  if (!el) return;
  if (reducedMotion() || !Number.isFinite(target)) { el.textContent = formatter(target); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = formatter(target * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ==================== داشبورد ==================== */
function computeDashboardStats() {
  const tradesPosted = postedTrades();
  let purchases = 0, sales = 0;
  const weightByMetal = { gold: 0, silver: 0, platinum: 0 };
  const balanceByCustomer = {};
  for (const c of CUSTOMERS) balanceByCustomer[c.id] = 0;
  for (const t of tradesPosted) {
    const total = tradeTotal(t);
    if (t.type === 'buy') purchases += total; else sales += total;
    const metal = productById(t.product)?.metal;
    if (metal) weightByMetal[metal] += (t.type === 'buy' ? t.weight : -t.weight);
    balanceByCustomer[t.customer] += (t.type === 'buy' ? total : -total);
  }
  for (const p of PAYMENTS) {
    if (p.status !== 'posted') continue;
    balanceByCustomer[p.customer] = (balanceByCustomer[p.customer] || 0) + (p.direction === 'pay' ? p.amount : -p.amount);
  }
  for (const d of DELIVERIES) {
    if (d.status !== 'posted') continue;
    const metal = productById(d.product)?.metal;
    if (metal) weightByMetal[metal] -= d.weight;
  }
  let debitSum = 0, creditSum = 0, settled = 0;
  for (const v of Object.values(balanceByCustomer)) {
    if (v > 0) debitSum += v; else if (v < 0) creditSum += -v; else settled++;
  }
  const volume = tradesPosted.reduce((s, t) => s + t.weight, 0) / 1000; // کیلوگرم
  return { purchases, sales, weightByMetal, debitSum, creditSum, settled, volume, customers: CUSTOMERS.length, balanceByCustomer };
}

function renderDashboard() {
  const stats = computeDashboardStats();
  countUp($('#statCustomers'), stats.customers, (v) => formatFaNumber(Math.round(v)));
  countUp($('#statPurchases'), stats.purchases);
  countUp($('#statSales'), stats.sales);
  countUp($('#statWeight'), Object.values(stats.weightByMetal).reduce((a, b) => a + b, 0) / 1000, (v) => formatFaNumber(Math.round(v * 100) / 100));

  const weightTotal = Object.values(stats.weightByMetal).reduce((a, b) => a + b, 0) || 1;
  const g = stats.weightByMetal.gold / weightTotal * 100;
  const s = stats.weightByMetal.silver / weightTotal * 100;
  const p = stats.weightByMetal.platinum / weightTotal * 100;
  const donut = $('.donut-chart');
  if (donut) donut.style.background = `conic-gradient(var(--metal-gold) 0 ${g}%, var(--metal-silver) ${g}% ${g + s}%, var(--metal-platinum) ${g + s}% 100%)`;
  const setLegend = (sel, pct, kg) => {
    const el = $(sel);
    if (!el) return;
    el.innerHTML = `${toFaDigits(pct.toFixed(1))}٪ <small>${formatFaNumber(Math.round(kg))} کیلو</small>`;
  };
  setLegend('#legGold', g, stats.weightByMetal.gold / 1000);
  setLegend('#legSilver', s, stats.weightByMetal.silver / 1000);
  setLegend('#legPlatinum', p, stats.weightByMetal.platinum / 1000);
  const donutHole = $('.donut-hole strong');
  if (donutHole) donutHole.textContent = formatFaNumber(Math.round(weightTotal / 100) / 10);

  // کارت‌های ثانویه
  const setText = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };
  setText('#miniDebit', formatMoney(stats.debitSum));
  setText('#miniCredit', formatMoney(stats.creditSum));
  setText('#miniVolume', `${formatFaNumber(Math.round(stats.volume * 10) / 10)} کیلوگرم`);
  setText('#miniSettled', `${formatFaNumber(stats.settled)} از ${formatFaNumber(CUSTOMERS.length)} مشتری`);

  // جدول آخرین معاملات
  const tbody = $('#recentTradesTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    const recent = [...TRADES].sort((a, b) => b.day - a.day).slice(0, 5);
    recent.forEach((t) => tbody.append(tradeRow(t, { compact: true })));
  }

  // حساب‌های نیازمند پیگیری
  const debtList = $('#debtList');
  if (debtList) {
    debtList.innerHTML = '';
    const debtors = Object.entries(stats.balanceByCustomer)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]).slice(0, 3);
    debtors.forEach(([cid, v], i) => {
      const c = customerById(cid);
      const row = document.createElement('div');
      row.className = 'debt-item';
      row.innerHTML = `<span class="person-avatar avatar-${c?.avatar || AVATARS[i % 6]}">${c?.name?.charAt(0) || '؟'}</span>
        <div class="debt-main"><strong>${c?.name || cid}</strong><small>کد: ${c?.id || '—'} · طبق داده نمایشی</small></div>
        <div class="debt-amount"><strong>${formatMoney(v)}</strong><small>واحد پول نمونه بدهکار</small></div>`;
      row.querySelector('.debt-main').addEventListener('click', () => openCustomerDrawer(cid));
      row.querySelector('.debt-main').style.cursor = 'pointer';
      debtList.append(row);
    });
    if (!debtors.length) debtList.innerHTML = '<div class="empty-state show"><p>مانده بدهکاری نمایشی وجود ندارد.</p></div>';
  }

  // نوار بازار
  const strip = $('#marketItems');
  if (strip) {
    strip.innerHTML = '';
    PRICES.forEach((pr) => {
      const prod = productById(pr.product);
      const item = document.createElement('div');
      item.className = 'market-item';
      item.innerHTML = `<span class="metal-symbol ${prod.metal}">${prod.code.split('-')[0]}</span>
        <div><strong>${prod.name}</strong><small>هر گرم · نمایشی</small></div>
        <b>${formatMoney(pr.price)} <small>واحد پول نمونه</small>
          <span class="price-change ${pr.change >= 0 ? 'up' : 'down'}">${pr.change >= 0 ? '▲' : '▼'} ${toFaDigits(Math.abs(pr.change).toFixed(1))}٪</span></b>`;
      strip.append(item);
    });
  }

  buildActivityChart();
}

/* ---------- نمودار روند معاملات ---------- */
function catmullRomPath(points) {
  if (points.length < 2) return '';
  const T = 9; // کشش کمتر = overshoot کمتر
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / T;
    const c1y = p1[1] + (p2[1] - p0[1]) / T;
    const c2x = p2[0] - (p3[0] - p1[0]) / T;
    const c2y = p2[1] - (p3[1] - p1[1]) / T;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
function buildActivityChart() {
  const svg = $('#activityChart');
  if (!svg) return;
  const W = 700, H = 220, PADT = 14, PADB = 8;
  const days = [...new Set(TRADES.map((t) => t.day))].sort((a, b) => a - b).slice(-10);
  const buyPerDay = days.map((d) => TRADES.filter((t) => t.day === d && t.type === 'buy' && t.status !== 'reversed').reduce((s, t) => s + t.weight, 0));
  const sellPerDay = days.map((d) => TRADES.filter((t) => t.day === d && t.type === 'sell' && t.status !== 'reversed').reduce((s, t) => s + t.weight, 0));
  const maxVal = Math.max(...buyPerDay, ...sellPerDay, 1) * 1.12;
  const x = (i) => (days.length === 1 ? W / 2 : (i / (days.length - 1)) * W);
  const y = (v) => {
    const raw = PADT + (1 - v / maxVal) * (H - PADT - PADB);
    return Math.max(PADT + 2, Math.min(H - PADB - 2, raw)); // جلوگیری از خروج منحنی از ناحیه
  };
  const buyPts = buyPerDay.map((v, i) => [x(i), y(v)]);
  const sellPts = sellPerDay.map((v, i) => [x(i), y(v)]);
  const buyLine = catmullRomPath(buyPts);
  const sellLine = catmullRomPath(sellPts);
  const grid = [0, 1, 2, 3, 4].map((i) => `M0 ${(PADT + (i * (H - PADT - PADB) / 4)).toFixed(0)}H${W}`).join('');
  const faLabels = days.map((d) => toFaDigits(String(d)));
  const totalBuy = buyPerDay.reduce((a, b) => a + b, 0) / 1000;

  svg.innerHTML = `
    <defs>
      <linearGradient id="goldFill" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity=".26"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g class="chart-grid"><path d="${grid}"/></g>
    <path class="chart-line" d="${buyLine} L${W},${H - PADB} L0,${H - PADB} Z" fill="url(#goldFill)" stroke="none"/>
    <path class="chart-line" d="${buyLine}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" data-series="buy"/>
    <path class="chart-line" d="${sellLine}" fill="none" stroke="var(--info)" stroke-width="2.4" stroke-dasharray="6 5" stroke-linecap="round" data-series="sell"/>
    <line class="chart-hover-line" x1="0" x2="0" y1="${PADT}" y2="${H - PADB}"/>
    <g class="chart-dot" data-series="buy"><circle r="4.5" stroke="var(--accent)"/></g>
    <g class="chart-dot" data-series="sell"><circle r="4" stroke="var(--info)"/></g>`;
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'نمودار نمایشی روند وزن خرید و فروش در ۱۰ روز اخیر');

  const wrap = svg.closest('.chart-wrap');
  const tooltip = wrap?.querySelector('.chart-tooltip');
  const hoverLine = svg.querySelector('.chart-hover-line');
  const dots = { buy: svg.querySelector('.chart-dot[data-series="buy"]'), sell: svg.querySelector('.chart-dot[data-series="sell"]') };
  const chartSummary = $('#chartSummaryValue');
  if (chartSummary) chartSummary.textContent = `${toFaDigits((Math.round(totalBuy * 10) / 10).toLocaleString('en-US'))} کیلوگرم`;

  svg.addEventListener('mousemove', (e) => {
    const rect = svg.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width * W;
    let best = 0;
    days.forEach((_, i) => { if (Math.abs(x(i) - relX) < Math.abs(x(best) - relX)) best = i; });
    const px = x(best);
    hoverLine?.setAttribute('x1', px);
    hoverLine?.setAttribute('x2', px);
    hoverLine?.setAttribute('opacity', '1');
    if (dots.buy) { dots.buy.setAttribute('transform', `translate(${px},${buyPts[best][1]})`); dots.buy.style.opacity = '1'; }
    if (dots.sell) { dots.sell.setAttribute('transform', `translate(${px},${sellPts[best][1]})`); dots.sell.style.opacity = '1'; }
    if (tooltip) {
      tooltip.classList.add('show');
      tooltip.innerHTML = `<b>روز ${faLabels[best]} آبان</b><br>خرید: ${formatFaNumber(buyPerDay[best])} گرم<br>فروش: ${formatFaNumber(sellPerDay[best])} گرم`;
      const tw = tooltip.offsetWidth;
      const leftPx = (px / W) * rect.width;
      tooltip.style.left = `${Math.min(Math.max(leftPx - tw / 2, 4), rect.width - tw - 4)}px`;
      tooltip.style.top = `${Math.min((buyPts[best][1] / H) * rect.height, rect.height - tooltip.offsetHeight - 4)}px`;
    }
  });
  svg.addEventListener('mouseleave', () => {
    hoverLine?.setAttribute('opacity', '0');
    Object.values(dots).forEach((d) => { if (d) d.style.opacity = '0'; });
    tooltip?.classList.remove('show');
  });
  const xLabels = $('#activityXLabels');
  if (xLabels) {
    const step = Math.max(1, Math.round(days.length / 5));
    xLabels.innerHTML = days.filter((_, i) => i % step === 0 || i === days.length - 1)
      .map((d) => `<span>${toFaDigits(String(d))} آبان</span>`).join('');
  }
  const yLabels = $('#activityYLabels');
  if (yLabels) {
    const rows = [4, 3, 2, 1, 0].map((i) => {
      const v = maxVal * i / 4 / 1000;
      return `<span>${toFaDigits((Math.round(v * 10) / 10).toString()).replace('.', '٫')} kg</span>`;
    });
    yLabels.innerHTML = rows.join('');
  }
}

/* ==================== رندر جداول ==================== */
function statusPill(status) {
  const span = document.createElement('span');
  span.className = `status-pill ${STATUS_CLASS[status] || 'neutral'}`;
  span.textContent = STATUS_LABELS[status] || status;
  return span;
}
function personCell(customerId) {
  const c = customerById(customerId);
  const td = document.createElement('td');
  const wrap = document.createElement('div');
  wrap.className = 'table-person';
  const av = document.createElement('span');
  av.className = `person-avatar avatar-${c?.avatar || 'a'}`;
  av.textContent = c?.name?.charAt(0) || '؟';
  const name = document.createElement('strong');
  name.textContent = c?.name || customerId;
  wrap.append(av, name);
  td.append(wrap);
  return td;
}
function cell(content, className) {
  const td = document.createElement('td');
  if (className) td.className = className;
  if (content instanceof Node) td.append(content); else td.textContent = content;
  return td;
}

function tradeRow(t, { compact = false, actions = false } = {}) {
  const tr = document.createElement('tr');
  const prod = productById(t.product);
  tr.append(cell(t.id, 'mono'));
  if (!compact) tr.append(cell(`${t.date} · ${t.time}`));
  tr.append(personCell(t.customer));
  const type = document.createElement('span');
  type.className = `trade-type ${t.type}`;
  type.textContent = t.type === 'buy' ? 'خرید مشتری' : 'فروش مشتری';
  tr.append(cell(type));
  tr.append(cell(prod?.name || t.product));
  tr.append(cell(`${formatFaNumber(t.weight)} ${prod?.unit || 'گرم'}`, 'numeric'));
  if (!compact) tr.append(cell(formatMoney(t.price), 'numeric'));
  tr.append(cell(formatMoney(tradeTotal(t)), 'numeric'));
  tr.append(cell(statusPill(t.status)));
  if (actions) {
    const td = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'row-actions';
    const btn = document.createElement('button');
    btn.className = 'row-action';
    btn.setAttribute('aria-label', `جزئیات سند ${t.id}`);
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 3h5v5M20 3l-8.5 8.5M19 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5"/></svg>';
    btn.addEventListener('click', () => openTradeDrawer(t.id));
    wrap.append(btn);
    td.append(wrap);
    tr.append(td);
  }
  return tr;
}

function renderTrades() {
  const tbody = $('#tradeTable tbody');
  if (!tbody) return;
  const state = tableState.trades;
  let rows = [...TRADES].sort((a, b) => b.day - a.day);
  if (state.query) {
    const q = state.query;
    rows = rows.filter((t) => `${t.id} ${customerById(t.customer)?.name || ''}`.toLowerCase().includes(q));
  }
  if (state.type !== 'all') rows = rows.filter((t) => t.type === state.type);
  if (state.status !== 'all') rows = rows.filter((t) => t.status === state.status);
  const pages = Math.max(1, Math.ceil(rows.length / state.perPage));
  state.page = Math.min(state.page, pages);
  const visible = rows.slice((state.page - 1) * state.perPage, state.page * state.perPage);
  tbody.innerHTML = '';
  visible.forEach((t) => tbody.append(tradeRow(t, { actions: true })));
  $('#tradeResults').textContent = `نمایش ${formatFaNumber(visible.length)} سند از ${formatFaNumber(rows.length)} سند`;
  $('#tradeEmpty')?.classList.toggle('show', rows.length === 0);
  renderPagination($('#tradePagination'), state, pages, renderTrades);
}

function renderCustomers() {
  const tbody = $('#customerTable tbody');
  if (!tbody) return;
  const state = tableState.customers;
  let rows = [...CUSTOMERS];
  if (state.query) {
    const q = state.query;
    rows = rows.filter((c) => `${c.name} ${c.id} ${c.phone}`.toLowerCase().includes(q));
  }
  if (state.status !== 'all') rows = rows.filter((c) => c.status === state.status);
  const pages = Math.max(1, Math.ceil(rows.length / state.perPage));
  state.page = Math.min(state.page, pages);
  const visible = rows.slice((state.page - 1) * state.perPage, state.page * state.perPage);
  tbody.innerHTML = '';
  visible.forEach((c) => {
    const tr = document.createElement('tr');
    tr.append(personCell(c.id));
    tr.append(cell(c.id, 'mono'));
    tr.append(cell(c.phone, 'numeric'));
    const balances = customerWeightBalances(c.id);
    const totalGrams = Object.entries(balances).reduce((s, [pid, w]) => {
      const unit = productById(pid)?.unit;
      return s + (unit === 'کیلوگرم' ? w * 1000 : w);
    }, 0);
    tr.append(cell(`${totalGrams >= 0 ? '+' : '−'}${formatFaNumber(Math.abs(Math.round(totalGrams * 100) / 100))} گرم`, `numeric ${totalGrams >= 0 ? 'weight-positive' : 'weight-negative'}`));
    const fin = customerFinancialBalance(c.id);
    const bal = document.createElement('td');
    if (fin > 0) { const s = document.createElement('span'); s.className = 'balance-debit'; s.textContent = `${formatMoney(fin)} بدهکار`; bal.append(s); }
    else if (fin < 0) { const s = document.createElement('span'); s.className = 'balance-credit'; s.textContent = `${formatMoney(-fin)} بستانکار`; bal.append(s); }
    else { const s = document.createElement('span'); s.className = 'balance-settled'; s.textContent = 'تسویه‌شده'; bal.append(s); }
    tr.append(bal);
    tr.append(cell(c.status === 'active' ? statusPill('posted') : Object.assign(statusPill('draft'), { textContent: 'غیرفعال' })));
    const td = document.createElement('td');
    const wrap = document.createElement('div');
    wrap.className = 'row-actions';
    const viewBtn = document.createElement('button');
    viewBtn.className = 'row-action';
    viewBtn.setAttribute('aria-label', `مشاهده پروفایل ${c.name}`);
    viewBtn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.6"/><circle cx="5.5" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>';
    viewBtn.addEventListener('click', () => openCustomerDrawer(c.id));
    const tradeBtn = document.createElement('button');
    tradeBtn.className = 'row-action';
    tradeBtn.setAttribute('aria-label', `ثبت معامله برای ${c.name}`);
    tradeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h15M15 3l4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg>';
    tradeBtn.addEventListener('click', () => { openModal('tradeModal'); setTimeout(() => { const sel = $('#tradeCustomer'); if (sel) sel.value = c.name; updateAmount(); }, 30); });
    wrap.append(viewBtn, tradeBtn);
    td.append(wrap);
    tr.append(td);
    tbody.append(tr);
  });
  $('#customerResults').textContent = `نمایش ${formatFaNumber(visible.length)} مشتری از ${formatFaNumber(rows.length)} مشتری`;
  $('#customerEmpty')?.classList.toggle('show', rows.length === 0);
  renderPagination($('#customerPagination'), state, pages, renderCustomers);
}

function renderPayments() {
  const tbody = $('#paymentTable tbody');
  if (!tbody) return;
  const state = tableState.payments;
  let rows = [...PAYMENTS].sort((a, b) => b.day - a.day);
  if (state.direction !== 'all') rows = rows.filter((p) => p.direction === state.direction);
  tbody.innerHTML = '';
  rows.forEach((p) => {
    const tr = document.createElement('tr');
    tr.append(cell(p.id, 'mono'));
    tr.append(personCell(p.customer));
    const dir = document.createElement('span');
    dir.className = `trade-type ${p.direction === 'receive' ? 'buy' : 'sell'}`;
    dir.textContent = PAY_LABELS[p.direction];
    tr.append(cell(dir));
    tr.append(cell(p.method));
    tr.append(cell(formatMoney(p.amount), 'numeric'));
    tr.append(cell(`${p.date} · ${p.time}`));
    tr.append(cell(statusPill(p.status)));
    tbody.append(tr);
  });
  $('#paymentResults').textContent = `نمایش ${formatFaNumber(rows.length)} تراکنش نمایشی`;
  $('#paymentEmpty')?.classList.toggle('show', rows.length === 0);
  const recToday = PAYMENTS.filter((p) => p.direction === 'receive' && p.status === 'posted').reduce((s, p) => s + p.amount, 0);
  const payToday = PAYMENTS.filter((p) => p.direction === 'pay' && p.status === 'posted').reduce((s, p) => s + p.amount, 0);
  const pending = PAYMENTS.filter((p) => p.status === 'draft').length;
  const setText = (sel, v) => { const el = $(sel); if (el) el.textContent = v; };
  setText('#payReceived', formatMoney(recToday));
  setText('#payPaid', formatMoney(payToday));
  setText('#payPending', formatFaNumber(pending));
}

function renderDeliveries() {
  const tbody = $('#deliveryTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  [...DELIVERIES].sort((a, b) => b.day - a.day).forEach((d) => {
    const tr = document.createElement('tr');
    tr.append(cell(d.id, 'mono'));
    tr.append(personCell(d.customer));
    tr.append(cell(productById(d.product)?.name || d.product));
    tr.append(cell(`−${formatFaNumber(d.weight)} گرم`, 'numeric weight-negative'));
    tr.append(cell(d.date));
    tr.append(cell(statusPill(d.status)));
    tr.append(cell(d.note || '—'));
    tbody.append(tr);
  });
  $('#deliveryResults').textContent = `نمایش ${formatFaNumber(DELIVERIES.length)} رسید نمایشی`;
}

function renderBalances() {
  const filter = tableState.balancesProduct;
  const tbody = $('#balanceTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const totals = { gold: 0, silver: 0, platinum: 0 };
  let rowCount = 0;
  for (const c of CUSTOMERS) {
    const balances = customerWeightBalances(c.id);
    for (const [pid, w] of Object.entries(balances)) {
      if (Math.abs(w) < 0.0001) continue;
      if (filter !== 'all' && pid !== filter) continue;
      const prod = productById(pid);
      totals[prod.metal] = (totals[prod.metal] || 0) + w;
      rowCount++;
      const tr = document.createElement('tr');
      tr.append(personCell(c.id));
      tr.append(cell(prod.name));
      const buy = postedTrades().filter((t) => t.customer === c.id && t.product === pid && t.type === 'buy').reduce((s, t) => s + t.weight, 0);
      const sell = postedTrades().filter((t) => t.customer === c.id && t.product === pid && t.type === 'sell').reduce((s, t) => s + t.weight, 0);
      const del = DELIVERIES.filter((d) => d.customer === c.id && d.product === pid && d.status === 'posted').reduce((s, d) => s + d.weight, 0);
      tr.append(cell(formatFaNumber(buy), 'numeric'));
      tr.append(cell(formatFaNumber(sell), 'numeric'));
      tr.append(cell(formatFaNumber(del), 'numeric'));
      tr.append(cell(`${w >= 0 ? '+' : '−'}${formatFaNumber(Math.abs(Math.round(w * 1000) / 1000))}`, `numeric ${w >= 0 ? 'weight-positive' : 'weight-negative'}`));
      tr.append(cell(prod.unit));
      tbody.append(tr);
    }
  }
  $('#balanceResults').textContent = `${formatFaNumber(rowCount)} ردیف نمایشی`;
  $('#balanceEmpty')?.classList.toggle('show', rowCount === 0);
  const setCard = (sel, grams) => { const el = $(sel); if (el) el.textContent = formatFaNumber(Math.round(grams / 100) / 10); };
  setCard('#balGold', totals.gold);
  setCard('#balSilver', totals.silver);
  setCard('#balPlatinum', totals.platinum);
}

function renderStatement() {
  const select = $('#stmtCustomer');
  if (!select) return;
  const cid = select.value || CUSTOMERS[0]?.id;
  const events = customerStatement(cid);
  const tbody = $('#stmtTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    events.forEach((e) => {
      const tr = document.createElement('tr');
      tr.append(cell(`${e.date} · ${e.time}`));
      tr.append(cell(e.ref, 'mono'));
      tr.append(cell(e.kind));
      tr.append(cell(e.product));
      tr.append(cell(e.weight, `numeric ${String(e.weight).startsWith('+') ? 'weight-positive' : String(e.weight).startsWith('−') ? 'weight-negative' : ''}`));
      tr.append(cell(e.debit !== null ? formatMoney(e.debit) : '—', 'numeric'));
      tr.append(cell(e.credit !== null ? formatMoney(e.credit) : '—', 'numeric'));
      tr.append(cell(formatMoney(e.balance), 'numeric'));
      tbody.append(tr);
    });
    $('#stmtEmpty')?.classList.toggle('show', events.length === 0);
  }
  const fin = customerFinancialBalance(cid);
  const weights = customerWeightBalances(cid);
  const goldGrams = Object.entries(weights)
    .filter(([pid]) => productById(pid)?.metal === 'gold')
    .reduce((s, [, w]) => s + w, 0);
  const setText = (sel, v, cls) => {
    const el = $(sel);
    if (!el) return;
    el.textContent = v;
    if (cls) el.className = cls;
  };
  setText('#stmtFin', `${formatMoney(Math.abs(fin))} واحد پول نمونه ${fin > 0 ? 'بدهکار' : fin < 0 ? 'بستانکار' : 'تسویه‌شده'}`,
    fin > 0 ? 'balance-debit' : fin < 0 ? 'balance-credit' : 'balance-settled');
  setText('#stmtWeight', `${formatFaNumber(Math.round(goldGrams * 1000) / 1000)} گرم`);
  setText('#stmtCount', `${formatFaNumber(events.length)} رویداد`);
}

/* ==================== صفحه‌بندی ==================== */
const tableState = {
  customers: { page: 1, perPage: 6, query: '', status: 'all' },
  trades: { page: 1, perPage: 7, query: '', type: 'all', status: 'all' },
  payments: { direction: 'all' },
  balancesProduct: 'all',
};
function renderPagination(container, state, pages, rerender) {
  if (!container) return;
  container.innerHTML = '';
  const mk = (label, opts = {}) => {
    const b = document.createElement('button');
    b.textContent = label;
    Object.assign(b, opts);
    if (!opts.disabled) b.addEventListener('click', () => { state.page = opts._page ?? state.page; rerender(); });
    return b;
  };
  const prev = mk('قبلی', { disabled: state.page === 1 });
  prev.addEventListener('click', () => { state.page--; rerender(); });
  container.append(prev);
  const win = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - state.page) <= 1) win.push(p);
  }
  let last = 0;
  for (const p of win) {
    if (p - last > 1) { const dots = document.createElement('span'); dots.textContent = '…'; container.append(dots); }
    const b = mk(toFaDigits(String(p)), { _page: p });
    if (p === state.page) b.className = 'page-active';
    container.append(b);
    last = p;
  }
  const next = document.createElement('button');
  next.textContent = 'بعدی';
  next.disabled = state.page === pages;
  next.addEventListener('click', () => { state.page++; rerender(); });
  container.append(next);
}

/* ==================== فیلترها و جست‌وجو ==================== */
function bindSearch(inputId, key, rerender) {
  $(inputId)?.addEventListener('input', (e) => {
    tableState[key].query = e.target.value.trim().toLowerCase();
    tableState[key].page = 1;
    rerender();
  });
}
bindSearch('#customerSearch', 'customers', renderCustomers);
bindSearch('#tradeSearch', 'trades', renderTrades);
$('#customerStatusFilter')?.addEventListener('change', (e) => { tableState.customers.status = e.target.value; tableState.customers.page = 1; renderCustomers(); });
$('#tradeTypeFilter')?.addEventListener('change', (e) => { tableState.trades.type = e.target.value; tableState.trades.page = 1; renderTrades(); });
$('#tradeStatusFilter')?.addEventListener('change', (e) => { tableState.trades.status = e.target.value; tableState.trades.page = 1; renderTrades(); });
$('#paymentDirectionFilter')?.addEventListener('change', (e) => { tableState.payments.direction = e.target.value; renderPayments(); });
$('#balanceProductFilter')?.addEventListener('change', (e) => { tableState.balancesProduct = e.target.value; renderBalances(); });
$('#stmtCustomer')?.addEventListener('change', renderStatement);

/* ==================== Drawer مشتری ==================== */
function openCustomerDrawer(customerId) {
  const c = customerById(customerId);
  if (!c || !drawer) return;
  const fin = customerFinancialBalance(customerId);
  const balances = customerWeightBalances(customerId);
  const trades = TRADES.filter((t) => t.customer === customerId && t.status !== 'reversed').slice(0, 6);
  const pays = PAYMENTS.filter((p) => p.customer === customerId);
  const weightRows = Object.entries(balances).filter(([, w]) => Math.abs(w) > 0.0001)
    .map(([pid, w]) => `<tr><td>${productById(pid)?.name || pid}</td><td class="num">${w >= 0 ? '+' : '−'}${formatFaNumber(Math.abs(Math.round(w * 1000) / 1000))} ${productById(pid)?.unit}</td></tr>`)
    .join('') || '<tr><td colspan="2">موجودی وزنی نمایشی ندارد</td></tr>';
  const tradeRows = trades.map((t) => `<tr><td class="mono">${t.id}</td><td>${t.type === 'buy' ? 'خرید' : 'فروش'} ${productById(t.product)?.name}</td><td class="num">${formatFaNumber(t.weight)} گرم</td><td>${statusPill(t.status).outerHTML}</td></tr>`).join('') || '<tr><td colspan="4">سندی ثبت نشده است</td></tr>';
  const payRows = pays.map((p) => `<tr><td class="mono">${p.id}</td><td>${PAY_LABELS[p.direction]}</td><td class="num">${formatMoney(p.amount)}</td></tr>`).join('') || '<tr><td colspan="3">تراکنشی ثبت نشده است</td></tr>';

  openDrawer(`
    <div class="drawer-profile">
      <span class="person-avatar avatar-${c.avatar}">${c.name.charAt(0)}</span>
      <div><strong>${c.name}</strong><small>کد مشتری: <span class="mono">${c.id}</span> · مشتری از ${c.since}</small></div>
    </div>
    <div class="drawer-section-title">خلاصه حساب</div>
    <div class="kv-list">
      <div><span class="k">مانده مالی (بدهکار − بستانکار)</span><span class="v ${fin > 0 ? 'balance-debit' : fin < 0 ? 'balance-credit' : 'balance-settled'}">${fin > 0 ? `${formatMoney(fin)} بدهکار` : fin < 0 ? `${formatMoney(-fin)} بستانکار` : 'تسویه‌شده'}</span></div>
      <div><span class="k">وضعیت</span><span class="v">${c.status === 'active' ? 'فعال' : 'غیرفعال'}</span></div>
      <div><span class="k">شماره تماس</span><span class="v numeric">${c.phone}</span></div>
    </div>
    <div class="drawer-section-title">مانده وزنی به تفکیک محصول</div>
    <table class="mini-table"><thead><tr><th>محصول</th><th>مانده</th></tr></thead><tbody>${weightRows}</tbody></table>
    <div class="drawer-section-title">آخرین معاملات</div>
    <table class="mini-table"><thead><tr><th>سند</th><th>نوع</th><th>وزن</th><th>وضعیت</th></tr></thead><tbody>${tradeRows}</tbody></table>
    <div class="drawer-section-title">سابقه پرداخت و دریافت</div>
    <table class="mini-table"><thead><tr><th>سند</th><th>جهت</th><th>مبلغ</th></tr></thead><tbody>${payRows}</tbody></table>
    <p class="table-note">مقادیر این پروفایل از داده‌های نمایشی محاسبه شده‌اند و به حساب واقعی متصل نیستند.</p>
  `, `
    <button type="button" class="button button-primary button-block" id="drawerTradeBtn">
      <svg viewBox="0 0 24 24"><path d="M4 7h15M15 3l4 4-4 4M20 17H5m4-4-4 4 4 4"/></svg>
      ثبت معامله برای این مشتری
    </button>
  `);
  $('#drawerTradeBtn')?.addEventListener('click', () => {
    closeDrawer();
    openModal('tradeModal');
    setTimeout(() => { const sel = $('#tradeCustomer'); if (sel) sel.value = c.name; updateAmount(); }, 60);
  });
}

/* ==================== Drawer سند ==================== */
function openTradeDrawer(tradeId) {
  const t = TRADES.find((x) => x.id === tradeId);
  if (!t) return;
  const prod = productById(t.product);
  const c = customerById(t.customer);
  openDrawer(`
    <div class="drawer-profile">
      <span class="person-avatar avatar-b" style="background:var(--surface-3);color:var(--text-strong)">${t.id.slice(0, 2)}</span>
      <div><strong>سند ${t.id}</strong><small>${t.type === 'buy' ? 'خرید مشتری از ما' : 'فروش مشتری به ما'} · ${t.date} · ${t.time}</small></div>
    </div>
    <div class="kv-list" style="margin-top:18px">
      <div><span class="k">مشتری</span><span class="v">${c?.name || t.customer}</span></div>
      <div><span class="k">محصول</span><span class="v">${prod?.name || t.product}</span></div>
      <div><span class="k">وزن</span><span class="v numeric">${formatFaNumber(t.weight)} ${prod?.unit || 'گرم'}</span></div>
      <div><span class="k">نرخ واحد</span><span class="v numeric">${formatMoney(t.price)}</span></div>
      <div><span class="k">مبلغ کل</span><span class="v numeric">${formatMoney(tradeTotal(t))} واحد پول نمونه</span></div>
      <div><span class="k">وضعیت سند</span><span class="v">${statusPill(t.status).outerHTML}</span></div>
    </div>
    <div class="drawer-section-title">اثر سند طبق قواعد حسابداری</div>
    <div class="kv-list">
      <div><span class="k">${t.type === 'buy' ? 'دفتر مالی' : 'دفتر مالی'}</span><span class="v ${t.type === 'buy' ? 'balance-debit' : 'balance-credit'}">${t.type === 'buy' ? 'بدهکاری مشتری افزایش می‌یابد' : 'بستانکاری مشتری افزایش می‌یابد'}</span></div>
      <div><span class="k">دفتر وزنی</span><span class="v ${t.type === 'buy' ? 'weight-positive' : 'weight-negative'}">${t.type === 'buy' ? '+' : '−'}${formatFaNumber(t.weight)} ${prod?.unit || 'گرم'}</span></div>
    </div>
    ${t.status === 'reversed' ? '<p class="table-note">این سند با سند معکوس برگشت خورده است؛ طبق قواعد، اسناد قطعی حذف فیزیکی نمی‌شوند.</p>' : t.status === 'draft' ? '<p class="table-note">سند پیش‌نویس تا قبل از قطعی‌شدن قابل ویرایش است.</p>' : '<p class="table-note">مقادیر سند از داده نمایشی است؛ هیچ سند مالی واقعی ایجاد نشده است.</p>'}
  `, `
    <button type="button" class="button button-secondary button-block" data-close-drawer>بستن</button>
  `);
  $('#drawerFoot [data-close-drawer]')?.addEventListener('click', closeDrawer);
}

/* ==================== Drawer گزارش معاملات ==================== */
function openReportDrawer() {
  if (!drawer) return;
  openDrawer(`
    <div class="drawer-section-title" style="margin-top:0">گزارش معاملات (نمایشی)</div>
    <div class="form-grid-2">
      <label class="field"><span class="field-label">از روز</span>
        <select class="select" id="repFrom">${[20, 22, 24, 26, 28, 30].map((d) => `<option value="${d}" ${d === 20 ? 'selected' : ''}>${toFaDigits(d)} آبان</option>`).join('')}</select>
      </label>
      <label class="field"><span class="field-label">تا روز</span>
        <select class="select" id="repTo">${[20, 22, 24, 26, 28, 30].map((d) => `<option value="${d}" ${d === 30 ? 'selected' : ''}>${toFaDigits(d)} آبان</option>`).join('')}</select>
      </label>
      <label class="field"><span class="field-label">نوع معامله</span>
        <select class="select" id="repType"><option value="all">همه</option><option value="buy">خرید مشتری</option><option value="sell">فروش مشتری</option></select>
      </label>
      <label class="field"><span class="field-label">محصول</span>
        <select class="select" id="repProduct"><option value="all">همه</option>${PRODUCTS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('')}</select>
      </label>
    </div>
    <div class="kv-list" style="margin-top:14px" id="repSummary"></div>
    <div class="drawer-section-title">اسناد منطبق</div>
    <table class="mini-table" id="repTable"></table>
    <p class="table-note">این گزارش صرفاً روی داده نمایشی همین صفحه اجرا می‌شود.</p>
  `, `
    <button type="button" class="button button-secondary button-block" id="repClose">بستن</button>
  `);
  const rerun = () => {
    const from = Number($('#repFrom').value);
    const to = Number($('#repTo').value);
    const type = $('#repType').value;
    const product = $('#repProduct').value;
    const rows = TRADES.filter((t) => t.day >= from && t.day <= to && (type === 'all' || t.type === type) && (product === 'all' || t.product === product) && t.status !== 'reversed');
    const buySum = rows.filter((t) => t.type === 'buy').reduce((s, t) => s + tradeTotal(t), 0);
    const sellSum = rows.filter((t) => t.type === 'sell').reduce((s, t) => s + tradeTotal(t), 0);
    const buyW = rows.filter((t) => t.type === 'buy').reduce((s, t) => s + t.weight, 0);
    const sellW = rows.filter((t) => t.type === 'sell').reduce((s, t) => s + t.weight, 0);
    $('#repSummary').innerHTML = `
      <div><span class="k">تعداد اسناد</span><span class="v">${formatFaNumber(rows.length)}</span></div>
      <div><span class="k">جمع خرید</span><span class="v balance-debit">${formatMoney(buySum)}</span></div>
      <div><span class="k">جمع فروش</span><span class="v balance-credit">${formatMoney(sellSum)}</span></div>
      <div><span class="k">گردش وزنی</span><span class="v">خرید ${formatFaNumber(buyW)} / فروش ${formatFaNumber(sellW)} گرم</span></div>`;
    $('#repTable').innerHTML = `<thead><tr><th>سند</th><th>مشتری</th><th>وزن</th><th>مبلغ</th></tr></thead><tbody>
      ${rows.map((t) => `<tr><td class="mono">${t.id}</td><td>${customerById(t.customer)?.name || '—'}</td><td class="num">${formatFaNumber(t.weight)} گرم</td><td class="num">${formatMoney(tradeTotal(t))}</td></tr>`).join('') || '<tr><td colspan="4">سندی در این بازه یافت نشد</td></tr>'}
    </tbody>`;
  };
  ['repFrom', 'repTo', 'repType', 'repProduct'].forEach((id) => $(`#${id}`)?.addEventListener('change', rerun));
  $('#repClose')?.addEventListener('click', closeDrawer);
  rerun();
}
$('#openReportTrades')?.addEventListener('click', openReportDrawer);

/* ==================== چاپ دفتر حساب ==================== */
$('#printStatement')?.addEventListener('click', () => {
  showView('statements');
  window.setTimeout(() => window.print(), 150);
});

/* ==================== فرم‌ها ==================== */
function bindForm(formId, { onSubmit, successMessage, resetAfter = true } = {}) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn?.disabled) return; // جلوگیری از ارسال تکراری
    if (submitBtn) submitBtn.disabled = true;
    window.setTimeout(() => {
      try {
        onSubmit?.(form);
        if (successMessage) toast(successMessage, 'success');
        if (resetAfter) form.reset();
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    }, reducedMotion() ? 0 : 350);
  });
}

/* --- فرم معامله --- */
const tradeProduct = $('#tradeProduct');
const tradePrice = $('#tradePrice');
const tradeWeight = $('#tradeWeight');
const tradeAmount = $('#tradeAmount');
function updateAmount() {
  if (!tradeAmount) return;
  const amount = multiplyHalfUp(tradeWeight?.value, tradePrice?.value);
  tradeAmount.textContent = `${amount === null ? '۰' : formatMoney(amount)} واحد پول نمونه`;
}
tradeProduct?.addEventListener('change', () => {
  const price = tradeProduct.selectedOptions[0]?.dataset.price;
  if (price && tradePrice) tradePrice.value = price;
  updateAmount();
});
tradePrice?.addEventListener('input', updateAmount);
tradeWeight?.addEventListener('input', updateAmount);
$('#tradeType')?.addEventListener('change', updateAmount);
window.addEventListener('DOMContentLoaded', updateAmount);
updateAmount();

bindForm('tradeForm', {
  successMessage: 'سند نمایشی به داده‌های همین صفحه اضافه شد؛ روی سرور ذخیره نشده است.',
  onSubmit: () => {
    const customerName = $('#tradeCustomer').value;
    const customer = CUSTOMERS.find((c) => c.name === customerName);
    const type = $('#tradeType').value;
    const product = tradeProduct.value;
    const weight = Number(tradeWeight.value);
    const price = Number(tradePrice.value);
    const newTrade = {
      id: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      day: 30, date: '۱۴۰۵/۰۸/۳۰', time: 'اکنون',
      customer: customer?.id || CUSTOMERS[0].id,
      type, product, weight, price, status: 'draft',
    };
    TRADES.unshift(newTrade);
    closeModals();
    renderAll();
    showView('trades');
  },
});

/* --- فرم مشتری --- */
bindForm('customerForm', {
  successMessage: 'مشتری فقط به فهرست نمایشی اضافه شد.',
  onSubmit: () => {
    const name = $('#newCustomerName').value.trim();
    CUSTOMERS.unshift({
      id: 'DEMO-NEW', name, phone: $('#newCustomerPhone').value.trim() || '—',
      status: 'active', avatar: AVATARS[CUSTOMERS.length % 6], since: '۱۴۰۵/۰۸/۳۰',
    });
    closeModals();
    renderAll();
    showView('customers');
  },
});

/* --- فرم قیمت --- */
bindForm('priceForm', {
  successMessage: 'قیمت نمایشی ثبت شد؛ به منبع بازار متصل نیست.',
  onSubmit: () => {
    const pid = $('#priceProduct').value;
    const price = Number($('#priceValue').value);
    const existing = PRICES.find((p) => p.product === pid);
    if (existing) { existing.price = price; existing.updated = 'اکنون (نمایشی)'; }
    closeModals();
    renderDashboard();
    renderPrices();
    showView('prices');
  },
});

/* --- فرم پرداخت/دریافت --- */
bindForm('paymentForm', {
  successMessage: 'تراکنش نمایشی ثبت شد؛ روی سرور ذخیره نشده است.',
  onSubmit: () => {
    const customerName = $('#payCustomer').value;
    const customer = CUSTOMERS.find((c) => c.name === customerName);
    PAYMENTS.unshift({
      id: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      day: 30, date: '۱۴۰۵/۰۸/۳۰', time: 'اکنون',
      customer: customer?.id || CUSTOMERS[0].id,
      direction: $('#payDirection').value,
      method: $('#payMethod').value || 'انتقال بانکی',
      amount: Number($('#payAmount').value) || 0,
      status: 'draft',
    });
    closeModals();
    renderAll();
    showView('payments');
  },
});

/* --- فرم تحویل --- */
bindForm('deliveryForm', {
  successMessage: 'رسید تحویل نمایشی ثبت شد؛ مانده واقعی تغییر نمی‌کند.',
  onSubmit: () => {
    const customerName = $('#delCustomer').value;
    const customer = CUSTOMERS.find((c) => c.name === customerName);
    DELIVERIES.unshift({
      id: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
      day: 30, date: '۱۴۰۵/۰۸/۳۰',
      customer: customer?.id || CUSTOMERS[0].id,
      product: $('#delProduct').value,
      weight: Number($('#delWeight').value) || 0,
      status: 'draft', note: 'ثبت‌شده در محیط نمایشی',
    });
    closeModals();
    renderAll();
    showView('deliveries');
  },
});

/* ==================== قیمت‌ها ==================== */
function renderPrices() {
  const grid = $('#priceCards');
  if (!grid) return;
  grid.innerHTML = '';
  const sparkPaths = [
    'M1 26 14 22 27 24 40 16 53 19 66 12 79 15 92 8 105 11 118 4',
    'M1 20 14 24 27 18 40 21 53 14 66 17 79 10 92 13 105 7 118 9',
    'M1 12 14 16 27 11 40 18 53 15 66 21 79 16 92 22 105 18 118 24',
    'M1 24 14 20 27 23 40 15 53 18 66 11 79 14 92 7 105 10 118 5',
  ];
  PRICES.forEach((pr, i) => {
    const prod = productById(pr.product);
    const card = document.createElement('article');
    card.className = 'panel price-card';
    card.innerHTML = `
      <div class="price-card-head"><span class="metal-symbol ${prod.metal}">${prod.code.split('-')[0]}</span>
        <span class="status-pill warning">نمونه دستی</span></div>
      <h3>${prod.name}</h3><small>هر گرم · واحد پول نمونه</small>
      <strong>${formatMoney(pr.price)}</strong>
      <div class="spark"><svg viewBox="0 0 120 30"><path d="${sparkPaths[i % sparkPaths.length]}" stroke="currentColor" fill="none"/></svg></div>
      <div class="price-meta"><span>${pr.change >= 0 ? '▲' : '▼'} ${toFaDigits(Math.abs(pr.change).toFixed(1))}٪ نسبت به ثبت قبل</span><span>${pr.updated}</span></div>`;
    grid.append(card);
  });
}

/* ==================== مقداردهی اولیه سلکت‌ها ==================== */
function populateSelects() {
  const names = CUSTOMERS.map((c) => `<option>${c.name}</option>`).join('');
  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  fill('#tradeCustomer', `<option value="" disabled selected>انتخاب مشتری</option>${names}`);
  fill('#payCustomer', `<option value="" disabled selected>انتخاب مشتری</option>${names}`);
  fill('#delCustomer', `<option value="" disabled selected>انتخاب مشتری</option>${names}`);
  fill('#tradeProduct', PRODUCTS.map((p) => `<option value="${p.name}" data-price="${p.refPrice}">${p.name}</option>`).join(''));
  fill('#delProduct', PRODUCTS.map((p) => `<option value="${p.id}">${p.name}</option>`).join(''));
  fill('#priceProduct', PRODUCTS.map((p) => `<option value="${p.id}">${p.name}</option>`).join(''));
  fill('#stmtCustomer', CUSTOMERS.map((c) => `<option value="${c.id}">${c.name} — ${c.id}</option>`).join(''));
  fill('#balanceProductFilter', `<option value="all">همه محصولات</option>${PRODUCTS.map((p) => `<option value="${p.id}">${p.name}</option>`).join('')}`);
}

/* ==================== اعلان‌ها ==================== */
function renderNotifications() {
  const list = $('#notificationsList');
  if (!list) return;
  list.innerHTML = '';
  NOTIFICATIONS.forEach((n) => {
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `<span class="n-icon">${n.tone === 'warning' ? '⚠' : n.tone === 'success' ? '✓' : n.tone === 'info' ? 'ℹ' : '•'}</span>
      <div><strong>${n.title}</strong><small>${n.time} · نمایشی</small></div>`;
    list.append(item);
  });
}

/* ==================== renderAll ==================== */
function renderAll() {
  renderDashboard();
  renderCustomers();
  renderTrades();
  renderPayments();
  renderDeliveries();
  renderBalances();
  renderStatement();
  renderPrices();
  renderNotifications();
}
populateSelects();
renderAll();
