import User from './user.model.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

export const getProfile = (user: any) => {
  return { user: user.toSafeObject() };
};

export const updateProfile = async (user: any, { name, organizationName }: { name?: string; organizationName?: string }) => {
  if (name) user.name = name;
  if (organizationName && user.roleId && user.roleId.name === 'ORGANIZER') {
    user.organization = user.organization || {};
    user.organization.name = organizationName;
  }
  await user.save();
  return { user: user.toSafeObject() };
};

export const changePassword = async (userId: string, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
  if (!currentPassword || !newPassword) throwErr('Current and new password are required', 400);
  if (newPassword.length < 6) throwErr('Password must be at least 6 characters', 400);

  const user = await User.findById(userId).select('+password');
  if (!user) throwErr('User not found', 404);
  if (!(await user.comparePassword(currentPassword))) throwErr('Current password is incorrect', 401);
  user.password = newPassword;
  await user.save();
};

export const deleteUserAccount = async (userId: string) => {
  await User.deleteOne({ _id: userId });
};
