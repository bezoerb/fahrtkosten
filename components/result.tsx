import React from "react";
import { useTravelCosts } from "../hooks/useTravelCosts";
import {
  colorCarFastest,
  colorCarShortest,
  colorTrain,
} from "../lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Color } from "./color";
import { Train, Car, ShoppingCart, ArrowRightLeft } from "lucide-react";

const formatTime = (_minutes: number) => {
  const minutes = Math.round(_minutes || 0);
  const factorDay = 60 * 24;
  const factorHour = 60;
  const days = Math.floor(minutes / factorDay);
  const hours = Math.floor(minutes / factorHour);

  if (days) {
    return `${days} Tag${days !== 1 ? "e" : ""} ${formatTime(minutes - days * factorDay)}`.trim();
  }

  if (hours) {
    return `${hours} Stunde${hours !== 1 ? "n" : ""} ${formatTime(minutes - hours * factorHour)}`.trim();
  }

  return minutes ? `${minutes} Minute${minutes !== 1 ? "n" : ""}` : "";
};

const formatDistance = (distance: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "unit",
    unit: "kilometer",
    maximumFractionDigits: 2,
  }).format(distance);

const formatPrice = (price: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    price,
  );

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm py-1">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const ResultComponent = (props) => {
  const result = useTravelCosts();

  if (!result?.ready) return null;

  const cheapest = Math.min(
    result?.hvv?.duration ? result?.hvv?.price : Infinity,
    result?.carShortest?.price ?? Infinity,
    result?.carFastest?.price ?? Infinity,
    result?.db?.price ?? Infinity,
  );

  return (
    <div className={props.className}>
      {/* Route Info */}
      <Card className="mb-4">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{result.start.name}</span>
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{result.dest.name}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Deutsche Bahn */}
        {Boolean(result?.db?.duration) && (
          <Card
            className={
              result?.db?.price === cheapest ? "ring-2 ring-emerald-500/50" : ""
            }
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Train className="h-4 w-4" />
                  Deutsche Bahn
                </CardTitle>
                <div className="flex items-center gap-2">
                  {result?.db?.price === cheapest && (
                    <Badge variant="success">Günstigste</Badge>
                  )}
                  <span className="text-lg font-bold">
                    {result?.db?.price ? formatPrice(result.db.price) : "-"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="divide-y">
                <InfoRow
                  label="Dauer (einfach)"
                  value={formatTime(result?.db?.duration)}
                />
                <InfoRow label="Umstiege" value={String(result.db.changes)} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* HVV */}
        {Boolean(result?.hvv?.duration) && (
          <Card
            className={
              result?.hvv?.price === cheapest
                ? "ring-2 ring-emerald-500/50"
                : ""
            }
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Train className="h-4 w-4" />
                  HVV
                </CardTitle>
                <div className="flex items-center gap-2">
                  {result?.hvv?.price === cheapest && (
                    <Badge variant="success">Günstigste</Badge>
                  )}
                  <span className="text-lg font-bold">
                    {result?.hvv?.price ? formatPrice(result.hvv.price) : "-"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="divide-y">
                <InfoRow
                  label="Dauer (einfach)"
                  value={formatTime(result?.hvv?.duration)}
                />
              </div>
              {result?.hvv?.tickets?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Tickets</p>
                  <div className="space-y-1">
                    {result.hvv.tickets.map((ticket, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {ticket?.tariffKindLabel}
                        </span>
                        {ticket.shopLinkRegular && (
                          <a
                            href={ticket.shopLinkRegular}
                            title="Online kaufen"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Kaufen
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Auto */}
        {Boolean(result?.carShortest?.duration) && (
          <Card
            className={
              result?.carShortest?.price === cheapest ||
              result?.carFastest?.price === cheapest
                ? "ring-2 ring-emerald-500/50"
                : ""
            }
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4" />
                  Auto
                  <span className="text-xs font-normal text-muted-foreground">
                    ({result.fuelPrice} €/l)
                  </span>
                </CardTitle>
                {result?.carShortest?.distance ===
                  result?.carFastest?.distance && (
                  <div className="flex items-center gap-2">
                    {result?.carShortest?.price === cheapest && (
                      <Badge variant="success">Günstigste</Badge>
                    )}
                    <span className="text-lg font-bold">
                      {formatPrice(result?.carShortest?.price)}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {result?.carShortest?.distance !==
              result?.carFastest?.distance ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Color color={colorCarShortest} />
                      Kürzeste
                    </p>
                    <div className="space-y-1">
                      <InfoRow
                        label="Preis"
                        value={formatPrice(result?.carShortest?.price)}
                      />
                      <InfoRow
                        label="Dauer"
                        value={formatTime(result?.carShortest?.duration)}
                      />
                      <InfoRow
                        label="Strecke"
                        value={formatDistance(result?.carShortest?.distance)}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Color color={colorCarFastest} />
                      Schnellste
                    </p>
                    <div className="space-y-1">
                      <InfoRow
                        label="Preis"
                        value={formatPrice(result?.carFastest?.price)}
                      />
                      <InfoRow
                        label="Dauer"
                        value={formatTime(result?.carFastest?.duration)}
                      />
                      <InfoRow
                        label="Strecke"
                        value={formatDistance(result?.carFastest?.distance)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  <InfoRow
                    label="Dauer (einfach)"
                    value={formatTime(result?.carShortest?.duration)}
                  />
                  <InfoRow
                    label="Entfernung (einfach)"
                    value={formatDistance(result?.carShortest?.distance)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export const Result = React.memo(ResultComponent);
