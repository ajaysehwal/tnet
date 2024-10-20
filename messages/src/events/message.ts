import { Server, Socket } from "socket.io";
import { MessageQueue } from "../queue";
import { log } from "../services/logger.service";
import Database from "../services/prisma.service";

export class MessageEvent {
  private db: Database;

  constructor(
    private socket: Socket,
    private queue: MessageQueue,
    private users: Map<string, Set<string>>,
    private io: Server
  ) {
    this.db = new Database();
    this.setupEvents();
  }

  private setupEvents() {
    this.socket.on("sendMessage", this.handleSendMessage.bind(this));
    this.socket.on("getConversation", this.handleGetConversation.bind(this));
  }

  private getSocketIdsByUserId(userId: string): string[] {
    const socketIds = this.users.get(userId);
    return socketIds ? Array.from(socketIds) : [];
  }

  private async handleSendMessage(message: {
    recipientId: string;
    content: string;
    conversationId: string;
  }) {
    console.log(message);
    log.info(`Received sendMessage event ${message.conversationId}`);

    try {
      const newMessage = {
        content: message.content,
        senderId: this.socket.handshake.query.userId as string,
        receiverId: message.recipientId,
        conversationId: message.conversationId,
      };
      const job = await this.queue.add(newMessage);
      const sendMessage = await this.queue.waitForCompletion(job.id);

      const receiverSockets = this.getSocketIdsByUserId(message.recipientId);

      receiverSockets.forEach((socketId) => {
        this.io.to(socketId).emit("messageReceived", sendMessage);
      });

      log.info("Message added to queue", { messageId: message.conversationId });
    } catch (error) {
      log.error("Error sending message", {
        error,
        messageId: message.conversationId,
      });
      this.socket.emit("error", "Failed to send message");
    }
  }

  private async handleGetConversation(userId2: string) {
    log.info("Received getConversation event", { userId2 });
    try {
      const currentUserId = this.socket.handshake.query.userId as string;
      const conversation = await this.db.getOrCreateConversation(
        currentUserId,
        userId2
      );
      this.socket.emit("conversation", conversation);
      log.info("Conversation sent to client", { conversation });
    } catch (error) {
      log.error("Error getting conversation", { error, userId2 });
      this.socket.emit("error", "Failed to retrieve conversation");
    }
  }
}
