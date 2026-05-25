import fs from 'node:fs/promises'
import path from 'node:path'
import type http from 'node:http'

const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css',
    '.js':   'text/javascript',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
}

export async function serveStatic(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    root: string
): Promise<boolean> {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let pathname = url.pathname

    if (pathname === '/' || !path.extname(pathname)) {
        pathname = '/index.html'
    }

    const resolvedRoot = path.resolve(root)
    const filePath = path.join(resolvedRoot, pathname)

    // prevent directory traversal
    if (!filePath.startsWith(resolvedRoot)) {
        res.writeHead(403).end()
        return true
    }

    let content: Buffer
    try {
        content = await fs.readFile(filePath)
    } catch {
        return false
    }

    const ext = path.extname(filePath)
    const contentType = MIME[ext] ?? 'application/octet-stream'

    res.writeHead(200, { 'content-type': contentType }).end(content)
    return true
}
