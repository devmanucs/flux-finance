"use client";

import { Checkbox } from "@flux-finance/ui/components/ui/checkbox";
import { ColorPicker } from "@flux-finance/ui/components/ui/color-picker";
import { DatePicker } from "@flux-finance/ui/components/ui/date-picker";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldTitle,
} from "@flux-finance/ui/components/ui/field";
import { Input } from "@flux-finance/ui/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@flux-finance/ui/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@flux-finance/ui/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flux-finance/ui/components/ui/select";
import { Slider } from "@flux-finance/ui/components/ui/slider";
import { Switch } from "@flux-finance/ui/components/ui/switch";
import { Textarea } from "@flux-finance/ui/components/ui/textarea";
import { Toggle } from "@flux-finance/ui/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@flux-finance/ui/components/ui/toggle-group";
import { cn } from "@flux-finance/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentPropsWithRef, type MouseEvent, type ReactNode } from "react";
import { Control, Controller, FieldValues, Path, useFormContext } from "react-hook-form";
import { formatMoney, moneyFromInputDigits } from "@/lib/format-money";

const fieldFormSectionVariants = cva("rounded-lg p-4 md:p-5", {
  variants: {
    variant: {
      bordered: "border border-border/50",
      muted: "bg-muted/15",
      card: "bg-card",
      plain: "",
    },
  },
  defaultVariants: {
    variant: "bordered",
  },
});

const radioGroupLayoutVariants = cva("", {
  variants: {
    layout: {
      stack: "grid grid-cols-1 gap-2",
      "grid-2": "grid grid-cols-1 gap-2 sm:grid-cols-2",
      "grid-3": "grid grid-cols-1 gap-3 sm:grid-cols-3",
      inline: "flex flex-wrap gap-2",
    },
  },
  defaultVariants: {
    layout: "stack",
  },
});

const checkboxGroupLayoutVariants = cva("", {
  variants: {
    layout: {
      stack: "grid grid-cols-1 gap-2",
      "grid-2": "grid grid-cols-1 gap-2 sm:grid-cols-2",
      "grid-3": "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3",
    },
  },
  defaultVariants: {
    layout: "grid-3",
  },
});

