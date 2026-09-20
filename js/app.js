/**
 * Main Application Orchestrator
 * - Progressive Virtual Chunk Rendering (handles 1465+ items without lag)
 * - Multi-layout management (Masonry, Grid, Focus)
 * - Category filtering, instant search & favorites filter
 * - Inspiration Dice (random roll)
 * - Lighting atmosphere switcher
 */

document.addEventListener('DOMContentLoaded', () => {
  const catalog = window.FONT_CATALOG || [];
  
  // App state
  const state = {
    all: catalog,
    filtered: catalog,
    activeCategory: '全部',
    searchQuery: '',
    favoritesOnly: false,
    layout: 'masonry', // 'masonry' | 'grid' | 'focus'
    theme: localStorage.getItem('typography_theme') || 'dark',
    renderedCount: 0,
    batchSize: 40
  };

  // DOM Elements
  const stage = document.getElementById('galleryStage');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const categoryContainer = document.getElementById('categoryFilters');
  const totalCountEl = document.getElementById('totalCountLabel');
  const currentCountEl = document.getElementById('currentCountLabel');
  const themeToggle = document.getElementById('btnThemeToggle');
  const diceTrigger = document.getElementById('btnRandomDice');
  const favoritesToggle = document.getElementById('btnFavoritesToggle');
  const favCountBadge = document.getElementById('favCountBadge');

  // Layout buttons
  const btnMasonry = document.getElementById('btnLayoutMasonry');
  const btnGrid = document.getElementById('btnLayoutGrid');
  const btnFocus = document.getElementById('btnLayoutFocus');

  // Initialize Inspector
  const inspector = new window.SpecimenInspector();

  // Toast function
  window.showToast = (message) => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${window.Icons.get('sparkle', 16)} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2400);
  };

  // Theme application
  function applyTheme(t) {
    state.theme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('typography_theme', t);
    themeToggle.innerHTML = window.Icons.get(t === 'dark' ? 'sun' : 'moon', 16) + 
      ` <span>${t === 'dark' ? '紙本象牙' : '暗房曜石'}</span>`;
  }

  themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
  applyTheme(state.theme);

  // Initialize categories
  function initCategories() {
    const counts = { '全部': catalog.length };
    catalog.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    categoryContainer.innerHTML = '';
    const categories = Object.keys(counts);

    categories.forEach(cat => {
      const chip = document.createElement('button');
      chip.className = `category-chip ${cat === state.activeCategory ? 'active' : ''}`;
      chip.innerHTML = `<span>${cat}</span> <span class="category-count">${counts[cat]}</span>`;
      
      chip.addEventListener('click', () => {
        if (state.favoritesOnly) {
          state.favoritesOnly = false;
          favoritesToggle.classList.remove('active');
        }
        state.activeCategory = cat;
        document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterCatalog();
      });

      categoryContainer.appendChild(chip);
    });
  }

  // Filter Catalog
  function filterCatalog() {
    const q = state.searchQuery.trim().toLowerCase();
    
    state.filtered = state.all.filter(item => {
      // Category match
      if (state.activeCategory !== '全部' && item.category !== state.activeCategory) {
        return false;
      }

      // Favorites filter
      if (state.favoritesOnly && !window.favoritesManager.has(item.id)) {
        return false;
      }

      // Search query match (title, subTitle, ocrText, original filename, tags, category, id)
      if (q) {
        const idMatch = String(item.id).includes(q);
        const titleMatch = item.title && item.title.toLowerCase().includes(q);
        const subMatch = item.subTitle && item.subTitle.toLowerCase().includes(q);
        const ocrMatch = item.ocrText && item.ocrText.toLowerCase().includes(q);
        const fileMatch = item.originalName && item.originalName.toLowerCase().includes(q);
        const tagMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(q));
        const catMatch = item.category && item.category.toLowerCase().includes(q);
        return idMatch || titleMatch || subMatch || ocrMatch || fileMatch || tagMatch || catMatch;
      }

      return true;
    });

    currentCountEl.textContent = state.filtered.length;
    resetAndRenderGallery();
  }

  // Reset and Render Gallery
  function resetAndRenderGallery() {
    stage.innerHTML = '';
    state.renderedCount = 0;

    if (state.filtered.length === 0) {
      stage.innerHTML = `
        <div class="empty-gallery">
          <div style="color:var(--text-tertiary);margin-bottom:1rem;">
            ${window.Icons.get('search', 42)}
          </div>
          <h2 class="empty-title">未搜尋到匹配字型標本</h2>
          <p class="empty-desc">嘗試調整篩選分類、關鍵字，或清除搜尋框內容以瀏覽全部 1,465 件藏品。</p>
          <button class="tool-btn" id="emptyResetBtn">
            ${window.Icons.get('refresh', 16)} 重設檢索條件
          </button>
        </div>
      `;
      document.getElementById('emptyResetBtn')?.addEventListener('click', () => {
        state.searchQuery = '';
        searchInput.value = '';
        searchClear.classList.remove('visible');
        state.activeCategory = '全部';
        state.favoritesOnly = false;
        favoritesToggle.classList.remove('active');
        document.querySelectorAll('.category-chip').forEach((c, idx) => {
          c.classList.toggle('active', idx === 0);
        });
        filterCatalog();
      });
      return;
    }

    renderNextBatch();
  }

  // Render Next Batch of Items
  function renderNextBatch() {
    const start = state.renderedCount;
    const end = Math.min(start + state.batchSize, state.filtered.length);
    if (start >= end) return;

    const frag = document.createDocumentFragment();

    for (let i = start; i < end; i++) {
      const item = state.filtered[i];
      const card = createCardElement(item);
      frag.appendChild(card);
    }

    // Remove existing sentinel if present
    const oldSentinel = document.getElementById('loadSentinel');
    if (oldSentinel) oldSentinel.remove();

    stage.appendChild(frag);
    state.renderedCount = end;

    // Attach sentinel observer if there are more items to render
    if (state.renderedCount < state.filtered.length) {
      const sentinel = document.createElement('div');
      sentinel.id = 'loadSentinel';
      sentinel.className = 'loading-indicator';
      sentinel.innerHTML = `<div class="spinner"></div> <span>標本載入中 (${state.renderedCount} / ${state.filtered.length})...</span>`;
      stage.appendChild(sentinel);

      sentinelObserver.observe(sentinel);
    }
  }

  // Card element generator
  function createCardElement(item) {
    const card = document.createElement('article');
    card.className = 'specimen-card';
    card.setAttribute('data-id', item.id);

    const isFav = window.favoritesManager.has(item.id);

    card.innerHTML = `
      <div class="card-media">
        <img class="specimen-img" data-src="${item.src}" alt="${item.title}" loading="lazy" />
        <div class="card-actions-overlay">
          <div class="overlay-top">
            <span class="tag-badge" style="background:rgba(0,0,0,0.6);color:#fff">${item.category}</span>
            <button class="action-icon-btn card-fav-btn ${isFav ? 'active' : ''}" title="收藏此標本">
              ${isFav ? window.Icons.get('heart-filled', 15) : window.Icons.get('heart', 15)}
            </button>
          </div>
          <div class="overlay-bottom">
            <button class="action-icon-btn card-inspect-btn" title="標本鏡鑑 (快捷檢視)">
              ${window.Icons.get('focus', 15)}
            </button>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <div class="card-title-row">
          <h3 class="card-title" title="${item.title}">${item.title}</h3>
          <span class="card-index">#${String(item.id).padStart(4, '0')}</span>
        </div>
        ${item.subTitle ? `<p class="card-subtitle" title="${item.subTitle}">${item.subTitle}</p>` : ''}
        <div class="card-tags-row">
          ${item.tags.map(t => `<span class="tag-badge">${t}</span>`).join('')}
          <span class="format-badge">${item.ext} · ${item.size}</span>
        </div>
      </div>
    `;

    // Click card to inspect
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-fav-btn')) return;
      inspector.open(item, state.filtered);
    });

    // Favorite toggle button inside card
    const favBtn = card.querySelector('.card-fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const stateNow = window.favoritesManager.toggle(item.id);
      favBtn.classList.toggle('active', stateNow);
      favBtn.innerHTML = stateNow ? window.Icons.get('heart-filled', 15) : window.Icons.get('heart', 15);
      window.showToast?.(stateNow ? `已收藏: ${item.title}` : `已取消收藏: ${item.title}`);
    });

    // Lazy load image with blur-in
    const img = card.querySelector('.specimen-img');
    imageObserver.observe(img);

    return card;
  }

  // IntersectionObserver for lazy loading images
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.getAttribute('data-src');
        if (src) {
          img.src = src;
          img.onload = () => img.classList.add('loaded');
          img.onerror = () => {
            img.style.opacity = '0.4';
            img.parentElement.style.background = 'var(--bg-surface-elevated)';
          };
          observer.unobserve(img);
        }
      }
    });
  }, { rootMargin: '300px 0px' });

  // IntersectionObserver for infinite scrolling
  const sentinelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        sentinelObserver.unobserve(entry.target);
        renderNextBatch();
      }
    });
  }, { rootMargin: '400px 0px' });

  // Layout Switcher
  function setLayout(mode) {
    state.layout = mode;
    stage.className = `main-stage gallery-${mode}`;
    btnMasonry.classList.toggle('active', mode === 'masonry');
    btnGrid.classList.toggle('active', mode === 'grid');
    btnFocus.classList.toggle('active', mode === 'focus');
  }

  btnMasonry.addEventListener('click', () => setLayout('masonry'));
  btnGrid.addEventListener('click', () => setLayout('grid'));
  btnFocus.addEventListener('click', () => setLayout('focus'));

  // Search input debouncing
  let searchTimer = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const val = e.target.value;
    searchClear.classList.toggle('visible', val.length > 0);
    searchTimer = setTimeout(() => {
      state.searchQuery = val;
      filterCatalog();
    }, 200);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    state.searchQuery = '';
    filterCatalog();
    searchInput.focus();
  });

  // Hotkey: press '/' to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !inspector.isOpen()) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Favorites Filter Toggle
  favoritesToggle.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    favoritesToggle.classList.toggle('active', state.favoritesOnly);
    if (state.favoritesOnly) {
      document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
    } else {
      document.querySelector('.category-chip')?.classList.add('active');
    }
    filterCatalog();
  });

  function updateFavCountBadge(count) {
    favCountBadge.textContent = count;
    favCountBadge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  window.favoritesManager.subscribe((count) => {
    updateFavCountBadge(count);
    // If currently filtering favorites, update gallery
    if (state.favoritesOnly) {
      filterCatalog();
    }
  });
  updateFavCountBadge(window.favoritesManager.count());

  // Random Inspiration Dice Roll
  diceTrigger.addEventListener('click', () => {
    if (catalog.length === 0) return;
    const pool = state.filtered.length > 0 ? state.filtered : catalog;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const chosen = pool[randomIndex];

    // Button spin animation
    diceTrigger.style.transform = 'rotate(360deg)';
    diceTrigger.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    setTimeout(() => {
      diceTrigger.style.transform = '';
      diceTrigger.style.transition = '';
    }, 500);

    window.showToast(`靈感擲骰：已選中 #${String(chosen.id).padStart(4, '0')} ${chosen.title}`);
    inspector.open(chosen, pool);
  });

  // Initial render
  totalCountEl.textContent = catalog.length;
  currentCountEl.textContent = catalog.length;
  initCategories();
  setLayout('masonry');
  filterCatalog();
});
