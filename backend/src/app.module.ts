import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './modules/tasks.module';
import { PrismaModule } from './modules/prisma.module';
import { AppwriteModule } from './modules/appwrite.module';

@Module({
  imports: [TasksModule, PrismaModule, AppwriteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
