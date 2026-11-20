<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Probador Virtual - Óptica ECO</title>
    <link rel="stylesheet" href="css/estilos_oro.css?v=<?php echo time(); ?>">
</head>
<body>
    <div id="screensaver"><video id="video-screensaver" src="screensaver.mp4" autoplay loop muted playsinline preload="auto"></video></div>
    <div class="kiosco-container">
        <header class="kiosco-header"><h1 class="brand-title">ÓPTICA <span>ECO</span></h1></header>
        <main class="camera-viewport">
            <video id="webcam" autoplay playsinline muted></video>
            <div id="flash-overlay"></div>
            <div id="countdown-overlay" class="hidden"><span id="countdown-number">3</span></div>
            <canvas id="canvas-capture" style="display:none;"></canvas>
        </main>
        <nav class="controls-bar">
            <div class="row">
                <button id="btn-capture" class="btn-eco btn-oro">FOTO</button>
                <button id="btn-loop" class="btn-eco btn-oro">VIDEO</button>
                <button id="btn-compare" class="btn-eco btn-oro">COMPARAR</button>
            </div>
            <div class="row">
                <button id="btn-generate-qr" class="btn-whatsapp btn-oro">WHATSAPP</button>
                <button id="clean-all" class="btn-delete-all btn-oro">ELIMINAR</button>
            </div>
        </nav>
        <section class="gallery-section" style="position: relative;">
            <button class="nav-btn prev-btn" id="prev-btn" onclick="document.getElementById('thumbnails-container').scrollBy(-200, 0)">&#10094;</button>
            <div id="thumbnails-container" class="thumbnails-scroll"></div>
            <button class="nav-btn next-btn" id="next-btn" onclick="document.getElementById('thumbnails-container').scrollBy(200, 0)">&#10095;</button>
        </section>
    </div>
    <div id="debug-log" style="position:fixed; top:10px; left:10px; z-index:999999; color:#FFF; pointer-events:none; font-size: 12px; background: rgba(0,0,0,0.5);"></div>
    <script src="js/camara.js?v=<?php echo time(); ?>"></script>
</body>
</html>