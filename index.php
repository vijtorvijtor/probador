<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
$v = time();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-select=none">
    <title>Probador Virtual - Óptica ECO</title>
    <link rel="stylesheet" href="css/estilos.css?v=<?php echo $v; ?>">
</head>
<body oncontextmenu="return false;">

<div class="vanity-frame-outer">
    <div class="bulb-row bulb-top">
        <div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div>
    </div>

    <div class="bulb-col bulb-left">
        <div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div>
    </div>
    <div class="bulb-col bulb-right">
        <div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div>
    </div>

    <div class="kiosco-container">
        <header class="kiosco-header">
            <h1 class="brand-title">ÓPTICA <span>ECO</span> <small style="color:red; font-size:1rem;">v3.2</small></h1>
        </header>

        <main class="camera-viewport">
            <!-- Agregamos esto para ver errores si la cámara falla -->
            <div id="debug-log" style="position:absolute; top:0; left:0; color:red; background:rgba(0,0,0,0.5); z-index:9999; pointer-events:none;"></div>

            <video id="webcam" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: cover;"></video>
            <canvas id="canvas-capture" style="display:none;"></canvas>
            <div id="countdown-overlay" class="hidden">
                <span id="countdown-number">3</span>
            </div>
        </main>

        <nav class="controls-bar">
            <div id="btn-capture" class="floating-3d-object" role="button">
                <span class="icon-symbol">📷</span>
            </div>
            <div id="btn-loop" class="floating-3d-object" role="button">
                <span class="icon-symbol">📹</span>
            </div>
            <div id="btn-compare" class="floating-3d-object" role="button">
                <span class="vs-text">VS</span>
            </div>
        </nav>

        <section class="gallery-section">
            <div class="gallery-header">
                <span>Sesión Actual</span>
                <div class="action-group">
                    <button id="btn-generate-qr" class="btn-whatsapp">📲 ENVIAR A WHATSAPP</button>
                    <button id="clean-all" class="btn-delete-all">BORRAR SESIÓN 🗑</button>
                </div>
            </div>
            <div id="thumbnails-container" class="thumbnails-scroll"></div>
        </section>
    </div>

    <!-- MODAL DE COMPARACIÓN INTERACTIVA -->
    <div id="modal-compare" class="modal-overlay hidden">
        <div class="modal-content-vs">
            <button id="btn-close-modal" class="btn-close-vs">CERRAR ESPEJO ✖</button>
            <div id="grid-comparison" class="vs-grid-container"></div>
        </div>
    </div>

    <!-- MODAL DE SEGURIDAD (BORRAR TODO) -->
    <div id="modal-security" class="modal-overlay hidden">
        <div class="modal-content-security">
            <h3>AVISO DE CONFIDENCIALIDAD</h3>
            <p>Por su seguridad y cumplimiento de protección de datos, al confirmar, el sistema procederá a la <strong>destrucción digital</strong> de todas las imágenes. Los archivos son renombrados aleatoriamente antes de su eliminación permanente para garantizar que no quede rastro de su sesión en este equipo.</p>
            <div class="security-btns">
                <button id="confirm-clean" class="btn-confirm-delete">BORRAR DEFINITIVAMENTE</button>
                <button id="cancel-clean" class="btn-cancel">CANCELAR</button>
            </div>
        </div>
    </div>

    <!-- MODAL QR -->
    <div id="modal-qr" class="modal-overlay hidden">
        <div class="modal-content-styled qr-modal-content">
            <button id="btn-close-qr" class="btn-close-large">✖</button>
            <div class="qr-container">
                <h2>¡Tus fotos están listas!</h2>
                <img id="qr-code-img" src="" alt="QR Code">
                <p>Escanea con tu celular para descargar las fotos.</p>
                <div class="aviso-caducidad" style="margin-top:20px; color:#ffb700; font-size:1.2rem; border:1px solid #ffb700; padding:10px; border-radius:10px;">
                    ⚠️ <strong>AVISO:</strong> Sus fotos se subirán a una nube segura y estarán disponibles para descarga durante <strong>48 horas</strong>. Después de este tiempo, se eliminarán automáticamente por su privacidad.
                </div>
            </div>
        </div>
    </div>

    <div class="bulb-row bulb-bottom">
        <div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div><div class="foco"></div>
    </div>
</div>

<script src="js/camara.js?v=<?php echo $v; ?>"></script>
</body>
</html>

