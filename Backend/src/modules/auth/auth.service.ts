import crypto from 'crypto';
import User from '../users/user.model.js';
import Role from '../users/role.model.js';
import { signToken } from '../../common/utils/jwt.util.js';
import { sendEmail } from '../../common/utils/email.util.js';
import type { ServiceError } from '../../types/index.js';

function throwErr(message: string, status: number): never {
  const err = new Error(message) as ServiceError;
  err.status = status;
  throw err;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
  organizationName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

export const registerUser = async ({ name, email, password, role, organizationName }: RegisterInput) => {
  if (!name || !email || !password) throwErr('Name, email and password are required', 400);
  if (password.length < 6) throwErr('Password must be at least 6 characters', 400);

  const exists = await User.findOne({ email });
  if (exists) throwErr('Email already registered', 409);

  const roleName = role === 'ORGANIZER' ? 'ORGANIZER' : 'USER';
  const roleDoc = await Role.findOne({ name: roleName });
  if (!roleDoc) throwErr('Role not found', 500);
  const user = await User.create({
    name,
    email,
    password,
    roleId: roleDoc._id,
    organization:
      roleName === 'ORGANIZER'
        ? { name: organizationName || name, verified: false }
        : undefined,
  });

  const token = signToken({ id: user._id });
  return { token, user: user.toSafeObject(roleName) };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  if (!email || !password) throwErr('Email and password are required', 400);

  const user = await User.findOne({ email })
    .select('+password')
    .populate('roleId');
  if (!user || !(await user.comparePassword(password))) throwErr('Invalid credentials', 401);
  if (user.isBlocked) throwErr('Account is blocked', 403);

  const token = signToken({ id: user._id });
  return { token, user: user.toSafeObject() };
};

export const logoutUser = async (user: any) => {
  user.lastLogoutAt = new Date();
  await user.save();
};

export const forgotPassword = async ({ email }: { email: string }) => {
  const user = await User.findOne({ email });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html: `<p>Use this token to reset your password (valid 15 minutes):</p><p><b>${token}</b></p>`,
    });
  }
};

export const resetPassword = async ({ token, password }: ResetPasswordInput) => {
  if (!token || !password) throwErr('Token and new password are required', 400);
  if (password.length < 6) throwErr('Password must be at least 6 characters', 400);

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throwErr('Invalid or expired reset token', 400);

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

export const getMe = (user: any) => user.toSafeObject();
