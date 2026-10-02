// Loads TypeScript source files from src/ so tests exercise the real app code
// (not a copy of it). Resolves the "@/..." path alias and relative imports.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const cache = new Map();

function resolveSource(absPath) {
  for (const candidate of [absPath, `${absPath}.ts`, `${absPath}.tsx`, path.join(absPath, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Cannot resolve ${absPath}`);
}

function loadFile(file) {
  if (cache.has(file)) return cache.get(file).exports;

  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;

  const mod = { exports: {} };
  cache.set(file, mod);
  const localRequire = (id) => {
    if (id.startsWith('@/')) return loadFile(resolveSource(path.join(ROOT, 'src', id.slice(2))));
    if (id.startsWith('.')) return loadFile(resolveSource(path.resolve(path.dirname(file), id)));
    return require(id);
  };
  new Function('module', 'exports', 'require', output)(mod, mod.exports, localRequire);
  return mod.exports;
}

/** Load a module by path relative to the project root, e.g. loadTs('src/data/mockLeagueData.ts'). */
export function loadTs(relativePath) {
  return loadFile(resolveSource(path.join(ROOT, relativePath)));
}
