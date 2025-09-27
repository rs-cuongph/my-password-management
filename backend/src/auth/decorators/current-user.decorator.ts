import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface CurrentUser {
  userId: number;
  email: string;
}

interface RequestWithUser {
  user?: {
    userId: number | string;
    email: string;
  };
}

/**
 * Decorator to extract current user from request with validation
 * Usage: @CurrentUser() user: CurrentUser
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Validate user object
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Validate required fields
    if (!user.userId || !user.email) {
      throw new UnauthorizedException('Invalid user data in token');
    }

    // Ensure userId is a number
    const userId =
      typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID format');
    }

    return {
      userId,
      email: user.email,
    };
  },
);
