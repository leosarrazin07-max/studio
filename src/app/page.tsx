"use client";

import { useState } from "react";
import { usePrepState } from "@/hooks/use-prep-state";
import { Button } from "@/components/ui/button";
import { LogDoseDialog } from "@/components/log-dose-dialog";
import { PrepDashboard } from "@/components/prep-dashboard";
import { Pill, Sun, Moon } from 'lucide-react';

export default function Home() {
  const prepState = usePrepState();
  const [isLogDoseOpen, setIsLogDoseOpen] = useState(false);

  const { sessionActive, startSession } = prepState;

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
        <div className="relative mb-8">
            <Pill className="text-primary" size={80} strokeWidth={1.5}/>
        </div>
      <h1 className="text-4xl md:text-5xl font-bold text-primary font-headline mb-4">
        Welcome to PrEPy
      </h1>
      <p className="max-w-md text-muted-foreground mb-8">
        Your smart companion for on-demand PrEP. Track your doses, stay protected, and manage your sessions with confidence.
      </p>
      <Button
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg"
        onClick={() => setIsLogDoseOpen(true)}
      >
        Start PrEP Session
      </Button>
      <LogDoseDialog
        isOpen={isLogDoseOpen}
        onOpenChange={setIsLogDoseOpen}
        onLogDose={startSession}
        isInitialDose={true}
      />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="text-primary" />
            <span className="font-bold text-lg font-headline">PrEPy</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="container mx-auto w-full max-w-md flex-1 py-8">
          {sessionActive ? <PrepDashboard {...prepState} /> : <WelcomeScreen />}
        </div>
      </main>
    </div>
  );
}
