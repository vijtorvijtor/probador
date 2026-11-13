<?php
/**
 * upload.php - Óptica ECO
 * Recibe imágenes desde el kiosco y las organiza por sesión.
 */
header('Content-Type: application/json');

$token = $_POST['token'] ?? '';
if (empty($token)) {
    echo json_encode(['status' => 'error', 'message' => 'Token de sesión faltante']);
    exit;
}

// Limpiar el token para evitar ataques de ruta
$token = preg_replace('/[^a-zA-Z0-9_\-]/', '', $token);

$target_dir = __DIR__ . "/galerias/" . $token . "/";
if (!file_exists($target_dir)) {
    if (!mkdir($target_dir, 0777, true)) {
        echo json_encode(['status' => 'error', 'message' => 'No se pudo crear el directorio de la sesión']);
        exit;
    }
}

if (isset($_FILES['file'])) {
    $filename = basename($_FILES['file']['name']);
    // Validar extensión
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webm', 'mp4'])) {
        echo json_encode(['status' => 'error', 'message' => 'Tipo de archivo no permitido']);
        exit;
    }

    $target_file = $target_dir . $filename;
    
    if (move_uploaded_file($_FILES['file']['tmp_name'], $target_file)) {
        // Actualizar el índice JSON de la sesión
        $json_file = $target_dir . "fotos.json";
        $fotos = file_exists($json_file) ? json_decode(file_get_contents($json_file), true) : [];
        if (!is_array($fotos)) $fotos = [];
        
        if (!in_array($filename, $fotos)) {
            $fotos[] = $filename;
            file_put_contents($json_file, json_encode($fotos));
        }
        echo json_encode(['status' => 'success', 'file' => $filename, 'token' => $token]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al guardar el archivo en el servidor']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'No se recibió ningún archivo']);
}
