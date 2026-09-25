import test from "node:test";
import assert from "node:assert/strict";
import { buildEvidenceGraph, getProjectSubgraph } from "./evidence-graph.mjs";

test("builds an immutable evidence chain", () => {
  const graph = buildEvidenceGraph({
    nodes: [
      { id: "h", project: "agent-skills", type: "hypothesis", label: "h" },
      { id: "e", project: "agent-skills", type: "experiment", label: "e" },
      { id: "v", project: "agent-skills", type: "evidence", label: "v" },
    ],
    edges: [
      { from: "h", to: "e", type: "tests" },
      { from: "e", to: "v", type: "supports" },
    ],
  });
  assert.equal(graph.schemaVersion, 1);
  assert.ok(Object.isFrozen(graph));
  assert.ok(Object.isFrozen(graph.nodes[0]));
});

test("cross-project evidence edges are rejected", () => {
  assert.throws(
    () => buildEvidenceGraph({
      nodes: [
        { id: "m", project: "MONY", type: "evidence", label: "m" },
        { id: "e", project: "EASY", type: "capability", label: "e" },
      ],
      edges: [{ from: "m", to: "e", type: "supports" }],
    }),
    /evidence_graph_cross_project_edge/,
  );
});

test("project subgraphs preserve isolation", () => {
  const graph = buildEvidenceGraph({
    nodes: [
      { id: "a", project: "agent-skills", type: "capability", label: "a" },
      { id: "b", project: "MONY", type: "capability", label: "b" },
    ],
  });
  const sub = getProjectSubgraph(graph, "MONY");
  assert.deepEqual(sub.nodes.map((n) => n.id), ["b"]);
  assert.equal(sub.edges.length, 0);
});
