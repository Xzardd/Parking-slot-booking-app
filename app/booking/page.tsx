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
import { ArrowLeft, MapPin, Clock, Calendar, CheckCircle } from "lucide-react";
import { format, addHours } from "date-fns";

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  
  const slotId = searchParams.get("slotId");
  const parkingLotId = searchParams.get("parkingLotId");

  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(2);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

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
    // Set default start time to current time (rounded to next hour)
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    setStartTime(format(now, "yyyy-MM-dd'T'HH:mm"));
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleBooking = async () => {
    if (!slotId || !startTime) return;

    setError("");
    setIsBooking(true);

    try {
      const startDate = new Date(startTime);
      const endDate = addHours(startDate, duration);

      const booking = await createBooking({
        slotId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      setBookingDetails({
        ...booking,
        startTime: startDate,
        endTime: endDate,
      });
      setSuccess(true);

      // Refresh slot data
      mutate(`slots-${parkingLotId}`);
      mutate("parking-lots");
    } catch (err: any) {
      setError(err.message);
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
                <span className="text-muted-foreground">Start Time</span>
                <span className="font-medium">
                  {format(bookingDetails.startTime, "MMM d, yyyy h:mm a")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-medium">
                  {format(bookingDetails.endTime, "MMM d, yyyy h:mm a")}
                </span>
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
              <CardDescription>Select your preferred time and duration</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="startTime">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Date & Time
                    </span>
                  </FieldLabel>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
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
                    max={24}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
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
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium">{parkingLot?.name}</span>
                </div>
                {parkingLot?.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right text-sm">{parkingLot.location}</span>
                  </div>
                )}
                {startTime && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Time</span>
                      <span className="font-medium">
                        {format(new Date(startTime), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Time</span>
                      <span className="font-medium">
                        {format(addHours(new Date(startTime), duration), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{duration} hour{duration > 1 ? "s" : ""}</span>
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleBooking}
                disabled={isBooking || !startTime}
              >
                {isBooking ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Booking"
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
