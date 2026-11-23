<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Probador Virtual - Óptica ECO</title><link rel="stylesheet" href="css/estilos_oro.css?v=<?php echo time(); ?>"></head>
<body>
    <div id="screensaver"><video id="video-screensaver" src="screensaver.mp4" autoplay loop muted playsinline preload="auto"></video></div>
    <div class="kiosco-container">
        <header style="text-align:center; color: #b8860b; font-size: 3rem; margin: 10px;">ÓPTICA ECO</header>
        <main class="camera-viewport">
            <video id="webcam" autoplay playsinline muted></video>
            <div id="countdown-overlay" class="hidden"><span id="countdown-number">3</span></div>
        </main>
        <nav class="controls-bar">
            <div class="row"><button id="btn-capture" class="btn-oro">FOTO</button><button id="btn-loop" class="btn-oro">VIDEO</button><button id="btn-compare" class="btn-oro">COMPARAR</button></div>
            <div class="row"><button id="btn-generate-qr" class="btn-oro"><img src="img/qr_icon.png">WHATSAPP</button><button id="clean-all" class="btn-oro">ELIMINAR</button></div>
        </nav>
        <section style="display:flex; align-items:center; justify-content:center; gap:20px;">
            <button class="nav-btn" onclick="document.getElementById('thumbnails-container').scrollBy(-300, 0)">&#10094;</button>
            <div id="thumbnails-container"></div>
            <button class="nav-btn" onclick="document.getElementById('thumbnails-container').scrollBy(300, 0)">&#10095;</button>
        </section>
    </div>
    <script src="js/camara.js?v=<?php echo time(); ?>"></script>
</body>
</html>