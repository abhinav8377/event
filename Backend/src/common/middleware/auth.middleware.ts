import { verifyToken } from '../utils/jwt.util.js';
import User from '../../modules/users/user.model.js';
import type { AuthRequest, RoleName } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      res.status(401).json({ success: false, message: 'Unauthorized', errors: [] });
      return;
    }
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).populate('roleId');
    if (!user || user.isBlocked) {
      res.status(401).json({ success: false, message: 'Unauthorized', errors: [] });
      return;
    }
    if (user.lastLogoutAt && (decoded.iat as number) * 1000 < user.lastLogoutAt.getTime()) {
      res.status(401).json({ success: false, message: 'Token has been invalidated. Please login again.', errors: [] });
      return;
    }
    req.user = user;
    req.role = (user.roleId && (user.roleId as unknown as { name: RoleName }).name) || ('USER' as RoleName);
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token', errors: [] });
  }
};

export default authMiddleware;
