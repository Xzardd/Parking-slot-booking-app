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

    const parkingLot = await db.collection('parkinglots').findOne({
      _id: new ObjectId(id),
    });

    if (!parkingLot) {
      return NextResponse.json(
        { error: 'Parking lot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...parkingLot,
      _id: parkingLot._id.toString(),
    });
  } catch (error) {
    console.error('[v0] Error fetching parking lot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parking lot' },
      { status: 500 }
    );
  }
}
