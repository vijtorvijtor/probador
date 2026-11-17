// js/camara.js?v=<?php echo time(); ?>
(function() {
const debug = document.getElementById('debug-log');
        const screensaver = document.getElementById('screensaver');
        const videoSS = document.getElementById('video-screensaver');

    function log(msg) { if(debug) debug.innerHTML = msg; }
        function hideScreensaver() {
        if (screensaver) {
            screensaver.style.display = 'none'; // Forzado visual
            screensaver.classList.add('hidden');
        }
        if (debug) debug.innerHTML = "PROCESO: Screensaver desactivado por interacción.";
    }

    // Eventos directos en el documento y en el elemento
        document.addEventListener('click', hideScreensaver);
    document.addEventListener('touchstart', hideScreensaver);
    if (screensaver) {
        screensaver.addEventListener('click', hideScreensaver);
    }

    async function initCamera() {
            try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            const video = document.getElementById('webcam');
            if(video) video.srcObject = stream;
        } catch (err) {
            log("ERROR CÁMARA: " + err.message);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        initCamera();

        // 1. Protección contra botones inexistentes
        function safeAssign(id, fn) {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = fn;
            } else {
                console.warn("AVISO: Botón " + id + " no encontrado en el DOM.");
            }
        }

        // 3. Inicialización segura de botones (sin romper el script)
        const btnIds = ['btn-capture', 'btn-loop', 'btn-compare', 'btn-generate-qr', 'clean-all'];
        btnIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', () => log("Click detectado en: " + id));
            } else {
                log("<span style='color:orange'>AVISO: Botón " + id + " no existe en DOM.</span>");
            }
        });
        const video = document.getElementById('webcam');
        const canvas = document.getElementById('canvas-capture');
        const btnCapture = document.getElementById('btn-capture');
        const btnLoop = document.getElementById('btn-loop');
        const btnCompare = document.getElementById('btn-compare');
        const btnGenerateQR = document.getElementById('btn-generate-qr');
        const thumbnailsContainer = document.getElementById('thumbnails-container');
        const countdownOverlay = document.getElementById('countdown-overlay');
        const countdownNumber = document.getElementById('countdown-number');
        const modalCompare = document.getElementById('modal-compare');
        const gridComparison = document.getElementById('grid-comparison');
        const sessionToken = "ECO_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        const btnCloseModal = document.getElementById('btn-close-modal');
        const overlayText = document.querySelector('.overlay-text');
        let capturedPhotos = [];
        let mediaStream = null;
        let idleTimer;

        function resetIdleTimer() {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
            if(screensaver) {
                screensaver.style.display = '';
                screensaver.classList.remove('hidden');
        }
            }, 60000);
        }

        // Escuchar ambos eventos para compatibilidad PC y Touch
        document.addEventListener('touchstart', resetIdleTimer, { passive: false });
        document.addEventListener('click', resetIdleTimer);

        // Al cargar la página, aseguramos que esté visible
        window.onload = () => {
            if(screensaver) screensaver.classList.remove('hidden');
                };

        // Si el video falla al cargar o no está listo, mostramos el texto
    if(videoSS) videoSS.onerror = () => { screensaver.classList.add('screensaver-error'); };

        // --- FAVORITOS (Últimos 4) ---
        function updateFavoritesLogic() {
            capturedPhotos.forEach((item, index) => {
                const isFav = index >= capturedPhotos.length - 4;
                item.favorite = isFav;
                const card = document.getElementById(`card-${item.id}`);
                if (card) card.classList.toggle('is-favorite', isFav);
    });
        }

        function addMedia(blob, type) {
            const url = URL.createObjectURL(blob);
            const item = {
                id: Date.now(),
                blob: blob,
                full: url,
                type: type,
                favorite: true
        };
            capturedPhotos.push(item);

            const card = document.createElement('div');
            card.className = 'thumb-card';
            card.id = `card-${item.id}`;
            card.innerHTML = `<img src="${url}">`;
            card.onclick = () => {
                item.favorite = !item.favorite;
                card.classList.toggle('is-favorite', item.favorite);
            };

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-delete-thumb'; btnDel.innerHTML = '✖';
            btnDel.onclick = (e) => {
                e.stopPropagation();
            capturedPhotos = capturedPhotos.filter(i => i.id !== item.id);
                card.remove();
                updateFavoritesLogic();
            };
            card.appendChild(btnDel);
        if(thumbnailsContainer) thumbnailsContainer.appendChild(card);

            updateFavoritesLogic();
        if(thumbnailsContainer) thumbnailsContainer.scrollLeft = thumbnailsContainer.scrollWidth;
        }

        // --- CAPTURA ---
        function capture() {
        if(!video) return;
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size; canvas.height = size;
            canvas.getContext('2d').drawImage(video, (video.videoWidth-size)/2, (video.videoHeight-size)/2, size, size, 0, 0, size, size);
            canvas.toBlob(blob => addMedia(blob, 'image'), 'image/jpeg', 0.8);
        }

        const fastTouch = (el, fn) => {
            if (!el) return;
            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                el.classList.add('btn-active-state');
                setTimeout(() => el.classList.remove('btn-active-state'), 150);
                fn();
            }, { passive: false });
        };

        function startCountdown(callback) {
            if(countdownOverlay) countdownOverlay.classList.remove('hidden');
            let count = 3; if(countdownNumber) countdownNumber.textContent = count;
            const intv = setInterval(() => {
                count--;
                if(count > 0) {
                    if(countdownNumber) countdownNumber.textContent = count;
                } else {
                    clearInterval(intv);
                    if(countdownOverlay) countdownOverlay.classList.add('hidden');
                    callback();
                }
            }, 400);
        }

        fastTouch(btnCapture, () => startCountdown(capture));
    fastTouch(btnCloseModal, () => { if(modalCompare) modalCompare.classList.add('hidden'); });

        // --- COMPARATIVA VS (SWAP ZOOM) ---
    if(btnCompare) btnCompare.onclick = () => {
            const favs = capturedPhotos.filter(p => p.favorite);
            if (favs.length === 0) return;

            gridComparison.innerHTML = '';
            favs.forEach(p => {
                const card = document.createElement('div');
                card.className = 'vs-card';
                card.innerHTML = `<img src="${p.full}">`;
                card.onclick = () => {
                    const wasExpanded = card.classList.contains('expanded');
                    document.querySelectorAll('.vs-card').forEach(c => c.classList.remove('expanded'));
                    if (!wasExpanded) card.classList.add('expanded');
                };
                gridComparison.appendChild(card);
    });
            if(modalCompare) modalCompare.classList.remove('hidden');
        };

        // --- SUBIDA Y QR ---
        safeAssign('btn-generate-qr', async () => {
            const favs = capturedPhotos.filter(p => p.favorite);
            if (favs.length === 0) return alert("Captura fotos primero");

            btnGenerateQR.innerText = "SUBIENDO...";
            btnGenerateQR.disabled = true;

            try {
                for (let item of favs) {
                    const formData = new FormData();
                    formData.append('file', item.blob, `foto_${item.id}.jpg`);
                    formData.append('token', sessionToken);
                    await fetch('upload.php', { method: 'POST', body: formData });
                }

                const res = await fetch('generar_qr.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fotos: favs.map(f => `foto_${f.id}.jpg`), token: sessionToken })
                });
                const data = await res.json();

                if(data.status === 'success') {
                    document.getElementById('qr-code-img').src = data.qr_img;
                    document.getElementById('modal-qr').classList.remove('hidden');
                }
            } catch (e) { alert("Error al subir"); }
            btnGenerateQR.innerText = "📲 ENVIAR A WHATSAPP";
            btnGenerateQR.disabled = false;
        });
        const modalSecurity = document.getElementById('modal-security');
        const btnConfirmClean = document.getElementById('confirm-clean');
        const btnCancelClean = document.getElementById('cancel-clean');

        safeAssign('clean-all', () => {
            if (capturedPhotos.length === 0) return;
            if(modalSecurity) modalSecurity.classList.remove('hidden');
        });
        // --- BORRADO SEGURO ---
    if(btnConfirmClean) btnConfirmClean.onclick = async () => {
            capturedPhotos.forEach(p => URL.revokeObjectURL(p.full));
            capturedPhotos = [];
            if(thumbnailsContainer) thumbnailsContainer.innerHTML = '';
            if(modalSecurity) modalSecurity.classList.add('hidden');

            fetch(`limpiar_nube.php?token=${sessionToken}`);
        };

        fastTouch(btnCancelClean, () => {
        if(modalSecurity) modalSecurity.classList.add('hidden');
        });
    });
})();

