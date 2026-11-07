const CACHE = {}
const API = '/api'
const fetch = (endpoint, opts) => globalThis.fetch(`${API}${endpoint !== undefined ? `${endpoint}` : ''}`, opts)
let activeFilter = 'all';


function setFilter(el) {
  document.querySelectorAll('.filter-tab').forEach(function (t) { t.classList.remove('active'); });
  el.classList.add('active');
  activeFilter = el.dataset.filter;
  renderVhosts();
}

async function getVhosts(opts = {}) {
  // TODO: handle cache expiration
  if (CACHE['vhosts'] === undefined || opts.bypassCache) {
    const response = await fetch('/vhosts')
    const vhosts = await response.json()

    CACHE['vhosts'] = vhosts
  }

  return CACHE['vhosts']
}

async function toggleVhost(id, value) {
  const resp = await fetch(`/vhosts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      enabled: value,
    }),
  })

  await renderVhosts({ bypassCache: true })
}

async function destroyVhost(id) {
  const vhost = (await getVhosts()).find(vhost => vhost.id === id)
  confirm(`Are you sure you want to destroy the vhost: ${vhost.conf.domain}`)

  await fetch(`/vhosts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })

  await renderVhosts({ bypassCache: true })
}

async function renderVhosts(opts) {
  const query = document.getElementById('search').value.toLowerCase();

  const vhosts = await getVhosts(opts)
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
    var sslCell = vhost.conf.sslExpiry !== undefined
      ? '<span class="ssl-tag">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
      + new Date(vhost.conf.sslExpiry).toDateString()
      + '</span>'
      : '<span class="ssl-tag no-ssl">—</span>';

    var aliasCell = vhost.conf.aliases.length
      ? '<div class="domain-alias">' + vhost.conf.aliases.join(', ') + '</div>'
      : '';

    return '<tr>'
      + '<td><div class="domain">' + vhost.conf.domain + '</div>' + aliasCell + '</td>'
      + '<td>' + vhost.conf.port + '</td>'
      + '<td>' + sslCell + '</td>'
      + '<td><span class="badge badge-' + (vhost.enabled ? 'enabled' : 'disabled') + '">' + (vhost.enabled ? 'enabled' : 'disabled') + '</span></td>'
      + '<td style="font-family: monospace; font-size: 12px; color: var(--text-muted)">' + vhost.fileName + '</td>'
      + '<td><div class="actions">'
      + '<button class="icon-btn" title="Edit" onclick="alert(\'Edit ' + vhost.conf.domain + '\')">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
      + '</button>'
      + '<button class="icon-btn" title="' + (vhost.enabled ? 'Disable' : 'Enable') + '" onclick="toggleVhost(' + `'${vhost.id}', ${!vhost.enabled}` + ')">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>'
      + '</button>'
      + '<button class="icon-btn danger" title="Destroy" onclick="destroyVhost(' + `'${vhost.id}'` + ')">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>'
      + '</button>'
      + '</div></td>'
      + '</tr>';
  }).join('');
}

async function getNginxHealth() {
  const response = await fetch('/nginx/health')
  const nginxHealth = await response.json()

  return nginxHealth
}

async function renderNginxHealth() {
  const health = await getNginxHealth()
  const nginxStatusNode = document.getElementById('nginx-status')
  let text = 'nginx: '

  if (health.active === true) {
    nginxStatusNode.classList.add('badge-enabled')
    text = text.concat('running')
  } else {
    nginxStatusNode.classList.add('badge-disabled')
    if (health.installed) {
      text = text.concat('stopped')
    } else {
      text = text.concat('not installed')
    }
  }

  nginxStatusNode.innerText = text
}

function render() {
  // update nginxHealth every minute
  renderNginxHealth().finally(() => {
    setInterval(renderNginxHealth, 1000 * 60)
  })

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

function updateVhostModeUI() {
  const selectedMode = document.querySelector('input[name="mode"]:checked')?.value ?? 'static'
  const rootField = document.querySelector('.field-root')
  const proxyField = document.querySelector('.field-proxy')
  const rootInput = document.querySelector('input[name="root"]')
  const proxyInput = document.querySelector('input[name="proxy"]')
  const optionPills = document.querySelectorAll('.option-pill')

  optionPills.forEach((pill) => {
    const input = pill.querySelector('input[type="radio"]')
    pill.classList.toggle('active', input.checked)
  })

  if (selectedMode === 'proxy') {
    rootField.classList.add('hidden')
    proxyField.classList.remove('hidden')
    rootInput.disabled = true
    rootInput.value = ''
    proxyInput.disabled = false
    proxyInput.focus()
  } else {
    proxyField.classList.add('hidden')
    rootField.classList.remove('hidden')
    proxyInput.disabled = true
    proxyInput.value = ''
    rootInput.disabled = false
    rootInput.focus()
  }
}

function bindVhostModeControls() {
  document.querySelectorAll('input[name="mode"]').forEach((radio) => {
    radio.addEventListener('change', updateVhostModeUI)
  })
}

function openVhostModal() {
  const drawer = document.getElementById('vhost-drawer')
  drawer.classList.remove('hidden')
  drawer.setAttribute('aria-hidden', 'false')
  updateVhostModeUI()
  const firstInput = document.querySelector('#vhost-form input[name="domain"]')
  firstInput.focus()
}

function closeVhostModal() {
  const drawer = document.getElementById('vhost-drawer')
  drawer.classList.add('hidden')
  drawer.setAttribute('aria-hidden', 'true')
  document.getElementById('vhost-form').reset()
  document.querySelector('#vhost-form input[name="port"]').value = 80
  document.querySelector('#vhost-form input[name="enabled"]').checked = true
  document.querySelector('input[name="mode"][value="static"]').checked = true
  updateVhostModeUI()
}

async function submitVhostForm(event) {
  event.preventDefault()

  const form = event.currentTarget
  const formData = new FormData(form)
  const mode = formData.get('mode') ?? 'static'
  const payload = {
    domain: (formData.get('domain') ?? '').toString().trim(),
    aliases: (formData.get('aliases') ?? '').toString().split(',').map(value => value.trim()).filter(Boolean),
    port: Number(formData.get('port') ?? 80),
    enabled: formData.get('enabled') === 'on',
    root: mode === 'static' ? ((formData.get('root') ?? '').toString().trim() || undefined) : undefined,
    proxy: mode === 'proxy' ? ((formData.get('proxy') ?? '').toString().trim() || undefined) : undefined,
  }

  if (!payload.domain) {
    alert('Domain is required')
    return
  }

  if (mode === 'static' && !payload.root) {
    alert('Root path is required for a static site')
    return
  }

  if (mode === 'proxy' && !payload.proxy) {
    alert('Proxy target is required for a proxy app')
    return
  }

  const response = await fetch('/vhosts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    alert(body.message || 'Unable to create the virtual host')
    return
  }

  closeVhostModal()
  await renderVhosts({ bypassCache: true })
}

(function () {
  bindVhostModeControls()
  updateVhostModeUI()
})();
