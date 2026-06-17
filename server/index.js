import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLearningPlan } from './agents/learningPlanner.js';
import { generateExercise } from './agents/exerciseGenerator.js';
import { evaluateAnswer } from './agents/evaluator.js';
import { coachSession } from './agents/pedagogicalCoach.js';
import { buildAnalytics, createSession, getSession, saveSession } from './storage/sessionStore.js';

const port = process.env.PORT || 3000;
const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' };

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
function send(res, status, data) { res.writeHead(status, { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type' }); res.end(JSON.stringify(data)); }
function requireSession(session) { if (!session) { const e = new Error('Session introuvable'); e.status = 404; throw e; } }

async function routeApi(req, res) {
  const body = await readJson(req);
  if (req.url === '/api/plan' && req.method === 'POST') {
    if (!body.topic?.trim()) return send(res, 400, { error: 'Le sujet est obligatoire.' });
    const plan = createLearningPlan({ topic: body.topic, level: body.level || 'débutant' });
    const session = await createSession({ topic: body.topic.trim(), level: body.level || 'débutant', plan });
    return send(res, 200, { sessionId: session.id, plan, analytics: buildAnalytics(session), session });
  }
  const session = await getSession(body.sessionId);
  requireSession(session);
  if (req.url === '/api/exercise' && req.method === 'POST') {
    const exercise = generateExercise({ session });
    session.pendingExercise = exercise;
    await saveSession(session);
    return send(res, 200, { exercise, session, analytics: buildAnalytics(session) });
  }
  if (req.url === '/api/evaluate' && req.method === 'POST') {
    if (!session.pendingExercise) return send(res, 400, { error: 'Aucun exercice en attente.' });
    const evaluation = evaluateAnswer({ exercise: session.pendingExercise, answer: body.answer || '' });
    session.completedExercises.push({ exercise: session.pendingExercise.exercise, chapter: session.pendingExercise.chapter, difficulty: session.pendingExercise.difficulty, answer: body.answer || '', evaluation, completedAt: new Date().toISOString() });
    session.pendingExercise = null;
    await saveSession(session);
    return send(res, 200, { evaluation, session, analytics: buildAnalytics(session) });
  }
  if (req.url === '/api/coach' && req.method === 'POST') {
    const decision = coachSession({ session });
    session.coachingDecisions.push({ ...decision, createdAt: new Date().toISOString() });
    session.currentChapterIndex = decision.nextChapter;
    session.difficulty = decision.nextDifficulty;
    await saveSession(session);
    return send(res, 200, { decision, session, analytics: buildAnalytics(session) });
  }
  return send(res, 404, { error: 'Route API introuvable' });
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname);
  const filePath = urlPath === '/' ? path.join(rootDir, 'index.html') : path.join(publicDir, urlPath);
  const safePath = path.normalize(filePath);
  if (!safePath.startsWith(publicDir) && safePath !== path.join(rootDir, 'index.html')) return send(res, 403, { error: 'Accès refusé' });
  try { const data = await fs.readFile(safePath); res.writeHead(200, { 'Content-Type': mime[path.extname(safePath)] || 'application/octet-stream' }); res.end(data); }
  catch { const data = await fs.readFile(path.join(rootDir, 'index.html')); res.writeHead(200, { 'Content-Type': mime['.html'] }); res.end(data); }
}

http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (req.url.startsWith('/api/')) return routeApi(req, res);
    return serveStatic(req, res);
  } catch (error) { return send(res, error.status || 500, { error: error.message || 'Erreur serveur' }); }
}).listen(port, () => console.log(`Epistudy running on port ${port}`));
