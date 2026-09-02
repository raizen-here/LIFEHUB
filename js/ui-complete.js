import { categories, categoryStatuses, deadlineInfo, formatDate, formatRelative, metadataDefaults, monthStart } from './utils.js';

const navItems = [
  ['dashboard', '⌂', 'Dashboard'], ['inbox', '↓', 'Inbox'], ['games', '◈', 'Games'], ['media', '◉', 'Media'],
  ['learning', '✦', 'Learning'], ['applications', '↗', 'Applications'], ['projects', '□', 'Projects'], ['links', '↗', 'Links'],
  ['wishlist', '♡', 'Wishlist'], ['completed', '✓', 'Completed'], ['statistics', '▥', 'Statistics'], ['settings', '⚙', 'Settings']
];

const routeCategory = {
  games: ['Game'], media: ['Movie', 'Series', 'Anime'], learning: ['Book', 'Course'], applications: ['Application'],
  projects: ['Project'], links: ['Link'], wishlist: ['Wishlist']
};

const filterSets = {
  games: ['All', 'Backlog', 'Playing', 'Paused', 'Completed', 'Dropped'],
  media: ['All', 'Movie', 'Series', 'Anime', 'Watching', 'Completed'],
  learning: ['All', 'Course', 'Book', 'Learning', 'Completed'],
  applications: ['All', 'Researching', 'Preparing', 'Ready to Apply', 'Applied', 'Interview', 'Accepted', 'Rejected', 'Deadline Passed'],
  projects: ['All', 'Idea', 'Planning', 'Building', 'Paused', 'Completed', 'Abandoned'],
  links: ['All', 'Cybersecurity', 'Coding', 'Education', 'Career', 'Scholarships', 'Tools', 'Gaming', 'Design', 'Entertainment', 'Other'],
  wishlist: ['All', 'Must Have', 'High', 'Medium', 'Low', 'Maybe', 'Want', 'Researching', 'Purchased', 'No Longer Want'],
  inbox: ['All', 'Inbox']
};

const sortSets = {
  games: [['updatedAt', 'Recently played'], ['createdAt', 'Recently added'], ['rating', 'Rating'], ['progress', 'Progress'], ['title', 'Alphabetical']],
  media: [['createdAt', 'Recently added'], ['rating', 'Rating'], ['progress', 'Progress'], ['title', 'Alphabetical']],
  learning: [['createdAt', 'Recently added'], ['progress', 'Progress'], ['title', 'Alphabetical']],
  applications: [['deadline', 'Deadline'], ['createdAt', 'Recently added'], ['status', 'Status']],
  projects: [['updatedAt', 'Recently updated'], ['deadline', 'Deadline'], ['progress', 'Progress'], ['title', 'Alphabetical']],
  links: [['createdAt', 'Recently saved'], ['title', 'Alphabetical'], ['linkCategory', 'Category']],
  wishlist: [['priority', 'Priority'], ['price', 'Price'], ['createdAt', 'Recently added']]
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}
function escapeAttribute(value) { return escapeHtml(value); }

export function renderApp(state, actions) {
  const route = state.route;
  const label = navItems.find(([key]) => key === route)?.[2] || 'Dashboard';
  document.querySelector('#section-title').textContent = label;

  const sectionKicker = document.querySelector('#section-kicker');
  sectionKicker.innerHTML = route === 'dashboard' ? '<span>Workspace</span>' : '<a href="#dashboard" class="workspace-link">Workspace</a>';

  const inboxCount = countInbox(state.items);
  document.querySelector('#primary-nav').innerHTML = navItems.map(([key, icon, text]) => `
    <a class="nav-item ${route === key ? 'active' : ''}" href="#${key}" data-route="${key}" aria-current="${route === key ? 'page' : 'false'}">
      <span aria-hidden="true">${icon}</span><span class="nav-label">${text}</span>${key === 'inbox' && inboxCount ? `<b>${inboxCount}</b>` : ''}
    </a>`).join('');

  document.querySelector('#mobile-nav').innerHTML = navItems.slice(0, 5).map(([key, icon, text]) => `
    <a class="mobile-nav-item ${route === key ? 'active' : ''}" href="#${key}" data-route="${key}" aria-current="${route === key ? 'page' : 'false'}">
      <span aria-hidden="true">${icon}</span><small>${text}</small>
    </a>`).join('');

  const page = route === 'dashboard' ? dashboard(state) : route === 'completed' ? completed(state) : route === 'statistics' ? statistics(state) : route === 'settings' ? settings() : library(state, route);
  document.querySelector('#page-content').innerHTML = page;
  decorateCards(state.items);
  bindPageActions(state, actions);
}

