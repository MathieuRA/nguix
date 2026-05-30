import fs from "node:fs/promises";

export class Vhost {
    private readonly path: string
    private readonly symlink: boolean
    private readonly filename: string

    static async fromPath(path: string) {
        const stat = await fs.lstat(path)

        return new Vhost({ path, symlink: stat.isSymbolicLink() })
    }

    constructor(params: { path: string, symlink: boolean }) {
        this.path = Object.freeze(params.path)
        this.symlink = Object.freeze(params.symlink)
        this.filename = Object.freeze(params.path.split('/').pop() ?? '_unknown_')
    }

    get filePath() {
        return this.path
    }

    get isSymlink() {
        return this.symlink
    }

    get fileName() {
        return this.filename
    }

    private async readContent() {
        return fs.readFile(this.isSymlink ? await this.linkTo() : this.path, 'utf8')
    }

    private parseConf(content: string) {
        const serverName = content.match(/server_name\s+([^;]+);/)?.[1].trim().split(/\s+/) ?? [];

        const domain = serverName[0]
        const aliases = serverName.slice(1);

        const listenMatch = content.match(/listen\s+(\d+)/);
        const port = listenMatch ? parseInt(listenMatch[1], 10) : 80;

        const ssl = /ssl_certificate\s+/.test(content);
        const sslExpiry = undefined; // TODO: parse from cert via openssl

        const proxyMatch = content.match(/proxy_pass\s+([^;]+);/);
        const proxy = proxyMatch?.[1].trim();

        return { domain, aliases, port, ssl, sslExpiry, proxy, file: this.fileName };
    }

    /**
     * If is a symlink, return the conf of the original file
     */
    async getConf() {
        const content = await this.readContent()
        const conf = this.parseConf(content)

        return conf
    }

    linkTo() {
        return fs.readlink(this.path)
    }


}