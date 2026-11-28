<?php
/**
 * Script de limpieza automática - Óptica ECO
 * Elimina archivos con más de 48 horas de antigüedad.
 */

// Configuración de rutas
$carpetas = [
    __DIR__ . '/galerias/',
    __DIR__ . '/img/qr/' // Ajusta según dónde guardes los QRs generados
];

$horas_limite = 48;
$segundos_limite = $horas_limite * 3600;
$ahora = time();

$reporte = [
    'fecha_ejecucion' => date('Y-m-d H:i:s'),
    'archivos_analizados' => 0,
    'archivos_eliminados' => 0,
    'espacio_liberado_kb' => 0,
    'errores' => []
];

foreach ($carpetas as $dir) {
    if (is_dir($dir)) {
        $entradas = array_diff(scandir($dir), array('.', '..', '.htaccess', 'index.php'));
        
        foreach ($entradas as $nombre) {
            $ruta_completa = $dir . $nombre;
            
            if (is_dir($ruta_completa)) {
                // Subcarpeta de sesión galerias/{token}/
                $antiguedad_dir = $ahora - filemtime($ruta_completa);
                if ($antiguedad_dir > $segundos_limite) {
                    $subarchivos = array_diff(scandir($ruta_completa), array('.', '..'));
                    foreach ($subarchivos as $sub) {
                        $ruta_sub = $ruta_completa . '/' . $sub;
                        if (is_file($ruta_sub)) {
                            $reporte['archivos_analizados']++;
                            $tamano = filesize($ruta_sub);
                            if (@unlink($ruta_sub)) {
                                $reporte['archivos_eliminados']++;
                                $reporte['espacio_liberado_kb'] += round($tamano / 1024, 2);
                            }
                        }
                    }
                    @rmdir($ruta_completa);
                }
            } elseif (is_file($ruta_completa)) {
                $reporte['archivos_analizados']++;
                $antiguedad = $ahora - filemtime($ruta_completa);
                
                if ($antiguedad > $segundos_limite) {
                    $tamano = filesize($ruta_completa);
                    if (@unlink($ruta_completa)) {
                        $reporte['archivos_eliminados']++;
                        $reporte['espacio_liberado_kb'] += round($tamano / 1024, 2);
                    } else {
                        $reporte['errores'][] = "No se pudo borrar: $nombre";
                    }
                }
            }
        }
    } else {
        $reporte['errores'][] = "La carpeta no existe: $dir";
    }
}

// Salida visual clara
header('Content-Type: text/plain; charset=utf-8');
echo "==============================================\n";
echo "   REPORTE DE LIMPIEZA AUTOMÁTICA ÓPTICA ECO  \n";
echo "==============================================\n";
echo "Fecha: " . $reporte['fecha_ejecucion'] . "\n";
echo "Estado: Ejecución completada\n";
echo "----------------------------------------------\n";
echo "Archivos encontrados: " . $reporte['archivos_analizados'] . "\n";
echo "Archivos borrados (>48h): " . $reporte['archivos_eliminados'] . "\n";
echo "Espacio liberado: " . $reporte['espacio_liberado_kb'] . " KB\n";

if (!empty($reporte['errores'])) {
    echo "----------------------------------------------\n";
    echo "AVISOS / ERRORES:\n";
    foreach ($reporte['errores'] as $error) {
        echo "- $error\n";
    }
}
echo "==============================================\n";
