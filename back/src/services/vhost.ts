import fs from "node:fs/promises"
import path from "node:path"
import { Vhost } from "../classes/vhost.ts";
import { getEnv } from "../env.ts";
import { checkMainDirExist } from "../utils/dir.helper.ts";

const SITES_AVAILABLE = getEnv('SITES_AVAILABLE')
const SITES_ENABLED = getEnv('SITES_ENABLED')

export type CreateVhostInput = {
    domain: string
    aliases?: string[]
    port: number
    enabled: boolean
    root?: string
    proxy?: string
}

function normalizeAliases(aliases: string[] = []) {
    return Array.from(new Set(
        aliases
            .flatMap(alias => alias.split(','))
            .map(alias => alias.trim())
            .filter(Boolean)
            .map(alias => alias.replace(/^https?:\/\//, ''))
            .map(alias => alias.replace(/\/$/, ''))
    ))
}

function buildNginxConfig({ domain, aliases, port, root, proxy }: {
    domain: string
    aliases: string[]
    port: number
    root?: string
    proxy?: string
}) {
    const serverName = [domain, ...aliases].join(' ')
    const lines = [
        'server {',
        `    listen ${port};`,
        `    server_name ${serverName};`,
    ]

    if (root !== undefined) {
        lines.push(
            `    root ${root};`,
            '    index index.html index.htm;',
            '    location / {',
            '        try_files $uri $uri/ =404;',
            '    }',
        )
    } else if (proxy !== undefined) {
        lines.push(
            '    location / {',
            `        proxy_pass ${proxy};`,
            '        proxy_set_header Host $host;',
            '        proxy_set_header X-Real-IP $remote_addr;',
            '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
            '        proxy_set_header X-Forwarded-Proto $scheme;',
            '    }',
        )
    } else {
        throw new Error('either root or proxy must be set')
    }

    lines.push('}')
    return `${lines.join('\n')}\n`
}

export async function createVirtualHost(input: CreateVhostInput): Promise<Vhost> {
    const aliases = normalizeAliases(input.aliases)

    const fileName = `${input.domain.replace(/[^a-zA-Z0-9.-]/g, '_')}.conf`
    const filePath = path.join(SITES_AVAILABLE, fileName)

    await fs.access(filePath).then(() => {
        throw new Error(`vhost ${input.domain} already exists`)
    }).catch(error => {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
        }
    })

    const content = buildNginxConfig({ ...input, aliases })
    await fs.writeFile(filePath, content, 'utf8')

    const vhost = await Vhost.fromPath(filePath)
    if (input.enabled) {
        await vhost.update({ enabled: true })
    }

    return vhost
}

export async function getVirtualHosts(): Promise<Vhost[]> {
    if (!checkMainDirExist()) {
        return []
    }

    const sitesEnabled = await fs.readdir(SITES_ENABLED)
    const sitesAvailable = await fs.readdir(SITES_AVAILABLE)

    const confs: Vhost[] = []
    const parsedConfs = new Set()

    await Promise.all(sitesEnabled.map(async fileName => {
        const vhost = await Vhost.fromPath(`${SITES_ENABLED}/${fileName}`)
        if (!vhost.isSymlink) {
            console.log(`--- ${vhost.filePath} is not a symlink and get ignored ---`)
            return
        }

        const originalPath = await vhost.linkTo()
        parsedConfs.add(originalPath)

        confs.push(vhost)
    }))

    await Promise.all(sitesAvailable.map(async fileName => {
        const path = `${SITES_AVAILABLE}/${fileName}`
        if (parsedConfs.has(path)) {
            // already parsed by enabled path
            return
        }

        const vhost = await Vhost.fromPath(path)
        confs.push(vhost)
    }))

    return confs
}

export async function getVirtualHost(id: Vhost['id']): Promise<Awaited<ReturnType<typeof getVirtualHosts>>[number]> {
    // TODO: create a in-memory collection (no need DB for now)
    // to avoid listing each host when we just need one
    const vhosts = await getVirtualHosts()
    const vhost = vhosts.find(vhost => vhost.id === id)

    if (vhost === undefined) {
        throw new Error('not found')
    }

    return vhost

}