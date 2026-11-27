/**
 * js/galeria.js - Controlador Unificado de Carrete, Rejilla 2x2 y Vista Maximizada HD
 * Óptica ECO - Optimizado para Raspberry Pi 4
 */
(function() {
    const state = {
        items: [], // { id, type, ruta_baja, ruta_alta, file_hd, file_proxy, isFavorite, blobUrlBaja, blobUrlAlta }
        activeSlotIndex: null,
        isMaximizedOpen: false
    };

    const els = {};

    function cacheElements() {
        els.thumbnailsContainer = document.getElementById('thumbnails-container');
        els.carretePrev = document.getElementById('carrete-prev');
        els.carreteNext = document.getElementById('carrete-next');
        els.comparisonView = document.getElementById('comparison-view');
        els.grid2x2 = document.getElementById('comparison-grid-2x2');
        els.btnCloseComparison = document.getElementById('btn-close-comparison');
        els.btnCompareClose = document.getElementById('btn-compare-close');
        els.btnCompareWhatsapp = document.getElementById('btn-compare-whatsapp');
        els.maximizedView = document.getElementById('maximized-view');
        els.maximizedViewport = document.getElementById('maximized-viewport');
        els.maximizedStage = document.getElementById('maximized-media-stage');
        els.btnCloseMaximized = document.getElementById('btn-close-maximized');
        els.btnCompare = document.getElementById('btn-compare');
        els.btnCleanAll = document.getElementById('clean-all');
        els.btnGenerateQr = document.getElementById('btn-generate-qr');
        els.qrModal = document.getElementById('qr-modal');
        els.btnCloseQr = document.getElementById('btn-close-qr');
        els.qrImageWrapper = document.getElementById('qr-image-wrapper');
        els.qrUrlLabel = document.getElementById('qr-url-label');
    }

    function createMediaHTML(src, type, isLiveOrMaximized) {
        if (type === 'video') {
            // En carrete y rejilla 2x2 el video permanece pausado en primer cuadro para cuidar CPU/GPU en Raspberry Pi 4
            if (isLiveOrMaximized) {
                return `<video src="${src}" class="media-content" autoplay loop muted playsinline></video>`;
            }
            return `<video src="${src}#t=0.05" class="media-content" preload="metadata" muted playsinline></video>`;
        }
        return `<img src="${src}" class="media-content" draggable="false" alt="Captura Óptica ECO">`;
    }

    function autoAssignLastFourFavorites() {
        // Al agregar una nueva captura, si hay <= 4 todas son favoritas; si hay > 4 mantenemos las últimas 4 activas
        const total = state.items.length;
        state.items.forEach((item, idx) => {
            item.isFavorite = (idx >= total - 4);
        });
    }

    function addMediaItem(detail) {
        const id = detail.id || (Date.now() + Math.floor(Math.random() * 1000));
        const item = {
            id,
            type: detail.type || 'img',
            ruta_baja: detail.ruta_baja || detail.src,
            ruta_alta: detail.ruta_alta || detail.src,
            file_hd: detail.file_hd || detail.file || '',
            file_proxy: detail.file_proxy || '',
            blobUrlBaja: detail.blobUrlBaja || null,
            blobUrlAlta: detail.blobUrlAlta || null,
            isFavorite: true
        };
        state.items.push(item);
        autoAssignLastFourFavorites();
        renderCarrete(true);
        if (els.comparisonView && els.comparisonView.classList.contains('active')) {
            renderRejilla2x2();
        }
        return item;
    }

    function updateMediaPaths(id, serverData) {
        const item = state.items.find(i => i.id === id);
        if (!item || !serverData) return;
        if (serverData.ruta_baja) item.ruta_baja = serverData.ruta_baja;
        if (serverData.ruta_alta) item.ruta_alta = serverData.ruta_alta;
        if (serverData.file_hd || serverData.file) item.file_hd = serverData.file_hd || serverData.file;
        if (serverData.file_proxy) item.file_proxy = serverData.file_proxy;
    }

    function renderCarrete(scrollToEnd = false) {
        if (!els.thumbnailsContainer) return;
        els.thumbnailsContainer.innerHTML = '';

        state.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'marco-dorado carrete-item' + (item.isFavorite ? ' is-fav' : '');
            card.setAttribute('data-rol', 'carrete');
            card.setAttribute('data-id', item.id);

            if (window.GestorMedios && window.GestorMedios.metrics.carrete) {
                window.GestorMedios.aplicarVariablesElem(card, window.GestorMedios.metrics.carrete);
            }

            const favActiveClass = item.isFavorite ? 'fav-active' : '';
            const favSymbol = item.isFavorite ? '★' : '☆';

            card.innerHTML = `
                <div class="marco-inner">
                    ${createMediaHTML(item.ruta_baja, item.type, false)}
                    <div class="thumb-actions">
                        <button type="button" class="btn-delete" title="Eliminar">🗑️</button>
                        <button type="button" class="btn-fav ${favActiveClass}" title="Favorita">${favSymbol}</button>
                    </div>
                </div>
            `;

            card.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMediaItem(item.id);
            });

            card.querySelector('.btn-fav').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
            });

            els.thumbnailsContainer.appendChild(card);
        });

        if (scrollToEnd) {
            els.thumbnailsContainer.scrollLeft = els.thumbnailsContainer.scrollWidth;
        }
    }


    function toggleFavorite(id) {
        const item = state.items.find(p => p.id === id);
        if (!item) return;

        const currentFavs = state.items.filter(p => p.isFavorite).length;
        if (!item.isFavorite && currentFavs >= 4) {
            const oldestFav = state.items.find(p => p.isFavorite);
            if (oldestFav) oldestFav.isFavorite = false;
        }

        item.isFavorite = !item.isFavorite;
        renderCarrete(false);
        if (els.comparisonView && els.comparisonView.classList.contains('active')) {
            renderRejilla2x2();
        }
    }

    async function deleteMediaItem(id) {
        const idx = state.items.findIndex(p => p.id === id);
        if (idx === -1) return;
        const removed = state.items[idx];

        if (removed.blobUrlBaja) URL.revokeObjectURL(removed.blobUrlBaja);
        if (removed.blobUrlAlta) URL.revokeObjectURL(removed.blobUrlAlta);

        state.items.splice(idx, 1);
        renderCarrete(false);
        if (els.comparisonView && els.comparisonView.classList.contains('active')) {
            closeMaximizedView();
            renderRejilla2x2();
        }

        if (removed.file_hd && window.KIOSCO_SESSION_TOKEN) {
            try {
                await fetch('eliminar_foto.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: window.KIOSCO_SESSION_TOKEN,
                        foto: removed.file_hd,
                        foto_proxy: removed.file_proxy || ''
                    })
                });
            } catch (err) {}
        }
    }

    async function clearAllMedia() {
        if (state.items.length === 0) return;
        closeMaximizedView();
        state.items.forEach(it => {
            if (it.blobUrlBaja) URL.revokeObjectURL(it.blobUrlBaja);
            if (it.blobUrlAlta) URL.revokeObjectURL(it.blobUrlAlta);
        });
        state.items = [];
        renderCarrete(false);
        if (els.comparisonView) els.comparisonView.classList.remove('active');

        if (window.KIOSCO_SESSION_TOKEN) {
            try {
                await fetch('eliminar_foto.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: window.KIOSCO_SESSION_TOKEN, foto: '__ALL__' })
                });
            } catch (e) {}
        }
    }

    function getActiveFourForGrid() {
        const favs = state.items.filter(p => p.isFavorite);
        if (favs.length > 0) return favs.slice(-4);
        return state.items.slice(-4);
    }

    function renderRejilla2x2() {
        if (!els.grid2x2) return;
        els.grid2x2.innerHTML = '';
        els.grid2x2.classList.remove('grid-locked');

        const activeItems = getActiveFourForGrid();

        for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
            const mediaItem = activeItems[slotIdx] || null;
            const slotEl = document.createElement('div');
            slotEl.setAttribute('data-rol', 'rejilla');
            slotEl.setAttribute('data-slot', slotIdx);

            if (window.GestorMedios && window.GestorMedios.metrics.rejilla) {
                window.GestorMedios.aplicarVariablesElem(slotEl, window.GestorMedios.metrics.rejilla);
            }

            if (mediaItem) {
                slotEl.className = 'marco-dorado rejilla-item';
                slotEl.setAttribute('data-id', mediaItem.id);
                slotEl.innerHTML = `
                    <div class="marco-inner">
                        ${createMediaHTML(mediaItem.ruta_baja, mediaItem.type, false)}
                    </div>
                `;
                slotEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (state.isMaximizedOpen) return;
                    openMaximizedView(mediaItem, slotEl, slotIdx);
                });
            } else {
                slotEl.className = 'rejilla-slot-placeholder';
            }

            els.grid2x2.appendChild(slotEl);
        }
    }

    function openMaximizedView(mediaItem, slotEl, slotIdx) {
        if (state.isMaximizedOpen || !els.maximizedView || !els.maximizedStage) return;
        state.isMaximizedOpen = true;
        state.activeSlotIndex = slotIdx;

        if (slotEl) {
            slotEl.style.visibility = 'hidden';
            slotEl.classList.add('slot-hidden-hole');
        }
        if (els.grid2x2) {
            els.grid2x2.classList.add('grid-locked');
        }

        if (window.GestorMedios) {
            window.GestorMedios.recalcularGeometria();
            if (window.GestorMedios.metrics.maximizada) {
                window.GestorMedios.aplicarVariablesElem(els.maximizedView, window.GestorMedios.metrics.maximizada);
            }
        }

        els.maximizedStage.innerHTML = createMediaHTML(mediaItem.ruta_alta, mediaItem.type, true);
        els.maximizedView.classList.remove('hidden');

        if (window.GestorMedios) {
            window.GestorMedios.bindMaximizedGestures(els.maximizedViewport, els.maximizedStage);
            window.GestorMedios.resetZoomPan();
        }
    }

    function closeMaximizedView() {
        if (!els.maximizedView) return;

        if (window.GestorMedios) {
            window.GestorMedios.resetZoomPan();
        }

        if (els.maximizedStage) {
            const hdMedia = els.maximizedStage.querySelector('img, video');
            if (hdMedia) {
                if (hdMedia.tagName === 'VIDEO') hdMedia.pause();
                hdMedia.removeAttribute('src');
                if (typeof hdMedia.load === 'function') hdMedia.load();
            }
            els.maximizedStage.innerHTML = '';
        }

        els.maximizedView.classList.add('hidden');

        if (els.grid2x2) {
            els.grid2x2.querySelectorAll('.slot-hidden-hole').forEach(el => {
                el.style.visibility = 'visible';
                el.classList.remove('slot-hidden-hole');
            });
            els.grid2x2.classList.remove('grid-locked');
        }

        state.isMaximizedOpen = false;
        state.activeSlotIndex = null;
    }

    function openComparisonView() {
        if (!els.comparisonView) return;
        closeMaximizedView();
        renderRejilla2x2();
        els.comparisonView.classList.add('active');
        if (window.GestorMedios) window.GestorMedios.recalcularGeometria();
    }

    function closeComparisonView() {
        closeMaximizedView();
        if (els.comparisonView) els.comparisonView.classList.remove('active');
    }

    function toggleComparisonView() {
        if (!els.comparisonView) return;
        if (els.comparisonView.classList.contains('active')) {
            closeComparisonView();
        } else {
            openComparisonView();
        }
    }

    function showWhatsAppQR() {
        if (!els.qrModal || !els.qrImageWrapper) return;
        const token = window.KIOSCO_SESSION_TOKEN || '';
        const galleryUrl = new URL('galeria.php?token=' + encodeURIComponent(token), window.location.href).href;
        const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=' + encodeURIComponent(galleryUrl);

        els.qrImageWrapper.innerHTML = `<img src="${qrApiUrl}" alt="Código QR WhatsApp" class="qr-code-img">`;
        if (els.qrUrlLabel) els.qrUrlLabel.textContent = galleryUrl;
        els.qrModal.classList.remove('hidden');
    }

    document.addEventListener('DOMContentLoaded', () => {
        cacheElements();

        if (els.carretePrev && els.thumbnailsContainer) {
            els.carretePrev.addEventListener('click', () => {
                const step = (window.GestorMedios?.metrics?.carrete?.wFoto || 280) + 20;
                els.thumbnailsContainer.scrollBy({ left: -step, behavior: 'smooth' });
            });
        }
        if (els.carreteNext && els.thumbnailsContainer) {
            els.carreteNext.addEventListener('click', () => {
                const step = (window.GestorMedios?.metrics?.carrete?.wFoto || 280) + 20;
                els.thumbnailsContainer.scrollBy({ left: step, behavior: 'smooth' });
            });
        }

        if (els.btnCloseMaximized) {
            els.btnCloseMaximized.addEventListener('click', (e) => {
                e.stopPropagation();
                closeMaximizedView();
            });
        }

        if (els.btnCompare) els.btnCompare.addEventListener('click', toggleComparisonView);
        if (els.btnCloseComparison) els.btnCloseComparison.addEventListener('click', closeComparisonView);
        if (els.btnCompareClose) els.btnCompareClose.addEventListener('click', closeComparisonView);

        if (els.btnGenerateQr) els.btnGenerateQr.addEventListener('click', showWhatsAppQR);
        if (els.btnCompareWhatsapp) els.btnCompareWhatsapp.addEventListener('click', showWhatsAppQR);
        if (els.btnCloseQr && els.qrModal) {
            els.btnCloseQr.addEventListener('click', () => els.qrModal.classList.add('hidden'));
        }
        if (els.btnCleanAll) {
            els.btnCleanAll.addEventListener('click', clearAllMedia);
        }

        window.addEventListener('kioscoMediaCaptured', (e) => {
            if (e.detail) addMediaItem(e.detail);
        });
    });

    window.KioscoGaleria = {
        addMediaItem,
        updateMediaPaths,
        openComparisonView,
        closeComparisonView,
        toggleComparisonView,
        closeMaximizedView,
        getState: () => state
    };
    window.openComparison = toggleComparisonView;
})();

