<?php
// /var/www/html/generar_qr.php
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['fotos']) || empty($data['fotos'])) {
    echo json_encode(["status" => "error", "message" => "No hay fotografías"]);
    exit;
}

$id_sesion = time();

// URL pública directa de tu sitio web donde se ven las fotos
$url_galeria = "https://opticaeco.com/probador/ver.php?id=" . $id_sesion;

// Generar el código QR de la URL directa
$qr_image_url = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" . urlencode($url_galeria);

echo json_encode([
    "status"  => "success",
    "qr_img"  => $qr_image_url,
    "url"     => $url_galeria
]);
?>
