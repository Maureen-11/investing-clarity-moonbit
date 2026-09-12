import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve(process.env.STATIC_ROOT ?? 'out');
const port = Number(process.env.PORT ?? 4188);
const basePath = process.env.BASE_PATH ?? '';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wasm': 'application/wasm',
};

function fileFor(pathname) {
  const decoded = decodeURIComponent(pathname);
  const withoutBase = basePath && decoded.startsWith(basePath) ? decoded.slice(basePath.length) || '/' : decoded;
  const route = withoutBase === '/' ? '/index.html' : withoutBase.endsWith('/') ? `${withoutBase}index.html` : withoutBase;
  const file = resolve(root, `.${route}`);
  if (!file.startsWith(root + sep) && file !== root) throw new Error('Forbidden path');
  return file;
}

createServer(async (request, response) => {
  try {
    const file = fileFor(new URL(request.url ?? '/', 'http://localhost').pathname);
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(contents);
  } catch (error) {
    response.writeHead(error.message === 'Forbidden path' ? 403 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error.message === 'Forbidden path' ? 'Forbidden' : 'Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Static web preview: http://127.0.0.1:${port}/`));
