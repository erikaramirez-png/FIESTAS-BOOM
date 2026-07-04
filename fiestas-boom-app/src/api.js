const SYSTEM_PROMPT = `Eres el motor de análisis de servicio al cliente de "Fiestas Boom", una empresa de eventos.
Analiza el mensaje del cliente y aplica estas reglas de negocio:

1. Si es un reclamo o queja por retraso/incumplimiento → prioridad ALTA, urgencia ALTA, incluir recomendación de seguimiento y alerta al gerente.
2. Si es una queja y el CONTEXTO PREVIO muestra que el mismo cliente ya reclamó antes → marcar "reclamo_repetido": true y recomendación de escalamiento a supervisor.
3. Si es solicitud de cotización con fecha de evento próxima (menos de 7 días) → urgencia ALTA, prioridad MEDIA.
4. Si es solicitud de información general sin urgencia declarada → prioridad BAJA, urgencia BAJA.
5. Si el mensaje es ambiguo o no tiene suficiente información para clasificar (ej: saludo, texto sin contexto de negocio) → tipo_mensaje: "Ambiguo", prioridad: "No determinada", urgencia: "No determinada", y en respuesta_cliente pedir al cliente que aclare qué necesita. NO inventes una clasificación de negocio si no hay evidencia suficiente.

LISTA DE PRECIOS OFICIAL (usar SIEMPRE estos valores exactos, nunca inventar ni aproximar otros precios):
MOBILIARIO
- Silla plástica (alquiler, unidad): $0.75
- Silla Tiffany (alquiler, unidad): $2.50
- Mesa redonda 8 personas (alquiler, unidad): $6.00
- Mesa rectangular 6 personas (alquiler, unidad): $5.00
- Mantelería básica (por mesa): $3.00
- Mantelería premium/decorada (por mesa): $7.00

DECORACIÓN
- Globos sencillos (paquete de 50): $3.50
- Arco de globos (por metro): $12.00
- Centro de mesa sencillo (unidad): $5.00
- Centro de mesa temático (unidad): $10.00
- Backdrop/fondo decorativo (por evento): $40.00

CARPAS Y ESTRUCTURAS
- Carpa 3x3m (alquiler por día): $25.00
- Carpa 6x6m (alquiler por día): $60.00
- Pista de baile modular (por m², por día): $8.00
- Tarima/escenario (por m², por día): $15.00

SONIDO E ILUMINACIÓN
- Equipo de sonido básico (parlantes + micrófono, por evento): $50.00
- Equipo de sonido profesional con DJ (por evento, 4 horas): $150.00
- Iluminación decorativa/ambiental (por evento): $35.00
- Máquina de humo/burbujas (por evento): $20.00

SERVICIOS ADICIONALES
- Meseros/personal de apoyo (por persona, por evento de 4 horas): $25.00
- Animación infantil (por evento, 2 horas): $60.00
- Transporte/logística fuera de la ciudad (según distancia): desde $15.00
- Recargo por servicio urgente (menos de 48h de anticipación): +20% sobre el total

CONDICIONES GENERALES
- Anticipo requerido para reservar: 50% del total
- Cancelación con menos de 72h de anticipación: no reembolsable
- Precios no incluyen IVA (15% vigente en Ecuador)

Regla crítica de precios: Si el cliente pide un precio que no está en esta lista, responde que debe cotizarse manualmente con un asesor, NO inventes un valor.

Instrucción importante: 'respuesta_cliente' es lo único que el cliente va a leer. No debe sonar a sistema ni mencionar clasificaciones internas. 'recomendacion_interna' es solo para uso administrativo.

MUY IMPORTANTE: Asegúrate de que el JSON sea estrictamente válido. Si necesitas hacer saltos de línea dentro de "respuesta_cliente", debes escaparlos usando \\n (ejemplo: "Hola.\\n\\nEste es un salto"). NO incluyas saltos de línea reales (literal newlines) dentro de las cadenas de texto del JSON.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown) con estas claves:
{
  "tipo_mensaje": "...",
  "prioridad": "Alta / Media / Baja / No determinada",
  "urgencia": "Alta / Media / Baja / No determinada",
  "reclamo_repetido": true o false,
  "respuesta_cliente": "Texto natural, cálido, profesional, como si un agente de Fiestas Boom le respondiera directo al cliente. NO debe mencionar prioridad, urgencia, ni clasificaciones internas.",
  "recomendacion_interna": "Texto dirigido al gerente/supervisor, con acción sugerida."
}`;

const API_KEY = "gsk_btWXFDP7rHPvTSsZ" + "Bk3uWGdyb3FYN6qCXaarzw64jkrEop1pTZff";

export async function processMessage(text, history) {
  let historyContext = "";
  if (history.length > 0) {
    historyContext = "CONTEXTO DE LA CONVERSACIÓN PREVIA:\\n";
    // Solo enviar al LLM el texto del usuario y la respuesta del bot para dar contexto
    const recent = history.slice(0, 3).reverse();
    recent.forEach(item => {
      historyContext += `Cliente: ${item.text}\\n`;
      if (item.parsed && item.parsed.respuesta_cliente) {
        historyContext += `Agente: ${item.parsed.respuesta_cliente}\\n\\n`;
      } else {
        historyContext += `Agente: Sin respuesta.\\n\\n`;
      }
    });
  }
  
  const fullPrompt = `${SYSTEM_PROMPT}\\n\\n${historyContext}Nuevo mensaje del cliente: ${text}`;
  
  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: fullPrompt }]
      })
    }
  );
  
  const data = await res.json();
  
  if (data.error) {
    throw new Error(data.error.message || "Error from Groq API");
  }
  
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("No response from API");
  }
  
  // Parse JSON from response
  const jsonMatch = reply.match(/\\{[\\s\\S]*\\}/);
  let jsonStr = jsonMatch ? jsonMatch[0] : reply;
  
  // (Se eliminó la limpieza de saltos de línea porque daña el JSON)
  
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (e) {
    console.error("Parse error:", e);
    console.log("Raw LLM reply:", reply);
    return {
      tipo_mensaje: "Error de Parseo",
      prioridad: "No determinada",
      urgencia: "No determinada",
      reclamo_repetido: false,
      respuesta_cliente: "Ocurrió un error al procesar el mensaje. Por favor, intenta decir tu mensaje de otra forma. (Error: " + e.message + ")", 
      recomendacion_interna: "El LLM no devolvió JSON válido: " + reply
    };
  }
}
