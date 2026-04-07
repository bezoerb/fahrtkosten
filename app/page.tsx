"use client";

import { useState } from "react";
import { Form } from "../components/form";
import { Map } from "../components/map";
import { Result } from "../components/result";
import { Settings } from "../components/settings";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../components/ui/dialog";
import { Settings as SettingsIcon, Car, MapPin } from "lucide-react";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight">
              Fahrtkostenrechner
            </h1>
          </div>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Einstellungen öffnen"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Einstellungen</DialogTitle>
                <DialogDescription>
                  Fahrzeug- und Reisedaten konfigurieren
                </DialogDescription>
              </DialogHeader>
              <Settings className="grid gap-4" />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Form + Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  Route
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form />
              </CardContent>
            </Card>

            <Result />
          </div>

          {/* Right Column: Map */}
          <Card className="overflow-hidden self-start">
            <Map className="w-full h-[70vw] lg:h-[500px]" />
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        <p>
          Preisdaten von{" "}
          <a
            href="https://creativecommons.tankerkoenig.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Tankerkönig
          </a>{" "}
          unter{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            CC BY 4.0
          </a>
        </p>
      </footer>
    </div>
  );
}
