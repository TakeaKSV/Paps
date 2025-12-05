import express from 'express';
import Quotation from '../models/Quotation.js';

const router = express.Router();

// FUNCIÓN PARA AGREGAR ACCESORIOS AUTOMÁTICAMENTE (AGRUPADOS)
const addAutoAccessories = (items, productCatalog) => {
  const accessoriesMap = {}; // Usar un mapa para agrupar accesorios
  
  items.forEach(item => {
    const description = item.description.toLowerCase();
    
    // DETECTAR ASPERSORES
    const isAspersor = description.includes('aspersor') || 
                       description.includes('unispray') || 
                       description.includes('spray');
    
    if (isAspersor) {
      const quantity = item.quantity;
      
      // Agregar 45cm de Swing Pipe por cada aspersor
      const swingPipeKey = 'swing_pipe';
      if (!accessoriesMap[swingPipeKey]) {
        accessoriesMap[swingPipeKey] = {
          description: 'Manguera flexible Swing Pipe',
          quantity: 0,
          unit: 'metro',
          unit_price: 24.81,
          subtotal: 0
        };
      }
      accessoriesMap[swingPipeKey].quantity += quantity * 0.45;
      
      // Agregar 2 codos funnypipe por cada aspersor
      const codoKey = 'codo_funnypipe';
      if (!accessoriesMap[codoKey]) {
        accessoriesMap[codoKey] = {
          description: 'Codo 90° x inserción 1/2" (funnypipe)',
          quantity: 0,
          unit: 'pieza',
          unit_price: 6.50,
          subtotal: 0
        };
      }
      accessoriesMap[codoKey].quantity += quantity * 2;
      
      // Agregar 1 tee con rosca por cada aspersor
      const teeKey = 'tee_rosca';
      if (!accessoriesMap[teeKey]) {
        accessoriesMap[teeKey] = {
          description: 'Tee PVC 1" x 1" x 1/2" con rosca',
          quantity: 0,
          unit: 'pieza',
          unit_price: 17.10,
          subtotal: 0
        };
      }
      accessoriesMap[teeKey].quantity += quantity;
    }
    
    // DETECTAR VÁLVULAS SOLENOIDES
    const isValvula = description.includes('válvula') || 
                      description.includes('valvula') || 
                      description.includes('solenoide');
    
    if (isValvula) {
      const quantity = item.quantity;
      
      // Agregar 1 registro circular de 6" por cada válvula
      const registroKey = 'registro_6';
      if (!accessoriesMap[registroKey]) {
        accessoriesMap[registroKey] = {
          description: 'Registro circular de 6"',
          quantity: 0,
          unit: 'pieza',
          unit_price: 107.35,
          subtotal: 0
        };
      }
      accessoriesMap[registroKey].quantity += quantity;
    }
  });
  
  // Calcular subtotales y convertir el mapa a array
  const accessoriesArray = Object.values(accessoriesMap).map(accessory => ({
    ...accessory,
    subtotal: accessory.quantity * accessory.unit_price
  }));
  
  return [...items, ...accessoriesArray];
};

