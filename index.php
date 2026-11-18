<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-select=none">
    <title>Probador Virtual - Óptica ECO</title>
    <link rel="stylesheet" href="css/estilos_oro.css?v=<?php echo time(); ?>">
</head>
<body oncontextmenu="return true;">

    <div id="screensaver">
        <video id="video-screensaver" src="screensaver.mp4" autoplay loop muted playsinline></video>
    </div>

    <div class="kiosco-container">
        <header class="kiosco-header">
            <h1 class="brand-title">ÓPTICA <span>ECO</span></h1>
        </header>

        <main class="camera-viewport">
            <video id="webcam" autoplay playsinline muted></video>
            <canvas id="canvas-capture" style="display:none;"></canvas>
            <div id="countdown-overlay" class="hidden">
                <span id="countdown-number">3</span>
            </div>
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

        <section class="gallery-section">
            <div id="thumbnails-container" class="thumbnails-scroll"></div>
        </section>
    </div>

    <div id="debug-log" style="position:fixed; top:10px; left:10px; z-index:999999; color:#FFF; font-size:14px; pointer-events:none;">
        TEST: Estructura limpia v<?php echo time(); ?>
    </div>

    <script src="js/camara.js?v=<?php echo time(); ?>"></script>
</body>
</html>

