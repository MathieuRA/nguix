import fs from "node:fs/promises"
import { Vhost } from "../classes/vhosts.ts";

const SITES_AVAILABLE = '/etc/nginx/sites-available'
const SITES_ENABLED = '/etc/nginx/sites-enabled'

export async function getVirtualHosts(): Promise<(Awaited<ReturnType<Vhost['getConf']>> & { enabled: boolean })[]> {
    const sitesEnabled = await fs.readdir(SITES_ENABLED)
    const sitesAvailable = await fs.readdir(SITES_AVAILABLE)

    const confs: (Awaited<ReturnType<Vhost['getConf']>> & { enabled: boolean })[] = []
    const parsedConfs = new Set()

    await Promise.all(sitesEnabled.map(async fileName => {
        const vhost = await Vhost.fromPath(`${SITES_ENABLED}/${fileName}`)
        if (!vhost.isSymlink) {
            console.log(`--- ${vhost.filePath} is not a symlink and get ignored ---`)
            return
        }

        const originalPath = await vhost.linkTo()
        parsedConfs.add(originalPath)

        confs.push({ ...(await vhost.getConf()), enabled: true })
    }))

    await Promise.all(sitesAvailable.map(async fileName => {
        const path = `${SITES_AVAILABLE}/${fileName}`
        if (parsedConfs.has(path)) {
            // already parsed by enabled path
            return
        }

        const vhost = await Vhost.fromPath(path)
        confs.push({ ...(await vhost.getConf()), enabled: false })
    }))

    return confs
}