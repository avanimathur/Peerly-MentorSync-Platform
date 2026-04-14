const API = 'http://localhost:5000/api';

// ── Path helpers (works whether served from /frontend/ or /frontend/pages/) ──
function rootPath(file) {
  const inPages = window.location.pathname.includes('/pages/');
  return inPages ? `../${file}` : file;
}
function pagePath(file) {
  const inPages = window.location.pathname.includes('/pages/');
  return inPages ? file : `pages/${file}`;
}

// ── Auth helpers ──
const getToken = () => localStorage.getItem('peerly_token');
const getUser = () => { try { return JSON.parse(localStorage.getItem('peerly_user')); } catch { return null; } };
const setAuth = (token, user) => { localStorage.setItem('peerly_token', token); localStorage.setItem('peerly_user', JSON.stringify(user)); };
const clearAuth = () => { localStorage.removeItem('peerly_token'); localStorage.removeItem('peerly_user'); };
const requireAuth = () => {
  if (!getToken()) { window.location.href = rootPath('login.html'); return false; }
  return true;
};
const requireGuest = () => {
  if (getToken()) window.location.href = pagePath('dashboard.html');
};

// ── API fetch wrapper ──
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  if (options.body instanceof FormData) delete headers['Content-Type'];
  const res = await fetch(API + path, { ...options, headers });
  if (res.status === 401) { clearAuth(); window.location.href = rootPath('login.html'); return; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Toast ──
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Avatar HTML ──
function avatarHTML(user) {
  const name = user?.name || '?';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (user?.avatar) {
    const src = user.avatar.startsWith('/') ? 'http://localhost:5000' + user.avatar : user.avatar;
    return `<img src="${src}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  }
  return `<span>${initials}</span>`;
}

// ── Time formatting ──
function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Stars ──
function starsHTML(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) html += `<span style="color:${i <= Math.round(rating) ? '#f39c12' : '#d1d5db'}">★</span>`;
  return html;
}

// ── Modal helpers ──
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden')); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });

// ── Logout ──
function logout() { clearAuth(); window.location.href = rootPath('login.html'); }

// ── Sidebar (role-aware) ──
function buildSidebar(activePage) {
  const user = getUser();
  if (!user) return;
  const isMentor = user.role === 'mentor';
  const isMentee = user.role === 'mentee';
  const isAdmin  = user.role === 'admin';

  const mainItems = [
    { href: 'dashboard.html', icon: '⊞', label: 'Dashboard', key: 'dashboard' },
    // Only mentees search for mentors
    ...(isMentee || isAdmin ? [{ href: 'mentors.html', icon: '👥', label: 'Find Mentors', key: 'mentors' }] : []),
    { href: 'requests.html', icon: '📨', label: isMentor ? 'Requests' : 'My Requests', key: 'requests' },
    { href: 'sessions.html', icon: '📅', label: 'Sessions', key: 'sessions' },
    { href: 'messages.html', icon: '💬', label: 'Messages', key: 'messages', badge: true },
  ];

  const navItems = [
    { label: 'Main', items: mainItems },
    { label: 'Growth', items: [
      { href: 'goals.html',     icon: '🎯', label: 'Goals',     key: 'goals' },
      { href: 'resources.html', icon: '📚', label: 'Resources', key: 'resources' },
      { href: 'community.html', icon: '🏛️', label: 'Community', key: 'community' },
    ]},
    { label: 'Account', items: [
      { href: 'profile.html', icon: '👤', label: 'Profile', key: 'profile' },
      ...(isAdmin ? [{ href: 'admin.html', icon: '🛡️', label: 'Admin', key: 'admin' }] : []),
    ]}
  ];

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const roleDot = isMentor ? '#00C896' : isMentee ? '#6C63FF' : '#e74c3c';

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">P</div>
      <div class="logo-text">Peerly</div>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav"></nav>
    <div class="sidebar-footer">
      <a href="profile.html" class="sidebar-user" style="text-decoration:none">
        <div class="avatar avatar-sm">${avatarHTML(user)}</div>
        <div style="flex:1;min-width:0">
          <div class="user-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</div>
          <div class="user-role" style="display:flex;align-items:center;gap:4px">
            <span style="width:7px;height:7px;border-radius:50%;background:${roleDot};flex-shrink:0"></span>
            ${user.role}
          </div>
        </div>
      </a>
      <button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center;margin-top:8px;color:var(--danger)" onclick="logout()">⎋ Sign out</button>
    </div>`;

  const nav = document.getElementById('sidebar-nav');
  navItems.forEach(section => {
    const sec = document.createElement('div');
    sec.className = 'nav-section';
    sec.innerHTML = `<div class="nav-section-label">${section.label}</div>`;
    section.items.forEach(item => {
      const a = document.createElement('a');
      a.href = item.href;
      a.className = `nav-item ${item.key === activePage ? 'active' : ''}`;
      a.innerHTML = `<span class="nav-icon">${item.icon}</span>${item.label}` +
        (item.badge ? '<span class="nav-badge hidden" id="msg-badge">0</span>' : '');
      sec.appendChild(a);
    });
    nav.appendChild(sec);
  });

  loadUnreadCounts();
}

async function loadUnreadCounts() {
  try {
    const [md, nd] = await Promise.all([
      apiFetch('/messages/unread/count').catch(() => ({ count: 0 })),
      apiFetch('/notifications/unread/count').catch(() => ({ count: 0 }))
    ]);
    const badge = document.getElementById('msg-badge');
    if (badge && md.count > 0) { badge.textContent = md.count; badge.classList.remove('hidden'); }
    const nb = document.getElementById('notif-badge');
    if (nb && nd.count > 0) { nb.textContent = nd.count; nb.classList.remove('hidden'); }
  } catch {}
}

// ── Notifications panel ──
async function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    try {
      const notifs = await apiFetch('/notifications');
      panel.innerHTML = `
        <div class="notif-header">
          <span class="font-semibold">Notifications</span>
          <button class="btn btn-ghost btn-sm" onclick="markAllRead()">Mark all read</button>
        </div>
        <div class="notif-list">
          ${notifs.length ? notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotif('${n._id}','${n.link || ''}')">
              ${!n.read ? '<div class="notif-dot"></div>' : '<div style="width:8px"></div>'}
              <div>
                <div class="notif-title">${n.title}</div>
                <div class="notif-msg">${n.message}</div>
                <div class="notif-time">${timeAgo(n.createdAt)}</div>
              </div>
            </div>`).join('')
          : '<div style="padding:24px;text-align:center;color:var(--gray-500)">No notifications</div>'}
        </div>`;
    } catch {}
  }
}

async function handleNotif(id, link) {
  try { await apiFetch(`/notifications/${id}/read`, { method: 'PUT' }); } catch {}
  if (link) window.location.href = link;
}

async function markAllRead() {
  try { await apiFetch('/notifications/read/all', { method: 'PUT' }); } catch {}
  document.getElementById('notif-panel')?.classList.add('hidden');
  document.getElementById('notif-badge')?.classList.add('hidden');
}

function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }

document.addEventListener('click', e => {
  if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-panel')) {
    document.getElementById('notif-panel')?.classList.add('hidden');
  }
  if (!e.target.closest('.sidebar') && !e.target.closest('.hamburger')) {
    document.getElementById('sidebar')?.classList.remove('open');
  }
});
