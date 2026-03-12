import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db, ObjectId } from 'mongodb';

let mongoServer: MongoMemoryServer | null = null;
let client: MongoClient | null = null;
let db: Db | null = null;
let isSeeded = false;

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  console.log('[v0] Starting MongoDB Memory Server...');
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  console.log('[v0] MongoDB Memory Server started at:', uri);

  client = new MongoClient(uri);
  await client.connect();
  db = client.db('parking');
  console.log('[v0] Connected to database');

  // Seed data if not already seeded
  if (!isSeeded) {
    await seedDatabase(db);
    isSeeded = true;
  }

  return db;
}

async function seedDatabase(database: Db) {
  console.log('[v0] Seeding database...');

  // Check if data already exists
  const existingLots = await database.collection('parkinglots').countDocuments();
  if (existingLots > 0) {
    console.log('[v0] Database already seeded');
    return;
  }

  // Create parking lots
  const parkingLots = [
    {
      _id: new ObjectId(),
      name: 'Downtown Parking Complex',
      address: '123 Main Street, Downtown',
      city: 'New York',
      totalSlots: 20,
      pricePerHour: 5,
      openTime: '06:00',
      closeTime: '23:00',
      amenities: ['CCTV', 'Security Guard', 'EV Charging', 'Covered Parking'],
      createdAt: new Date(),
    },
    {
      _id: new ObjectId(),
      name: 'Airport Terminal Parking',
      address: '456 Airport Road, Terminal 1',
      city: 'New York',
      totalSlots: 20,
      pricePerHour: 8,
      openTime: '00:00',
      closeTime: '23:59',
      amenities: ['24/7 Access', 'CCTV', 'Shuttle Service', 'Valet Parking'],
      createdAt: new Date(),
    },
  ];

  await database.collection('parkinglots').insertMany(parkingLots);
  console.log('[v0] Created 2 parking lots');

  // Create slots for each parking lot
  const slots: Array<{
    _id: ObjectId;
    parkingLotId: ObjectId;
    slotNumber: string;
    floor: number;
    type: string;
    isAvailable: boolean;
    createdAt: Date;
  }> = [];

  for (const lot of parkingLots) {
    for (let i = 1; i <= 20; i++) {
      slots.push({
        _id: new ObjectId(),
        parkingLotId: lot._id,
        slotNumber: `${String.fromCharCode(65 + Math.floor((i - 1) / 5))}${((i - 1) % 5) + 1}`,
        floor: Math.ceil(i / 10),
        type: i <= 16 ? 'standard' : i <= 18 ? 'compact' : 'handicap',
        isAvailable: true,
        createdAt: new Date(),
      });
    }
  }

  await database.collection('slots').insertMany(slots);
  console.log('[v0] Created 40 parking slots (20 per lot)');

  // Create indexes
  await database.collection('users').createIndex({ email: 1 }, { unique: true });
  await database.collection('slots').createIndex({ parkingLotId: 1 });
  await database.collection('bookings').createIndex({ odIduserId: 1 });
  await database.collection('bookings').createIndex({ slotId: 1 });

  console.log('[v0] Database seeding complete!');
}

export { ObjectId };
