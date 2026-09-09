/**
 * LINKVAULT - Frontend Application Logic
 * Manejo de eventos, estado reactivo, consumo de API y renderizado dinámico
 */

// Estado global de la aplicación
const AppState = {
  links: [],
  filteredLinks: [],
  activeCategory: 'all',
  activeContentType: 'all',
  activeSource: 'all',
  isFavoritesOnly: false,
  searchTerm: '',
  sort: 'newest',
  currentEditingId: null,
  isAnalyzing: false
};

// Iconos y etiquetas de plataformas para renderizado rápido
const PLATFORM_ICONS = {
  'YouTube': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  'TikTok': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  'Instagram': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
  'Facebook': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  'X / Twitter': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  'LinkedIn': '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>',
  'Web': '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'
};

// Mapeo de tipos de contenido con emoji descriptivo
const TYPE_LABELS = {
  'video': { label: 'Video', icon: '🎬' },
  'evento': { label: 'Evento', icon: '📅' },
  'articulo': { label: 'Artículo', icon: '📄' },
  'podcast': { label: 'Podcast', icon: '🎙️' },
  'producto': { label: 'Producto', icon: '🛍️' },
  'web': { label: 'Web', icon: '🌐' }
};

// ==========================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadLinks();
  loadStats();
});

// Registrar eventos de interfaz
function initEventListeners() {
  // 1. Botones de Abrir Modal de Captura
  document.getElementById('btn-quick-add-desktop')?.addEventListener('click', () => openEditorModal());
  document.getElementById('btn-quick-add-mobile')?.addEventListener('click', () => openEditorModal());
  document.getElementById('btn-empty-add')?.addEventListener('click', () => openEditorModal());

  // 2. Cerrar Modal de Captura
  document.getElementById('btn-close-editor-modal')?.addEventListener('click', closeEditorModal);
  document.getElementById('btn-cancel-editor')?.addEventListener('click', closeEditorModal);

  // 3. Botón de Pegar URL desde Clipboard
  document.getElementById('btn-paste-clipboard')?.addEventListener('click', handlePasteClipboard);

  // 4. Botón y evento de Analizar URL
  document.getElementById('btn-analyze-url')?.addEventListener('click', handleAnalyzeUrl);
  document.getElementById('input-url')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAnalyzeUrl();
    }
  });

  // 5. Botón de Guardar Enlace
  document.getElementById('btn-save-link')?.addEventListener('click', handleSaveLink);

  // 6. Búsqueda y Filtros
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');

  searchInput?.addEventListener('input', (e) => {
    AppState.searchTerm = e.target.value;
    if (clearSearchBtn) {
      clearSearchBtn.classList.toggle('hidden', !e.target.value);
    }
    debounceFilterLinks();
  });

  clearSearchBtn?.addEventListener('click', () => {
    if (searchInput) {
      searchInput.value = '';
      AppState.searchTerm = '';
      clearSearchBtn.classList.add('hidden');
      loadLinks();
    }
  });

  // 7. Chips de Categorías (Pills)
  const categoryPills = document.querySelectorAll('.pill-chip');
  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      AppState.activeCategory = pill.dataset.category;
      loadLinks();
    });
  });

  // 8. Selects de Filtros Secundarios
  document.getElementById('filter-content-type')?.addEventListener('change', (e) => {
    AppState.activeContentType = e.target.value;
    loadLinks();
  });

  document.getElementById('filter-source')?.addEventListener('change', (e) => {
    AppState.activeSource = e.target.value;
    loadLinks();
  });

  document.getElementById('filter-sort')?.addEventListener('change', (e) => {
    AppState.sort = e.target.value;
    loadLinks();
  });

  // 9. Barra de Navegación Inferior (Móvil)
  document.getElementById('nav-home')?.addEventListener('click', () => {
    setActiveNav('nav-home');
    AppState.isFavoritesOnly = false;
    AppState.activeCategory = 'all';
    resetCategoryPillsUI();
    loadLinks();
  });

  document.getElementById('nav-favorites')?.addEventListener('click', () => {
    setActiveNav('nav-favorites');
    AppState.isFavoritesOnly = true;
    loadLinks();
  });

  document.getElementById('nav-categories')?.addEventListener('click', () => {
    setActiveNav('nav-categories');
    // Desplazar suavemente a los pills de categorías
    document.querySelector('.categories-scroll-wrapper')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('nav-database')?.addEventListener('click', () => {
    openDatabaseModal();
  });

  // 10. Modal de Base de Datos
  document.getElementById('btn-open-db-modal')?.addEventListener('click', openDatabaseModal);
  document.getElementById('btn-close-db-modal')?.addEventListener('click', closeDatabaseModal);
  document.getElementById('btn-close-db-footer')?.addEventListener('click', closeDatabaseModal);

  // 11. Zona de carga de respaldo (Drag & Drop / File Input)
  const uploadZone = document.getElementById('db-upload-zone');
  const fileInput = document.getElementById('file-db-upload');

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleRestoreDatabase(e.target.files[0]);
    }
  });

  uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--accent-primary)';
  });

  uploadZone?.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = '';
  });

  uploadZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleRestoreDatabase(e.dataTransfer.files[0]);
    }
  });
}

