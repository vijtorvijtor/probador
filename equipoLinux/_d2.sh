#!/bin/bash
echo "UPTIME: $(uptime -p) | $(date +%H:%M:%S)"
echo "--- dhcpcd ExecStart ---"
systemctl show dhcpcd -p ExecStart --value | cut -c1-120
echo "--- servicios ---"
for s in apt-daily-upgrade.timer man-db.timer rpi-eeprom-update wpa-early.service net-guard.service; do printf "%s=%s\n" "$s" "$(systemctl is-enabled $s 2>&1)"; done
echo "--- panel_orientation ---"
grep -i panel_orientation /boot/config.txt || echo NINGUNO
echo "--- xrandr ---"
DISPLAY=:0 xrandr --query 2>&1 | grep -E " connected|current" | cut -c1-130
echo "--- X input matrix ---"
DISPLAY=:0 xinput list 2>&1 | grep -iE "touch|pen|capacit|egalax|ilitek|waveshare|goodix|silead|ads" | cut -c1-90
echo "--- chromium ---"
pgrep -c chromium; DISPLAY=:0 xdotool search --name "Pro?bador" 2>/dev/null | head -2
