<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

$token = $input['token'] ?? '';
$fotoNombre = $input['foto'] ?? '';

if (empty($token) || empty($fotoNombre)) {
    echo json_encode(['status' => 'error', 'message' => 'Parámetros inválidos']);
    exit;
}

$dir = __DIR__ . '/galerias/' . $token;
$archivoFoto = $dir . '/' . basename($fotoNombre);
$archivoJson = $dir . '/fotos.json';

if (file_exists($archivoFoto)) {
    // 1. Renombrar temporalmente antes de eliminar (Estrategia de ocultamiento inmediato)
    $tmpNombre = $dir . '/deleted_' . bin2hex(random_bytes(8)) . '.tmp';
    rename($archivoFoto, $tmpNombre);
    
    // 2. Eliminar el archivo del servidor
    @unlink($tmpNombre);
}

// 3. Actualizar la lista en fotos.json
if (file_exists($archivoJson)) {
    $json = file_get_contents($archivoJson);
    $fileList = json_decode($json, true);
    
    if (is_array($fileList)) {
        $nuevaLista = array_values(array_filter($fileList, function($item) use ($fotoNombre) {
            return $item !== basename($fotoNombre);
        }));
        
        file_put_contents($archivoJson, json_encode($nuevaLista));
    }
}

echo json_encode(['status' => 'success']);
