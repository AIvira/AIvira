import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'sessions.json');

async function readAll() {
  try {
    const raw = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeAll(sessions) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(sessions, null, 2));
}

export async function createSession({ topic, level, plan }) {
  const sessions = await readAll();
  const session = {
    id: randomUUID(),
    topic,
    level,
    plan,
    currentChapterIndex: 0,
    difficulty: level === 'débutant' ? 1 : level === 'intermédiaire' ? 2 : 3,
    completedExercises: [],
    coachingDecisions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  sessions[session.id] = session;
  await writeAll(sessions);
  return session;
}

export async function getSession(sessionId) {
  const sessions = await readAll();
  return sessions[sessionId] || null;
}

export async function saveSession(session) {
  const sessions = await readAll();
  session.updatedAt = new Date().toISOString();
  sessions[session.id] = session;
  await writeAll(sessions);
  return session;
}

export function buildAnalytics(session) {
  const scores = session.completedExercises.map((item) => item.evaluation.score);
  const averageScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const completedChapterIds = new Set(session.completedExercises.filter((item) => item.evaluation.score >= 7).map((item) => item.chapter.id));
  const chaptersCompleted = completedChapterIds.size;
  const masteryPercentage = Math.round((averageScore / 10) * 100);
  const progressionTrend = scores.length < 2 ? 'stable' : scores.at(-1) > scores.at(-2) ? 'up' : scores.at(-1) < scores.at(-2) ? 'down' : 'stable';
  return { masteryPercentage, chaptersCompleted, averageScore: Number(averageScore.toFixed(1)), progressionTrend };
}
