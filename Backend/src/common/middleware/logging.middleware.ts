import type { Request, Response, NextFunction } from 'express';
import RequestLog from '../../modules/admin/requestlog.model.js';

const IGNORED_PATHS = ['/api/health', '/favicon.ico'];

const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (IGNORED_PATHS.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }

  const start = Date.now();
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    const duration = Date.now() - start;
    const user = (req as any).user;
    const role = (req as any).role;

    if (role === 'ADMIN') {
      return originalJson(body);
    }

    const isAdminRoute = req.originalUrl.startsWith('/api/admin');

    const logData = {
      method: req.method,
      url: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      userId: user?._id || null,
      userName: user?.name || '',
      userRole: role || '',
      duration,
      contentLength: body ? JSON.stringify(body).length : 0,
      isAdminRoute,
    };

    RequestLog.create(logData).catch(() => {});

    return originalJson(body);
  };

  next();
};

export default loggingMiddleware;
