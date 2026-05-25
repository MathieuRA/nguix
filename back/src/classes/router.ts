import type http from 'node:http'
import { ApiResponse } from './response.ts'
import { serveStatic } from '../static.ts'

type HttpCallback = (request: http.IncomingMessage, response: http.ServerResponse) => void | ApiResponse | Promise<void | ApiResponse>

const BASE_PATH = '/api'

export class Router {
    constructor() {
        this.setupMiddleware = this.setupMiddleware.bind(this)
    }

    /**
     * routes by pathname
     */
    private routes: Record<string, {
        path: string
        callback: HttpCallback
        method: 'get',
    }> = {}

    #addRoute(newRoute: { method: 'get', callback: HttpCallback, path: string }) {
        const pathname = BASE_PATH + newRoute.path
        const route = this.routes[pathname]

        if (route !== undefined) {
            // TODO: handle same route on different http verb
            throw new Error(`route ${newRoute.path} already exist`)
        }

        this.routes[pathname] = newRoute
    }

    get(path: string, callback: HttpCallback) {
        this.#addRoute({ method: 'get', callback, path })
    }


    async setupMiddleware(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const route = this.routes[url.pathname]

        if (route === undefined) {
            const staticRoot = process.env.STATIC_ROOT ?? '../front'
            const served = await serveStatic(req, res, staticRoot)
            if (!served) res.writeHead(404).end('not found')
            return
        }

        const result = await route.callback(req, res)
        if (res.headersSent) {
            return
        }

        const response = result ?? new ApiResponse({ status: 200 })
        res.writeHead(response.statusCode, {
            'content-type': 'application/json'
        }).end(JSON.stringify(response.body))
    }
}