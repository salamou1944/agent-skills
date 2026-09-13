import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.agents/skills');
const casesPath = path.resolve('eval/cases.json');
const outDir = path.resolve('eval');
const generatedDir = path.resolve('.agents/generated');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

function parseSkill(file) {
  const text = fs.readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { file, valid: false, reason: 'missing frontmatter' };
  const name = m[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = m[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name || !description) return { file, valid: false, reason: !name ? 'missing name' : 'missing description' };
  return { file, valid: true, name, description, text };
}

const skills = walk(root).filter((f) => path.basename(f) === 'SKILL.md').map(parseSkill);
const valid = skills.filter((s) => s.valid);
const invalid = skills.filter((s) => !s.valid);
const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')).cases;

// Inspect the complete skill contract, not only metadata, so acceptance criteria
// already present in procedures/safety sections are not reported as false gaps.
const corpus = valid.map((s) => `${s.name}\n${s.description}\n${s.text}`.toLowerCase()).join('\n');
const gaps = cases.filter((c) => !c.expect.every((term) => corpus.includes(term.toLowerCase())));

const report = {
  generatedAt: new Date().toISOString(),
  skillCount: valid.length,
  invalidSkillCount: invalid.length,
  invalidSkills: invalid.map((s) => ({ file: path.relative('.', s.file), reason: s.reason })),
  evaluationCaseCount: cases.length,
  detectedGaps: gaps.map((g) => ({ id: g.id, capability: g.capability, reason: 'No complete explicit inventory signal matched the case expectations' })),
  status: invalid.length === 0 && gaps.length === 0 ? 'pass' : 'fail'
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'self-improvement-report.json'), JSON.stringify(report, null, 2) + '\n');

if (gaps.length) {
  fs.mkdirSync(generatedDir, { recursive: true });
  for (const gap of gaps) {
    const slug = gap.capability.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    const candidate = `---\nname: generated-${slug}\ndescription: Candidate skill generated from an observed capability gap; requires benchmark and promotion before use.\n---\n# Generated Candidate\n\nOrigin case: ${gap.id}\n\nCapability gap: ${gap.capability}\n\nThis is a candidate specification only. Validate overlap, security, acceptance tests, and measurable improvement before promotion.\n`;
    fs.writeFileSync(path.join(generatedDir, `${slug}.SKILL.md`), candidate);
  }
}

console.log(JSON.stringify(report, null, 2));
if (report.status === 'fail') process.exit(1);
