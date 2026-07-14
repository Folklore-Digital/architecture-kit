import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

export type ServeSiteOptions = {
  siteDir: string;
  port: number;
  host?: string;
};

export function serveSite(options: ServeSiteOptions): Promise<{
  port: number;
  url: string;
  close: () => Promise<void>;
}> {
  const host = options.host ?? '127.0.0.1';

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent(
          (req.url ?? '/').split('?')[0] ?? '/',
        );
        const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
        let filePath = path.join(
          options.siteDir,
          safePath === '/' ? 'index.html' : safePath,
        );

        if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
          filePath = path.join(filePath, 'index.html');
        }

        const data = await readFile(filePath);
        const ext = path.extname(filePath);
        res.writeHead(200, {
          'Content-Type': MIME[ext] ?? 'application/octet-stream',
        });
        res.end(data);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
      }
    });

    server.on('error', reject);

    server.listen(options.port, host, () => {
      const address = server.address();
      const port =
        typeof address === 'object' && address ? address.port : options.port;
      const url = `http://${host}:${port}/`;
      resolve({
        port,
        url,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
              } else {
                closeResolve();
              }
            });
          }),
      });
    });
  });
}
