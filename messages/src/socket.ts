import { Server, Socket } from "socket.io";
import Bull from "bull";
import {
  Message,
  PrismaClient,
  Role,
  User,
  Conversation,
  UserStatus,
} from "@prisma/client";
import { MessageQueue } from "./queue";
import { MessageEvent } from "./events/message";
import { log } from "./services/logger.service";
import { Appwrite } from "./services/appwrite.service";
import { MessageJob } from "./types";
import Database from "./services/prisma.service";

export class SocketProvider {
  private readonly _io: Server;
  private static readonly MAX_CONNECTIONS: number = parseInt(
    process.env.MAX_CONNECTIONS || "10000"
  );
  private readonly users = new Map<string, Set<string>>();
  private readonly db: Database;
  private readonly queue: MessageQueue;
  private appwrite: Appwrite;
  constructor() {
    this._io = new Server({
      transports: ["websocket", "polling"],
      cors: {
        origin: ["https://tnet.vercel.app"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
      },
    });
    this.db = new Database();
    this.queue = new MessageQueue("message-queue");
    this.appwrite = new Appwrite();
    this.initializeJobQueue();
  }

  private initializeJobQueue(): void {
    this.queue.startProcessing(this.processMessage.bind(this));
  }

  public async init(): Promise<Server> {
    this.io.setMaxListeners(20);
    this.io.use(this.connectionLimiter.bind(this));
    this.io.on("connection", this.handleConnection.bind(this));
    return this.io;
  }

  private connectionLimiter(socket: Socket, next: (err?: Error) => void): void {
    if (this.users.size >= SocketProvider.MAX_CONNECTIONS) {
      next(new Error("Server has reached max connections"));
    } else {
      next();
    }
  }

  private async handleConnection(socket: Socket): Promise<void> {
    try {
      const userId = socket.handshake.query.userId as string;
      if (!userId) {
        socket.disconnect();
        return;
      }

      const dbUser = await this.db.findOrCreateUser(userId as string);
      this.users.set(dbUser.id, new Set([socket.id]));
      log.info(`User connected: ${dbUser.name}`, { userId: dbUser.id });
      this.db.setOnline(userId);
      this.initializeSocketListeners(socket);

      socket.on("disconnect", () => this.handleDisconnect(socket));
    } catch (error) {
      log.error("Error handling connection", { error, socketId: socket.id });
      socket.disconnect();
    }
  }

  private initializeSocketListeners(socket: Socket): void {
    socket.on("testing", (data: string) => {
      log.info("Received testing event", { data, socketId: socket.id });
    });
    new MessageEvent(socket, this.queue, this.users, this._io);
  }

  private handleDisconnect(socket: Socket): void {
    const userId = [...this.users.entries()].find(([_, socketIds]) =>
      socketIds.has(socket.id)
    )?.[0];
    if (userId) {
      const socketIds = this.users.get(userId)!;
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        this.users.delete(userId);
        this.db.setOffline(userId);
      }

      log.info(`User disconnected ${userId}`);
    }
  }
  private async processMessage(job: Bull.Job<MessageJob>): Promise<MessageJob> {
    const { content, conversationId, receiverId, senderId } = job.data;
    try {
      const conversation = await this.db.getOrCreateConversation(
        senderId,
        receiverId
      );
      const message = await this.db.createMessage(
        content,
        senderId,
        receiverId,
        conversation.id
      );

      await this.db.updateUnreadCount(receiverId, conversation.id);

      return message;
    } catch (error) {
      log.error("Error processing message", { error, jobData: job.data });
      throw error;
    }
  }

  get io() {
    return this._io;
  }
}
