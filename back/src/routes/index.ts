import { ApiResponse } from "../classes/response.ts";
import { Router } from "../classes/router.ts";
import { getNginxHealth } from "../services/nginx.ts";
import { createVirtualHost, type CreateVhostInput, getVirtualHost, getVirtualHosts } from "../services/vhost.ts";


export const router = Object.freeze(new Router())

router.get('/vhosts', async () => {
    const vHosts = await getVirtualHosts()
    return new ApiResponse({ data: vHosts.map(host => host.toJSON()) })
})

router.post('/vhosts', async ({ request, body }) => {
    const payload = await body<CreateVhostInput>(request)

    // TODO: validate payload in a better way (type based validation)
    if (typeof payload.domain !== 'string' || (payload.domain = payload.domain.trim()) === '') {
        throw new Error('domain is required')
    }
    if (typeof payload.port !== 'number') {
        throw new Error('port is required')
    }
    if (typeof payload.enabled !== 'boolean') {
        throw new Error('enabled is required')
    }
    if (payload.root !== undefined && payload.proxy !== undefined) {
        throw new Error('root and proxy cannot be set at the same time')
    }
    if (payload.root === undefined && payload.proxy === undefined) {
        throw new Error('either root or proxy must be set')
    }
    if (payload.root !== undefined && (typeof payload.root !== 'string' || (payload.root = payload.root.trim()) === '')) {
        throw new Error('root must be a string')
    }
    if (payload.proxy !== undefined && (typeof payload.proxy !== 'string' || (payload.proxy = payload.proxy.trim()) === '')) {
        throw new Error('proxy must be a string')
    }
    if (payload.aliases !== undefined && (!Array.isArray(payload.aliases) || payload.aliases.some(alias => typeof alias !== 'string'))) {
        throw new Error('aliases must be an array of strings')
    }


    const vhost = await createVirtualHost(payload)
    return new ApiResponse({ status: 201, data: { id: vhost.id } })
})

router.delete('/vhosts/:id', async ({ id }) => {
    const vhost = await getVirtualHost(decodeURIComponent(id as string))
    await vhost.destroy()

    return new ApiResponse({ status: 204 })
})

router.patch('/vhosts/:id', async ({ id, request, body }) => {
    const vhost = await getVirtualHost(decodeURIComponent(id as string))

    vhost.update(await body(request))
    return new ApiResponse({ status: 204 })
})

router.get('/nginx/health', () => {
    const nginxHealth = getNginxHealth()
    return new ApiResponse({ data: nginxHealth })
})

