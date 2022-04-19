import { useStore } from '../lib/store';
import shallow from 'zustand/shallow';
import { Input } from './input';
import { Select } from './select';

export const Settings = (props) => {
  const { input, setInput } = useStore((state) => ({ input: state.input, setInput: state.setInput }), shallow);
  const onChange = (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(value);
    }
    setInput({ [event.target.name]: value });
  };

  return (
    <form className={props.className}>
      <Input label="Erwachsene" value={input.adults} min={0} type="number" name="adults" onChange={onChange} />
      <Input label="Kinder (bis 12 Jahre)" value={input.children} min={0} type="number" name="children" onChange={onChange} />
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
        name="fuelConsumption"
        onChange={onChange}
      />
    </form>
  );
};
