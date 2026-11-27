<?php
/**
 * upload.php - Óptica ECO (Motor Universal de Medios)
 * Backend ligero para Raspberry Pi 4: sin GD/ImageMagick.
 * Recibe por FormData los dos blobs generados en cliente (file_hd y file_proxy)
 * o un archivo único (video/legacy), escribe directo a disco y retorna ruta_alta y ruta_baja.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$token = $_POST['token'] ?? '';
if (empty($token)) {
    echo json_encode(['status' => 'error', 'message' => 'Token de sesión faltante']);
    exit;
}

$token = preg_replace('/[^a-zA-Z0-9_\-]/', '', $token);
$target_dir = __DIR__ . "/galerias/" . $token . "/";

if (!file_exists($target_dir)) {
    if (!mkdir($target_dir, 0777, true)) {
        echo json_encode(['status' => 'error', 'message' => 'No se pudo crear el directorio de la sesión']);
        exit;
    }
}

$allowed_exts = ['jpg', 'jpeg', 'png', 'webm', 'mp4', 'gif'];
$json_file = $target_dir . "fotos.json";
$fotos = file_exists($json_file) ? json_decode(file_get_contents($json_file), true) : [];
if (!is_array($fotos)) $fotos = [];

// Caso 1: Subida dual FormData (HD + Proxy)
if (isset($_FILES['file_hd']) && isset($_FILES['file_proxy'])) {
    $hd_name = basename($_FILES['file_hd']['name']);
    $proxy_name = basename($_FILES['file_proxy']['name']);

    $ext_hd = strtolower(pathinfo($hd_name, PATHINFO_EXTENSION));
    $ext_proxy = strtolower(pathinfo($proxy_name, PATHINFO_EXTENSION));

    if (!in_array($ext_hd, $allowed_exts) || !in_array($ext_proxy, $allowed_exts)) {
        echo json_encode(['status' => 'error', 'message' => 'Tipo de archivo no permitido']);
        exit;
    }

    $target_hd = $target_dir . $hd_name;
    $target_proxy = $target_dir . $proxy_name;

    $ok_hd = move_uploaded_file($_FILES['file_hd']['tmp_name'], $target_hd);
    $ok_proxy = move_uploaded_file($_FILES['file_proxy']['tmp_name'], $target_proxy);

    if ($ok_hd && $ok_proxy) {
        // Guardamos el archivo HD en fotos.json para que galeria.php / WhatsApp usen siempre Master HD
        if (!in_array($hd_name, $fotos)) {
            $fotos[] = $hd_name;
            file_put_contents($json_file, json_encode($fotos));
        }

        $rel_base = "galerias/" . $token . "/";
        echo json_encode([
            'status'     => 'success',
            'token'      => $token,
            'file'       => $hd_name,
            'file_hd'    => $hd_name,
            'file_proxy' => $proxy_name,
            'ruta_alta'  => $rel_base . $hd_name,
            'ruta_baja'  => $rel_base . $proxy_name
        ]);
        exit;
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al escribir archivos HD/Proxy en disco']);
        exit;
    }
}

// Caso 2: Archivo individual (video o compatibilidad directa)
if (isset($_FILES['file'])) {
    $filename = basename($_FILES['file']['name']);
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_exts)) {
        echo json_encode(['status' => 'error', 'message' => 'Tipo de archivo no permitido']);
        exit;
    }

    $target_file = $target_dir . $filename;
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target_file)) {
        if (!in_array($filename, $fotos)) {
            $fotos[] = $filename;
            file_put_contents($json_file, json_encode($fotos));
        }
        $rel_url = "galerias/" . $token . "/" . $filename;
        echo json_encode([
            'status'    => 'success',
            'file'      => $filename,
            'token'     => $token,
            'ruta_alta' => $rel_url,
            'ruta_baja' => $rel_url
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al guardar el archivo en el servidor']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se recibieron archivos']);
}

