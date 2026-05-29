import { app } from '../src/server.js';
import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import prisma from '../src/lib/prisma.js';

jest.setTimeout(30000);

let estudianteToken;
let testReportId;

const testEmail = `test_${Date.now()}@estudiante.com`;
const testPassword = 'password123';

beforeAll(async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: testEmail,
      password: testPassword,
      nombre: 'Test Estudiante',
      rol: 'ESTUDIANTE',
    });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: testEmail, password: testPassword });

  estudianteToken = loginRes.body.data?.token;
});

afterAll(async () => {
  await prisma.reporte.deleteMany({
    where: { autor: { email: testEmail } },
  });
  await prisma.usuario.deleteMany({
    where: { email: testEmail },
  });
  await prisma.$disconnect();
});

describe('Reportes API', () => {
  test('GET /api/reportes - debe retornar lista pública (200)', async () => {
    const res = await request(app).get('/api/reportes');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('POST /api/reportes - sin token debe retornar 401', async () => {
    const res = await request(app)
      .post('/api/reportes')
      .send({
        tipoDano: 'Luminaria fundida',
        descripcion: 'Foco del pasillo principal fundido',
        ubicacion: 'Aula 101',
      });

    expect(res.status).toBe(401);
  });

  test('POST /api/reportes - con token crea reporte (201)', async () => {
    if (!estudianteToken) throw new Error('No se obtuvo token');

    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${estudianteToken}`)
      .send({
        tipoDano: 'Luminaria fundida',
        descripcion: 'Foco del pasillo principal fundido',
        ubicacion: 'Aula 101',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tipoDano).toBe('Luminaria fundida');
    expect(res.body.data.estado).toBe('PENDIENTE');
    expect(res.body.data.autor).toBeDefined();
    expect(res.body.data.autor.rol).toBe('ESTUDIANTE');

    testReportId = res.body.data.id;
  });

  test('PUT /api/reportes/:id - ESTUDIANTE no puede actualizar estado (403)', async () => {
    if (!estudianteToken || !testReportId) return;

    const res = await request(app)
      .put(`/api/reportes/${testReportId}`)
      .set('Authorization', `Bearer ${estudianteToken}`)
      .send({ estado: 'EN_PROCESO' });

    expect(res.status).toBe(403);
  });

  test('DELETE /api/reportes/:id - ESTUDIANTE no puede eliminar (403)', async () => {
    if (!estudianteToken || !testReportId) return;

    const res = await request(app)
      .delete(`/api/reportes/${testReportId}`)
      .set('Authorization', `Bearer ${estudianteToken}`);

    expect(res.status).toBe(403);
  });

  test('Logout - token invalidado retorna 401', async () => {
    if (!estudianteToken) return;

    await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${estudianteToken}`);

    const res = await request(app)
      .post('/api/reportes')
      .set('Authorization', `Bearer ${estudianteToken}`)
      .send({
        tipoDano: 'Luminaria fundida',
        descripcion: 'Foco del pasillo principal fundido',
        ubicacion: 'Aula 101',
      });

    expect(res.status).toBe(401);
  });
});
