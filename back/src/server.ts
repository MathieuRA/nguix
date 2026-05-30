import http from 'node:http'
import { getOptionalNumberEnv } from './env.ts'

const PORT = getOptionalNumberEnv('PORT') ?? 3001

let server: Readonly<http.Server> | undefined

function createServer() {
    const _server = http.createServer()
    _server.listen(PORT, () => console.log(`Nguix server listening on http://localhost:${PORT}`))

    return _server
}

export function getServer() {
    if (server === undefined) {
        server = createServer()
    }
    return server
}
