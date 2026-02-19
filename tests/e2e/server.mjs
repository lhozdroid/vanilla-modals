import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = 4173;
const ROOT = normalize(join(process.cwd(), 'tests/e2e/fixtures'));
const DIST = normalize(join(process.cwd(), 'dist'));
const DEMO = normalize(join(process.cwd(), 'demo'));

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

/**
 * Resolves a request pathname to one fixture or dist file.
 *
 * @param {string} pathname
 * @returns {{ file: string, base: string } | null}
 */
function resolveFile(pathname) {
    const requested = pathname === '/' ? '/index.html' : pathname;

    if (requested.startsWith('/dist/')) {
        const file = normalize(join(DIST, requested.slice('/dist/'.length)));
        return file.startsWith(DIST) ? { file, base: DIST } : null;
    }

    if (requested.startsWith('/demo/')) {
        const file = normalize(join(DEMO, requested.slice('/demo/'.length)));
        return file.startsWith(DEMO) ? { file, base: DEMO } : null;
    }

    const file = normalize(join(ROOT, requested));
    return file.startsWith(ROOT) ? { file, base: ROOT } : null;
}

const server = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
    const resolved = resolveFile(url.pathname);

    if (!resolved) {
        res.writeHead(404).end('Not Found');
        return;
    }

    stat(resolved.file)
        .then(() => readFile(resolved.file))
        .then((body) => {
            const ext = extname(resolved.file);
            const type = MIME[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': type });
            res.end(body);
        })
        .catch(() => {
            res.writeHead(404).end('Not Found');
        });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`E2E fixture server running at http://127.0.0.1:${PORT}`);
});
