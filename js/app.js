import { database } from './database.js';
import { renderApp } from './ui-complete.js';
import { renderMetadataFields } from './metadata-form.js';

import {
	applyTheme,
	categories,
	categoryStatuses,
	normalizeItem,
	parseTags,
	routeByCategory,
	safeUrl,
	statuses,
	uid
} from './utils.js';


/* =========================================================
   STATE
   ========================================================= */

const state = {
	items: [],
	route: getRouteFromUrl(),
	filter: 'All',
	sort: 'createdAt',
	theme: localStorage.getItem('lifehub-theme') || 'dark'
};


/* =========================================================
   ROUTING
   ========================================================= */

/*
 * The URL is the single source of truth.
 *
 * Example:
 *
 * #dashboard
 * #games
 * #media
 * #learning
 * #applications
 */

function getRouteFromUrl() {
	const route = window.location.hash.slice(1).trim();

	return route || 'dashboard';
}


/*
 * Only allow known LIFEHUB routes.
 *
 * This prevents a broken URL from producing a
 * completely empty application.
 */

const VALID_ROUTES = new Set([
	'dashboard',
	'inbox',
	'games',
	'media',
	'learning',
	'applications',
	'projects',
	'links',
	'wishlist',
	'completed',
	'statistics',
	'settings'
]);


function normalizeRoute(route) {
	return VALID_ROUTES.has(route)
		? route
		: 'dashboard';
}


/*
 * Main navigation function.
 *
 * IMPORTANT:
 * We update state BEFORE rendering.
 *
 * This prevents the old route from being rendered
 * after the user clicks a navigation item.
 */

function navigate(route) {
	const nextRoute = normalizeRoute(route);

	// Close mobile navigation immediately.
	document.body.classList.remove('nav-open');

	// Reset page controls when changing sections.
	state.filter = 'All';
	state.sort = 'createdAt';

	// Update internal state FIRST.
	state.route = nextRoute;

	// Update browser URL.
	const nextHash = `#${nextRoute}`;

	if (window.location.hash !== nextHash) {
		window.location.hash = nextHash;
	}

	// Render using the new route.
	render();
}


/*
 * Browser back/forward buttons.
 *
 * Android/browser can change the hash without going
 * through navigate(), so we synchronize here.
 */

window.addEventListener('hashchange', () => {
	const route = normalizeRoute(
		getRouteFromUrl()
	);

	state.route = route;
	state.filter = 'All';
	state.sort = 'createdAt';

	document.body.classList.remove('nav-open');

	render();
});


/* =========================================================
   ANDROID BACK BUTTON
   ========================================================= */

window.lifehubHandleBackButton = function () {

	/*
	 * 1. Close an open modal first.
	 */

	const dialogs = Array.from(
		document.querySelectorAll('dialog[open]')
	);

	if (dialogs.length > 0) {
		dialogs[0].close();
		return 'handled';
	}


	/*
	 * 2. Close mobile navigation.
	 */

	if (
		document.body.classList.contains(
			'nav-open'
		)
	) {
		document.body.classList.remove(
			'nav-open'
		);

		return 'handled';
	}


	/*
	 * 3. Go back to Dashboard.
	 */

	if (state.route !== 'dashboard') {
		navigate('dashboard');
		return 'handled';
	}


	/*
	 * 4. Return null so Android can exit.
	 */

	return null;
};


/* =========================================================
   BOOT
   ========================================================= */

