"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from '@/components/date-time-picker';
import { Clock, Calendar } from 'lucide-react';

interface LogDoseDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onLogDose: (time: Date) => void;
  isInitialDose: boolean;
}

export function LogDoseDialog({
  isOpen,
  onOpenChange,
  onLogDose,
  isInitialDose,
}: LogDoseDialogProps) {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const pillCount = isInitialDose ? '2 pills' : '1 pill';
  const title = isInitialDose ? 'Start Your Session' : 'Log Your Dose';
  const description = `Confirm when you took your dose. ${isInitialDose ? "You'll start with 2 pills." : ""}`;

  const handleLogDose = (time: Date) => {
    onLogDose(time);
    onOpenChange(false);
    setShowTimePicker(false);
  };

  const handleNow = () => {
    handleLogDose(new Date());
  };

  const handleEarlier = () => {
    setShowTimePicker(true);
  };
  
  const handlePickerConfirm = () => {
    handleLogDose(selectedDate);
  }

  const handleClose = () => {
    onOpenChange(false);
    // Add a delay to allow the dialog to close before resetting state
    setTimeout(() => {
        setShowTimePicker(false);
        setSelectedDate(new Date());
    }, 300);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {showTimePicker ? (
          <div className="py-4 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Select the date and time you took {pillCount}.</p>
            <DateTimePicker date={selectedDate} setDate={setSelectedDate} />
          </div>
        ) : null}
        
        <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
            {!showTimePicker && (
                <Button variant="outline" onClick={handleEarlier}>
                    <Calendar className="mr-2 h-4 w-4" /> I took {pillCount} earlier
                </Button>
            )}
            
            {showTimePicker ? (
                 <Button onClick={handlePickerConfirm}>Confirm Time</Button>
            ) : (
                <Button onClick={handleNow}>
                    <Clock className="mr-2 h-4 w-4" /> I took {pillCount} now
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
