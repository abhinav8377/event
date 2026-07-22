import Event from '../events/event.model.js';
import User from '../users/user.model.js';
import Registration from '../registrations/registration.model.js';
import Community from './community.model.js';
import CommunityMember from './communityMember.model.js';
import CommunityMessage from './communityMessage.model.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

// The user must be registered (CONFIRMED/ALLOWED) for the linked event to join a community.
async function assertRegistered(userId: string, eventId: string) {
  const reg = await Registration.findOne({
    userId,
    eventId,
    status: { $in: ['CONFIRMED', 'ALLOWED'] },
  });
  if (!reg) throwErr('You must be registered for the event to access its community', 403);
}

function mapMessage(msg: any, organizerId: string) {
  const senderId = String((msg.senderId as any)._id || msg.senderId);
  return {
    id: msg._id,
    senderId,
    senderName: (msg.senderId as any).name || 'Unknown',
    isOrganizer: String(senderId) === organizerId,
    message: msg.message,
    type: msg.type || 'text',
    createdAt: msg.createdAt,
    replyToId: msg.replyToId || undefined,
    replyToMessage: msg.replyToMessage || undefined,
    replyToSender: msg.replyToSender || undefined,
    pollQuestion: msg.pollQuestion || undefined,
    pollOptions: msg.pollOptions ? msg.pollOptions.map((o: any) => ({ text: o.text, votes: o.votes.map((v: any) => String(v)) })) : undefined,
  };
}

