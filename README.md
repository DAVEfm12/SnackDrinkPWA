1) Copia la estructura de carpetas:
   /pwa/
     index.html
     styles.css
     sw.js
     manifest.json
     app.js
     indexedDB.js
     azulitos.jpg
     Jugo de Frutas.jpg     
     leche conchocolate.jpg
     

2) Ejecuta en localhost (recomendado HTTPs para instalar PWA):
   - Con Python: python3 -m http.server 8080
   - O con Live Server de VSCode

3) Abre http://localhost:8080
   - Verifica que se registre el Service Worker (DevTools -> Application -> Service Workers)
   - Prueba modo offline: desactiva internet y recarga. La app debe responder.
   - Pulsa "Instalar App" si aparece el prompt.

4) Para sincronización real:
   - Implementa endpoint /api/sync en tu servidor que reciba la colaSync del cliente.
   - En DB.drainSync() reemplaza bloque simulado por fetch a tu API.

5) Imágenes/Assets:
   - Reemplaza /assets/* por tus imágenes reales.
