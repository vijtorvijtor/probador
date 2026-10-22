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
<body>

<!-- VERIFICADOR DE VERSIÓN DISCRETO -->
<div style="position: absolute; top: 12px; right: 12px; z-index: 9999; background: rgba(0,230,118,0.2); color: #00E676; border: 1px solid #00E676; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 20px; backdrop-filter: blur(4px);">
    v<?php echo $v; ?>
</div>

<!-- MARCO DE CAMERINO DE TEATRO CON FOCOS INDIVIDUALES -->
<div class="vanity-frame-outer">
    
    <!-- TIRA DE FOCOS SUPERIOR (5 FOCOS) -->
    <div class="bulb-row bulb-top">
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
    </div>

    <!-- TIRA DE FOCOS LATERAL IZQUIERDA (7 FOCOS) -->
    <div class="bulb-col bulb-left">
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
    </div>

    <!-- TIRA DE FOCOS LATERAL DERECHA (7 FOCOS) -->
    <div class="bulb-col bulb-right">
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
    </div>

    <!-- CONTENEDOR PRINCIPAL DE LA APLICACIÓN -->
    <div class="kiosco-container">
        <header class="kiosco-header">
            <h1 class="brand-title">ÓPTICA <span>ECO</span></h1>
            <p class="brand-subtitle">Espejo Virtual & Comparador de Armazones</p>
        </header>

        <main class="camera-viewport">
            <video id="webcam" autoplay playsinline muted></video>
            <canvas id="canvas-capture" class="hidden"></canvas>

            <div id="countdown-overlay" class="hidden">
                <span id="countdown-number">3</span>
            </div>
        </main>

        <nav class="controls-bar">
            <div id="btn-capture" class="floating-3d-object pulse-anim-1" role="button" tabindex="0" title="Fotografiar">
                <div class="glow-ring green-glow"></div>
                <div class="icon-3d-wrapper green-icon">
                    <span class="icon-symbol">📷</span>
                </div>
            </div>

            <div id="btn-loop" class="floating-3d-object pulse-anim-2" role="button" tabindex="0" title="Bucle 3 Segundos">
                <div class="glow-ring purple-glow"></div>
                <div class="icon-3d-wrapper purple-icon">
                    <span class="icon-symbol">📹</span>
                    <span class="loop-tag">3s</span>
                </div>
            </div>

            <div id="btn-compare" class="floating-3d-object pulse-anim-3" role="button" tabindex="0" title="Comparativa VS">
                <div class="glow-ring gold-glow"></div>
                <div class="icon-3d-wrapper gold-icon">
                    <span class="vs-text">VS</span>
                </div>
            </div>
        </nav>

        <section class="gallery-section">
            <div class="gallery-header">
                <span>Fotografías Tomadas</span>
                <div>
                    <button id="btn-generate-qr" class="btn-qr-action">📲 RECIBIR FOTOS</button>
                    <button id="clean-all" class="btn-clean-text">LIMPIAR TODO 🗑</button>
                </div>
            </div>
            <div id="thumbnails-container" class="thumbnails-scroll">
            </div>
        </section>
    </div>

    <!-- TIRA DE FOCOS INFERIOR (5 FOCOS) -->
    <div class="bulb-row bulb-bottom">
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
        <div class="foco"></div>
    </div>

</div>

<!-- MODAL COMPARADOR -->
<div id="modal-compare" class="modal-overlay hidden">
    <div class="modal-content-styled">
        <div class="modal-header-styled">
            <h2 class="modal-title-styled">⚡ COMPARATIVA DE ARMAZONES</h2>
            <button id="btn-close-modal" class="btn-close-modal">CERRAR ✖</button>
        </div>

        <div class="comparison-wrapper">
            <div id="grid-comparison" class="grid-container-base">
            </div>
        </div>
    </div>
</div>

<!-- MODAL QR DIRECTO -->
<div id="modal-qr" class="modal-overlay hidden">
    <div class="modal-content-styled modal-qr-box">
        <div class="modal-header-styled">
            <h2 class="modal-title-styled">📲 TUS FOTOS EN TU CELULAR</h2>
            <button id="btn-close-qr" class="btn-close-modal">CERRAR ✖</button>
        </div>

        <div class="qr-container-body">
            <p class="qr-instruction">Escanea con la cámara de tu celular para ver y guardar tus fotos:</p>

            <div class="qr-wrapper-img">
                <img id="qr-code-img" src="" alt="Generando código QR...">
            </div>

            <!-- ENLACE DIRECTO Y COPIADO -->
            <div style="width: 100%; margin-top: 15px; display: flex; gap: 8px;">
                <input type="text" id="qr-url-input" readonly placeholder="Generando enlace..." style="flex: 1; background: rgba(18, 19, 32, 0.9); border: 1px solid #FFC107; color: #FFF; padding: 10px; border-radius: 8px; font-size: 11px; font-family: monospace; outline: none;">
                <button id="btn-copy-url" style="background: #FFC107; color: #000; border: none; font-weight: 800; padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size: 11px; letter-spacing: 0.5px;">COPIAR</button>
            </div>

            <p class="qr-subtext" style="margin-top: 12px; color: #FFC107; font-weight: bold;">Óptica ECO - Tu Salud Visual & Estilo</p>
        </div>
    </div>
</div>

<script src="js/camara.js?v=<?php echo $v; ?>"></script>
</body>
</html>
