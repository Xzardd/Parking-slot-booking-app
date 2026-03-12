import express from "express";
import cors from "cors";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient, Db, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 5000;
const JWT_SECRET = "parking-slot-booking-secret-key";

app.use(cors());
app.use(express.json());

let db: Db;

// Database Models Types
interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string;
}

interface ParkingLot {
  _id?: ObjectId;
  name: string;
  location: string;
  totalSlots: number;
}

interface Slot {
  _id?: ObjectId;
  parkingLotId: ObjectId;
  slotNumber: string;
  status: "available" | "booked";
}

interface Booking {
  _id?: ObjectId;
  userId: ObjectId;
  slotId: ObjectId;
  parkingLotId: ObjectId;
  slotNumber: string;
  parkingLotName: string;
  startTime: Date;
  endTime: Date;
  status: "active" | "completed" | "cancelled";
}

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: result.insertedId, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: result.insertedId, name, email } });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Parking Lots Routes
app.get("/api/parking-lots", async (req, res) => {
  try {
    const parkingLots = await db.collection("parkingLots").find().toArray();

    // Get available slots count for each parking lot
    const lotsWithAvailability = await Promise.all(
      parkingLots.map(async (lot) => {
        const availableSlots = await db
          .collection("slots")
          .countDocuments({ parkingLotId: lot._id, status: "available" });
        return {
          ...lot,
          availableSlots,
        };
      })
    );

    res.json(lotsWithAvailability);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/parking-lots/:id", async (req, res) => {
  try {
    const lot = await db
      .collection("parkingLots")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!lot) {
      return res.status(404).json({ error: "Parking lot not found" });
    }
    res.json(lot);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Slots Routes
app.get("/api/parking-lots/:id/slots", async (req, res) => {
  try {
    const slots = await db
      .collection("slots")
      .find({ parkingLotId: new ObjectId(req.params.id) })
      .toArray();
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Booking Routes
app.post("/api/bookings", authenticateToken, async (req: any, res) => {
  try {
    const { slotId, startTime, endTime } = req.body;
    const userId = req.user.userId;

    // Check if slot is available
    const slot = await db
      .collection("slots")
      .findOne({ _id: new ObjectId(slotId) });
    if (!slot) {
      return res.status(404).json({ error: "Slot not found" });
    }
    if (slot.status === "booked") {
      return res.status(400).json({ error: "Slot is already booked" });
    }

    // Get parking lot info
    const parkingLot = await db
      .collection("parkingLots")
      .findOne({ _id: slot.parkingLotId });

    // Create booking
    const booking = await db.collection("bookings").insertOne({
      userId: new ObjectId(userId),
      slotId: new ObjectId(slotId),
      parkingLotId: slot.parkingLotId,
      slotNumber: slot.slotNumber,
      parkingLotName: parkingLot?.name,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "active",
    });

    // Update slot status
    await db
      .collection("slots")
      .updateOne({ _id: new ObjectId(slotId) }, { $set: { status: "booked" } });

    res.json({
      id: booking.insertedId,
      slotNumber: slot.slotNumber,
      parkingLotName: parkingLot?.name,
      startTime,
      endTime,
      status: "active",
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/bookings", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.userId;
    const bookings = await db
      .collection("bookings")
      .find({ userId: new ObjectId(userId) })
      .sort({ startTime: -1 })
      .toArray();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/bookings/:id/cancel", authenticateToken, async (req: any, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.userId;

    const booking = await db
      .collection("bookings")
      .findOne({ _id: new ObjectId(bookingId), userId: new ObjectId(userId) });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Update booking status
    await db
      .collection("bookings")
      .updateOne(
        { _id: new ObjectId(bookingId) },
        { $set: { status: "cancelled" } }
      );

    // Free up the slot
    await db
      .collection("slots")
      .updateOne({ _id: booking.slotId }, { $set: { status: "available" } });

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Seed Data
async function seedDatabase() {
  // Check if data already exists
  const existingLots = await db.collection("parkingLots").countDocuments();
  if (existingLots > 0) {
    console.log("Database already seeded");
    return;
  }

  // Create parking lots
  const parkingLots = [
    {
      name: "Downtown Parking Plaza",
      location: "123 Main Street, Downtown",
      totalSlots: 20,
    },
    {
      name: "City Center Parking",
      location: "456 Central Avenue, City Center",
      totalSlots: 20,
    },
  ];

  const insertedLots = await db
    .collection("parkingLots")
    .insertMany(parkingLots);

  // Create slots for each parking lot
  const slots: Slot[] = [];
  const lotIds = Object.values(insertedLots.insertedIds);

  lotIds.forEach((lotId) => {
    const rows = ["A", "B", "C", "D"];
    let slotIndex = 0;
    for (const row of rows) {
      for (let i = 1; i <= 5; i++) {
        slots.push({
          parkingLotId: lotId,
          slotNumber: `${row}${i}`,
          status: "available",
        });
        slotIndex++;
      }
    }
  });

  await db.collection("slots").insertMany(slots);

  console.log("Database seeded with 2 parking lots and 40 slots");
}

// Start Server
async function startServer() {
  try {
    // Create MongoDB Memory Server
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    console.log("MongoDB Memory Server started at:", mongoUri);

    // Connect to MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db("parking-booking");

    console.log("Connected to MongoDB");

    // Seed database
    await seedDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
