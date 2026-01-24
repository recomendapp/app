import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '@app/shared/protos/__generated__';
import { Observable } from 'rxjs';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  validateToken(
    request: ValidateTokenRequest,
  ):
    | ValidateTokenResponse
    | Promise<ValidateTokenResponse>
    | Observable<ValidateTokenResponse> {
    return this.authService.validateToken(request.token);
  }
}
