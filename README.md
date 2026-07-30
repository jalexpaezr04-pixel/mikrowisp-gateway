# Gateway MikroWisp → Evolution API

Pequeño servicio que traduce las peticiones simples de MikroWisp (Gateway
Genérico) al formato que necesita Evolution API para enviar mensajes de
WhatsApp.

## Cómo funciona

MikroWisp llama a este servicio con el número y el mensaje. Este servicio
verifica el token, arma la petición correcta y se la manda a tu instancia
de Evolution API (`gerconnection`, ya conectada a tu WhatsApp).

```
MikroWisp  --POST + Authorization: Bearer-->  Este gateway  --POST + apikey-->  Evolution API  -->  WhatsApp
```

## 1. Subir este código a GitHub

1. Crea un repositorio nuevo en GitHub (puede llamarse `mikrowisp-gateway`).
2. Sube estos archivos (`index.js`, `package.json`, este `README.md`). No
   subas ningún archivo `.env` real con tus claves — solo el `.env.example`.

Si no sabes subir archivos a GitHub desde cero, dime y te guío paso a paso
(se puede hacer directo desde la web de GitHub sin usar la terminal).

## 2. Crear un nuevo Web Service en Render

1. Ve a tu dashboard de Render → **New +** → **Web Service**.
2. Conecta el repositorio que acabas de crear.
3. Configuración:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. En **Environment**, agrega estas variables (usa los valores reales, no
   los de ejemplo):
   - `GATEWAY_SECRET_TOKEN` → invéntate algo largo y aleatorio (esto es lo
     que pondrás también en MikroWisp).
   - `EVOLUTION_API_URL` → `https://gerconnection-wa.onrender.com`
   - `EVOLUTION_INSTANCE` → `gerconnection`
   - `EVOLUTION_API_KEY` → el apikey de tu instancia
   - `DEFAULT_COUNTRY_CODE` → `57` (o vacío si tus números ya traen el
     código de país)
5. Dale **Create Web Service**. Cuando termine el deploy, tendrás una URL
   como `https://mikrowisp-gateway.onrender.com`.

## 3. Probar el gateway antes de conectar MikroWisp

Reemplaza `TU_TOKEN` y la URL por los tuyos:

```bash
curl -X POST "https://mikrowisp-gateway.onrender.com/gateway/send" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "to=573114551887&message=Prueba desde el gateway nuevo"
```

Si todo está bien configurado, te debería llegar el WhatsApp y la terminal
mostrará `{"status":"success", ...}`.

## 4. Configurar MikroWisp

En la pantalla de "Gateway Genérico" que ya tenías:

- **URL Gateway:** `https://mikrowisp-gateway.onrender.com/gateway/send`
- **Parámetros:** `to={destinatario}&message={mensaje}`
- **Método:** Envío POST
- **Token Authorization Bearer:** el mismo valor que pusiste en
  `GATEWAY_SECRET_TOKEN` en Render
- Activa el switch **"Activar Gateway"**
- Guarda cambios

## 5. Probar desde MikroWisp

Busca alguna opción de "enviar mensaje de prueba" o dispara manualmente
una notificación (por ejemplo, un recordatorio de pago a un cliente de
prueba) y confirma que llega por WhatsApp.

## Nota sobre el free tier de Render

Si este gateway también corre en el plan gratuito de Render, se "duerme"
tras un rato de inactividad y el primer mensaje después de eso puede
tardar unos 50 segundos en salir. Si es un problema para notificaciones en
tiempo real, considera subir este servicio (o el de Evolution API) a un
plan pagado más adelante.
