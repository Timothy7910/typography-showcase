/**
 * Specimen Inspector (标本镜鉴)
 * Features: Deep zoom & drag-pan, Canvas dynamic color palette sampling,
 * metadata extraction, keyboard navigation & clipboard actions.
 */

class SpecimenInspector {
  constructor() {
    this.currentItem = null;
    this.currentList = [];
    this.currentIndex = -1;

    // Zoom & Pan state
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.backdrop = document.getElementById('modalBackdrop');
    this.stage = document.getElementById('modalStage');
    this.canvasWrapper = document.getElementById('stageCanvasWrapper');
    this.fullImg = document.getElementById('modalFullImg');
    
    this.titleEl = document.getElementById('modalItemTitle');
    this.indexEl = document.getElementById('modalItemIndex');
    this.zoomLabel = document.getElementById('zoomLevelLabel');

    // Panel elements
    this.paletteContainer = document.getElementById('extractedPalette');
    this.metaResolution = document.getElementById('metaResolution');
    this.metaAspect = document.getElementById('metaAspect');
    this.metaFormat = document.getElementById('metaFormat');
    this.metaSize = document.getElementById('metaSize');
    this.metaFilename = document.getElementById('metaFilename');
    this.metaCategory = document.getElementById('metaCategory');

    this.ocrSection = document.getElementById('ocrSection');
    this.ocrTextEl = document.getElementById('modalOcrText');

    // Action buttons
    this.btnPrev = document.getElementById('modalBtnPrev');
    this.btnNext = document.getElementById('modalBtnNext');
    this.btnClose = document.getElementById('modalBtnClose');
    this.btnZoomIn = document.getElementById('btnZoomIn');
    this.btnZoomOut = document.getElementById('btnZoomOut');
    this.btnZoomReset = document.getElementById('btnZoomReset');
    this.btnFavorite = document.getElementById('modalBtnFavorite');
    this.btnDownload = document.getElementById('modalBtnDownload');
  }

