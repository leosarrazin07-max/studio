"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Dose } from "@/lib/types";
import { format } from "date-fns";
import { History, Pill } from "lucide-react";

interface DoseHistoryProps {
  doses: Dose[];
}

export function DoseHistory({ doses }: DoseHistoryProps) {
  const reversedDoses = [...doses].reverse();

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <History className="text-primary" />
          Dose History
        </CardTitle>
        <CardDescription>Your log for the last 90 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full pr-4">
          {reversedDoses.length > 0 ? (
            <div className="space-y-4">
              {reversedDoses.map((dose, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="font-medium">{format(new Date(dose.time), "EEEE, MMMM do")}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(dose.time), "p")}</p>
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <span>{dose.pills}</span>
                      <Pill size={16} />
                    </div>
                  </div>
                  {index < reversedDoses.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>No doses logged yet.</p>
              <p className="text-sm">Start your session to begin tracking.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
