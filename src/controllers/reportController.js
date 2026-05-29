import prisma from '../lib/prisma.js';
import { publishEvent } from '../publisher.js';
import publisher from '../publisher.js';
import { getCache, setCache, invalidateCache } from '../utils/cache.js';

export const getAllReports = async (req, res) => {
  try {
    const { tipoDano, estado, page = 1, limit = 5 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const cacheKey = `list:${JSON.stringify({ tipoDano, estado, page: pageNum, limit: limitNum })}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const where = {};

    if (tipoDano) {
      where.tipoDano = { contains: tipoDano, mode: 'insensitive' };
    }

    if (estado) {
      where.estado = estado;
    }

    const [data, totalItems] = await Promise.all([
      prisma.reporte.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          autor: {
            select: { id: true, nombre: true, email: true, rol: true },
          },
        },
        orderBy: { creadoEn: 'desc' },
      }),
      prisma.reporte.count({ where }),
    ]);

    const response = {
      success: true,
      data,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
      },
    };

    await setCache(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `detail:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const report = await prisma.reporte.findUnique({
      where: { id: parseInt(id) },
      include: {
        autor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: `Reporte con ID ${id} no encontrado`,
      });
    }

    const response = {
      success: true,
      data: report,
    };

    await setCache(cacheKey, response);

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const createReport = async (req, res) => {
  try {
    const { tipoDano, descripcion, ubicacion } = req.body;

    if (!tipoDano || !descripcion || !ubicacion) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: tipoDano, descripcion, ubicacion',
      });
    }

    const autorId = req.usuario.id;

    const report = await prisma.reporte.create({
      data: {
        tipoDano,
        descripcion,
        ubicacion,
        estado: 'PENDIENTE',
        autorId,
      },
      include: {
        autor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
      },
    });

    await invalidateCache();

    await publishEvent('campus:reporte:nuevo', 'REPORTE_NUEVO', {
      reporteId: report.id,
      tipoDano: report.tipoDano,
      descripcion: report.descripcion,
      ubicacion: report.ubicacion,
      estado: report.estado,
    });

    res.status(201).json({
      success: true,
      message: 'Reporte de daño creado exitosamente',
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'Campo requerido: estado',
      });
    }

    const validEstados = ['PENDIENTE', 'EN_PROCESO', 'RESUELTO'];
    if (!validEstados.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Valores válidos: ${validEstados.join(', ')}`,
      });
    }

    const existing = await prisma.reporte.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Reporte con ID ${id} no encontrado`,
      });
    }

    const updated = await prisma.reporte.update({
      where: { id: parseInt(id) },
      data: { estado },
      include: {
        autor: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
      },
    });

    await invalidateCache();
    await publisher.del(`reports:detail:${id}`);

    await publishEvent('campus:estado:actualizado', 'ESTADO_ACTUALIZADO', {
      reporteId: updated.id,
      tipoDano: updated.tipoDano,
      estadoAnterior: existing.estado,
      estadoNuevo: updated.estado,
      actualizadoPor: req.usuario.nombre,
    });

    res.status(200).json({
      success: true,
      message: 'Estado del reporte actualizado exitosamente',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.reporte.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Reporte con ID ${id} no encontrado`,
      });
    }

    await prisma.reporte.delete({
      where: { id: parseInt(id) },
    });

    await invalidateCache();
    await publisher.del(`reports:detail:${id}`);

    res.status(200).json({
      success: true,
      message: `Reporte con ID ${id} eliminado exitosamente`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error capturado:', err.message);

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
