import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'web developers',
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      role: 'ux designer',
    },
    {
      id: 3,
      name: 'Jim Doe',
      email: 'jim.doe@example.com',
      role: 'backend developer',
    },
    {
      id: 4,
      name: 'Jill Doe',
      email: 'jill.doe@example.com',
      role: 'frontend developer',
    },
  ];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: number): User {
    const user = this.users.find((u) => u.id === id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  create(dto: CreateUserDto): User {
    const nextId = this.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const user: User = { id: nextId, ...dto };

    this.users.push(user);

    return user;
  }
}
