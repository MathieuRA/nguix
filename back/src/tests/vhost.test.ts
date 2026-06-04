import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { Vhost } from '../classes/vhost.ts'

async function writeTempConf(content: string): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nguix-test-'))
    const filePath = path.join(dir, 'test.conf')
    await fs.writeFile(filePath, content, 'utf8')
    return filePath
}

test('parses domain from server_name', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com;
            listen 80;
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.conf.domain, 'example.com')
})

test('parses aliases from server_name', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com www.example.com api.example.com;
            listen 80;
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.deepEqual(vhost.conf.aliases, ['www.example.com', 'api.example.com'])
})

test('parses listen port', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com;
            listen 8080;
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.conf.port, 8080)
})

test('defaults to port 80 when listen is missing', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com;
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.conf.port, 80)
})

test('ssl is false when no ssl_certificate directive', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com;
            listen 80;
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.conf.ssl, false)
})

test('parses proxy_pass', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com;
            listen 80;
            location / {
                proxy_pass http://127.0.0.1:3000;
            }
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.conf.proxy, 'http://127.0.0.1:3000')
})

test('proxy is undefined when no proxy_pass', async () => {
    const filePath = await writeTempConf(`
        server {
            server_name example.com;
            listen 80;
        }
    `)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.conf.proxy, undefined)
})

test('isSymlink is false for regular file', async () => {
    const filePath = await writeTempConf(`server { server_name example.com; }`)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.isSymlink, false)
})

test('isSymlink is true for symlink', async () => {
    const filePath = await writeTempConf(`server { server_name example.com; }`)
    const linkPath = filePath + '.link'
    await fs.symlink(filePath, linkPath)
    const vhost = await Vhost.fromPath(linkPath)
    assert.equal(vhost.isSymlink, true)
})

test('fileName returns the filename without directory', async () => {
    const filePath = await writeTempConf(`server { server_name example.com; }`)
    const vhost = await Vhost.fromPath(filePath)
    assert.equal(vhost.fileName, 'test.conf')
})
