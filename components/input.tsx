import { InputHTMLAttributes } from 'react';
import classNames from 'classnames';

type InputProps = React.PropsWithChildren<
  {
    label?: string;
    inputClassName?: InputHTMLAttributes<HTMLInputElement>['className'];
  } & InputHTMLAttributes<HTMLInputElement>
>;

const uuid = () => `${Math.random()}`.substring(2);

export const Input = (props: InputProps) => {
  const { label, inputClassName, className, children, ...inputProps } = props;
  const id = props.id || props.name || `input-${uuid()}`;
  return (
    <div className={classNames(className, 'formelement')}>
      {label && (
        <label htmlFor={id} className="block font-bold">
          {label}
        </label>
      )}
      <div className="relative">
        <input {...inputProps} className={`w-full border px-3 py-2 rounded ${props.inputClassName || ''}`} id={id} />
        {children}
      </div>
    </div>
  );
};
