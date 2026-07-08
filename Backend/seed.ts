import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

import Role from './src/modules/users/role.model.js';
import User from './src/modules/users/user.model.js';
import Event from './src/modules/events/event.model.js';
import Registration from './src/modules/registrations/registration.model.js';
import Attendance from './src/modules/attendance/attendance.model.js';
import Certificate from './src/modules/certificates/certificate.model.js';
import Feedback from './src/modules/feedback/feedback.model.js';
import Notification from './src/modules/notifications/notification.model.js';
import type { IRole, IUser, IEvent } from './src/types/index.js';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✓ MongoDB connected');
  } catch (error) {
    console.error('✗ MongoDB connection error:', (error as Error).message);
    process.exit(1);
  }
};

const clearDatabase = async (): Promise<void> => {
  console.log('\n🗑️  Clearing existing data...');
  await Role.deleteMany({});
  await User.deleteMany({});
  await Event.deleteMany({});
  await Registration.deleteMany({});
  await Attendance.deleteMany({});
  await Certificate.deleteMany({});
  await Feedback.deleteMany({});
  await Notification.deleteMany({});
  console.log('✓ Database cleared');
};

const seedRoles = async (): Promise<IRole[]> => {
  console.log('\n👥 Seeding roles...');
  const roles = [
    { name: 'USER' },
    { name: 'ORGANIZER' },
    { name: 'ADMIN' },
  ];

  const createdRoles = await Role.insertMany(roles) as any;
  console.log(`✓ Created ${createdRoles.length} roles`);
  return createdRoles as IRole[];
};

