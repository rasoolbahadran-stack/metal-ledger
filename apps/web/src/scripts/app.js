const root = document.documentElement;
const navItems = [...document.querySelectorAll('[data-view]')];
const sections = [...document.querySelectorAll('[data-section]')];
const breadcrumb = document.getElementById('breadcrumbCurrent');
const viewTitles = {
  dashboard: 'نمای کلی', customers: 'مشتریان', trades: 'معاملات', balances: 'مانده وزنی',
  prices: 'قیمت فلزات', products: 'محصولات', payments: 'پرداخت‌ها', deliveries: 'تحویل کالا',
  statements: 'دفتر حساب', reports: 'گزارش‌ها', settings: 'تنظیمات سامانه'
};

function showView(name) {
  if (!viewTitles[name]) return;
  sections.forEach(section => section.classList.toggle('active', section.dataset.section === name));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === name));
  breadcrumb.textContent = viewTitles[name];
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  closeSidebar();
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.querySelectorAll('[data-nav]').forEach(item => item.addEventListener('click', () => showView(item.dataset.nav)));

const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('mobileScrim');
function openSidebar() { sidebar.classList.add('open'); scrim.classList.add('open'); }
function closeSidebar() { sidebar.classList.remove('open'); scrim.classList.remove('open'); }
document.getElementById('menuToggle')?.addEventListener('click', openSidebar);
document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
scrim?.addEventListener('click', closeSidebar);

function setTheme(theme) {
  root.dataset.theme = theme;
  try { localStorage.setItem('metal-ledger-theme', theme); } catch { /* storage may be unavailable */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#131a19' : '#f5f6f4');
}
let initialTheme = 'light';
try { initialTheme = localStorage.getItem('metal-ledger-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch { /* default light */ }
setTheme(initialTheme);
function toggleTheme() { setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'); }
document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
document.getElementById('settingsTheme')?.addEventListener('click', toggleTheme);

document.getElementById('dismissNotice')?.addEventListener('click', () => {
  document.querySelector('.demo-notice')?.remove();
});

const toastRegion = document.getElementById('toastRegion');
function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  toastRegion.append(node);
  window.setTimeout(() => node.remove(), 3400);
}
document.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => toast(button.dataset.toast)));

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('input,select,textarea,button')?.focus();
}
function closeModals() {
  document.querySelectorAll('.modal-backdrop.open').forEach(modal => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
}
document.getElementById('openTradeModal')?.addEventListener('click', () => openModal('tradeModal'));
document.getElementById('openTradeModal2')?.addEventListener('click', () => openModal('tradeModal'));
document.getElementById('openCustomerModal')?.addEventListener('click', () => openModal('customerModal'));
document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModals));
document.querySelectorAll('.modal-backdrop').forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModals(); }));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeModals(); closeSidebar(); }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.getElementById('globalSearch')?.focus();
  }
});

const tradeProduct = document.getElementById('tradeProduct');
const tradePrice = document.getElementById('tradePrice');
const tradeWeight = document.getElementById('tradeWeight');
const tradeAmount = document.getElementById('tradeAmount');
function formatFaNumber(value) {
  const raw = String(value ?? '').trim();
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(raw)) return '۰';
  const [integerPart, fractionPart = ''] = raw.split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  const fraction = fractionPart.replace(/0+$/, '');
  const latin = `${grouped}${fraction ? `٫${fraction}` : ''}`;
  return latin.replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}
function calculateDemoAmount(weightValue, priceValue) {
  const parse = value => {
    const raw = String(value ?? '').trim();
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;
    const [integerPart, fractionPart = ''] = raw.split('.');
    return { units: BigInt(integerPart + fractionPart), scale: fractionPart.length };
  };
  const weight = parse(weightValue);
  const price = parse(priceValue);
  if (!weight || !price) return '۰';
  const divisor = 10n ** BigInt(weight.scale + price.scale);
  const numerator = weight.units * price.units;
  const rounded = (numerator + divisor / 2n) / divisor;
  return formatFaNumber(rounded.toString());
}
function updateAmount() {
  tradeAmount.textContent = `${calculateDemoAmount(tradeWeight?.value, tradePrice?.value)} واحد پول نمونه`;
}
tradeProduct?.addEventListener('change', () => {
  const price = tradeProduct.selectedOptions[0]?.dataset.price;
  if (price) tradePrice.value = price;
  updateAmount();
});
tradePrice?.addEventListener('input', updateAmount);
tradeWeight?.addEventListener('input', updateAmount);

