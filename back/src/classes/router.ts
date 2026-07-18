import type http from 'node:http'
import { ApiResponse } from './response.ts'
import { serveStatic } from '../static.ts'

// @ts-ignore
type HttpCallback = (params: { request: http.IncomingMessage, response: http.ServerResponse, [key: string]: number | string, body: <T> (req: http.IncomingMessage) => Promise<T> }) => void | ApiResponse | Promise<void | ApiResponse>
type HttpVerb = 'get' | 'patch'
type RouteConfig = {
    path: string
    callback: HttpCallback
    method: HttpVerb,
}
const HTTP_VERB: HttpVerb[] = ['get', 'patch']

const BASE_PATH = '/api'

/**
 * 
 * GET: {
 *  vhost/
 *  vhost/:id
 * }
 * 
 */

export class Router {
    constructor() {
        this.setupMiddleware = this.setupMiddleware.bind(this)
        // @ts-ignore initialize the variable
        const routes: Record<HttpVerb, {}> = {}
        HTTP_VERB.forEach(verb => {
            routes[verb] = {}
        })
        // @ts-ignore initialize the context
        this.routesByVerb = { ...routes }
    }

    /**
     * Routes by verb
     */
    private routesByVerb: Record<HttpVerb, Record<string, RouteConfig>>
    #addRoute(newRoute: { method: HttpVerb, callback: HttpCallback, path: string }) {
        const routes = this.routesByVerb[newRoute.method]
        let route = routes[newRoute.path]

        newRoute.path = BASE_PATH + newRoute.path
        if (route !== undefined) {
            throw new Error(`route ${newRoute.path} already exist`)
        }

        this.routesByVerb[newRoute.method][newRoute.path] = newRoute
    }

    #matchRoute(key: string, pathname: string) {
        const paramNames: string[] = []

        const regexPattern = key.replace(/:([^/]+)/g, (_, name) => {
            paramNames.push(name)
            return "([^/]+)"
        })

        const regex = new RegExp(`^${regexPattern}$`)
        const match = pathname.match(regex)

        if (!match) {
            return null
        }

        const params = Object.fromEntries(
            paramNames.map((name, index) => [name, isFinite(+match[index + 1]) ? +match[index + 1] : match[index + 1]])
        )

        return params
    }

    async #body<T>(req: http.IncomingMessage): Promise<T> {
        const chunks: Buffer[] = []

        for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }

        return JSON.parse(Buffer.concat(chunks).toString("utf8"))
    }

    get(path: string, callback: HttpCallback) {
        this.#addRoute({ method: 'get', callback, path })
    }

    patch(path: string, callback: HttpCallback) {
        this.#addRoute({ method: 'patch', callback, path })
    }

    async setupMiddleware(req: http.IncomingMessage, res: http.ServerResponse) {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (req.method === undefined) {
            throw new Error('Cannot detect the HTTP verb for the request')
        }

        const routes = this.routesByVerb[req.method.toLowerCase() as HttpVerb]
        let route = routes[url.pathname]
        let queries: { [key: string]: (string | number) } = {}

        if (route === undefined) {
            const allKeys = Object.keys(routes)
            for (const key of allKeys) {
                const match = this.#matchRoute(key, url.pathname)
                if (match !== null) {
                    route = routes[key]
                    queries = match
                    break
                }
            }
        }


        if (route === undefined) {
            const staticRoot = process.env.STATIC_ROOT ?? '../front'
            const served = await serveStatic(req, res, staticRoot)
            if (!served) res.writeHead(404).end('not found')
            return
        }

        // @ts-ignore
        const result = await route.callback({ request: req, response: res, ...queries, body: this.#body })
        if (res.headersSent) {
            return
        }

        const response = result ?? new ApiResponse({ status: 200 })
        res.writeHead(response.statusCode, {
            'content-type': 'application/json'
        }).end(JSON.stringify(response.body))
    }
}