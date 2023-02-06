import React, { FormHTMLAttributes, forwardRef } from 'react';
import { useAppContext } from '../lib/store';
import { Input } from './input';
import { Select } from './select';

interface SettingsProps {
  className: FormHTMLAttributes<HTMLFormElement>['className'];
}

export const Settings = forwardRef<HTMLFormElement, SettingsProps>((props, ref) => {
  const { input, setInput } = useAppContext((state) => ({ input: state.input, setInput: state.setInput }));
  const onChange = (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (event.target.type === 'number' && value) {
      value = parseFloat(value);
    }

    setInput({ [event.target.name]: value });
  };

  return (
    <form className={props.className} ref={ref}>
      <Input
        label="Erwachsene"
        inputMode="decimal"
        value={input.adults}
        min={0}
        type="number"
        name="adults"
        pattern="\\d*"
        onChange={onChange}
      />
      <Input
        label="Kinder (bis 12 Jahre)"
        inputMode="decimal"
        value={input.children}
        min={0}
        type="number"
        name="children"
        pattern="\\d*"
        onChange={onChange}
      />
      <Select
        label="Benzinart"
        defaultValue={input.fuelType}
        name="fuelType"
        onChange={onChange}
        options={[
          { value: 'e5', label: 'E5' },
          { value: 'e10', label: 'E10' },
          { value: 'diesel', label: 'Diesel' },
        ]}
      />
      <Input
        label="Verbrauch (in Liter)"
        value={input.fuelConsumption}
        type="number"
        pattern="\\d*"
        inputMode="decimal"
        name="fuelConsumption"
        min={1}
        onChange={onChange}
      />
    </form>
  );
});

Settings.displayName = 'Settings';
