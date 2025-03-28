import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':uid')
  findOne(@Param('uid') uid: string) {
    return this.usersService.findOne(uid);
  }

  @Patch(':uid')
  update(@Param('uid') uid: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(uid, updateUserDto);
  }

  @Delete(':uid')
  remove(@Param('uid') uid: string) {
    return this.usersService.remove(uid);
  }
}
