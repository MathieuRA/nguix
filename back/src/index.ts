import { router } from './routes/index.ts';
import { getServer } from './server.ts';

const server = getServer()
server.on('request', router.setupMiddleware)

