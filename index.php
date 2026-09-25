<?php
// probador/index.php
session_start();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Probador Interactivo - Óptica ECO</title>
    <link rel="stylesheet" href="css/estilos.css">
</head>
<body>

    <!-- CONTENEDOR PRINCIPAL VERTICAL (1080x1920) -->
    <div class="kiosco-container">

        <!-- CABECERA DE MARCA -->
        <header class="kiosco-header">
            <h2>ÓPTICA ECO</h2>
            <p>Espejo Interactivo & Probador de Armazones</p>
        </header>

        <!-- SECCIÓN 1: VISTA EN VIVO DE LA CÁMARA -->
        <section class="camera-viewport">
            <video id="webcam" autoplay playsinline muted></video>
            <canvas id="canvas-capture" style="display:none;"></canvas>
            
            <!-- Cuenta regresiva / Temporizador visual -->
            <div id="countdown-overlay" class="hidden">
                <span id="countdown-number">3</span>
            </div>
        </section>

        <!-- SECCIÓN 2: BOTONERA PRINCIPAL DE CAPTURA -->
        <section class="controls-bar">
            <button id="btn-capture" class="btn-primary">
                📸 TOMAR FOTO
            </button>
            <button id="btn-loop" class="btn-secondary">
                🎬 GRABAR BUCLE (3s)
            </button>
        </section>

        <!-- SECCIÓN 3: GALERÍA DE N-FOTOS (CARRUSEL INFERIOR) -->
        <section class="gallery-section">
            <div class="gallery-header">
                <span>Fotografías Tomadas (<span id="photo-count">0</span>)</span>
                <button id="btn-clear-all" class="btn-text">Limpiar Todo</button>
            </div>

            <!-- Tira deslizable táctil de miniaturas -->
            <div id="thumbnails-container" class="thumbnails-scroll">
                <!-- Se puebla dinámicamente mediante JavaScript -->
            </div>
        </section>

        <!-- SECCIÓN 4: VISTA DE COMPARACIÓN PRINCIPAL (MÁXIMO 4 FAVORITAS EN GRANDE) -->
        <section class="comparison-grid hidden" id="comparison-modal">
            <div class="grid-header">
                <h3>Comparación Lado a Lado (Favoritos ★)</h3>
                <button id="btn-close-grid" class="btn-close">✕ Cerrar</button>
            </div>
            
            <div class="grid-4x4" id="grid-favorites-container">
                <!-- Se muestran hasta 4 fotos marcadas con Estrella -->
            </div>

            <div class="grid-footer">
                <button id="btn-generate-qr" class="btn-success">
                    📱 GENERAR CÓDIGO QR PARA MI CELULAR
                </button>
            </div>
        </section>

        <!-- OVERLAY MODAL CÓDIGO QR -->
        <div id="qr-modal" class="modal-overlay hidden">
            <div class="modal-content">
                <h3>¡Llévate tus fotos!</h3>
                <p>Escanea este código QR con la cámara de tu teléfono para descargar tus opciones seleccionadas:</p>
                <div id="qr-code-display"></div>
                <p class="privacy-note"><small>Tus imágenes se eliminarán automáticamente en 24 horas.</small></p>
                <button id="btn-close-qr" class="btn-secondary">Volver al Probador</button>
            </div>
        </div>

    </div>

    <!-- Carga de Scripts -->
    <script src="js/camara.js"></script>
    <script src="js/galeria.js"></script>
</body>
</html>
