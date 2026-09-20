const NODE_TYPES = Object.freeze([
  "hypothesis",
  "experiment",
  "observation",
  "evidence",
  "failure",
  "root_cause",
  "repair",
  "regression_test",
  "capability",
  "reuse",
]);

const EDGE_TYPES = Object.freeze([
  "tests",
  "observes",
  "supports",
  "caused_by",
  "repairs",
  "prevents",
  "produces",
  "reuses",
  "supersedes",
]);

const PROJECTS = new Set(["Elite", "ARMY-14", "MONY", "EASY", "agent-skills"]);

function requireString(value, field) {
  if (!String(value || "").trim()) throw new Error(`evidence_graph_${field}_required`);
  return String(value);
}

function normalizeNode(node) {
  const project = requireString(node.project, "project");
  if (!PROJECTS.has(project)) throw new Error("evidence_graph_project_invalid");
  const type = requireString(node.type, "node_type").toLowerCase();
  if (!NODE_TYPES.includes(type)) throw new Error("evidence_graph_node_type_invalid");
  return Object.freeze({
    id: requireString(node.id, "node_id"),
    project,
    type,
    label: requireString(node.label, "label"),
    source: String(node.source || ""),
    timestamp: String(node.timestamp || new Date().toISOString()),
    metadata: Object.freeze({ ...(node.metadata || {}) }),
  });
}

function normalizeEdge(edge, nodesById) {
  const from = requireString(edge.from, "edge_from");
  const to = requireString(edge.to, "edge_to");
  const type = requireString(edge.type, "edge_type").toLowerCase();
  if (!EDGE_TYPES.includes(type)) throw new Error("evidence_graph_edge_type_invalid");
  const a = nodesById.get(from);
  const b = nodesById.get(to);
  if (!a || !b) throw new Error("evidence_graph_edge_endpoint_missing");
  if (a.project !== b.project) throw new Error("evidence_graph_cross_project_edge");
  return Object.freeze({ from, to, type });
}

export function buildEvidenceGraph({ nodes = [], edges = [] } = {}) {
  const normalizedNodes = nodes.map(normalizeNode);
  const ids = new Set();
  for (const node of normalizedNodes) {
    if (ids.has(node.id)) throw new Error("evidence_graph_duplicate_node");
    ids.add(node.id);
  }
  const nodesById = new Map(normalizedNodes.map((node) => [node.id, node]));
  const normalizedEdges = edges.map((edge) => normalizeEdge(edge, nodesById));
  return Object.freeze({
    schemaVersion: 1,
    nodes: Object.freeze(normalizedNodes),
    edges: Object.freeze(normalizedEdges),
  });
}

export function getProjectSubgraph(graph, project) {
  if (!PROJECTS.has(project)) throw new Error("evidence_graph_project_invalid");
  const nodes = graph.nodes.filter((node) => node.project === project);
  const ids = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  return buildEvidenceGraph({ nodes, edges });
}

export { NODE_TYPES, EDGE_TYPES, PROJECTS };
