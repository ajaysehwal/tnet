import http from "http";
import express, { Request, Response, NextFunction } from "express";
import { SocketProvider } from "./socket";
import { log } from "./services/logger.service";
import { PrismaClient } from "@prisma/client";
import { AuthRequest, UserGuard } from "./guard/user.guard";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { StatusCodes } from "http-status-codes";

interface ServerConfig {
  port: number;
  corsOrigin: string;
  rateLimitWindow: number;
  rateLimitMax: number;
  shutdownTimeout: number;
}

export class Server {
  private readonly app: express.Application;
  private readonly httpServer: http.Server;
  private readonly socketProvider: SocketProvider;
  private readonly prisma: PrismaClient;
  private readonly userGuard: UserGuard;
  private isShuttingDown: boolean = false;
  private readonly config: ServerConfig;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: config.port || 8080,
      corsOrigin: config.corsOrigin || "http://localhost:3000",
      rateLimitWindow: config.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
      rateLimitMax: config.rateLimitMax || 100,
      shutdownTimeout: config.shutdownTimeout || 10000,
    };

    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.socketProvider = new SocketProvider();
    this.prisma = new PrismaClient();
    this.userGuard = new UserGuard();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(express.json({ limit: "10kb" }));
    this.app.use(
      cors({
        origin: this.config.corsOrigin,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true,
        maxAge: 86400, // 24 hours
      })
    );
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindow,
      max: this.config.rateLimitMax,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use("/", limiter);
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      res.on("finish", () => {
        const duration = Date.now() - start;
        log.info("Request processed", {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
          ip: req.ip,
        });
      });
      next();
    });
  }

  private initializeRoutes(): void {
    this.setupHealthCheck();
    this.setupApiRoutes();
  }

  private setupHealthCheck(): void {
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(StatusCodes.OK).json({
        status: this.isShuttingDown ? "shutting_down" : "running",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        pid: process.pid,
        memory: process.memoryUsage(),
      });
    });
  }

  private setupApiRoutes(): void {
    this.app.get("/users", this.userGuard.isExist, this.handleGetUsers.bind(this));    
  }

  private async handleGetUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (this.isShuttingDown) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          error: "Service is shutting down",
        });
        return;
      }

      const currentUser = req.userId;
      const users = await this.prisma.user.findMany({
        where: {
          id: { not: currentUser },
        },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(StatusCodes.OK).json({ users });
    } catch (error) {
      log.error("Error fetching users:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch users",
        message: process.env.NODE_ENV === "development" ? ( error as Error).message : undefined,
      });
    }
  }

  private initializeErrorHandling(): void {
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      log.error("Unhandled error:", err);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    });

    process.on("unhandledRejection", this.handleUnhandledRejection.bind(this));
    process.on("uncaughtException", this.handleUncaughtException.bind(this));
    process.on("SIGTERM", this.handleGracefulShutdown.bind(this));
    process.on("SIGINT", this.handleGracefulShutdown.bind(this));
  }

  private async handleUnhandledRejection(reason: any, promise: Promise<any>): Promise<void> {
    console.log(reason);
    log.error("Unhandled Rejection:", { reason, promise });
    await this.shutdown(1);
  }

  private async handleUncaughtException(error: Error): Promise<void> {
    log.error("Uncaught Exception:", error);
    await this.shutdown(1);
  }

  private async handleGracefulShutdown(signal: string): Promise<void> {
    log.info(`${signal} received. Starting graceful shutdown...`);
    await this.shutdown(0);
  }

  private async shutdown(exitCode: number): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    try {
      const shutdownTimeout = setTimeout(() => {
        log.error("Forced shutdown due to timeout");
        process.exit(1);
      }, this.config.shutdownTimeout);

      // Stop accepting new requests
      this.httpServer.close(async () => {
        log.info("HTTP server closed");
        
        try {
          // Cleanup connections and resources
          await Promise.all([
            this.socketProvider.io.disconnectSockets(true),
            this.prisma.$disconnect(),
          ]);
          
          log.info("All connections closed successfully");
          clearTimeout(shutdownTimeout);
          process.exit(exitCode);
        } catch (error) {
          log.error("Error during cleanup:", error);
          process.exit(1);
        }
      });
    } catch (error) {
      log.error("Error during shutdown:", error);
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      await this.prisma.$connect();
      await this.socketProvider.init();
      this.socketProvider.io.attach(this.httpServer);

      this.httpServer.listen(this.config.port, () => {
        log.info(`Server started on port ${this.config.port}`, {
          pid: process.pid,
          nodeEnv: process.env.NODE_ENV,
        });
      });
    } catch (error) {
      log.error("Failed to start server:", error);
      await this.shutdown(1);
    }
  }
}