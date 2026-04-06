import React, { FormHTMLAttributes } from "react";
import { useAppContext } from "../lib/store";
import { ShadcnInput } from "./ui/shadcn-input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface SettingsProps {
  className: FormHTMLAttributes<HTMLFormElement>["className"];
}

export const Settings = (props: SettingsProps) => {
  const { input, setInput } = useAppContext((state) => ({
    input: state.input,
    setInput: state.setInput,
  }));
  const onChange = (event) => {
    let value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    if (event.target.type === "number" && value) {
      value = parseFloat(value);
    }

    setInput({ [event.target.name]: value });
  };

  return (
    <form className={props.className}>
      <div className="space-y-2">
        <Label htmlFor="adults">Erwachsene</Label>
        <ShadcnInput
          id="adults"
          inputMode="decimal"
          value={input.adults}
          min={0}
          type="number"
          name="adults"
          pattern="\\d*"
          onChange={onChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="children">Kinder (bis 12 Jahre)</Label>
        <ShadcnInput
          id="children"
          inputMode="decimal"
          value={input.children}
          min={0}
          type="number"
          name="children"
          pattern="\\d*"
          onChange={onChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fuelType">Benzinart</Label>
        <Select
          defaultValue={String(input.fuelType)}
          onValueChange={(value) => setInput({ fuelType: value as any })}
        >
          <SelectTrigger id="fuelType">
            <SelectValue placeholder="Benzinart wählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="e5">E5</SelectItem>
            <SelectItem value="e10">E10</SelectItem>
            <SelectItem value="diesel">Diesel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fuelConsumption">Verbrauch (Liter / 100km)</Label>
        <ShadcnInput
          id="fuelConsumption"
          value={input.fuelConsumption}
          type="number"
          pattern="\\d*"
          inputMode="decimal"
          name="fuelConsumption"
          min={1}
          onChange={onChange}
        />
      </div>
    </form>
  );
};
