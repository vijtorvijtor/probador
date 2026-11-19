(function() {
    const video = document.getElementById('webcam');
    const overlay = document.getElementById('countdown-overlay');
    const counter = document.getElementById('countdown-number');
    const flash = document.getElementById('flash-overlay');
    const canvas = document.getElementById('canvas-capture');
    const ss = document.getElementById('screensaver');
    const container = document.getElementById('thumbnails-container');
    const debug = document.getElementById('debug-log');

    function log(msg) { if(debug) debug.innerHTML += msg + '<br>'; console.log(msg); }

    document.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('btn-oro')) {
            e.target.classList.add('clicked');
            setTimeout(() => e.target.classList.remove('clicked'), 200);
        }
    });

    const hide = () => {
        if (ss && !ss.classList.contains('hidden')) {
            ss.classList.add('hidden');
        }
    };
    ['mousedown', 'touchstart', 'keydown'].forEach(evt => document.addEventListener(evt, hide, { once: true }));

    // Evento de disparo con tolerancia de movimiento
    let startX, startY;
    const btn = document.getElementById('btn-capture');
    btn.addEventListener('pointerdown', (e) => { startX = e.clientX; startY = e.clientY; });
    btn.addEventListener('pointerup', (e) => {
        if (Math.abs(e.clientX - startX) < 20 && Math.abs(e.clientY - startY) < 20) {
            e.preventDefault();
            e.stopImmediatePropagation();
            e.target.classList.add('clicked');
            setTimeout(() => e.target.classList.remove('clicked'), 200);
            setTimeout(startCountdown, 50);
        }
    });

    async function startCountdown() {
        if (overlay) overlay.classList.remove('hidden');
        for (let i = 3; i > 0; i--) {
            if (counter) counter.textContent = i;
            await new Promise(r => setTimeout(r, 500));
        }
        if (overlay) overlay.classList.add('hidden');
        takePhoto();
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        if (container) {
            const div = document.createElement('div');
            div.className = 'thumbnail-item';
            div.innerHTML = `<img src="${dataUrl}">` + 
                            '<div class="thumb-actions">' +
                            '<button onclick="this.parentElement.parentElement.remove()">🗑️</button>' +
                            '<button>❤️</button></div>';
            container.prepend(div);
        }
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
        } catch (err) {
            log('Error Camara: ' + err.message);
        }
    }
    initCamera();
})();

