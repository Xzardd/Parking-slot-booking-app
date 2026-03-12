"use client";

import { Slot } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Car } from "lucide-react";

interface ParkingSlotGridProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSlotSelect: (slot: Slot) => void;
}

export function ParkingSlotGrid({ slots, selectedSlot, onSlotSelect }: ParkingSlotGridProps) {
  // Group slots by row (first character of slot number)
  const groupedSlots: Record<string, Slot[]> = {};
  slots.forEach((slot) => {
    const row = slot.slotNumber.charAt(0);
    if (!groupedSlots[row]) {
      groupedSlots[row] = [];
    }
    groupedSlots[row].push(slot);
  });

  // Sort rows alphabetically
  const sortedRows = Object.keys(groupedSlots).sort();

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-6 justify-center p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--slot-available)]" />
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--slot-selected)]" />
          <span className="text-sm">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[var(--slot-booked)]" />
          <span className="text-sm">Booked</span>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="bg-card rounded-lg border p-6">
        <div className="space-y-4">
          {sortedRows.map((row) => (
            <div key={row} className="flex items-center gap-4">
              <span className="w-8 text-center font-bold text-muted-foreground">{row}</span>
              <div className="flex flex-wrap gap-2">
                {groupedSlots[row]
                  .sort((a, b) => {
                    const numA = parseInt(a.slotNumber.slice(1));
                    const numB = parseInt(b.slotNumber.slice(1));
                    return numA - numB;
                  })
                  .map((slot) => {
                    const isSelected = selectedSlot?._id === slot._id;
                    const isBooked = slot.status === "booked";

                    return (
                      <button
                        key={slot._id}
                        onClick={() => !isBooked && onSlotSelect(slot)}
                        disabled={isBooked}
                        className={cn(
                          "w-14 h-14 rounded-lg flex flex-col items-center justify-center transition-all",
                          "text-sm font-medium",
                          isBooked && "bg-[var(--slot-booked)] text-white cursor-not-allowed",
                          !isBooked && !isSelected && "bg-[var(--slot-available)] hover:bg-[var(--slot-available)]/80 text-foreground cursor-pointer",
                          isSelected && "bg-[var(--slot-selected)] text-white ring-2 ring-offset-2 ring-[var(--slot-selected)]"
                        )}
                        title={isBooked ? "This slot is booked" : `Select slot ${slot.slotNumber}`}
                      >
                        <Car className="w-4 h-4 mb-0.5" />
                        <span className="text-xs">{slot.slotNumber}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
