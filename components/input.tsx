import { ChangeEventHandler } from 'react';
import classNames from 'classnames';

type InputProps = {
  label: string;
  value: string | number;
  className?: string;
  type?: string;
  name: string;
  min?: number;
  max?: number;
  id?: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export const Input = (props: InputProps) => {
  return (
    <div className={classNames(props.className, 'formelement')}>
      <label htmlFor={props.id || props.name} className="block font-bold">
        {props.label}
      </label>
      <input
        min={props.min}
        max={props.max}
        className="w-full border px-3 py-2 rounded"
        id={props.id || props.name}
        type={props?.type ?? 'text'}
        name={props.name}
        value={props.value}
        onChange={props.onChange}
      />
    </div>
  );
};
