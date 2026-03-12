"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { fetchParkingLot, fetchSlots, Slot } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ParkingSlotGrid } from "@/components/parking-slot-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, MapPin, DollarSign, Car } from "lucide-react";

export default function ParkingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const { data: parkingLot, error: lotError, isLoading: lotLoading } = useSWR(
    `parking-lot-${id}`,
    () => fetchParkingLot(id)
  );

  const { data: slots, error: slotsError, isLoading: slotsLoading } = useSWR(
    `slots-${id}`,
    () => fetchSlots(id)
  );

  const handleSlotSelect = (slot: Slot) => {
    if (selectedSlot?._id === slot._id) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleContinue = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (selectedSlot) {
      router.push(`/booking?slotId=${selectedSlot._id}&parkingLotId=${id}`);
    }
  };

  const isLoading = lotLoading || slotsLoading;
  const error = lotError || slotsError;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </main>
    );
  }

  if (error || !parkingLot) {
    return (
      <main className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <p className="text-destructive text-center py-12">
            Failed to load parking lot details. Please try again.
          </p>
          <div className="text-center">
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/")}
            className="mb-4 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{parkingLot.name}</h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {parkingLot.address}
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-background rounded-lg border">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">${parkingLot.pricePerHour}</p>
                <p className="text-xs text-muted-foreground">per hour</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold">{slots?.filter(s => s.isAvailable).length || 0}</p>
                <p className="text-xs text-muted-foreground">available</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Slot Grid */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Select a Parking Slot</CardTitle>
                <CardDescription>
                  Click on an available slot to select it for booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slots && (
                  <ParkingSlotGrid
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSlotSelect={handleSlotSelect}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div>
            <Card className="sticky top-24 shadow-sm">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSlot ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground">Selected Slot</p>
                      <p className="text-3xl font-bold text-primary">{selectedSlot.slotNumber}</p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{parkingLot.name}</p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground">Slot Type</p>
                      <p className="font-medium capitalize">{selectedSlot.type}</p>
                    </div>
                    <Button 
                      className="w-full gap-2 hover:scale-[1.02] transition-transform" 
                      size="lg"
                      onClick={handleContinue}
                    >
                      <Car className="w-4 h-4" />
                      {user ? "Continue to Booking" : "Login to Book"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Car className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Select a slot to proceed with booking</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