function decorateCards(items) {
  document.querySelectorAll('.item-card[data-item-id]').forEach((card) => {
    const item = items.find((entry) => entry.id === card.dataset.itemId);
    if (!item) return;
    const values = [item.metadata?.platform, item.metadata?.genre, item.metadata?.completionType, item.metadata?.mediaType, item.metadata?.source,
      item.metadata?.certification, item.metadata?.technologies, item.metadata?.linkCategory, item.metadata?.priority, item.metadata?.purchaseStatus,
      item.metadata?.rating ? `Rating ${item.metadata.rating}/10` : ''].filter(Boolean);
    if (values.length) {
      const summary = document.createElement('p'); summary.className = 'metadata-summary'; summary.textContent = values.join(' · ');
      card.querySelector('.item-main h3')?.after(summary);
    }
  });
}

function dashboard(state) {
  const active = state.items.filter((item) => ['In Progress', 'Playing', 'Watching', 'Learning', 'Building', 'Preparing'].includes(item.status));
  const completedItems = state.items.filter((item) => item.status === 'Completed').slice(0, 4);
  const upcoming = deadlineItems(state.items).slice(0, 4);
  const prefs = { active: true, upcoming: true, completed: true, statistics: true, inbox: true, ...readDashboardPrefs() };
  return `<section class="hero reveal"><div><p class="eyebrow">${greeting()}, welcome back</p><h1>Your life, in motion.</h1><p class="hero-copy">Everything you want to do. Everything you've done.</p></div><button class="button primary hero-add" data-action="add">＋ Add anything</button></section>
  ${prefs.statistics ? `<section class="stat-strip reveal"><div><span>Total completed</span><strong>${completedItemsCount(state.items)}</strong></div><div><span>This month</span><strong>${state.items.filter((item) => item.status === 'Completed' && item.completedAt >= monthStart()).length}</strong></div><div><span>Currently active</span><strong>${active.length}</strong></div><div><span>Inbox</span><strong>${countInbox(state.items)}</strong></div></section>` : ''}
  <div class="dashboard-grid">${prefs.active ? `<section class="content-section reveal"><div class="section-heading"><div><p class="eyebrow">Right now</p><h2>Currently active</h2></div></div>${active.length ? `<div class="item-list">${active.slice(0, 5).map(itemCard).join('')}</div>` : emptyState('Nothing active yet.', 'Add something you are working toward and it will show up here.')}</section>` : ''}${prefs.completed ? `<section class="content-section reveal"><div class="section-heading"><div><p class="eyebrow">The archive</p><h2>Recently completed</h2></div><a href="#completed" class="text-link">See history →</a></div>${completedItems.length ? `<div class="item-list">${completedItems.map(itemCard).join('')}</div>` : emptyState('Your first achievement is waiting.', 'Finish something small today. It belongs here.')}</section>` : ''}</div>
  ${prefs.upcoming ? `<section class="content-section upcoming-section reveal"><div class="section-heading"><div><p class="eyebrow">Next up</p><h2>Upcoming deadlines</h2></div></div>${upcoming.length ? `<div class="item-list">${upcoming.map(itemCard).join('')}</div>` : emptyState('No deadlines on the horizon.', 'Add a deadline to an application or project and it will appear here.')}</section>` : ''}`;
}

