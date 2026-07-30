const express = require("express");
const app = express();

// MikroWisp puede mandar los datos como formulario (application/x-www-form-urlencoded),
// como JSON, o pegados en la URL como query params. Aceptamos los tres para no
// depender de cómo exactamente arme la petición.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Variables de entorno requeridas (se configuran en Render, no aquí en el código)
const {
  GATEWAY_SECRET_TOKEN,   // El token que TÚ inventas y pones también en MikroWisp
  EVOLUTION_API_URL,      // Ej: https://gerconnection-wa.onrender.com
  EVOLUTION_INSTANCE,     // Ej: gerconnection
  EVOLUTION_API_KEY,      // El apikey de la instancia (el que viste con el ícono del ojo)
  DEFAULT_COUNTRY_CODE,   // Ej: 57  (se antepone solo si el número no lo trae ya)
} = process.env;

function normalizeNumber(raw) {
  if (!raw) return raw;
  // Deja solo dígitos (quita espacios, +, guiones, paréntesis, etc.)
  let digits = String(raw).replace(/\D/g, "");

  // Si configuraste un código de país por defecto y el número parece no traerlo
  // (números locales suelen ser más cortos que uno con código de país incluido),
  // se lo anteponemos. Ajusta el 10 según la longitud típica de tus números locales.
  if (DEFAULT_COUNTRY_CODE && digits.length <= 10 && !digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    digits = DEFAULT_COUNTRY_CODE + digits;
  }
  return digits;
}

function checkAuth(req) {
  const header = req.headers["authorization"] || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return GATEWAY_SECRET_TOKEN && token === GATEWAY_SECRET_TOKEN;
}

function extractParams(req) {
  // Soporta req.body (form o json) y req.query, y varios nombres de campo posibles
  // por si MikroWisp usa "to"/"destinatario"/"numero" o "message"/"mensaje".
  const source = { ...req.query, ...req.body };
  const to =
    source.to || source.destinatario || source.numero || source.number;
  const message =
    source.message || source.mensaje || source.text || source.msg;
  return { to, message };
}

app.post("/gateway/send", async (req, res) => {
  try {
    if (!checkAuth(req)) {
      return res.status(401).json({ status: "error", message: "Token inválido" });
    }

    const { to, message } = extractParams(req);

    if (!to || !message) {
      return res.status(400).json({
        status: "error",
        message: "Faltan parámetros 'to' y/o 'message'",
      });
    }

    const number = normalizeNumber(to);
    const instance = encodeURIComponent(EVOLUTION_INSTANCE);
    const url = `${EVOLUTION_API_URL}/message/sendText/${instance}`;

    const evoResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number, text: message }),
    });

    const data = await evoResponse.json().catch(() => ({}));

    if (!evoResponse.ok) {
      console.error("Error de Evolution API:", data);
      return res.status(502).json({
        status: "error",
        message: "Evolution API rechazó el envío",
        detail: data,
      });
    }

    console.log(`Mensaje enviado a ${number}`);
    return res.status(200).json({ status: "success", detail: data });
  } catch (err) {
    console.error("Error en el gateway:", err);
    return res.status(500).json({ status: "error", message: "Error interno del gateway" });
  }
});

// Endpoint simple para confirmar que el servicio está vivo
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Gateway MikroWisp -> Evolution API activo" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gateway escuchando en el puerto ${PORT}`);
});