async function boot() {

	/*
	 * Apply saved theme.
	 */

	applyTheme(state.theme);


	/*
	 * Load database.
	 */

	state.items = await database.getAll();

	window.lifehubItems = state.items;


	/*
	 * Category select.
	 */

	const categorySelect =
		document.querySelector(
			'#item-category'
		);

	if (categorySelect) {

		categorySelect.innerHTML =
			categories
				.map(
					(category) =>
						`<option value="${escapeAttribute(category)}">${escapeHtml(category)}</option>`
				)
				.join('');
	}


	/*
	 * Status select.
	 */

	const statusSelect =
		document.querySelector(
			'#item-status'
		);

	if (statusSelect) {

		statusSelect.innerHTML =
			statuses
				.map(
					(status) =>
						`<option value="${escapeAttribute(status)}">${escapeHtml(status)}</option>`
				)
				.join('');
	}


	/*
	 * Metadata fields.
	 */

	categorySelect?.addEventListener(
		'change',
		() => {

			const category =
				categorySelect.value;

			updateStatusOptions(category);

			renderMetadataFields(
				document.querySelector(
					'#metadata-fields'
				),
				category
			);
		}
	);


	if (categorySelect) {

		renderMetadataFields(
			document.querySelector(
				'#metadata-fields'
			),
			categorySelect.value
		);
	}


	/* =====================================================
	   GLOBAL BUTTONS
	   ===================================================== */

	document
		.querySelector('#global-add')
		?.addEventListener(
			'click',
			() => openItemModal()
		);


	document
		.querySelector('#search-trigger')
		?.addEventListener(
			'click',
			openSearch
		);


	document
		.querySelector('#theme-toggle')
		?.addEventListener(
			'click',
			toggleTheme
		);


	document
		.querySelector('#profile-button')
		?.addEventListener(
			'click',
			() => navigate('settings')
		);


	/* =====================================================
	   MOBILE MENU
	   ===================================================== */

	document
		.querySelector('#mobile-menu')
		?.addEventListener(
			'click',
			(event) => {

				event.preventDefault();
				event.stopPropagation();

				document.body.classList.toggle(
					'nav-open'
				);
			}
		);


	/*
	 * GLOBAL NAVIGATION CLICK HANDLER
	 *
	 * This is the important part.
	 *
	 * The navigation is dynamically generated by
	 * ui-complete.js, so we use event delegation.
	 */

	document.addEventListener(
		'click',
		(event) => {

			const target = event.target;


			/*
			 * Ignore clicks if there is no open
			 * mobile navigation.
			 */

			const navIsOpen =
				document.body.classList.contains(
					'nav-open'
				);


			/*
			 * Navigation link.
			 *
			 * This catches:
			 *
			 * .nav-item
			 * .mobile-nav-item
			 * .brand
			 */

			const navigationLink =
				target.closest(
					'.nav-item, .mobile-nav-item, .brand'
				);


			if (navigationLink) {

				const href =
					navigationLink.getAttribute(
						'href'
					);


				if (
					href &&
					href.startsWith('#')
				) {

					event.preventDefault();
					event.stopPropagation();

					const route =
						href.slice(1);

					navigate(route);

					return;
				}
			}


			/*
			 * If mobile navigation is not open,
			 * nothing else needs to happen.
			 */

			if (!navIsOpen) {
				return;
			}


			/*
			 * Clicking the menu button itself
			 * should not close/reopen it.
			 */

			if (
				target.closest(
					'#mobile-menu'
				)
			) {
				return;
			}


			/*
			 * Clicking outside the sidebar closes it.
			 */

			if (
				!target.closest(
					'.sidebar'
				)
			) {

				document.body.classList.remove(
					'nav-open'
				);
			}
		},
		true
	);


	/* =====================================================
	   PROGRESS
	   ===================================================== */

	document
		.querySelector('#item-progress')
		?.addEventListener(
			'input',
			(event) => {

				const output =
					document.querySelector(
						'#progress-value'
					);

				if (output) {

					output.textContent =
						`${event.target.value}%`;
				}
			}
		);


	/* =====================================================
	   ITEM FORM
	   ===================================================== */

	document
		.querySelector('#item-form')
		?.addEventListener(
			'submit',
			saveItem
		);


	/* =====================================================
	   SEARCH
	   ===================================================== */

	document
		.querySelector('#global-search')
		?.addEventListener(
			'input',
			searchItems
		);


	/* =====================================================
	   IMPORT
	   ===================================================== */

	document
		.querySelector('#import-file')
		?.addEventListener(
			'change',
			importBackup
		);


	/* =====================================================
	   MODAL CLOSE BUTTONS
	   ===================================================== */

	document
		.querySelectorAll(
			'[data-modal-close]'
		)
		.forEach(
			(button) => {

				button.addEventListener(
					'click',
					() => {

						button
							.closest('dialog')
							?.close();
					}
				);
			}
		);


	/* =====================================================
	   KEYBOARD
	   ===================================================== */

	document.addEventListener(
		'keydown',
		handleShortcut
	);


	/* =====================================================
	   SERVICE WORKER
	   ===================================================== */

	if (
		'serviceWorker' in navigator
	) {

		navigator.serviceWorker
			.register(
				'./service-worker.js'
			)
			.catch(() => {});
	}


	/* =====================================================
	   ONBOARDING
	   ===================================================== */

	const onboarding =
		document.querySelector(
			'#onboarding-modal'
		);


	if (
		onboarding &&
		!localStorage.getItem(
			'lifehub-onboarding-complete'
		)
	) {

		onboarding.addEventListener(
			'close',
			() => {

				localStorage.setItem(
					'lifehub-onboarding-complete',
					'true'
				);
			},
			{ once: true }
		);


		onboarding.showModal();
	}


	/*
	 * Initial render.
	 */

	state.route =
		normalizeRoute(
			getRouteFromUrl()
		);

	render();
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

	/*
	 * Always synchronize route before rendering.
	 *
	 * This is the key protection against:
	 *
	 * URL = games
	 * state.route = media
	 */

	state.route =
		normalizeRoute(
			getRouteFromUrl()
		);


	renderApp(
		state,
		{
			onNavigate: navigate,

			onAdd:
				openItemModal,

			onComplete:
				completeItem,

			onDelete:
				deleteItem,

			onEdit:
				editItem,

			onRequirement:
				updateRequirement,

			onClear:
				clearItems,

			onImport:
				() =>
					document
						.querySelector(
							'#import-file'
						)
						?.click(),

			onTheme:
				setTheme,

			onExport:
				exportBackup,

			onExportCsv:
				exportCsv,

			onDemo:
				loadDemoData,

			onToast:
				toast
		}
	);
}


