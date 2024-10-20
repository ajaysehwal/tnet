import { Module, Global } from '@nestjs/common';
import { AppwriteService } from '../services/appwrite.service';

@Global() // Make AppwriteService available globally
@Module({
  providers: [AppwriteService],
  exports: [AppwriteService],
})
export class AppwriteModule {}
