<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
$sessionToken = bin2hex(random_bytes(16));
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Probador Virtual - Óptica ECO</title>
    <link rel="stylesheet" href="css/estilos_oro.css?v=<?php echo time(); ?>">
    <script>
        window.KIOSCO_SESSION_TOKEN = <?php echo json_encode($sessionToken); ?>;
    </script>
</head>
<body>
    <div id="debug-log"></div>
    <div id="flash-overlay"></div>

    <!-- Vista de comparación: Rejilla 2x2 + Vista Maximizada de Inspección -->
    <div id="comparison-view">
        <div class="comparison-header">ÓPTICA ECO</div>
        <div class="close-grid" id="btn-close-comparison" title="Cerrar comparación">✖</div>

        <!-- Bloque 2x2 (4 slots fijos) -->
        <div class="grid-items" id="comparison-grid-2x2"></div>

        <!-- Vista Maximizada con carga HD bajo demanda, gestos Zoom/Pan y cierre exclusivo con X -->
        <div id="maximized-view" class="marco-dorado hidden" data-rol="maximizada">
            <button type="button" id="btn-close-maximized" class="btn-close-maximized" aria-label="Cerrar vista maximizada">✖</button>
            <div class="marco-inner" id="maximized-viewport">
                <div id="maximized-media-stage" class="maximized-media-stage"></div>
            </div>
        </div>

        <div class="comparison-footer">
            <button type="button" id="btn-compare-whatsapp" class="btn-oro"><img src="img/qr_icon.png" alt="QR">WHATSAPP</button>
            <button type="button" id="btn-compare-close" class="btn-oro">CERRAR</button>
        </div>
    </div>

    <!-- Modal QR para compartir galería en WhatsApp -->
    <div id="qr-modal" class="qr-modal hidden">
        <div class="qr-modal-box marco-dorado">
            <button type="button" id="btn-close-qr" class="btn-close-maximized">✖</button>
            <div class="qr-modal-content">
                <h2>ESCANEA TU GALERÍA HD</h2>
                <div id="qr-image-wrapper"></div>
                <p id="qr-url-label"></p>
            </div>
        </div>
    </div>

    <div id="screensaver"><video id="video-screensaver" src="screensaver.mp4" autoplay loop muted playsinline preload="auto"></video></div>

    <div class="kiosco-container">
        <header class="kiosco-header">ÓPTICA ECO</header>

        <main class="camera-viewport marco-dorado" data-rol="camara">
            <div class="marco-inner">
                <video id="webcam" autoplay playsinline muted></video>
                <div id="countdown-overlay" class="hidden"><span id="countdown-number">3</span></div>
            </div>
        </main>

        <nav class="controls-bar">
            <div class="row">
                <button id="btn-capture" class="btn-oro">FOTO</button>
                <button id="btn-loop" class="btn-oro">VIDEO</button>
                <button id="btn-compare" class="btn-oro">COMPARAR</button>
            </div>
            <div class="row">
                <button id="btn-generate-qr" class="btn-oro"><img src="img/qr_icon.png" alt="QR">WHATSAPP</button>
                <button id="clean-all" class="btn-oro">ELIMINAR</button>
            </div>
        </nav>

        <section class="carrete-row-section" id="carrete-section">
            <button class="nav-btn nav-btn-left" id="carrete-prev" type="button">&#10094;</button>
            <div id="thumbnails-container"></div>
            <button class="nav-btn nav-btn-right" id="carrete-next" type="button">&#10095;</button>
        </section>
    </div>

    <script src="js/config.js?v=<?php echo time(); ?>"></script>
    <script src="js/gestor_medios.js?v=<?php echo time(); ?>"></script>
    <script src="js/galeria.js?v=<?php echo time(); ?>"></script>
    <script src="js/camara.js?v=<?php echo time(); ?>"></script>
</body>
</html>