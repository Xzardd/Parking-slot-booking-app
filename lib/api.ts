const API_URL = "/api";

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
  address: string;
  city: string;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
}

export interface Slot {
  _id: string;
  parkingLotId: string;
  slotNumber: string;
  floor: number;
  type: string;
  isAvailable: boolean;
}

export interface Booking {
  _id: string;
  userId: string;
  slotId: string;
  parkingLotId: string;
  date: string;
  startTime: string;
  endTime: string;
  vehicleNumber: string;
  totalAmount: number;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
  parkingLot?: ParkingLot;
  slot?: Slot;
}

export async function fetchParkingLots(): Promise<ParkingLot[]> {
  const res = await fetch(`${API_URL}/parkinglots`);
  if (!res.ok) throw new Error("Failed to fetch parking lots");
  return res.json();
}

export async function fetchParkingLot(id: string): Promise<ParkingLot> {
  const res = await fetch(`${API_URL}/parkinglots/${id}`);
  if (!res.ok) throw new Error("Failed to fetch parking lot");
  return res.json();
}

export async function fetchSlots(parkingLotId: string, date?: string): Promise<Slot[]> {
  const url = date 
    ? `${API_URL}/parkinglots/${parkingLotId}/slots?date=${date}`
    : `${API_URL}/parkinglots/${parkingLotId}/slots`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch slots");
  return res.json();
}

export async function createBooking(data: {
  parkingLotId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  vehicleNumber?: string;
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
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to cancel booking");
  }
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to login");
  }
  return res.json();
}

export async function signup(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to signup");
  }
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to get user");
  }
  return res.json();
}