/* =========================================================
   STATUS OPTIONS
   ========================================================= */

function updateStatusOptions(category) {

	const select =
		document.querySelector(
			'#item-status'
		);

	if (!select) {
		return;
	}


	const options =
		categoryStatuses[category] ||
		statuses;


	const currentValue =
		select.value;


	select.innerHTML =
		options
			.map(
				(status) =>
					`<option value="${escapeAttribute(status)}">${escapeHtml(status)}</option>`
			)
			.join('');


	if (
		options.includes(
			currentValue
		)
	) {

		select.value =
			currentValue;

	} else if (
		options.length
	) {

		select.value =
			options[0];
	}
}


/* =========================================================
   ADD / EDIT ITEM
   ========================================================= */

function openItemModal(item = null) {

	const modal =
		document.querySelector(
			'#item-modal'
		);

	const form =
		document.querySelector(
			'#item-form'
		);

	if (!modal || !form) {
		return;
	}


	form.reset();


	document.querySelector(
		'#item-modal-title'
	).textContent =
		item
			? 'Edit item'
			: 'Add something new';


	document.querySelector(
		'#item-title'
	).value =
		item?.title || '';


	const categorySelect =
		document.querySelector(
			'#item-category'
		);

	categorySelect.value =
		item?.category || 'Other';


	updateStatusOptions(
		categorySelect.value
	);


	const statusSelect =
		document.querySelector(
			'#item-status'
		);


	if (
		item?.status &&
		(
			categoryStatuses[
				categorySelect.value
			] || statuses
		).includes(item.status)
	) {

		statusSelect.value =
			item.status;

	}


	document.querySelector(
		'#item-progress'
	).value =
		item?.progress || 0;


	document.querySelector(
		'#progress-value'
	).textContent =
		`${item?.progress || 0}%`;


	document.querySelector(
		'#item-url'
	).value =
		item?.url || '';


	document.querySelector(
		'#item-notes'
	).value =
		item?.notes || '';


	document.querySelector(
		'#item-tags'
	).value =
		item?.tags?.join(', ') || '';


	renderMetadataFields(
		document.querySelector(
			'#metadata-fields'
		),
		categorySelect.value,
		item?.metadata || {}
	);


	form.dataset.editId =
		item?.id || '';


	modal.showModal();


	document
		.querySelector('#item-title')
		?.focus();
}


