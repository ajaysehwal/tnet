import "dotenv/config";
import os from "os";
import { Server } from "./server";
import { log } from "./services/logger.service";
import { config } from "./config";
class Application{
    private server:Server;
    constructor(){
        this.server = new Server({
            port: 8080,
            corsOrigin: process.env.CORS_ORIGIN || 'https://tnet.vercel.app',
            rateLimitWindow: 15 * 60 * 1000, 
            rateLimitMax: 100,
            shutdownTimeout: 10000,
          });
          
    }
    async start(){
        await this.server.start();
        log.info(`Server started on port ${config.port}`);
        log.info(`Environment: ${process.env.NODE_ENV}`);
        log.info(`Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
        log.info(`Uptime: ${os.uptime()} seconds`);
    }
}
const app=new Application();
app.start().catch((err)=>{
    log.error("Failed to start application",err);
    process.exit(1);
})
