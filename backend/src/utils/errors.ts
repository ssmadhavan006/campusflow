export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code?: string) {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code?: string) {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code?: string) {
    super(message, 403, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', code?: string) {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code?: string) {
    super(message, 409, code);
  }
}

export function wrapError(error: any): AppError {
  if (error instanceof AppError) return error;

  const msg = error.message || 'An unexpected error occurred';
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('not found') || lowerMsg.includes('no event found')) {
    return new NotFoundError(msg);
  }
  if (lowerMsg.includes('already exists') || lowerMsg.includes('already a member') || lowerMsg.includes('duplicate')) {
    return new ConflictError(msg);
  }
  if (lowerMsg.includes('not authorized') || lowerMsg.includes('only the') || lowerMsg.includes('cannot leave') || lowerMsg.includes('only an organizer')) {
    return new ForbiddenError(msg);
  }
  if (lowerMsg.includes('unauthorized') || lowerMsg.includes('token') || lowerMsg.includes('invalid credentials') || lowerMsg.includes('verify your email') || lowerMsg.includes('verify email') || lowerMsg.includes('not verified')) {
    return new UnauthorizedError(msg);
  }
  return new BadRequestError(msg);
}