function setActiveNav(activeId) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.getElementById(activeId)?.classList.add('active');
}

function resetCategoryPillsUI() {
  document.querySelectorAll('.pill-chip').forEach(p => {
    p.classList.toggle('active', p.dataset.category === 'all');
  });
}

// ==========================================================
// CONSUMO DE API Y GESTIÓN DE ENLACES
// ==========================================================

async function loadLinks() {
  const container = document.getElementById('links-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsText = document.getElementById('results-count-text');

  if (resultsText) resultsText.textContent = 'Actualizando enlaces...';

  try {
    const params = new URLSearchParams();
    if (AppState.searchTerm) params.append('search', AppState.searchTerm);
    if (AppState.activeCategory && AppState.activeCategory !== 'all') params.append('category', AppState.activeCategory);
    if (AppState.activeContentType && AppState.activeContentType !== 'all') params.append('contentType', AppState.activeContentType);
    if (AppState.activeSource && AppState.activeSource !== 'all') params.append('source', AppState.activeSource);
    if (AppState.isFavoritesOnly) params.append('isFavorite', '1');
    if (AppState.sort) params.append('sort', AppState.sort);

    const res = await fetch(`/api/links?${params.toString()}`);
    if (!res.ok) throw new Error('Error en el servidor');
    
    const links = await res.json();
    AppState.links = links;

    renderLinks(links);
    updateResultsCount(links.length);
    loadStats(); // refrescar contadores en los chips
  } catch (err) {
    console.error('Error cargando enlaces:', err);
    showToast('No se pudieron cargar los enlaces', 'error');
  }
}

function renderLinks(links) {
  const container = document.getElementById('links-grid');
  const emptyState = document.getElementById('empty-state');
  if (!container || !emptyState) return;

  container.innerHTML = '';

  if (links.length === 0) {
    emptyState.classList.remove('hidden');
    container.classList.add('hidden');

    const emptyTitle = document.getElementById('empty-title');
    const emptyDesc = document.getElementById('empty-description');

    if (AppState.isFavoritesOnly) {
      if (emptyTitle) emptyTitle.textContent = 'Sin favoritos guardados';
      if (emptyDesc) emptyDesc.textContent = 'Marca cualquier enlace con la estrella ⭐ para encontrarlo rápidamente aquí.';
    } else if (AppState.searchTerm || AppState.activeCategory !== 'all') {
      if (emptyTitle) emptyTitle.textContent = 'Sin coincidencias';
      if (emptyDesc) emptyDesc.textContent = 'No encontramos enlaces que coincidan con los filtros seleccionados.';
    } else {
      if (emptyTitle) emptyTitle.textContent = 'Tu LinkVault está vacío';
      if (emptyDesc) emptyDesc.textContent = 'Guarda videos, noticias, eventos o páginas web. Se analizarán y resumirán de forma automática.';
    }
    return;
  }

  emptyState.classList.add('hidden');
  container.classList.remove('hidden');

  links.forEach(link => {
    const card = createLinkCardElement(link);
    container.appendChild(card);
  });
}

function createLinkCardElement(link) {
  const card = document.createElement('article');
  card.className = 'link-card';
  card.id = `link-card-${link.id}`;

  const sourceName = link.source || 'Web';
  const sourceClass = getSourceBadgeClass(sourceName);
  const sourceIcon = PLATFORM_ICONS[sourceName] || PLATFORM_ICONS['Web'];

  const typeInfo = TYPE_LABELS[link.content_type] || { label: 'Web', icon: '🌐' };
  const catClass = getCategoryBadgeClass(link.category);

  // Fecha amigable
  let dateDisplay = '';
  try {
    const d = new Date(link.created_at);
    dateDisplay = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  } catch {
    dateDisplay = '';
  }

  // Miniatura o placeholder estilizado
  let thumbHtml = '';
  if (link.thumbnail) {
    thumbHtml = `
      <div class="link-thumb-container">
        <img src="${escapeHtml(link.thumbnail)}" alt="${escapeHtml(link.title)}" class="link-thumb-img" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'link-thumb-placeholder\\'>${typeInfo.icon}</div>';">
      </div>
    `;
  } else {
    thumbHtml = `
      <div class="link-thumb-container">
        <div class="link-thumb-placeholder">
          <span style="font-size: 1.6rem;">${typeInfo.icon}</span>
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="link-card-top">
      <div class="link-badges">
        <span class="badge-source ${sourceClass}" title="Origen: ${escapeHtml(sourceName)}">
          ${sourceIcon}
          <span>${escapeHtml(sourceName)}</span>
        </span>
        <span class="badge badge-type">
          ${typeInfo.icon} ${typeInfo.label}
        </span>
        <span class="badge badge-cat ${catClass}">
          ${escapeHtml(link.category || 'Otro')}
        </span>
      </div>
      <button class="btn-fav ${link.is_favorite ? 'active' : ''}" data-id="${link.id}" title="${link.is_favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="${link.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
    </div>

    <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-title-link" title="${escapeHtml(link.title)}">
      ${escapeHtml(link.title)}
    </a>

    ${link.is_fallback ? `
      <div class="fallback-indicator" title="Acceso directo restringido en la plataforma">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <span>Lectura básica (acceso restringido)</span>
      </div>
    ` : ''}

    <div class="link-card-body">
      ${thumbHtml}
      <p class="link-summary-text">${escapeHtml(link.summary || 'Sin resumen disponible.')}</p>
    </div>

    ${link.notes ? `
      <div class="user-notes-snippet" title="Tus notas personales">
        💬 "${escapeHtml(link.notes)}"
      </div>
    ` : ''}

    <div class="link-card-footer">
      <span class="link-date-tag">📅 ${dateDisplay}</span>
      <div class="card-actions">
        <button class="btn-card-action btn-copy-url" data-url="${escapeHtml(link.url)}" title="Copiar enlace">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="btn-card-action btn-edit-link" data-id="${link.id}" title="Editar">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="btn-card-action btn-delete btn-delete-link" data-id="${link.id}" title="Eliminar">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </div>
  `;

  // Asignar manejadores a los botones de la tarjeta
  card.querySelector('.btn-fav')?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleToggleFavorite(link.id);
  });

  card.querySelector('.btn-copy-url')?.addEventListener('click', (e) => {
    e.stopPropagation();
    copyToClipboard(link.url);
  });

  card.querySelector('.btn-edit-link')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditorModal(link);
  });

  card.querySelector('.btn-delete-link')?.addEventListener('click', (e) => {
    e.stopPropagation();
    handleDeleteLink(link.id, link.title);
  });

  return card;
}

