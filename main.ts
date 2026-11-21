// main.ts — Mothlight entrypoint: copies game/ + screenshots/ into the output
// directory and writes dossier.json with the kit's buildDossier helper.
// The output directory itself is NEVER removed (on the grader it is a mount
// point); only its contents are emptied before the fresh copy.
import { buildDossier } from './vendor/makefun-game.ts';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function emptyContents(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(dir)) {
    const target = path.join(dir, entry);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
      fs.chmodSync(to, 0o644);
    }
  }
}

emptyContents(outputDir);
copyDir(path.join(repoRoot, 'game'), path.join(outputDir, 'game'));
copyDir(path.join(repoRoot, 'screenshots'), path.join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
const dossierPath = path.join(outputDir, 'dossier.json');
fs.writeFileSync(dossierPath, dossier);

// Sanity check the hand-in before reporting success: the game must open
// (index.html present) and the dossier must be non-empty.
if (!fs.existsSync(path.join(outputDir, 'game', 'index.html'))) {
  throw new Error('mothlight: output is missing game/index.html');
}
if (fs.statSync(dossierPath).size === 0 || dossier.length === 0) {
  throw new Error('mothlight: dossier.json is empty');
}

const gameFiles = fs.readdirSync(path.join(outputDir, 'game'), { recursive: true }).length;
const shots = fs.readdirSync(path.join(outputDir, 'screenshots')).length;
console.log(`mothlight: wrote ${gameFiles} game entries + ${shots} screenshots + dossier.json (${dossier.length} bytes) to ${outputDir}`);
