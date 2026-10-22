<?php
// Mostrar errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();

// Credenciales de conexión
$_SESSION['dBHost'] = "localhost";
$_SESSION['dBName'] = "u947744031_optica";
$_SESSION['dBUser'] = "u947744031_optica";
$_SESSION['sBPass'] = "1Abejash(*@";

// Conexión a la base de datos
$conn = @mysqli_connect($_SESSION['dBHost'], $_SESSION['dBUser'], $_SESSION['sBPass'], $_SESSION['dBName']);

if (!$conn) {
    die("Error de conexión a la base de datos: " . mysqli_connect_error());
}

$conn->set_charset("utf8mb4");
$_SESSION['conn'] = $conn;

// Determinar si viene de un nuevo envío (POST) o de consultar una sesión existente (GET)
$rafagaText = $_POST['rafaga'] ?? '';
$idSesionGet = $_GET['idSesion'] ?? '';

if (!empty($rafagaText)) {
    // NUEVO ESCANEO: Generar nuevo idSesion e insertar en tabla temporal
    $idSesion = "SESION_" . date("Ymd_His");
    $lineas = explode("\n", str_replace("\r", "", $rafagaText));

    // 1. Obtener catálogo de almacenes
    $almacenes = [];
    $resAlm = mysqli_query($conn, "SELECT idAlmacen, codbAlm, nbeAlmacen FROM catAlmacenes");
    if ($resAlm) {
        while ($row = mysqli_fetch_assoc($resAlm)) {
            if (!empty($row['codbAlm'])) {
                $almacenes[$row['codbAlm']] = $row['idAlmacen'];
            }
        }
    } else {
        die("Error al consultar catAlmacenes: " . mysqli_error($conn));
    }

    // 2. Procesar la ráfaga de datos línea por     // 2. Procesar la ráfaga de datos línea por     // 2. Procesar la ráodigo    // 2. Procesar la ráfa (empty($codigo)) continue;

                                                                                             en                            {
            $codigoEsc = mysqli_real_escape_strin            $codigoEs          $sqlInsert = "INSERT INTO inventario_conteo_temp (idSesion, idAlmacenDetectado, codigoEscaneado) 
                          VALUES ('$idSesion', $almacenActual, '$codigoEsc')";
            
            $resInsert = mysqli_query($conn, $sqlInsert);
            if (!$resInsert) {
                die("Error al insertar en inventario_conteo_temp: " . mysqli_error($conn));
            }
        }
    }
} elseif (!empty($idSesionGet)) {
    // RECONSULTA: Cargar datos de la sesión guardada en GET
    $idSesion = mysqli_real_escape_string($conn, $idSesionGet);
} else {
    die("No se recibieron datos para procesar. Por favor, regresa y realiza un escaneo. <a href='inventario.php'>Volver</a>");
}

// 3. Consultas de Conciliación con Marca de Armazón

// A. Correctos (Coincide cBarras e idAlmacen)
$sqlCorrectos = "SELECT COUNT(*) as total 
                 FROM inventario_conteo_temp t 
                 INNER JOIN inventario i ON t.codigoEscaneado COLLATE utf8mb4_general_ci = i.cBarras COLLATE utf8mb4_general_ci 
                 WHERE t.idSesion = '$idSesion' 
                   AND t.idAlmacenDetectado = i.idAlmacen";

$resCorrectos = mysqli_query($conn, $sqlCorrectos);
if (!$resCorrectos) {
    die("Error en la consulta de Correctos: " . mysqli_error($conn));
}
$rowCorrectos = mysqli_fetch_assoc($resCorrectos);
$totalCorrectos = $rowCorrectos ? $rowCorrectos['total'] : 0;

// B. Fuera de lugar (El armazón existe pero fue escaneado en otro almacén)
$sqlReubicar = "SELECT i.idInv, i.cBarras, i.modelo, i.descripcion, m.nombreArmMarca,
                       i.idAlmacen as almacenOriginal, a1.nbeAlmacen as nomOriginal,
                       t.idAlmacenDetectado as almacenNuevo, a2.nbeAlmacen as nomNuevo
                FROM inventario_conteo_temp t
                INNER JOIN inventario i ON t.codigoEscaneado COLLATE utf8mb4_general_ci = i.cBarras COLLATE utf8mb4_general_ci
                LEFT JOIN catArmMarca m ON i.idArmMarca = m.idArmMarca
                LEFT JOIN catAlmacenes a1 ON i.idAlmacen = a1.idAlmacen
                LEFT JOIN catAlmacenes a2 ON t.idAlmacenDetectado = a2.idAlmacen
                WHERE t.idSesion = '$idSesion' 
                  AND (t.idAlmacenDetectado != i.idAlmacen OR i.idAlmacen IS NULL)";

