import fs from "node:fs"
import { getEnv } from "../env.ts"

const MAIN_DIRS = ["SITES_AVAILABLE", "SITES_ENABLED"]

export function checkMainDirExist() {
    const dirExist = MAIN_DIRS.map(envVar => {
        const path = getEnv(envVar)

        return {
            exist: fs.existsSync(path),
            name: envVar,
            path
        }
    })

    if (dirExist.some(dir => !dir.exist)) {
        dirExist.forEach(dir => {
            if (!dir.exist) {
                const error = new Error('path do not exist', {
                    cause: {
                        path: dir.path,
                        variable: dir.name
                    }
                })
                console.warn(`[getVirtualHosts]:`, error)
            }
        })

        return false
    }

    return true
}