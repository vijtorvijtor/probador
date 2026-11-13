#!/bin/bash
REMOTE_USER="eco"
REMOTE_HOST="192.168.1.244"
REMOTE_DIR="/Applications/XAMPP/xamppfiles/htdocs/eco_probador/"

echo "🚀 Sincronizando archivos con la Raspberry Pi..."
rsync -avz --exclude '.git' /Applications/XAMPP/xamppfiles/htdocs/eco_probador/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}

echo "🔄 Reiniciando Chromium en el Kiosco..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "pkill chromium || true"

echo "¡Sincronización y reinicio completados con éxito!"