// POST /api/quotations/generate-with-ai - Generar cotización con IA (con soporte para eliminación)
router.post('/generate-with-ai', async (req, res) => {
  const { userMessage, productCatalog, currentItems } = req.body;

  if (!userMessage) {
    return res.status(400).json({ success: false, message: 'Se requiere un mensaje del usuario' });
  }

  const maxRetries = 3;
  const retryDelays = [2000, 4000, 6000];

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // ========== DETECTAR SI ES UN COMANDO DE ELIMINACIÓN ==========
      const deletePatterns = [
        /elimina(r)?\s+(el\s+)?(producto\s+)?(\d+|primero?|segundo|tercero?|cuarto|quinto|sexto|séptimo|octavo|noveno|décimo|último)/i,
        /quita(r)?\s+(el\s+)?(producto\s+)?(\d+|primero?|segundo|tercero?|cuarto|quinto|sexto|séptimo|octavo|noveno|décimo|último)/i,
        /borra(r)?\s+(el\s+)?(producto\s+)?(\d+|primero?|segundo|tercero?|cuarto|quinto|sexto|séptimo|octavo|noveno|décimo|último)/i,
        /elimina(r)?\s+(.+)/i,
        /quita(r)?\s+(.+)/i,
        /borra(r)?\s+(.+)/i
      ];

      const isDeleteCommand = deletePatterns.some(pattern => pattern.test(userMessage));

      if (isDeleteCommand && currentItems && currentItems.length > 0) {
        // PROCESAR COMANDO DE ELIMINACIÓN
        const numberMatch = userMessage.match(/(\d+)/);
        const positionWords = {
          'primero': 1, 'primer': 1, 'primera': 1,
          'segundo': 2, 'segunda': 2,
          'tercero': 3, 'tercer': 3, 'tercera': 3,
          'cuarto': 4, 'cuarta': 4,
          'quinto': 5, 'quinta': 5,
          'sexto': 6, 'sexta': 6,
          'séptimo': 7, 'septimo': 7, 'séptima': 7, 'septima': 7,
          'octavo': 8, 'octava': 8,
          'noveno': 9, 'novena': 9,
          'décimo': 10, 'decimo': 10, 'décima': 10, 'decima': 10,
          'último': currentItems.length, 'ultima': currentItems.length
        };

        let itemIndex = -1;

        // Buscar por número directo
        if (numberMatch) {
          itemIndex = parseInt(numberMatch[1]) - 1;
        } else {
          // Buscar por palabra de posición
          for (const [word, position] of Object.entries(positionWords)) {
            if (userMessage.toLowerCase().includes(word)) {
              itemIndex = position - 1;
              break;
            }
          }
        }

        // Si no encontró por número o posición, buscar por descripción
        if (itemIndex === -1) {
          const searchTerms = userMessage
            .toLowerCase()
            .replace(/elimina(r)?|quita(r)?|borra(r)?|el|la|los|las|producto|productos/gi, '')
            .trim();

          if (searchTerms) {
            itemIndex = currentItems.findIndex(item => 
              item.description.toLowerCase().includes(searchTerms)
            );
          }
        }

        if (itemIndex >= 0 && itemIndex < currentItems.length) {
          const deletedItem = currentItems[itemIndex];
          return res.json({
            success: true,
            action: 'delete',
            itemIndex: itemIndex,
            deletedItem: deletedItem,
            message: `Producto "${deletedItem.description}" eliminado de la cotización.`
          });
        } else {
          return res.json({
            success: false,
            message: 'No encontré ese producto en la cotización. Intenta con "elimina el producto 1" o menciona el nombre del producto.'
          });
        }
      }

      // ========== SI NO ES COMANDO DE ELIMINACIÓN, GENERAR COTIZACIÓN ==========
      const systemPrompt = `Eres un EXPERTO en sistemas de riego agrícola, residencial y comercial especializado en productos Rain Bird. 

Trabajas con estos productos específicos:
- Controladores Rain Bird de 4 estaciones
- Válvulas solenoides 1"
- Aspersores Unispray Rain Bird con boquillas Van
- Tubería PVC hidráulico 1"
- Manguera flexible Swing Pipe
- Conexiones PVC: codos, tees, coples, adaptadores, tapones
- Pegamento y limpiador Weld On
- Material eléctrico: cable calibre 18, poliducto, contactores Siemens

CATÁLOGO COMPLETO DE PRODUCTOS:
${JSON.stringify(productCatalog, null, 2)}

INSTRUCCIONES IMPORTANTES:
1. Analiza la solicitud e identifica productos específicos y cantidades
2. Si mencionan solo el tipo de producto sin medida, sugiere las opciones más comunes
3. Para proyectos complejos, recomienda productos complementarios necesarios
4. Usa términos técnicos correctos
5. Calcula subtotales, IVA (16%) y total
6. Si el cliente describe un proyecto, sugiere un sistema completo
7. NO agregues accesorios para aspersores ni válvulas, eso se hace automáticamente

RESPONDE CON JSON EN ESTE FORMATO EXACTO:
{
  "items": [
    {
      "description": "Descripción completa del producto",
      "quantity": número,
      "unit": "metro/pieza/servicio",
      "unit_price": precio_unitario,
      "subtotal": cantidad * precio_unitario
    }
  ],
  "subtotal": suma_de_subtotales,
  "iva": subtotal * 0.16,
  "total": subtotal + iva,
  "notes": "Recomendaciones técnicas o productos complementarios sugeridos",
  "success": true
}

Si no hay suficiente información, responde:
{
  "success": false,
  "message": "Necesito más detalles: [especificar qué información falta]"
}

IMPORTANTE: 
- NO generes los campos quotation_number, date, ni valid_until (se generan automáticamente)
- Responde SOLO con JSON válido, sin markdown, sin texto adicional.`;

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          messages: [
            {
              role: 'user',
              content: systemPrompt + "\n\nSOLICITUD DEL CLIENTE:\n" + userMessage
            }
          ]
        })
      });

      if (anthropicResponse.status === 529) {
        if (attempt < maxRetries - 1) {
          console.log(`API sobrecargada, reintentando en ${retryDelays[attempt]}ms... (intento ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
          continue;
        } else {
          return res.status(503).json({
            success: false,
            message: 'La API de Claude está experimentando mucho tráfico. Por favor intenta de nuevo en unos segundos.',
            retryable: true
          });
        }
      }

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        throw new Error(`Error de la API de Anthropic: ${anthropicResponse.status} - ${errorText}`);
      }

      const data = await anthropicResponse.json();
      let claudeResponse = data.content[0].text;

      let cleanResponse = claudeResponse.trim();
      cleanResponse = cleanResponse.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let quotationData;
      try {
        quotationData = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('Error al parsear respuesta de Claude:', cleanResponse);
        return res.json({
          success: false,
          message: 'No pude interpretar eso. ¿Puedes especificar qué productos y cantidades necesitas?'
        });
      }

      // ========== AGREGAR ACCESORIOS AUTOMÁTICOS ==========
      if (quotationData.items && quotationData.items.length > 0) {
        quotationData.items = quotationData.items.map(item => ({
          ...item,
          subtotal: item.quantity * item.unit_price
        }));
        
        // Agregar accesorios automáticos para aspersores y válvulas
        quotationData.items = addAutoAccessories(quotationData.items, productCatalog);
        
        console.log('✅ Accesorios automáticos agregados');
      }

      return res.json(quotationData);

    } catch (error) {
      console.error(`Error en intento ${attempt + 1}:`, error);
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelays[attempt]));
        continue;
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud: ' + error.message
      });
    }
  }
});

// Crear nueva cotización
router.post('/', async (req, res) => {
  try {
    console.log('📥 Recibiendo cotización:', req.body);
    
    // Validar campos requeridos
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ 
        error: 'Validación fallida',
        message: 'La cotización debe tener al menos un producto'
      });
    }

    if (!req.body.total || req.body.total <= 0) {
      return res.status(400).json({ 
        error: 'Validación fallida',
        message: 'El total debe ser mayor a 0'
      });
    }

    // Generar fechas
    const today = new Date();
    const validUntil = new Date(today.getTime() + 30*24*60*60*1000);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    };

    // Crear datos de cotización (SIN quotation_number - se genera automáticamente)
    const quotationData = {
      date: req.body.date || formatDate(today),
      valid_until: req.body.valid_until || formatDate(validUntil),
      client_name: req.body.client_name || 'Cliente',
      client_email: req.body.client_email || null,
      client_phone: req.body.client_phone || null,
      client_address: req.body.client_address || null,
      items: req.body.items,
      subtotal: req.body.subtotal,
      includeIVA: req.body.includeIVA !== undefined ? req.body.includeIVA : true,
      iva: req.body.iva || 0,
      includeManoObra: req.body.includeManoObra || false,
      manoObra: req.body.manoObra || 0,
      manoObraPercentage: req.body.manoObraPercentage || null,
      subtotalWithManoObra: req.body.subtotalWithManoObra || req.body.subtotal,
      total: req.body.total,
      notes: req.body.notes || '',
      status: req.body.status || 'pendiente'
    };

    console.log('💾 Creando cotización en BD...');

    const quotation = new Quotation(quotationData);
    await quotation.save();
    
    console.log('✅ Cotización guardada exitosamente:', quotation.quotation_number);
    
    res.status(201).json(quotation);
  } catch (error) {
    console.error('❌ Error al guardar cotización:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Número de cotización duplicado',
        message: 'Ya existe una cotización con ese número. Intenta guardar de nuevo.'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Error de validación',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Error del servidor',
      message: error.message 
    });
  }
});

// Actualizar cotización completa
router.patch('/:id', async (req, res) => {
  try {
    const quotationId = req.params.id;
    console.log(`📝 Actualizando cotización ${quotationId}:`, req.body);

    // Recalcular totales si se modifican items
    let updateData = { ...req.body };
    
    if (req.body.items) {
      const subtotal = req.body.items.reduce((sum, item) => sum + item.subtotal, 0);
      const subtotalWithManoObra = subtotal + (req.body.manoObra || 0);
      const iva = req.body.includeIVA !== false ? subtotalWithManoObra * 0.16 : 0;
      const total = subtotalWithManoObra + iva;
      
      updateData = {
        ...updateData,
        subtotal,
        subtotalWithManoObra,
        iva,
        total
      };
    }

    const updatedQuotation = await Quotation.findByIdAndUpdate(
      quotationId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedQuotation) {
      return res.status(404).json({ 
        error: 'Cotización no encontrada' 
      });
    }

    console.log('✅ Cotización actualizada exitosamente');
    res.json(updatedQuotation);

  } catch (error) {
    console.error('❌ Error al actualizar cotización:', error);
    res.status(500).json({ 
      error: 'Error del servidor',
      message: error.message 
    });
  }
});

// Obtener todas las cotizaciones
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = status ? { status } : {};

    const quotations = await Quotation.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Quotation.countDocuments(query);

    res.json({
      quotations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener una cotización por ID
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de cotización
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!quotation) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Actualizar cotización completa (PUT)
router.put('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quotation) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json(quotation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar cotización
router.delete('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    if (!quotation) {
      return res.status(404).json({ error: 'Cotización no encontrada' });
    }
    res.json({ message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estadísticas
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Quotation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$total' }
        }
      }
    ]);

    const totalQuotations = await Quotation.countDocuments();
    const totalValue = await Quotation.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      totalQuotations,
      totalValue: totalValue[0]?.total || 0,
      byStatus: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;