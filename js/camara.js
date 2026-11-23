(function() {
    const video = document.getElementById('webcam'), container = document.getElementById('thumbnails-container');
    const overlay = document.getElementById('countdown-overlay'), counter = document.getElementById('countdown-number'), flash = document.getElementById('flash-overlay');
    const ss = document.getElementById('screensaver'), debug = document.getElementById('debug-log');
    let idleTimer;

    function log(msg) {
        if (!debug) return;
        const div = document.createElement('div');
        div.textContent = msg;
        debug.prepend(div);
        if (debug.children.length > 10) debug.removeChild(debug.lastChild);
    }
    let lastX = 0, lastY = 0;
    document.addEventListener('pointerdown', e => {
        lastX = e.clientX; lastY = e.clientY;
        log(`DOWN: ${lastX},${lastY} on ${e.target.tagName}`);
    }, { passive: true });
    document.addEventListener('pointermove', e => {
        if (e.buttons > 0) { // Solo si hay click sostenido
            const dx = Math.abs(e.clientX - lastX);
            const dy = Math.abs(e.clientY - lastY);
            if (dx > 5 || dy > 5) {
                log(`MOVE: ${e.clientX},${e.clientY} Δ:${dx},${dy}`);
            }
        }
    }, { passive: true });

    // Listener ultra-agresivo en fase de captura para el screensaver
    document.addEventListener('pointerup', (e) => {
        const ss = document.getElementById('screensaver');
        if (ss && !ss.classList.contains('hidden')) {
            ss.classList.add('hidden');
            resetIdleTimer();
            e.preventDefault();
            e.stopPropagation();
        }
    }, { capture: true, passive: false });

    // El listener debe estar atado al screensaver mismo para capturar el toque mientras es visible
        if (ss) {
        // Forzamos el evento en la captura inicial
        ['mousedown', 'touchstart', 'pointerup'].forEach(evt => {
            document.addEventListener(evt, (e) => {
                if (!ss.classList.contains('hidden')) {
            ss.classList.add('hidden');
            resetIdleTimer();
                    e.preventDefault();
                    e.stopPropagation();
        }
            }, { capture: true, passive: false });
        });
    }

    // Diagnóstico y solución directa en el video del screensaver
    const videoSS = document.getElementById('video-screensaver');
    if (videoSS) {
        ['mousedown', 'touchstart', 'pointerup'].forEach(evt => {
            videoSS.addEventListener(evt, (e) => {
                log(`Click en Screensaver detectado`);
        const ss = document.getElementById('screensaver');
                if (ss) ss.classList.add('hidden');
                resetIdleTimer();
                e.stopPropagation();
            }, { passive: false });
        });
        }

    function resetIdleTimer() { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (ss) ss.classList.remove('hidden'); }, 60000); }
    function updateFavorites() {
        const items = Array.from(container.querySelectorAll('.thumbnail-item'));
        items.forEach((item, index) => {
            const btn = item.querySelector('.btn-fav');
            if (btn) {
                const isLastFour = index >= items.length - 4;
                btn.classList.toggle('fav-active', isLastFour);
                btn.textContent = isLastFour ? '★' : '☆';
            }
        });
    }

    function createThumbHTML(contentHTML) {
        // Aseguramos que el botón sea visible y tenga contenido inicial
        return `${contentHTML}<div class="thumb-actions"><button onclick="this.parentElement.parentElement.remove(); updateFavorites()">🗑️</button><button class="btn-fav" style="color: #fff;" onclick="this.classList.toggle('fav-active'); this.textContent = this.classList.contains('fav-active') ? '★' : '☆'; updateFavorites()">☆</button></div>`;
    }

    async function startCountdown(isVideo) {
        log(`Proceso: ${isVideo ? 'Video' : 'Foto'} iniciado`);
        if (overlay) overlay.classList.remove('hidden');
        try {
            counter.textContent = isVideo ? "REC " : "";
            let sequence = ["3", "2", "1"];
            for (let step of sequence) {
                counter.textContent += step + " ";
                await new Promise(r => setTimeout(r, 500));
            }
            if (flash) { flash.classList.add('flash-animate'); setTimeout(() => flash.classList.remove('flash-animate'), 600); }
            overlay.classList.add('hidden');
            if (isVideo) recordVideo(); else takePhoto();
            log('Proceso: Completado satisfactoriamente');
        } catch (err) {
            log('Proceso: Error - ' + err.message);
            overlay.classList.hidden = true;
        }
    }

    function recordVideo() {
        let chunks = [], mediaRecorder = new MediaRecorder(video.srcObject);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const div = document.createElement('div');
            div.className = 'thumbnail-item is-video';
            div.innerHTML = createThumbHTML(`<video src="${URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}))}" muted loop playsinline autoplay></video>`);
            container.appendChild(div);
            container.scrollLeft = container.scrollWidth; // Scroll a la derecha
            updateFavorites();
        };
        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 3000);
    }

    function takePhoto() {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
        canvas.getContext('2d').drawImage(video, 0, 0, 640, 480);
        const div = document.createElement('div');
        div.className = 'thumbnail-item';
        div.innerHTML = createThumbHTML(`<img src="${canvas.toDataURL('image/jpeg', 0.85)}">`);
        container.appendChild(div);
        container.scrollLeft = container.scrollWidth; // Scroll a la derecha
        updateFavorites();
    }

    document.getElementById('btn-capture').addEventListener('click', () => startCountdown(false));
    document.getElementById('btn-loop').addEventListener('click', () => startCountdown(true));

    async function initCamera() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const kioskCam = devices.find(d => d.kind === 'videoinput' && d.label.toLowerCase().includes('camara_kiosco'));
            const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: kioskCam ? { exact: kioskCam.deviceId } : undefined, width: 640, height: 480 }, audio: false });
            video.srcObject = stream;
            resetIdleTimer();
            log('Cámara iniciada correctamente');
        } catch (err) { log('Error cámara: ' + err.message); }
    }
    initCamera();

    // Listener definitivo para el Screensaver: aplicado al contenedor padre
    const ssElement = document.getElementById('screensaver');
    if (ssElement) {
        ['mousedown', 'touchstart', 'pointerup'].forEach(evt => {
            ssElement.addEventListener(evt, () => {
                ssElement.classList.add('hidden');
            resetIdleTimer();
            }, { passive: true });
        });
        }
})();

