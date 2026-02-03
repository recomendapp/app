import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = app.get<AuthService>(AuthService);
  });

  describe('validateToken', () => {
    it('should return a message', () => {
      // expect(service.validateToken()).toEqual({ message: 'Hello API' });
    });
  });
});
