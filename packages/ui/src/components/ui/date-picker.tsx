"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { ptBR as dateFnsPtBR } from "date-fns/locale"
import { ptBR as dayPickerPtBR } from "react-day-picker/locale"
import { Calendar03Icon } from "@hugeicons/core-free-icons"

import { cn } from "@flux-finance/ui/lib/utils"
import { Button } from "@flux-finance/ui/components/ui/button"
import { Calendar } from "@flux-finance/ui/components/ui/calendar"
import { Icon } from "@flux-finance/ui/components/ui/icon"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@flux-finance/ui/components/ui/popover"

function parseDateValue(value: string | null | undefined) {
  if (!value) return undefined
  const parsed = parse(value, "yyyy-MM-dd", new Date())
  return isValid(parsed) ? parsed : undefined
}

function formatDateValue(date: Date | undefined) {
  return date && isValid(date) ? format(date, "yyyy-MM-dd") : ""
}

function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecionar data",
  className,
  "aria-invalid": ariaInvalid,
}: {
  id?: string
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-invalid"?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseDateValue(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start font-normal", className)}
            aria-invalid={ariaInvalid}
          />
        }
      >
        <Icon icon={Calendar03Icon} data-icon="inline-start" />
        {selected ? (
          format(selected, "dd MMM yyyy", { locale: dateFnsPtBR })
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={dayPickerPtBR}
          selected={selected}
          onSelect={(date) => {
            onChange(formatDateValue(date))
            setOpen(false)
          }}
          defaultMonth={selected}
        />
        {selected ? (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Limpar
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, formatDateValue, parseDateValue }
