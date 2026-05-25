const CACHE = {}
const API = '/api'
const fetch = (endpoint) => globalThis.fetch(`${API}${endpoint !== undefined ? `${endpoint}` : ''}`)
let activeFilter = 'all';


function setFilter(el) {
  document.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
  activeFilter = el.dataset.filter;
  renderVhosts();
}

async function getVhosts() {
  // TODO: handle cache expiration
  if (CACHE['vhosts'] === undefined) {
    const response = await fetch('/vhosts')
    const vhosts = await response.json()

    CACHE['vhosts'] = vhosts
  }

  return CACHE['vhosts']
}

async function renderVhosts() {
  const query = document.getElementById('search').value.toLowerCase();

  const vhosts = await getVhosts()
  const filtered = vhosts.filter(function (v) {
    if (activeFilter === 'enabled' && !v.enabled) return false;
    if (activeFilter === 'disabled' && v.enabled) return false;
    if (query && !v.domain.includes(query) && !v.aliases.some((a) => a.includes(query))) return false;
    return true;
  });


  document.getElementById('stat-total').textContent = vhosts.length;
  document.getElementById('stat-enabled').textContent = vhosts.filter(function (v) { return v.enabled; }).length;
  document.getElementById('stat-ssl').textContent = vhosts.filter(function (v) { return v.ssl; }).length;

  var tbody = document.getElementById('vhost-list');

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty">'
      + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
      + '<p>No virtual hosts found</p>'
      + '</div></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (vhost) {
    var sslCell = vhost.sslExpiry !== undefined
      ? '<span class="ssl-tag">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
      + vhost.sslExpiry
      + '</span>'
      : '<span class="ssl-tag no-ssl">—</span>';

    var aliasCell = vhost.aliases.length
      ? '<div class="domain-alias">' + vhost.aliases.join(', ') + '</div>'
      : '';

    return '<tr>'
      + '<td><div class="domain">' + vhost.domain + '</div>' + aliasCell + '</td>'
      + '<td>' + vhost.port + '</td>'
      + '<td>' + sslCell + '</td>'
      + '<td><span class="badge badge-' + (vhost.enabled ? 'enabled' : 'disabled') + '">' + (vhost.enabled ? 'enabled' : 'disabled') + '</span></td>'
      + '<td style="font-family: monospace; font-size: 12px; color: var(--text-muted)">' + vhost.file + '</td>'
      + '<td><div class="actions">'
      + '<button class="icon-btn" title="Edit" onclick="alert(\'Edit ' + vhost.domain + '\')">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      + '</button>'
      + '<button class="icon-btn" title="' + (vhost.enabled ? 'Disable' : 'Enable') + '" onclick="alert(\'Toggle ' + vhost.domain + '\')">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>'
      + '</button>'
      + '<button class="icon-btn danger" title="Delete" onclick="alert(\'Delete ' + vhost.domain + '\')">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>'
      + '</button>'
      + '</div></td>'
      + '</tr>';
  }).join('');
}

function render() {
  renderVhosts().finally(() => {
    document.getElementById('container').removeAttribute('class')
  })
}

function toggleTheme() {
  var root = document.documentElement;
  var isLight = root.getAttribute('data-theme') === 'light';
  if (isLight) {
    root.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    root.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  var isLight = document.documentElement.getAttribute('data-theme') === 'light';
  document.getElementById('theme-icon-sun').style.display = isLight ? '' : 'none';
  document.getElementById('theme-icon-moon').style.display = isLight ? 'none' : '';
}

(function () {
  var saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  updateThemeIcon();
  render();
})();
