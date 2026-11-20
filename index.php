<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Probador Virtual - Óptica ECO</title><link rel="stylesheet" href="css/estilos_oro.css?v=<?php echo time(); ?>"></head>
<body>
    <div id="screensaver"><video id="video-screensaver" src="screensaver.mp4" autoplay loop muted playsinline preload="auto"></video></div>
    <div class="kiosco-container">
        <header style="text-align:center; color: #b8860b; font-size: 3rem; margin: 15px;">ÓPTICA ECO</header>
        <main class="camera-viewport"><video id="webcam" autoplay playsinline muted></video><div id="flash-overlay"></div><div id="countdown-overlay" class="hidden"><span id="countdown-number" style="font-size: 10rem; color: #FFD700;">3</span></div></main>
        <nav class="controls-bar">
            <div class="row"><button id="btn-capture" class="btn-oro">FOTO</button><button id="btn-loop" class="btn-oro">VIDEO</button><button id="btn-compare" class="btn-oro">COMPARAR</button></div>
            <div class="row"><button id="btn-generate-qr" class="btn-oro"><img src="img/qr_icon.png">WHATSAPP</button><button id="clean-all" class="btn-oro">ELIMINAR</button></div>
        </nav>
        <section class="gallery-section"><div id="thumbnails-container"></div></section>
    </div>
    <div id="debug-log" style="position:fixed; top:10px; left:10px; z-index:999999; color:#FFF; font-size: 12px; background: rgba(0,0,0,0.5);"></div>
    <script src="js/camara.js?v=<?php echo time(); ?>"></script>
</body>
</html>