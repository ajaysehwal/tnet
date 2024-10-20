import {
  PrismaClient,
  User,
  Message,
  ConversationParticipant,
  Role,
  UserStatus,
} from "@prisma/client";
import { log } from "./logger.service";
import { Appwrite } from "./appwrite.service";

class Database {
  private prisma: PrismaClient;
  private appwrite: Appwrite;
  constructor() {
    this.prisma = new PrismaClient();
    this.appwrite = new Appwrite();
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      log.info("Connected to database");
    } catch (error) {
      log.error("Failed to connect to database", error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    log.info("Disconnected from database");
  }
  async getAllUser() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      return [];
    }
  }
  public async setOnline(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.ONLINE },
      });
      log.info(`User set online: ${userId}`);
    } catch (error) {
      log.error("unable to set user online");
    }
  }
  public async setOffline(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.OFFLINE },
      });
      log.info(`user set offline ${userId}`);
    } catch (error) {
      log.error("unable to set user offline");
    }
  }
  public async findOrCreateUser(userId: string): Promise<User> {
    const isAuthExist = await this.appwrite.isUserExists(userId);
    if (!isAuthExist) {
      throw new Error("User not authenticated");
    }
    const { $id, email, name } = isAuthExist;
    const role = await this.appwrite.getUserRole($id);
    try {
      let dbUser = await this.prisma.user.findFirst({
        where: { id: $id, email },
      });
      if (!dbUser) {
        dbUser = await this.prisma.user.create({
          data: {
            id: $id,
            email,
            name,
            role: role === "admin" ? Role.ADMIN : Role.USER,
          },
        });
      }
      return dbUser;
    } catch (error) {
      log.error("Error finding or creating user", { error, userId });
      throw error;
    }
  }

  async getOrCreateConversation(userId1: string, userId2: string) {
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: userId1,
              },
            },
          },
          {
            participants: {
              some: {
                userId: userId2,
              },
            },
          },
        ],
      },
      include: {
        participants: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          take: 50,
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }
    const newConversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: {
        participants: true,
        messages: true,
      },
    });

    return newConversation;
  }

  async createMessage(
    content: string,
    senderId: string,
    receiverId: string,
    conversationId: string
  ): Promise<Message> {
    try {
      const message = await this.prisma.message.create({
        data: {
          content,
          senderId,
          receiverId,
          conversationId,
        },
      });

      await this.prisma.conversationParticipant.update({
        where: {
          userId_conversationId: {
            userId: receiverId,
            conversationId,
          },
        },
        data: {
          unreadCount: {
            increment: 1,
          },
        },
      });

      log.info(`Message created: ${message.id}`);
      return message;
    } catch (error) {
      log.error("Failed to create message", error as Error);
      throw error;
    }
  }
  public async updateUnreadCount(
    receiverId: string,
    conversationId: string
  ): Promise<void> {
    await this.prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: receiverId,
          conversationId,
        },
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });
  }
  async markMessagesAsRead(
    userId: string,
    conversationId: string
  ): Promise<ConversationParticipant> {
    try {
      const lastMessage = await this.prisma.message.findFirst({
        where: { conversationId: conversationId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      const participant = await this.prisma.conversationParticipant.update({
        where: {
          userId_conversationId: {
            userId: userId,
            conversationId: conversationId,
          },
        },
        data: {
          unreadCount: 0,
          lastReadMessageId: lastMessage?.id,
        },
      });

      log.info(
        `Marked messages as read for user ${userId} in conversation ${conversationId}`
      );
      return participant;
    } catch (error) {
      log.error("Failed to mark messages as read", error as Error);
      throw error;
    }
  }
}

export default Database;
