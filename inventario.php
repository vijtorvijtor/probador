<?php
session_start();

// Credenciales de conexión
$host = "localhost";
$dbname = "u947744031_optica";
$user = "u947744031_optica";
$pass = "1Abejash(*@";

$conn = @mysqli_connect($host, $user, $pass, $dbname);
if (!$conn) {
    die("Error de conexión a la base de datos: " . mysqli_connect_error());
}
$conn->set_charset("utf8mb4");

$mensajeError = "";

// Lógica de Cierre de Sesión
if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: inventario.php");
    exit();
}

// Lógica de Inicio de Sesión
if (isset($_POST['accion']) && $_POST['accion'] === 'login') {
    $usuarioInput = trim($_POST['user'] ?? '');
    $passwordInput = trim($_POST['pass'] ?? '');

    if (!empty($usuarioInput) && !empty($passwordInput)) {
        $usuarioEsc = mysqli_real_escape_string($conn, $usuarioInput);
        $passwordEsc = mysqli_real_escape_string($conn, $passwordInput);

        // Consulta a la tabla usuario
        $sqlUser = "SELECT idUser, nombreU, user, idNivel FROM usuario WHERE user = '$usuarioEsc' AND pass = '$passwordEsc' LIMIT 1";
        $resUser = mysqli_query($conn, $sqlUser);

        if ($resUser && mysqli_num_rows($resUser) > 0) {
            $rowUser = mysqli_fetch_assoc($resUser);
            $_SESSION['usuario_id'] = $rowUser['idUser'];
            $_SESSION['usuario_nombre'] = $rowUser['nombreU'];
            $_SESSION['usuario_user'] = $rowUser['user'];
            $_SESSION['usuario_nivel'] = $rowUser['idNivel'];
            
            header("Location: inventario.php");
            exit();
        } else {
            $mensajeError = "Usuario o contraseña incorrectos.";
        }
    } else {
        $mensajeError = "Por favor, completa todos los campos.";
    }
}

// Verificar si el usuario está autenticado
$estaAutenticado = isset($_SESSION['usuario_id']);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventario Rápido - Óptica ECO</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
        .card { background: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 650px; margin: 30px auto; }
        h2 { color: #333; margin-top: 0; }
        .form-group { margin-bottom: 15px; text-align: left; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #555; }
        input[type="text"], input[type="password"], textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; font-size: 14px; }
        textarea { height: 220px; font-family: monospace; }
        .btn { background: #007bff; color: white; padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; font-weight: bold; }
        .btn:hover { background: #0056b3; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .user-bar { display: flex; justify-content: space-between; align-items: center; background: #e9ecef; padding: 10px 15px; border-radius: 6px; margin-bottom: 20px; }
        .info-box { background: #e7f3fe; border-left: 5px solid #2196F3; padding: 12px; font-size: 13px; margin-bottom: 20px; line-height: 1.4; }
    </style>
</head>
<body>

<div class="card">
    <?php if (!$estaAutenticado): ?>
        <!-- PANTALLA DE LOGIN -->
        <h2>Acceso al Sistema de Inventario</h2>
        
        <?php if (!empty($mensajeError)): ?>
            <div class="error"><?php echo $mensajeError; ?></div>
        <?php endif; ?>

        <form method="POST" action="inventario.php">
            <input type="hidden" name="accion" value="login">
            
            <div class="form-group">
                <label for="user">Usuario:</label>
                <input type="text" id="user" name="user" required autofocus autocomplete="username">
            </div>
            
            <div class="form-group">
                <label for="pass">Contraseña:</label>
                <input type="password" id="pass" name="pass" required autocomplete="current-password">
            </div>
            
            <button type="submit" class="btn">Ingresar al Escáner</button>
        </form>

    <?php else: ?>
        <!-- PANTALLA DE CAPTURA DE INVENTARIO -->
        <div class="user-bar">
            <span>👤 Operador: <strong><?php echo htmlspecialchars($_SESSION['usuario_nombre']); ?></strong></span>
            <a href="inventario.php?logout=1" style="color: #dc3545; text-decoration: none; font-size: 13px; font-weight: bold;">Cerrar Sesión ✖</a>
        </div>

        <h2>Conteo de Armazones por Lotes</h2>
        
        <div class="info-box">
            <strong>Instrucciones de Escaneo:</strong><br>
            1. Haz clic dentro del recuadro.<br>
            2. Escanea o vierte el contenido descargado de la pistola.<br>
            3. Recuerda incluir el código de almacén (<code>codbAlm</code>) antes de sus respectivos armazones.<br>
            4. Presiona el botón para procesar y ver discrepancias.
        </div>

        <form action="procesar_lote.php" method="POST">
            <div class="form-group">
                <label for="rafaga">Ráfaga de Códigos Escaneados:</label>
                <textarea name="rafaga" id="rafaga" placeholder="LOC-V1&#10;ARM-001&#10;ARM-002&#10;LOC-V2&#10;ARM-003" autofocus required></textarea>
            </div>
            
            <button type="submit" class="btn">Procesar y Conciliar Inventario</button>
        </form>
    <?php endif; ?>
</div>

</body>
</html>
