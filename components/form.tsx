import { DOMAttributes, useEffect, useState } from 'react';
import { useLocation } from '../hooks/useLocation';
import { InputData, useAppContext } from '../lib/store';
import { Input } from './input';

export const Form = (props) => {
  const { input, setInput } = useAppContext((state) => ({ input: state.input, setInput: state.setInput }));
  const [state, setState] = useState<Partial<InputData>>(input);
  const onChange = (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(value);
    }

    if (['twoWay'].includes(event.target.name)) {
      setInput({ [event.target.name]: value });
    } else {
      setState((state) => ({ ...state, [event.target.name]: value }));
    }
  };

  const { getPosition, location } = useLocation();

  useEffect(() => {
    setState(input);
  }, [input]);

  useEffect(() => {
    if (location.name) {
      setState((state) => ({ ...state, start: location.name }));
      setInput({ start: location.name });
    }
  }, [location.name, setInput]);

  const onSubmit: DOMAttributes<HTMLFormElement>['onSubmit'] = (e) => {
    e.preventDefault();
    setInput({ start: state.start, dest: state.dest });
  };

  return (
    <form className={props.className} onSubmit={onSubmit}>
      <Input label="Start" value={state.start} name="start" onChange={onChange} className="mb-3" inputClassName="pr-8">
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
      <Input label="Ziel" value={state.dest} name="dest" onChange={onChange} className="mb-3" />
      <label className="block">
        <input type="checkbox" name="twoWay" onChange={onChange} defaultChecked={input.twoWay} />
        &nbsp;Hin- und Rückfahrt?
      </label>
      <button
        type="submit"
        className="ml-auto block px-4 py-2 font-semibold text-sm bg-sky-500 text-white rounded-none shadow-sm"
      >
        Suchen
      </button>
    </form>
  );
};
