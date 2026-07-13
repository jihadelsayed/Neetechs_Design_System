import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT ?? 4173);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', `http://localhost:${port}`).pathname);
  const requested = pathname === '/' ? '/tests/accessibility/gallery.html' : pathname;
  const file = normalize(join(root, requested));

  if (relative(root, file).startsWith('..')) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  const metadata = await stat(file).catch(() => null);
  if (!metadata?.isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-store');
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Accessibility gallery: http://127.0.0.1:${port}`);
});