/* =========================================================
   SAVE ITEM
   ========================================================= */

async function saveItem(event) {

	/*
	 * Only the actual Save button should submit.
	 */

	if (
		event.submitter &&
		event.submitter.value !== 'default'
	) {
		return;
	}


	event.preventDefault();


	const formElement =
		event.currentTarget;


	const form =
		new FormData(
			formElement
		);


	const old =
		state.items.find(
			(item) =>
				item.id ===
				formElement.dataset.editId
		);


	const rawUrl =
		String(
			form.get('url') || ''
		).trim();


	const urlInput =
		document.querySelector(
			'#item-url'
		);


	/*
	 * URL validation.
	 */

	if (
		rawUrl &&
		!safeUrl(rawUrl)
	) {

		urlInput?.setCustomValidity(
			'Enter a valid http or https URL.'
		);

		urlInput?.reportValidity();

		return;
	}


	urlInput?.setCustomValidity('');


	const category =
		String(
			form.get('category') || ''
		);


	const status =
		String(
			form.get('status') || ''
		);


	/*
	 * Preserve existing metadata.
	 */

	const metadata = {
		...(old?.metadata || {})
	};


	/*
	 * Read dynamic metadata fields.
	 */

	document
		.querySelectorAll(
			'[data-meta]'
		)
		.forEach(
			(field) => {

				metadata[
					field.dataset.meta
				] =
					field.value.trim();
			}
		);


	/*
	 * Preserve application checklist
	 * structure.
	 */

	if (
		category === 'Application' &&
		typeof metadata.requirements ===
			'string'
	) {

		const oldRequirements =
			Array.isArray(
				old?.metadata?.requirements
			)
				? old.metadata.requirements
				: [];


		metadata.requirements =
			metadata.requirements
				.split(/\r?\n/)
				.map(
					(text) =>
						text.trim()
				)
				.filter(Boolean)
				.map(
					(text, index) => {

						const previous =
							oldRequirements[
								index
							];


						if (previous) {

							return {
								...previous,
								text
							};
						}


						return {
							id: uid(),
							text,
							completed: false
						};
					}
				);
	}


	/*
	 * Create normalized item.
	 */

	const item =
		normalizeItem(
			{
				...(old || {
					id: uid(),
					createdAt:
						Date.now()
				}),

				title:
					String(
						form.get(
							'title'
						) || ''
					).trim(),

				category,

				status,

				progress:
					Number(
						form.get(
							'progress'
						) || 0
					),

				url:
					safeUrl(
						rawUrl
					),

				notes:
					String(
						form.get(
							'notes'
						) || ''
					).trim(),

				tags:
					parseTags(
						String(
							form.get(
								'tags'
							) || ''
						)
					),

				metadata,

				updatedAt:
					Date.now(),

				completedAt:
					status ===
					'Completed'
						? (
								old?.completedAt ||
								Date.now()
							)
						: null
			}
		);


	/*
	 * Save.
	 */

	await database.put(item);


	/*
	 * Reload database.
	 */

	state.items =
		await database.getAll();

	window.lifehubItems =
		state.items;


	/*
	 * Close modal.
	 */

	document
		.querySelector(
			'#item-modal'
		)
		?.close();


	toast(
		old
			? 'Item updated'
			: 'Added to LIFEHUB'
	);


	render();
}


/* =========================================================
   COMPLETE
   ========================================================= */

async function completeItem(id) {

	const item =
		state.items.find(
			(entry) =>
				entry.id === id
		);


	if (!item) {
		return;
	}


	item.status =
		'Completed';


	item.progress =
		100;


	item.completedAt =
		item.completedAt ||
		Date.now();


	item.updatedAt =
		Date.now();


	await database.put(item);


	state.items =
		await database.getAll();

	window.lifehubItems =
		state.items;


	toast('✓ Completed');


	render();
}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteItem(id) {

	if (
		!window.confirm(
			'Delete this item permanently?'
		)
	) {
		return;
	}


	await database.remove(id);


	state.items =
		await database.getAll();

	window.lifehubItems =
		state.items;


	toast(
		'Item deleted'
	);


	render();
}


