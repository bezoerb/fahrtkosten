import { ChangeEventHandler } from 'react';
import classNames from 'classnames';

type Option = {
  value: string;
  label: string;
}

type SelectProps = {
  label: string;
  defaultValue: string | number;
  type?: string;
  className?: string;
  options: Option[];
  name: string;
  id?: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};

export const Select = (props: SelectProps) => {
  return (
    <div className={classNames(props.className, 'formelement')}>
      <label htmlFor={props.id || props.name} className="block font-bold">
        {props.label}
      </label>
      <select
        className="w-full border px-3 py-2 mb-3 rounded"
        id={props.id || props.name}
        name={props.name}
        title={props.label}
        defaultValue={props.defaultValue}
        onChange={props.onChange}
      >{props.options.map((option, index) => <option key={index} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
};
