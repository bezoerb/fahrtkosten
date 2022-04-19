import { useTravelCosts } from '../hooks/useTravelCosts';

export const Result = (props) => {
  const result = useTravelCosts();

  return (
    <div className={props.className}>
      {Boolean(result?.ready) && (
        <>
          <div className="mb-8">
            <b>Von</b> {result.start}
            <br />
            <b>nach</b> {result.dest}
          </div>
          <h3 className="font-bold text-lg">HVV</h3>
          {Boolean(result?.hvv?.duration) && (
            <div className="mb-6">
              <b>Preis:</b> {result?.hvv?.price ? `${result.hvv.price} €` : '-'}
              <br />
              <b>Dauer (eine fahrt): </b> {Math.round(result?.hvv?.duration)} min <br />
              <b>Tickets:</b>
              {result?.hvv?.tickets.map((ticket, index) => (
                <div key={index}> - {ticket.tariffKindLabel}</div>
              ))}
              <br />
            </div>
          )}
          {!Boolean(result?.hvv?.duration) && <div className="mb-6">unavailable</div>}
          {result?.carShortest?.distance !== result?.carFastest?.distance && (
            <>
              <h3 className="font-bold text-lg">Auto</h3>
              <h4 className="font-bold mb-2">kürzeste Strecke</h4>
              <b>Preis:</b> {Math.round(result?.carShortest?.price * 100) / 100} € <br />
              <b>Dauer (eine fahrt): </b> {Math.round(result?.carShortest?.duration)} min <br />
              <b>Entfernung (eine fahrt):</b> {Math.round(result?.carShortest?.distance * 100) / 100} km <br />
              <br />
              <h4 className="font-bold mb-2">schnellste Strecke</h4>
              <b>Preis:</b> {Math.round(result?.carFastest?.price * 100) / 100} € <br />
              <b>Dauer (eine fahrt): </b> {Math.round(result?.carFastest?.duration)} min <br />
              <b>Entfernung (eine fahrt):</b> {Math.round(result?.carFastest?.distance * 100) / 100} km <br />
            </>
          )}
          {result?.carShortest?.distance == result?.carFastest?.distance && (
            <>
              <h3 className="font-bold text-lg">Auto</h3>
              <b>Preis:</b> {Math.round(result?.carShortest?.price * 100) / 100} €{' '}
              <small>
                <i>({result.fuelPrice} €/l)</i>
              </small>
              <br />
              <b>Dauer (eine fahrt): </b> {Math.round(result?.carShortest?.duration)} min <br />
              <b>Entfernung (eine fahrt):</b> {Math.round(result?.carShortest?.distance * 100) / 100} km <br />
            </>
          )}
        </>
      )}
    </div>
  );
};
