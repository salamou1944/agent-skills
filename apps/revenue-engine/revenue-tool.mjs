#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createEngine } from './revenue-engine.mjs';

const engine = createEngine({ mode: 'dry-run' });
const [command, file] = process.argv.slice(2);

async function input() {
  if (!file) throw new Error('input_file_required');
  return JSON.parse(await readFile(file, 'utf8'));
}

const data = await input();
let result;
if (command === 'discover') result = engine.discover(data);
else if (command === 'verify') result = engine.verify(data.opportunity, data.evidence);
else if (command === 'score') result = engine.score(data.opportunity, data.metrics);
else if (command === 'plan') result = engine.plan(data.opportunity);
else if (command === 'fanout') result = engine.fanOut(data.opportunity, data.plan);
else throw new Error('unknown_command');

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