$resReubicar = mysqli_query($conn, $sqlReubicar);
if (!$resReubicar) {
    die("Error en la consulta de Reubicados: " . mysqli_error($conn));
}

// C. Faltantes (Registrados en el sistema pero no aparecieron en el escaneo)
$sqlFaltantes = "SELECT i.idInv, i.cBarras, i.modelo, i.descripcion, m.nombreArmMarca, i.idAlmacen, a.nbeAlmacen 
                 FROM inventario i
                 LEFT JOIN catArmMarca m ON i.idArmMarca = m.idArmMarca
                 LEFT JOIN catAlmacenes a ON i.idAlmacen = a.idAlmacen
                 WHERE i.cBarras IS NOT NULL 
                   AND i.cBarras != '' 
                   AND i.cBarras COLLATE utf8mb4_general_ci NOT IN (
                       SELECT codigoEscaneado COLLATE utf8mb4_general_ci 
                       FROM inventario_conteo_temp 
                       WHERE idSesion = '$idSesion'
                   )";

$resFaltantes = mysqli_query($conn, $sqlFaltantes);
if (!$resFaltantes) {
    die("Error en la consulta de Faltantes: " . mysqli_error($conn));
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultado del Conteo de Inventario - Óptica ECO</title>
    
    <!-- DataTables CSS -->
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">
    
    <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 20px; }
        .container { max-width: 1100px; margin: auto; }
        h1 { color: #333; }
        .box { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 14px; }
        th { background: #f8f9fa; color: #333; }
        .badge-success { background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .badge-warning { background: #ffc107; color: #212529; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .badge-danger { background: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .btn-adjust { background: #17a2b8; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 15px; font-weight: bold; margin-top: 15px; }
        .btn-adjust:hover { background: #138496; }
        .btn-back { background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 15px; display: inline-block; margin-bottom: 20px;}
        .btn-back:hover { background: #5a6268; }
        .filter-toggle { background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 15px; }
        .filter-toggle:hover { background: #0056b3; }
    </style>
</head>
<body>

<div class="container">
    <a href="inventario.php" class="btn-back">⬅ Volver al Escáner</a>
    <h1>Resultado de Auditoría de Inventario</h1>

    <div class="box">
        <h3>Resumen General de la Sesión</h3>
        <p>✅ Armazones Correctos y en Su Ubicación Original: <strong><?php echo $totalCorrectos; ?></strong></p>
        <p>⚠️ Armazones Fuera de Lugar (Reubicados): <strong><?php echo mysqli_num_rows($resReubicar); ?></strong></p>
        <p>❌ Armazones Faltantes en el Sistema: <strong id="cntFaltantes"><?php echo mysqli_num_rows($resFaltantes); ?></strong></p>
        
        <button class="filter-toggle" id="btnToggleFiltro" onclick="toggleFiltroExcluidos()">
            🔍 Mostrar Almacenes Excluidos (Vendidos / Refacciones / Bajas)
        </button>
    </div>

    <?php if (mysqli_num_rows($resReubicar) > 0): ?>
    <div class="box">
        <h3>⚠️ Armazones Fuera de Lugar (Requieren Ajuste o Mover de Vitrina)</h3>
        <p style="font-size:13px; color:#666;">Selecciona únicamente los armazones que deseas <strong>cambiar de almacén por sistema</strong>. Los no seleccionados deberán ser reubicados físicamente en la vitrina original.</p>
        
        <form action="aplicar_ajustes.php" method="POST">
            <input type="hidden" name="idSesion" value="<?php echo $idSesion; ?>">
            <table id="tablaReubicados" class="display" style="width:100%">
                <thead>
                    <tr>
                        <th style="width: 30px; text-align:center;"><input type="checkbox" id="chkSelectAll"></th>
                        <th>Código / cBarras</th>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Descripción</th>
                        <th>Ubicación Original</th>
                        <th>Ubicación Detectada</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($row = mysqli_fetch_assoc($resReubicar)): ?>
                    <tr>
                        <td style="text-align:center;">
                            <input type="checkbox" name="reubicar_ids[]" value="<?php echo $row['cBarras']; ?>" class="chkReubicar">
                        </td>
                        <td><?php echo $row['cBarras']; ?></td>
                        <td><strong><?php echo $row['nombreArmMarca'] ?? 'N/A'; ?></strong></td>
                        <td><?php echo $row['modelo']; ?></td>
                        <td><?php echo $row['descripcion']; ?></td>
                        <td><span class="badge-warning"><?php echo $row['nomOriginal'] ?? 'Sin Asignar'; ?></span></td>
                        <td><span class="badge-success"><?php echo $row['nomNuevo'] ?? 'Sin Asignar'; ?></span></td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>
            <button type="submit" class="btn-adjust">Cambiar por Sistema los Seleccionados</button>
        </form>
    </div>
    <?php endif; ?>

    <?php if (mysqli_num_rows($resFaltantes) > 0): ?>
    <div class="box">
        <h3>❌ Armazones Faltantes (Están en Sistema pero No Escaneados)</h3>
        <table id="tablaFaltantes" class="display" style="width:100%">
            <thead>
                <tr>
                    <th>Código / cBarras</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Descripción</th>
                    <th>Ubicación Registrada en Sistema</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($row = mysqli_fetch_assoc($resFaltantes)): 
                    $nomAlmacen = mb_strtolower($row['nbeAlmacen'] ?? '');
                    $esExcluido = (strpos($nomAlmacen, 'vendid') !== false || strpos($nomAlmacen, 'refacc') !== false || strpos($nomAlmacen, 'baja') !== false);
                ?>
                <tr class="row-faltante <?php echo $esExcluido ? 'excluido' : 'incluido'; ?>" style="<?php echo $esExcluido ? 'display:none;' : ''; ?>">
                    <td><?php echo $row['cBarras']; ?></td>
                    <td><strong><?php echo $row['nombreArmMarca'] ?? 'N/A'; ?></strong></td>
                    <td><?php echo $row['modelo']; ?></td>
                    <td><?php echo $row['descripcion']; ?></td>
                    <td><span class="badge-danger"><?php echo $row['nbeAlmacen'] ?? 'Sin Asignar'; ?></span></td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>

</div>

<!-- jQuery y DataTables JS -->
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>

<script>
let mostrandoExcluidos = false;

// Búsqueda global personalizada: Evalúa UPCASE sin espacios por fragmento (str)
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    var searchInput = settings.oPreviousSearch.sSearch.trim().toUpperCase();
    if (!searchInput) return true;

    var terms = searchInput.split(/\s+/);
    var rowText = data.join(' ').toUpperCase();

    for (var i = 0; i < terms.length; i++) {
        var strParam = terms[i].replace(/\s+/g, '');
        if (strParam !== '' && rowText.indexOf(strParam) === -1) {
            return false;
        }
    }
    return true;
});

$(document).ready(function() {
    $('#tablaReubicados').DataTable({
        "language": { "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
        "pageLength": 25,
        "columnDefs": [ { "orderable": false, "targets": 0 } ]
    });

    window.tablaFaltantesDT = $('#tablaFaltantes').DataTable({
        "language": { "url": "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
        "pageLength": 25
    });

    // Checkbox para Seleccionar Todos
    $('#chkSelectAll').on('click', function() {
        var isChecked = $(this).is(':checked');
        $('.chkReubicar').prop('checked', isChecked);
    });

    // Filtro adicional para ocultar/mostrar almacenes excluidos en la tabla de Faltantes
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex, rowData, counter) {
            if (settings.nTable.id !== 'tablaFaltantes') return true;
            
            var rowNode = settings.aoData[dataIndex].nTr;
            if (!mostrandoExcluidos && $(rowNode).hasClass('excluido')) {
                return false;
            }
            return true;
        }
    );

    window.tablaFaltantesDT.draw();
    actualizarContadorVisibles();
});

function toggleFiltroExcluidos() {
    mostrandoExcluidos = !mostrandoExcluidos;
    
    var btn = document.getElementById('btnToggleFiltro');
    if (mostrandoExcluidos) {
        btn.innerHTML = "🙈 Ocultar Almacenes Excluidos (Vendidos / Refacciones / Bajas)";
        btn.style.background = "#dc3545";
    } else {
        btn.innerHTML = "🔍 Mostrar Almacenes Excluidos (Vendidos / Refacciones / Bajas)";
        btn.style.background = "#007bff";
    }

    window.tablaFaltantesDT.draw();
    actualizarContadorVisibles();
}

function actualizarContadorVisibles() {
    var totalVisibles = window.tablaFaltantesDT.rows({ filter: 'applied' }).count();
    $('#cntFaltantes').text(totalVisibles);
}
</script>

</body>
</html>
