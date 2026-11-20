(function() {
    const video = document.getElementById('webcam'), container = document.getElementById('thumbnails-container');
    const overlay = document.getElementById('countdown-overlay'), counter = document.getElementById('countdown-number'), flash = document.getElementById('flash-overlay');
    const ss = document.getElementById('screensaver'), debug = document.getElementById('debug-log');
    let idleTimer;

    function log(msg) { if(debug) debug.innerHTML += msg + '<br>'; }
    function resetIdleTimer() { clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (ss) ss.classList.remove('hidden'); }, 60000); }
    ['mousedown', 'touchstart', 'keydown', 'pointerup'].forEach(evt => document.addEventListener(evt, () => { if(ss) ss.classList.add('hidden'); resetIdleTimer(); }));

    function updateFavorites() {
        const items = Array.from(container.querySelectorAll('.thumbnail-item'));
        items.forEach((item, index) => item.classList.toggle('is-favorite', index >= items.length - 4));
    }

    async function startCountdown(isVideo) {
        if (overlay) overlay.classList.remove('hidden');
        counter.textContent = isVideo ? "REC" : "3";
        await new Promise(r => setTimeout(r, 500));
        overlay.classList.add('hidden');
        if (isVideo) recordVideo(); else takePhoto();
    }

    function recordVideo() {
        if (flash) { flash.classList.add('flash-animate'); setTimeout(() => flash.classList.remove('flash-animate'), 600); }
        let chunks = [], mediaRecorder = new MediaRecorder(video.srcObject);
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const div = document.createElement('div');
            div.className = 'thumbnail-item is-video';
            div.innerHTML = `<video src="${URL.createObjectURL(new Blob(chunks, {type: 'video/webm'}))}" muted loop playsinline autoplay></video><div class="thumb-actions"><button onclick="this.parentElement.parentElement.remove(); updateFavorites()">🗑️</button><button>❤️</button></div>`;
            container.appendChild(div);
            updateFavorites();
        };
        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 3000);
    }

    function takePhoto() {
        if (flash) { flash.classList.add('flash-animate'); setTimeout(() => flash.classList.remove('flash-animate'), 600); }
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
        canvas.getContext('2d').drawImage(video, 0, 0, 640, 480);
        const div = document.createElement('div');
        div.className = 'thumbnail-item';
        div.innerHTML = `<img src="${canvas.toDataURL('image/jpeg', 0.85)}"><div class="thumb-actions"><button onclick="this.parentElement.parentElement.remove(); updateFavorites()">🗑️</button><button>❤️</button></div>`;
        container.appendChild(div);
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
        } catch (err) { log('Error: ' + err.message); }
    }
    initCamera();
})();