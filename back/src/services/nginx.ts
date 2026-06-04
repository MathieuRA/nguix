import { execFileSync } from "node:child_process"

type ExecFn = (cmd: string, args: string[], opts?: object) => void

export function getNginxHealth(exec: ExecFn = execFileSync): { installed: boolean, active?: boolean } {
    try {
        exec('which', ['nginx'])
    } catch (_) {
        return { installed: false }
    }

    let isActive: boolean
    try {
        exec('systemctl', ['is-active', 'nginx'], { encoding: 'utf8' })
        isActive = true
    } catch (_) {
        isActive = false
    }

    return { installed: true, active: isActive }
}