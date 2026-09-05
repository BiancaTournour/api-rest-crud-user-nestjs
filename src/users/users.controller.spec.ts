import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('delegates to service.findAll and returns its result', () => {
      const users: User[] = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'web developers',
        },
      ];
      service.findAll.mockReturnValue(users);

      const result = controller.getUsers();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toBe(users);
    });
  });

  describe('getUserById', () => {
    it('delegates to service.findOne with the parsed id and returns its result', () => {
      const user: User = {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        role: 'ux designer',
      };
      service.findOne.mockReturnValue(user);

      const result = controller.getUserById(2);

      expect(service.findOne).toHaveBeenCalledWith(2);
      expect(result).toBe(user);
    });
  });

  describe('createUser', () => {
    it('delegates to service.create with the dto and returns its result', () => {
      const dto: CreateUserDto = {
        name: 'New User',
        email: 'new.user@example.com',
        role: 'qa engineer',
      };
      const created: User = { id: 5, ...dto };
      service.create.mockReturnValue(created);

      const result = controller.createUser(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(created);
    });
  });
});
