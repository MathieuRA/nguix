import fs from "node:fs/promises"

const SITES_AVAILABLE = '/etc/nginx/sites-available'
const SITES_ENABLED = '/etc/nginx/sites-enabled'

function parseConf(content: string) {
    const serverName = content.match(/server_name\s+([^;]+);/)?.[1].trim().split(/\s+/) ?? [];

    const domain = serverName[0]
    const aliases = serverName.slice(1);

    const listenMatch = content.match(/listen\s+(\d+)/);
    const port = listenMatch ? parseInt(listenMatch[1], 10) : 80;

    const ssl = /ssl_certificate\s+/.test(content);
    const sslExpiry = undefined; // TODO: parse from cert via openssl

    const proxyMatch = content.match(/proxy_pass\s+([^;]+);/);
    const proxy = proxyMatch?.[1].trim();

    return { domain, aliases, port, ssl, sslExpiry, proxy };
}

export async function getVirtualHosts() {
    const availableSites = await fs.readdir(SITES_AVAILABLE)
    const enabledSites = await fs.readdir(SITES_ENABLED)

    const enabledConf: Record<string, boolean> = {}

    for (const fileName of enabledSites) {
        const path = `${SITES_ENABLED}/${fileName}`
        const fileStat = await fs.lstat(path)
        if (!fileStat.isSymbolicLink()) {
            console.log(`--- ${path} is not a symlink and get ignored ---`)
            continue
        }
        const linkTo = await fs.readlink(path)
        enabledConf[linkTo] = true
    }

    const confs = []
    for (const fileName of availableSites) {
        const path = `${SITES_AVAILABLE}/${fileName}`
        const isEnabled = enabledConf[path] ?? false
        delete enabledConf[path]

        const fileContent = await fs.readFile(path, 'utf-8')
        confs.push({ ...parseConf(fileContent), file: fileName, enabled: isEnabled })
    }

    if (Object.keys(enabledConf).length > 0) {
        console.log(`--- detected some conf not in ${SITES_AVAILABLE} directory. Going to parse them ---`)
        const paths = Object.keys(enabledConf)
        for (const filePath of paths) {
            console.log(`- ${filePath}`)
            delete enabledConf[filePath]
            const fileContent = await fs.readFile(filePath, 'utf8')
            confs.push({ ...parseConf(fileContent), file: filePath.split('/').pop(), enabled: true })
        }
    }

    return confs
}