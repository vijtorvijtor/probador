// probador/js/galeria.js - Enfoque 90% con Hueco Vacío Óptica ECO

document.addEventListener('DOMContentLoaded', () => {
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const photoCountEl = document.getElementById('photo-count');
    const btnClearAll = document.getElementById('btn-clear-all');
    const comparisonModal = document.getElementById('comparison-modal');
    const gridContainer = document.getElementById('grid-favorites-container');
    const btnCloseGrid = document.getElementById('btn-close-grid');

    let photos = [];
    let focusedPhotoId = null;

    window.addEventListener('photoCaptured', (e) => {
        if (e.detail && e.detail.image) {
            addPhotoToGallery(e.detail.image, e.detail.type || 'image');
        }
    });

    function addPhotoToGallery(src, type) {
        photos.push({
            id: Date.now(),
            src: src,
            type: type,
            isFavorite: false
        });
        renderGallery();
    }

    function renderGallery() {
        if (!thumbnailsContainer) return;
        thumbnailsContainer.innerHTML = '';
        if (photoCountEl) photoCountEl.textContent = photos.length;

        photos.forEach((photo) => {
            const card = document.createElement('div');
            card.className = 'thumb-card' + (photo.isFavorite ? ' favorite' : '');
            
            let mediaTag = (photo.type === 'video') 
                ? '<video src="' + photo.src + '" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>'
                : '<img src="' + photo.src + '" style="width:100%; height:100%; object-fit:cover;">';

            const favClass = photo.isFavorite ? 'btn-icon btn-fav active' : 'btn-icon btn-fav';
            const favIcon = photo.isFavorite ? '★' : '☆';

            card.innerHTML = mediaTag + 
                '<div class="thumb-actions">' +
                    '<button class="' + favClass + '">' + favIcon + '</button>' +
                    '<button class="btn-icon btn-delete">🗑</button>' +
                '</div>';

            card.querySelector('.btn-fav').addEventListener('click', (ev) => {
                ev.stopPropagation();
                toggleFavorite(photo.id);
            });

            card.querySelector('.btn-delete').addEventListener('click', (ev) => {
                ev.stopPropagation();
                deletePhoto(photo.id);
            });

            thumbnailsContainer.appendChild(card);
        });
    }

    function toggleFavorite(id) {
        const photo = photos.find(p => p.id === id);
        if (!photo) return;

        const currentFavs = photos.filter(p => p.isFavorite).length;
        if (!photo.isFavorite && currentFavs >= 4) {
            alert("Máximo 4 favoritas permitidas para comparar.");
            return;
        }

        photo.isFavorite = !photo.isFavorite;
        renderGallery();
        
        if (comparisonModal && !comparisonModal.classList.contains('hidden')) {
            renderComparisonGrid();
        }
    }

    function deletePhoto(id) {
        photos = photos.filter(p => p.id !== id);
        renderGallery();
        if (comparisonModal && !comparisonModal.classList.contains('hidden')) {
            renderComparisonGrid();
        }
    }

    function renderComparisonGrid() {
        if (!gridContainer) return;
        const favorites = photos.filter(p => p.isFavorite);
        gridContainer.innerHTML = '';

        if (favorites.length === 0) {
            gridContainer.className = '';
            gridContainer.style.display = 'block';
            gridContainer.innerHTML = '<p style="color:#AAA; font-size:13px; text-align:center; padding:30px 0;">Selecciona al menos una opción con la estrella (★) para comparar.</p>';
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'comparison-wrapper';

        const baseGrid = document.createElement('div');
        // Asignar clase de diseño según la cantidad de fotos elegidas (1, 2, 3 o 4)
        const totalFavs = favorites.length;
        baseGrid.className = 'grid-container-base grid-layout-' + totalFavs;

        // DIBUJAR CUADRÍCULA BASE
        favorites.forEach((fav) => {
            const item = document.createElement('div');

            if (focusedPhotoId === fav.id) {
                item.className = 'grid-item-card empty-slot';
                item.innerHTML = '<span>SELECCIONADO</span>';
                item.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    focusedPhotoId = null;
                    renderComparisonGrid();
                });
            } else {
                item.className = 'grid-item-card';

                let mediaTag = (fav.type === 'video')
                    ? '<video src="' + fav.src + '" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>'
                    : '<img src="' + fav.src + '" style="width:100%; height:100%; object-fit:cover;">';

                item.innerHTML = mediaTag;

                item.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    focusedPhotoId = fav.id;
                    renderComparisonGrid();
                });
            }

            baseGrid.appendChild(item);
        });

        wrapper.appendChild(baseGrid);

        // CAPA DEL 90% DE ENFOQUE
        if (focusedPhotoId) {
            const focusedPhoto = favorites.find(f => f.id === focusedPhotoId);
            if (focusedPhoto) {
                const overlay = document.createElement('div');
                overlay.className = 'overlay-focus-container';

                const focusCard = document.createElement('div');
                focusCard.className = 'focus-card-90';

                let mediaTagFocused = (focusedPhoto.type === 'video')
                    ? '<video src="' + focusedPhoto.src + '" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>'
                    : '<img src="' + focusedPhoto.src + '" style="width:100%; height:100%; object-fit:cover;">';

                const btnUndo = document.createElement('button');
                btnUndo.className = 'btn-undo';
                btnUndo.innerHTML = '↩';
                btnUndo.title = 'Volver a la cuadrícula';
                btnUndo.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    focusedPhotoId = null;
                    renderComparisonGrid();
                });

                focusCard.innerHTML = mediaTagFocused;
                focusCard.appendChild(btnUndo);

                focusCard.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    focusedPhotoId = null;
                    renderComparisonGrid();
                });

                overlay.appendChild(focusCard);
                wrapper.appendChild(overlay);
            }
        }

        gridContainer.appendChild(wrapper);
    }

    if (comparisonModal) {
        comparisonModal.addEventListener('click', (e) => {
            if (e.target === comparisonModal) {
                focusedPhotoId = null;
                comparisonModal.classList.add('hidden');
            }
        });
    }

    window.openComparison = function() {
        focusedPhotoId = null;
        renderComparisonGrid();
        if (comparisonModal) {
            comparisonModal.classList.remove('hidden');
        }
    };

    if (btnCloseGrid) {
        btnCloseGrid.addEventListener('click', () => {
            focusedPhotoId = null;
            if (comparisonModal) comparisonModal.classList.add('hidden');
        });
    }

    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            if (photos.length === 0) return;
            if (confirm("¿Deseas eliminar todas las fotografías tomadas?")) {
                photos = [];
                focusedPhotoId = null;
                renderGallery();
                if (comparisonModal) comparisonModal.classList.add('hidden');
            }
        });
    }
});
