<?php
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

$token = preg_replace('/[^a-zA-Z0-9_\-]/', '', $input['token'] ?? '');
$fotoNombre = $input['foto'] ?? '';
$fotoProxy = $input['foto_proxy'] ?? '';

if (empty($token) || empty($fotoNombre)) {
    echo json_encode(['status' => 'error', 'message' => 'Parámetros inválidos']);
    exit;
}

$dir = __DIR__ . '/galerias/' . $token;
$archivoJson = $dir . '/fotos.json';

// Si se solicita limpiar toda la sesión actual
if ($fotoNombre === '__ALL__') {
    if (is_dir($dir)) {
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $p = $dir . '/' . $f;
            if (is_file($p)) @unlink($p);
        }
        file_put_contents($archivoJson, json_encode([]));
    }
    echo json_encode(['status' => 'success']);
    exit;
}

$baseFoto = basename($fotoNombre);
$archivoFoto = $dir . '/' . $baseFoto;

if (file_exists($archivoFoto)) {
    $tmpNombre = $dir . '/deleted_' . bin2hex(random_bytes(8)) . '.tmp';
    if (@rename($archivoFoto, $tmpNombre)) {
        @unlink($tmpNombre);
    } else {
        @unlink($archivoFoto);
    }
}

// Eliminar también el proxy ligero correspondiente si existe
$posiblesProxies = [];
if (!empty($fotoProxy)) {
    $posiblesProxies[] = $dir . '/' . basename($fotoProxy);
}
$ext = pathinfo($baseFoto, PATHINFO_EXTENSION);
$nameNoExt = pathinfo($baseFoto, PATHINFO_FILENAME);
$posiblesProxies[] = $dir . '/' . str_replace('_hd', '_proxy', $nameNoExt) . '.' . $ext;
$posiblesProxies[] = $dir . '/' . $nameNoExt . '_proxy.' . $ext;

foreach (array_unique($posiblesProxies) as $proxyPath) {
    if (file_exists($proxyPath)) {
        @unlink($proxyPath);
    }
}

// Actualizar la lista en fotos.json
if (file_exists($archivoJson)) {
    $json = file_get_contents($archivoJson);
    $fileList = json_decode($json, true);
    if (is_array($fileList)) {
        $nuevaLista = array_values(array_filter($fileList, function($item) use ($baseFoto) {
            return $item !== $baseFoto;
        }));
        file_put_contents($archivoJson, json_encode($nuevaLista));
    }
}

echo json_encode(['status' => 'success']);

