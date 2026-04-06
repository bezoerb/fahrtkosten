import { DOMAttributes, useEffect, useState } from "react";
import { useLocation } from "../hooks/useLocation";
import { InputData, useAppContext } from "../lib/store";
import { ShadcnInput } from "./ui/shadcn-input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Crosshair, Search } from "lucide-react";

export const Form = (props) => {
  const { input, setInput } = useAppContext((state) => ({
    input: state.input,
    setInput: state.setInput,
  }));
  const [state, setState] = useState<Partial<InputData>>(input);
  const onChange = (event) => {
    let value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    if (event.target.type === "number") {
      value = parseFloat(value);
    }

    if (["twoWay"].includes(event.target.name)) {
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

  const onSubmit: DOMAttributes<HTMLFormElement>["onSubmit"] = (e) => {
    e.preventDefault();
    setInput({ start: state.start, dest: state.dest });
  };

  return (
    <form className={props.className} onSubmit={onSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="start">Start</Label>
          <div className="relative">
            <ShadcnInput
              id="start"
              placeholder="z.B. Hamburg Hbf"
              value={state.start}
              name="start"
              onChange={onChange}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Standort ermitteln"
              onClick={() => {
                getPosition();
              }}
            >
              <Crosshair className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dest">Ziel</Label>
          <ShadcnInput
            id="dest"
            placeholder="z.B. Berlin Hbf"
            value={state.dest}
            name="dest"
            onChange={onChange}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="twoWay"
              defaultChecked={input.twoWay}
              onCheckedChange={(checked) => {
                setInput({ twoWay: checked === true });
              }}
            />
            <Label
              htmlFor="twoWay"
              className="text-sm font-normal cursor-pointer"
            >
              Hin- und Rückfahrt
            </Label>
          </div>

          <Button type="submit" size="sm">
            <Search className="mr-2 h-4 w-4" />
            Suchen
          </Button>
        </div>
      </div>
    </form>
  );
};
