#!/bin/bash

if [ -z "$1" ]; then
    echo "⚠️ Uso correcto: ./sube.sh <archivo_o_directorio>"
    exit 1
fi

if [ ! -f "datos.ftp" ]; then
    echo "❌ Error: No se encontró el archivo datos.ftp"
    exit 1
fi

source datos.ftp

FILE_TO_UPLOAD="$1"

if [ ! -e "$FILE_TO_UPLOAD" ]; then
    echo "❌ Error: El archivo local '$FILE_TO_UPLOAD' no existe."
    exit 1
fi

# Construir la ruta remota
if [ -z "$remote_dir" ]; then
    REMOTE_PATH="$FILE_TO_UPLOAD"
else
    # Asegurar diagonal al final si remote_dir no está vacío
    [[ "$remote_dir" != */ ]] && remote_dir="${remote_dir}/"
    REMOTE_PATH="${remote_dir}${FILE_TO_UPLOAD}"
fi

echo "🚀 Subiendo $FILE_TO_UPLOAD a $server..."

curl -s --ftp-create-dirs -T "$FILE_TO_UPLOAD" "ftp://$server/$REMOTE_PATH" --user "$user:$pass"

if [ $? -eq 0 ]; then
    echo "✅ Archivo $FILE_TO_UPLOAD subido con éxito a $server."
else
    echo "❌ Falló la subida. Ejecutando diagnóstico:"
    echo "---------------------------------------------------"
    curl -v --ftp-create-dirs -T "$FILE_TO_UPLOAD" "ftp://$server/$REMOTE_PATH" --user "$user:$pass"
fi
