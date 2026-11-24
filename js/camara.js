(function() {
    const ASPECT_X = 1;
    const ASPECT_Y = 1;
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
        const canvas = document.createElement('canvas');
        canvas.width = 800 * ASPECT_X;
        canvas.height = 800 * ASPECT_Y;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);

        const ratio = video.videoWidth / video.videoHeight;
        const targetRatio = ASPECT_X / ASPECT_Y;

        let sW = video.videoWidth, sH = video.videoHeight, sX = 0, sY = 0;
        if (ratio > targetRatio) {
            sW = video.videoHeight * targetRatio; sX = (video.videoWidth - sW) / 2;
        } else {
            sH = video.videoWidth / targetRatio; sY = (video.videoHeight - sH) / 2;
        }
        ctx.drawImage(video, sX, sY, sW, sH, 0, 0, canvas.width, canvas.height);

        const div = document.createElement('div');
        div.className = 'thumbnail-item';
        div.innerHTML = createThumbHTML(`<img src="${canvas.toDataURL('image/jpeg', 0.85)}">`);
        container.appendChild(div);
        container.scrollLeft = container.scrollWidth; // Scroll a la derecha
        updateFavorites();
    }

    document.getElementById('btn-capture').addEventListener('click', () => startCountdown(false));
    document.getElementById('btn-loop').addEventListener('click', () => startCountdown(true));

    function toggleComparison() {
        const compView = document.getElementById('comparison-view');
        const container = document.getElementById('thumbnails-container');
        if (compView.classList.contains('active')) {
            compView.classList.remove('active');
        } else {
            const gridItems = compView.querySelector('.grid-items');
            gridItems.innerHTML = '';
            const items = Array.from(container.querySelectorAll('.thumbnail-item')).slice(-4);
            items.forEach(item => {
                const clone = item.cloneNode(true);
                // Listener de expansión limpio
                clone.addEventListener('click', (e) => {
                    if(e.target.tagName !== 'BUTTON') clone.classList.toggle('expanded');
                });
                gridItems.appendChild(clone);
            });
            compView.classList.add('active');
        }
    }

    document.getElementById('btn-compare').addEventListener('click', toggleComparison);
    document.querySelector('.close-grid').addEventListener('click', toggleComparison);

    // Sincronización absoluta de variables de aspecto
    document.documentElement.style.setProperty('--aspect-x', ASPECT_X);
    document.documentElement.style.setProperty('--aspect-y', ASPECT_Y);

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

    // Listener de sistema protegido (No modificar)
    (function initScreensaverProtection() {
        const ss = document.getElementById('screensaver');
        if (!ss) return;

        const handleExit = (e) => {
            if (!ss.classList.contains('hidden')) {
            ss.classList.add('hidden');
                if (typeof resetIdleTimer === 'function') resetIdleTimer();
                e.preventDefault();
                e.stopPropagation();
                }
        };

        ['mousedown', 'touchstart', 'pointerup', 'keydown'].forEach(evt => {
            document.addEventListener(evt, handleExit, { capture: true, passive: false });
        });
})();
})();


