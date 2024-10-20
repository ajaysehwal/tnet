import { NextFunction, Response, Request } from "express";
import { Appwrite } from "../services/appwrite.service";
import { log } from "../services/logger.service";
export interface AuthRequest extends Request{
    userId?: string;
}
export class UserGuard {
  private appwrite: Appwrite;

  constructor() {
    this.appwrite = new Appwrite();
    this.isExist = this.isExist.bind(this); 
  }

  async isExist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const token = this.extractBearerToken(req);

    if (!token) {
      log.warn("No token provided in request");
       res.status(401).send("Authentication token is required");
       return;
    }

    try {
      const userExists = await this.appwrite.isUserExists(token);

      if (!userExists) {
        log.warn(`User with token ${token} not found in Appwrite`);
         res.status(403).send("User not found in Appwrite");
         return;
      }
      req.userId=token;
      next();
    } catch (error) {
      log.error(`Error while checking user existence: ${error}`);
      res.status(500).send("Internal server error");
    }
  }

  private extractBearerToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    return authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  }
}
