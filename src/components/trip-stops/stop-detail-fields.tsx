import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import type { StopDetails } from "@/types/trip-api";
import { stopInput } from "./styles";

const textInputs = {
  category: { placeholder: "Restaurant, sight…", maxLength: 255 },
  type: { placeholder: "French, waterfall…", maxLength: 255 },
  details: { placeholder: "Dinner only, known for ramen…", maxLength: 10000 },
  notes: {
    placeholder: "Tips, instructions, things to avoid…",
    maxLength: 10000,
  },
  url: { type: "url", placeholder: "https://…", maxLength: 2048 },
};

type Props = {
  field: keyof StopDetails;
  label: string;
  details: StopDetails;
  disabled: boolean;
  onChange: (patch: Partial<StopDetails>) => void;
};

export function StopDetailField({
  field,
  label,
  details,
  disabled,
  onChange,
}: Props) {
  const control = { className: stopInput, disabled };

  function renderControl() {
    if (field === "reservations")
      return (
        <Field.Control
          {...control}
          render={<select />}
          value={details.reservations ?? ""}
          onValueChange={(value) =>
            onChange({
              reservations:
                value === "needs_reservation" || value === "booked"
                  ? value
                  : null,
            })
          }
        >
          <option value="">Not needed</option>
          <option value="needs_reservation">Needs reservation</option>
          <option value="booked">Booked</option>
        </Field.Control>
      );

    if (field === "price")
      return (
        <>
          <Input
            {...control}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={details.price ?? ""}
            placeholder="—"
            onValueChange={(value) =>
              onChange({ price: value === "" ? null : Number(value) })
            }
          />
          <Field.Description className="mt-2 text-xs text-neutral-400">
            Per visit / night
          </Field.Description>
        </>
      );

    return (
      <Input
        {...control}
        {...textInputs[field]}
        value={details[field]}
        onValueChange={(value) => onChange({ [field]: value })}
      />
    );
  }

  return (
    <Field.Root>
      <Field.Label className="mb-1.5 block text-xs font-medium text-neutral-500 md:sr-only">
        {label}
      </Field.Label>
      {renderControl()}
    </Field.Root>
  );
}
