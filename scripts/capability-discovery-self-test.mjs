#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = process.cwd();
const config = JSON.parse(await fs.readFile(path.join(root, 'config/capability-sources.json'), 'utf8'));

if (config.sources.length < 10) throw new Error('Expected at least 10 capability sources');
if (!config.sources.some(s => s.id === 'mcp-registry' && s.type === 'mcp')) throw new Error('Official MCP registry missing');
if (!config.sources.some(s => s.id === 'skills-sh' && s.type === 'skill')) throw new Error('skills.sh source missing');
if (!config.sources.some(s => s.id === 'skillsmp' && s.type === 'skill')) throw new Error('SkillsMP source missing');

await exec(process.execPath, ['--check', path.join(root, 'scripts/capability-discovery.mjs')]);

console.log('capability-discovery self-test: PASS');
