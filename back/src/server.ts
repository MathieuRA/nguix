import http from 'node:http'

const PORT = 3001

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
