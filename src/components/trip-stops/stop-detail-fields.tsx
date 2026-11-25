import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";
import { cn } from "cn";
import { sectionLabel } from "@/components/ui/button-styles";
import { CaretDownIcon } from "@/components/ui/icons/caret-icons";
import { LinkIcon } from "@/components/ui/icons/planner-icons";
import type { StopDetails } from "@/types/trip-api";
import { reservationLabel, reservationTone, stopInput } from "./styles";

const textInputs = {
  category: { placeholder: "Restaurant, sight…", maxLength: 255 },
  type: { placeholder: "French, waterfall…", maxLength: 255 },
  details: { placeholder: "Dinner only, known for ramen…", maxLength: 10000 },
  notes: {
    placeholder: "Tips, things to avoid…",
    maxLength: 10000,
  },
  url: { type: "url", placeholder: "Add link", maxLength: 2048 },
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
    if (field === "reservations") {
      const value = details.reservations ?? "";
      // TODO: segmented Not needed / Needed / Booked control on phones.
      return (
        <span
          className={cn(
            "relative inline-flex items-center rounded-full before:pointer-events-none before:absolute before:left-3 before:size-2 before:rounded-full",
            reservationTone[value],
          )}
        >
          <Field.Control
            render={<select />}
            disabled={disabled}
            value={value}
            onValueChange={(value) =>
              onChange({
                reservations:
                  value === "needs_reservation" || value === "booked"
                    ? value
                    : null,
              })
            }
            className="min-h-9 cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pr-9 pl-7 text-sm font-semibold outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {Object.entries(reservationLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Field.Control>
          <CaretDownIcon
            aria-hidden="true"
            className="pointer-events-none absolute right-3 size-4 fill-none stroke-current"
          />
        </span>
      );
    }

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
          <Field.Description className="mt-1 px-3 text-xs text-neutral-400">
            Per visit / night
          </Field.Description>
        </>
      );

    if (field === "url")
      return (
        <span className="relative flex items-center">
          <LinkIcon
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-3 size-4",
              details.url ? "text-blue-500" : "text-neutral-400",
            )}
          />
          <Input
            {...control}
            {...textInputs.url}
            className={cn(stopInput, "pl-9", details.url && "text-blue-600!")}
            value={details.url}
            onValueChange={(url) => onChange({ url })}
          />
        </span>
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
      <Field.Label className={cn(sectionLabel, "mb-2 block md:sr-only")}>
        {label}
      </Field.Label>
      {renderControl()}
    </Field.Root>
  );
}
