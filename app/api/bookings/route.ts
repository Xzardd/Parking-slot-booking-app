import { NextResponse } from 'next/server';
import { getDb, ObjectId } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'parking-app-secret-key-2024';

function getUserFromToken(request: Request): { userId: string; email: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();

    const bookings = await db
      .collection('bookings')
      .find({ userId: new ObjectId(user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich bookings with parking lot and slot details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const parkingLot = await db
          .collection('parkinglots')
          .findOne({ _id: booking.parkingLotId });
        const slot = await db
          .collection('slots')
          .findOne({ _id: booking.slotId });

        return {
          ...booking,
          _id: booking._id.toString(),
          userId: booking.userId.toString(),
          parkingLotId: booking.parkingLotId.toString(),
          slotId: booking.slotId.toString(),
          parkingLot: parkingLot
            ? {
                ...parkingLot,
                _id: parkingLot._id.toString(),
              }
            : null,
          slot: slot
            ? {
                ...slot,
                _id: slot._id.toString(),
                parkingLotId: slot.parkingLotId.toString(),
              }
            : null,
        };
      })
    );

    return NextResponse.json(enrichedBookings);
  } catch (error) {
    console.error('[v0] Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { parkingLotId, slotId, date, startTime, endTime, vehicleNumber } =
      await request.json();

    if (!parkingLotId || !slotId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Verify parking lot and slot exist
    const parkingLot = await db
      .collection('parkinglots')
      .findOne({ _id: new ObjectId(parkingLotId) });
    if (!parkingLot) {
      return NextResponse.json(
        { error: 'Parking lot not found' },
        { status: 404 }
      );
    }

    const slot = await db
      .collection('slots')
      .findOne({ _id: new ObjectId(slotId) });
    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    // Check for existing booking on this slot/date/time
    const bookingDate = new Date(date);
    const existingBooking = await db.collection('bookings').findOne({
      slotId: new ObjectId(slotId),
      date: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(bookingDate.setHours(23, 59, 59, 999)),
      },
      status: 'active',
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This slot is already booked for the selected time' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const hours =
      (parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0])) || 1;
    const totalAmount = hours * parkingLot.pricePerHour;

    // Create booking
    const booking = {
      _id: new ObjectId(),
      userId: new ObjectId(user.userId),
      parkingLotId: new ObjectId(parkingLotId),
      slotId: new ObjectId(slotId),
      date: new Date(date),
      startTime,
      endTime,
      vehicleNumber: vehicleNumber || '',
      totalAmount,
      status: 'active',
      createdAt: new Date(),
    };

    await db.collection('bookings').insertOne(booking);

    return NextResponse.json({
      ...booking,
      _id: booking._id.toString(),
      userId: booking.userId.toString(),
      parkingLotId: booking.parkingLotId.toString(),
      slotId: booking.slotId.toString(),
    });
  } catch (error) {
    console.error('[v0] Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