const selectableCardOptionVariants = cva(
  "box-border flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-muted/30",
  {
    variants: {
      selected: {
        true: "border-primary/60 bg-primary/5",
        false: "border-border/60",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

const preventFocusScrollOnLabelMouseDown = (event: MouseEvent<HTMLLabelElement>) => {
  event.preventDefault();
};

const FieldFormSection = ({
  title,
  description,
  variant = "bordered",
  className,
  children,
}: {
  title?: string;
  description?: string;
  variant?: VariantProps<typeof fieldFormSectionVariants>["variant"];
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn(fieldFormSectionVariants({ variant }), className)}>
    {title ? (
      <FieldLegend variant="label" className="mb-4">
        {title}
      </FieldLegend>
    ) : null}
    {children}
    {description ? (
      <FieldDescription className="mt-4 border-t border-border/40 pt-3 text-xs">
        {description}
      </FieldDescription>
    ) : null}
  </div>
);

const FieldFormInput = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  showError = true,
  control,
  ...props
}: ComponentPropsWithRef<typeof Input> & {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  showError?: boolean;
  control?: Control<T>;
}) => {
  const form = useFormContext<T>();
  return (
    <Controller<T>
      name={name}
      control={control ?? form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <Input
            {...props}
            {...field}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
            autoComplete="off"
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormTextArea = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  showError = true,
  ...props
}: ComponentPropsWithRef<typeof Textarea> & {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  showError?: boolean;
}) => {
  const form = useFormContext<T>();
  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <Textarea
            {...props}
            {...field}
            value={field.value ?? ""}
            id={name}
            aria-invalid={fieldState.invalid}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormSelect = <T extends FieldValues = FieldValues, TOption = { value: string; label: string }>({
  name,
  label,
  options = [],
  fieldClassName,
  placeholder,
  showError = true,
  renderOption,
  itemToValue,
  itemToLabel,
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  options?: readonly TOption[];
  placeholder?: string;
  showError?: boolean;
  renderOption?: (option: TOption) => ReactNode;
  itemToValue?: (item: TOption) => string;
  itemToLabel?: (item: TOption) => string;
}) => {
  const form = useFormContext<T>();
  const getValue = itemToValue ?? ((item: TOption) => String((item as { value?: string })?.value ?? ""));
  const getLabel = itemToLabel ?? ((item: TOption) => String((item as { label?: string })?.label ?? ""));

  // Base UI Select.Value imprime o value cru por padrão; o mapeamento `items`
  // faz o trigger mostrar o label mascarado.
  const selectItems = options.map((option) => ({
    value: getValue(option),
    label: renderOption?.(option) ?? getLabel(option),
  }));

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <Select
            items={selectItems}
            value={field.value == null || field.value === "" ? null : String(field.value)}
            onValueChange={(value) => field.onChange(value ?? "")}
          >
            <SelectTrigger id={name} className="w-full">
              <SelectValue placeholder={placeholder || label} />
            </SelectTrigger>
            <SelectContent>
              {selectItems.map((item, idx) => (
                <SelectItem key={item.value || idx} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormNativeSelect = <T extends FieldValues = FieldValues, TOption = { value: string; label: string }>({
  name,
  label,
  options = [],
  fieldClassName,
  placeholder,
  showError = true,
  itemToValue,
  itemToLabel,
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  options?: readonly TOption[];
  placeholder?: string;
  showError?: boolean;
  itemToValue?: (item: TOption) => string;
  itemToLabel?: (item: TOption) => string;
}) => {
  const form = useFormContext<T>();
  const getValue = itemToValue ?? ((item: TOption) => String((item as { value?: string })?.value ?? ""));
  const getLabel = itemToLabel ?? ((item: TOption) => String((item as { label?: string })?.label ?? ""));

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <NativeSelect
            id={name}
            name={field.name}
            value={field.value ?? ""}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(event.target.value)}
            aria-invalid={fieldState.invalid}
          >
            {placeholder && <NativeSelectOption value="">{placeholder}</NativeSelectOption>}
            {options.map((option) => (
              <NativeSelectOption key={getValue(option)} value={getValue(option)}>
                {getLabel(option)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormCheckbox = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  showError = true,
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  showError?: boolean;
}) => {
  const form = useFormContext<T>();
  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field
          orientation="horizontal"
          className={cn("w-fit items-center gap-2", fieldClassName)}
          data-invalid={fieldState.invalid}
        >
          <Checkbox
            id={name}
            name={field.name}
            checked={field.value ?? false}
            onCheckedChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {label && (
            <FieldContent>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
            </FieldContent>
          )}
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormCheckboxGroup = <T extends FieldValues = FieldValues>({
  name,
  label,
  options = [],
  showError = true,
  optionsLayout = "grid-3",
}: {
  name: Path<T>;
  label?: string;
  options?: { value: string; label: string }[];
  showError?: boolean;
  optionsLayout?: "stack" | "grid-2" | "grid-3";
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? [];
        return (
          <Field className="gap-3" data-invalid={fieldState.invalid}>
            {label && (
              <FieldLabel className="text-xs font-medium text-muted-foreground">{label}</FieldLabel>
            )}
            <div className={checkboxGroupLayoutVariants({ layout: optionsLayout })}>
              {options.map((option) => {
                const checked = selected.includes(option.value);
                const optionId = `${name}-${option.value}`;
                return (
                  <FieldLabel
                    key={option.value}
                    htmlFor={optionId}
                    className="block w-full cursor-pointer font-normal"
                    onMouseDown={preventFocusScrollOnLabelMouseDown}
                  >
                    <div className={selectableCardOptionVariants({ selected: checked })}>
                      <Checkbox
                        id={optionId}
                        checked={checked}
                        onCheckedChange={(next) => {
                          field.onChange(
                            next === true
                              ? [...selected, option.value]
                              : selected.filter((value) => value !== option.value),
                          );
                        }}
                        aria-invalid={fieldState.invalid}
                      />
                      <span className="leading-snug">{option.label}</span>
                    </div>
                  </FieldLabel>
                );
              })}
            </div>
            {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

const FieldFormRadioGroup = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  options = [],
  showError = true,
  optionsLayout = "stack",
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  options?: { value: string; label: string }[];
  showError?: boolean;
  optionsLayout?: "stack" | "grid-2" | "grid-3" | "inline";
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn("gap-3", fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <RadioGroup
            name={field.name}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            className={radioGroupLayoutVariants({ layout: optionsLayout })}
          >
            {options.map((option) => {
              const optionId = `${name}-${option.value}`;
              return (
                <FieldLabel
                  key={option.value}
                  htmlFor={optionId}
                  onMouseDown={preventFocusScrollOnLabelMouseDown}
                >
                  <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                    <FieldContent>
                      <FieldTitle>{option.label}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem value={option.value} id={optionId} aria-invalid={fieldState.invalid} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormSwitch = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  showError = true,
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  showError?: boolean;
}) => {
  const form = useFormContext<T>();
  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid} className={fieldClassName}>
          {label && (
            <FieldContent>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
            </FieldContent>
          )}
          <Switch
            id={name}
            name={field.name}
            checked={field.value === true}
            onCheckedChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormToggle = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  showError = true,
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  showError?: boolean;
}) => {
  const form = useFormContext<T>();
  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid} className={fieldClassName}>
          {label && (
            <FieldContent>
              <FieldLabel htmlFor={name}>{label}</FieldLabel>
            </FieldContent>
          )}
          <Toggle
            id={name}
            name={field.name}
            pressed={field.value ?? false}
            onPressedChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

// A ToggleGroup do nosso design system (Base UI) só existe no formato
// "multiple" (value sempre é um array). Pra "single", emulamos aqui: o valor
// do form fica como string, e convertemos pra array de 0/1 posição na ida e
// na volta.
const FieldFormToggleGroup = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  options = [],
  showError = true,
  type = "multiple",
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  options?: { value: string; label: string }[];
  showError?: boolean;
  type?: "single" | "multiple";
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const groupValue: string[] =
          type === "single" ? (field.value ? [field.value] : []) : (field.value ?? []);

        return (
          <Field orientation="horizontal" data-invalid={fieldState.invalid} className={fieldClassName}>
            {label && (
              <FieldContent>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
              </FieldContent>
            )}
            <ToggleGroup
              value={groupValue}
              onValueChange={(values) => {
                field.onChange(type === "single" ? (values[values.length - 1] ?? "") : values);
              }}
            >
              {options.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value} id={`${name}-${option.value}`}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

const FieldFormSlider = <T extends FieldValues = FieldValues>({
  label,
  name,
  fieldClassName,
  showError = true,
  min = 0,
  max = 100,
}: {
  label?: string;
  fieldClassName?: string;
  name: Path<T>;
  showError?: boolean;
  min?: number;
  max?: number;
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <Slider
            id={name}
            name={field.name}
            min={min}
            max={max}
            value={typeof field.value === "number" ? field.value : min}
            onValueChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormDate = <T extends FieldValues = FieldValues>({
  name,
  label,
  fieldClassName,
  placeholder = "Selecionar data",
  showError = true,
}: {
  name: Path<T>;
  label?: string;
  fieldClassName?: string;
  placeholder?: string;
  showError?: boolean;
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <DatePicker
            id={name}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormColor = <T extends FieldValues = FieldValues>({
  name,
  label,
  fieldClassName,
  showError = true,
}: {
  name: Path<T>;
  label?: string;
  fieldClassName?: string;
  showError?: boolean;
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <ColorPicker
            id={name}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

const FieldFormMoney = <T extends FieldValues = FieldValues>({
  name,
  label,
  fieldClassName,
  placeholder = "R$ 0,00",
  showError = true,
  allowNegative = false,
}: {
  name: Path<T>;
  label?: string;
  fieldClassName?: string;
  placeholder?: string;
  showError?: boolean;
  allowNegative?: boolean;
}) => {
  const form = useFormContext<T>();

  return (
    <Controller<T>
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(fieldClassName)} data-invalid={fieldState.invalid}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <Input
            id={name}
            inputMode={allowNegative ? "text" : "numeric"}
            autoComplete="off"
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            value={formatMoney(typeof field.value === "number" ? field.value : Number(field.value) || 0)}
            onChange={(event) => field.onChange(moneyFromInputDigits(event.target.value, allowNegative))}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
          {showError && fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
};

export const FormFields = {
  Section: FieldFormSection,
  Input: FieldFormInput,
  Textarea: FieldFormTextArea,
  Select: FieldFormSelect,
  NativeSelect: FieldFormNativeSelect,
  Date: FieldFormDate,
  Color: FieldFormColor,
  Money: FieldFormMoney,
  Checkbox: FieldFormCheckbox,
  CheckboxGroup: FieldFormCheckboxGroup,
  RadioGroup: FieldFormRadioGroup,
  Switch: FieldFormSwitch,
  Toggle: FieldFormToggle,
  ToggleGroup: FieldFormToggleGroup,
  Slider: FieldFormSlider,
  // AsyncCombobox e ImageUpload: ver comentário no topo do arquivo.
};
