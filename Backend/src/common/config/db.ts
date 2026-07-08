import mongoose from 'mongoose';
import Role from '../../modules/users/role.model.js';

const seedRoles = async (): Promise<void> => {
  const roles = ['USER', 'ORGANIZER', 'ADMIN'] as const;
  await Promise.all(roles.map((name) => Role.updateOne({ name }, { name }, { upsert: true })));
};

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event-platform';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
  await seedRoles();
};

export default connectDB;