function updateResultsCount(count) {
  const el = document.getElementById('results-count-text');
  if (!el) return;

  if (count === 1) {
    el.textContent = '1 enlace encontrado';
  } else {
    el.textContent = `${count} enlaces encontrados`;
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const stats = await res.json();

    // Actualizar conteos en pills
    const allEl = document.getElementById('count-all');
    if (allEl) allEl.textContent = stats.total || '0';

    const catMap = {};
    if (Array.isArray(stats.byCategory)) {
      stats.byCategory.forEach(item => {
        catMap[item.category] = item.count;
      });
    }

    const setCatCount = (id, catName) => {
      const el = document.getElementById(id);
      if (el) el.textContent = catMap[catName] || '0';
    };

    setCatCount('count-educativo', 'Educativo');
    setCatCount('count-negocios', 'Negocios');
    setCatCount('count-salud', 'Salud');
    setCatCount('count-ejercicios', 'Ejercicios');
    setCatCount('count-tecnologia', 'Tecnología');
    setCatCount('count-entretenimiento', 'Entretenimiento');
    setCatCount('count-otro', 'Otro');

    // Estadísticas de la base de datos modal
    const dbTotal = document.getElementById('db-stat-total');
    const dbFavs = document.getElementById('db-stat-favs');
    if (dbTotal) dbTotal.textContent = stats.total || '0';
    if (dbFavs) dbFavs.textContent = stats.favorites || '0';

  } catch (e) {
    console.warn('Error cargando estadísticas:', e);
  }
}

