export function normalizeSubtasks(input) {
  const raw = Array.isArray(input?.subtasks) ? input.subtasks : [];
  return raw.slice(0, 16).map((task, index) => ({ id: String(task.id || `task-${index + 1}`), goal: String(task.goal || '').trim(), dependsOn: Array.isArray(task.dependsOn) ? task.dependsOn.map(String) : [] })).filter(task => task.goal);
}

export function topologicalSubtasks(subtasks) {
  const byId = new Map(subtasks.map(task => [task.id, task]));
  const output = [], visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error(`subtask_dependency_cycle:${id}`);
    visiting.add(id);
    const task = byId.get(id); if (!task) throw new Error(`missing_subtask_dependency:${id}`);
    for (const dep of task.dependsOn) visit(dep);
    visiting.delete(id); visited.add(id); output.push(task);
  }
  for (const task of subtasks) visit(task.id);
  return output;
}
