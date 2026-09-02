import { categoryStatuses, metadataDefaults, statuses, uid } from './utils.js';

const fieldSets = {
  Game: [['platform', 'Platform'], ['genre', 'Genre'], ['completionType', 'Completion type', ['Main Story', 'Story + Extras', '100%', 'Multiplayer', 'Other']], ['rating', 'Rating'], ['startedAt', 'Started date', 'date'], ['completedAt', 'Completed date', 'date']],
  Movie: [['mediaType', 'Media type', ['Movie', 'Series', 'Anime']], ['rating', 'Rating'], ['startedAt', 'Started date', 'date'], ['completedAt', 'Completed date', 'date']],
  Series: [['mediaType', 'Media type', ['Series', 'Anime']], ['season', 'Season'], ['currentEpisode', 'Current episode'], ['totalEpisodes', 'Total episodes'], ['rating', 'Rating'], ['startedAt', 'Started date', 'date'], ['completedAt', 'Completed date', 'date']],
  Anime: [['mediaType', 'Media type', ['Anime']], ['season', 'Season'], ['currentEpisode', 'Current episode'], ['totalEpisodes', 'Total episodes'], ['rating', 'Rating'], ['startedAt', 'Started date', 'date'], ['completedAt', 'Completed date', 'date']],
  Book: [['source', 'Source / platform'], ['certification', 'Certification'], ['certificateUrl', 'Certificate URL'], ['startedAt', 'Started date', 'date'], ['completedAt', 'Completed date', 'date']],
  Course: [['source', 'Source / platform'], ['certification', 'Certification'], ['certificateUrl', 'Certificate URL'], ['startedAt', 'Started date', 'date'], ['completedAt', 'Completed date', 'date']],
  Application: [['organization', 'Organization'], ['deadline', 'Deadline', 'date'], ['requirements', 'Requirements', 'requirements']],
  Project: [['description', 'Description', 'textarea'], ['technologies', 'Technologies'], ['deadline', 'Deadline', 'date'], ['githubUrl', 'GitHub URL'], ['demoUrl', 'Demo URL']],
  Link: [['linkCategory', 'Link category', ['Cybersecurity', 'Coding', 'Education', 'Career', 'Scholarships', 'Tools', 'Gaming', 'Design', 'Entertainment', 'Other']], ['description', 'Description', 'textarea'], ['whySaved', 'Why saved', 'textarea']],
  Wishlist: [['price', 'Estimated price'], ['priority', 'Priority', ['Must Have', 'High', 'Medium', 'Low', 'Maybe']], ['purchaseStatus', 'Purchase status', ['Want', 'Researching', 'Purchased', 'No Longer Want']]]
};

export function renderMetadataFields(container, category, metadata = {}) {
  const status = document.querySelector('#item-status'); const options = categoryStatuses[category] || statuses; const previousStatus = status.value; status.innerHTML = options.map((option) => `<option>${option}</option>`).join(''); status.value = options.includes(previousStatus) ? previousStatus : options[0];
  const current = { ...metadataDefaults[category], ...metadata };
  container.innerHTML = (fieldSets[category] || []).map(([key, label, kind]) => {
    if (kind === 'requirements') return requirementsField(current.requirements);
    const value = current[key] || '';
    if (kind === 'textarea') return `<label class="field">${label}<textarea data-meta="${key}" rows="3">${escapeHtml(value)}</textarea></label>`;
    if (Array.isArray(kind)) return `<label class="field">${label}<select data-meta="${key}">${kind.map((option) => `<option ${value === option ? 'selected' : ''}>${option}</option>`).join('')}</select></label>`;
    return `<label class="field">${label}<input data-meta="${key}" type="${kind === 'date' ? 'date' : 'text'}" value="${escapeHtml(value)}"></label>`;
  }).join('');
  container.querySelector('[data-requirement-add]')?.addEventListener('click', () => { addRequirement(container); });
  container.querySelectorAll('[data-requirement-delete]').forEach((button) => button.addEventListener('click', () => { button.closest('.requirement-row').remove(); syncRequirements(container); }));
  container.querySelectorAll('[data-requirement-completed]').forEach((input) => input.addEventListener('change', () => syncRequirements(container)));
  container.querySelectorAll('[data-requirement-text]').forEach((input) => input.addEventListener('input', () => syncRequirements(container)));
}

function requirementsField(requirements) { const list = Array.isArray(requirements) ? requirements : []; return `<fieldset class="requirements-editor"><legend>Requirements</legend><div data-requirement-list>${list.map(requirementRow).join('')}</div><input type="hidden" data-meta="requirements" value="${escapeHtml(JSON.stringify(list))}"><button class="button secondary" type="button" data-requirement-add>＋ Add requirement</button></fieldset>`; }
function requirementRow(requirement) { return `<div class="requirement-row"><input type="checkbox" aria-label="Complete requirement" data-requirement-completed ${requirement.completed ? 'checked' : ''}><input type="text" aria-label="Requirement text" data-requirement-text maxlength="160" value="${escapeHtml(requirement.text || '')}" required><button class="icon-button" type="button" data-requirement-delete aria-label="Delete requirement">×</button></div>`; }
function addRequirement(container) { const list = container.querySelector('[data-requirement-list]'); const wrapper = document.createElement('div'); wrapper.innerHTML = requirementRow({ id: uid(), text: '', completed: false }); const row = wrapper.firstElementChild; list.append(row); row.querySelector('[data-requirement-delete]').addEventListener('click', () => { row.remove(); syncRequirements(container); }); row.querySelector('[data-requirement-completed]').addEventListener('change', () => syncRequirements(container)); row.querySelector('[data-requirement-text]').addEventListener('input', () => syncRequirements(container)); row.querySelector('[data-requirement-text]').focus(); syncRequirements(container); }
function syncRequirements(container) { const values = [...container.querySelectorAll('.requirement-row')].map((row) => ({ id: row.querySelector('[data-requirement-text]').dataset.requirementId || uid(), text: row.querySelector('[data-requirement-text]').value.trim(), completed: row.querySelector('[data-requirement-completed]').checked })).filter((requirement) => requirement.text); values.forEach((requirement, index) => { const input = container.querySelectorAll('[data-requirement-text]')[index]; input.dataset.requirementId = requirement.id; }); container.querySelector('[data-meta="requirements"]').value = JSON.stringify(values); }
function escapeHtml(value) { return String(value).replace(/[&<>\'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
