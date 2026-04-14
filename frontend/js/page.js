// Page shell builder - call initPage(activePage, pageTitle) at top of each page script
function initPage(activePage, pageTitle) {
  if (!requireAuth()) return;
  buildSidebar(activePage);

  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.innerHTML = `
      <div class="topbar-left">
        <button class="hamburger btn btn-ghost btn-icon" onclick="toggleSidebar()">☰</button>
        <span class="topbar-title">${pageTitle}</span>
      </div>
      <div class="topbar-right" style="position:relative">
        <button class="btn btn-ghost btn-icon" id="notif-btn" onclick="toggleNotifications()" style="position:relative">
          🔔
          <span class="nav-badge hidden" id="notif-badge" style="position:absolute;top:2px;right:2px;min-width:16px;height:16px;font-size:10px;padding:0 4px;display:flex;align-items:center;justify-content:center">0</span>
        </button>
        <div class="notif-dropdown hidden" id="notif-panel"></div>
      </div>`;
  }
}
