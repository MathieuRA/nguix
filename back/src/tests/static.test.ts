import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { serveStatic } from '../static.ts'

async function makeRoot(): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nguix-static-'))
    await fs.writeFile(path.join(dir, 'index.html'), '<html>hello</html>', 'utf8')
    await fs.writeFile(path.join(dir, 'style.css'), 'body {}', 'utf8')
    return dir
}

function fakeReq(url: string): http.IncomingMessage {
    return { url } as http.IncomingMessage
}

function fakeRes(): http.ServerResponse & { _status: number, _headers: Record<string, string>, _body: Buffer[] } {
    const chunks: Buffer[] = []
    const headers: Record<string, string> = {}
    let status = 0

    return {
        _body: chunks,
        _headers: headers,
        get _status() { return status },
        writeHead(s: number, h?: Record<string, string>) {
            status = s
            if (h) Object.assign(headers, h)
            return this
        },
        end(chunk?: Buffer | string) {
            if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            return this
        },
        headersSent: false,
    } as unknown as http.ServerResponse & { _status: number, _headers: Record<string, string>, _body: Buffer[] }
}

test('serves index.html for /', async () => {
    const root = await makeRoot()
    const req = fakeReq('/')
    const res = fakeRes()
    const served = await serveStatic(req, res, root)
    assert.equal(served, true)
    assert.equal((res as any)._status, 200)
    assert.equal((res as any)._headers['content-type'], 'text/html; charset=utf-8')
})

test('serves index.html for path without extension', async () => {
    const root = await makeRoot()
    const req = fakeReq('/vhosts')
    const res = fakeRes()
    const served = await serveStatic(req, res, root)
    assert.equal(served, true)
    assert.equal((res as any)._status, 200)
})

test('serves css with correct mime type', async () => {
    const root = await makeRoot()
    const req = fakeReq('/style.css')
    const res = fakeRes()
    await serveStatic(req, res, root)
    assert.equal((res as any)._headers['content-type'], 'text/css')
})

test('returns false for missing file', async () => {
    const root = await makeRoot()
    const req = fakeReq('/not-found.js')
    const res = fakeRes()
    const served = await serveStatic(req, res, root)
    assert.equal(served, false)
})

test('traversal attempt is neutralized by URL normalization', async () => {
    const root = await makeRoot()
    // new URL normalizes /../../etc/passwd.conf -> /etc/passwd.conf
    // path.join then resolves to resolvedRoot/etc/passwd.conf which doesn't exist
    const req = fakeReq('/../../etc/passwd.conf')
    const res = fakeRes()
    const served = await serveStatic(req, res, root)
    assert.equal(served, false)
})
