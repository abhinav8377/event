import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { verifyToken } from './common/utils/jwt.util.js';
import User from './modules/users/user.model.js';
import CommunityMember from './modules/communities/communityMember.model.js';
import * as communityService from './modules/communities/community.service.js';

interface SocketUser {
  userId: string;
  role: string;
}

export function initSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: { origin: true, credentials: true },
  });

  // Middleware: authenticate socket connections via JWT (auth.token or query.token).
  io.use(async (socket, next) => {
    try {
      const token: string | undefined =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string);
      if (!token) return next(new Error('Unauthorized'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).populate('roleId');
      if (!user) return next(new Error('Unauthorized'));
      const role = (user.roleId && (user.roleId as unknown as { name: string }).name) || 'USER';
      (socket.data as any).user = { userId: String(user._id), role } as SocketUser;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket.data as any).user as SocketUser;

    // Join a community chat room (only if approved member).
    socket.on('community:join', async (communityId: string, ack?: (r: any) => void) => {
      try {
        const member = await CommunityMember.findOne({
          communityId,
          userId: user.userId,
          status: 'APPROVED',
        });
        if (!member) return ack?.({ ok: false, error: 'Forbidden' });
        socket.join(`community:${communityId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ ok: false, error: 'Server error' });
      }
    });

    socket.on('community:leave', (communityId: string) => {
      socket.leave(`community:${communityId}`);
    });

    // Send a chat message to a community room.
    socket.on('community:message', async (payload: { communityId: string; message: string }, ack?: (r: any) => void) => {
      try {
        const { communityId, message } = payload;
        if (!message || !message.trim()) return ack?.({ ok: false, error: 'Empty message' });
        const member = await CommunityMember.findOne({
          communityId,
          userId: user.userId,
          status: 'APPROVED',
        });
        if (!member) return ack?.({ ok: false, error: 'Forbidden' });

        const saved = await communityService.saveMessage(communityId, user.userId, message.trim());
        io.to(`community:${communityId}`).emit('community:message', saved);
        ack?.({ ok: true, message: saved });
      } catch {
        ack?.({ ok: false, error: 'Server error' });
      }
    });
  });

  return io;
}