function library(state, route) {
  const source = route === 'inbox' ? state.items.filter((item) => item.status === 'Inbox') : state.items.filter((item) => (routeCategory[route] || []).includes(item.category));
  const filter = state.filter || 'All'; const query = state.query || '';
  const items = sortItems(source.filter((item) => matches(item, filter, query)), state.sort);
  const title = navItems.find(([key]) => key === route)?.[2] || 'Library'; const filters = filterSets[route] || ['All']; const sorts = sortSets[route] || [];
  return `<section class="page-intro reveal"><div><p class="eyebrow">${route === 'inbox' ? 'Unsorted thoughts' : 'Your library'}</p><h1>${title}</h1><p>${route === 'inbox' ? 'Capture first. Decide where it belongs later.' : `A focused view of your ${title.toLowerCase()} and the next things worth your attention.`}</p></div><button class="button primary" data-action="add">＋ Add</button></section><div class="filter-row">${filters.map((value) => `<button class="filter ${filter === value ? 'active' : ''}" data-filter="${escapeAttribute(value)}">${escapeHtml(value)}<span>${value === 'All' ? source.length : source.filter((item) => matches(item, value, query)).length}</span></button>`).join('')}${sorts.length ? `<label class="sort-control">Sort<select data-sort>${sorts.map(([value, text]) => `<option value="${escapeAttribute(value)}" ${state.sort === value ? 'selected' : ''}>${escapeHtml(text)}</option>`).join('')}</select></label>` : ''}</div>${items.length ? `<div class="library-grid">${items.map(itemCard).join('')}</div>` : emptyState(route === 'inbox' ? 'Your inbox is clear. Nice.' : `No ${title.toLowerCase()} here yet.`, query ? 'Try a different search or filter.' : 'Add something and it will appear here.')}`;
}

function completed(state) {
  const filter = state.filter || 'All'; const items = state.items.filter((item) => item.status === 'Completed' && (filter === 'All' || item.category === filter));
  const groups = ['Today', 'This Week', 'This Month', 'This Year', 'Earlier'];
  return `<section class="page-intro reveal"><div><p class="eyebrow">Achievement history</p><h1>Everything you've done.</h1><p>A quiet record of momentum, one completed thing at a time.</p></div><div class="archive-total"><strong>${items.length}</strong><span>completed</span></div></section><div class="filter-row"><button class="filter ${filter === 'All' ? 'active' : ''}" data-filter="All">All</button>${categories.filter((category) => items.some((item) => item.category === category)).map((category) => `<button class="filter ${filter === category ? 'active' : ''}" data-filter="${escapeAttribute(category)}">${escapeHtml(category)}</button>`).join('')}</div>${groups.map((name, index) => { const now = Date.now(); const group = items.filter((item) => { const completedAt = Number(item.completedAt); if (!completedAt) return false; const days = (now - completedAt) / 86400000; return index === 0 ? days < 1 : index === 1 ? days < 7 : index === 2 ? days < 31 : index === 3 ? days < 366 : days >= 366; }); return group.length ? `<section class="history-group"><div class="section-heading"><h2>${name}</h2><span class="muted">${group.length}</span></div><div class="item-list">${group.map(itemCard).join('')}</div></section>` : ''; }).join('') || emptyState('Your first achievement is waiting.', 'Finish something small today. It belongs here.')}`;
}

