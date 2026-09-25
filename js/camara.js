// probador/js/camara.js

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas-capture');
    const btnCapture = document.getElementById('btn-capture');
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownNumber = document.getElementById('countdown-number');

    // 1. Inicializar Cámara local de la Mac / USB
    async function initCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: false
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Error al acceder a la cámara:", err);
            alert("No se pudo acceder a la cámara. Asegúrate de dar permisos HTTPS/localhost.");
        }
    }

    // 2. Disparador con Cuenta Regresiva (3, 2, 1)
    btnCapture.addEventListener('click', () => {
        let count = 3;
        countdownNumber.textContent = count;
        countdownOverlay.classList.remove('hidden');

        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
            } else {
                clearInterval(timer);
                countdownOverlay.classList.add('hidden');
                takeSnapshot();
            }
        }, 800);
    });

    // 3. Capturar Fotografía
    function takeSnapshot() {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Dibujar el fotograma actual en el Canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convertir a Data URL (base64)
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Disparar evento personalizado para guardar en la galería
        window.dispatchEvent(new CustomEvent('photoCaptured', { detail: { image: imageData } }));
    }

    initCamera();
});
