import * as communityService from './community.service.js';
import { success, error } from '../../common/utils/response.util.js';
import type { AuthRequest } from '../../types/index.js';
import type { Response, NextFunction } from 'express';

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { eventId, name, description } = req.body;
    if (!eventId) { error(res, 'Event ID is required', 400); return; }
    const data = await communityService.createCommunity(String(req.user!._id), String(eventId), name, description);
    success(res, 'Community created', data, 201);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const organizerCommunities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.getOrganizerCommunities(String(req.user!._id));
    success(res, 'Communities fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const userCommunities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.getCommunitiesForUser(String(req.user!._id));
    success(res, 'Communities fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const requestJoin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.requestJoin(String(req.user!._id), String(req.params.communityId));
    success(res, data.message, data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const members = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = (req.query.search as string) || '';
    const data = await communityService.getMembers(String(req.user!._id), String(req.params.communityId), search);
    success(res, 'Members fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const approveMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.setMemberStatus(String(req.user!._id), String(req.params.communityId), String(req.params.userId), 'APPROVED');
    success(res, 'Member approved', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const denyMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.setMemberStatus(String(req.user!._id), String(req.params.communityId), String(req.params.userId), 'DENIED');
    success(res, 'Member denied', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.removeMember(String(req.user!._id), String(req.params.communityId), String(req.params.userId));
    success(res, 'Member removed', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const leave = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.leaveCommunity(String(req.user!._id), String(req.params.communityId));
    success(res, 'Left community', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};

export const chatData = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await communityService.getCommunityForChat(String(req.user!._id), String(req.params.communityId));
    success(res, 'Chat data fetched', data);
  } catch (err) {
    if ((err as any).status) error(res, (err as Error).message, (err as any).status);
    else next(err);
  }
};
