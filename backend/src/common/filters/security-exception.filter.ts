import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class SecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorCode = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
      } else {
        message = exception.message;
        errorCode = 'HTTP_EXCEPTION';
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = this.handlePrismaError(exception);
      errorCode = 'DATABASE_ERROR';
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      errorCode = 'VALIDATION_ERROR';
    } else if (exception instanceof Error) {
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected error occurred';
        errorCode = 'INTERNAL_ERROR';
      } else {
        message = exception.message;
        errorCode = 'ERROR';
      }
    }

    // Log the error with context
    this.logError(exception, request, status);

    // Prepare safe error response
    const errorResponse = {
      statusCode: status,
      error: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add request ID if available
    if (request.headers['x-request-id']) {
      errorResponse['requestId'] = request.headers['x-request-id'];
    }

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): string {
    switch (error.code) {
      case 'P2002':
        return 'A record with this information already exists';
      case 'P2025':
        return 'Record not found';
      case 'P2003':
        return 'Invalid reference to related record';
      case 'P2014':
        return 'Invalid relation data';
      default:
        return 'Database operation failed';
    }
  }

  private logError(exception: unknown, request: Request, status: number) {
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';

    if (status >= 500) {
      this.logger.error(
        `Server Error: ${method} ${url} - ${status} - IP: ${ip} - User-Agent: ${userAgent}`,
        exception instanceof Error ? exception.stack : exception,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `Client Error: ${method} ${url} - ${status} - IP: ${ip} - User-Agent: ${userAgent}`,
      );
    }
  }
}