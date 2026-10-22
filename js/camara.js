// js/camara.js - Óptica ECO (Versión Nativa Sin Restricciones Forzadas)

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

    // Módulos QR / WhatsApp Directo
    const btnGenerateQR = document.getElementById('btn-generate-qr');
    const modalQR = document.getElementById('modal-qr');
    const btnCloseQR = document.getElementById('btn-close-qr');
    const qrCodeImg = document.getElementById('qr-code-img');
    const qrUrlInput = document.getElementById('qr-url-input');
    const btnCopyUrl = document.getElementById('btn-copy-url');

    let capturedPhotos = [];
    let mediaStream = null;

    async function initCamera() {
        try {
            // Se eliminan las restricciones forzadas de width/height para aceptar el flujo nativo de la Arducam
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            if (video) {
                video.srcObject = mediaStream;
                await video.play();
            }
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            alert("Atención: No se pudo activar la cámara web. Asegúrate de otorgar permisos en el navegador.");
        }
    }

    if (btnCapture) {
        btnCapture.addEventListener('click', (e) => {
            e.preventDefault();
            startFastCountdown(() => { takeCleanSnapshot(); });
        });
    }

    if (btnLoop) {
        btnLoop.addEventListener('click', (e) => {
            e.preventDefault();
            startFastCountdown(() => { recordLoopAsync(3000); });
        });
    }

    if (btnCompare) {
        btnCompare.addEventListener('click', () => { openComparisonModal(); });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => { closeComparisonModal(); });
    }

    if (cleanAll) {
        cleanAll.addEventListener('click', () => {
            capturedPhotos = [];
            renderThumbnails();
        });
    }

    if (btnGenerateQR) {
        btnGenerateQR.addEventListener('click', () => { generateRealQR(); });
    }

    if (btnCloseQR) {
        btnCloseQR.addEventListener('click', () => {
            if (modalQR) modalQR.classList.add('hidden');
        });
    }

    if (btnCopyUrl) {
        btnCopyUrl.addEventListener('click', () => {
            if (qrUrlInput && qrUrlInput.value) {
                navigator.clipboard.writeText(qrUrlInput.value);
                btnCopyUrl.textContent = "¡COPIADO!";
                setTimeout(() => { btnCopyUrl.textContent = "COPIAR"; }, 2000);
            }
        });
    }

    async function generateRealQR() {
        const imagePhotos = capturedPhotos.filter(item => item.type === 'image').map(item => item.src);

        if (imagePhotos.length === 0) {
            alert("Toma al menos una fotografía antes de solicitar las fotos por WhatsApp.");
            return;
        }

        try {
            btnGenerateQR.textContent = "GENERANDO WHATSAPP...";

            const response = await fetch('generar_qr.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fotos: imagePhotos })
            });

            const res = await response.json();

            if (res.status === 'success' && res.qr_img && res.url) {
                qrCodeImg.src = res.qr_img;

                if (qrUrlInput) {
                    qrUrlInput.value = res.url;
                }

                modalQR.classList.remove('hidden');
            } else {
                alert("Ocurrió un inconveniente al generar el código para WhatsApp.");
            }
        } catch (err) {
            console.error("Error al procesar el QR de WhatsApp:", err);
            alert("Error al conectar con el servidor para generar el mensaje de WhatsApp.");
        } finally {
            btnGenerateQR.textContent = "📲 RECIBIR FOTOS POR WHATSAPP";
        }
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
                }, 300);

            }, 300);

        }, 300);
    }

    function takeCleanSnapshot() {
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        const vWidth = video.videoWidth || 640;
        const vHeight = video.videoHeight || 480;

        const size = Math.min(vWidth, vHeight);
        const startX = (vWidth - size) / 2;
        const startY = (vHeight - size) / 2;

        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

        const imageData = canvas.toDataURL('image/jpeg', 0.92);
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
        const isFavoriteAuto = capturedPhotos.length < 4;
        capturedPhotos.push({
            id: Date.now(),
            src: url,
            type: type,
            favorite: isFavoriteAuto
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
            card.className = `thumb-card ${item.favorite ? 'is-favorite' : ''}`;

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

            const btnFav = document.createElement('button');
            btnFav.className = 'btn-fav-thumb';
            btnFav.innerHTML = '★';
            btnFav.title = item.favorite ? 'Quitar Favorito' : 'Marcar Favorito';
            btnFav.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(item.id);
            });

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-delete-thumb';
            btnDel.innerHTML = '✖';
            btnDel.title = 'Eliminar fotografía';
            btnDel.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteItem(item.id);
            });

            card.appendChild(btnFav);
            card.appendChild(btnDel);
            thumbnailsContainer.appendChild(card);
        });
    }

    function openComparisonModal() {
        const favorites = capturedPhotos.filter(item => item.favorite);

        if (favorites.length === 0) {
            alert("No tienes capturas marcadas como favoritas (★) para comparar. Marca hasta 4 fotos.");
            return;
        }

        renderComparisonGrid(favorites);
        modalCompare.classList.remove('hidden');
    }

    function closeComparisonModal() {
        modalCompare.classList.add('hidden');
    }

    function renderComparisonGrid(favorites) {
        if (!gridComparison) return;
        gridComparison.innerHTML = '';

        const count = favorites.length;

        if (count <= 2) {
            gridComparison.className = 'grid-container-base grid-2';
        } else {
            gridComparison.className = 'grid-container-base grid-4';
        }

        const slotsToRender = (count <= 2) ? 2 : 4;

        for (let i = 0; i < slotsToRender; i++) {
            const card = document.createElement('div');

            if (i < count) {
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

                const btnRemove = document.createElement('button');
                btnRemove.className = 'btn-remove-grid';
                btnRemove.innerHTML = 'QUITAR ✖';
                btnRemove.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                    const updatedFavorites = capturedPhotos.filter(f => f.favorite);
                    if (updatedFavorites.length === 0) {
                        closeComparisonModal();
                    } else {
                        renderComparisonGrid(updatedFavorites);
                    }
                });
                card.appendChild(btnRemove);

                card.addEventListener('click', () => {
                    const isZoomed = card.classList.contains('zoomed');
                    document.querySelectorAll('.grid-item-card').forEach(c => c.classList.remove('zoomed'));
                    if (!isZoomed) {
                        card.classList.add('zoomed');
                    }
                });

            } else {
                card.className = 'grid-item-card empty-slot';
                card.innerHTML = '<span style="color: rgba(255,255,255,0.4); font-weight: bold; font-size: 14px;">+ Espacio Libre</span>';
            }

            gridComparison.appendChild(card);
        }
    }

    initCamera();
});
