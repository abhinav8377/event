import type { Request, Response, NextFunction } from 'express';
import type { ServiceError } from '../../types/index.js';

const errorMiddleware = (err: ServiceError, req: Request, res: Response, next: NextFunction): void => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
};

export default errorMiddleware;