/* =========================================================
   CLEAR DATABASE
   ========================================================= */

async function clearItems() {

	if (
		!window.confirm(
			'Clear all LIFEHUB data? This cannot be undone.'
		)
	) {
		return;
	}


	await database.clear();


	state.items = [];

	window.lifehubItems =
		state.items;


	toast(
		'All data cleared'
	);


	render();
}


/* =========================================================
   EDIT
   ========================================================= */

function editItem(id) {

	const item =
		state.items.find(
			(entry) =>
				entry.id === id
		);


	if (item) {
		openItemModal(item);
	}
}


/* =========================================================
   SEARCH
   ========================================================= */

function openSearch() {

	const modal =
		document.querySelector(
			'#search-modal'
		);


	if (!modal) {
		return;
	}


	modal.showModal();


	document
		.querySelector(
			'#global-search'
		)
		?.focus();
}


function searchItems(event) {

	const query =
		event.target.value
			.toLowerCase()
			.trim();


	const results =
		state.items
			.filter(
				(item) =>
					JSON.stringify(
						item
					)
						.toLowerCase()
						.includes(
							query
						)
			)
			.slice(0, 12);


	const container =
		document.querySelector(
			'#search-results'
		);


	if (!container) {
		return;
	}


	container.innerHTML =
		results.length
			? results
					.map(
						(item) =>
							`
								<button
									class="search-result"
									data-search-id="${escapeAttribute(item.id)}"
									type="button"
								>
									<strong>
										${escapeHtml(
											item.title
										)}
									</strong>

									<span>
										${escapeHtml(
											item.category
										)}
										·
										${escapeHtml(
											item.status
										)}
									</span>
								</button>
							`
					)
					.join('')
			: `
				<p class="empty-copy">
					No matching items.
				</p>
			`;


	container
		.querySelectorAll(
			'[data-search-id]'
		)
		.forEach(
			(button) => {

				button.addEventListener(
					'click',
					() => {

						const item =
							state.items.find(
								(entry) =>
									entry.id ===
									button.dataset
										.searchId
							);


						if (!item) {
							return;
						}


						document
							.querySelector(
								'#search-modal'
							)
							?.close();


						navigate(
							routeByCategory[
								item.category
							] ||
							'dashboard'
						);
					}
				);
			}
		);
}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

	state.theme =
		state.theme === 'dark'
			? 'light'
			: 'dark';


	localStorage.setItem(
		'lifehub-theme',
		state.theme
	);


	applyTheme(
		state.theme
	);


	render();
}


function setTheme(theme) {

	state.theme =
		theme;


	localStorage.setItem(
		'lifehub-theme',
		theme
	);


	applyTheme(
		theme
	);


	render();
}


/* =========================================================
   APPLICATION REQUIREMENT
   ========================================================= */

async function updateRequirement(
	itemId,
	requirementId,
	completed
) {

	const item =
		state.items.find(
			(entry) =>
				entry.id ===
				itemId
		);


	const requirement =
		item?.metadata?.requirements?.find(
			(entry) =>
				entry.id ===
				requirementId
		);


	if (!requirement) {
		return;
	}


	requirement.completed =
		completed;


	item.updatedAt =
		Date.now();


	await database.put(
		item
	);


	state.items =
		await database.getAll();

	window.lifehubItems =
		state.items;


	render();
}


/* =========================================================
   DOWNLOAD
   ========================================================= */

function downloadFile(
	name,
	content,
	type
) {

	const blob =
		new Blob(
			[content],
			{ type }
		);


	const url =
		URL.createObjectURL(
			blob
		);


	const link =
		document.createElement(
			'a'
		);


	link.href =
		url;

	link.download =
		name;


	document.body.appendChild(
		link
	);


	link.click();


	link.remove();


	URL.revokeObjectURL(
		url
	);
}


/* =========================================================
   EXPORT JSON
   ========================================================= */

