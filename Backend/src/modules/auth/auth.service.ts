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

  if (roleName === 'ORGANIZER') {
    const verificationEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">EventHub</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Event Discovery & Management Platform</p>
        </div>
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 70px; height: 70px; background: #f0fdf4; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 36px;">✅</span>
            </div>
            <h2 style="color: #1e293b; margin: 0 0 10px; font-size: 22px;">Account Created Successfully!</h2>
            <p style="color: #64748b; margin: 0; font-size: 15px;">Welcome aboard, ${user.name}!</p>
          </div>
          <div style="background: #fefce8; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #92400e; margin: 0 0 8px; font-size: 16px;">⏳ Verification in Progress</h3>
            <p style="color: #a16207; margin: 0; font-size: 14px; line-height: 1.6;">
              Your organizer account is currently under review by our admin team. 
              Verification typically takes up to <strong>24 hours</strong>. 
              You will receive an email notification once your account has been verified.
            </p>
          </div>
          <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #334155; margin: 0 0 12px; font-size: 15px;">Here's what happens next:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; color: #6366f1; font-weight: bold;">1.</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;">Our admin team reviews your application</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; color: #6366f1; font-weight: bold;">2.</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;">Once verified, you can log in and access your dashboard</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: top; width: 30px; color: #6366f1; font-weight: bold;">3.</td>
                <td style="padding: 8px 0; color: #475569; font-size: 14px;">Start creating and managing your events!</td>
              </tr>
            </table>
          </div>
          <div style="background: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
            <h3 style="color: #1e40af; margin: 0 0 8px; font-size: 15px;">📋 Your Account Details</h3>
            <p style="color: #3b82f6; margin: 0; font-size: 14px;">
              <strong>Name:</strong> ${user.name}<br/>
              <strong>Email:</strong> ${user.email}<br/>
              <strong>Organization:</strong> ${user.organization?.name || 'N/A'}<br/>
              <strong>Role:</strong> Organizer
            </p>
          </div>
          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; margin: 0; font-size: 13px;">
              If you have any questions, feel free to contact our support team.
            </p>
            <p style="color: #94a3b8; margin: 10px 0 0; font-size: 13px;">
              This is an automated email. Please do not reply directly to this message.
            </p>
          </div>
        </div>
      </div>
    `;
    sendEmail({
      to: user.email,
      subject: 'EventHub - Account Created! Verification Pending',
      html: verificationEmailHtml,
    }).catch(() => {});
  }

  return { token, user: user.toSafeObject(roleName) };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  if (!email || !password) throwErr('Email and password are required', 400);

  const user = await User.findOne({ email })
    .select('+password')
    .populate('roleId');
  if (!user || !(await user.comparePassword(password))) throwErr('Invalid credentials', 401);
  if (user.isBlocked) throwErr('Account is blocked', 403);

  const userRole = (user.roleId as unknown as { name: string })?.name;
  if (userRole === 'ORGANIZER' && user.organization && !user.organization.verified) {
    throwErr('Access denied. Your account is not verified yet. Please contact the administrator.', 403);
  }

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
