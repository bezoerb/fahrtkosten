import { useAppContext } from '../lib/store';
import { Input } from './input';

export const Form = (props) => {
  const { input, setInput } = useAppContext((state) => ({ input: state.input, setInput: state.setInput }));
  const onChange = (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (event.target.type === 'number') {
      value = parseFloat(value);
    }

    console.log(`setInput({ ${event.target.name}: ${value} })`)
    setInput({ [event.target.name]: value });
  };

  return (
    <form className={props.className}>
      <Input label="Start" value={input.start} name="start" onChange={onChange} className="mb-3" />
      <Input label="Ziel" value={input.dest} name="dest" onChange={onChange} className="mb-3" />
      <label className="block">
        <input type="checkbox" name="oneWay" onChange={onChange} defaultChecked={input.oneWay} />
        &nbsp;Einfache Fahrt?
      </label>
    </form>
  );
};