  bindEvents() {
    // Navigation
    this.btnPrev.addEventListener('click', (e) => { e.stopPropagation(); this.navigate(-1); });
    this.btnNext.addEventListener('click', (e) => { e.stopPropagation(); this.navigate(1); });
    this.btnClose.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop || e.target === this.stage) {
        this.close();
      }
    });

    // Zoom controls
    this.btnZoomIn.addEventListener('click', () => this.setZoom(this.scale + 0.3));
    this.btnZoomOut.addEventListener('click', () => this.setZoom(this.scale - 0.3));
    this.btnZoomReset.addEventListener('click', () => this.resetTransform());

    // Mouse wheel zoom
    this.stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      this.setZoom(this.scale + delta);
    }, { passive: false });

    // Drag-to-pan
    this.stage.addEventListener('mousedown', (e) => {
      if (e.target === this.fullImg || e.target === this.stage || e.target === this.canvasWrapper) {
        this.isDragging = true;
        this.startX = e.clientX - this.translateX;
        this.startY = e.clientY - this.translateY;
        this.stage.classList.add('panning');
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.stage.classList.remove('panning');
    });

    // Double click to toggle zoom
    this.stage.addEventListener('dblclick', () => {
      if (this.scale > 1.2) {
        this.resetTransform();
      } else {
        this.setZoom(2.2);
      }
    });

    // Favorite button
    this.btnFavorite.addEventListener('click', () => {
      if (!this.currentItem) return;
      const isFav = window.favoritesManager.toggle(this.currentItem.id);
      this.updateFavoriteUI(isFav);
      window.showToast?.(isFav ? '已添加至灵感收藏' : '已从收藏中移除');
    });

    // Download action
    this.btnDownload.addEventListener('click', () => {
      if (!this.currentItem) return;
      const link = document.createElement('a');
      link.href = this.currentItem.src;
      link.download = this.currentItem.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;

      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.navigate(-1);
          break;
        case 'ArrowRight':
          this.navigate(1);
          break;
        case 'f':
        case 'F':
          this.btnFavorite.click();
          break;
        case 'r':
        case 'R':
        case '0':
          this.resetTransform();
          break;
        case '+':
        case '=':
          this.setZoom(this.scale + 0.3);
          break;
        case '-':
          this.setZoom(this.scale - 0.3);
          break;
      }
    });
  }

  isOpen() {
    return this.backdrop.classList.contains('open');
  }

  open(item, currentList = []) {
    this.currentItem = item;
    this.currentList = currentList.length > 0 ? currentList : [item];
    this.currentIndex = this.currentList.findIndex(x => x.id === item.id);

    this.renderCurrent();
    this.backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.backdrop.classList.remove('open');
    document.body.style.overflow = '';
    this.resetTransform();
  }

  navigate(dir) {
    if (this.currentList.length <= 1) return;
    this.currentIndex = (this.currentIndex + dir + this.currentList.length) % this.currentList.length;
    this.currentItem = this.currentList[this.currentIndex];
    this.renderCurrent();
  }

  renderCurrent() {
    const item = this.currentItem;
    if (!item) return;

    this.resetTransform();

    this.titleEl.textContent = item.title;
    this.indexEl.textContent = `#${String(item.id).padStart(4, '0')}`;
    this.metaCategory.textContent = item.category;
    this.metaFilename.textContent = item.originalName;
    this.metaFormat.textContent = item.ext;
    this.metaSize.textContent = item.size;

    if (this.ocrSection && this.ocrTextEl) {
      if (item.ocrText && item.ocrText.trim().length > 0) {
        this.ocrSection.style.display = 'block';
        this.ocrTextEl.textContent = item.ocrText;
      } else {
        this.ocrSection.style.display = 'none';
      }
    }

    this.updateFavoriteUI(window.favoritesManager.has(item.id));

    // Reset image & palette
    this.fullImg.src = item.src;
    this.metaResolution.textContent = '载入中...';
    this.metaAspect.textContent = '-';
    this.paletteContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-tertiary)">色彩提取中...</span>';

    // On image load
    this.fullImg.onload = () => {
      const nw = this.fullImg.naturalWidth;
      const nh = this.fullImg.naturalHeight;
      this.metaResolution.textContent = `${nw} × ${nh} px`;
      
      const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
      const div = gcd(nw, nh);
      const arW = Math.round(nw / div);
      const arH = Math.round(nh / div);
      this.metaAspect.textContent = (arW <= 16 && arH <= 16) ? `${arW}:${arH}` : `${(nw / nh).toFixed(2)}:1`;

      this.extractPalette();
    };
  }

  updateFavoriteUI(isFav) {
    if (isFav) {
      this.btnFavorite.classList.add('active');
      this.btnFavorite.innerHTML = window.Icons.get('heart-filled', 18);
    } else {
      this.btnFavorite.classList.remove('active');
      this.btnFavorite.innerHTML = window.Icons.get('heart', 18);
    }
  }

  resetTransform() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransform();
  }

  setZoom(newScale) {
    this.scale = Math.min(Math.max(newScale, 0.5), 5.0);
    this.applyTransform();
  }

  applyTransform() {
    this.canvasWrapper.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    this.zoomLabel.textContent = `${Math.round(this.scale * 100)}%`;
  }

  /**
   * Samples top dominant distinct colors from the image using HTML5 Canvas
   */
  extractPalette() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const sampleSize = 64;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      ctx.drawImage(this.fullImg, 0, 0, sampleSize, sampleSize);
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

      const colorMap = {};
      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        if (a < 128) continue; // Skip transparency

        // Quantize colors to reduce noise
        const qr = Math.round(r / 24) * 24;
        const qg = Math.round(g / 24) * 24;
        const qb = Math.round(b / 24) * 24;
        const key = `${qr},${qg},${qb}`;
        colorMap[key] = (colorMap[key] || 0) + 1;
      }

      // Sort by frequency
      const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
      const palette = [];

      for (const [key] of sorted) {
        const [r, g, b] = key.split(',').map(Number);
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        
        // Filter out colors too close to existing ones
        const isDuplicate = palette.some(c => {
          const dr = Math.abs(c.r - r);
          const dg = Math.abs(c.g - g);
          const db = Math.abs(c.b - b);
          return dr + dg + db < 45;
        });

        if (!isDuplicate) {
          palette.push({ hex, r, g, b });
        }
        if (palette.length >= 5) break;
      }

      this.renderPalette(palette);
    } catch (err) {
      console.warn('Canvas palette extraction error (CORS or image access)', err);
      this.paletteContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-tertiary)">色谱不可取</span>';
    }
  }

  renderPalette(palette) {
    if (palette.length === 0) {
      this.paletteContainer.innerHTML = '<span style="font-size:0.75rem;color:var(--text-tertiary)">未提取到显性色</span>';
      return;
    }

    this.paletteContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'color-swatches-grid';

    palette.forEach(color => {
      const item = document.createElement('div');
      item.className = 'color-swatch-item';
      item.title = `点击复制 ${color.hex.toUpperCase()}`;

      item.innerHTML = `
        <div class="color-chip" style="background-color: ${color.hex}"></div>
        <span class="color-hex">${color.hex.toUpperCase()}</span>
      `;

      item.addEventListener('click', () => {
        navigator.clipboard.writeText(color.hex.toUpperCase()).then(() => {
          window.showToast?.(`已复制色值: ${color.hex.toUpperCase()}`);
        });
      });

      grid.appendChild(item);
    });

    this.paletteContainer.appendChild(grid);
  }
}

window.SpecimenInspector = SpecimenInspector;
