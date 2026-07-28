import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcrypt';
import type { IUser, SafeUser } from '../../types/index.js';

interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(roleName?: string): SafeUser;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    organization: {
      name: { type: String },
      verified: { type: Boolean, default: false },
    },
    isBlocked: { type: Boolean, default: false },
    lastLogoutAt: { type: Date, default: null },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.index({ roleId: 1, isBlocked: 1 });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function (roleName?: string): SafeUser {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: roleName || (this.roleId && (this.roleId as unknown as { name: string }).name),
    organization: this.organization,
    isBlocked: this.isBlocked,
    createdAt: this.createdAt,
  };
};

export default mongoose.model<IUser, UserModel>('User', userSchema);
