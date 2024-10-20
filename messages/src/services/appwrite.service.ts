import { Client, Databases, Users } from "node-appwrite";
import { config } from "../config";
export class Appwrite {
  private client: Client;
  private users: Users;
  private databases: Databases;
  constructor() {
    this.client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject(config.appwrite.project)
      .setKey(config.appwrite.key);
    this.users = new Users(this.client);
    this.databases = new Databases(this.client);
  }
  async isUserExists(userId: string) {
    try {
      const user = await this.users.get(userId);
      return user;
    } catch (error) {
      return false;
    }
  }
  async getUserRole(userId: string): Promise<string> {
    try {
      const userRole = await this.databases.getDocument(
        config.appwrite.database,
        config.appwrite.collectionId,
        userId
      );
      return userRole.role;
    } catch (error) {
      return "user";
    }
  }
}
