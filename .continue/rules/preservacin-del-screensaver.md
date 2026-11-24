---
globs: "['js/camara.js']"
description: La funcionalidad de salida del screensaver es crítica. Cualquier
  listener que lo controle debe declararse fuera de cualquier función que
  realice manipulaciones del DOM (como la generación del carrete) y nunca debe
  ser eliminado.
alwaysApply: true
---

JAMÁS modifiques, elimines o sobrescribas los listeners asociados al elemento #screensaver. Deben permanecer intactos en cada edición de js/camara.js.