(function() {
    const video = document.getElementById('webcam');
    const overlay = document.getElementById('countdown-overlay'), counter = document.getElementById('countdown-number'), flash = document.getElementById('flash-overlay');
    const ss = document.getElementById('screensaver'), debug = document.getElementById('debug-log');
    let idleTimer;
    let captureSeq = 0;

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
        resetIdleTimer();
        log(`DOWN: ${lastX},${lastY} on ${e.target.tagName}`);
    }, { passive: true });
    document.addEventListener('pointermove', e => {
        if (e.buttons > 0) {
            const dx = Math.abs(e.clientX - lastX);
            const dy = Math.abs(e.clientY - lastY);
            if (dx > 5 || dy > 5) {
                log(`MOVE: ${e.clientX},${e.clientY} Δ:${dx},${dy}`);
            }
        }
    }, { passive: true });

    function resetIdleTimer() { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (ss) ss.classList.remove('hidden'); }, 60000); }

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
            if (isVideo) await recordVideo(); else await takePhoto();
            log('Proceso: Completado satisfactoriamente');
        } catch (err) {
            log('Proceso: Error - ' + err.message);
            if (overlay) overlay.classList.add('hidden');
        }
    }

    async function recordVideo() {
        if (!video || !video.srcObject) return;
        let chunks = [], mediaRecorder = new MediaRecorder(video.srcObject);
        mediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const blobUrl = URL.createObjectURL(blob);
            captureSeq++;
            const ts = Math.floor(Date.now() / 1000);
            const filename = `video_${captureSeq}_${ts}.webm`;
            const itemId = Date.now() + captureSeq;

            if (window.KioscoGaleria) {
                window.KioscoGaleria.addMediaItem({
                    id: itemId,
                    type: 'video',
                    ruta_baja: blobUrl,
                    ruta_alta: blobUrl,
                    blobUrlBaja: blobUrl,
                    file_hd: filename
                });
            }

            if (window.KIOSCO_SESSION_TOKEN) {
                try {
                    const fd = new FormData();
                    fd.append('token', window.KIOSCO_SESSION_TOKEN);
                    fd.append('file', blob, filename);
                    const res = await fetch('upload.php', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.status === 'success' && window.KioscoGaleria) {
                        window.KioscoGaleria.updateMediaPaths(itemId, data);
                    }
                } catch (e) {
                    log('Error subida video: ' + e.message);
                }
            }
        };
        mediaRecorder.start();
        setTimeout(() => { if (mediaRecorder.state !== 'inactive') mediaRecorder.stop(); }, 3000);
    }

    async function takePhoto() {
        if (!video || !window.GestorMedios) return;
        captureSeq++;
        const ts = Math.floor(Date.now() / 1000);
        const hdFilename = `foto_${captureSeq}_${ts}.jpg`;
        const proxyFilename = `foto_${captureSeq}_${ts}_proxy.jpg`;
        const itemId = Date.now() + captureSeq;

        const { hdBlob, proxyBlob } = await window.GestorMedios.canvasToBlobs(video);
        const blobUrlBaja = URL.createObjectURL(proxyBlob);
        const blobUrlAlta = URL.createObjectURL(hdBlob);

        if (window.KioscoGaleria) {
            window.KioscoGaleria.addMediaItem({
                id: itemId,
                type: 'img',
                ruta_baja: blobUrlBaja,
                ruta_alta: blobUrlAlta,
                blobUrlBaja,
                blobUrlAlta,
                file_hd: hdFilename,
                file_proxy: proxyFilename
            });
        }

        if (window.KIOSCO_SESSION_TOKEN) {
            try {
                const fd = new FormData();
                fd.append('token', window.KIOSCO_SESSION_TOKEN);
                fd.append('file_hd', hdBlob, hdFilename);
                fd.append('file_proxy', proxyBlob, proxyFilename);

                const res = await fetch('upload.php', { method: 'POST', body: fd });
                const data = await res.json();
                if (data.status === 'success' && window.KioscoGaleria) {
                    window.KioscoGaleria.updateMediaPaths(itemId, data);
                }
            } catch (err) {
                log('Error subida foto: ' + err.message);
            }
        }
    }

    document.getElementById('btn-capture').addEventListener('click', () => startCountdown(false));
    document.getElementById('btn-loop').addEventListener('click', () => startCountdown(true));

    async function initCamera() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const kioskCam = devices.find(d => d.kind === 'videoinput' && d.label.toLowerCase().includes('camara_kiosco'));
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: kioskCam ? { exact: kioskCam.deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 960 }
                },
                audio: false
            });
            video.srcObject = stream;
            resetIdleTimer();
            log('Cámara iniciada correctamente');
        } catch (err) { log('Error cámara: ' + err.message); }
    }
    initCamera();
})();

// Listener de sistema protegido (Fuera del IIFE principal para mayor seguridad)
(function initScreensaverProtection() {
    const ss = document.getElementById('screensaver');
    if (!ss) return;

    const handleExit = (e) => {
        if (!ss.classList.contains('hidden')) {
            ss.classList.add('hidden');
            e.preventDefault();
            e.stopPropagation();
        }
    };

    ['mousedown', 'touchstart', 'pointerup', 'keydown'].forEach(evt => {
        document.addEventListener(evt, handleExit, { capture: true, passive: false });
    });
})();

