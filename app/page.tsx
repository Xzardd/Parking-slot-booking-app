"use client";

import useSWR from "swr";
import Link from "next/link";
import { fetchParkingLots, ParkingLot } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { 
  MapPin, 
  Car, 
  ParkingCircle, 
  Clock, 
  Shield, 
  Smartphone, 
  Zap,
  CheckCircle,
  LayoutGrid
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Real-time Slot Availability",
    description: "See available parking slots instantly with live updates"
  },
  {
    icon: Zap,
    title: "Quick Slot Booking",
    description: "Book your parking spot in just a few clicks"
  },
  {
    icon: Shield,
    title: "Secure Login System",
    description: "Your data is protected with secure authentication"
  },
  {
    icon: LayoutGrid,
    title: "Easy Parking Management",
    description: "Manage all your bookings from one dashboard"
  },
  {
    icon: CheckCircle,
    title: "Fast Booking Confirmation",
    description: "Get instant confirmation for your reservations"
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly Interface",
    description: "Access and book from any device, anywhere"
  }
];

function ParkingLotCard({ lot }: { lot: ParkingLot }) {
  return (
    <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{lot.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {lot.address}
            </CardDescription>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
            <ParkingCircle className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold">{lot.availableSlots}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">${lot.pricePerHour}</p>
              <p className="text-sm text-muted-foreground">Per Hour</p>
            </div>
          </div>
        </div>
        <Link href={`/parking/${lot._id}`}>
          <Button className="w-full gap-2 group-hover:bg-primary/90 transition-colors">
            <Car className="w-4 h-4" />
            View Slots
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Card className="group hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="pt-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
          <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
        </div>
        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { data: parkingLots, error, isLoading } = useSWR("parking-lots", fetchParkingLots);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 text-center relative">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Find Your Perfect Parking Spot
            </h1>
          </div>
          <p className="text-sm text-primary-foreground/60 mb-4">by farhan</p>
          <p className="text-lg opacity-90 max-w-2xl mx-auto text-pretty mb-8">
            Book parking slots in advance and save time. Choose from multiple locations and reserve your spot with just a few clicks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="#locations">
              <Button size="lg" variant="secondary" className="gap-2 hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
                Browse Locations
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:scale-105 transition-transform">
                <LayoutGrid className="w-5 h-5" />
                My Bookings
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Use ParkEasy?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience hassle-free parking with our modern booking system designed for your convenience.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Parking Locations Section */}
      <section id="locations" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-2">Available Parking Locations</h2>
        <p className="text-muted-foreground mb-8">Select a location to view available slots and book your spot</p>

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

      {/* Footer */}
      <footer className="bg-secondary py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">ParkEasy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Parking made simple. Book your spot today.
          </p>
        </div>
      </footer>
    </main>
  );
}
