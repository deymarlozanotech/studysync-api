/**
 * =====================================================
 * STUDY SESSIONS CONTROLLER - StudySync API
 * =====================================================
 * 
 * Este controlador implementa el CRUD completo para la entidad StudySession.
 * Utiliza un arreglo en memoria para la persistencia de datos (sin base de datos).
 * 
 * ARQUITECTURA MVC (Model-View-Controller):
 * - Este archivo representa el 'Controller': maneja la lógica de negocio
 * - Las rutas (sessionRoutes.js) definen los endpoints y delegan al controlador
 * - El modelo de datos se representa mediante la estructura de cada sesión
 * 
 * CÓDIGOS DE ESTADO HTTP UTILIZADOS:
 * - 200 OK: Solicitud exitosa (GET, PUT, DELETE)
 * - 201 Created: Recurso creado exitosamente (POST)
 * - 400 Bad Request: Error del cliente (validación fallida)
 * - 404 Not Found: Recurso no encontrado (ID no existe)
 * =====================================================
 */

import { publishEvent } from '../publisher.js';

// Arreglo en memoria para persistencia de sesiones de estudio
// Simula una base de datos sin necesidad de configuración adicional
const sessions = [];

// ID automático para cada nueva sesión (simula autoincremento de BD)
let idCounter = 1;

/**
 * GET /sessions - Obtener todas las sesiones con filtros y paginación
 * 
 * Parámetros de query:
 * - subject: filtrar por materia (ej: ?subject=Matemáticas)
 * - topic: filtrar por tema (ej: ?topic=Álgebra)
 * - page: número de página (ej: ?page=1)
 * - limit: elementos por página (ej: ?limit=5)
 * 
 * CÓDIGO DE RESPUESTA: 200 OK
 * Se usa 200 porque la solicitud fue exitosa y retornamos los datos
 */