const seedUsers = async (roles: IRole[]): Promise<IUser[]> => {
  console.log('\n👤 Seeding users...');

  const userRole = roles.find(r => r.name === 'USER')!;
  const organizerRole = roles.find(r => r.name === 'ORGANIZER')!;
  const adminRole = roles.find(r => r.name === 'ADMIN')!;

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@eventplatform.dev',
      password: hashedPassword,
      roleId: adminRole._id,
      organization: { name: 'Platform Admin', verified: true },
    },
    {
      name: 'Tech Events Inc',
      email: 'organizer@techevents.com',
      password: hashedPassword,
      roleId: organizerRole._id,
      organization: { name: 'Tech Events Inc', verified: true },
    },
    {
      name: 'Community Hub',
      email: 'organizer@communityhub.org',
      password: hashedPassword,
      roleId: organizerRole._id,
      organization: { name: 'Community Hub', verified: true },
    },
    {
      name: 'Business Connect',
      email: 'organizer@businessconnect.com',
      password: hashedPassword,
      roleId: organizerRole._id,
      organization: { name: 'Business Connect', verified: false },
    },
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      roleId: userRole._id,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: hashedPassword,
      roleId: userRole._id,
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      password: hashedPassword,
      roleId: userRole._id,
    },
    {
      name: 'Sarah Williams',
      email: 'sarah.williams@example.com',
      password: hashedPassword,
      roleId: userRole._id,
    },
    {
      name: 'David Brown',
      email: 'david.brown@example.com',
      password: hashedPassword,
      roleId: userRole._id,
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      password: hashedPassword,
      roleId: userRole._id,
    },
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✓ Created ${createdUsers.length} users`);
  return createdUsers;
};

const seedEvents = async (users: IUser[]): Promise<IEvent[]> => {
  console.log('\n📅 Seeding events...');

  const organizers = users.filter(u => String(u.roleId) === String(users.find(u => u.email.includes('organizer'))!.roleId));

  const events = [
    {
      title: 'Web Development Bootcamp 2026',
      description: 'Comprehensive 3-day bootcamp covering React, Node.js, and MongoDB. Perfect for beginners and intermediate developers looking to level up their skills.',
      category: 'TECH',
      venue: 'Tech Hub Convention Center, Room 301',
      date: new Date('2026-08-15T09:00:00'),
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      capacity: 100,
      status: 'PUBLISHED',
      organizerId: organizers[0]._id,
      views: 245,
    },
    {
      title: 'AI & Machine Learning Summit',
      description: 'Join industry experts to explore the latest trends in AI and ML. Featuring keynote speakers, hands-on workshops, and networking opportunities.',
      category: 'TECH',
      venue: 'Online (Zoom)',
      date: new Date('2026-08-20T10:00:00'),
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      capacity: 500,
      status: 'PUBLISHED',
      organizerId: organizers[0]._id,
      views: 432,
    },
    {
      title: 'Startup Pitch Competition',
      description: 'Early-stage startups compete for $50,000 in funding. Watch innovative ideas come to life and network with investors and entrepreneurs.',
      category: 'BUSINESS',
      venue: 'Innovation Center',
      date: new Date('2026-08-25T02:00:00'),
      startTime: '02:00 PM',
      endTime: '06:00 PM',
      capacity: 150,
      status: 'PUBLISHED',
      organizerId: organizers[1]._id,
      views: 189,
    },
    {
      title: 'Digital Marketing Masterclass',
      description: 'Learn SEO, social media marketing, content strategy, and analytics from industry professionals. Certificate provided upon completion.',
      category: 'BUSINESS',
      venue: 'Business School Auditorium',
      date: new Date('2026-09-01T01:00:00'),
      startTime: '01:00 PM',
      endTime: '05:00 PM',
      capacity: 80,
      status: 'PUBLISHED',
      organizerId: organizers[2]._id,
      views: 156,
    },
    {
      title: 'Community Cleanup Drive',
      description: 'Join us in making our city cleaner! Volunteer opportunity with free lunch and certificate of participation.',
      category: 'COMMUNITY',
      venue: 'Central Park',
      date: new Date('2026-09-05T08:00:00'),
      startTime: '08:00 AM',
      endTime: '12:00 PM',
      capacity: 200,
      status: 'PUBLISHED',
      organizerId: organizers[1]._id,
      views: 312,
    },
    {
      title: 'Youth Leadership Workshop',
      description: 'Empowering young leaders through interactive sessions on communication, teamwork, and problem-solving.',
      category: 'EDUCATION',
      venue: 'Youth Center',
      date: new Date('2026-09-10T10:00:00'),
      startTime: '10:00 AM',
      endTime: '03:00 PM',
      capacity: 60,
      status: 'PUBLISHED',
      organizerId: organizers[1]._id,
      views: 98,
    },
    {
      title: 'Tech Talk: Cloud Computing',
      description: 'Exploring AWS, Azure, and GCP - which cloud platform is right for your project?',
      category: 'TECH',
      venue: 'Tech Hub Conference Room',
      date: new Date('2026-07-01T06:00:00'),
      startTime: '06:00 PM',
      endTime: '08:00 PM',
      capacity: 50,
      status: 'PUBLISHED',
      organizerId: organizers[0]._id,
      views: 178,
    },
    {
      title: 'Networking Mixer for Professionals',
      description: 'Connect with professionals from various industries. Refreshments provided.',
      category: 'BUSINESS',
      venue: 'Downtown Hotel Ballroom',
      date: new Date('2026-06-20T07:00:00'),
      startTime: '07:00 PM',
      endTime: '10:00 PM',
      capacity: 120,
      status: 'PUBLISHED',
      organizerId: organizers[1]._id,
      views: 267,
    },
    {
      title: 'Cybersecurity Awareness Workshop',
      description: 'Learn how to protect yourself and your organization from cyber threats.',
      category: 'TECH',
      venue: 'TBD',
      date: new Date('2026-10-15T02:00:00'),
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      capacity: 75,
      status: 'DRAFT',
      organizerId: organizers[0]._id,
      views: 12,
    },
    {
      title: 'Outdoor Music Festival',
      description: 'Due to weather concerns, this event has been cancelled.',
      category: 'CULTURE',
      venue: 'City Park Amphitheater',
      date: new Date('2026-08-18T04:00:00'),
      startTime: '04:00 PM',
      endTime: '10:00 PM',
      capacity: 500,
      status: 'CANCELLED',
      organizerId: organizers[1]._id,
      views: 521,
    },
  ];

  const createdEvents = await Event.insertMany(events) as any;
  console.log(`✓ Created ${createdEvents.length} events`);
  return createdEvents as IEvent[];
};

interface SeedRegistration {
  userId: string;
  eventId: string;
  ticketNumber: string;
  status: string;
}

const seedRegistrations = async (users: IUser[], events: IEvent[]) => {
  console.log('\n🎟️  Seeding registrations...');

  const regularUsers = users.filter(u => u.email.includes('example.com'));
  const publishedEvents = events.filter(e => e.status === 'PUBLISHED');

  const registrations: SeedRegistration[] = [];
  let ticketCounter = 1000;

  registrations.push({ userId: regularUsers[0]._id.toString(), eventId: publishedEvents[0]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[0]._id.toString(), eventId: publishedEvents[1]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[0]._id.toString(), eventId: publishedEvents[6]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[1]._id.toString(), eventId: publishedEvents[1]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[1]._id.toString(), eventId: publishedEvents[2]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[1]._id.toString(), eventId: publishedEvents[7]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[2]._id.toString(), eventId: publishedEvents[0]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[2]._id.toString(), eventId: publishedEvents[3]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[2]._id.toString(), eventId: publishedEvents[6]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[3]._id.toString(), eventId: publishedEvents[4]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[3]._id.toString(), eventId: publishedEvents[5]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[3]._id.toString(), eventId: publishedEvents[7]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[4]._id.toString(), eventId: publishedEvents[2]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[4]._id.toString(), eventId: publishedEvents[4]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[5]._id.toString(), eventId: publishedEvents[1]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });
  registrations.push({ userId: regularUsers[5]._id.toString(), eventId: publishedEvents[5]._id.toString(), ticketNumber: `TKT-${ticketCounter++}`, status: 'CONFIRMED' });

  const createdRegistrations = await Registration.insertMany(registrations);
  console.log(`✓ Created ${createdRegistrations.length} registrations`);
  return createdRegistrations;
};

const seedAttendance = async (registrations: any[], users: IUser[]) => {
  console.log('\n✅ Seeding attendance...');

  const pastRegistrations = await Registration.find().populate('eventId');
  const attendedRegistrations = pastRegistrations.filter(r =>
    r.eventId && new Date((r.eventId as unknown as IEvent).date) < new Date()
  );

  const organizer = users.find(u => u.email === 'organizer@techevents.com')!;

  const attendanceRecords = attendedRegistrations.map(reg => ({
    registrationId: reg._id,
    eventId: (reg.eventId as unknown as IEvent)._id,
    userId: reg.userId,
    status: Math.random() > 0.2 ? 'PRESENT' : 'LATE',
    checkedInAt: new Date((reg.eventId as unknown as IEvent).date),
    checkedInBy: organizer._id,
  }));

  const createdAttendance = await Attendance.insertMany(attendanceRecords);
  console.log(`✓ Created ${createdAttendance.length} attendance records`);
  return createdAttendance;
};

const seedCertificates = async (attendanceRecords: any[]) => {
  console.log('\n🎓 Seeding certificates...');

  let certCounter = 1000;

  const certificates = attendanceRecords
    .filter((a: any) => a.status === 'PRESENT')
    .map((attendance: any) => ({
      attendanceId: attendance._id,
      userId: attendance.userId,
      eventId: attendance.eventId,
      certificateId: `CERT-${new Date().getFullYear()}-${certCounter++}`,
      issuedAt: new Date(attendance.checkedInAt.getTime() + 3600000),
    }));

  const createdCertificates = await Certificate.insertMany(certificates);
  console.log(`✓ Created ${createdCertificates.length} certificates`);
  return createdCertificates;
};

const seedFeedback = async (attendanceRecords: any[]) => {
  console.log('\n⭐ Seeding feedback...');

  const feedbackData = [
    { rating: 5, review: 'Excellent event! Learned a lot and met great people.' },
    { rating: 5, review: 'Outstanding speakers and well-organized. Highly recommend!' },
    { rating: 4, review: 'Great content but the venue was a bit small.' },
    { rating: 4, review: 'Very informative session. Would attend again.' },
    { rating: 5, review: 'Best workshop I have attended this year!' },
    { rating: 3, review: 'Good event but could improve on time management.' },
    { rating: 4, review: 'Networking opportunities were fantastic.' },
    { rating: 5, review: 'Professional organization and engaging content.' },
  ];

  const feedback = attendanceRecords.slice(0, 8).map((attendance: any, index: number) => ({
    userId: attendance.userId,
    eventId: attendance.eventId,
    rating: feedbackData[index].rating,
    review: feedbackData[index].review,
  }));

  const createdFeedback = await Feedback.insertMany(feedback);
  console.log(`✓ Created ${createdFeedback.length} feedback entries`);
  return createdFeedback;
};

const seedNotifications = async (users: IUser[], events: IEvent[]) => {
  console.log('\n🔔 Seeding notifications...');

  const regularUsers = users.filter(u => u.email.includes('example.com'));

  const notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
  }> = [];

  regularUsers.slice(0, 4).forEach(user => {
    notifications.push({
      userId: user._id.toString(),
      title: 'Registration Confirmed',
      message: `Your registration for "${events[0].title}" has been confirmed. Check your email for details.`,
      type: 'REGISTRATION',
      read: Math.random() > 0.5,
    });
  });

  regularUsers.slice(0, 3).forEach(user => {
    notifications.push({
      userId: user._id.toString(),
      title: 'Event Reminder',
      message: `"${events[1].title}" is coming up in 3 days. Don't forget to bring your QR ticket!`,
      type: 'REMINDER',
      read: false,
    });
  });

  regularUsers.slice(0, 2).forEach(user => {
    notifications.push({
      userId: user._id.toString(),
      title: 'Certificate Ready',
      message: `Your certificate for "${events[6].title}" is now available for download.`,
      type: 'CERTIFICATE',
      read: Math.random() > 0.7,
    });
  });

  regularUsers.forEach(user => {
    notifications.push({
      userId: user._id.toString(),
      title: 'New Events Available',
      message: 'Check out our latest events in Technology and Business categories!',
      type: 'GENERAL',
      read: Math.random() > 0.3,
    });
  });

  const createdNotifications = await Notification.insertMany(notifications);
  console.log(`✓ Created ${createdNotifications.length} notifications`);
  return createdNotifications;
};

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('='.repeat(50));

    await connectDB();
    await clearDatabase();

    const roles = await seedRoles();
    const users = await seedUsers(roles);
    const events = await seedEvents(users);
    const registrations = await seedRegistrations(users, events);
    const attendance = await seedAttendance(registrations, users);
    const certificates = await seedCertificates(attendance);
    const feedback = await seedFeedback(attendance);
    await seedNotifications(users, events);

    console.log('\n' + '='.repeat(50));
    console.log('✨ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • ${roles.length} roles`);
    console.log(`   • ${users.length} users`);
    console.log(`   • ${events.length} events`);
    console.log(`   • ${registrations.length} registrations`);
    console.log(`   • ${attendance.length} attendance records`);
    console.log(`   • ${certificates.length} certificates`);
    console.log(`   • ${feedback.length} feedback entries`);
    console.log('\n📝 Demo Credentials:');
    console.log('   Admin:     admin@eventplatform.dev / password123');
    console.log('   Organizer: organizer@techevents.com / password123');
    console.log('   User:      john.doe@example.com / password123');
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