export const createCommunity = async (organizerId: string, eventId: string, name: string, description = '') => {
  const event = await Event.findById(eventId);
  if (!event) throwErr('Event not found', 404);
  if (String(event.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);

  const existing = await Community.findOne({ eventId: event._id });
  if (existing) throwErr('A community already exists for this event', 409);

  const community = await Community.create({
    eventId: event._id,
    organizerId,
    name: name || `${event.title} Community`,
    description: description || event.description || '',
  });

  // Organizer is the admin of the community (approved member).
  await CommunityMember.findOneAndUpdate(
    { communityId: community._id, userId: organizerId },
    { communityId: community._id, userId: organizerId, status: 'APPROVED', joinedAt: new Date() },
    { upsert: true, new: true },
  );

  return { community };
};

export const getOrganizerCommunities = async (organizerId: string) => {
  const communities = await Community.find({ organizerId })
    .populate('eventId', 'title date bannerUrl')
    .sort({ createdAt: -1 });

  const result = await Promise.all(
    communities.map(async (c) => {
      const [pending, members] = await Promise.all([
        CommunityMember.countDocuments({ communityId: c._id, status: 'PENDING' }),
        CommunityMember.countDocuments({ communityId: c._id, status: 'APPROVED' }),
      ]);
      return {
        ...c.toObject(),
        pendingCount: pending,
        memberCount: members,
      };
    })
  );

  return { communities: result };
};

export const getCommunitiesForUser = async (userId: string) => {
  // Only show communities for events the user registered for.
  const registrations = await Registration.find({
    userId,
    status: { $in: ['CONFIRMED', 'ALLOWED'] },
  }).select('eventId');
  const eventIds = registrations.map((r) => r.eventId);

  const communities = await Community.find({ eventId: { $in: eventIds } })
    .populate('eventId', 'title date bannerUrl')
    .sort({ createdAt: -1 });

  const result = await Promise.all(
    communities.map(async (c) => {
      const membership = await CommunityMember.findOne({ communityId: c._id, userId });
      const memberCount = await CommunityMember.countDocuments({ communityId: c._id, status: 'APPROVED' });
      return {
        ...c.toObject(),
        memberCount,
        myStatus: membership ? membership.status : null,
      };
    })
  );

  return { communities: result };
};

export const requestJoin = async (userId: string, communityId: string) => {
  const community = await Community.findById(communityId);
  if (!community) throwErr('Community not found', 404);

  await assertRegistered(userId, String(community.eventId));

  const existing = await CommunityMember.findOne({ communityId: community._id, userId });
  if (existing) {
    if (existing.status === 'APPROVED') throwErr('You are already a member', 409);
    if (existing.status === 'PENDING') throwErr('Your request is already pending approval', 409);
    // Re-request after a denial.
    existing.status = 'PENDING';
    existing.joinedAt = undefined;
    await existing.save();
  } else {
    await CommunityMember.create({ communityId: community._id, userId, status: 'PENDING' });
  }

  // Notify organizer.
  const organizer = await User.findById(community.organizerId).select('name');
  return { message: 'Your request has been sent, wait for approval to join' };
};

export const getMembers = async (organizerId: string, communityId: string, search = '') => {
  const community = await Community.findById(communityId);
  if (!community) throwErr('Community not found', 404);
  if (String(community.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);

  const match: Record<string, any> = { communityId: community._id };
  if (search) match.$or = [
    { 'user.name': { $regex: search, $options: 'i' } },
    { 'user.email': { $regex: search, $options: 'i' } },
  ];

  const members = await CommunityMember.aggregate([
    { $match: { communityId: community._id } },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    ...(search
      ? [{ $match: { $or: [{ 'user.name': { $regex: search, $options: 'i' } }, { 'user.email': { $regex: search, $options: 'i' } }] } }]
      : []),
    { $sort: { status: 1, createdAt: 1 } },
    {
      $project: {
        _id: 1,
        status: 1,
        joinedAt: 1,
        createdAt: 1,
        userId: '$user._id',
        name: '$user.name',
        email: '$user.email',
      },
    },
  ]);

  return { members };
};

export const setMemberStatus = async (organizerId: string, communityId: string, memberUserId: string, status: 'APPROVED' | 'DENIED') => {
  const community = await Community.findById(communityId);
  if (!community) throwErr('Community not found', 404);
  if (String(community.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);
  if (String(community.organizerId) === String(memberUserId)) throwErr('Cannot modify the organizer', 403);

  const member = await CommunityMember.findOne({ communityId: community._id, userId: memberUserId });
  if (!member) throwErr('Member not found', 404);

  member.status = status;
  member.joinedAt = status === 'APPROVED' ? new Date() : undefined;
  await member.save();

  // Auto-send welcome message when member is approved
  if (status === 'APPROVED') {
    const approvedUser = await User.findById(memberUserId).select('name');
    const userName = approvedUser?.name || 'A new member';
    try {
      const welcomeMsg = await CommunityMessage.create({
        communityId: community._id,
        senderId: organizerId,
        message: `${userName} joined the community!`,
        type: 'system',
      });
      await welcomeMsg.populate('senderId', 'name');
      const io = (await import('../../socket.js')).getIO();
      const welcomeData = mapMessage(welcomeMsg, organizerId);
      io.to(`community:${communityId}`).emit('community:message', welcomeData);
    } catch {
      // welcome message is best-effort
    }
  }

  return { member: { id: member._id, status: member.status } };
};

export const removeMember = async (organizerId: string, communityId: string, memberUserId: string) => {
  const community = await Community.findById(communityId);
  if (!community) throwErr('Community not found', 404);
  if (String(community.organizerId) !== String(organizerId)) throwErr('Forbidden', 403);
  if (String(community.organizerId) === String(memberUserId)) throwErr('Cannot remove the organizer', 403);

  await CommunityMember.deleteOne({ communityId: community._id, userId: memberUserId });
  return { success: true };
};

export const leaveCommunity = async (userId: string, communityId: string) => {
  const community = await Community.findById(communityId);
  if (!community) throwErr('Community not found', 404);
  if (String(community.organizerId) === String(userId)) throwErr('The organizer cannot leave the community', 403);

  await CommunityMember.deleteOne({ communityId: community._id, userId });
  return { success: true };
};

export const getCommunityForChat = async (userId: string, communityId: string) => {
  const community = await Community.findById(communityId)
    .populate('eventId', 'title date bannerUrl');
  if (!community) throwErr('Community not found', 404);

  const membership = await CommunityMember.findOne({ communityId: community._id, userId });
  if (!membership || membership.status !== 'APPROVED') throwErr('You are not a member of this community', 403);

  const [memberCount, members, messages] = await Promise.all([
    CommunityMember.countDocuments({ communityId: community._id, status: 'APPROVED' }),
    CommunityMember.find({ communityId: community._id, status: 'APPROVED' })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 }),
    CommunityMessage.find({ communityId: community._id })
      .populate('senderId', 'name')
      .sort({ createdAt: 1 })
      .limit(200),
  ]);

  const organizerId = String(community.organizerId);

  return {
    community: { ...community.toObject(), memberCount, organizerId },
    members: members.map((m) => ({
      id: (m.userId as any)._id,
      name: (m.userId as any).name,
      email: (m.userId as any).email,
      isOrganizer: String((m.userId as any)._id) === organizerId,
    })),
    messages: messages.map((msg) => mapMessage(msg, organizerId)),
  };
};

export const saveMessage = async (
  communityId: string,
  senderId: string,
  message: string,
  replyToId?: string,
) => {
  const extra: Record<string, any> = {};
  if (replyToId) {
    const replyToMsg = await CommunityMessage.findById(replyToId).populate('senderId', 'name');
    if (replyToMsg) {
      extra.replyToId = replyToMsg._id;
      extra.replyToMessage = replyToMsg.message?.slice(0, 150);
      extra.replyToSender = (replyToMsg.senderId as any).name || 'Unknown';
    }
  }
  const msg = await CommunityMessage.create({ communityId, senderId, message, type: 'text', ...extra });
  await msg.populate('senderId', 'name');
  const community = await Community.findById(communityId).select('organizerId');
  const organizerId = community ? String(community.organizerId) : '';
  return mapMessage(msg, organizerId);
};

export const savePollMessage = async (
  communityId: string,
  senderId: string,
  pollQuestion: string,
  pollOptions: string[],
) => {
  const options = pollOptions.filter(Boolean).map((text) => ({ text, votes: [] }));
  const msg = await CommunityMessage.create({
    communityId,
    senderId,
    message: pollQuestion,
    type: 'poll',
    pollQuestion,
    pollOptions: options,
  });
  await msg.populate('senderId', 'name');
  const community = await Community.findById(communityId).select('organizerId');
  const organizerId = community ? String(community.organizerId) : '';
  return mapMessage(msg, organizerId);
};

export const votePoll = async (
  communityId: string,
  messageId: string,
  optionIndex: number,
  userId: string,
) => {
  const msg = await CommunityMessage.findOne({ _id: messageId, communityId, type: 'poll' });
  if (!msg) throwErr('Poll not found', 404);
  if (!msg.pollOptions || optionIndex < 0 || optionIndex >= msg.pollOptions.length) {
    throwErr('Invalid poll option', 400);
  }

  const userObjectId = userId as any;
  const option = msg.pollOptions[optionIndex];

  // Toggle vote: if already voted, remove; otherwise add
  const idx = option.votes.findIndex((v) => String(v) === String(userId));
  if (idx !== -1) {
    option.votes.splice(idx, 1);
  } else {
    option.votes.push(userObjectId);
  }

  msg.markModified('pollOptions');
  await msg.save();

  const community = await Community.findById(communityId).select('organizerId');
  const organizerId = community ? String(community.organizerId) : '';
  return mapMessage(msg, organizerId);
};
