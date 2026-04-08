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
import { FuelPrice } from "./map";
import { Train, Car, ShoppingCart, ArrowRightLeft } from "lucide-react";

const formatTime = (_minutes: number = 0) => {
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

const formatTimeShort = (_minutes: number = 0) => {
  const minutes = Math.round(_minutes || 0);
  if (minutes < 45) return `${minutes} min`;
  const halfHours = Math.round(minutes / 30) / 2;
  return halfHours % 1 === 0 ? `${halfHours} Stunden` : `${halfHours.toLocaleString('de-DE')} Stunden`;
};

const formatDistance = (distance: number = 0) =>
  new Intl.NumberFormat("de-DE", {
    style: "unit",
    unit: "kilometer",
    maximumFractionDigits: 2,
  }).format(distance);

const formatPrice = (price: number = 0) =>
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
  );

  return (
    <div className={props.className}>
      {/* Route Info */}
      <Card className="mb-4">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{result.start?.name}</span>
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">{result.dest?.name}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Deutsche Bahn */}
        {Boolean(result?.db?.journeys?.length) && (() => {
          const journeys = result.db!.journeys;
          const minPrice = Math.min(...journeys.map(j => j.price));
          const maxPrice = Math.max(...journeys.map(j => j.price));
          const minDuration = Math.min(...journeys.map(j => j.duration));
          const maxDuration = Math.max(...journeys.map(j => j.duration));
          const minChanges = Math.min(...journeys.map(j => j.changes));
          const maxChanges = Math.max(...journeys.map(j => j.changes));
          const hasRange = minPrice !== maxPrice || minDuration !== maxDuration;

          return (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Train className="h-4 w-4" />
                    Deutsche Bahn
                    <span className="text-xs font-normal text-muted-foreground">
                      ({journeys.length} Verbindungen)
                    </span>
                  </CardTitle>
                  <span className="text-lg font-bold whitespace-nowrap">
                    {hasRange
                      ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
                      : formatPrice(minPrice)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="divide-y">
                  <InfoRow
                    label="Dauer"
                    value={
                      minDuration !== maxDuration
                        ? `${formatTimeShort(minDuration)} – ${formatTimeShort(maxDuration)}`
                        : formatTimeShort(minDuration)
                    }
                  />
                  <InfoRow
                    label="Umstiege"
                    value={
                      minChanges !== maxChanges
                        ? `${minChanges} – ${maxChanges}`
                        : String(minChanges)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          );
        })()}

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
              {(result?.hvv?.tickets?.length ?? 0) > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-medium mb-2">Tickets</p>
                  <div className="space-y-1">
                    {result.hvv?.tickets.map((ticket, index) => (
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
                    {result.fuelPrice != null && (<>(<FuelPrice price={result.fuelPrice} suffix={"\u2009€/l"} />)</>)}
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
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground block">
                          Preis
                        </span>
                        <span className="font-medium">
                          {formatPrice(result?.carShortest?.price)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground block">
                          Dauer
                        </span>
                        <span className="font-medium">
                          {formatTime(result?.carShortest?.duration)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground block">
                          Strecke
                        </span>
                        <span className="font-medium">
                          {formatDistance(result?.carShortest?.distance)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <Color color={colorCarFastest} />
                      Schnellste
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground block">
                          Preis
                        </span>
                        <span className="font-medium">
                          {formatPrice(result?.carFastest?.price)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground block">
                          Dauer
                        </span>
                        <span className="font-medium">
                          {formatTime(result?.carFastest?.duration)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground block">
                          Strecke
                        </span>
                        <span className="font-medium">
                          {formatDistance(result?.carShortest?.distance)}
                        </span>
                      </div>
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