// ==========================================================
// MODAL DE CAPTURA Y ANÁLISIS AUTOMÁTICO
// ==========================================================

function openEditorModal(existingLink = null) {
  const modal = document.getElementById('modal-link-editor');
  const modalHeading = document.getElementById('modal-heading');
  const inputUrl = document.getElementById('input-url');
  const btnAnalyze = document.getElementById('btn-analyze-url');
  const fallbackAlert = document.getElementById('fallback-alert');
  const loader = document.getElementById('analyze-loader');

  // Resetear estados
  loader?.classList.add('hidden');
  fallbackAlert?.classList.add('hidden');

  if (existingLink) {
    // Modo Edición
    AppState.currentEditingId = existingLink.id;
    if (modalHeading) modalHeading.textContent = 'Editar Enlace';
    if (inputUrl) {
      inputUrl.value = existingLink.url;
      inputUrl.disabled = true; // no cambiar URL en edición para preservar identidad
    }
    if (btnAnalyze) btnAnalyze.style.display = 'none';

    populateFormFields({
      title: existingLink.title,
      summary: existingLink.summary,
      source: existingLink.source,
      content_type: existingLink.content_type,
      category: existingLink.category,
      thumbnail: existingLink.thumbnail,
      author: existingLink.author,
      notes: existingLink.notes,
      tags: existingLink.tags,
      is_favorite: existingLink.is_favorite,
      is_fallback: existingLink.is_fallback
    });
  } else {
    // Modo Nuevo
    AppState.currentEditingId = null;
    if (modalHeading) modalHeading.textContent = 'Agregar Nuevo Enlace';
    if (inputUrl) {
      inputUrl.value = '';
      inputUrl.disabled = false;
    }
    if (btnAnalyze) btnAnalyze.style.display = 'inline-flex';

    clearFormFields();
  }

  modal?.classList.remove('hidden');
  if (!existingLink && inputUrl) {
    setTimeout(() => inputUrl.focus(), 150);
  }
}

function closeEditorModal() {
  const modal = document.getElementById('modal-link-editor');
  modal?.classList.add('hidden');
  AppState.currentEditingId = null;
}

async function handlePasteClipboard() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      const inputUrl = document.getElementById('input-url');
      if (text && inputUrl) {
        inputUrl.value = text.trim();
        showToast('Enlace pegado del portapapeles', 'success');
        // Analizar automáticamente al pegar
        handleAnalyzeUrl();
      }
    } else {
      showToast('Por favor pega la URL manualmente en el campo', 'error');
    }
  } catch (err) {
    showToast('Permiso de portapapeles denegado o no soportado', 'error');
  }
}

async function handleAnalyzeUrl() {
  const urlInput = document.getElementById('input-url');
  const url = (urlInput?.value || '').trim();

  if (!url) {
    showToast('Por favor introduce una URL válida', 'error');
    urlInput?.focus();
    return;
  }

  const loader = document.getElementById('analyze-loader');
  const btnAnalyzeText = document.getElementById('btn-analyze-text');
  const fallbackAlert = document.getElementById('fallback-alert');

  try {
    loader?.classList.remove('hidden');
    if (btnAnalyzeText) btnAnalyzeText.textContent = 'Analizando...';
    fallbackAlert?.classList.add('hidden');

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!res.ok) throw new Error('Error al conectar con el analizador');

    const data = await res.json();
    populateFormFields(data);

    if (data.is_fallback) {
      fallbackAlert?.classList.remove('hidden');
    }

    showToast('Enlace analizado exitosamente', 'success');
  } catch (err) {
    console.error('Error al analizar:', err);
    showToast('No se pudo analizar el enlace. Puedes completar los datos manualmente.', 'error');
  } finally {
    loader?.classList.add('hidden');
    if (btnAnalyzeText) btnAnalyzeText.textContent = 'Analizar';
  }
}

