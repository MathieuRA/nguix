import fs from "node:fs/promises"

const SITES_AVAILABLE = '/etc/nginx/site-available'
const SITES_ENABLED = '/etc/nginx/site-enable'

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
    const files = await fs.readdir(SITES_AVAILABLE)

    return Promise.all(files.map(async fileName => {
        const [isEnabled, file] = await Promise.all([
            fs.stat(`${SITES_ENABLED}/${fileName}`)
                .then(() => true)
                .catch(err => {
                    if (err.code === 'ENOENT') {
                        return false
                    }
                    throw err
                }),
            fs.readFile(`${SITES_AVAILABLE}/${fileName}`, 'utf8')
        ])
        return { ...parseConf(file), file: fileName, enabled: isEnabled }
    }))
}