// api/chat.js — Vercel Serverless Function
// Configurá la variable GROQ_API_KEY en Vercel → Settings → Environment Variables
// Clave gratuita en: https://console.groq.com

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY no configurada en las variables de entorno");
    return res.status(500).json({ error: "El servidor no está configurado correctamente" });
  }

  const { messages, storeConfig, systemPrompt: customSystemPrompt } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Se requiere el campo messages" });
  }

  const config = storeConfig || {};
  const systemPrompt = customSystemPrompt || `Sos ${config.botName || "Sofia"}, asistente de soporte posventa de ${config.storeName || "la tienda"}.

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
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Groq API error:", err);
      return res.status(502).json({ error: "Error al contactar la IA", detail: err });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No pude procesar tu consulta.";

    const needsHuman = reply.startsWith("DERIVAR_AGENTE");
    const cleanReply = reply.replace("DERIVAR_AGENTE", "").trim();

    return res.status(200).json({ reply: cleanReply, needsHuman });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
