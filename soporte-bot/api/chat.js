// api/chat.js — Vercel Serverless Function
// Deploy en Vercel: https://vercel.com/new
// Configurá la variable ANTHROPIC_API_KEY en Vercel → Settings → Environment Variables

export default async function handler(req, res) {
  // CORS — permitir llamadas desde tu tienda
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { messages, storeConfig } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Se requiere el campo messages" });
  }

  // Construir el system prompt con la config de la tienda
  const config = storeConfig || {};
  const systemPrompt = `Sos ${config.botName || "Sofia"}, asistente de soporte posventa de ${config.storeName || "la tienda"}.

Tu trabajo es ayudar a los clientes con:
- Estado y seguimiento de pedidos
- Cambios y devoluciones
- Reclamos por productos dañados o incorrectos
- Preguntas sobre envíos y pagos

Políticas de la tienda:
- Devoluciones: ${config.returnsPolicy || "30 días desde la compra, producto sin uso y en embalaje original"}
- Envíos: ${config.shippingTime || "3 a 7 días hábiles a todo el país"}
- Horario de atención humana: ${config.supportHours || "Lunes a viernes de 9 a 18 hs"}

Reglas importantes:
- Respondé siempre en español rioplatense, de forma breve y amable (máximo 3-4 oraciones)
- Si no podés resolver algo, decí exactamente: "DERIVAR_AGENTE" al inicio de tu respuesta y luego explicá por qué
- Nunca inventes información sobre pedidos específicos; pedí el número de orden al cliente
- Tono: ${config.tone || "amigable y casual"}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        system: systemPrompt,
        messages: messages.slice(-10), // Últimos 10 mensajes para no exceder el contexto
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Anthropic API error:", err);
      return res.status(502).json({ error: "Error al contactar la API de Claude" });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "No pude procesar tu consulta.";

    // Detectar si el bot quiere derivar al agente humano
    const needsHuman = reply.startsWith("DERIVAR_AGENTE");
    const cleanReply = reply.replace("DERIVAR_AGENTE", "").trim();

    return res.status(200).json({
      reply: cleanReply,
      needsHuman,
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
