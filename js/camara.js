// probador/js/camara.js - Óptica ECO

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas-capture');
    const btnCapture = document.getElementById('btn-capture');
    const btnLoop = document.getElementById('btn-loop');
    const btnCompare = document.getElementById('btn-compare');
    const cleanAll = document.getElementById('clean-all');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');

    const modalCompare = document.getElementById('modal-compare');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const gridComparison = document.getElementById('grid-comparison');
    const overlayFocus = document.getElementById('overlay-focus');
    const focusCardBody = document.getElementById('focus-card-body');

    let capturedPhotos = [];
    let mediaStream = null;

    async function initCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1080 },
                    height: { ideal: 1080 },
                    facingMode: "user"
                },
                audio: false
            });
            if (video) {
                video.srcObject = mediaStream;
                await video.play();
            }
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            alert("No se pudo conectar con la cámara web.");
        }
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', () => {
            startFastCountdown(() => { takeSquareSnapshot(); });
        });
    }

    if (btnLoop) {
        btnLoop.addEventListener('click', () => {
            startFastCountdown(() => { recordLoopAsync(3000); });
        });
    }

    if (btnCompare) {
        btnCompare.addEventListener('click', () => { openComparisonModal(); });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => { closeComparisonModal(); });
    }

    if (focusCardBody) {
        focusCardBody.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFocusView();
        });
    }

    if (cleanAll) {
        cleanAll.addEventListener('click', () => {
            capturedPhotos = [];
            renderThumbnails();
        });
    }

    function startFastCountdown(callback) {
        if (!countdownOverlay) { callback(); return; }
        countdownOverlay.classList.remove('hidden');
        countdownNumber.textContent = '3';

        setTimeout(() => {
            countdownNumber.textContent = '2';

            setTimeout(() => {
                countdownNumber.textContent = '1';

                setTimeout(() => {
                    countdownOverlay.classList.add('hidden');
                    callback();
                }, 800);

            }, 800);

        }, 350);
    }

    function takeSquareSnapshot() {
        if (!video || !video.videoWidth || !video.videoHeight) return;

        const context = canvas.getContext('2d');
        const size = Math.min(video.videoWidth, video.videoHeight);
        
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        canvas.width = size;
        canvas.height = size;

        context.drawImage(video, startX, startY, size, size, 0, 0, size, size);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        addCapturedItem(imageData, 'image');
    }

    function recordLoopAsync(durationMs) {
        if (!mediaStream) return;
        const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            if (blob.size > 0) {
                const videoURL = URL.createObjectURL(blob);
                addCapturedItem(videoURL, 'video');
            }
        };

        mediaRecorder.start(100);
        setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        }, durationMs);
    }

    function addCapturedItem(url, type) {
        capturedPhotos.push({
            id: Date.now(),
            src: url,
            type: type,
            favorite: true
        });
        renderThumbnails();
    }

    function toggleFavorite(id) {
        capturedPhotos = capturedPhotos.map(item => {
            if (item.id === id) {
                return { ...item, favorite: !item.favorite };
            }
            return item;
        });
        renderThumbnails();
    }

    function deleteItem(id) {
        capturedPhotos = capturedPhotos.filter(item => item.id !== id);
        renderThumbnails();
    }

    function renderThumbnails() {
        if (!thumbnailsContainer) return;
        thumbnailsContainer.innerHTML = '';

        capturedPhotos.forEach((item) => {
            const card = document.createElement('div');
            card.className = `thumb-card ${item.favorite ? 'favorite' : ''}`;

            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.src;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                card.appendChild(img);
            } else {
                const vid = document.createElement('video');
                vid.src = item.src;
                vid.autoplay = true;
                vid.loop = true;
                vid.muted = true;
                vid.style.width = '100%';
                vid.style.height = '100%';
                vid.style.objectFit = 'cover';
                card.appendChild(vid);
            }

            const actions = document.createElement('div');
            actions.className = 'thumb-actions';

            const btnFav = document.createElement('button');
            btnFav.className = `btn-icon btn-fav ${item.favorite ? 'active' : ''}`;
            btnFav.innerHTML = '★';
            btnFav.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
            });

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-icon btn-delete';
            btnDel.innerHTML = '🗑';
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteItem(item.id);
            });

            actions.appendChild(btnFav);
            actions.appendChild(btnDel);
            card.appendChild(actions);

            thumbnailsContainer.appendChild(card);
        });
    }

    function openComparisonModal() {
        const favorites = capturedPhotos.filter(item => item.favorite);

        if (favorites.length === 0) {
            alert("No tienes capturas marcadas como favoritas (★) para comparar.");
            return;
        }

        renderComparisonGrid(favorites);
        modalCompare.classList.remove('hidden');
    }

    function closeComparisonModal() {
        modalCompare.classList.add('hidden');
        closeFocusView();
    }

    function renderComparisonGrid(favorites) {
        gridComparison.innerHTML = '';
        const totalSlots = 4;

        for (let i = 0; i < totalSlots; i++) {
            const card = document.createElement('div');

            if (i < favorites.length) {
                const item = favorites[i];
                card.className = 'grid-item-card';

                if (item.type === 'image') {
                    const img = document.createElement('img');
                    img.src = item.src;
                    card.appendChild(img);
                } else {
                    const vid = document.createElement('video');
                    vid.src = item.src;
                    vid.autoplay = true;
                    vid.loop = true;
                    vid.muted = true;
                    card.appendChild(vid);
                }

                card.addEventListener('click', (e) => {
                    e.stopPropagation();
                    triggerFocusView(item);
                });
            } else {
                card.className = 'grid-item-card empty-slot';
                card.innerHTML = '<span>Espacio Libre</span>';
            }

            gridComparison.appendChild(card);
        }
    }

    function triggerFocusView(item) {
        focusCardBody.innerHTML = '';

        if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.src;
            focusCardBody.appendChild(img);
        } else {
            const vid = document.createElement('video');
            vid.src = item.src;
            vid.autoplay = true;
            vid.loop = true;
            vid.muted = true;
            focusCardBody.appendChild(vid);
        }

        overlayFocus.style.pointerEvents = 'none';
        focusCardBody.style.pointerEvents = 'auto';

        overlayFocus.classList.remove('hidden');
    }

    function closeFocusView() {
        if (overlayFocus) {
            overlayFocus.classList.add('hidden');
        }
    }

    initCamera();
});
