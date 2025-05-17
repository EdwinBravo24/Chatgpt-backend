import OpenAI from 'openai';
import Conversation from '../models/Conversation.js';
import Auditorium from '../models/Auditorium.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurar OpenAI
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno OPENAI_API_KEY no está definida');
  }
  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('Error al inicializar OpenAI:', error);
}

// Verifica si la pregunta es sobre salones
async function checkIfAboutAuditoriums(prompt) {
  const keywords = ['salón', 'salones', 'auditorio', 'aula', 'piso', 'capacidad',
    'EC-', 'edificio', 'proyector', 'reserva', 'silla', 'mesa',
    'tablero', 'equipamiento', 'característica', 'tomacorriente'];
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some(word => lowerPrompt.includes(word.toLowerCase())) ||
    /EC-\d+\.\d+/i.test(prompt);
}

// Obtiene datos relevantes de MongoDB según la pregunta
async function getRelevantAuditoriumData(prompt) {
  let query = {};

  // Extraer número de piso si se menciona
  const floorMatch = prompt.match(/piso (\d+)/i);
  if (floorMatch) query.floor = floorMatch[1];

  // Filtros por características
  if (prompt.toLowerCase().includes('proyector')) {
    query.equipment = 'Proyector';
  }
  if (prompt.toLowerCase().includes('móvil')) {
    query.tableType = /Móvil/i;
  }
  if (prompt.toLowerCase().includes('fijo')) {
    query.boardType = /Fijo/i;
  }

  // Determinar qué campos devolver según el tipo de pregunta
  let projection = {};
  if (prompt.toLowerCase().includes('cuántos') ||
    prompt.toLowerCase().includes('cantidad')) {
    return { count: await Auditorium.countDocuments(query) };
  }

  if (prompt.toLowerCase().includes('lista') ||
    prompt.toLowerCase().includes('cuales') ||
    prompt.toLowerCase().includes('nombres')) {
    projection = { code: 1, _id: 0 };
  }

  return Auditorium.find(query).select(projection).lean();
}

// Generar respuesta de ChatGPT
export const generateChatResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }

    if (!openai) {
      return res.status(500).json({
        error: 'No se ha configurado correctamente la API de OpenAI',
      });
    }

    // Verificar si la pregunta es sobre los salones
    const isAboutAuditoriums = await checkIfAboutAuditoriums(prompt);
    if (!isAboutAuditoriums) {
      return res.json({
        response: "Solo puedo responder preguntas sobre los salones y auditorios de la institución."
      });
    }

    // Obtener datos relevantes de MongoDB
    const auditoriumData = await getRelevantAuditoriumData(prompt);

    // Crear contexto estructurado para OpenAI
    let context;
    if (auditoriumData.count !== undefined) {
      context = `Hay ${auditoriumData.count} salones que coinciden con la consulta.`;
    } else if (Array.isArray(auditoriumData)) {
      if (auditoriumData.length === 0) {
        context = "No hay salones que coincidan con los criterios.";
      } else if (auditoriumData[0].code && Object.keys(auditoriumData[0]).length === 1) {
        context = `Salones: ${auditoriumData.map(a => a.code).join(', ')}.`;
      } else {
        context = `Datos de salones: ${JSON.stringify(auditoriumData)}.`;
      }
    } else {
      context = `Datos del salón: ${JSON.stringify(auditoriumData)}.`;
    }

    // Llamada a OpenAI con contexto específico
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Eres un asistente especializado exclusivamente en los salones de Educación Continua. 
          Responde ÚNICAMENTE sobre los salones/auditorios. Sé extremadamente conciso:
          - Para cantidades: solo el número
          - Para listas: solo los nombres separados por comas
          - Para descripciones: solo los datos solicitados en 1 frase
          - No agregues información no solicitada
          - No des explicaciones adicionales
          
          Contexto actual: ${context}`
        },
        {
          role: "user",
          content: `Responde esta pregunta de manera ultra-concisa: ${prompt}`
        }
      ],
      max_tokens: 100,
      temperature: 0.2, // Baja temperatura para respuestas más precisas
    });

    const response = completion.choices[0].message.content;

    // Guardar la conversación en la base de datos
    await Conversation.create({ prompt, response });

    res.json({ response });
  } catch (error) {
    console.error('Error al generar la respuesta:', error);
    res.status(500).json({
      error: 'Error al procesar la solicitud',
      details: error.message
    });
  }
};

// Obtener historial de conversaciones
export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 }).limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('Error al obtener el historial:', error);
    res.status(500).json({ error: 'Error al obtener el historial de conversaciones' });
  }
};