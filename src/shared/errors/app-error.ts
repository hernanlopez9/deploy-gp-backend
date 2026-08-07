export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string) {
    return new AppError(message, 400);
  }

  static unauthorized(message: string) {
    return new AppError(message, 401);
  }

  static notFound(message: string) {
    return new AppError(message, 404);
  }

  static internal(message: string) {
    return new AppError(message, 500);
  }
}
