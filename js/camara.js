// js/camara.js - Óptica ECO v4.5
document.addEventListener('DOMContentLoaded', () => {
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
    const screensaver = document.getElementById('screensaver');
    const videoSS = document.getElementById('video-screensaver');
    const overlayText = document.querySelector('.overlay-text');
    let capturedPhotos = []; 
    let mediaStream = null;
    let idleTimer;

    // Al cargar la página, aseguramos que esté visible
    window.onload = () => {
        screensaver.classList.remove('hidden');
    };

    // Si el video falla al cargar o no está listo, mostramos el texto
    videoSS.onerror = () => { screensaver.classList.add('screensaver-error'); };

    // Al tocar, reseteamos
    document.addEventListener('touchstart', () => {
        screensaver.classList.add('hidden');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            screensaver.classList.remove('hidden');
        }, 60000);
    });
    // --- CÁMARA ---
    async function initCamera() {
        const debug = document.getElementById('debug-log');
        // Ocultamos el log completamente al inicio
        debug.style.display = 'none';
        try {
            // 1. Intentar listar sin abrir primero (esto ayuda a no bloquearse)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');

            debug.innerHTML += `Detectados ${videoDevices.length} dispositivos en sistema:<br>`;
            videoDevices.forEach((d, i) => {
                debug.innerHTML += `[${i}] Label: ${d.label || "NO_LABEL"} | ID: ${d.deviceId.substring(0, 15)}...<br>`;
            });

            // 2. Si no hay labels, es que necesitamos permiso. Pedimos permiso AHORA.
            if (videoDevices.length > 0 && !videoDevices[0].label) {
                debug.innerHTML += "Solicitando permisos para leer nombres...<br>";
                await navigator.mediaDevices.getUserMedia({ video: true });
                // Volvemos a listar tras obtener permiso
                const devices2 = await navigator.mediaDevices.enumerateDevices();
                const videoDevices2 = devices2.filter(d => d.kind === 'videoinput');
                debug.innerHTML += `Tras permiso, se ven: ${videoDevices2.length} dispositivos.<br>`;
            }

            // 3. Lógica de selección
            const target = videoDevices.find(d =>
                (d.label && d.label.toLowerCase().includes('camara_kiosco')) ||
                (d.label && d.label.toLowerCase().includes('video'))
            );

            if (target) {
                debug.innerHTML += `Intento de apertura: ${target.label || 'Dispositivo sin nombre'}<br>`;
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: target.deviceId } }
                });
                video.srcObject = stream;
                debug.innerHTML += "<span style='color:green'>✅ ¡ÉXITO! Cámara activa.</span>";
            } else {
                debug.innerHTML += "<span style='color:orange'>❌ No encontré 'Camara_Kiosco'. Probando default...</span>";
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
            }

        } catch (err) {
            // Solo si falla, mostramos el error
            debug.style.display = 'block';
            debug.style.color = 'red';
            debug.innerHTML = `ERROR: ${err.name} - ${err.message}`;
            console.error(err);
        }
    }

    // --- FAVORITOS (Últimos 4) ---
    function updateFavoritesLogic() {
        // Marcamos los últimos 4 como favoritos, el resto no
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
        thumbnailsContainer.appendChild(card);

        updateFavoritesLogic();
        thumbnailsContainer.scrollLeft = thumbnailsContainer.scrollWidth;
    }

    // --- CAPTURA ---
    function capture() {
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
        countdownOverlay.classList.remove('hidden');
        let count = 3; countdownNumber.textContent = count;
        const intv = setInterval(() => {
            count--;
            if(count > 0) countdownNumber.textContent = count;
            else { clearInterval(intv); countdownOverlay.classList.add('hidden'); callback(); }
        }, 400);
    }

    fastTouch(btnCapture, () => startCountdown(capture));
    fastTouch(btnCloseModal, () => modalCompare.classList.add('hidden'));

    // --- COMPARATIVA VS (SWAP ZOOM) ---
    btnCompare.onclick = () => {
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
        modalCompare.classList.remove('hidden');
    };

    // --- SUBIDA Y QR ---
    btnGenerateQR.onclick = async () => {
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
    };

    const modalSecurity = document.getElementById('modal-security');
    const btnConfirmClean = document.getElementById('confirm-clean');
    const btnCancelClean = document.getElementById('cancel-clean');

    document.getElementById('clean-all').onclick = () => { 
        if (capturedPhotos.length === 0) return;
        modalSecurity.classList.remove('hidden');
    };

    // --- BORRADO SEGURO ---
    btnConfirmClean.onclick = async () => {
        // Borrar local
        capturedPhotos.forEach(p => URL.revokeObjectURL(p.full));
        capturedPhotos = [];
        thumbnailsContainer.innerHTML = '';
        modalSecurity.classList.add('hidden');

        // Borrar nube (Estrategia rename-then-delete en servidor)
        fetch(`limpiar_nube.php?token=${sessionToken}`);
    };

    fastTouch(btnCancelClean, () => {
        modalSecurity.classList.add('hidden');
    });

    initCamera();
});

