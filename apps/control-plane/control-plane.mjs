#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY = resolve(HERE, 'project-registry.json');
const WRITE_ACTIONS = new Set(['write', 'merge', 'deploy', 'delete', 'rotate-secret', 'production-mutation']);

export async function loadRegistry(path = REGISTRY) {
  const raw = await readFile(path, 'utf8');
  const registry = JSON.parse(raw);
  validateRegistry(registry);
  return registry;
}

export function validateRegistry(registry) {
  if (!registry || registry.version !== 1 || registry.controlPlane !== 'chatgpt') throw new Error('invalid_control_plane_registry');
  if (!registry.orchestratorRepository) throw new Error('orchestrator_repository_required');
  const projects = registry.projects;
  if (!projects || typeof projects !== 'object') throw new Error('projects_required');
  const repositories = new Set();
  for (const [name, project] of Object.entries(projects)) {
    if (!project.repository || !project.role || !Array.isArray(project.allowed)) throw new Error(`invalid_project:${name}`);
    if (repositories.has(project.repository)) throw new Error(`duplicate_repository:${project.repository}`);
    repositories.add(project.repository);
    if (project.writePolicy !== 'pull-request-only') throw new Error(`unsafe_write_policy:${name}`);
  }
  if (!Array.isArray(registry.invariants) || !registry.invariants.includes('projects_remain_separate')) throw new Error('project_boundary_invariant_required');
  return true;
}

export function authorize(registry, projectName, action, { approved = false, connectorAvailable = true } = {}) {
  const project = registry.projects?.[projectName];
  if (!project) return { ok: false, reason: 'unknown_project' };
  if (!connectorAvailable) return { ok: false, reason: 'connector_unavailable' };
  if (WRITE_ACTIONS.has(action)) return { ok: false, reason: approved ? 'write_requires_pr_workflow' : 'explicit_approval_required' };
  if (!project.allowed.includes(action)) return { ok: false, reason: 'action_not_allowed' };
  return { ok: true, project: projectName, repository: project.repository, action };
}

export function createTask(registry, projectName, goal, options = {}) {
  const text = String(goal || '').trim();
  if (!text) throw new Error('goal_required');
  const authorization = authorize(registry, projectName, options.action || 'read', options);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    project: projectName,
    repository: registry.projects?.[projectName]?.repository || null,
    goal: text,
    authorization,
    status: authorization.ok ? 'READY' : 'BLOCKED',
    evidenceRequired: true,
    completionClaimAllowed: false
  };
}

export async function health(path = REGISTRY) {
  const registry = await loadRegistry(path);
  return {
    status: 'READY',
    controlPlane: registry.controlPlane,
    projects: Object.keys(registry.projects),
    externalSystems: Object.fromEntries(Object.entries(registry.externalSystems || {}).map(([name, value]) => [name, { configured: Boolean(value?.connector), required: Boolean(value?.required) }])),
    invariants: registry.invariants
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  health().then((value) => console.log(JSON.stringify(value, null, 2))).catch((error) => {
    console.error(JSON.stringify({ status: 'FAILED', error: error.message }, null, 2));
    process.exitCode = 1;
  });
}
