<?php
$token =$_GET['token'] ?? '';
$dir = __DIR__ . '/galerias/' .$token;
$fotos = [];

if (!empty($token) && file_exists($dir . '/fotos.json')) {
    $json = file_get_contents($dir . '/fotos.json');
    $fileList = json_decode($json, true);
    if (is_array($fileList)) {
        foreach ($fileList as$file) {
            if (file_exists($dir . '/' . $file)) {$fotos[] = [
                    'file' => $file,
                    'url' => 'galerias/' . $token . '/' .$file
                ];
            }
        }
    }
}

$protocol = (!empty($_SERVER['HTTPS']) &&$_SERVER['HTTPS'] !== 'off') ? "https://" : "http://";
$baseUrl =$protocol . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/';
$fullGalleryUrl =$protocol . $_SERVER['HTTP_HOST'] .$_SERVER['REQUEST_URI'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Mis Armazones - Óptica ECO</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background-color: #0A0B10; color: #FFF; padding: 15px; text-align: center; min-height: 100vh; padding-bottom: 90px; }
        
        .header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid #1F2235; }
        .brand { font-size: 22px; font-weight: 900; color: #00E676; letter-spacing: 1px; }
        .brand span { color: #FFF; }
        .subtitle { font-size: 12px; color: #A0A5C0; margin-top: 3px; }
        
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 20px; }
        
        .photo-card { background: #121320; border: 2px solid #1F2235; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; position: relative; transition: all 0.2s ease; }
        .photo-card.favorite { border-color: #FFD700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.3); }
        .photo-card img, .photo-card video { width: 100%; aspect-ratio: 5/4; object-fit: cover; display: block; }
        
        .card-actions { display: flex; justify-content: space-between; align-items: center; background: #1A1C2E; padding: 12px 15px; border-top: 1px solid #2A2D45; }
        
        .btn-action { background: transparent; border: none; color: #FFF; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 8px 12px; border-radius: 8px; text-decoration: none; }
        .btn-action:active { background: rgba(255, 255, 255, 0.1); }
        
        .btn-fav { color: #A0A5C0; background: rgba(255,255,255,0.05); }
        .btn-fav.active { color: #000; background: #FFD700; font-weight: 800; }
        
        .btn-download { background: #1F2235; color: #FFF; }
        .btn-delete { color: #FF5252; background: rgba(255, 82, 82, 0.1); }

        /* BANNER FLOTANTE DE WHATSAPP */
        .sticky-wa-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #121320; border-top: 1px solid #00E676; padding: 12px 20px; z-index: 999; box-shadow: 0 -5px 20px rgba(0,0,0,0.8); }
        .btn-wa-send { display: block; width: 100%; background: #25D366; color: #000; text-decoration: none; font-weight: 900; font-size: 14px; padding: 14px; border-radius: 12px; text-align: center; border: none; cursor: pointer; letter-spacing: 0.5px; }
        .btn-wa-send:active { transform: scale(0.98); }

        .privacy-notice { margin-top: 25px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); color: #7A7E9D; font-size: 11px; line-height: 1.5; }
        .empty-state { padding: 50px 20px; color: #FF5252; font-weight: bold; font-size: 14px; }
    </style>
</head>
<body>

<div class="header">
    <div class="brand">ÓPTICA <span>ECO</span></div>
    <div class="subtitle">Selecciona tus armazones favoritos (★)</div>
</div>

<?php if (count($fotos) > 0): ?>
    <div class="gallery-grid" id="gallery-container">
        <?php foreach ($fotos as $index =>$foto): ?>
            <!-- Todas las imágenes inician marcadas como favoritas por defecto -->
            <div class="photo-card favorite" id="card-<?php echo $index; ?>" data-full-url="<?php echo $baseUrl .$foto['url']; ?>">
                <img src="<?php echo htmlspecialchars($foto['url']); ?>" alt="Armazón Óptica ECO">
                
                <div class="card-actions">
                    <button class="btn-action btn-fav active" onclick="toggleFavorite(this)">
                        <span class="star-icon">★</span> Favorito
                    </button>
                    
                    <a href="<?php echo htmlspecialchars($foto['url']); ?>" download="armazon_optica_eco.jpg" class="btn-action btn-download">
                        ⬇ Descargar
                    </a>

                    <button class="btn-action btn-delete" onclick="deleteCardServer('card-<?php echo $index; ?>', '<?php echo $token; ?>', '<?php echo$foto['file']; ?>')">
                        🗑
                    </button>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <div class="privacy-notice">
        🔒 <strong>Galería Privada y Temporal</strong><br>
        Esta selección es personal y se eliminará automáticamente en 48 horas por tu seguridad y privacidad.
    </div>

    <!-- BOTÓN FIJO INFERIOR PARA ENVIAR POR WHATSAPP -->
    <div class="sticky-wa-bar">
        <button class="btn-wa-send" onclick="sendFavoritesWhatsApp()">
            💬 ENVIAR FAVORITOS POR WHATSAPP
        </button>
    </div>

<?php else: ?>
    <div class="empty-state">
        ⚠️ La galería solicitada no contiene imágenes activas o ha expirado.
    </div>
<?php endif; ?>

<script>
const fullGalleryUrl = "<?php echo $fullGalleryUrl; ?>";

function toggleFavorite(btn) {
    const card = btn.closest('.photo-card');
    card.classList.toggle('favorite');
    
    if (card.classList.contains('favorite')) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="star-icon">★</span> Favorito';
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span class="star-icon">☆</span> Marcar';
    }
}

function sendFavoritesWhatsApp() {
    const favoriteCards = document.querySelectorAll('.photo-card.favorite');
    
    if (favoriteCards.length === 0) {
        alert("Por favor selecciona al menos una fotografía como favorita (★) para enviar por WhatsApp.");
        return;
    }

    let message = "¡Hola! Mira los armazones de Óptica ECO que más me gustaron:\n\n";
    
    favoriteCards.forEach((card, index) => {
        const imgUrl = card.getAttribute('data-full-url');
        message += `Armazón ${index + 1}: ${imgUrl}\n`;
    });

    message += `\nVer toda mi galería aquí: ${fullGalleryUrl}`;

    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
}

async function deleteCardServer(cardId, token, foto) {
    if (confirm("¿Deseas eliminar permanentemente esta fotografía de la galería?")) {
        const card = document.getElementById(cardId);
        if (card) card.style.opacity = '0.3';

        try {
            const res = await fetch('eliminar_foto.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, foto: foto })
            });

            const data = await res.json();

            if (data.status === 'success') {
                if (card) card.remove();
                
                const container = document.getElementById('gallery-container');
                if (container && container.children.length === 0) {
                    location.reload();
                }
            } else {
                alert("No se pudo eliminar la imagen en el servidor.");
                if (card) card.style.opacity = '1';
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al intentar eliminar.");
            if (card) card.style.opacity = '1';
        }
    }
}
</script>

</body>
</html>
