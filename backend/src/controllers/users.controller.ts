import {
  Controller,
  Get,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { AppwriteService } from '../services/appwrite.service';
import { UserExistsGuard } from 'src/guard/user.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly appwriteService: AppwriteService) {}
  @Get()
  @UseGuards(UserExistsGuard)
  async getUsers() {
    try {
      return await this.appwriteService.getUsers();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
