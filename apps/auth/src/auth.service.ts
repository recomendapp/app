import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ValidateTokenResponse } from '@app/shared/protos/__generated__';
import { JwtPayload } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  validateToken = async (token: string): Promise<ValidateTokenResponse> => {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      return {
        user: {
          id: payload.sub,
          email: payload.email,
          exp: payload.exp,
        },
      };
    } catch {
      return {
        error: 'Invalid token',
      };
    }
  };
}