function populateFormFields(data) {
  const titleInput = document.getElementById('edit-title');
  const summaryInput = document.getElementById('edit-summary');
  const contentTypeSelect = document.getElementById('edit-content-type');
  const categorySelect = document.getElementById('edit-category');
  const notesInput = document.getElementById('edit-notes');
  const tagsInput = document.getElementById('edit-tags');
  const favCheck = document.getElementById('edit-is-favorite');
  const sourceBadge = document.getElementById('badge-detected-source');
  const thumbHidden = document.getElementById('edit-thumbnail');
  const authorHidden = document.getElementById('edit-author');
  const fallbackHidden = document.getElementById('edit-is-fallback');

  if (titleInput) titleInput.value = data.title || '';
  if (summaryInput) summaryInput.value = data.summary || '';
  if (contentTypeSelect && data.content_type) contentTypeSelect.value = data.content_type;
  if (categorySelect && data.category) categorySelect.value = data.category;
  if (notesInput) notesInput.value = data.notes || '';
  if (tagsInput) tagsInput.value = data.tags || '';
  if (favCheck) favCheck.checked = Boolean(data.is_favorite);

  if (thumbHidden) thumbHidden.value = data.thumbnail || '';
  if (authorHidden) authorHidden.value = data.author || '';
  if (fallbackHidden) fallbackHidden.value = data.is_fallback ? '1' : '0';

  if (sourceBadge) {
    const sName = data.source || 'Web';
    sourceBadge.textContent = sName;
    sourceBadge.className = `badge-source ${getSourceBadgeClass(sName)}`;
  }
}

function clearFormFields() {
  populateFormFields({
    title: '',
    summary: '',
    source: 'Web',
    content_type: 'web',
    category: 'Otro',
    notes: '',
    tags: '',
    thumbnail: '',
    author: '',
    is_favorite: 0,
    is_fallback: 0
  });
}

