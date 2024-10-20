import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AppwriteService } from '../services/appwrite.service';
import { Request } from 'express';
import { PrismaService } from 'src/services/prisma.service';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

@Injectable()
export class UserExistsGuard implements CanActivate {
  private readonly logger = new Logger(UserExistsGuard.name);

  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const token = this.extractBearerToken(request);

      if (!token) {
        this.logger.warn('No token provided in request');
        throw new UnauthorizedException('Authentication token is required');
      }

      const userExists = await this.appwriteService.checkUserExists(token);
      if (!userExists) {
        this.logger.warn(`User with token ${token} not found in Appwrite`);
        throw new UnauthorizedException('User not found');
      }
      let user = await this.prisma.user.findUnique({ where: { id: token } });
      if (!user) {
        user = await this.prisma.user.create({ data: { id: token } });
      }
      request.body.userId = user.id;

      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private handleError(error: Error): void {
    this.logger.error('Authentication error:', error);
    throw new UnauthorizedException('Authentication failed');
  }
}
