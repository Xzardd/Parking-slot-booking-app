"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { fetchParkingLot, fetchSlots, createBooking, Slot } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel, FieldError } from "@/components/ui/field";
import { ArrowLeft, Clock, Calendar, CheckCircle, Car } from "lucide-react";
import { format, addHours } from "date-fns";

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const slotId = searchParams.get("slotId");
  const parkingLotId = searchParams.get("parkingLotId");

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(2);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    slotNumber: string;
    date: Date;
    startTime: string;
    endTime: string;
    totalAmount: number;
  } | null>(null);

  const { data: parkingLot } = useSWR(
    parkingLotId ? `parking-lot-${parkingLotId}` : null,
    () => fetchParkingLot(parkingLotId!)
  );

  const { data: slots } = useSWR(
    parkingLotId ? `slots-${parkingLotId}` : null,
    () => fetchSlots(parkingLotId!)
  );

  const selectedSlot = slots?.find((s) => s._id === slotId);

  useEffect(() => {
    // Set default date to today
    const today = new Date();
    setBookingDate(format(today, "yyyy-MM-dd"));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const calculateEndTime = (start: string, hours: number): string => {
    const [h, m] = start.split(":").map(Number);
    const endHour = (h + hours) % 24;
    return `${endHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const handleBooking = async () => {
    if (!slotId || !parkingLotId || !bookingDate || !startTime) return;

    setError("");
    setIsBooking(true);

    try {
      const endTime = calculateEndTime(startTime, duration);

      const booking = await createBooking({
        parkingLotId,
        slotId,
        date: bookingDate,
        startTime,
        endTime,
        vehicleNumber,
      });

      setBookingDetails({
        slotNumber: selectedSlot?.slotNumber || "",
        date: new Date(bookingDate),
        startTime,
        endTime,
        totalAmount: booking.totalAmount,
      });
      setSuccess(true);

      // Refresh slot data
      mutate(`slots-${parkingLotId}`);
      mutate("parking-lots");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-secondary flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </main>
    );
  }

  if (!slotId || !parkingLotId) {
    return (
      <main className="min-h-screen bg-secondary p-4">
        <div className="container mx-auto text-center py-12">
          <p className="text-destructive mb-4">Invalid booking request</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (success && bookingDetails) {
    return (
      <main className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription>Your parking slot has been successfully booked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slot Number</span>
                <span className="font-bold text-primary">{bookingDetails.slotNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{parkingLot?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {format(bookingDetails.date, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">
                  {bookingDetails.startTime} - {bookingDetails.endTime}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-bold text-lg">${bookingDetails.totalAmount}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full">View Bookings</Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">Back to Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const totalAmount = parkingLot ? parkingLot.pricePerHour * duration : 0;

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/parking/${parkingLotId}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to slot selection
          </Link>
          <h1 className="text-3xl font-bold">Confirm Your Booking</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
              <CardDescription>Select your preferred date and time</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="bookingDate">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </span>
                  </FieldLabel>
                  <Input
                    id="bookingDate"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="startTime">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Start Time
                    </span>
                  </FieldLabel>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="duration">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration (hours)
                    </span>
                  </FieldLabel>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    max={12}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="vehicleNumber">
                    <span className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle Number (optional)
                    </span>
                  </FieldLabel>
                  <Input
                    id="vehicleNumber"
                    type="text"
                    placeholder="e.g. ABC-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </Field>
                {error && <FieldError>{error}</FieldError>}
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slot Number</span>
                  <span className="font-bold text-primary text-xl">{selectedSlot?.slotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slot Type</span>
                  <span className="font-medium capitalize">{selectedSlot?.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{parkingLot?.name}</span>
                </div>
                {parkingLot?.address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right text-sm">{parkingLot.address}</span>
                  </div>
                )}
                {bookingDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {format(new Date(bookingDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}
                {startTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {startTime} - {calculateEndTime(startTime, duration)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{duration} hour{duration > 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">${parkingLot?.pricePerHour}/hour</span>
                </div>
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="font-medium">Total Amount</span>
                  <span className="font-bold text-xl text-primary">${totalAmount}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleBooking}
                disabled={isBooking || !bookingDate || !startTime}
              >
                {isBooking ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Confirming...
                  </>
                ) : (
                  `Pay $${totalAmount} & Confirm`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-secondary flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </main>
    }>
      <BookingContent />
    </Suspense>
  );
}
