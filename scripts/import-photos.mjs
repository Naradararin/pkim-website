// Copy job photos into the repo at web size.
// Usage: node scripts/import-photos.mjs "<source folder>"
// The source folder holds one sub-folder per job (any depth), and each job's
// "folder" in src/data/portfolio.json names that sub-folder.
// Photos are sorted by file name, resized to max 2000px on the long edge and
// saved as src/assets/portfolio/<id>/01.jpg, 02.jpg, ...
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src) { console.error("Usage: node scripts/import-photos.mjs <source folder>"); process.exit(1); }
const jobs = JSON.parse(fs.readFileSync("src/data/portfolio.json", "utf8")).jobs;
const dirs = new Map();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { dirs.set(e.name, path.join(d, e.name)); walk(path.join(d, e.name)); }
  }
})(src);

for (const job of jobs) {
  const from = dirs.get(job.folder);
  if (!from) { console.warn(`! ${job.id}: folder "${job.folder}" not found`); continue; }
  const files = fs.readdirSync(from).filter(f => /\.(jpe?g|png|webp|heic)$/i.test(f)).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const out = path.join("src/assets/portfolio", job.id);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const [i, f] of files.entries()) {
    await sharp(path.join(from, f)).rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(out, String(i + 1).padStart(2, "0") + ".jpg"));
  }
  console.log(`${job.id}: ${files.length} photos`);
}
