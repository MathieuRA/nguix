import { ApiResponse } from "../classes/response.ts";
import { Router } from "../classes/router.ts";
import { getNginxHealth } from "../services/nginx.ts";
import { getVirtualHost, getVirtualHosts } from "../services/vhost.ts";


export const router = Object.freeze(new Router())

router.get('/vhosts', async () => {
    const vHosts = await getVirtualHosts()
    return new ApiResponse({ data: vHosts })
})

router.patch('/vhosts/:id', async ({ id }) => {
    const vhost = await getVirtualHost(id as string)

    console.log({ vhost })
    return new ApiResponse({ status: 204 })
})

router.get('/nginx/health', () => {
    const nginxHealth = getNginxHealth()
    return new ApiResponse({ data: nginxHealth })
})

