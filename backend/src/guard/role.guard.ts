import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { AppwriteService } from '../services/appwrite.service';
import { AuthenticatedRequest } from './user.guard';

@Injectable()
export class UserRoleGuard implements CanActivate {
  private readonly logger = new Logger(UserRoleGuard.name);

  constructor(private readonly appwriteService: AppwriteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const userId = request.body.userId;

      if (!userId) {
        this.logger.warn('No user found in request');
        throw new ForbiddenException('Access denied');
      }

      const userRole = await this.appwriteService.getUserRole(userId);
      if (!userRole) {
        this.logger.warn(`No role found for user with ID ${userId}`);
        throw new ForbiddenException('User role not found');
      }

      const hasAccess = this.checkUserAccess(userRole);
      if (!hasAccess) {
        this.logger.warn(`User with role ${userRole} denied access`);
        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
    } catch (error) {
      this.logger.error('Authorization error:', error);
      throw new ForbiddenException('Access denied');
    }
  }

  private checkUserAccess(role: string): boolean {
    const allowedRoles = ['admin'];
    return allowedRoles.includes(role.toLowerCase());
  }
}
