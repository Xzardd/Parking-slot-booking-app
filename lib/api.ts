const API_URL = "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("parking-token");
  }
  return null;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface ParkingLot {
  _id: string;
  name: string;
  location: string;
  totalSlots: number;
  availableSlots: number;
}

export interface Slot {
  _id: string;
  parkingLotId: string;
  slotNumber: string;
  status: "available" | "booked";
}

export interface Booking {
  _id: string;
  userId: string;
  slotId: string;
  parkingLotId: string;
  slotNumber: string;
  parkingLotName: string;
  startTime: string;
  endTime: string;
  status: "active" | "completed" | "cancelled";
}

export async function fetchParkingLots(): Promise<ParkingLot[]> {
  const res = await fetch(`${API_URL}/parking-lots`);
  if (!res.ok) throw new Error("Failed to fetch parking lots");
  return res.json();
}

export async function fetchParkingLot(id: string): Promise<ParkingLot> {
  const res = await fetch(`${API_URL}/parking-lots/${id}`);
  if (!res.ok) throw new Error("Failed to fetch parking lot");
  return res.json();
}

export async function fetchSlots(parkingLotId: string): Promise<Slot[]> {
  const res = await fetch(`${API_URL}/parking-lots/${parkingLotId}/slots`);
  if (!res.ok) throw new Error("Failed to fetch slots");
  return res.json();
}

export async function createBooking(data: {
  slotId: string;
  startTime: string;
  endTime: string;
}): Promise<Booking> {
  const res = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create booking");
  }
  return res.json();
}

export async function fetchUserBookings(): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/bookings`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch bookings");
  return res.json();
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to cancel booking");
  }
}
