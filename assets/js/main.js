// Dark mode
const html = document.documentElement;
const saved = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', saved);

function toggleTheme() {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = next === 'dark' ? '☀️ Sáng' : '🌙 Tối';
  });
}

// Sidebar mobile toggle
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}

// Copy code button
function initCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    const header = pre.querySelector('.code-header');
    const btn = header?.querySelector('.copy-btn');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText || '';
      await navigator.clipboard.writeText(code).catch(() => {});
      btn.textContent = '✓ Đã copy';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  });
}

// Active nav link
function setActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href')?.split('/').pop();
    link.classList.toggle('active', href === path);
  });
}

// Reading progress bar
function initProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;background:#0ea5e9;z-index:9999;transition:width 0.1s;width:0';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCopyButtons();
  setActiveNav();
  initProgress();
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = saved === 'dark' ? '☀️ Sáng' : '🌙 Tối';
    btn.addEventListener('click', toggleTheme);
  });
  document.querySelector('.sidebar-toggle')?.addEventListener('click', toggleSidebar);
  // Close sidebar when clicking outside
  document.addEventListener('click', e => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
      sidebar.classList.remove('open');
    }
  });
});
