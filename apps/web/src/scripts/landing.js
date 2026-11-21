/* ============================================================
   فلزنگار — رفتار وب‌سایت معرفی (Reveal on Scroll)
   ============================================================ */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// انیمیشن ورود عناصر هنگام اسکرول
const revealEls = [...document.querySelectorAll('.reveal')];
if ('IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// نوار پیشرفت نرم نمودارهای میله‌ای
const gauges = [...document.querySelectorAll('.gauge i[data-width]')];
if ('IntersectionObserver' in window && !reduced) {
  const io2 = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.width = entry.target.dataset.width;
        io2.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  gauges.forEach((el) => io2.observe(el));
} else {
  gauges.forEach((el) => { el.style.width = el.dataset.width; });
}

// منوی موبایل
const menuBtn = document.querySelector('.menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
menuBtn?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
mobileMenu?.addEventListener('click', (e) => {
  if (e.target.closest('a')) mobileMenu.classList.remove('open');
});
