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

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!ioInstance) throw new Error('Socket.IO not initialized');
  return ioInstance;
}

// Track typing timers per community per user
const typingTimers = new Map<string, NodeJS.Timeout>();

export function initSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: { origin: true, credentials: true },
  });
  ioInstance = io;

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

    // --- Join a community chat room ---
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
      const key = `${communityId}:${user.userId}`;
      const timer = typingTimers.get(key);
      if (timer) clearTimeout(timer);
      typingTimers.delete(key);
    });

    // --- Typing indicators ---
    socket.on('community:typing', (payload: { communityId: string; isTyping: boolean }) => {
      const { communityId, isTyping } = payload;
      const key = `${communityId}:${user.userId}`;
      const existingTimer = typingTimers.get(key);
      if (existingTimer) clearTimeout(existingTimer);

      if (isTyping) {
        socket.to(`community:${communityId}`).emit('community:typing', {
          userId: user.userId,
          communityId,
        });
        // Auto-clear after 3 seconds of no typing event
        const timer = setTimeout(() => {
          socket.to(`community:${communityId}`).emit('community:stopTyping', {
            userId: user.userId,
            communityId,
          });
          typingTimers.delete(key);
        }, 3000);
        typingTimers.set(key, timer);
      } else {
        typingTimers.delete(key);
        socket.to(`community:${communityId}`).emit('community:stopTyping', {
          userId: user.userId,
          communityId,
        });
      }
    });

    // --- Send a text message (with optional reply) ---
    socket.on('community:message', async (
      payload: { communityId: string; message: string; replyToId?: string },
      ack?: (r: any) => void,
    ) => {
      try {
        const { communityId, message, replyToId } = payload;
        if (!message || !message.trim()) return ack?.({ ok: false, error: 'Empty message' });
        const member = await CommunityMember.findOne({
          communityId,
          userId: user.userId,
          status: 'APPROVED',
        });
        if (!member) return ack?.({ ok: false, error: 'Forbidden' });

        const saved = await communityService.saveMessage(communityId, user.userId, message.trim(), replyToId);
        io.to(`community:${communityId}`).emit('community:message', saved);
        // Clear typing indicator
        const key = `${communityId}:${user.userId}`;
        const timer = typingTimers.get(key);
        if (timer) clearTimeout(timer);
        typingTimers.delete(key);
        socket.to(`community:${communityId}`).emit('community:stopTyping', {
          userId: user.userId,
          communityId,
        });
        ack?.({ ok: true, message: saved });
      } catch {
        ack?.({ ok: false, error: 'Server error' });
      }
    });

    // --- Create a poll ---
    socket.on('community:poll:create', async (
      payload: { communityId: string; question: string; options: string[] },
      ack?: (r: any) => void,
    ) => {
      try {
        const { communityId, question, options } = payload;
        if (!question || !options || options.length < 2) {
          return ack?.({ ok: false, error: 'A poll needs a question and at least 2 options' });
        }
        const member = await CommunityMember.findOne({
          communityId,
          userId: user.userId,
          status: 'APPROVED',
        });
        if (!member) return ack?.({ ok: false, error: 'Forbidden' });

        const saved = await communityService.savePollMessage(communityId, user.userId, question, options);
        io.to(`community:${communityId}`).emit('community:message', saved);
        ack?.({ ok: true, message: saved });
      } catch {
        ack?.({ ok: false, error: 'Server error' });
      }
    });

    // --- Vote on a poll ---
    socket.on('community:poll:vote', async (
      payload: { communityId: string; messageId: string; optionIndex: number },
      ack?: (r: any) => void,
    ) => {
      try {
        const { communityId, messageId, optionIndex } = payload;
        const member = await CommunityMember.findOne({
          communityId,
          userId: user.userId,
          status: 'APPROVED',
        });
        if (!member) return ack?.({ ok: false, error: 'Forbidden' });

        const updated = await communityService.votePoll(communityId, messageId, optionIndex, user.userId);
        io.to(`community:${communityId}`).emit('community:poll:update', updated);
        ack?.({ ok: true, message: updated });
      } catch {
        ack?.({ ok: false, error: 'Server error' });
      }
    });
  });

  return io;
}
