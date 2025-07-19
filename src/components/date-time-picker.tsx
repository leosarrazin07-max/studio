"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, setHours, setMinutes, subDays } from 'date-fns';

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  
  const handleHourChange = (hour: string) => {
    setDate(setHours(date, parseInt(hour)));
  };

  const handleMinuteChange = (minute: string) => {
    setDate(setMinutes(date, parseInt(minute)));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && setDate(d)}
            initialFocus
            disabled={(day) => day > new Date() || day < subDays(new Date(), 5)}
          />
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2">
        <Select onValueChange={handleHourChange} defaultValue={date.getHours().toString().padStart(2, '0')}>
            <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(hour => (
                    <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                ))}
            </SelectContent>
        </Select>
        <Select onValueChange={handleMinuteChange} defaultValue={(Math.floor(date.getMinutes()/15)*15).toString().padStart(2, '0')}>
            <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="00">00</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="45">45</SelectItem>
            </SelectContent>
        </Select>
      </div>
    </div>
  );
}
