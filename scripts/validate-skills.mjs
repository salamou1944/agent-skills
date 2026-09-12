#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = '.agents/skills';
const findings = [];
const textExtensions = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.sh', '.py', '.toml']);

function add(path, message) { findings.push(`${path}: ${message}`); }

function inspectText(path, text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const lower = normalized.toLowerCase();
  if (/-----begin (rsa |ec |openssh )?private key-----/i.test(normalized)) add(path, 'private key material detected');
  if (/\bAKIA[0-9A-Z]{16}\b/.test(normalized)) add(path, 'AWS access-key pattern detected');
  if (/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/.test(normalized)) add(path, 'GitHub token pattern detected');
  if (/\b(xox[baprs]-[A-Za-z0-9-]{20,})\b/.test(normalized)) add(path, 'Slack token pattern detected');
  const dangerous = [
    [/\b(?:child_process\.)?(?:exec|execFile|spawn|fork)\s*\(/i, 'process execution API detected'],
    [/\b(?:rm\s+-rf|mkfs\b|dd\s+if=|chmod\s+777)\b/i, 'destructive shell command detected'],
    [/\b(?:curl|wget)\s+[^\n]*(?:\||;|&&)\s*(?:sh|bash|zsh|python|node)\b/i, 'download-and-execute pattern detected'],
    [/(?:https?:\/\/|ftp:\/\/)[^\s]+/i, 'network endpoint detected'],
    [/(?:process\.env|os\.environ|ENV\[)/i, 'environment/credential access pattern detected'],
    [/(?:eval\s*\(|new Function\s*\(|base64\s+-d|atob\s*\()/i, 'dynamic/encoded execution pattern detected'],
    [/(?:ignore|bypass|disable)\b.{0,100}\b(?:security|policy|approval|validation)\b/i, 'instruction attempting to weaken security controls detected'],
    [/(?:reveal|print|dump|send|upload|exfiltrat\w*)\b.{0,100}\b(?:secret|token|credential|password|api[_ -]?key)\b/i, 'credential disclosure/exfiltration instruction detected']
  ];
  for (const [pattern, message] of dangerous) if (pattern.test(normalized)) add(path, message);
  if (normalized.length > 50000) add(path, 'skill file is unusually large; review for hidden/irrelevant instructions');
  if (/\b(?:data|credential|secret|token)\b.{0,80}\b(?:paste|upload|send|post)\b/i.test(lower)) add(path, 'possible sensitive-data transfer instruction detected');
}

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    const rel = relative('.', path);
    if (entry.name === 'SKILL.md') {
      const text = await readFile(path, 'utf8');
      if (!text.startsWith('---\n')) add(rel, 'missing YAML frontmatter');
      const end = text.indexOf('\n---', 4);
      const front = end >= 0 ? text.slice(4, end) : '';
      if (!/^name:\s*[a-z0-9-]+$/m.test(front)) add(rel, 'invalid/missing name');
      if (!/^description:\s*.+$/m.test(front)) add(rel, 'missing description');
      inspectText(rel, text);
    } else {
      const extension = entry.name.includes('.') ? `.${entry.name.split('.').pop()}` : '';
      if (textExtensions.has(extension)) {
        const info = await stat(path);
        if (info.size <= 200000) inspectText(rel, await readFile(path, 'utf8'));
      }
    }
  }
}

await walk(root);
if (findings.length) { console.error('Skill security validation FAILED. Review these findings:'); console.error(findings.join('\n')); process.exit(1); }
console.log('Skill metadata and security baseline passed.');
