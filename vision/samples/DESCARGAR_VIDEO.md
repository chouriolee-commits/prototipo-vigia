# Descarga del video de prueba — VIGÍA

Video fuente: https://youtu.be/m773B365ntk

---

## Opción 1 — Terminal con yt-dlp (recomendado)

```bash
# Instalar yt-dlp si no lo tienes
pip install yt-dlp

# Descargar los primeros 3 minutos en 720p
yt-dlp "https://youtu.be/m773B365ntk" \
  -o "video_demo.mp4" \
  --download-sections "*0:00-3:00" \
  --format "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]" \
  --merge-output-format mp4
```

El archivo quedará en esta misma carpeta como `video_demo.mp4`.

---

## Opción 2 — Navegador web (sin instalar nada)

1. Ir a https://cobalt.tools
2. Pegar el link: `https://youtu.be/m773B365ntk`
3. Seleccionar calidad **720p**
4. Descargar y mover el archivo a esta carpeta con el nombre `video_demo.mp4`

---

## Importante

- El archivo debe llamarse exactamente `video_demo.mp4`
- Debe quedar en la carpeta `vision/samples/`
- Este archivo NO se sube al repositorio (está en .gitignore)
- Cada desarrollador descarga su propio video de prueba

---

## Verificar que funciona

Una vez descargado, verificar con:

```bash
# Debe mostrar información del video sin errores
ffprobe video_demo.mp4

# O simplemente verificar que el archivo existe y tiene tamaño razonable
ls -lh video_demo.mp4
```
