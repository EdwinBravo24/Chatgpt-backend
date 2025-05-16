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

// Función para manejar consultas específicas de EC
export const handleECQuery = async (prompt) => {
  const normalizedPrompt = prompt.toLowerCase();

  // 1. Detectar si pregunta por disponibilidad
  if (normalizedPrompt.includes('disponible') || normalizedPrompt.includes('libre')) {
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      status: 'Disponible'
    });
    return {
      response: formatResponse(salones, 'disponibles'),
      data: salones
    };
  }

  // 2. Detectar si pregunta por salones en uso
  if (normalizedPrompt.includes('en uso') || normalizedPrompt.includes('ocupado')) {
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      status: 'En uso'
    });
    return {
      response: formatResponse(salones, 'en uso'),
      data: salones
    };
  }

  // 3. Detectar capacidad específica
  const capacidadMatch = normalizedPrompt.match(/(\d+)\s*(personas|asientos|capacidad)/);
  if (capacidadMatch) {
    const capacidad = parseInt(capacidadMatch[1]);
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      capacity: { $gte: capacidad }
    }).sort({ capacity: 1 });
    return {
      response: formatResponse(salones, `con capacidad para ${capacidad}+ personas`),
      data: salones
    };
  }

  // 4. Detectar preguntas por equipamiento
  const equipos = ['mesa', 'tablero', 'pizarra', 'proyector', 'sillas', 'equipo'];
  const equipoRequerido = equipos.find(equipo => normalizedPrompt.includes(equipo));

  if (equipoRequerido) {
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      $or: [
        { equipment: new RegExp(equipoRequerido, 'i') },
        { tableType: new RegExp(equipoRequerido, 'i') },
        { chairType: new RegExp(equipoRequerido, 'i') },
        { boardType: new RegExp(equipoRequerido, 'i') }
      ]
    });
    return {
      response: formatResponse(salones, `con ${equipoRequerido}`),
      data: salones
    };
  }

  // 5. Detectar preguntas por piso
  const pisoMatch = normalizedPrompt.match(/piso\s*(\d+)/);
  if (pisoMatch) {
    const piso = parseInt(pisoMatch[1]);
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      floor: piso
    });
    return {
      response: formatResponse(salones, `en piso ${piso}`),
      data: salones
    };
  }

  // 6. Consulta sobre cantidad y distribución
  if (normalizedPrompt.includes('cuantos hay') || normalizedPrompt.includes('distribuidos')) {
    const totalSalones = await Auditorium.countDocuments({ code: { $regex: /^EC-/i } });
    const porPiso = await Auditorium.aggregate([
      { $match: { code: { $regex: /^EC-/i } } },
      { $group: { _id: "$floor", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    let response = `🏢 Edificio Educación Continua:\n`;
    response += `• Total de salones: ${totalSalones}\n`;
    response += `• Distribución por pisos:\n`;
    porPiso.forEach(piso => {
      response += `   - Piso ${piso._id}: ${piso.count} salones\n`;
    });

    const equipamiento = await Auditorium.aggregate([
      { $match: { code: { $regex: /^EC-/i } } },
      {
        $group: {
          _id: null,
          conProyector: { $sum: { $cond: [{ $regexMatch: { input: "$equipment", regex: /proyector/i } }, 1, 0] } },
          conTablero: { $sum: { $cond: [{ $ne: ["$boardType", "No tiene"] }, 1, 0] } },
          conMesas: { $sum: { $cond: [{ $ne: ["$tableType", "No tiene"] }, 1, 0] } },
          sinEquipamiento: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$boardType", "No tiene"] },
                    { $eq: ["$tableType", "No tiene"] },
                    { $not: { $regexMatch: { input: "$equipment", regex: /proyector/i } } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    response += `\n📊 Equipamiento general:\n`;
    response += `• Con proyector: ${equipamiento[0].conProyector}\n`;
    response += `• Con tablero: ${equipamiento[0].conTablero}\n`;
    response += `• Con mesas: ${equipamiento[0].conMesas}\n`;
    response += `• Sin equipamiento básico: ${equipamiento[0].sinEquipamiento}\n`;

    return { response, data: null };
  }

  // 7. Consultas específicas por equipamiento (no tiene/tiene)
  const equipamientoQueries = {
    'mesa': 'tableType',
    'tablero': 'boardType',
    'proyector': 'equipment',
    'silla': 'chairType'
  };

  for (const [key, field] of Object.entries(equipamientoQueries)) {
    if (normalizedPrompt.includes(key)) {
      const tiene = normalizedPrompt.includes(' no ') ? 'No tiene' : { $ne: 'No tiene' };
      let query = { code: { $regex: /^EC-/i } };

      if (field === 'equipment' && key === 'proyector') {
        // Caso especial para proyector
        if (normalizedPrompt.includes(' no ')) {
          query.equipment = { $not: /proyector/i };
        } else {
          query.equipment = /proyector/i;
        }
      } else {
        query[field] = tiene;
      }

      const salones = await Auditorium.find(query).sort({ floor: 1, code: 1 });

      if (salones.length === 0) {
        return {
          response: `No hay salones ${normalizedPrompt.includes(' no ') ? 'sin' : 'con'} ${key}`,
          data: null
        };
      }

      const response = salones.map(s =>
        `• ${s.code} (Piso ${s.floor}) - ${s.name}\n` +
        `   ${field}: ${s[field] || 'No especificado'}\n` +
        `   Contacto: ${s.reservationContact}\n` +
        `   Estado: ${s.status}${s.status === 'Disponible' ? ' ✅' : ' ⏳'}\n`
      ).join('\n');

      return {
        response: `Salones ${normalizedPrompt.includes(' no ') ? 'sin' : 'con'} ${key}:\n${response}`,
        data: salones
      };
    }
  }

  // 8. Consulta por salones sin equipamiento
  if (normalizedPrompt.includes('sin equipamiento') ||
    normalizedPrompt.includes('no tiene nada')) {
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      boardType: 'No tiene',
      tableType: 'No tiene',
      equipment: { $not: /proyector/i }
    });

    const response = salones.map(s =>
      `• ${s.code} (Piso ${s.floor}) - ${s.name}\n` +
      `   Equipamiento: Ninguno\n` +
      `   Contacto: ${s.reservationContact}\n` +
      `   Estado: ${s.status}${s.status === 'Disponible' ? ' ✅' : ' ⏳'}\n`
    ).join('\n');

    return {
      response: `Salones sin equipamiento básico:\n${response}`,
      data: salones
    };
  }

  // 9. Consulta por salones con todo el equipamiento
  if (normalizedPrompt.includes('con todo') ||
    normalizedPrompt.includes('completamente equipado')) {
    const salones = await Auditorium.find({
      code: { $regex: /^EC-/i },
      boardType: { $ne: 'No tiene' },
      tableType: { $ne: 'No tiene' },
      equipment: /proyector/i
    });

    const response = salones.map(s =>
      `• ${s.code} (Piso ${s.floor}) - ${s.name}\n` +
      `   Equipamiento completo:\n` +
      `   - Tablero: ${s.boardType}\n` +
      `   - Mesas: ${s.tableType}\n` +
      `   - Equipo: ${s.equipment}\n` +
      `   Contacto: ${s.reservationContact}\n` +
      `   Estado: ${s.status}${s.status === 'Disponible' ? ' ✅' : ' ⏳'}\n`
    ).join('\n');

    return {
      response: `Salones completamente equipados:\n${response}`,
      data: salones
    };
  }

  // 10. Consulta por un salón específico
  const salonMatch = normalizedPrompt.match(/ec-([a-z0-9\.-]+)/i);
  if (salonMatch) {
    const codigoSalon = salonMatch[0].toUpperCase();
    const salon = await Auditorium.findOne({ code: codigoSalon });

    if (!salon) {
      return {
        response: `No se encontró información para el salón ${codigoSalon}`,
        data: null
      };
    }

    const response =
      `📋 Información de ${salon.code}:\n` +
      `• Nombre: ${salon.name}\n` +
      `• Piso: ${salon.floor}\n` +
      `• Capacidad: ${salon.capacity} personas\n` +
      `• Estado: ${salon.status}${salon.status === 'Disponible' ? ' ✅' : ' ⏳'}\n` +
      `• Equipamiento:\n` +
      `  - Mesas: ${salon.tableType || 'No tiene'}\n` +
      `  - Tablero: ${salon.boardType || 'No tiene'}\n` +
      `  - Equipo: ${salon.equipment || 'No tiene'}\n` +
      `• Contacto para reservas: ${salon.reservationContact}\n`;

    return {
      response,
      data: [salon]
    };
  }

  // 11. Si no coincide con nada, devolver todos los salones
  const todosSalones = await Auditorium.find({ code: { $regex: /^EC-/i } })
    .sort({ floor: 1, code: 1 });

  return {
    response: formatResponse(todosSalones, 'del edificio Educación Continua'),
    data: todosSalones
  };
};

// Formatear la respuesta según el contexto
const formatResponse = (salones, contexto) => {
  if (salones.length === 0) {
    return `No hay salones ${contexto} registrados.`;
  }

  const listaSalones = salones.map(s =>
    `• ${s.code} (${s.name}) - ${s.capacity} pers.${s.status === 'Disponible' ? ' ✅' : ' ⏳'}`
  ).join('\n');

  return `Salones ${contexto}:\n${listaSalones}`;
};

// Controlador principal
export const generateChatResponse = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }

    // Verificar si es consulta sobre Educación Continua
    const isECQuery = prompt.toLowerCase().includes('ec-') ||
      prompt.toLowerCase().includes('educación continua') ||
      prompt.toLowerCase().includes('salón') ||
      prompt.toLowerCase().includes('salones');

    if (isECQuery) {
      const { response, data } = await handleECQuery(prompt);

      await Conversation.create({
        prompt,
        response,
        tipo: 'educacion_continua',
        data: data
      });

      return res.json({ response, data });
    }

    // Para otras consultas, usar OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Eres un asistente especializado en los salones del edificio Educación Continua. Si la consulta no está relacionada con eso, responde de forma general pero amable."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;

    await Conversation.create({
      prompt,
      response,
      tipo: 'general'
    });

    res.json({ response });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error al procesar tu solicitud',
      details: error.message
    });
  }
};
export const getConversationHistory = async (req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(conversations);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};