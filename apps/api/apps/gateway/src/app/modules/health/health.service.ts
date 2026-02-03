import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHello(): { message: string; docs: string } {
    return {
      message: 'Welcome to the Recomend API!',
      docs: '/api-docs',
    };
  }

  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
