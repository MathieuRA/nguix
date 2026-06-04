import { ApiResponse } from "../classes/response.ts";
import { Router } from "../classes/router.ts";
import { getNginxHealth } from "../services/nginx.ts";
import { getVirtualHosts } from "../services/vhost.ts";


export const router = Object.freeze(new Router())

router.get('/vhosts', async () => {
    const vHosts = await getVirtualHosts()
    return new ApiResponse({ data: vHosts })
})

router.get('/nginx/health', () => {
    const nginxHealth = getNginxHealth()
    return new ApiResponse({ data: nginxHealth })
})

