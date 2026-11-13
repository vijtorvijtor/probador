#!/bin/bash
if [ "$EUID" -ne 0 ]; then
  echo "[ERROR] Ejecuta con sudo: sudo bash undo.sh"
  exit 1
fi

echo "=== REVIRTIENDO CONFIGURACIONES ==="
[ -f /boot/cmdline.txt.bak ] && cp /boot/cmdline.txt.bak /boot/cmdline.txt
systemctl unmask dhcpcd wpa_supplicant 2>/dev/null
systemctl enable dhcpcd wpa_supplicant 2>/dev/null
sed -i 's/Storage=none/#Storage=auto/g' /etc/systemd/journald.conf
systemctl restart systemd-journald 2>/dev/null
rm -rf /etc/systemd/system/getty@tty1.service.d
systemctl daemon-reload
rm -rf /home/eco/.config/openbox /home/eco/.bash_profile
echo "=== REVERSIÓN COMPLETADA ==="
