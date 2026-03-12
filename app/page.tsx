"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetchParkingLots, ParkingLot } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MapPin, Car, ParkingCircle } from "lucide-react";

function ParkingLotCard({ lot }: { lot: ParkingLot }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{lot.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {lot.location}
            </CardDescription>
          </div>
          <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
            <ParkingCircle className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">{lot.totalSlots}</p>
              <p className="text-sm text-muted-foreground">Total Slots</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{lot.availableSlots}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </div>
        <Link href={`/parking/${lot._id}`}>
          <Button className="w-full gap-2">
            <Car className="w-4 h-4" />
            View Slots
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { data: parkingLots, error, isLoading } = useSWR("parking-lots", fetchParkingLots);

  return (
    <main className="min-h-screen bg-secondary">
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4 text-balance">Find Your Perfect Parking Spot</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto text-pretty">
            Book parking slots in advance and save time. Choose from multiple locations and reserve your spot with just a few clicks.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Available Parking Locations</h2>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load parking locations. Please make sure the backend server is running.</p>
          </div>
        )}

        {parkingLots && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {parkingLots.map((lot) => (
              <ParkingLotCard key={lot._id} lot={lot} />
            ))}
          </div>
        )}

        {parkingLots?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No parking locations available at the moment.</p>
          </div>
        )}
      </section>
    </main>
  );
}