function statistics(state) {
  const completed = state.items.filter((item) => item.status === 'Completed');
  const byCategory = categories.map((category) => [category, completed.filter((item) => item.category === category).length]).filter(([, count]) => count);
  const max = Math.max(1, ...byCategory.map(([, count]) => count));
  const metric = (label, value) => `<div class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  return `<section class="page-intro reveal"><div><p class="eyebrow">Patterns over time</p><h1>Statistics</h1><p>Useful signals, without turning your life into a spreadsheet.</p></div></section><div class="metric-grid">${metric('Total items', state.items.length)}${metric('Total completed', completed.length)}${metric('Completion rate', state.items.length ? `${Math.round(completed.length / state.items.length * 100)}%` : '0%')}${metric('Currently active', state.items.filter((item) => !['Inbox', 'Completed', 'Dropped', 'Archived'].includes(item.status)).length)}${metric('Games completed', completed.filter((item) => item.category === 'Game').length)}${metric('Media completed', completed.filter((item) => ['Movie', 'Series', 'Anime'].includes(item.category)).length)}${metric('Learning completed', completed.filter((item) => ['Book', 'Course'].includes(item.category)).length)}${metric('Projects completed', completed.filter((item) => item.category === 'Project').length)}</div><section class="chart-panel"><div class="section-heading"><div><p class="eyebrow">Completed items</p><h2>Category distribution</h2></div></div>${byCategory.length ? byCategory.map(([category, count]) => `<div class="bar-row"><span>${escapeHtml(category)}</span><div class="bar-track"><i style="width:${count / max * 100}%"></i></div><strong>${count}</strong></div>`).join('') : emptyState('No patterns yet.', 'Complete a few items and your progress will take shape.')}</section>`;
}

function settings() {
  const prefs = { active: true, upcoming: true, completed: true, statistics: true, inbox: true, ...readDashboardPrefs() };
  return `<section class="page-intro reveal"><div><p class="eyebrow">Personalize your command center</p><h1>Settings</h1><p>Keep LIFEHUB feeling like your space.</p></div></section><div class="settings-grid"><section class="settings-panel"><p class="eyebrow">Dashboard</p><h2>Choose what appears</h2><div class="preference-list">${[['active', 'Currently Active'], ['upcoming', 'Upcoming'], ['completed', 'Recently Completed'], ['statistics', 'Statistics'], ['inbox', 'Inbox']].map(([key, label]) => `<label><input type="checkbox" data-preference="${key}" ${prefs[key] ? 'checked' : ''}>${escapeHtml(label)}</label>`).join('')}</div></section><section class="settings-panel"><p class="eyebrow">Appearance</p><h2>Choose your atmosphere</h2><div class="theme-options"><button class="theme-option" data-theme-choice="dark">Dark <span>Deep and focused</span></button><button class="theme-option" data-theme-choice="light">Light <span>Bright and clear</span></button><button class="theme-option" data-theme-choice="system">System <span>Follow device</span></button></div></section><section class="settings-panel"><p class="eyebrow">Data</p><h2>Your data belongs to you.</h2><p class="muted">Export, restore, or create demonstration records.</p><div class="settings-actions"><button class="button secondary" data-action="export">Export JSON</button><button class="button secondary" data-action="export-csv">Export CSV</button><button class="button secondary" data-action="import">Import JSON</button><button class="button secondary" data-action="demo">Load Demo Data</button><button class="button danger" data-action="clear">Clear all data</button></div></section><section class="settings-panel"><p class="eyebrow">About</p><h2>LIFEHUB <span class="version">v2.0</span></h2><p class="muted">A personal command center for everything you want to do and everything you've done.</p></section></div>`;
}

function readDashboardPrefs() { try { return JSON.parse(localStorage.getItem('lifehub-dashboard') || '{}'); } catch { return {}; } }

function itemCard(item) {
  const deadline = deadlineInfo(item.metadata?.deadline);
  const requirements = Array.isArray(item.metadata?.requirements) ? item.metadata.requirements : [];
  const requirementMarkup = requirements.length ? `<div class="requirements"><span>${requirements.filter((requirement) => requirement.completed).length} / ${requirements.length} complete</span>${requirements.map((requirement) => `<label><input type="checkbox" data-requirement="${escapeAttribute(requirement.id)}" data-item-id="${escapeAttribute(item.id)}" ${requirement.completed ? 'checked' : ''}>${escapeHtml(requirement.text)}</label>`).join('')}</div>` : '';
  const link = item.url ? `<a class="text-link item-link" href="${escapeAttribute(item.url)}" target="_blank" rel="noopener noreferrer">Open link ↗</a>` : '';
  const progress = Math.max(0, Math.min(100, Number(item.progress) || 0));
  const statusClass = String(item.status || '').toLowerCase().replaceAll(' ', '-').replace(/[^a-z0-9-]/g, '');
  return `<article class="item-card" data-item-id="${escapeAttribute(item.id)}"><div class="item-icon">${iconFor(item.category)}</div><div class="item-main"><div class="item-top"><span class="category-label">${escapeHtml(item.category)}</span><span class="status-label ${statusClass}">${escapeHtml(item.status)}</span>${deadline.days !== null ? `<span class="deadline-label ${deadline.tone}">${escapeHtml(deadline.label)}</span>` : ''}</div><h3>${escapeHtml(item.title)}</h3>${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ''}${item.metadata?.description ? `<p>${escapeHtml(item.metadata.description)}</p>` : ''}${item.metadata?.organization ? `<p>${escapeHtml(item.metadata.organization)}</p>` : ''}${progress ? `<div class="progress-line" aria-label="${progress}% complete"><span style="width:${progress}%"></span></div>` : ''}${requirementMarkup}<div class="item-meta"><span>${escapeHtml(formatRelative(item.updatedAt))}</span>${item.completedAt ? `<span>Completed ${escapeHtml(formatDate(item.completedAt))}</span>` : ''}${link}</div></div><div class="item-actions"><button class="icon-button complete-button" data-action="complete" data-id="${escapeAttribute(item.id)}" aria-label="Complete ${escapeAttribute(item.title)}">✓</button><button class="icon-button" data-action="edit" data-id="${escapeAttribute(item.id)}" aria-label="Edit ${escapeAttribute(item.title)}">✎</button><button class="icon-button" data-action="delete" data-id="${escapeAttribute(item.id)}" aria-label="Delete ${escapeAttribute(item.title)}">×</button></div></article>`;
}