const tradeForm = document.getElementById('tradeForm');
tradeForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!tradeForm.reportValidity()) return;
  const customer = document.getElementById('tradeCustomer').value;
  const type = document.getElementById('tradeType').value;
  const product = tradeProduct.value;
  const weight = tradeWeight.value.trim();
  const price = tradePrice.value.trim();
  const amount = calculateDemoAmount(weight, price);
  const id = `DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
  const tbody = document.querySelector('#tradeTable tbody');
  if (tbody) {
    const row = document.createElement('tr');
    const values = [id, 'اکنون', customer, type === 'buy' ? 'خرید مشتری' : 'فروش مشتری', product, `${formatFaNumber(weight)} گرم`, formatFaNumber(price), amount, 'پیش‌نویس'];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 0) cell.className = 'mono';
      if (index === 5 || index === 6 || index === 7) cell.classList.add('numeric');
      if (index === 3) { const tag = document.createElement('span'); tag.className = `trade-type ${type === 'buy' ? 'buy' : 'sell'}`; tag.textContent = value; cell.textContent = ''; cell.append(tag); }
      if (index === 8) { const tag = document.createElement('span'); tag.className = 'status-pill pending'; tag.textContent = value; cell.textContent = ''; cell.append(tag); }
      row.append(cell);
    });
    tbody.prepend(row);
  }
  closeModals();
  tradeForm.reset();
  tradePrice.value = '7500000';
  updateAmount();
  toast('سند نمایشی اضافه شد؛ اطلاعات روی سرور ذخیره نشده است.');
  showView('trades');
});

const customerForm = document.getElementById('customerForm');
customerForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!customerForm.reportValidity()) return;
  const name = document.getElementById('newCustomerName').value.trim();
  const first = name.charAt(0) || '؟';
  const tbody = document.querySelector('#customerTable tbody');
  if (tbody) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const person = document.createElement('div'); person.className = 'table-person';
    const avatar = document.createElement('span'); avatar.className = 'person-avatar avatar-sand'; avatar.textContent = first;
    const title = document.createElement('strong'); title.textContent = name;
    person.append(avatar, title); nameCell.append(person);
    const code = document.createElement('td'); code.className = 'mono'; code.textContent = 'DEMO-NEW';
    const phone = document.createElement('td'); phone.textContent = document.getElementById('newCustomerPhone').value || '—';
    const weight = document.createElement('td'); weight.textContent = '۰.۰۰ گرم';
    const balance = document.createElement('td'); const settled = document.createElement('span'); settled.className = 'balance-settled'; settled.textContent = 'تسویه‌شده'; balance.append(settled);
    const status = document.createElement('td'); const pill = document.createElement('span'); pill.className = 'status-pill success'; pill.textContent = 'فعال'; status.append(pill);
    const more = document.createElement('td'); more.textContent = '—';
    row.append(nameCell, code, phone, weight, balance, status, more); tbody.prepend(row);
  }
  closeModals(); customerForm.reset(); toast('مشتری فقط به فهرست نمونه اضافه شد.');
});

function filterTable(inputId, tableId, columns, resultsId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLocaleLowerCase('fa-IR');
    let visible = 0;
    table.querySelectorAll('tbody tr').forEach(row => {
      const text = columns.map(index => row.cells[index]?.textContent || '').join(' ').toLocaleLowerCase('fa-IR');
      const show = text.includes(query);
      row.hidden = !show;
      if (show) visible++;
    });
    const result = resultsId && document.getElementById(resultsId);
    if (result) result.textContent = `نمایش ${formatFaNumber(visible)} مورد منطبق از نمونه‌ها`;
  });
}
filterTable('customerSearch', 'customerTable', [0, 1, 2], 'customerResults');
filterTable('tradeSearch', 'tradeTable', [0, 1, 2, 4], null);

const globalSearch = document.getElementById('globalSearch');
globalSearch?.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const query = globalSearch.value.trim();
  if (!query) return;
  showView('customers');
  const customerSearch = document.getElementById('customerSearch');
  customerSearch.value = query;
  customerSearch.dispatchEvent(new Event('input'));
});

document.getElementById('printStatement')?.addEventListener('click', () => {
  showView('statements');
  window.setTimeout(() => window.print(), 120);
});

// Mark the demo as usable without a live API. No business data is written to a backend.
window.addEventListener('DOMContentLoaded', () => {
  updateAmount();
});