function exportBackup() {

	downloadFile(
		`lifehub-backup-${new Date()
			.toISOString()
			.slice(0, 10)}.json`,

		JSON.stringify(
			{
				app: 'LIFEHUB',

				schemaVersion: 1,

				exportedAt:
					new Date()
						.toISOString(),

				settings: {
					theme:
						state.theme
				},

				items:
					state.items
			},

			null,

			2
		),

		'application/json'
	);


	toast(
		'Backup exported'
	);
}


/* =========================================================
   EXPORT CSV
   ========================================================= */

function exportCsv() {

	const columns = [
		'title',
		'category',
		'status',
		'progress',
		'createdAt',
		'completedAt',
		'url',
		'notes'
	];


	const quote =
		(value) =>
			`"${String(
				value ?? ''
			)
				.replace(
					/"/g,
					'""'
				)
				.replace(
					/\r?\n/g,
					' '
				)}"`;


	const rows = [
		columns,

		...state.items.map(
			(item) =>
				columns.map(
					(column) =>
						item[
							column
						] ?? ''
				)
		)
	];


	const csv =
		rows
			.map(
				(row) =>
					row
						.map(
							quote
						)
						.join(',')
			)
			.join('\n');


	downloadFile(
		`lifehub-items-${new Date()
			.toISOString()
			.slice(0, 10)}.csv`,

		csv,

		'text/csv;charset=utf-8'
	);


	toast(
		'CSV exported'
	);
}


/* =========================================================
   DEMO DATA
   ========================================================= */

async function loadDemoData() {

	if (
		!window.confirm(
			'Add LIFEHUB demo records to your local data?'
		)
	) {
		return;
	}


	const now =
		Date.now();


	const demo = [

		[
			'Hades',
			'Game',
			'Playing',
			42,
			{
				platform: 'PC',
				genre: 'Roguelike'
			}
		],

		[
			'The Witcher 3',
			'Game',
			'Backlog',
			0,
			{
				platform: 'PC',
				genre: 'RPG'
			}
		],

		[
			'Celeste',
			'Game',
			'Completed',
			100,
			{
				platform: 'Switch',
				genre: 'Platformer'
			}
		],

		[
			'Arrival',
			'Movie',
			'Completed',
			100,
			{
				mediaType: 'Movie'
			}
		],

		[
			'Arcane',
			'Series',
			'Watching',
			55,
			{
				mediaType: 'Series',
				season: '1',
				currentEpisode: '5',
				totalEpisodes: '9'
			}
		],

		[
			'Frieren',
			'Anime',
			'Watchlist',
			0,
			{
				mediaType: 'Anime'
			}
		],

		[
			'JavaScript Algorithms',
			'Course',
			'Learning',
			35,
			{
				source: 'freeCodeCamp'
			}
		],

		[
			'Atomic Habits',
			'Book',
			'Completed',
			100,
			{
				source: 'Library'
			}
		],

		[
			'Scholarship application',
			'Application',
			'Preparing',
			20,
			{
				organization:
					'LIFE Foundation',

				deadline:
					new Date(
						now +
							14 *
								86400000
					)
						.toISOString()
						.slice(0, 10),

				requirements: [
					{
						id: uid(),
						text: 'Resume',
						completed: true
					},

					{
						id: uid(),
						text: 'Photograph',
						completed: false
					},

					{
						id: uid(),
						text: 'Portfolio',
						completed: false
					}
				]
			}
		],

		[
			'Internship application',
			'Application',
			'Accepted',
			100,
			{
				organization:
					'Studio North'
			}
		],

		[
			'LIFEHUB v2',
			'Project',
			'Building',
			64,
			{
				technologies:
					'HTML, CSS, JavaScript',

				deadline:
					new Date(
						now +
							30 *
								86400000
					)
						.toISOString()
						.slice(0, 10)
			}
		],

		[
			'Reading tracker',
			'Project',
			'Completed',
			100,
			{
				technologies:
					'JavaScript'
			}
		],

		[
			'MDN Web Docs',
			'Link',
			'Planned',
			0,
			{
				linkCategory:
					'Coding',

				description:
					'Reference documentation',

				whySaved:
					'Reliable web platform reference'
			}
		],

		[
			'New headphones',
			'Wishlist',
			'Planned',
			0,
			{
				price: '120',
				priority: 'High',
				purchaseStatus:
					'Want'
			}
		]
	];


	for (
		const [
			title,
			category,
			status,
			progress,
			metadata
		] of demo
	) {

		await database.put(
			normalizeItem(
				{
					id: uid(),

					title,

					category,

					status,

					progress,

					metadata,

					createdAt:
						now -
						Math.floor(
							Math.random() *
								20
						) *
							86400000,

					updatedAt:
						now
				}
			)
		);
	}


	state.items =
		await database.getAll();

	window.lifehubItems =
		state.items;


	toast(
		'Demo data loaded'
	);


	render();
}


