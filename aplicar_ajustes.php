<?php
// Mostrar errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

// Validar que exista sesión activa
if (!isset($_SESSION['usuario_id'])) {
    die("Acceso no autorizado. Por favor inicia sesión.");
}

// Credenciales de conexión
$_SESSION['dBHost'] = "localhost";
$_SESSION['dBName'] = "u947744031_optica";
$_SESSION['dBUser'] = "u947744031_optica";
$_SESSION['sBPass'] = "1Abejash(*@";

$conn = @mysqli_connect($_SESSION['dBHost'], $_SESSION['dBUser'], $_SESSION['sBPass'], $_SESSION['dBName']);

if (!$conn) {
    die("Error de conexión a la base de datos: " . mysqli_connect_error());
}

$conn->set_charset("utf8mb4");

// Recibir la sesión y los armazones seleccionados
$idSesion = $_POST['idSesion'] ?? $_GET['idSesion'] ?? '';
$armazonesSeleccionados = $_POST['reubicar_ids'] ?? [];

if (empty($idSesion)) {
    die("Error: No se proporcionó un ID de sesión válido. <a href='inventario.php'>Volver al Inicio</a>");
}

$totalActualizados = 0;
$mensajeNotificacion = "";

if (empty($armazonesSeleccionados)) {
    $mensajeNotificacion = "⚠️ No se seleccionó ningún armazón para reubicar en sistema. Se asume que los armazones fuera de lugar serán reubicados <strong>físicamente</strong> en sus vitrinas correspondientes.";
} else {
    // Procesar cada armazón seleccionado
    foreach ($armazonesSeleccionados as $cBarrasEsc) {
        $cBarrasClean = mysqli_real_escape_string($conn, $cBarrasEsc);

        // Obtener la nueva ubicación detectada desde la tabla temporal
        $sqlGetTemp = "SELECT idAlmacenDetectado 
                       FROM inventario_conteo_temp 
                       WHERE idSesion = '$idSesion' 
                         AND codigoEscaneado COLLATE utf8mb4_general_ci = '$cBarrasClean' COLLATE utf8mb4_general_ci 
                       LIMIT 1";

        $resTemp = mysqli_query($conn, $sqlGetTemp);
        if ($resTemp && $rowTemp = mysqli_fetch_assoc($resTemp)) {
            $nuevoAlmacen = (int)$rowTemp['idAlmacenDetectado'];

            // Actualizar la ubicación real en la tabla inventario
            $sqlUpdate = "UPDATE inventario 
                          SET idAlmacen = $nuevoAlmacen 
                          WHERE cBarras COLLATE utf8mb4_general_ci = '$cBarrasClean' COLLATE utf8mb4_general_ci";

            if (mysqli_query($conn, $sqlUpdate)) {
                $totalActualizados++;
            }
        }
    }
    $mensajeNotificacion = "✅ Reubicación en Sistema Exitosa. Se actualizaron <strong>$totalActualizados</strong> armazones en la base de datos.";
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ajustes de Inventario - Óptica ECO</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 40px; text-align: center; }
        .card { background: white; padding: 30px; border-radius: 8px; max-width: 550px; margin: auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h2 { color: #333; margin-top: 0; }
        .alert { background: #e7f3fe; border-left: 5px solid #2196F3; padding: 15px; border-radius: 4px; font-size: 15px; margin: 20px 0; text-align: left; line-height: 1.5; }
        .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px; font-weight: bold; font-size: 15px; }
        .btn:hover { background: #0056b3; }
        .btn-secondary { background: #6c757d; }
        .btn-secondary:hover { background: #5a6268; }
    </style>
</head>
<body>

<div class="card">
    <h2>Confirmación de Operación</h2>
    
    <div class="alert">
        <?php echo $mensajeNotificacion; ?>
    </div>
    
    <!-- Redirección de vuelta a procesar_lote.php conservando la sesión -->
    <a href="procesar_lote.php?idSesion=<?php echo urlencode($idSesion); ?>" class="btn">⬅ Volver al Resumen de Inventario</a>
    <a href="inventario.php" class="btn btn-secondary">🏠 Nueva Auditoría</a>
</div>

</body>
</html>
