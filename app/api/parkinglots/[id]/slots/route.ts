import { NextResponse } from 'next/server';
import { getDb, ObjectId } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid parking lot ID' },
        { status: 400 }
      );
    }

    // Check for date query parameter to filter booked slots
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    const slots = await db
      .collection('slots')
      .find({ parkingLotId: new ObjectId(id) })
      .toArray();

    // If date is provided, check for bookings on that date
    let slotsWithBookingStatus = slots.map((slot) => ({
      ...slot,
      _id: slot._id.toString(),
      parkingLotId: slot.parkingLotId.toString(),
    }));

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await db
        .collection('bookings')
        .find({
          parkingLotId: new ObjectId(id),
          date: { $gte: startOfDay, $lte: endOfDay },
          status: 'active',
        })
        .toArray();

      const bookedSlotIds = new Set(bookings.map((b) => b.slotId.toString()));

      slotsWithBookingStatus = slotsWithBookingStatus.map((slot) => ({
        ...slot,
        isAvailable: !bookedSlotIds.has(slot._id),
      }));
    }

    return NextResponse.json(slotsWithBookingStatus);
  } catch (error) {
    console.error('[v0] Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 }
    );
  }
}
