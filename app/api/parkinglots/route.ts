import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const parkingLots = await db.collection('parkinglots').find({}).toArray();

    // Get available slots count for each parking lot
    const lotsWithAvailability = await Promise.all(
      parkingLots.map(async (lot) => {
        const availableSlots = await db.collection('slots').countDocuments({
          parkingLotId: lot._id,
          isAvailable: true,
        });
        return {
          ...lot,
          _id: lot._id.toString(),
          availableSlots,
        };
      })
    );

    return NextResponse.json(lotsWithAvailability);
  } catch (error) {
    console.error('[v0] Error fetching parking lots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parking lots' },
      { status: 500 }
    );
  }
}