function emptyState(title, copy) { return `<div class="empty-state"><div class="empty-mark">＋</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></div>`; }
function iconFor(category) { return ({ Game: '◈', Movie: '◉', Series: '▣', Anime: '✦', Book: '▤', Course: '⌘', Application: '↗', Project: '□', Link: '↗', Wishlist: '♡', Other: '•' }[category] || '•'); }
function countInbox(items) { return items.filter((item) => item.status === 'Inbox').length; }
function completedItemsCount(items) { return items.filter((item) => item.status === 'Completed').length; }
function deadlineItems(items) { return items.filter((item) => item.metadata?.deadline && item.status !== 'Completed').sort((a, b) => new Date(a.metadata.deadline) - new Date(b.metadata.deadline)); }
function matches(item, filter, query) {
  const filterMatch = filter === 'All' || item.status === filter || item.category === filter || item.metadata?.linkCategory === filter || item.metadata?.priority === filter || item.metadata?.purchaseStatus === filter || item.metadata?.mediaType === filter;
  if (!filterMatch) return false;
  if (!query) return true;
  return [item.title, item.notes, item.category, item.status, ...(item.tags || []), JSON.stringify(item.metadata || {})].join(' ').toLowerCase().includes(query.toLowerCase());
}
function sortItems(items, sortKey = 'createdAt') {
  const ascending = ['title', 'status', 'linkCategory'].includes(sortKey);
  return [...items].sort((a, b) => {
    const av = sortValue(a, sortKey), bv = sortValue(b, sortKey);
    if (typeof av === 'string' || typeof bv === 'string') return ascending ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    return ascending ? Number(av || 0) - Number(bv || 0) : Number(bv || 0) - Number(av || 0);
  });
}
function sortValue(item, key) { return key in item ? item[key] : item.metadata?.[key] ?? ''; }
function greeting() { const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'; }

function bindPageActions(state, actions) {
  const root = document.querySelector('#page-content');
  root.querySelectorAll('[data-action="add"]').forEach((button) => button.addEventListener('click', actions.onAdd));
  root.querySelectorAll('[data-action="complete"]').forEach((button) => button.addEventListener('click', () => actions.onComplete(button.dataset.id)));
  root.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener('click', () => actions.onEdit(button.dataset.id)));
  root.querySelectorAll('[data-action="delete"]').forEach((button) => button.addEventListener('click', () => actions.onDelete(button.dataset.id)));
  root.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter; renderApp(state, actions); }));
  root.querySelector('[data-sort]')?.addEventListener('change', (event) => { state.sort = event.target.value; renderApp(state, actions); });
  root.querySelectorAll('[data-requirement]').forEach((input) => input.addEventListener('change', () => actions.onRequirement(input.dataset.itemId, input.dataset.requirement, input.checked)));
  root.querySelectorAll('[data-preference]').forEach((input) => input.addEventListener('change', () => { const prefs = readDashboardPrefs(); prefs[input.dataset.preference] = input.checked; localStorage.setItem('lifehub-dashboard', JSON.stringify(prefs)); renderApp(state, actions); }));
  root.querySelectorAll('[data-theme-choice]').forEach((button) => button.addEventListener('click', () => actions.onTheme(button.dataset.themeChoice)));
  root.querySelector('[data-action="export"]')?.addEventListener('click', actions.onExport);
  root.querySelector('[data-action="export-csv"]')?.addEventListener('click', actions.onExportCsv);
  root.querySelector('[data-action="import"]')?.addEventListener('click', actions.onImport);
  root.querySelector('[data-action="demo"]')?.addEventListener('click', actions.onDemo);
  root.querySelector('[data-action="clear"]')?.addEventListener('click', actions.onClear);
}
