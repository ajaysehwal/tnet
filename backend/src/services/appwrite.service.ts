import { Injectable } from '@nestjs/common';
import { Client, Users, Databases } from 'node-appwrite';

const DATABASE_ID = '670fd308001680e7b99c';
const COLLECTION_ID = '670fd318000f32a7d61e';
@Injectable()
export class AppwriteService {
  private client: Client;
  private users: Users;
  private databases: Databases;

  constructor() {
    this.client = new Client()
      .setEndpoint('https://cloud.appwrite.io/v1')
      .setProject() // appwrite project id
      .setKey(); /// appwrite key

    this.users = new Users(this.client);
    this.databases = new Databases(this.client);
  }
  async getUsers() {
    try {
      const users = await this.users.list();
      return {
        total: users.total,
        users: users.users.map((user) => {
          return {
            id: user.$id,
            name: user.name,
            email: user.email,
            status: user.status,
            createdOn: user.accessedAt,
            updatedOn: user.$updatedAt,
          };
        }),
      };
    } catch (error) {
      throw error;
    }
  }

  async checkUserExists(userId: string): Promise<boolean> {
    try {
      await this.users.get(userId);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async getUserRole(userId: string): Promise<string> {
    try {
      const userRole = await this.databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        userId,
      );
      return userRole.role;
    } catch (error) {
      return 'user';
    }
  }
}
