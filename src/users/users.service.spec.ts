import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the seeded users', () => {
      const users = service.findAll();

      expect(users).toHaveLength(4);
      expect(users[0]).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'web developers',
      });
    });
  });

  describe('findOne', () => {
    it('returns the user matching the given id', () => {
      const user = service.findOne(2);

      expect(user).toEqual({
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        role: 'ux designer',
      });
    });

    it('throws NotFoundException when the id does not exist', () => {
      expect(() => service.findOne(999)).toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('adds a new user and returns it with a generated id', () => {
      const created = service.create({
        name: 'New User',
        email: 'new.user@example.com',
        role: 'qa engineer',
      });

      expect(created).toEqual({
        id: 5,
        name: 'New User',
        email: 'new.user@example.com',
        role: 'qa engineer',
      });
      expect(service.findAll()).toHaveLength(5);
      expect(service.findOne(5)).toEqual(created);
    });
  });
});
