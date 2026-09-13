#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const file = process.argv[2];
if (!file) {
  console.error('usage: node preflight.mjs <workflow.yml>');
  process.exit(2);
}
const text = await readFile(file, 'utf8');
const hasDispatch = /(^|\n)\s*workflow_dispatch\s*:/m.test(text);
if (!hasDispatch) {
  console.error('workflow_dispatch: missing');
  process.exit(1);
}
if (!/(^|\n)\s*jobs\s*:/m.test(text)) {
  console.error('jobs: missing');
  process.exit(1);
}
console.log(JSON.stringify({ok:true,workflowDispatch:true,file}, null, 2));
