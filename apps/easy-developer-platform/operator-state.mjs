import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const STATES = Object.freeze(['QUEUED','RUNNING','WAITING_APPROVAL','VERIFIED','FAILED','BLOCKED']);

export function createTask(goal, metadata={}) {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), goal: String(goal || '').trim(), status: 'QUEUED', attempts: 0, createdAt: now, updatedAt: now, metadata, evidence: [], result: null };
}

export async function loadState(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return { version: 1, tasks: [] }; throw error; }
}

export async function saveState(file, state) {
  await mkdir(dirname(file), { recursive: true });
  const next = { ...state, version: 1, updatedAt: new Date().toISOString() };
  await writeFile(file, JSON.stringify(next, null, 2) + '\n', 'utf8');
  return next;
}

export async function enqueue(file, task) {
  const state = await loadState(file);
  state.tasks.push(task);
  await saveState(file, state);
  return task;
}

export async function updateTask(file, id, patch) {
  const state = await loadState(file);
  const task = state.tasks.find(item => item.id === id);
  if (!task) throw new Error('task_not_found');
  Object.assign(task, patch, { updatedAt: new Date().toISOString() });
  await saveState(file, state);
  return task;
}

export async function nextRunnable(file) {
  const state = await loadState(file);
  return state.tasks.find(task => task.status === 'QUEUED') || null;
}
