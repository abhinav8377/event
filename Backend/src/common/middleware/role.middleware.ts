import type { AuthRequest, RoleName } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

const permit = (...allowed: RoleName[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role || !allowed.includes(req.role)) {
      res.status(403).json({ success: false, message: 'Forbidden', errors: [] });
      return;
    }
    next();
  };

export default permit;