export const getAllSessions = (req, res) => {
  try {
    // Extraer parámetros de query para filtrado y paginación
    const { subject, topic, page = 1, limit = 5 } = req.query;

    // Aplicar filtros si se proporcionan
    // Si subject o topic existen, filtramos el arreglo
    let filteredSessions = sessions;

    if (subject) {
      // Filtramos por materia (comparación case-insensitive)
      filteredSessions = filteredSessions.filter(
        s => s.subject.toLowerCase() === subject.toLowerCase()
      );
    }

    if (topic) {
      // Filtramos por tema (comparación case-insensitive)
      filteredSessions = filteredSessions.filter(
        s => s.topic.toLowerCase().includes(topic.toLowerCase())
      );
    }

    // Calcular paginación
    // Convertimos a número para operaciones aritméticas
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;

    // Obtener los elementos de la página actual
    // slice() retorna un nuevo arreglo con los elementos del rango
    const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

    // Responder con estado 200: exitosa
    // Incluimos metadatos de paginación para que el cliente pueda navegar
    res.status(200).json({
      success: true,
      data: paginatedSessions,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: filteredSessions.length,
        totalPages: Math.ceil(filteredSessions.length / limitNum)
      }
    });
  } catch (error) {
    // Manejo de errores inesperados
    // El middleware de error global capturará este error
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

/**
 * GET /sessions/:id - Obtener una sesión por ID
 * 
 * CÓDIGOS DE RESPUESTA:
 * - 200 OK: Sesión encontrada
 * - 404 Not Found: El ID no existe en nuestro arreglo
 */
export const getSessionById = (req, res) => {
  try {
    // Extraer el ID de los parámetros de la ruta
    const { id } = req.params;

    // Buscar la sesión en el arreglo
    // find() retorna undefined si no encuentra coincidencia
    const session = sessions.find(s => s.id === parseInt(id));

    if (!session) {
      // CÓDIGO 404: Recurso no encontrado
      // El cliente solicitó un recurso que no existe en el sistema
      return res.status(404).json({
        success: false,
        message: `Sesión con ID ${id} no encontrada`
      });
    }

    // CÓDIGO 200: Sesión encontrada exitosamente
    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

/**
 * POST /sessions - Crear una nueva sesión de estudio
 * 
 * CÓDIGOS DE RESPUESTA:
 * - 201 Created: Sesión creada exitosamente
 * - 400 Bad Request: Faltan campos requeridos o datos inválidos
 */
export const createSession = async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const { subject, topic, scheduledDate, duration, location } = req.body;

    // VALIDACIÓN: Verificar campos requeridos
    // Si falta algún campo obligatorio, respondemos con 400
    if (!subject || !topic || !scheduledDate || !duration || !location) {
      // CÓDIGO 400: Error de validación del cliente
      // El cliente envió datos incompletos o incorrectos
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos: subject, topic, scheduledDate, duration, location'
      });
    }

    // Validar que duration sea un número positivo
    if (typeof duration !== 'number' || duration <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El campo duration debe ser un número positivo'
      });
    }

    // Crear nuevo objeto de sesión
    // Asignamos un ID único autoincremental
    const newSession = {
      id: idCounter++,
      subject,
      topic,
      scheduledDate,
      duration,
      location,
      // Campo adicional para tracking
      createdAt: new Date().toISOString()
    };

    // Agregar al arreglo en memoria
    sessions.push(newSession);

    // Publicar evento Redis
    await publishEvent('study:session:created', 'SESSION_CREATED', {
      sessionId: newSession.id,
      subject: newSession.subject,
      topic: newSession.topic,
      scheduledDate: newSession.scheduledDate,
      duration: newSession.duration,
      location: newSession.location,
    });

    // CÓDIGO 201: Recurso creado exitosamente
    // 201 es el código apropiado para indicar que se ha creado un nuevo recurso
    res.status(201).json({
      success: true,
      message: 'Sesión de estudio creada exitosamente',
      data: newSession
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

/**
 * PUT /sessions/:id - Actualizar una sesión existente
 * 
 * CÓDIGOS DE RESPUESTA:
 * - 200 OK: Sesión actualizada exitosamente
 * - 400 Bad Request: Datos inválidos
 * - 404 Not Found: El ID no existe
 */
export const updateSession = (req, res) => {
  try {
    const { id } = req.params;
    const { subject, topic, scheduledDate, duration, location } = req.body;

    // Buscar el índice de la sesión a actualizar
    const sessionIndex = sessions.findIndex(s => s.id === parseInt(id));

    if (sessionIndex === -1) {
      // CÓDIGO 404: La sesión no existe
      return res.status(404).json({
        success: false,
        message: `Sesión con ID ${id} no encontrada`
      });
    }

    // VALIDACIÓN: Verificar que al menos un campo sea proporcionado
    if (!subject && !topic && !scheduledDate && !duration && !location) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    // Validar duration si se proporciona
    if (duration !== undefined && (typeof duration !== 'number' || duration <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'El campo duration debe ser un número positivo'
      });
    }

    // Actualizar la sesión manteniendo el ID original
    // Usamos el operador spread para mezclar datos existentes con nuevos
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...(subject && { subject }),
      ...(topic && { topic }),
      ...(scheduledDate && { scheduledDate }),
      ...(duration && { duration }),
      ...(location && { location }),
      updatedAt: new Date().toISOString()
    };

    // CÓDIGO 200: Actualización exitosa
    res.status(200).json({
      success: true,
      message: 'Sesión de estudio actualizada exitosamente',
      data: sessions[sessionIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

/**
 * DELETE /sessions/:id - Eliminar una sesión
 * 
 * CÓDIGOS DE RESPUESTA:
 * - 200 OK: Sesión eliminada exitosamente
 * - 404 Not Found: El ID no existe
 */
export const deleteSession = (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el índice de la sesión a eliminar
    const sessionIndex = sessions.findIndex(s => s.id === parseInt(id));

    if (sessionIndex === -1) {
      // CÓDIGO 404: La sesión no existe
      return res.status(404).json({
        success: false,
        message: `Sesión con ID ${id} no encontrada`
      });
    }

    // Eliminar la sesión del arreglo
    // splice() elimina el elemento en el índice especificado
    sessions.splice(sessionIndex, 1);

    // CÓDIGO 200: Eliminación exitosa
    res.status(200).json({
      success: true,
      message: `Sesión con ID ${id} eliminada exitosamente`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

export const joinEvent = async (req, res) => {
  const { usuario, grupo } = req.body;
  if (!usuario || !grupo) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos requeridos: usuario, grupo',
    });
  }

  await publishEvent('study:usuario:unido', 'USER_JOINED', {
    usuario,
    grupo,
    momento: new Date().toISOString(),
  });

  res.status(200).json({
    success: true,
    message: `Usuario ${usuario} unido al grupo ${grupo}`,
    data: { usuario, grupo },
  });
};

/**
 * Middleware de manejo de errores global
 * Este middleware se ejecuta cuando cualquier controlador lanza un error
 * 
 * CÓDIGO 500: Error interno del servidor
 * Se usa cuando ocurre un error inesperado en el servidor
 */
export const errorHandler = (err, req, res, next) => {
  // Registrar el error para debugging (en producción sería un logger)
  console.error('Error capturado:', err.message);

  // Responder con código 500: error interno del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};