async function handleSaveLink() {
  const inputUrl = document.getElementById('input-url');
  const titleInput = document.getElementById('edit-title');
  const summaryInput = document.getElementById('edit-summary');
  const contentTypeSelect = document.getElementById('edit-content-type');
  const categorySelect = document.getElementById('edit-category');
  const notesInput = document.getElementById('edit-notes');
  const tagsInput = document.getElementById('edit-tags');
  const favCheck = document.getElementById('edit-is-favorite');
  const sourceBadge = document.getElementById('badge-detected-source');
  const thumbHidden = document.getElementById('edit-thumbnail');
  const authorHidden = document.getElementById('edit-author');
  const fallbackHidden = document.getElementById('edit-is-fallback');
  const saveBtn = document.getElementById('btn-save-link');

  const url = (inputUrl?.value || '').trim();
  const title = (titleInput?.value || '').trim();

  if (!url) {
    showToast('Debes ingresar una URL', 'error');
    inputUrl?.focus();
    return;
  }

  if (!title) {
    showToast('Debes asignar un título al enlace', 'error');
    titleInput?.focus();
    return;
  }

  const payload = {
    url,
    title,
    summary: summaryInput?.value || '',
    content_type: contentTypeSelect?.value || 'web',
    category: categorySelect?.value || 'Otro',
    source: sourceBadge?.textContent || 'Web',
    notes: notesInput?.value || '',
    tags: tagsInput?.value || '',
    thumbnail: thumbHidden?.value || '',
    author: authorHidden?.value || '',
    is_favorite: favCheck?.checked ? 1 : 0,
    is_fallback: fallbackHidden?.value === '1' ? 1 : 0
  };

  try {
    if (saveBtn) saveBtn.disabled = true;

    let res;
    if (AppState.currentEditingId) {
      // Actualizar
      res = await fetch(`/api/links/${AppState.currentEditingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Crear
      res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (!res.ok) throw new Error('Error al guardar');

    showToast(AppState.currentEditingId ? 'Enlace actualizado' : 'Enlace guardado en SQLite', 'success');
    closeEditorModal();
    loadLinks();
  } catch (err) {
    console.error('Error guardando enlace:', err);
    showToast('No se pudo guardar el enlace', 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function handleToggleFavorite(id) {
  try {
    const res = await fetch(`/api/links/${id}/favorite`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Error');
    const data = await res.json();

    // Actualizar visualmente la tarjeta si está presente
    const btnFav = document.querySelector(`#link-card-${id} .btn-fav`);
    if (btnFav) {
      btnFav.classList.toggle('active', Boolean(data.is_favorite));
      const polygon = btnFav.querySelector('polygon');
      if (polygon) {
        polygon.setAttribute('fill', data.is_favorite ? 'currentColor' : 'none');
      }
    }

    // Si estamos en la pestaña de favoritos y se desmarcó, recargar la lista
    if (AppState.isFavoritesOnly && !data.is_favorite) {
      loadLinks();
    } else {
      loadStats();
    }
  } catch (err) {
    showToast('No se pudo actualizar favorito', 'error');
  }
}

async function handleDeleteLink(id, title) {
  if (!confirm(`¿Eliminar el enlace "${title}" de la base de datos?`)) return;

  try {
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar');

    showToast('Enlace eliminado', 'success');
    loadLinks();
  } catch (err) {
    showToast('Error al eliminar enlace', 'error');
  }
}

// ==========================================================
// MODAL DE BASE DE DATOS Y RESTAURACIÓN
// ==========================================================

function openDatabaseModal() {
  const modal = document.getElementById('modal-database');
  modal?.classList.remove('hidden');
  loadStats();
}

function closeDatabaseModal() {
  const modal = document.getElementById('modal-database');
  modal?.classList.add('hidden');
}

async function handleRestoreDatabase(file) {
  if (!file) return;

  const isDb = file.name.endsWith('.db') || file.name.endsWith('.sqlite') || file.name.endsWith('.sqlite3');
  const isJson = file.name.endsWith('.json');

  if (!isDb && !isJson) {
    showToast('Formato no soportado. Selecciona un archivo .db o .json', 'error');
    return;
  }

  if (isDb) {
    if (!confirm('¿Deseas restaurar esta base de datos SQLite? Se reemplazarán los datos actuales con el archivo cargado.')) return;

    const formData = new FormData();
    formData.append('database', file);

    try {
      showToast('Restaurando base de datos SQLite...', 'success');
      const res = await fetch('/api/import/db', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error restaurando');

      showToast('Base de datos SQLite restaurada correctamente', 'success');
      closeDatabaseModal();
      loadLinks();
    } catch (err) {
      console.error('Error restaurando DB:', err);
      showToast(err.message || 'Fallo al restaurar la base de datos', 'error');
    }
  } else if (isJson) {
    try {
      const text = await file.text();
      const items = JSON.parse(text);

      const res = await fetch('/api/import/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error importando');

      showToast(data.message || 'Enlaces importados correctamente', 'success');
      closeDatabaseModal();
      loadLinks();
    } catch (err) {
      showToast('Archivo JSON inválido o con formato incorrecto', 'error');
    }
  }
}

// ==========================================================
// UTILIDADES: CLASES CSS, DEBOUNCE, PORTAPAPELES, TOASTS
// ==========================================================

function getSourceBadgeClass(sourceName) {
  const s = (sourceName || '').toLowerCase();
  if (s.includes('youtube')) return 'badge-youtube';
  if (s.includes('tiktok')) return 'badge-tiktok';
  if (s.includes('instagram')) return 'badge-instagram';
  if (s.includes('facebook')) return 'badge-facebook';
  if (s.includes('twitter') || s === 'x') return 'badge-twitter';
  if (s.includes('linkedin')) return 'badge-linkedin';
  return 'badge-generic';
}

function getCategoryBadgeClass(category) {
  const map = {
    'Educativo': 'badge-cat-educativo',
    'Negocios': 'badge-cat-negocios',
    'Salud': 'badge-cat-salud',
    'Ejercicios': 'badge-cat-ejercicios',
    'Tecnología': 'badge-cat-tecnologia',
    'Entretenimiento': 'badge-cat-entretenimiento',
    'Otro': 'badge-cat-otro'
  };
  return map[category] || 'badge-cat-otro';
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('¡Enlace copiado al portapapeles!', 'success'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('¡Enlace copiado al portapapeles!', 'success');
  } catch (err) {
    showToast('No se pudo copiar el enlace', 'error');
  }
  document.body.removeChild(textArea);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

let debounceTimer = null;
function debounceFilterLinks() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    loadLinks();
  }, 300);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  
  const icon = type === 'error' ? '⚠️' : '✅';
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
