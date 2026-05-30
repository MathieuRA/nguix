import fs from "node:fs/promises";
import crypto from 'node:crypto'

type VhostConf = { domain: string, aliases: string[], port: number, ssl: boolean, sslExpiry?: Date, proxy?: string }

export class Vhost {
    static async fromPath(path: string) {
        const stat = await fs.lstat(path)
        const isSymbolicLink = stat.isSymbolicLink()
        const content = await fs.readFile(isSymbolicLink ? await fs.readlink(path) : path, 'utf8')

        const conf = await Vhost.parseConf(content)
        return new Vhost({ path, symlink: isSymbolicLink, conf })
    }

    private static async parseConf(content: string) {
        const serverName = content.match(/server_name\s+([^;]+);/)?.[1].trim().split(/\s+/) ?? []

        const domain = serverName[0]
        const aliases = serverName.slice(1)

        const listenMatch = content.match(/listen\s+(\d+)/)
        const port = listenMatch ? parseInt(listenMatch[1], 10) : 80

        const sslCertMatch = content.match(/ssl_certificate\s+([^;]+);/)
        const ssl = sslCertMatch !== null
        const sslCertPath = sslCertMatch?.[1].trim()
        let sslExpiry;
        if (sslCertPath !== undefined) {
            const pem = await fs.readFile(sslCertPath, 'utf8')
            const cert = new crypto.X509Certificate(pem)
            sslExpiry = new Date(cert.validTo)
        }

        const proxyMatch = content.match(/proxy_pass\s+([^;]+);/)
        const proxy = proxyMatch?.[1].trim();

        return { domain, aliases, port, ssl, sslExpiry, proxy };
    }

    private readonly _filePath: string
    private readonly _symlink: boolean
    private readonly _fileName: string
    private readonly _enabled: boolean
    private readonly _conf: VhostConf

    constructor(params: { path: string, symlink: boolean, conf: VhostConf }) {
        this._filePath = Object.freeze(params.path)
        this._symlink = Object.freeze(params.symlink)
        this._fileName = Object.freeze(params.path.split('/').pop() ?? '_unknown_')
        this._enabled = Object.freeze(this._symlink)
        this._conf = Object.freeze(params.conf)
    }

    get filePath() {
        return this._filePath
    }

    get isSymlink() {
        return this._symlink
    }

    get fileName() {
        return this._fileName
    }

    get enabled() {
        return this._enabled
    }

    /**
     * If is a symlink, return the conf of the original file
     */
    get conf() {
        return this._conf
    }

    linkTo() {
        return fs.readlink(this.filePath)
    }
}