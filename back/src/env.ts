export function getOptionalEnv(key: string): string | undefined {
    return process.env[key]
}

export function getEnv(key: string): string {
    const env = getOptionalEnv(key)
    if (env === undefined) {
        throw new Error(`${key} is missing`)
    }

    return env
}

export function getOptionalNumberEnv(key: string): number | undefined {
    const env = getOptionalEnv(key)
    if (env === undefined) {
        return
    }

    const number = parseInt(env)
    if (isNaN(number)) {
        throw new Error(`invalid: ${key}: ${number}. Except to be a number`)
    }

    return number
}
export function getNumberEnv(key: string) {
    const env = getOptionalNumberEnv(key)
    if (env === undefined) {
        throw new Error(`${key} is missing`)
    }
}