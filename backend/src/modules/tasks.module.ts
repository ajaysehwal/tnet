import { Module } from '@nestjs/common';
import { TasksController } from '../controllers/tasks.controller';
import { TasksService } from '../services/tasks.service';
import { PrismaModule } from './prisma.module';
import { UserRoleGuard } from '../guard/role.guard';
import { UserExistsGuard } from '../guard/user.guard';
import { UsersController } from 'src/controllers/users.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TasksController, UsersController],
  providers: [TasksService, UserRoleGuard, UserExistsGuard],
})
export class TasksModule {}
