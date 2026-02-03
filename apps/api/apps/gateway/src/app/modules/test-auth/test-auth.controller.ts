import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard, OptionalAuthGuard } from '@api/auth-tools';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

@ApiTags('Test Auth')
@Controller({
  path: 'test-auth',
  version: '1',
})
export class TestAuthController {
  @Get('public')
  @ApiOperation({ summary: 'Public route, no authentication needed' })
  getPublic(): string {
    return 'This is a public route.';
  }

  @Get('protected')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Protected route, requires a valid JWT' })
  getProtected(@Request() req: FastifyRequest): string {
    const userId = req.user?.id; // Using sub as per JwtPayload
    return `This is a protected route. User ID: ${userId}`;
  }

  @Get('optional')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Optional auth route, attaches user if JWT is valid',
  })
  getOptional(@Request() req: FastifyRequest): string {
    const userId = req.user?.id; // Using sub as per JwtPayload
    return `This is an optional auth route. User ID: ${userId || 'Guest'}`;
  }
}
