import { ApiResponse } from "../classes/response.ts";
import { Router } from "../classes/router.ts";
import { getNginxHealth } from "../services/nginx.ts";
import { getVirtualHost, getVirtualHosts } from "../services/vhost.ts";


export const router = Object.freeze(new Router())

router.get('/vhosts', async () => {
    const vHosts = await getVirtualHosts()
    return new ApiResponse({ data: vHosts.map(host => host.toJSON()) })
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

