import mongoose, { Schema } from 'mongoose';
import type { IRole } from '../../types/index.js';

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['USER', 'ORGANIZER', 'ADMIN'],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRole>('Role', roleSchema);
