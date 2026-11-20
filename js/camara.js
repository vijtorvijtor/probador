// js/camara.js (Corregido y optimizado para estabilidad)
(function() {
    const video = document.getElementById('webcam');
    const overlay = document.getElementById('countdown-overlay');
    const counter = document.getElementById('countdown-number');
    const flash = document.getElementById('flash-overlay');
    const canvas = document.getElementById('canvas-capture');
    const ss = document.getElementById('screensaver');
    const container = document.getElementById('thumbnails-container');
    const debug = document.getElementById('debug-log');

    let idleTimer;
    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { if (ss) ss.classList.remove('hidden'); }, 60000);
    }
    ['mousedown', 'touchstart', 'keydown', 'pointerup'].forEach(evt => document.addEventListener(evt, () => {
        if (ss) ss.classList.add('hidden');
        resetIdleTimer();
    }));

    function log(msg) { if(debug) debug.innerHTML += msg + '<br>'; console.log(msg); }

    function updateFavorites() {
        const items = Array.from(container.querySelectorAll('.thumbnail-item'));
        items.forEach((item, index) => {
            if (index < 4) item.classList.add('is-favorite');
            else item.classList.remove('is-favorite');
        });
    }

    let startX, startY, mediaRecorder, chunks = [];
    document.addEventListener('pointerdown', (e) => {
        if (!e.target.matches('.btn-oro')) return;
        startX = e.clientX; startY = e.clientY;
    });

    document.addEventListener('pointerup', (e) => {
        if (!e.target.matches('.btn-oro') || Math.abs(e.clientX - startX) > 20 || Math.abs(e.clientY - startY) > 20) return;
        e.target.classList.add('clicked');
        setTimeout(() => e.target.classList.remove('clicked'), 200);
        if(e.target.id === 'btn-capture') startCountdown(false);
        if(e.target.id === 'btn-loop') startCountdown(true);
    });

    async function startCountdown(isVideo) {
        if (overlay) overlay.classList.remove('hidden');
        counter.textContent = "REC";
        await new Promise(r => setTimeout(r, 500));
        if (overlay) overlay.classList.add('hidden');
        if (isVideo) recordVideo(); else takePhoto();
    }

    function recordVideo() {
        if (flash) flash.classList.add('flash-animate');
        chunks = [];
        mediaRecorder = new MediaRecorder(video.srcObject);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const div = document.createElement('div');
            div.className = 'thumbnail-item is-video';
            div.innerHTML = `<video src="${URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}))}" muted loop playsinline></video><div class="thumb-actions"><button onclick="this.parentElement.parentElement.remove(); updateFavorites()">🗑️</button><button>❤️</button></div>`;
            container.prepend(div);
            updateFavorites();
        };
        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 3000);
    }

    function takePhoto() {
        if (flash) {
            flash.classList.add('flash-animate');
            setTimeout(() => flash.classList.remove('flash-animate'), 600);
        }
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        canvas.width = 640; canvas.height = 480;
        ctx.drawImage(video, 0, 0, 640, 480);
        const div = document.createElement('div');
        div.className = 'thumbnail-item';
        div.innerHTML = `<img src="${canvas.toDataURL('image/jpeg', 0.85)}"><div class="thumb-actions"><button onclick="this.parentElement.parentElement.remove(); updateFavorites()">🗑️</button><button>❤️</button></div>`;
        container.prepend(div);
        updateFavorites();
    }

    async function initCamera() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const kioskCam = devices.find(d => d.kind === 'videoinput' && d.label.toLowerCase().includes('camara_kiosco'));
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: kioskCam ? { exact: kioskCam.deviceId } : undefined, width: 640, height: 480 },
                audio: false
            });
            video.srcObject = stream;
            log('Camara OK: ' + (kioskCam ? kioskCam.label : 'Default'));
            resetIdleTimer();
        } catch (err) { log('Error Camara: ' + err.message); }
    }
    initCamera();
})();