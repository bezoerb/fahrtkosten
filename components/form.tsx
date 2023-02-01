import { useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { useAppContext } from '../lib/store';
import { Input } from './input';

export const Form = (props) => {
  const { input, setInput } = useAppContext((state) => ({ input: state.input, setInput: state.setInput }));
  const onChange = (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(value);
    }

    console.log(`setInput({ ${event.target.name}: ${value} })`);
    setInput({ [event.target.name]: value });
  };

  const { getPosition, location } = useLocation();
  useEffect(() => {
    if (location.name) {
      setInput({ start: location.name });
    }
  }, [location.name, setInput]);

  const [enabled, setEnabled] = useState(true);

  return (
    <form className={props.className}>
      <Input label="Start" value={input.start} name="start" onChange={onChange} className="mb-3" inputClassName="pr-8">
        <button
          type="button"
          className="absolute right-2 top-2"
          aria-label="locate"
          onClick={() => {
            getPosition();
          }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <path d="M2 12h3m14 0h3M12 2v3m0 14v3" />
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="3" />
            </g>
          </svg>
        </button>
      </Input>
      <Input label="Ziel" value={input.dest} name="dest" onChange={onChange} className="mb-3" />
      <label className="block">
        <input type="checkbox" name="oneWay" onChange={onChange} defaultChecked={input.oneWay} />
        &nbsp;Einfache Fahrt?
      </label>
    </form>
  );
};
