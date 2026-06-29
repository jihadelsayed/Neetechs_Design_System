import { cp, mkdir, readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

const copyExtensions = new Set(['.css', '.md']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function shouldCopy(filePath) {
  return copyExtensions.has(extname(filePath));
}

async function copyFileToDist(filePath) {
  const relativePath = relative(srcDir, filePath);
  const targetPath = join(distDir, relativePath);

  await mkdir(join(targetPath, '..'), { recursive: true });
  await cp(filePath, targetPath);
}

async function copyAssets() {
  const srcExists = await stat(srcDir).catch(() => null);

  if (!srcExists) {
    throw new Error(`Missing source directory: ${srcDir}`);
  }

  const files = await walk(srcDir);
  const assetFiles = files.filter(shouldCopy);

  await Promise.all(assetFiles.map(copyFileToDist));
}

await copyAssets();