/* =========================================================
   IMPORT JSON
   ========================================================= */

async function importBackup(event) {

	const file =
		event.target.files[0];


	event.target.value =
		'';


	if (!file) {
		return;
	}


	try {

		const payload =
			JSON.parse(
				await file.text()
			);


		if (
			payload.schemaVersion !== 1 &&
			payload.version !== 1
		) {

			throw new Error(
				'Unsupported backup schema.'
			);
		}


		if (
			!Array.isArray(
				payload.items
			)
		) {

			throw new Error(
				'This file does not contain valid LIFEHUB items.'
			);
		}


		if (
			payload.items.some(
				(item) =>
					!item ||
					typeof item.title !==
						'string' ||
					!item.title.trim()
			)
		) {

			throw new Error(
				'This file does not contain valid LIFEHUB items.'
			);
		}


		if (
			!window.confirm(
				'Replace your current LIFEHUB data with this backup?'
			)
		) {
			return;
		}


		await database.clear();


		for (
			const item of
			payload.items
		) {

			await database.put(
				normalizeItem(
					item
				)
			);
		}


		state.items =
			await database.getAll();

		window.lifehubItems =
			state.items;


		if (
			payload.settings?.theme
		) {

			state.theme =
				payload.settings.theme;

			localStorage.setItem(
				'lifehub-theme',
				state.theme
			);

			applyTheme(
				state.theme
			);
		}


		toast(
			`Imported ${state.items.length} items`
		);


		render();

	} catch (error) {

		console.error(
			error
		);


		toast(
			error.message ===
				'Unsupported backup schema.'
				? error.message
				: 'This file does not look like a LIFEHUB backup.'
		);
	}
}


/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function handleShortcut(event) {

	if (
		event.target.matches(
			'input, textarea, select'
		)
	) {
		return;
	}


	if (
		event.key === '/'
	) {

		event.preventDefault();

		openSearch();

		return;
	}


	if (
		event.key.toLowerCase() ===
		'n'
	) {

		openItemModal();

		return;
	}


	if (
		event.key === 'Escape'
	) {

		document
			.querySelectorAll(
				'dialog[open]'
			)
			.forEach(
				(dialog) =>
					dialog.close()
			);


		document.body.classList.remove(
			'nav-open'
		);
	}
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message) {

	const region =
		document.querySelector(
			'#toast-region'
		);


	if (!region) {
		return;
	}


	const element =
		document.createElement(
			'div'
		);


	element.className =
		'toast';


	element.textContent =
		message;


	region.appendChild(
		element
	);


	window.setTimeout(
		() =>
			element.remove(),
		2600
	);
}


/* =========================================================
   SECURITY HELPERS
   ========================================================= */

function escapeHtml(value) {

	return String(value).replace(
		/[&<>'"]/g,

		(character) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				"'": '&#39;',
				'"': '&quot;'
			}[character])
	);
}


function escapeAttribute(value) {

	return escapeHtml(
		value
	).replace(
		/`/g,
		'&#96;'
	);
}


/* =========================================================
   START APPLICATION
   ========================================================= */

boot().catch(
	(error) => {

		console.error(
			'LIFEHUB boot error:',
			error
		);


		const page =
			document.querySelector(
				'#page-content'
			);


		if (page) {

			page.innerHTML = `
				<div class="error-state">
					<h2>Something went wrong while loading.</h2>
					<p>
						Your existing data has not been removed.
						Refresh to try again.
					</p>
				</div>
			`;
		}
	}
);