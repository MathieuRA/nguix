import fs from "node:fs/promises"
import { Vhost } from "../classes/vhost.ts";
import { getEnv } from "../env.ts";

const SITES_AVAILABLE = getEnv('SITES_AVAILABLE')
const SITES_ENABLED = getEnv('SITES_ENABLED')

export async function getVirtualHosts(): Promise<(Vhost['conf'] & { enabled: boolean, file: string })[]> {
    const sitesEnabled = await fs.readdir(SITES_ENABLED)
    const sitesAvailable = await fs.readdir(SITES_AVAILABLE)

    const confs: (Vhost['conf'] & { enabled: boolean, file: string })[] = []
    const parsedConfs = new Set()

    await Promise.all(sitesEnabled.map(async fileName => {
        const vhost = await Vhost.fromPath(`${SITES_ENABLED}/${fileName}`)
        if (!vhost.isSymlink) {
            console.log(`--- ${vhost.filePath} is not a symlink and get ignored ---`)
            return
        }

        const originalPath = await vhost.linkTo()
        parsedConfs.add(originalPath)

        confs.push({ ...vhost.conf, enabled: vhost.enabled, file: vhost.fileName })
    }))

    await Promise.all(sitesAvailable.map(async fileName => {
        const path = `${SITES_AVAILABLE}/${fileName}`
        if (parsedConfs.has(path)) {
            // already parsed by enabled path
            return
        }

        const vhost = await Vhost.fromPath(path)
        confs.push({ ...vhost.conf, enabled: vhost.enabled, file: vhost.fileName })
    }))

    return confs
}