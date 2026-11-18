(function() {
    const ss = document.getElementById('screensaver');
    const video = document.getElementById('webcam');
    const logDiv = document.getElementById('debug-log');

    function debug(msg) {
        if (logDiv) { logDiv.innerHTML += '<br>' + msg; }
        console.log('DEBUG:', msg);
    }

    function hide() {
        if (ss) {
            ss.classList.add('hidden');
            ss.style.pointerEvents = 'none';
            debug('Screensaver desactivado');
        }
    }

    document.addEventListener('mousedown', hide);
    document.addEventListener('touchstart', hide);

    async function initCamera() {
        try {
            debug('Buscando dispositivos...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(function(d) { return d.kind === 'videoinput'; });
            
            let selectedId = videoDevices[0]?.deviceId;
            const kioskCam = videoDevices.find(function(d) { return d.label.toLowerCase().includes('camara_kiosco'); });
            
            if (kioskCam) {
                selectedId = kioskCam.deviceId;
                debug('Camara encontrada: ' + kioskCam.label);
            } else {
                debug('Usando camara por defecto');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: selectedId ? { exact: selectedId } : undefined },
                audio: false
            });
            
            if (video) { video.srcObject = stream; }
            debug('Camara activa');
        } catch (err) {
            debug('Error camara: ' + err.message);
        }
    }

    document.addEventListener('DOMContentLoaded', initCamera);
})();
