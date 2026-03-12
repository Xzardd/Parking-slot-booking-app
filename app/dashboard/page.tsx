"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { fetchUserBookings, cancelBooking, Booking } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Empty } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, parseISO } from "date-fns";
import { Calendar, Clock, Car, X, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function BookingCard({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel?: (id: string) => void;
}) {
  const bookingDate = typeof booking.date === 'string' ? parseISO(booking.date) : new Date(booking.date);
  const isActive = booking.status === "active";
  const isCancelled = booking.status === "cancelled";

  return (
    <Card className={isCancelled ? "opacity-60" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-lg">{booking.slot?.slotNumber || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{booking.parkingLot?.name || "Unknown Location"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {format(bookingDate, "MMM d, yyyy")}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {booking.startTime} - {booking.endTime}
              </div>
              {booking.parkingLot?.address && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {booking.parkingLot.address}
                </div>
              )}
              {booking.totalAmount && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  ${booking.totalAmount}
                </div>
              )}
            </div>
            {booking.vehicleNumber && (
              <p className="text-sm text-muted-foreground">
                Vehicle: {booking.vehicleNumber}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={isActive ? "default" : isCancelled ? "outline" : "secondary"}
              className={isActive ? "bg-green-600" : ""}
            >
              {isActive ? "Active" : isCancelled ? "Cancelled" : "Completed"}
            </Badge>

            {isActive && onCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this booking for slot {booking.slot?.slotNumber}?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onCancel(booking._id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Cancel Booking
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: bookings,
    error,
    isLoading,
  } = useSWR(user ? "user-bookings" : null, fetchUserBookings);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
      mutate("user-bookings");
      mutate("parking-lots");
    } catch (error) {
      console.error("Failed to cancel booking:", error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-secondary flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const activeBookings = bookings?.filter((b) => b.status === "active") || [];
  const pastBookings = bookings?.filter((b) => b.status !== "active") || [];

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        {error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">Failed to load bookings. Please try again.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">
                Active Bookings ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <Empty
                      title="No Active Bookings"
                      description="You don't have any active parking bookings"
                    >
                      <Link href="/">
                        <Button>Book a Slot</Button>
                      </Link>
                    </Empty>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      onCancel={handleCancel}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <Empty
                      title="No Booking History"
                      description="Your completed and cancelled bookings will appear here"
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking._id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
