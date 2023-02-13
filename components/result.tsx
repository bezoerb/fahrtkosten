import React from 'react';
import { useTravelCosts } from '../hooks/useTravelCosts';
import { colorCarFastest, colorCarShortest, colorTrain } from '../lib/constants';
import { Color } from './color';

const formatTime = (_minutes: number) => {
  const minutes = Math.round(_minutes || 0);
  const factorDay = 60 * 24;
  const factorHour = 60;
  const days = Math.floor(minutes / factorDay);
  const hours = Math.floor(minutes / factorHour);

  if (days) {
    return `${days} Tag${days !== 1 ? 'e' : ''} ${formatTime(minutes - days * factorDay)}`.trim();
  }

  if (hours) {
    return `${hours} Stunde${hours !== 1 ? 'n' : ''} ${formatTime(minutes - hours * factorHour)}`.trim();
  }

  return minutes ? `${minutes} Minute${minutes !== 1 ? 'n' : ''}` : '';
};

const formatDistance = (distance: number) =>
  new Intl.NumberFormat('de-DE', { style: 'unit', unit: 'kilometer', maximumFractionDigits: 2 }).format(distance);

const formatPrice = (price: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);

const ResultComponent = (props) => {
  const result = useTravelCosts();

  const cheapest = Math.min(
    result?.hvv?.duration ? result?.hvv?.price : Infinity,
    result?.carShortest?.price ?? Infinity,
    result?.carFastest?.price ?? Infinity,
    result?.db?.price ?? Infinity
  );

  return (
    <div className={props.className}>
      {Boolean(result?.ready) && (
        <>
          <div className="mb-8">
            <b>Von:</b> {result.start.name}
            <br />
            <b>nach:</b> {result.dest.name}
          </div>

          {Boolean(result?.db?.duration) && (
            <span className={result?.db?.price === cheapest ? 'text-green-700' : ''}>
              <h3 className="font-bold text-lg mb-0.5">Deutsche Bahn</h3>
              <div className="mb-6">
                <span className="font-semibold">Günstigster Preis:</span>{' '}
                {result?.db?.price ? formatPrice(result.db.price) : '-'}
                <br />
                <span className="font-semibold">Dauer (eine fahrt): </span> {formatTime(result?.db?.duration)}
                <br />
                <span className="font-semibold">Umstiege: </span> {result.db.changes}
              </div>
            </span>
          )}

          {Boolean(result?.hvv?.duration) && (
            <span className={result?.hvv?.price === cheapest ? 'text-green-700' : ''}>
              <h3 className="font-bold text-lg mb-0.5">HVV</h3>
              <div className="mb-6">
                <span className="font-semibold">Preis:</span> {result?.hvv?.price ? formatPrice(result.hvv.price) : '-'}
                <br />
                <span className="font-semibold">Dauer (eine fahrt): </span> {formatTime(result?.hvv?.duration)}
                <br />
                <span className="font-semibold">Tickets:</span>
                {result?.hvv?.tickets?.map((ticket, index) => (
                  <div key={index} className="flex items-stretch">
                    {' '}
                    - {ticket?.tariffKindLabel}{' '}
                    <a
                      href={ticket.shopLinkRegular}
                      title="buy online"
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 flex items-center"
                    >
                      <svg
                        aria-hidden="true"
                        className="text-red-700 w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </span>
          )}
          {result?.carShortest?.distance !== result?.carFastest?.distance && (
            <>
              <span className={result?.carShortest?.price === cheapest ? 'text-green-700' : ''}>
                <h3 className="font-bold text-lg mb-0.5">
                  Auto{' '}
                  <small>
                    <i className="font-normal text-sm">({result.fuelPrice} €/l)</i>
                  </small>
                </h3>
                <h4 className="font-semibold mt-2 mb-0.5">Kürzeste Route</h4>
                <span className="font-semibold">Preis:</span> {formatPrice(result?.carShortest?.price)}
                <br />
                <span className="font-semibold">Dauer (eine fahrt): </span> {formatTime(result?.carShortest?.duration)}
                <br />
                <span className="font-semibold">Entfernung (eine fahrt):</span>{' '}
                {formatDistance(result?.carShortest?.distance)} <br />
              </span>
              <span className={result?.carFastest?.price === cheapest ? 'text-green-700' : ''}>
                <br />
                <h4 className="font-semibold mt-2 mb-0.5">Schnellste Route</h4>
                <span className="font-semibold">Preis:</span> {formatPrice(result?.carFastest?.price)}
                <br />
                <span className="font-semibold">Dauer (eine fahrt): </span> {formatTime(result?.carFastest?.duration)}
                <br />
                <span className="font-semibold">Entfernung (eine fahrt):</span>{' '}
                {formatDistance(result?.carFastest?.distance)} <br />
              </span>
            </>
          )}
          {result?.carShortest?.distance == result?.carFastest?.distance && (
            <span className={result?.carShortest?.price === cheapest ? 'text-green-700' : ''}>
              <h3 className="font-bold text-lg  mb-0.5">
                Auto{' '}
                <small>
                  <i className="font-normal text-sm">({result.fuelPrice} €/l)</i>
                </small>
              </h3>
              <span className="font-semibold">Preis:</span> {formatPrice(result?.carShortest?.price)}
              <br />
              <span className="font-semibold">Dauer (eine fahrt): </span> {formatTime(result?.carShortest?.duration)}
              <br />
              <span className="font-semibold">Entfernung (eine fahrt):</span>{' '}
              {formatDistance(result?.carShortest?.distance)} <br />
            </span>
          )}
        </>
      )}
    </div>
  );
};

export const Result = React.memo(ResultComponent);
